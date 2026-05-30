#!/usr/bin/env python3
"""
GWS Platform V2 — Lightweight Python Server
Serves pre-rendered Next.js HTML + API data with minimal PIDs
Single-threaded stdlib HTTP server with dynamic CRUD for Users/Roles/Permissions
"""
import json
import os
import sys
import uuid
import copy
from datetime import datetime, timezone
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from pathlib import Path
from urllib.parse import urlparse

# ── Configuration ──
BASE_DIR = Path(__file__).parent if '__file__' in dir() else Path('.')
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

# ── In-memory dynamic data stores ──
dynamic_users = []
dynamic_roles = []
dynamic_permissions = []
dynamic_user_roles = []  # { id, user_id, role_id, assigned_by, assigned_at }
dynamic_role_permissions = []  # { id, role_id, permission_id }

def init_dynamic_data():
    """Initialize users, roles, permissions from cached API data or defaults"""
    global dynamic_users, dynamic_roles, dynamic_permissions
    global dynamic_user_roles, dynamic_role_permissions

    # Load permissions
    perms_data = api_cache.get("permissions", {})
    if isinstance(perms_data, dict) and "permissions" in perms_data:
        dynamic_permissions = perms_data["permissions"]
    else:
        dynamic_permissions = _default_permissions()

    # Load roles
    roles_data = api_cache.get("roles", [])
    if isinstance(roles_data, list) and len(roles_data) > 0:
        dynamic_roles = roles_data
        # Extract role_permissions from roles
        dynamic_role_permissions = []
        for role in dynamic_roles:
            for rp in role.get("rolePermissions", []):
                dynamic_role_permissions.append({
                    "id": rp.get("id", str(uuid.uuid4())),
                    "role_id": role["id"],
                    "permission_id": rp["permission"]["id"] if isinstance(rp["permission"], dict) else rp["permission"],
                })
            # Remove rolePermissions from role object for cleaner GET responses
            # We'll add them back dynamically in GET handlers
    else:
        dynamic_roles, dynamic_role_permissions = _default_roles()

    # Load users
    users_data = api_cache.get("users", [])
    if isinstance(users_data, list) and len(users_data) > 0:
        dynamic_users = users_data
        dynamic_user_roles = []
        for user in dynamic_users:
            for ur in user.get("userRoles", []):
                dynamic_user_roles.append({
                    "id": ur.get("id", str(uuid.uuid4())),
                    "user_id": user["id"],
                    "role_id": ur["role"]["id"] if isinstance(ur["role"], dict) else ur["role"],
                })
    else:
        dynamic_users, dynamic_user_roles = _default_users()


def _default_permissions():
    """Default permission definitions"""
    perms = []
    modules_actions = {
        "dashboard": [("view", "View Dashboard", "Access the main dashboard")],
        "clients": [
            ("view", "View Clients", "View client list and details"),
            ("create", "Create Clients", "Add new clients"),
            ("edit", "Edit Clients", "Modify client information"),
            ("delete", "Delete Clients", "Remove clients"),
            ("export", "Export Clients", "Export client data"),
        ],
        "projects": [
            ("view", "View Projects", "View survey projects"),
            ("create", "Create Projects", "Add new survey projects"),
            ("edit", "Edit Projects", "Modify project details"),
            ("delete", "Delete Projects", "Remove projects"),
            ("export", "Export Projects", "Export project data"),
        ],
        "approvals": [
            ("view", "View Approvals", "View approval workflows"),
            ("edit", "Edit Approvals", "Modify approval steps"),
            ("approve", "Approve/Reject", "Approve or reject approval steps"),
        ],
        "finance": [
            ("view", "View Finance", "View invoices and financial data"),
            ("create", "Create Invoices", "Create new invoices"),
            ("edit", "Edit Invoices", "Modify invoice details"),
            ("delete", "Delete Invoices", "Remove invoices"),
            ("export", "Export Finance", "Export financial reports"),
        ],
        "workflows": [
            ("view", "View Workflows", "View workflow definitions"),
            ("create", "Create Workflows", "Create new workflow definitions"),
            ("edit", "Edit Workflows", "Modify workflow definitions"),
            ("manage", "Manage Workflows", "Full workflow management"),
        ],
        "field-sync": [
            ("view", "View Field Sync", "View field observations"),
            ("create", "Create Observations", "Submit field observations"),
            ("edit", "Edit Observations", "Modify field observations"),
            ("manage", "Manage Field Sync", "Full field sync management"),
        ],
        "spatial": [
            ("view", "View Spatial", "View spatial layers and maps"),
            ("edit", "Edit Spatial", "Modify spatial data"),
            ("manage", "Manage Spatial", "Full spatial data management"),
        ],
        "ai": [
            ("view", "View AI", "View AI models and logs"),
            ("manage", "Manage AI", "Configure AI models and prompts"),
        ],
        "documents": [
            ("view", "View Documents", "View document vault"),
            ("create", "Upload Documents", "Upload new documents"),
            ("edit", "Edit Documents", "Modify document metadata"),
            ("delete", "Delete Documents", "Remove documents"),
        ],
        "communications": [
            ("view", "View Messages", "View communications"),
            ("create", "Send Messages", "Send messages and SMS"),
            ("edit", "Edit Messages", "Modify communications"),
            ("delete", "Delete Messages", "Remove communications"),
        ],
        "organizations": [
            ("view", "View Organizations", "View organization details"),
            ("edit", "Edit Organizations", "Modify organization settings"),
            ("manage", "Manage Organizations", "Full organization management"),
        ],
        "reports": [
            ("view", "View Reports", "View generated reports"),
            ("create", "Create Reports", "Generate new reports"),
            ("export", "Export Reports", "Export report data"),
        ],
        "audit": [
            ("view", "View Audit Trail", "View audit logs"),
        ],
        "settings": [
            ("view", "View Settings", "View system settings"),
            ("edit", "Edit Settings", "Modify system settings"),
        ],
        "users": [
            ("view", "View Users", "View user list"),
            ("create", "Create Users", "Add new users"),
            ("edit", "Edit Users", "Modify user details"),
            ("delete", "Delete Users", "Remove users"),
            ("manage_roles", "Manage Roles", "Assign and manage user roles"),
        ],
    }
    for module, actions in modules_actions.items():
        for action, name, desc in actions:
            perms.append({
                "id": str(uuid.uuid4()),
                "code": f"{module}.{action}",
                "name": name,
                "module": module,
                "description": desc,
                "_count": {"rolePermissions": 0},
            })
    return perms


def _default_roles():
    """Default role definitions"""
    roles = []
    rps = []
    role_defs = [
        ("super_admin", "Super Admin", "Full system access with all permissions", "#dc2626", True),
        ("administrator", "Administrator", "System administrator with broad access", "#7c3aed", True),
        ("survey_manager", "Survey Manager", "Manages survey projects and field operations", "#2563eb", True),
        ("surveyor", "Surveyor", "Field surveyor with project and observation access", "#059669", True),
        ("finance_officer", "Finance Officer", "Manages invoices, payments, and financial reports", "#d97706", True),
        ("client_relations", "Client Relations", "Manages client communications and documents", "#0891b2", True),
        ("viewer", "Viewer", "Read-only access to most modules", "#6b7280", True),
    ]

    # Permission assignments per role
    role_perms = {
        "super_admin": "*",
        "administrator": "*",
        "survey_manager": ["dashboard.view", "clients.view", "clients.create", "clients.edit",
                          "projects.view", "projects.create", "projects.edit", "projects.delete", "projects.export",
                          "approvals.view", "approvals.edit", "approvals.approve",
                          "workflows.view", "field-sync.view", "field-sync.create", "field-sync.edit", "field-sync.manage",
                          "spatial.view", "spatial.edit",
                          "documents.view", "documents.create", "documents.edit",
                          "reports.view", "reports.create", "reports.export"],
        "surveyor": ["dashboard.view", "clients.view", "projects.view", "projects.edit",
                     "field-sync.view", "field-sync.create", "field-sync.edit",
                     "spatial.view", "documents.view", "documents.create"],
        "finance_officer": ["dashboard.view", "clients.view",
                           "finance.view", "finance.create", "finance.edit", "finance.export",
                           "reports.view", "reports.create", "reports.export", "documents.view"],
        "client_relations": ["dashboard.view", "clients.view", "clients.create", "clients.edit", "clients.export",
                            "communications.view", "communications.create", "communications.edit",
                            "documents.view", "documents.create", "documents.edit", "reports.view"],
        "viewer": ["dashboard.view", "clients.view", "projects.view", "finance.view",
                  "workflows.view", "field-sync.view", "spatial.view", "ai.view",
                  "documents.view", "communications.view", "organizations.view",
                  "reports.view", "audit.view"],
    }

    for name, display_name, description, color, is_system in role_defs:
        role_id = str(uuid.uuid4())
        role = {
            "id": role_id,
            "name": name,
            "display_name": display_name,
            "description": description,
            "color": color,
            "is_system": is_system,
            "_count": {"userRoles": 0},
        }
        roles.append(role)

        # Assign permissions
        perm_codes = role_perms.get(name, [])
        if perm_codes == "*":
            perm_codes = [p["code"] for p in dynamic_permissions]
        for code in perm_codes:
            perm = next((p for p in dynamic_permissions if p["code"] == code), None)
            if perm:
                rps.append({
                    "id": str(uuid.uuid4()),
                    "role_id": role_id,
                    "permission_id": perm["id"],
                })

    return roles, rps


def _default_users():
    """Default user definitions"""
    users = []
    urs = []
    user_defs = [
        ("admin@gws.co.ug", "Admin User", "System Administrator", "IT", "active"),
        ("james.okello@gws.co.ug", "James Okello", "Senior Surveyor", "Surveying", "active"),
        ("sarah.nakamya@gws.co.ug", "Sarah Nakamya", "Survey Manager", "Operations", "active"),
        ("robert.mugisha@gws.co.ug", "Robert Mugisha", "Finance Officer", "Finance", "active"),
        ("grace.achieng@gws.co.ug", "Grace Achieng", "Client Relations Manager", "Client Services", "active"),
        ("peter.oboi@gws.co.ug", "Peter Oboi", "Field Surveyor", "Surveying", "active"),
        ("mary.kato@gws.co.ug", "Mary Kato", "GIS Analyst", "Spatial", "active"),
        ("david.besigye@gws.co.ug", "David Besigye", "Intern Surveyor", "Surveying", "inactive"),
    ]
    user_role_map = [
        "super_admin", "administrator", "survey_manager", "finance_officer",
        "client_relations", "surveyor", "viewer", "surveyor",
    ]

    for i, (email, name, job_title, dept, status) in enumerate(user_defs):
        user_id = str(uuid.uuid4())
        users.append({
            "id": user_id,
            "email": email,
            "name": name,
            "avatar_url": None,
            "phone": None,
            "job_title": job_title,
            "department": dept,
            "status": status,
            "last_login_at": datetime.now(timezone.utc).isoformat() if i < 3 else None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        # Assign role
        role_name = user_role_map[i] if i < len(user_role_map) else "viewer"
        role = next((r for r in dynamic_roles if r["name"] == role_name), None)
        if role:
            urs.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "role_id": role["id"],
                "assigned_by": None,
                "assigned_at": datetime.now(timezone.utc).isoformat(),
            })

    return users, urs


# Initialize dynamic data
init_dynamic_data()

# ── Helper: Build enriched user/role objects ──
def get_enriched_users():
    """Get users with their roles and permissions"""
    result = []
    for user in dynamic_users:
        user_copy = copy.deepcopy(user)
        user_roles = []
        for ur in dynamic_user_roles:
            if ur["user_id"] == user["id"]:
                role = next((r for r in dynamic_roles if r["id"] == ur["role_id"]), None)
                if role:
                    role_copy = copy.deepcopy(role)
                    # Add permissions to role
                    role_perms = []
                    for rp in dynamic_role_permissions:
                        if rp["role_id"] == role["id"]:
                            perm = next((p for p in dynamic_permissions if p["id"] == rp["permission_id"]), None)
                            if perm:
                                role_perms.append({"id": rp["id"], "permission": perm})
                    role_copy["rolePermissions"] = role_perms
                    user_roles.append({"id": ur["id"], "role": role_copy})
        user_copy["userRoles"] = user_roles
        result.append(user_copy)
    return result


def get_enriched_roles():
    """Get roles with their permissions and user counts"""
    result = []
    for role in dynamic_roles:
        role_copy = copy.deepcopy(role)
        # Add permissions
        role_perms = []
        for rp in dynamic_role_permissions:
            if rp["role_id"] == role["id"]:
                perm = next((p for p in dynamic_permissions if p["id"] == rp["permission_id"]), None)
                if perm:
                    role_perms.append({"id": rp["id"], "permission": perm})
        role_copy["rolePermissions"] = role_perms
        # Add user count
        user_count = sum(1 for ur in dynamic_user_roles if ur["role_id"] == role["id"])
        role_copy["_count"] = {"userRoles": user_count}
        result.append(role_copy)
    return result


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
MAX_CACHE_SIZE = 200

def read_file(path: Path):
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
        pass
    
    def handle_one_request(self):
        """Override to add error handling that prevents server crashes"""
        try:
            super().handle_one_request()
        except Exception as e:
            import traceback
            traceback.print_exc()
            try:
                self.send_error(500, str(e))
            except:
                pass
    
    def do_GET(self):
        try:
            self._do_GET()
        except Exception as e:
            import traceback
            traceback.print_exc()
            try:
                self.send_error(500, str(e))
            except:
                pass
    
    def _do_GET(self):
        path = urlparse(self.path).path
        
        if path == "/" or path == "":
            self.serve_file(SERVER_DIR / "index.html", "text/html; charset=utf-8")
            return
        
        if path.startswith("/api/"):
            self.handle_api_get(path)
            return
        
        if path.startswith("/_next/static/"):
            file_path = STATIC_DIR / path[len("/_next/static/"):]
            if file_path.exists() and file_path.is_file():
                self.serve_file(file_path, get_mime(str(file_path)), cache=True)
                return
        
        if path.startswith("/_next/image"):
            self.send_error(404)
            return
        
        if path.startswith("/_next/"):
            rel_path = path[len("/_next/"):]
            file_path = SERVER_DIR / "_next" / rel_path
            if file_path.exists() and file_path.is_file():
                self.serve_file(file_path, get_mime(str(file_path)))
                return
            file_path = STATIC_DIR / rel_path
            if file_path.exists() and file_path.is_file():
                self.serve_file(file_path, get_mime(str(file_path)), cache=True)
                return
        
        if path in ("/favicon.ico", "/logo.svg", "/robots.txt"):
            file_path = PUBLIC_DIR / path.lstrip("/")
            if file_path.exists():
                self.serve_file(file_path, get_mime(str(file_path)))
                return
        
        self.serve_file(SERVER_DIR / "index.html", "text/html; charset=utf-8")
    
    def do_POST(self):
        try:
            self._do_POST()
        except Exception as e:
            import traceback
            traceback.print_exc()
            try:
                self.send_error(500, str(e))
            except:
                pass
    
    def _do_POST(self):
        path = urlparse(self.path).path
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else b""
        
        try:
            body_json = json.loads(body) if body else {}
        except:
            body_json = {}
        
        # ── Users CRUD ──
        if path == "/api/users":
            new_user = self._create_user(body_json)
            self.send_json(new_user, 201)
            return
        
        # ── Roles CRUD ──
        if path == "/api/roles":
            new_role = self._create_role(body_json)
            if isinstance(new_role, dict) and "error" in new_role:
                self.send_json(new_role, 409)
            else:
                self.send_json(new_role, 201)
            return
        
        # ── Existing POST endpoints ──
        if path == "/api/clients":
            self.send_json({"message": "Client created", "data": body_json}, 201)
        elif path == "/api/clients/bulk":
            action = body_json.get("action", "unknown")
            if action == "export":
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
        try:
            self._do_PATCH()
        except Exception as e:
            import traceback
            traceback.print_exc()
            try:
                self.send_error(500, str(e))
            except:
                pass
    
    def _do_PATCH(self):
        path = urlparse(self.path).path
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else b""
        
        try:
            body_json = json.loads(body) if body else {}
        except:
            body_json = {}
        
        parts = path.strip("/").split("/")
        if len(parts) >= 3 and parts[0] == "api":
            endpoint = parts[1]
            item_id = parts[2]
            
            # ── Users PATCH ──
            if endpoint == "users":
                updated = self._update_user(item_id, body_json)
                if updated:
                    self.send_json(updated)
                else:
                    self.send_json({"error": "User not found"}, 404)
                return
            
            # ── Roles PATCH ──
            if endpoint == "roles":
                updated = self._update_role(item_id, body_json)
                if updated:
                    self.send_json(updated)
                else:
                    self.send_json({"error": "Role not found"}, 404)
                return
            
            # ── Existing PATCH endpoints ──
            try:
                numeric_id = int(item_id)
            except:
                self.send_json({"error": "Invalid ID"}, 404)
                return
            
            data_map = {
                "clients": api_cache.get("clients", []),
                "projects": api_cache.get("projects", []),
            }
            items = data_map.get(endpoint, [])
            for item in items:
                if item.get("id") == numeric_id:
                    updated = {**item, **body_json}
                    self.send_json(updated)
                    return
            
            self.send_json({"message": "Updated (mock)"})
        else:
            self.send_json({"message": "Updated (mock)"})
    
    def do_DELETE(self):
        try:
            self._do_DELETE()
        except Exception as e:
            import traceback
            traceback.print_exc()
            try:
                self.send_error(500, str(e))
            except:
                pass
    
    def _do_DELETE(self):
        path = urlparse(self.path).path
        parts = path.strip("/").split("/")
        
        if len(parts) >= 3 and parts[0] == "api":
            endpoint = parts[1]
            item_id = parts[2]
            
            # ── Users DELETE ──
            if endpoint == "users":
                success = self._delete_user(item_id)
                if success:
                    self.send_json({"success": True})
                else:
                    self.send_json({"error": "User not found"}, 404)
                return
            
            # ── Roles DELETE ──
            if endpoint == "roles":
                result = self._delete_role(item_id)
                if isinstance(result, dict) and "error" in result:
                    self.send_json(result, 403)
                else:
                    self.send_json({"success": True})
                return
        
        self.send_json({"message": "Deleted (mock)"})
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Length", "0")
        self.end_headers()
    
    # ── Dynamic CRUD Methods ──
    
    def _create_user(self, body):
        global dynamic_users, dynamic_user_roles
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        # Check for duplicate email
        email = body.get("email", "")
        if any(u["email"] == email for u in dynamic_users):
            return {"error": "User with this email already exists"}
        
        user = {
            "id": user_id,
            "email": email,
            "name": body.get("name", ""),
            "avatar_url": body.get("avatar_url"),
            "phone": body.get("phone"),
            "job_title": body.get("job_title"),
            "department": body.get("department"),
            "status": body.get("status", "active"),
            "last_login_at": None,
            "created_at": now,
            "updated_at": now,
        }
        dynamic_users.append(user)
        
        # Assign roles
        role_ids = body.get("role_ids", [])
        for rid in role_ids:
            dynamic_user_roles.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "role_id": rid,
                "assigned_by": None,
                "assigned_at": now,
            })
        
        # Return enriched user
        enriched = get_enriched_users()
        return next((u for u in enriched if u["id"] == user_id), user)
    
    def _update_user(self, user_id, body):
        global dynamic_users, dynamic_user_roles
        user = next((u for u in dynamic_users if u["id"] == user_id), None)
        if not user:
            return None
        
        now = datetime.now(timezone.utc).isoformat()
        for key in ["email", "name", "phone", "job_title", "department", "status", "avatar_url"]:
            if key in body:
                user[key] = body[key]
        user["updated_at"] = now
        
        # Sync roles if provided
        if "role_ids" in body:
            dynamic_user_roles = [ur for ur in dynamic_user_roles if ur["user_id"] != user_id]
            for rid in body["role_ids"]:
                dynamic_user_roles.append({
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "role_id": rid,
                    "assigned_by": None,
                    "assigned_at": now,
                })
        
        enriched = get_enriched_users()
        return next((u for u in enriched if u["id"] == user_id), user)
    
    def _delete_user(self, user_id):
        global dynamic_users, dynamic_user_roles
        user = next((u for u in dynamic_users if u["id"] == user_id), None)
        if not user:
            return False
        dynamic_users = [u for u in dynamic_users if u["id"] != user_id]
        dynamic_user_roles = [ur for ur in dynamic_user_roles if ur["user_id"] != user_id]
        return True
    
    def _create_role(self, body):
        global dynamic_roles, dynamic_role_permissions
        role_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        name = body.get("name", "")
        if any(r["name"] == name for r in dynamic_roles):
            return {"error": "Role with this name already exists"}
        
        role = {
            "id": role_id,
            "name": name,
            "display_name": body.get("display_name", ""),
            "description": body.get("description"),
            "color": body.get("color", "#10b981"),
            "is_system": False,
            "_count": {"userRoles": 0},
        }
        dynamic_roles.append(role)
        
        # Assign permissions
        perm_ids = body.get("permission_ids", [])
        for pid in perm_ids:
            dynamic_role_permissions.append({
                "id": str(uuid.uuid4()),
                "role_id": role_id,
                "permission_id": pid,
            })
        
        enriched = get_enriched_roles()
        return next((r for r in enriched if r["id"] == role_id), role)
    
    def _update_role(self, role_id, body):
        global dynamic_roles, dynamic_role_permissions
        role = next((r for r in dynamic_roles if r["id"] == role_id), None)
        if not role:
            return None
        
        now = datetime.now(timezone.utc).isoformat()
        for key in ["name", "display_name", "description", "color"]:
            if key in body:
                role[key] = body[key]
        
        # Sync permissions if provided
        if "permission_ids" in body:
            dynamic_role_permissions = [rp for rp in dynamic_role_permissions if rp["role_id"] != role_id]
            for pid in body["permission_ids"]:
                dynamic_role_permissions.append({
                    "id": str(uuid.uuid4()),
                    "role_id": role_id,
                    "permission_id": pid,
                })
        
        enriched = get_enriched_roles()
        return next((r for r in enriched if r["id"] == role_id), role)
    
    def _delete_role(self, role_id):
        global dynamic_roles, dynamic_role_permissions, dynamic_user_roles
        role = next((r for r in dynamic_roles if r["id"] == role_id), None)
        if not role:
            return False
        if role.get("is_system"):
            return {"error": "Cannot delete system roles"}
        dynamic_roles = [r for r in dynamic_roles if r["id"] != role_id]
        dynamic_role_permissions = [rp for rp in dynamic_role_permissions if rp["role_id"] != role_id]
        dynamic_user_roles = [ur for ur in dynamic_user_roles if ur["role_id"] != role_id]
        return True
    
    # ── API GET Handler ──
    
    def handle_api_get(self, path):
        parts = path.strip("/").split("/")
        
        # Dynamic endpoints: /api/users, /api/users/[id], /api/roles, /api/roles/[id], /api/permissions
        if len(parts) >= 2:
            endpoint = parts[1]
            
            # ── Permissions ──
            if endpoint == "permissions":
                perm_modules = sorted(set(p["module"] for p in dynamic_permissions))
                # Update role count for each permission
                for p in dynamic_permissions:
                    p["_count"] = {"rolePermissions": sum(1 for rp in dynamic_role_permissions if rp["permission_id"] == p["id"])}
                self.send_json({"permissions": dynamic_permissions, "modules": perm_modules})
                return
            
            # ── Users ──
            if endpoint == "users":
                if len(parts) >= 3:
                    # Get single user
                    user_id = parts[2]
                    enriched = get_enriched_users()
                    user = next((u for u in enriched if u["id"] == user_id), None)
                    if user:
                        self.send_json(user)
                    else:
                        self.send_json({"error": "User not found"}, 404)
                else:
                    self.send_json(get_enriched_users())
                return
            
            # ── Roles ──
            if endpoint == "roles":
                if len(parts) >= 3:
                    role_id = parts[2]
                    enriched = get_enriched_roles()
                    role = next((r for r in enriched if r["id"] == role_id), None)
                    if role:
                        self.send_json(role)
                    else:
                        self.send_json({"error": "Role not found"}, 404)
                else:
                    self.send_json(get_enriched_roles())
                return
        
        # ── Existing endpoints with numeric IDs ──
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
        
        # List endpoint
        endpoint = parts[1] if len(parts) > 1 else ""
        if endpoint in api_cache:
            self.send_json(api_cache[endpoint])
            return
        
        self.send_json({"error": f"API endpoint '{endpoint}' not found"}, 404)
    
    def serve_file(self, file_path: Path, content_type: str, cache=False):
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
            self.send_header("Connection", "close")
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            self.send_error(500, str(e))
    
    def send_json(self, data, status=200):
        body = json.dumps(data, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.end_headers()
        try:
            self.wfile.write(body)
            self.wfile.flush()
        except BrokenPipeError:
            pass
        except ConnectionResetError:
            pass

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

if __name__ == "__main__":
    server = ThreadedHTTPServer(("0.0.0.0", PORT), GWSHandler)
    print(f"GWS Platform V2 running on http://0.0.0.0:{PORT}")
    sys.stdout.flush()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()
