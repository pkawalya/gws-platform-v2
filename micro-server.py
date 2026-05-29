#!/usr/bin/env python3
"""
GWS Platform V2 — Lightweight Python Server
Serves pre-rendered Next.js HTML + API data with minimal PIDs
Single-threaded stdlib HTTP server
"""
import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

# ── Configuration ──
BASE_DIR = Path(__file__).parent
NEXT_DIR = BASE_DIR / ".next"
SERVER_DIR = NEXT_DIR / "server" / "app"
STATIC_DIR = NEXT_DIR / "static"
PUBLIC_DIR = BASE_DIR / "public"
API_DATA_DIR = BASE_DIR / "api-data"
PORT = int(os.environ.get("PORT", 3000))

# ── Load API data ──
api_cache = {}
if API_DATA_DIR.exists():
    for f in API_DATA_DIR.glob("*.json"):
        try:
            with open(f) as fh:
                api_cache[f.stem] = json.load(fh)
        except:
            pass

print(f"GWS Platform V2 — Micro Server | {len(api_cache)} API endpoints loaded")

# ── MIME types ──
MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".webp": "image/webp",
    ".map": "application/json",
    ".xml": "application/xml",
    ".txt": "text/plain",
}

def get_mime(path: str) -> str:
    ext = Path(path).suffix.lower()
    return MIME_TYPES.get(ext, "application/octet-stream")

# ── Cache for static files ──
file_cache = {}
MAX_CACHE_SIZE = 200  # Max number of files to cache

def read_file(path: Path):
    """Read file with simple caching"""
    key = str(path)
    if key in file_cache:
        return file_cache[key]
    try:
        data = path.read_bytes()
        if len(file_cache) < MAX_CACHE_SIZE:
            file_cache[key] = data
        return data
    except:
        return None

class GWSHandler(BaseHTTPRequestHandler):
    """Minimal HTTP handler for GWS Platform"""
    
    def log_message(self, format, *args):
        pass  # Suppress logs for performance
    
    def do_GET(self):
        path = urlparse(self.path).path
        
        # Root page
        if path == "/" or path == "":
            self.serve_file(SERVER_DIR / "index.html", "text/html; charset=utf-8")
            return
        
        # API routes
        if path.startswith("/api/"):
            self.handle_api_get(path)
            return
        
        # Static assets (_next/static/*)
        if path.startswith("/_next/static/"):
            file_path = STATIC_DIR / path[len("/_next/static/"):]
            if file_path.exists() and file_path.is_file():
                self.serve_file(file_path, get_mime(str(file_path)), cache=True)
                return
        
        # _next image optimization
        if path.startswith("/_next/image"):
            self.send_error(404)
            return
        
        # Other _next routes (RSC payloads, segments, etc.)
        if path.startswith("/_next/"):
            # Try server directory
            rel_path = path[len("/_next/"):]
            file_path = SERVER_DIR / "_next" / rel_path
            if file_path.exists() and file_path.is_file():
                self.serve_file(file_path, get_mime(str(file_path)))
                return
            # Try static directory
            file_path = STATIC_DIR / rel_path
            if file_path.exists() and file_path.is_file():
                self.serve_file(file_path, get_mime(str(file_path)), cache=True)
                return
        
        # Public files (favicon, logo, robots.txt)
        if path in ("/favicon.ico", "/logo.svg", "/robots.txt"):
            file_path = PUBLIC_DIR / path.lstrip("/")
            if file_path.exists():
                self.serve_file(file_path, get_mime(str(file_path)))
                return
        
        # SPA fallback - serve root HTML for any unmatched route
        self.serve_file(SERVER_DIR / "index.html", "text/html; charset=utf-8")
    
    def do_POST(self):
        path = urlparse(self.path).path
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else b""
        
        try:
            body_json = json.loads(body) if body else {}
        except:
            body_json = {}
        
        # Handle specific POST endpoints
        if path == "/api/clients":
            self.send_json({"message": "Client created", "data": body_json}, 201)
        elif path == "/api/clients/bulk":
            action = body_json.get("action", "unknown")
            if action == "export":
                # Return actual client data for CSV export
                clients = api_cache.get("clients", [])
                self.send_json({"data": clients})
            else:
                self.send_json({"message": f"Bulk action '{action}' completed", "data": []})
        elif path == "/api/projects/bulk":
            action = body_json.get("action", "unknown")
            if action == "export":
                projects = api_cache.get("projects", [])
                self.send_json({"data": projects})
            else:
                self.send_json({"message": f"Bulk action '{action}' completed", "data": []})
        elif path.startswith("/api/"):
            self.send_json({"message": "Action completed", "data": body_json})
        else:
            self.send_error(404)
    
    def do_PATCH(self):
        path = urlparse(self.path).path
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else b""
        
        try:
            body_json = json.loads(body) if body else {}
        except:
            body_json = {}
        
        # Handle PATCH for detail endpoints
        parts = path.strip("/").split("/")
        if len(parts) >= 3 and parts[0] == "api":
            endpoint = parts[1]
            try:
                item_id = int(parts[2])
            except:
                self.send_json({"error": "Invalid ID"}, 404)
                return
            
            # Find and "update" the item
            data_map = {
                "clients": api_cache.get("clients", []),
                "projects": api_cache.get("projects", []),
            }
            items = data_map.get(endpoint, [])
            for item in items:
                if item.get("id") == item_id:
                    updated = {**item, **body_json}
                    self.send_json(updated)
                    return
            
            self.send_json({"message": "Updated (mock)"})
        else:
            self.send_json({"message": "Updated (mock)"})
    
    def do_DELETE(self):
        path = urlparse(self.path).path
        self.send_json({"message": "Deleted (mock)"})
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Length", "0")
        self.end_headers()
    
    def handle_api_get(self, path):
        """Handle GET API requests"""
        parts = path.strip("/").split("/")
        
        # Detail endpoint: /api/clients/1, /api/projects/2, etc.
        if len(parts) >= 3:
            endpoint = parts[1]
            item_id_str = parts[2]
            try:
                item_id = int(item_id_str)
            except:
                self.send_json({"error": "Invalid ID"}, 404)
                return
            
            data_map = {
                "clients": api_cache.get("clients", []),
                "projects": api_cache.get("projects", []),
                "approvals": api_cache.get("approvals", {}).get("approvals", []),
                "invoices": api_cache.get("finance", {}).get("invoices", []),
                "documents": api_cache.get("documents", {}).get("documents", []),
                "communications": api_cache.get("communications", {}).get("communications", []),
            }
            
            items = data_map.get(endpoint, [])
            for item in items:
                if item.get("id") == item_id:
                    self.send_json(item)
                    return
            
            self.send_json({"error": "Not found"}, 404)
            return
        
        # List endpoint: /api/dashboard, /api/clients, etc.
        endpoint = parts[1] if len(parts) > 1 else ""
        
        if endpoint in api_cache:
            self.send_json(api_cache[endpoint])
            return
        
        self.send_json({"error": f"API endpoint '{endpoint}' not found"}, 404)
    
    def serve_file(self, file_path: Path, content_type: str, cache=False):
        """Serve a static file"""
        if not file_path.exists():
            self.send_error(404)
            return
        try:
            if cache:
                data = read_file(file_path)
                if data is None:
                    self.send_error(404)
                    return
            else:
                data = file_path.read_bytes()
            
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            if cache:
                self.send_header("Cache-Control", "public, max-age=86400")
            else:
                self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            self.send_error(500, str(e))
    
    def send_json(self, data, status=200):
        """Send JSON response"""
        body = json.dumps(data, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)

if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), GWSHandler)
    print(f"GWS Platform V2 running on http://0.0.0.0:{PORT}")
    sys.stdout.flush()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()
