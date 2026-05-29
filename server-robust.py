#!/usr/bin/env python3
"""GWS Platform V2 — Robust Threaded Server"""
import json, os, sys, traceback
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse
from socketserver import ThreadingMixIn

BASE_DIR = Path(__file__).parent
NEXT_DIR = BASE_DIR / ".next"
SERVER_DIR = NEXT_DIR / "server" / "app"
STATIC_DIR = NEXT_DIR / "static"
PUBLIC_DIR = BASE_DIR / "public"
API_DATA_DIR = BASE_DIR / "api-data"
PORT = int(os.environ.get("PORT", 3000))

api_cache = {}
if API_DATA_DIR.exists():
    for f in API_DATA_DIR.glob("*.json"):
        try:
            with open(f) as fh:
                api_cache[f.stem] = json.load(fh)
        except Exception as e:
            print(f"Error loading {f}: {e}", flush=True)

print(f"GWS Platform V2 — {len(api_cache)} API endpoints loaded", flush=True)

MIME_TYPES = {
    ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
    ".json": "application/json", ".woff2": "font/woff2", ".woff": "font/woff",
    ".ttf": "font/ttf", ".svg": "image/svg+xml", ".png": "image/png",
    ".ico": "image/x-icon", ".map": "application/json",
}

def get_mime(path):
    return MIME_TYPES.get(Path(path).suffix.lower(), "application/octet-stream")

file_cache = {}

class GWSHandler(BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def handle_one_request(self):
        try:
            super().handle_one_request()
        except (ConnectionResetError, BrokenPipeError):
            pass
        except Exception as e:
            print(f"Request error: {e}", flush=True)

    def do_GET(self):
        try:
            path = urlparse(self.path).path
            if path in ("/", ""):
                return self.serve_file(SERVER_DIR / "index.html", "text/html; charset=utf-8")
            if path.startswith("/api/"):
                return self.handle_api_get(path)
            if path.startswith("/_next/static/"):
                fp = STATIC_DIR / path[len("/_next/static/"):]
                if fp.exists() and fp.is_file():
                    return self.serve_file(fp, get_mime(str(fp)), cache=True)
            if path.startswith("/_next/image"):
                return self.send_error(404)
            if path.startswith("/_next/"):
                rel = path[len("/_next/"):]
                for d in [SERVER_DIR / "_next", STATIC_DIR]:
                    fp = d / rel
                    if fp.exists() and fp.is_file():
                        return self.serve_file(fp, get_mime(str(fp)), cache=(d == STATIC_DIR))
            if path in ("/favicon.ico", "/logo.svg", "/robots.txt"):
                fp = PUBLIC_DIR / path.lstrip("/")
                if fp.exists():
                    return self.serve_file(fp, get_mime(str(fp)))
            self.serve_file(SERVER_DIR / "index.html", "text/html; charset=utf-8")
        except (ConnectionResetError, BrokenPipeError):
            pass
        except Exception as e:
            print(f"GET {self.path}: {e}", flush=True)
            try: self.send_error(500)
            except: pass

    def do_POST(self):
        try:
            path = urlparse(self.path).path
            cl = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(cl) if cl > 0 else b""
            try: bj = json.loads(body) if body else {}
            except: bj = {}
            if "/bulk" in path:
                action = bj.get("action", "unknown")
                if action == "export":
                    ep = path.split("/")[2]
                    return self.send_json({"data": api_cache.get(ep, [])})
                return self.send_json({"message": f"Bulk {action} completed", "data": []})
            if path.startswith("/api/"):
                return self.send_json({"message": "Created", "data": bj}, 201)
            self.send_error(404)
        except (ConnectionResetError, BrokenPipeError): pass
        except Exception as e:
            try: self.send_error(500)
            except: pass

    def do_PATCH(self):
        try:
            path = urlparse(self.path).path
            cl = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(cl) if cl > 0 else b""
            try: bj = json.loads(body) if body else {}
            except: bj = {}
            parts = path.strip("/").split("/")
            if len(parts) >= 3 and parts[0] == "api":
                ep = parts[1]
                try: item_id = int(parts[2])
                except: return self.send_json({"error": "Invalid ID"}, 404)
                dm = {"clients": api_cache.get("clients", []), "projects": api_cache.get("projects", []),
                      "approvals": api_cache.get("approvals", {}).get("approvals", []),
                      "invoices": api_cache.get("finance", {}).get("invoices", []),
                      "documents": api_cache.get("documents", {}).get("documents", []),
                      "communications": api_cache.get("communications", {}).get("communications", [])}
                for item in dm.get(ep, []):
                    if item.get("id") == item_id:
                        return self.send_json({**item, **bj})
            self.send_json({"message": "Updated (mock)"})
        except (ConnectionResetError, BrokenPipeError): pass
        except: 
            try: self.send_json({"message": "Updated (mock)"})
            except: pass

    def do_DELETE(self):
        self.send_json({"message": "Deleted (mock)"})

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def handle_api_get(self, path):
        parts = path.strip("/").split("/")
        if len(parts) >= 3:
            ep = parts[1]
            try: item_id = int(parts[2])
            except: return self.send_json({"error": "Invalid ID"}, 404)
            dm = {"clients": api_cache.get("clients", []), "projects": api_cache.get("projects", []),
                  "approvals": api_cache.get("approvals", {}).get("approvals", []),
                  "invoices": api_cache.get("finance", {}).get("invoices", []),
                  "documents": api_cache.get("documents", {}).get("documents", []),
                  "communications": api_cache.get("communications", {}).get("communications", [])}
            for item in dm.get(ep, []):
                if item.get("id") == item_id:
                    return self.send_json(item)
            return self.send_json({"error": "Not found"}, 404)
        ep = parts[1] if len(parts) > 1 else ""
        if ep in api_cache:
            return self.send_json(api_cache[ep])
        self.send_json({"error": f"Not found"}, 404)

    def serve_file(self, fp, ct, cache=False):
        if not fp.exists():
            return self.send_error(404)
        try:
            key = str(fp)
            if cache and key in file_cache:
                data = file_cache[key]
            else:
                data = fp.read_bytes()
                if cache and len(file_cache) < 200:
                    file_cache[key] = data
            self.send_response(200)
            self.send_header("Content-Type", ct)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "public, max-age=86400" if cache else "no-cache")
            self.end_headers()
            self.wfile.write(data)
        except (ConnectionResetError, BrokenPipeError): pass
        except Exception as e:
            try: self.send_error(500)
            except: pass

    def send_json(self, data, status=200):
        try:
            body = json.dumps(data, default=str).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(body)
        except (ConnectionResetError, BrokenPipeError): pass
        except: pass

class ThreadedServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

if __name__ == "__main__":
    server = ThreadedServer(("0.0.0.0", PORT), GWSHandler)
    print(f"GWS Platform V2 running on http://0.0.0.0:{PORT}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()
