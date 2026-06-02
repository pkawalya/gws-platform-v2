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
dynamic_workflow_defs = []  # Workflow definitions with steps
dynamic_workflow_instances = []  # Workflow instances
dynamic_workflow_transitions = []  # Workflow transitions
dynamic_survey_templates = []  # Survey report templates
dynamic_survey_reports = []  # Survey reports

# ── Default Survey Report Templates ──
DEFAULT_SURVEY_TEMPLATES = [
    {
        "id": "srt-cadastral",
        "organization_id": None,
        "name": "Cadastral Survey Report",
        "slug": "cadastral-survey-report",
        "description": "Standard cadastral survey report for land boundary determination and property registration in Uganda. Complies with the Survey Act and Land Act requirements.",
        "report_type": "cadastral",
        "category": "survey",
        "sections": [
            {"id": "s1", "title": "Cover Page", "type": "cover", "content": "Cadastral Survey Report\n{{project_title}}\n{{district}}, {{sub_county}}, {{parish}}, {{village}}", "fields": [], "required": True},
            {"id": "s2", "title": "Executive Summary", "type": "text", "content": "This report presents the findings of a cadastral survey conducted on {{survey_date}} for {{client_name}} (Ref: {{client_ref}}). The survey covers approximately {{area_hectares}} hectares of land situated at {{village}}, {{parish}}, {{sub_county}}, {{district}}.", "fields": [], "required": True},
            {"id": "s3", "title": "Property Description", "type": "text", "content": "The subject property is located at {{village}}, {{parish}} Sub-county, {{district}} District, Uganda.\n\nLand Reference: {{project_ref}}\nApproximate Area: {{area_hectares}} Hectares", "fields": [], "required": True},
            {"id": "s4", "title": "Survey Methodology", "type": "text", "content": "The survey was carried out using GNSS/GPS receivers and Total Station equipment.\n\nDatum: WGS84 / UTM Zone 36N", "fields": [], "required": True},
            {"id": "s5", "title": "Boundary Description", "type": "text", "content": "The boundaries of the subject property are described as follows:\n\n{{beacons_list}}", "fields": [], "required": True},
            {"id": "s6", "title": "Coordinates & Beacons", "type": "coordinates", "content": "The following coordinates define the boundary:", "fields": ["point", "northing", "easting", "beacon_type"], "required": True},
            {"id": "s7", "title": "Area Computation", "type": "table", "content": "Total Area: {{area_hectares}} Hectares\nComputation Method: Coordinate Geometry", "fields": [], "required": True},
            {"id": "s8", "title": "Sketch Plan", "type": "image", "content": "[Survey sketch plan to be attached]", "fields": [], "required": False},
            {"id": "s9", "title": "Recommendations", "type": "text", "content": "1. The surveyed boundaries should be confirmed for registration\n2. Boundary beacons should be maintained\n3. A title deed should be processed", "fields": [], "required": False},
            {"id": "s10", "title": "Certification", "type": "certification", "content": "I hereby certify that this survey was carried out under my direct supervision.\n\nSigned: ________________________\nName: {{surveyor_name}}\nLicense No: {{surveyor_license}}\nDate: {{preparation_date}}\n\nFor and on behalf of {{organization_name}}", "fields": [], "required": True},
        ],
        "header_text": "CADASTRAL SURVEY REPORT — {{project_ref}}",
        "footer_text": "Confidential — Prepared by {{organization_name}} — {{preparation_date}}",
        "logo_position": "left",
        "variables": [
            {"key": "client_name", "label": "Client Name", "type": "text", "source": "client", "default": ""},
            {"key": "client_ref", "label": "Client Reference", "type": "text", "source": "client", "default": ""},
            {"key": "project_ref", "label": "Project Reference", "type": "text", "source": "project", "default": ""},
            {"key": "project_title", "label": "Project Title", "type": "text", "source": "project", "default": ""},
            {"key": "district", "label": "District", "type": "text", "source": "project", "default": ""},
            {"key": "sub_county", "label": "Sub-County", "type": "text", "source": "project", "default": ""},
            {"key": "parish", "label": "Parish", "type": "text", "source": "project", "default": ""},
            {"key": "village", "label": "Village", "type": "text", "source": "project", "default": ""},
            {"key": "area_hectares", "label": "Area (Hectares)", "type": "number", "source": "project", "default": ""},
            {"key": "survey_date", "label": "Survey Date", "type": "date", "source": "manual", "default": ""},
            {"key": "surveyor_name", "label": "Surveyor Name", "type": "text", "source": "manual", "default": ""},
            {"key": "surveyor_license", "label": "Surveyor License No.", "type": "text", "source": "manual", "default": ""},
            {"key": "organization_name", "label": "Organization Name", "type": "text", "source": "manual", "default": "GWS Surveyors Ltd"},
            {"key": "coordinates_list", "label": "Coordinates List", "type": "text", "source": "project", "default": ""},
            {"key": "beacons_list", "label": "Beacons Description", "type": "text", "source": "project", "default": ""},
            {"key": "preparation_date", "label": "Preparation Date", "type": "date", "source": "manual", "default": ""},
        ],
        "page_size": "A4",
        "orientation": "portrait",
        "font_family": "Inter",
        "primary_color": "#059669",
        "is_active": True,
        "is_default": True,
        "version": 1,
        "created_by": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "srt-topographic",
        "name": "Topographic Survey Report",
        "slug": "topographic-survey-report",
        "description": "Comprehensive topographic survey report for engineering design, site planning, and development projects.",
        "report_type": "topographic",
        "category": "survey",
        "sections": [
            {"id": "s1", "title": "Cover Page", "type": "cover", "content": "Topographic Survey Report\n{{project_title}}\n{{district}}, Uganda", "fields": [], "required": True},
            {"id": "s2", "title": "Project Overview", "type": "text", "content": "This topographic survey was commissioned by {{client_name}} (Ref: {{client_ref}}) for {{project_title}}. Survey date: {{survey_date}}.", "fields": [], "required": True},
            {"id": "s3", "title": "Site Description", "type": "text", "content": "Location: {{village}}, {{parish}}, {{sub_county}}, {{district}} District, Uganda.", "fields": [], "required": True},
            {"id": "s4", "title": "Control Survey", "type": "text", "content": "Datum: WGS84\nProjection: UTM Zone 36N\nVertical Datum: Mean Sea Level (MSL)", "fields": [], "required": True},
            {"id": "s5", "title": "Topographic Features", "type": "text", "content": "Natural and man-made features surveyed and mapped.", "fields": [], "required": True},
            {"id": "s6", "title": "Contour Information", "type": "text", "content": "Contour Interval and elevation range details.", "fields": [], "required": True},
            {"id": "s7", "title": "Utilities & Infrastructure", "type": "text", "content": "Utilities and infrastructure identified within the survey area.", "fields": [], "required": False},
            {"id": "s8", "title": "Deliverables", "type": "text", "content": "Topographic Survey Plan, DTM, Contour Plan, Coordinate Schedule, Digital Data.", "fields": [], "required": True},
            {"id": "s9", "title": "Certification", "type": "certification", "content": "I hereby certify that this topographic survey was carried out under my direct supervision.\n\nSigned: ________________________\nName: {{surveyor_name}}\nLicense No: {{surveyor_license}}\nDate: {{preparation_date}}\n\nFor and on behalf of {{organization_name}}", "fields": [], "required": True},
        ],
        "header_text": "TOPOGRAPHIC SURVEY REPORT — {{project_ref}}",
        "footer_text": "Confidential — Prepared by {{organization_name}} — {{preparation_date}}",
        "logo_position": "left",
        "variables": [
            {"key": "client_name", "label": "Client Name", "type": "text", "source": "client", "default": ""},
            {"key": "client_ref", "label": "Client Reference", "type": "text", "source": "client", "default": ""},
            {"key": "project_ref", "label": "Project Reference", "type": "text", "source": "project", "default": ""},
            {"key": "project_title", "label": "Project Title", "type": "text", "source": "project", "default": ""},
            {"key": "district", "label": "District", "type": "text", "source": "project", "default": ""},
            {"key": "sub_county", "label": "Sub-County", "type": "text", "source": "project", "default": ""},
            {"key": "parish", "label": "Parish", "type": "text", "source": "project", "default": ""},
            {"key": "village", "label": "Village", "type": "text", "source": "project", "default": ""},
            {"key": "area_hectares", "label": "Area (Hectares)", "type": "number", "source": "project", "default": ""},
            {"key": "survey_date", "label": "Survey Date", "type": "date", "source": "manual", "default": ""},
            {"key": "surveyor_name", "label": "Surveyor Name", "type": "text", "source": "manual", "default": ""},
            {"key": "surveyor_license", "label": "Surveyor License No.", "type": "text", "source": "manual", "default": ""},
            {"key": "organization_name", "label": "Organization Name", "type": "text", "source": "manual", "default": "GWS Surveyors Ltd"},
            {"key": "preparation_date", "label": "Preparation Date", "type": "date", "source": "manual", "default": ""},
        ],
        "page_size": "A4",
        "orientation": "portrait",
        "font_family": "Inter",
        "primary_color": "#0284c7",
        "is_active": True,
        "is_default": True,
        "version": 1,
        "created_by": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "srt-boundary",
        "name": "Boundary Dispute Report",
        "slug": "boundary-dispute-report",
        "description": "Professional boundary dispute resolution report for contested land boundaries. Suitable for legal proceedings.",
        "report_type": "boundary",
        "category": "compliance",
        "sections": [
            {"id": "s1", "title": "Cover Page", "type": "cover", "content": "Boundary Dispute Investigation Report\n{{project_title}}\n{{district}}, Uganda", "fields": [], "required": True},
            {"id": "s2", "title": "Background", "type": "text", "content": "This report has been prepared following a boundary dispute regarding land at {{village}}, {{parish}}, {{district}}.", "fields": [], "required": True},
            {"id": "s3", "title": "Claimant Details", "type": "text", "content": "Claimant: {{client_name}} (Ref: {{client_ref}})\nProperty: {{project_title}}\nArea: {{area_hectares}} Hectares", "fields": [], "required": True},
            {"id": "s4", "title": "Disputed Area Description", "type": "text", "content": "The disputed area is described as follows.", "fields": [], "required": True},
            {"id": "s5", "title": "Evidence Review", "type": "text", "content": "Title documents, survey plans, and physical evidence examined.", "fields": [], "required": True},
            {"id": "s6", "title": "Survey Findings", "type": "text", "content": "A resurvey was carried out on {{survey_date}}.", "fields": [], "required": True},
            {"id": "s7", "title": "Boundary Determination", "type": "text", "content": "Based on evidence and survey findings, the boundary is determined.", "fields": [], "required": True},
            {"id": "s8", "title": "Recommendations", "type": "text", "content": "The determined boundary should be accepted and demarcated with permanent beacons.", "fields": [], "required": False},
            {"id": "s9", "title": "Professional Opinion", "type": "certification", "content": "In my professional opinion, the boundary is as described in this report.\n\nSigned: ________________________\nName: {{surveyor_name}}\nLicense No: {{surveyor_license}}\nDate: {{preparation_date}}\n\nFor and on behalf of {{organization_name}}", "fields": [], "required": True},
        ],
        "header_text": "BOUNDARY DISPUTE REPORT — {{project_ref}}",
        "footer_text": "Confidential — Legal Document — Prepared by {{organization_name}}",
        "logo_position": "left",
        "variables": [
            {"key": "client_name", "label": "Client Name", "type": "text", "source": "client", "default": ""},
            {"key": "client_ref", "label": "Client Reference", "type": "text", "source": "client", "default": ""},
            {"key": "project_ref", "label": "Project Reference", "type": "text", "source": "project", "default": ""},
            {"key": "project_title", "label": "Project Title", "type": "text", "source": "project", "default": ""},
            {"key": "district", "label": "District", "type": "text", "source": "project", "default": ""},
            {"key": "sub_county", "label": "Sub-County", "type": "text", "source": "project", "default": ""},
            {"key": "parish", "label": "Parish", "type": "text", "source": "project", "default": ""},
            {"key": "village", "label": "Village", "type": "text", "source": "project", "default": ""},
            {"key": "area_hectares", "label": "Area (Hectares)", "type": "number", "source": "project", "default": ""},
            {"key": "survey_date", "label": "Survey Date", "type": "date", "source": "manual", "default": ""},
            {"key": "surveyor_name", "label": "Surveyor Name", "type": "text", "source": "manual", "default": ""},
            {"key": "surveyor_license", "label": "Surveyor License No.", "type": "text", "source": "manual", "default": ""},
            {"key": "organization_name", "label": "Organization Name", "type": "text", "source": "manual", "default": "GWS Surveyors Ltd"},
            {"key": "coordinates_list", "label": "Coordinates List", "type": "text", "source": "project", "default": ""},
            {"key": "beacons_list", "label": "Beacons Description", "type": "text", "source": "project", "default": ""},
            {"key": "preparation_date", "label": "Preparation Date", "type": "date", "source": "manual", "default": ""},
        ],
        "page_size": "A4",
        "orientation": "portrait",
        "font_family": "Inter",
        "primary_color": "#dc2626",
        "is_active": True,
        "is_default": True,
        "version": 1,
        "created_by": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "srt-inspection",
        "name": "General Survey Inspection",
        "slug": "general-survey-inspection",
        "description": "Quick inspection report template for site visits, property assessments, and general survey observations.",
        "report_type": "general",
        "category": "inspection",
        "sections": [
            {"id": "s1", "title": "Cover Page", "type": "cover", "content": "Survey Inspection Report\n{{project_title}}\n{{district}}, Uganda", "fields": [], "required": True},
            {"id": "s2", "title": "Inspection Details", "type": "text", "content": "Date: {{survey_date}}\nInspector: {{surveyor_name}}\nLicense No: {{surveyor_license}}\nClient: {{client_name}} (Ref: {{client_ref}})\nProject Ref: {{project_ref}}", "fields": [], "required": True},
            {"id": "s3", "title": "Property Details", "type": "text", "content": "Location: {{village}}, {{parish}}, {{sub_county}}, {{district}}\nArea: {{area_hectares}} Hectares", "fields": [], "required": True},
            {"id": "s4", "title": "Observations", "type": "text", "content": "Boundary Status: [Intact/Disputed/Unknown]\nBeacon Condition: [Good/Fair/Poor/Missing]\nEncroachments: [None/Details]", "fields": [], "required": True},
            {"id": "s5", "title": "Findings", "type": "text", "content": "Key findings from the inspection.", "fields": [], "required": True},
            {"id": "s6", "title": "Photographs", "type": "image", "content": "[Site photographs to be attached]", "fields": [], "required": False},
            {"id": "s7", "title": "Conclusion", "type": "text", "content": "Based on the inspection on {{survey_date}}.", "fields": [], "required": True},
            {"id": "s8", "title": "Sign-off", "type": "certification", "content": "I confirm that the inspection was carried out as described.\n\nInspector: ________________________\nName: {{surveyor_name}}\nLicense No: {{surveyor_license}}\nDate: {{preparation_date}}\n\n{{organization_name}}", "fields": [], "required": True},
        ],
        "header_text": "SURVEY INSPECTION REPORT — {{project_ref}}",
        "footer_text": "Prepared by {{organization_name}} — {{preparation_date}}",
        "logo_position": "left",
        "variables": [
            {"key": "client_name", "label": "Client Name", "type": "text", "source": "client", "default": ""},
            {"key": "client_ref", "label": "Client Reference", "type": "text", "source": "client", "default": ""},
            {"key": "project_ref", "label": "Project Reference", "type": "text", "source": "project", "default": ""},
            {"key": "project_title", "label": "Project Title", "type": "text", "source": "project", "default": ""},
            {"key": "district", "label": "District", "type": "text", "source": "project", "default": ""},
            {"key": "sub_county", "label": "Sub-County", "type": "text", "source": "project", "default": ""},
            {"key": "parish", "label": "Parish", "type": "text", "source": "project", "default": ""},
            {"key": "village", "label": "Village", "type": "text", "source": "project", "default": ""},
            {"key": "area_hectares", "label": "Area (Hectares)", "type": "number", "source": "project", "default": ""},
            {"key": "survey_date", "label": "Survey Date", "type": "date", "source": "manual", "default": ""},
            {"key": "surveyor_name", "label": "Surveyor Name", "type": "text", "source": "manual", "default": ""},
            {"key": "surveyor_license", "label": "Surveyor License No.", "type": "text", "source": "manual", "default": ""},
            {"key": "organization_name", "label": "Organization Name", "type": "text", "source": "manual", "default": "GWS Surveyors Ltd"},
            {"key": "preparation_date", "label": "Preparation Date", "type": "date", "source": "manual", "default": ""},
        ],
        "page_size": "A4",
        "orientation": "portrait",
        "font_family": "Inter",
        "primary_color": "#d97706",
        "is_active": True,
        "is_default": True,
        "version": 1,
        "created_by": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
]

def _generate_report_html(template, report_data):
    """Generate HTML content from template and data"""
    import re
    primary_color = template.get("primary_color", "#059669")
    sections = template.get("sections", [])
    
    html_sections = []
    for index, section in enumerate(sections):
        content = section.get("content", "")
        # Replace variables
        if report_data:
            for key, value in report_data.items():
                content = content.replace("{{" + key + "}}", str(value) if value else "")
        
        section_type = section.get("type", "text")
        title = section.get("title", "")
        
        if section_type == "cover":
            html_sections.append(f'''
            <div style="page-break-after: always; text-align: center; padding-top: 120px;">
              <div style="margin-bottom: 40px;">
                <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: {primary_color}; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 32px; font-weight: bold;">GWS</span>
                </div>
              </div>
              <h1 style="font-size: 28px; color: {primary_color}; margin-bottom: 12px; font-weight: 700;">{template.get("name", "Survey Report")}</h1>
              <div style="width: 60px; height: 3px; background: {primary_color}; margin: 20px auto;"></div>
              <p style="font-size: 16px; color: #374151; white-space: pre-line; margin-top: 24px;">{content}</p>
              <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 14px; color: #6b7280;">Prepared by: {report_data.get("organization_name", "GWS Surveyors Ltd")}</p>
                <p style="font-size: 14px; color: #6b7280;">Date: {report_data.get("preparation_date", "")}</p>
              </div>
            </div>''')
        elif section_type == "certification":
            html_sections.append(f'''
            <div style="margin-top: 40px; padding: 24px; border: 2px solid {primary_color}; border-radius: 8px;">
              <h2 style="font-size: 18px; color: {primary_color}; margin-bottom: 16px; text-transform: uppercase;">{title}</h2>
              <div style="font-size: 14px; line-height: 1.8; white-space: pre-line;">{content}</div>
            </div>''')
        elif section_type == "coordinates":
            coords = report_data.get("coordinates_list", "[Coordinate data to be entered]")
            html_sections.append(f'''
            <div style="margin-bottom: 24px;">
              <h2 style="font-size: 18px; color: {primary_color}; border-bottom: 2px solid {primary_color}; padding-bottom: 8px; margin-bottom: 16px;">{index + 1}. {title}</h2>
              <p style="font-size: 14px; color: #374151; margin-bottom: 16px;">{content}</p>
              <div style="font-size: 13px; white-space: pre-line; font-family: monospace; background: #f9fafb; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;">{coords}</div>
            </div>''')
        elif section_type == "image":
            html_sections.append(f'''
            <div style="margin-bottom: 24px;">
              <h2 style="font-size: 18px; color: {primary_color}; border-bottom: 2px solid {primary_color}; padding-bottom: 8px; margin-bottom: 16px;">{index + 1}. {title}</h2>
              <div style="background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; padding: 40px; text-align: center; color: #9ca3af; font-size: 14px;">{content}</div>
            </div>''')
        else:
            html_sections.append(f'''
            <div style="margin-bottom: 24px;">
              <h2 style="font-size: 18px; color: {primary_color}; border-bottom: 2px solid {primary_color}; padding-bottom: 8px; margin-bottom: 16px;">{index + 1}. {title}</h2>
              <div style="font-size: 14px; line-height: 1.8; white-space: pre-line;">{content}</div>
            </div>''')
    
    header_text = template.get("header_text", "")
    footer_text = template.get("footer_text", "")
    if report_data:
        for key, value in report_data.items():
            header_text = header_text.replace("{{" + key + "}}", str(value) if value else "")
            footer_text = footer_text.replace("{{" + key + "}}", str(value) if value else "")
    
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{template.get("name", "Survey Report")}</title>
  <style>
    @page {{ size: {template.get("page_size", "A4")} {template.get("orientation", "portrait")}; margin: 2cm; }}
    body {{ font-family: '{template.get("font_family", "Inter")}', -apple-system, BlinkMacSystemFont, sans-serif; color: #1f2937; line-height: 1.6; max-width: 210mm; margin: 0 auto; padding: 20px; }}
    @media print {{ body {{ padding: 0; }} }}
  </style>
</head>
<body>
  {f'<div style="text-align: center; padding: 12px; border-bottom: 2px solid {primary_color}; margin-bottom: 20px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">{header_text}</div>' if header_text else ''}
  {"".join(html_sections)}
  {f'<div style="text-align: center; padding: 12px; border-top: 1px solid #e5e7eb; margin-top: 40px; font-size: 11px; color: #9ca3af;">{footer_text}</div>' if footer_text else ''}
</body>
</html>'''

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


def init_workflow_data():
    """Initialize workflow definitions from cached API data"""
    global dynamic_workflow_defs, dynamic_workflow_instances, dynamic_workflow_transitions

    wf_data = api_cache.get("workflows", [])
    if isinstance(wf_data, list) and len(wf_data) > 0:
        dynamic_workflow_defs = wf_data
        for wf in dynamic_workflow_defs:
            for inst in wf.get("instances", []):
                inst_copy = copy.deepcopy(inst)
                inst_copy["workflow_definition_id"] = wf["id"]
                inst_copy["_wfName"] = wf["name"]
                inst_copy["_wfSteps"] = wf.get("steps", [])
                for t in inst_copy.get("transitions", []):
                    t["workflow_instance_id"] = inst["id"]
                    dynamic_workflow_transitions.append(t)
                dynamic_workflow_instances.append(inst_copy)


# Initialize dynamic data
init_dynamic_data()
init_workflow_data()

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
        
        # ── Workflow Definitions CRUD ──
        if path == "/api/workflows":
            new_wf = self._create_workflow(body_json)
            if isinstance(new_wf, dict) and "error" in new_wf:
                self.send_json(new_wf, 409)
            else:
                self.send_json(new_wf, 201)
            return
        
        # ── Workflow Instances CRUD ──
        if path == "/api/workflow-instances":
            new_inst = self._create_workflow_instance(body_json)
            if isinstance(new_inst, dict) and "error" in new_inst:
                self.send_json(new_inst, 400)
            else:
                self.send_json(new_inst, 201)
            return
        
        # ── Workflow Steps Bulk Update ──
        if path.startswith("/api/workflows/") and path.endswith("/steps"):
            parts = path.strip("/").split("/")
            if len(parts) >= 4:
                wf_id = parts[2]
                result = self._update_workflow_steps(wf_id, body_json)
                if isinstance(result, dict) and "error" in result:
                    self.send_json(result, 404)
                else:
                    self.send_json(result, 201)
                return
        
        # ── Survey Report Templates POST ──
        if path == "/api/survey-report-templates":
            global dynamic_survey_templates
            if not dynamic_survey_templates:
                dynamic_survey_templates = copy.deepcopy(DEFAULT_SURVEY_TEMPLATES)
            name = body_json.get("name", "")
            slug = body_json.get("slug", "")
            if not name or not slug:
                self.send_json({"error": "Name and slug are required"}, 400)
                return
            if any(t.get("slug") == slug for t in dynamic_survey_templates):
                self.send_json({"error": "Template with this slug already exists"}, 409)
                return
            now = datetime.now(timezone.utc).isoformat()
            tpl = {
                "id": f"srt-{slug[:20]}-{str(uuid.uuid4())[:8]}",
                "organization_id": body_json.get("organization_id"),
                "name": name,
                "slug": slug,
                "description": body_json.get("description"),
                "report_type": body_json.get("report_type", "general"),
                "category": body_json.get("category", "survey"),
                "sections": body_json.get("sections", []),
                "header_text": body_json.get("header_text"),
                "footer_text": body_json.get("footer_text"),
                "logo_position": body_json.get("logo_position", "left"),
                "variables": body_json.get("variables"),
                "page_size": body_json.get("page_size", "A4"),
                "orientation": body_json.get("orientation", "portrait"),
                "font_family": body_json.get("font_family", "Inter"),
                "primary_color": body_json.get("primary_color", "#059669"),
                "is_active": body_json.get("is_active", True),
                "is_default": body_json.get("is_default", False),
                "version": 1,
                "created_by": None,
                "created_at": now,
                "updated_at": now,
            }
            dynamic_survey_templates.append(tpl)
            self.send_json(tpl, 201)
            return
        
        # ── Survey Reports POST ──
        if path == "/api/survey-reports":
            global dynamic_survey_reports
            template_id = body_json.get("template_id", "")
            if not template_id:
                self.send_json({"error": "template_id is required"}, 400)
                return
            tpl = next((t for t in dynamic_survey_templates if t["id"] == template_id), None)
            if not tpl:
                self.send_json({"error": "Template not found"}, 404)
                return
            now = datetime.now(timezone.utc).isoformat()
            count = len(dynamic_survey_reports) + 1
            report_number = f"SR-{str(count).zfill(6)}-{datetime.now().year}"
            rpt = {
                "id": f"sr-{str(uuid.uuid4())[:12]}",
                "organization_id": body_json.get("organization_id"),
                "template_id": template_id,
                "project_id": body_json.get("project_id"),
                "client_id": body_json.get("client_id"),
                "title": body_json.get("title", f"{tpl['name']} - {report_number}"),
                "report_number": report_number,
                "status": "draft",
                "data": body_json.get("data", {}),
                "generated_content": None,
                "pdf_path": None,
                "prepared_by": body_json.get("prepared_by"),
                "reviewed_by": None,
                "approved_by": None,
                "reviewed_at": None,
                "approved_at": None,
                "delivered_at": None,
                "notes": body_json.get("notes"),
                "template": {"name": tpl["name"], "report_type": tpl["report_type"], "primary_color": tpl["primary_color"]},
                "created_at": now,
                "updated_at": now,
            }
            dynamic_survey_reports.append(rpt)
            self.send_json(rpt, 201)
            return
        
        # ── Survey Reports Generate POST ──
        if path == "/api/survey-reports/generate":
            template_id = body_json.get("template_id", "")
            if not template_id:
                self.send_json({"error": "template_id is required"}, 400)
                return
            tpl = next((t for t in dynamic_survey_templates if t["id"] == template_id), None)
            if not tpl:
                self.send_json({"error": "Template not found"}, 404)
                return
            
            # Build merged data
            merged_data = {}
            variables = tpl.get("variables", []) or []
            for v in variables:
                merged_data[v["key"]] = v.get("default", "")
            
            # Merge project data
            project_id = body_json.get("project_id")
            if project_id:
                projects = api_cache.get("projects", [])
                try:
                    pid = int(project_id)
                    project = next((p for p in projects if p.get("id") == pid), None)
                except:
                    project = None
                if project:
                    merged_data["project_ref"] = project.get("project_ref", merged_data.get("project_ref", ""))
                    merged_data["project_title"] = project.get("title", merged_data.get("project_title", ""))
                    merged_data["district"] = project.get("district", merged_data.get("district", ""))
                    merged_data["sub_county"] = project.get("sub_county", merged_data.get("sub_county", ""))
                    merged_data["parish"] = project.get("parish", merged_data.get("parish", ""))
                    merged_data["village"] = project.get("village", merged_data.get("village", ""))
                    merged_data["area_hectares"] = str(project.get("area_hectares", "")) if project.get("area_hectares") else merged_data.get("area_hectares", "")
                    # Merge client data from project
                    client = project.get("client", {})
                    if client:
                        client_name = client.get("company_name") if client.get("client_type") == "company" else " ".join(filter(None, [client.get("first_name"), client.get("last_name")]))
                        merged_data["client_name"] = client_name or merged_data.get("client_name", "")
                        merged_data["client_ref"] = client.get("client_ref", merged_data.get("client_ref", ""))
            
            # Override with custom data
            custom_data = body_json.get("custom_data", {})
            if custom_data:
                merged_data.update(custom_data)
            
            # Set defaults
            if not merged_data.get("preparation_date"):
                merged_data["preparation_date"] = datetime.now().strftime("%d %B %Y")
            if not merged_data.get("survey_date"):
                merged_data["survey_date"] = datetime.now().strftime("%d %B %Y")
            
            # Generate HTML
            html = _generate_report_html(tpl, merged_data)
            
            self.send_json({
                "template_id": template_id,
                "data": merged_data,
                "generated_content": html,
                "variables": tpl.get("variables"),
                "sections": tpl.get("sections"),
            })
            return
        
        # ── Survey Reports PDF POST ──
        if path.startswith("/api/survey-reports/") and path.endswith("/pdf"):
            parts_path = path.strip("/").split("/")
            if len(parts_path) >= 4:
                rpt_id = parts_path[2]
                rpt = next((r for r in dynamic_survey_reports if r["id"] == rpt_id), None)
                if not rpt:
                    self.send_json({"error": "Report not found"}, 404)
                    return
                # Generate HTML if not already present
                if not rpt.get("generated_content"):
                    tpl = next((t for t in dynamic_survey_templates if t["id"] == rpt.get("template_id")), None)
                    if tpl:
                        html = _generate_report_html(tpl, rpt.get("data", {}))
                        rpt["generated_content"] = html
                self.send_json({"html": rpt.get("generated_content", ""), "report_number": rpt.get("report_number", "")})
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
            
            # ── Workflow Definitions PATCH ──
            if endpoint == "workflows":
                updated = self._update_workflow(item_id, body_json)
                if isinstance(updated, dict) and "error" in updated:
                    self.send_json(updated, 404)
                else:
                    self.send_json(updated)
                return
            
            # ── Workflow Instances PATCH (advance/cancel/reject) ──
            if endpoint == "workflow-instances":
                result = self._update_workflow_instance(item_id, body_json)
                if isinstance(result, dict) and "error" in result:
                    self.send_json(result, 400)
                else:
                    self.send_json(result)
                return
            
            # ── Survey Report Templates PATCH ──
            if endpoint == "survey-report-templates":
                tpl = next((t for t in dynamic_survey_templates if t["id"] == item_id), None)
                if not tpl:
                    self.send_json({"error": "Template not found"}, 404)
                    return
                now = datetime.now(timezone.utc).isoformat()
                allowed = ["name", "slug", "description", "report_type", "category", "sections", "variables",
                          "header_text", "footer_text", "logo_position", "page_size", "orientation",
                          "font_family", "primary_color", "is_active", "is_default", "version"]
                for key in allowed:
                    if key in body_json:
                        tpl[key] = body_json[key]
                tpl["updated_at"] = now
                self.send_json(tpl)
                return
            
            # ── Survey Reports PATCH ──
            if endpoint == "survey-reports":
                rpt = next((r for r in dynamic_survey_reports if r["id"] == item_id), None)
                if not rpt:
                    self.send_json({"error": "Report not found"}, 404)
                    return
                now = datetime.now(timezone.utc).isoformat()
                allowed = ["title", "data", "generated_content", "status", "notes",
                          "prepared_by", "reviewed_by", "approved_by"]
                for key in allowed:
                    if key in body_json:
                        rpt[key] = body_json[key]
                # Handle status transitions
                if body_json.get("status") == "review":
                    rpt["reviewed_at"] = now
                elif body_json.get("status") == "approved":
                    rpt["approved_at"] = now
                elif body_json.get("status") == "delivered":
                    rpt["delivered_at"] = now
                rpt["updated_at"] = now
                self.send_json(rpt)
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
            
            # ── Workflow Definitions DELETE ──
            if endpoint == "workflows":
                result = self._delete_workflow(item_id)
                if isinstance(result, dict) and "error" in result:
                    self.send_json(result, 409)
                else:
                    self.send_json({"success": True})
                return
            
            # ── Survey Report Templates DELETE ──
            if endpoint == "survey-report-templates":
                tpl = next((t for t in dynamic_survey_templates if t["id"] == item_id), None)
                if not tpl:
                    self.send_json({"error": "Template not found"}, 404)
                    return
                dynamic_survey_templates[:] = [t for t in dynamic_survey_templates if t["id"] != item_id]
                self.send_json({"success": True, "id": item_id})
                return
            
            # ── Survey Reports DELETE ──
            if endpoint == "survey-reports":
                rpt = next((r for r in dynamic_survey_reports if r["id"] == item_id), None)
                if not rpt:
                    self.send_json({"error": "Report not found"}, 404)
                    return
                dynamic_survey_reports[:] = [r for r in dynamic_survey_reports if r["id"] != item_id]
                self.send_json({"success": True, "id": item_id})
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
    
    # ── Workflow CRUD Methods ──
    
    def _create_workflow(self, body):
        global dynamic_workflow_defs
        name = body.get("name", "")
        if not name:
            return {"error": "Name is required"}
        
        slug = name.lower().replace(" ", "-").replace("_", "-")
        # Remove non-alphanumeric
        slug = ''.join(c for c in slug if c.isalnum() or c == '-')
        
        if any(w["slug"] == slug for w in dynamic_workflow_defs):
            return {"error": "A workflow with this name already exists"}
        
        wf_id = f"wf-{slug}"
        now = datetime.now(timezone.utc).isoformat()
        
        steps_data = body.get("steps", [])
        steps = []
        for idx, step in enumerate(steps_data):
            step_slug = step.get("name", "").lower().replace(" ", "-").replace("_", "-")
            step_slug = ''.join(c for c in step_slug if c.isalnum() or c == '-')
            steps.append({
                "id": str(uuid.uuid4()),
                "workflow_definition_id": wf_id,
                "name": step.get("name", ""),
                "slug": step_slug,
                "step_order": idx + 1,
                "step_type": step.get("step_type", "approval"),
                "assignee_type": step.get("assignee_type", "role"),
                "assignee_id": step.get("assignee_id"),
                "auto_assign": step.get("auto_assign", False),
                "is_required": step.get("is_required", True),
                "sla_hours": step.get("sla_hours"),
                "config": step.get("config"),
                "created_at": now,
                "updated_at": now,
            })
        
        wf = {
            "id": wf_id,
            "organization_id": None,
            "name": name,
            "slug": slug,
            "description": body.get("description"),
            "version": 1,
            "is_active": body.get("is_active", True),
            "trigger_type": body.get("trigger_type", "manual"),
            "trigger_config": body.get("trigger_config"),
            "steps": steps,
            "instances": [],
            "created_at": now,
            "updated_at": now,
        }
        
        dynamic_workflow_defs.append(wf)
        return wf
    
    def _update_workflow(self, wf_id, body):
        wf = next((w for w in dynamic_workflow_defs if w["id"] == wf_id), None)
        if not wf:
            return {"error": "Workflow not found"}
        
        now = datetime.now(timezone.utc).isoformat()
        for key in ["name", "description", "trigger_type", "trigger_config", "is_active", "version"]:
            if key in body:
                wf[key] = body[key]
        wf["updated_at"] = now
        return wf
    
    def _update_workflow_steps(self, wf_id, body):
        wf = next((w for w in dynamic_workflow_defs if w["id"] == wf_id), None)
        if not wf:
            return {"error": "Workflow not found"}
        
        steps_data = body.get("steps", [])
        now = datetime.now(timezone.utc).isoformat()
        steps = []
        for idx, step in enumerate(steps_data):
            step_slug = step.get("name", "").lower().replace(" ", "-").replace("_", "-")
            step_slug = ''.join(c for c in step_slug if c.isalnum() or c == '-')
            steps.append({
                "id": step.get("id") or str(uuid.uuid4()),
                "workflow_definition_id": wf_id,
                "name": step.get("name", ""),
                "slug": step_slug,
                "step_order": idx + 1,
                "step_type": step.get("step_type", "approval"),
                "assignee_type": step.get("assignee_type", "role"),
                "assignee_id": step.get("assignee_id"),
                "auto_assign": step.get("auto_assign", False),
                "is_required": step.get("is_required", True),
                "sla_hours": step.get("sla_hours"),
                "config": step.get("config"),
                "created_at": step.get("created_at", now),
                "updated_at": now,
            })
        
        wf["steps"] = steps
        wf["updated_at"] = now
        return steps
    
    def _delete_workflow(self, wf_id):
        global dynamic_workflow_defs, dynamic_workflow_instances
        wf = next((w for w in dynamic_workflow_defs if w["id"] == wf_id), None)
        if not wf:
            return {"error": "Workflow not found"}
        
        active = [i for i in dynamic_workflow_instances if i["workflow_definition_id"] == wf_id and i.get("status") in ("pending", "in_progress")]
        if active:
            return {"error": "Cannot delete workflow with active instances"}
        
        dynamic_workflow_defs = [w for w in dynamic_workflow_defs if w["id"] != wf_id]
        dynamic_workflow_instances = [i for i in dynamic_workflow_instances if i["workflow_definition_id"] != wf_id]
        return True
    
    def _create_workflow_instance(self, body):
        global dynamic_workflow_instances, dynamic_workflow_transitions
        wf_def_id = body.get("workflow_definition_id", "")
        subject_type = body.get("subject_type", "")
        subject_id = body.get("subject_id", "")
        
        if not wf_def_id or not subject_type or not subject_id:
            return {"error": "workflow_definition_id, subject_type, and subject_id are required"}
        
        wf = next((w for w in dynamic_workflow_defs if w["id"] == wf_def_id), None)
        if not wf:
            return {"error": "Workflow definition not found"}
        
        if not wf.get("is_active", True):
            return {"error": "Cannot start an inactive workflow"}
        
        if not wf.get("steps"):
            return {"error": "Workflow has no steps defined"}
        
        first_step = wf["steps"][0]
        inst_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        inst = {
            "id": inst_id,
            "workflow_definition_id": wf_def_id,
            "organization_id": body.get("organization_id"),
            "branch_id": body.get("branch_id"),
            "subject_type": subject_type,
            "subject_id": subject_id,
            "status": "pending",
            "current_step_id": first_step["id"],
            "current_step_order": first_step["step_order"],
            "started_at": now,
            "completed_at": None,
            "cancelled_at": None,
            "cancellation_reason": None,
            "metadata": body.get("metadata"),
            "transitions": [],
            "workflowDefinition": {"id": wf["id"], "name": wf["name"], "steps": wf["steps"]},
            "created_at": now,
            "updated_at": now,
        }
        
        dynamic_workflow_instances.append(inst)
        
        # Also add to workflow's instances
        wf["instances"].append({
            "id": inst_id,
            "workflow_definition_id": wf_def_id,
            "subject_type": subject_type,
            "subject_id": subject_id,
            "status": "pending",
            "current_step_id": first_step["id"],
            "current_step_order": first_step["step_order"],
            "started_at": now,
            "metadata": body.get("metadata"),
            "transitions": [],
        })
        
        return inst
    
    def _update_workflow_instance(self, inst_id, body):
        global dynamic_workflow_instances, dynamic_workflow_transitions
        
        inst = next((i for i in dynamic_workflow_instances if i["id"] == inst_id), None)
        if not inst:
            return {"error": "Instance not found"}
        
        action = body.get("action", "")
        now = datetime.now(timezone.utc).isoformat()
        
        if action == "cancel":
            inst["status"] = "cancelled"
            inst["cancelled_at"] = now
            inst["cancellation_reason"] = body.get("cancellation_reason")
            inst["updated_at"] = now
            return inst
        
        if action in ("advance", "transition"):
            if inst["status"] in ("completed", "cancelled"):
                return {"error": "Cannot advance a completed or cancelled workflow"}
            
            wf_def = inst.get("workflowDefinition", {})
            steps = wf_def.get("steps", inst.get("_wfSteps", []))
            current_step = next((s for s in steps if s["id"] == inst["current_step_id"]), None)
            
            to_step_id = body.get("to_step_id")
            if to_step_id:
                next_step = next((s for s in steps if s["id"] == to_step_id), None)
                if not next_step:
                    return {"error": "Target step not found"}
            else:
                next_step = next((s for s in steps if s["step_order"] == (current_step["step_order"] + 1 if current_step else 1)), None) if current_step else None
            
            # Create transition
            transition = {
                "id": str(uuid.uuid4()),
                "workflow_instance_id": inst_id,
                "from_step_id": inst["current_step_id"],
                "to_step_id": next_step["id"] if next_step else inst["current_step_id"],
                "action": "approved" if action == "advance" else "transitioned",
                "performed_by": body.get("performed_by"),
                "notes": body.get("notes"),
                "performed_at": now,
            }
            
            if "transitions" not in inst:
                inst["transitions"] = []
            inst["transitions"].append(transition)
            
            # Add fromStep/toStep names to transition
            from_step = next((s for s in steps if s["id"] == inst["current_step_id"]), None)
            transition["fromStep"] = {"id": from_step["id"], "name": from_step["name"]} if from_step else None
            transition["toStep"] = {"id": next_step["id"], "name": next_step["name"]} if next_step else None
            
            is_completed = not next_step or (current_step and current_step.get("step_order") == len(steps) and not to_step_id)
            
            if next_step:
                inst["current_step_id"] = next_step["id"]
                inst["current_step_order"] = next_step["step_order"]
            
            inst["status"] = "completed" if is_completed else "in_progress"
            if is_completed:
                inst["completed_at"] = now
            inst["updated_at"] = now
            
            return inst
        
        if action == "reject":
            transition = {
                "id": str(uuid.uuid4()),
                "workflow_instance_id": inst_id,
                "from_step_id": inst["current_step_id"],
                "to_step_id": inst["current_step_id"],
                "action": "rejected",
                "performed_by": body.get("performed_by"),
                "notes": body.get("notes"),
                "performed_at": now,
            }
            
            if "transitions" not in inst:
                inst["transitions"] = []
            inst["transitions"].append(transition)
            
            inst["status"] = "cancelled"
            inst["cancelled_at"] = now
            inst["cancellation_reason"] = body.get("notes", "Rejected")
            inst["updated_at"] = now
            return inst
        
        return {"error": "Unknown action"}
    
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
            
            # ── Workflow Definitions ──
            if endpoint == "workflows":
                if len(parts) >= 4 and parts[3] == "steps":
                    # /api/workflows/:id/steps
                    wf_id = parts[2]
                    wf = next((w for w in dynamic_workflow_defs if w["id"] == wf_id), None)
                    if wf:
                        self.send_json(wf.get("steps", []))
                    else:
                        self.send_json({"error": "Workflow not found"}, 404)
                elif len(parts) >= 3:
                    wf_id = parts[2]
                    wf = next((w for w in dynamic_workflow_defs if w["id"] == wf_id), None)
                    if wf:
                        self.send_json(wf)
                    else:
                        self.send_json({"error": "Workflow not found"}, 404)
                else:
                    self.send_json(dynamic_workflow_defs)
                return
            
            # ── Workflow Instances ──
            if endpoint == "workflow-instances":
                if len(parts) >= 3:
                    inst_id = parts[2]
                    inst = next((i for i in dynamic_workflow_instances if i["id"] == inst_id), None)
                    if inst:
                        self.send_json(inst)
                    else:
                        self.send_json({"error": "Instance not found"}, 404)
                else:
                    self.send_json(dynamic_workflow_instances)
                return
            
            # ── Survey Report Templates ──
            if endpoint == "survey-report-templates":
                global dynamic_survey_templates
                # Seed defaults if empty
                if not dynamic_survey_templates:
                    dynamic_survey_templates = copy.deepcopy(DEFAULT_SURVEY_TEMPLATES)
                
                if len(parts) >= 3:
                    tpl_id = parts[2]
                    tpl = next((t for t in dynamic_survey_templates if t["id"] == tpl_id), None)
                    if tpl:
                        tpl_copy = copy.deepcopy(tpl)
                        tpl_copy["_count"] = {"reports": sum(1 for r in dynamic_survey_reports if r.get("template_id") == tpl_id)}
                        self.send_json(tpl_copy)
                    else:
                        self.send_json({"error": "Template not found"}, 404)
                else:
                    result = []
                    for t in dynamic_survey_templates:
                        t_copy = copy.deepcopy(t)
                        t_copy["_count"] = {"reports": sum(1 for r in dynamic_survey_reports if r.get("template_id") == t["id"])}
                        result.append(t_copy)
                    self.send_json(result)
                return
            
            # ── Survey Reports ──
            if endpoint == "survey-reports":
                if len(parts) >= 4 and parts[3] == "pdf":
                    # /api/survey-reports/[id]/pdf - handled in POST
                    self.send_json({"error": "Use POST to generate PDF"}, 405)
                    return
                if len(parts) >= 3:
                    rpt_id = parts[2]
                    rpt = next((r for r in dynamic_survey_reports if r["id"] == rpt_id), None)
                    if rpt:
                        self.send_json(rpt)
                    else:
                        self.send_json({"error": "Report not found"}, 404)
                else:
                    self.send_json(dynamic_survey_reports)
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

class SingleHTTPServer(HTTPServer):
    """Single-threaded HTTP server - more stable in constrained environments"""
    allow_reuse_address = True
    timeout = 30

if __name__ == "__main__":
    server = SingleHTTPServer(("0.0.0.0", PORT), GWSHandler)
    print(f"GWS Platform V2 running on http://0.0.0.0:{PORT}")
    sys.stdout.flush()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()
