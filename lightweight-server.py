#!/usr/bin/env python3
"""
GWS Platform V2 — Lightweight Python Server
Serves pre-rendered Next.js HTML + API data with minimal PIDs
"""
import json
import os
import sys
from pathlib import Path
from fastapi import FastAPI, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

# ── Configuration ──
BASE_DIR = Path(__file__).parent
NEXT_DIR = BASE_DIR / ".next"
SERVER_DIR = NEXT_DIR / "server" / "app"
STATIC_DIR = NEXT_DIR / "static"
PUBLIC_DIR = BASE_DIR / "public"
API_DATA_DIR = BASE_DIR / "api-data"

app = FastAPI(title="GWS Platform V2")

# ── Load API data ──
api_cache = {}

def load_api_data():
    """Load all pre-fetched API data into memory"""
    if not API_DATA_DIR.exists():
        print(f"Warning: API data directory not found at {API_DATA_DIR}")
        return
    
    for f in API_DATA_DIR.glob("*.json"):
        key = f.stem
        try:
            with open(f) as fh:
                api_cache[key] = json.load(fh)
            print(f"  Loaded API data: {key}")
        except Exception as e:
            print(f"  Error loading {key}: {e}")

load_api_data()

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
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
    ".map": "application/json",
}

def get_mime(path: str) -> str:
    ext = Path(path).suffix.lower()
    return MIME_TYPES.get(ext, "application/octet-stream")

# ── Static assets ──
@app.get("/_next/static/{file_path:path}")
async def serve_static(file_path: str):
    """Serve Next.js static assets (JS, CSS, fonts, etc.)"""
    full_path = STATIC_DIR / file_path
    if full_path.exists() and full_path.is_file():
        return FileResponse(full_path, media_type=get_mime(str(full_path)))
    return JSONResponse({"error": "Not found"}, status_code=404)

# ── Public files ──
@app.get("/favicon.ico")
@app.get("/logo.svg")
@app.get("/robots.txt")
async def serve_public(request: Request):
    """Serve public directory files"""
    filename = request.url.path.lstrip("/")
    full_path = PUBLIC_DIR / filename
    if full_path.exists() and full_path.is_file():
        return FileResponse(full_path, media_type=get_mime(str(full_path)))
    return JSONResponse({"error": "Not found"}, status_code=404)

# ── Root page (pre-rendered HTML) ──
@app.get("/")
async def serve_root():
    """Serve the pre-rendered Next.js HTML page"""
    html_path = SERVER_DIR / "index.html"
    if html_path.exists():
        return FileResponse(html_path, media_type="text/html; charset=utf-8")
    return JSONResponse({"error": "Page not found"}, status_code=404)

# ── API Routes ──
API_ENDPOINTS = [
    "dashboard", "clients", "projects", "workflows", "spatial",
    "field-sync", "ai", "finance", "documents", "communications",
    "approvals", "events", "organizations", "reports"
]

@app.get("/api/{endpoint}")
async def serve_api(endpoint: str):
    """Serve pre-fetched API data"""
    if endpoint in api_cache:
        return JSONResponse(api_cache[endpoint])
    return JSONResponse({"error": f"API endpoint '{endpoint}' not found"}, status_code=404)

@app.get("/api/clients/{client_id}")
async def serve_client_detail(client_id: int):
    """Serve individual client data"""
    clients = api_cache.get("clients", [])
    for client in clients:
        if client.get("id") == client_id:
            return JSONResponse(client)
    return JSONResponse({"error": "Client not found"}, status_code=404)

@app.get("/api/projects/{project_id}")
async def serve_project_detail(project_id: int):
    """Serve individual project data"""
    projects = api_cache.get("projects", [])
    for project in projects:
        if project.get("id") == project_id:
            return JSONResponse(project)
    return JSONResponse({"error": "Project not found"}, status_code=404)

@app.get("/api/approvals/{approval_id}")
async def serve_approval_detail(approval_id: int):
    """Serve individual approval data"""
    approvals = api_cache.get("approvals", {}).get("approvals", [])
    for approval in approvals:
        if approval.get("id") == approval_id:
            return JSONResponse(approval)
    return JSONResponse({"error": "Approval not found"}, status_code=404)

@app.get("/api/invoices/{invoice_id}")
async def serve_invoice_detail(invoice_id: int):
    """Serve individual invoice data"""
    invoices = api_cache.get("finance", {}).get("invoices", [])
    for invoice in invoices:
        if invoice.get("id") == invoice_id:
            return JSONResponse(invoice)
    return JSONResponse({"error": "Invoice not found"}, status_code=404)

@app.get("/api/documents/{document_id}")
async def serve_document_detail(document_id: int):
    """Serve individual document data"""
    documents = api_cache.get("documents", {}).get("documents", [])
    for doc in documents:
        if doc.get("id") == document_id:
            return JSONResponse(doc)
    return JSONResponse({"error": "Document not found"}, status_code=404)

@app.get("/api/communications/{comm_id}")
async def serve_communication_detail(comm_id: int):
    """Serve individual communication data"""
    comms = api_cache.get("communications", {}).get("communications", [])
    for comm in comms:
        if comm.get("id") == comm_id:
            return JSONResponse(comm)
    return JSONResponse({"error": "Communication not found"}, status_code=404)

# ── POST/PATCH/DELETE handlers (accept and return mock responses) ──
@app.post("/api/clients")
async def create_client(request: Request):
    """Mock client creation"""
    try:
        body = await request.json()
        return JSONResponse({"message": "Client created (mock)", "data": body}, status_code=201)
    except:
        return JSONResponse({"error": "Invalid request"}, status_code=400)

@app.post("/api/clients/bulk")
async def bulk_client_action(request: Request):
    """Mock bulk client action"""
    try:
        body = await request.json()
        return JSONResponse({"message": f"Bulk action '{body.get('action')}' completed (mock)", "data": []})
    except:
        return JSONResponse({"error": "Invalid request"}, status_code=400)

@app.post("/api/projects/bulk")
async def bulk_project_action(request: Request):
    """Mock bulk project action"""
    try:
        body = await request.json()
        return JSONResponse({"message": f"Bulk action '{body.get('action')}' completed (mock)", "data": []})
    except:
        return JSONResponse({"error": "Invalid request"}, status_code=400)

@app.patch("/api/clients/{client_id}")
async def update_client(client_id: int, request: Request):
    """Mock client update"""
    try:
        body = await request.json()
        clients = api_cache.get("clients", [])
        for client in clients:
            if client.get("id") == client_id:
                updated = {**client, **body}
                return JSONResponse(updated)
        return JSONResponse({"error": "Client not found"}, status_code=404)
    except:
        return JSONResponse({"error": "Invalid request"}, status_code=400)

@app.patch("/api/projects/{project_id}")
async def update_project(project_id: int, request: Request):
    """Mock project update"""
    try:
        body = await request.json()
        projects = api_cache.get("projects", [])
        for project in projects:
            if project.get("id") == project_id:
                updated = {**project, **body}
                return JSONResponse(updated)
        return JSONResponse({"error": "Project not found"}, status_code=404)
    except:
        return JSONResponse({"error": "Invalid request"}, status_code=400)

@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: int):
    """Mock document deletion"""
    return JSONResponse({"message": "Document deleted (mock)"})

# ── Catch-all for _next routes ──
@app.get("/_next/{file_path:path}")
async def serve_next_routes(file_path: str):
    """Serve other Next.js routes (RSC payloads, etc.)"""
    # Try server directory first
    full_path = SERVER_DIR / file_path
    if full_path.exists() and full_path.is_file():
        return FileResponse(full_path, media_type=get_mime(str(full_path)))
    
    # Try static directory
    full_path = STATIC_DIR / file_path
    if full_path.exists() and full_path.is_file():
        return FileResponse(full_path, media_type=get_mime(str(full_path)))
    
    return JSONResponse({"error": "Not found"}, status_code=404)

# ── 404 handler ──
@app.get("/{path:path}")
async def catch_all(path: str):
    """Catch-all for any other routes - serve the root HTML (SPA fallback)"""
    html_path = SERVER_DIR / "index.html"
    if html_path.exists():
        return FileResponse(html_path, media_type="text/html; charset=utf-8")
    return JSONResponse({"error": "Not found"}, status_code=404)

# ── Entry point ──
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    print(f"🚀 GWS Platform V2 — Lightweight Server")
    print(f"   Port: {port}")
    print(f"   API endpoints: {len(api_cache)}")
    print(f"   Starting uvicorn...")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info", workers=1)
