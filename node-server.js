#!/usr/bin/env node
/**
 * GWS Platform V2 — Node.js Production Server
 * Serves pre-rendered Next.js HTML + API data from JSON files
 * Much more stable than Python http.server for concurrent connections
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;
const SERVER_DIR = path.join(BASE_DIR, '.next', 'server', 'app');
const STATIC_DIR = path.join(BASE_DIR, '.next', 'static');
const PUBLIC_DIR = path.join(BASE_DIR, 'public');
const API_DATA_DIR = path.join(BASE_DIR, 'api-data');
const PORT = parseInt(process.env.PORT || '3000', 10);

// ── Load API data ──
const apiCache = {};
if (fs.existsSync(API_DATA_DIR)) {
  for (const f of fs.readdirSync(API_DATA_DIR).filter(f => f.endsWith('.json'))) {
    try {
      apiCache[f.replace('.json', '')] = JSON.parse(fs.readFileSync(path.join(API_DATA_DIR, f), 'utf8'));
    } catch (e) {
      console.error(`Error loading ${f}: ${e.message}`);
    }
  }
}
console.log(`GWS Platform V2 — ${Object.keys(apiCache).length} API endpoints loaded`);

// ── MIME types ──
const MIMES = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon',
  '.map': 'application/json', '.webp': 'image/webp',
};

function getMime(p) { return MIMES[path.extname(p).toLowerCase()] || 'application/octet-stream'; }

// ── File cache for static assets ──
const fileCache = new Map();
const MAX_CACHE = 300;

function readFileCached(filePath, cache = false) {
  if (cache && fileCache.has(filePath)) return fileCache.get(filePath);
  const data = fs.readFileSync(filePath);
  if (cache && fileCache.size < MAX_CACHE) fileCache.set(filePath, data);
  return data;
}

// ── Response helpers ──
function sendJson(res, data, status = 200) {
  const body = Buffer.from(JSON.stringify(data, (k, v) => typeof v === 'bigint' ? v.toString() : v));
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': body.length,
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function sendFile(res, filePath, contentType, cache = false) {
  try {
    const data = readFileCached(filePath, cache);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': data.length,
      'Cache-Control': cache ? 'public, max-age=86400' : 'no-cache',
    });
    res.end(data);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

function sendError(res, status, msg) {
  res.writeHead(status, { 'Content-Type': 'text/plain' });
  res.end(msg || 'Error');
}

// ── Read request body ──
function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { resolve({}); }
    });
  });
}

// ── Data maps for detail endpoints ──
function getDetailMap() {
  return {
    clients: apiCache.clients || [],
    projects: apiCache.projects || [],
    approvals: (apiCache.approvals || {}).approvals || [],
    invoices: (apiCache.finance || {}).invoices || [],
    documents: (apiCache.documents || {}).documents || [],
    communications: (apiCache.communications || {}).communications || [],
  };
}

// ── Request handler ──
async function handleRequest(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname;
    const method = req.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Content-Length': '0',
      });
      return res.end();
    }

    // ── API GET ──
    if (method === 'GET' && p.startsWith('/api/')) {
      const parts = p.slice(1).split('/');
      // Detail endpoint: /api/clients/1
      if (parts.length >= 3) {
        const ep = parts[1];
        let itemId;
        try { itemId = parseInt(parts[2]); } catch { return sendJson(res, { error: 'Invalid ID' }, 404); }
        const dm = getDetailMap();
        const items = dm[ep] || [];
        const item = items.find(i => i.id === itemId);
        return item ? sendJson(res, item) : sendJson(res, { error: 'Not found' }, 404);
      }
      // List endpoint: /api/dashboard, /api/clients, etc.
      const ep = parts[1];
      return apiCache[ep] ? sendJson(res, apiCache[ep]) : sendJson(res, { error: `Endpoint '${ep}' not found` }, 404);
    }

    // ── API POST ──
    if (method === 'POST' && p.startsWith('/api/')) {
      const bj = await readBody(req);
      if (p.includes('/bulk')) {
        if (bj.action === 'export') {
          const ep = p.split('/')[2];
          return sendJson(res, { data: apiCache[ep] || [] });
        }
        return sendJson(res, { message: `Bulk ${bj.action || 'action'} completed`, data: [] });
      }
      return sendJson(res, { message: 'Created', data: bj }, 201);
    }

    // ── API PATCH ──
    if (method === 'PATCH' && p.startsWith('/api/')) {
      const bj = await readBody(req);
      const parts = p.slice(1).split('/');
      if (parts.length >= 3) {
        const ep = parts[1];
        let itemId;
        try { itemId = parseInt(parts[2]); } catch { return sendJson(res, { error: 'Invalid ID' }, 404); }
        const dm = getDetailMap();
        const items = dm[ep] || [];
        const item = items.find(i => i.id === itemId);
        if (item) return sendJson(res, { ...item, ...bj });
      }
      return sendJson(res, { message: 'Updated (mock)' });
    }

    // ── API DELETE ──
    if (method === 'DELETE' && p.startsWith('/api/')) {
      return sendJson(res, { message: 'Deleted (mock)' });
    }

    // ── Static file serving ──
    if (method === 'GET') {
      // Root page
      if (p === '/' || p === '') {
        return sendFile(res, path.join(SERVER_DIR, 'index.html'), 'text/html; charset=utf-8');
      }

      // _next/static/* — cached
      if (p.startsWith('/_next/static/')) {
        const fp = path.join(STATIC_DIR, p.slice('/_next/static/'.length));
        if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
          return sendFile(res, fp, getMime(fp), true);
        }
      }

      // _next/image — skip
      if (p.startsWith('/_next/image')) {
        return sendError(res, 404, 'Not found');
      }

      // Other _next/* paths
      if (p.startsWith('/_next/')) {
        const rel = p.slice('/_next/'.length);
        // Try server dir first
        let fp = path.join(SERVER_DIR, '_next', rel);
        if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
          return sendFile(res, fp, getMime(fp));
        }
        // Try static dir
        fp = path.join(STATIC_DIR, rel);
        if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
          return sendFile(res, fp, getMime(fp), true);
        }
      }

      // Public files
      if (['/favicon.ico', '/logo.svg', '/robots.txt'].includes(p)) {
        const fp = path.join(PUBLIC_DIR, p.slice(1));
        if (fs.existsSync(fp)) return sendFile(res, fp, getMime(fp));
      }

      // SPA fallback
      return sendFile(res, path.join(SERVER_DIR, 'index.html'), 'text/html; charset=utf-8');
    }

    sendError(res, 405, 'Method not allowed');
  } catch (e) {
    console.error('Request error:', e.message);
    try { sendError(res, 500, 'Server Error'); } catch {}
  }
}

// ── Start server ──
const server = http.createServer(handleRequest);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`GWS Platform V2 running on http://0.0.0.0:${PORT}`);
});
