#!/usr/bin/env node
/**
 * GWS Platform V2 — Production Server (Node.js)
 * Serves pre-rendered Next.js HTML + API data from JSON files
 * Robust, synchronous request handling for stability
 */

// ── Process signal handlers ──
process.on('exit', (code) => { console.error(`[PROCESS] Exit code=${code} at ${new Date().toISOString()}`); });
process.on('SIGTERM', () => { console.error(`[PROCESS] SIGTERM at ${new Date().toISOString()}`); process.exit(0); });
process.on('SIGINT', () => { console.error(`[PROCESS] SIGINT at ${new Date().toISOString()}`); process.exit(0); });
process.on('SIGHUP', () => { console.error(`[PROCESS] SIGHUP at ${new Date().toISOString()}`); });
process.on('uncaughtException', (e) => { console.error(`[PROCESS] Uncaught: ${e.message}\n${e.stack}`); });
process.on('unhandledRejection', (e) => { console.error(`[PROCESS] Unhandled rejection: ${e}`); });

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = __dirname;
const SRV_DIR = path.join(BASE, '.next', 'server', 'app');
const STAT_DIR = path.join(BASE, '.next', 'static');
const PUB_DIR = path.join(BASE, 'public');
const API_DIR = path.join(BASE, 'api-data');
const PORT = parseInt(process.env.PORT || '3000', 10);

// ── Load API data synchronously at startup ──
const API = {};
try {
  fs.readdirSync(API_DIR).filter(f => f.endsWith('.json')).forEach(f => {
    try { API[f.replace('.json', '')] = JSON.parse(fs.readFileSync(path.join(API_DIR, f), 'utf8')); }
    catch (e) { console.error(`Error loading ${f}:`, e.message); }
  });
} catch (e) { console.error('API dir error:', e.message); }
console.log(`GWS Platform V2 — ${Object.keys(API).length} API endpoints loaded`);

// ── MIME types ──
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.map': 'application/json',
  '.webp': 'image/webp',
};
function mime(p) { return MIME[path.extname(p).toLowerCase()] || 'application/octet-stream'; }

// ── File cache ──
const FC = new Map();
function readCached(fp, cache) {
  if (cache && FC.has(fp)) return FC.get(fp);
  const d = fs.readFileSync(fp);
  if (cache && FC.size < 300) FC.set(fp, d);
  return d;
}

// ── Helpers ──
function exists(p) { try { return fs.existsSync(p) && fs.statSync(p).isFile(); } catch { return false; } }

function sendJSON(res, data, status) {
  status = status || 200;
  const body = Buffer.from(JSON.stringify(data, (k, v) => typeof v === 'bigint' ? v.toString() : v));
  res.writeHead(status, {
    'Content-Type': 'application/json', 'Content-Length': body.length,
    'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*',
    'Connection': 'close',
  });
  res.end(body);
}

function sendFile(res, fp, ct, cache) {
  try {
    const data = readCached(fp, cache);
    res.writeHead(200, {
      'Content-Type': ct, 'Content-Length': data.length,
      'Cache-Control': cache ? 'public, max-age=86400' : 'no-cache',
      'Connection': 'close',
    });
    res.end(data);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'text/plain', 'Connection': 'close' });
    res.end('Not found');
  }
}

// ── Detail map builder ──
function detailMap() {
  return {
    clients: API.clients || [], projects: API.projects || [],
    approvals: (API.approvals || {}).approvals || [],
    invoices: (API.finance || {}).invoices || [],
    documents: (API.documents || {}).documents || [],
    communications: (API.communications || {}).communications || [],
  };
}

// ── Body reading (sync-style using Buffer) ──
function readBodySync(req) {
  // For most API requests, body is small enough to read synchronously
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); }
      catch { resolve({}); }
    });
    // Timeout fallback
    setTimeout(() => resolve({}), 3000);
  });
}

// ── Request handler ──
async function handle(req, res) {
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch {
    res.writeHead(400); return res.end();
  }
  const p = url.pathname;
  const m = req.method;

  // CORS
  if (m === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Content-Length': '0',
    });
    return res.end();
  }

  // ── API GET ──
  if (m === 'GET' && p.startsWith('/api/')) {
    const pts = p.slice(1).split('/');
    // Detail endpoint
    if (pts.length >= 3) {
      const ep = pts[1];
      let id; try { id = parseInt(pts[2]); } catch { return sendJSON(res, { error: 'Invalid ID' }, 404); }
      const item = (detailMap()[ep] || []).find(i => i.id === id);
      return item ? sendJSON(res, item) : sendJSON(res, { error: 'Not found' }, 404);
    }
    // List endpoint
    const ep = pts[1];
    return API[ep] ? sendJSON(res, API[ep]) : sendJSON(res, { error: 'Not found' }, 404);
  }

  // ── API POST ──
  if (m === 'POST' && p.startsWith('/api/')) {
    // Drain the request body to prevent connection issues
    req.resume();
    if (p.includes('/bulk')) {
      // For export, return data immediately
      const ep = p.split('/')[2];
      return sendJSON(res, { data: API[ep] || [], message: 'Bulk action completed' });
    }
    return sendJSON(res, { message: 'Created' }, 201);
  }

  // ── API PATCH ──
  if (m === 'PATCH' && p.startsWith('/api/')) {
    req.resume();
    const pts = p.slice(1).split('/');
    if (pts.length >= 3) {
      const ep = pts[1];
      let id; try { id = parseInt(pts[2]); } catch { return sendJSON(res, { message: 'Updated' }); }
      const item = (detailMap()[ep] || []).find(i => i.id === id);
      if (item) return sendJSON(res, { ...item });
    }
    return sendJSON(res, { message: 'Updated' });
  }

  // ── API DELETE ──
  if (m === 'DELETE' && p.startsWith('/api/')) {
    req.resume();
    return sendJSON(res, { message: 'Deleted' });
  }

  // ── Static files ──
  if (m === 'GET') {
    if (p === '/' || p === '') return sendFile(res, path.join(SRV_DIR, 'index.html'), 'text/html; charset=utf-8');

    if (p.startsWith('/_next/static/')) {
      const fp = path.join(STAT_DIR, p.slice('/_next/static/'.length));
      if (exists(fp)) return sendFile(res, fp, mime(fp), true);
    }

    if (p.startsWith('/_next/image')) { res.writeHead(404); return res.end(); }

    if (p.startsWith('/_next/')) {
      const rel = p.slice('/_next/'.length);
      let fp = path.join(SRV_DIR, '_next', rel);
      if (exists(fp)) return sendFile(res, fp, mime(fp));
      fp = path.join(STAT_DIR, rel);
      if (exists(fp)) return sendFile(res, fp, mime(fp), true);
    }

    if (['/favicon.ico', '/logo.svg', '/robots.txt'].includes(p)) {
      const fp = path.join(PUB_DIR, p.slice(1));
      if (exists(fp)) return sendFile(res, fp, mime(fp));
    }

    // SPA fallback
    return sendFile(res, path.join(SRV_DIR, 'index.html'), 'text/html; charset=utf-8');
  }

  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method not allowed');
}

// ── Create server with error handling ──
const server = http.createServer((req, res) => {
  handle(req, res).catch(err => {
    console.error('Request error:', err.message);
    try { res.writeHead(500); res.end('Server Error'); } catch {}
  });
});

server.keepAliveTimeout = 1;  // Close connections immediately after response
server.headersTimeout = 2000;
server.requestTimeout = 10000;
server.maxRequestsPerSocket = 1;  // Only one request per socket, then close

server.listen(PORT, '0.0.0.0', () => {
  console.log(`GWS Platform V2 running on http://0.0.0.0:${PORT}`);
});
