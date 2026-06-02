// GWS Platform V2 — Permission Constants & Role Definitions

// ── Permission Codes ──
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',

  // Clients
  CLIENTS_VIEW: 'clients:view',
  CLIENTS_EDIT: 'clients:edit',
  CLIENTS_DELETE: 'clients:delete',

  // Projects
  PROJECTS_VIEW: 'projects:view',
  PROJECTS_EDIT: 'projects:edit',
  PROJECTS_DELETE: 'projects:delete',

  // Approvals
  APPROVALS_VIEW: 'approvals:view',
  APPROVALS_EDIT: 'approvals:edit',

  // Finance
  FINANCE_VIEW: 'finance:view',
  FINANCE_EDIT: 'finance:edit',
  INVOICES_VIEW: 'invoices:view',
  INVOICES_EDIT: 'invoices:edit',

  // Workflows
  WORKFLOWS_VIEW: 'workflows:view',
  WORKFLOWS_EDIT: 'workflows:edit',

  // Field Sync
  FIELD_SYNC_VIEW: 'field-sync:view',
  FIELD_SYNC_EDIT: 'field-sync:edit',

  // Spatial
  SPATIAL_VIEW: 'spatial:view',
  SPATIAL_EDIT: 'spatial:edit',

  // AI
  AI_VIEW: 'ai:view',
  AI_EDIT: 'ai:edit',

  // Documents
  DOCUMENTS_VIEW: 'documents:view',
  DOCUMENTS_EDIT: 'documents:edit',

  // Communications
  COMMUNICATIONS_VIEW: 'communications:view',
  COMMUNICATIONS_EDIT: 'communications:edit',

  // Audit Trail
  AUDIT_VIEW: 'audit:view',

  // Organizations
  ORGANIZATIONS_VIEW: 'organizations:view',
  ORGANIZATIONS_EDIT: 'organizations:edit',

  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EDIT: 'reports:edit',

  // Survey Reports
  SURVEY_REPORTS_VIEW: 'survey-reports:view',
  SURVEY_REPORTS_EDIT: 'survey-reports:edit',

  // Roles & Permissions
  ROLES_VIEW: 'roles:view',
  ROLES_EDIT: 'roles:edit',

  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
} as const

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// ── Page to Permission Mapping ──
export const PAGE_PERMISSIONS: Record<string, PermissionCode[]> = {
  dashboard: [PERMISSIONS.DASHBOARD_VIEW],
  clients: [PERMISSIONS.CLIENTS_VIEW],
  projects: [PERMISSIONS.PROJECTS_VIEW],
  approvals: [PERMISSIONS.APPROVALS_VIEW],
  finance: [PERMISSIONS.FINANCE_VIEW],
  workflows: [PERMISSIONS.WORKFLOWS_VIEW],
  'field-sync': [PERMISSIONS.FIELD_SYNC_VIEW],
  spatial: [PERMISSIONS.SPATIAL_VIEW],
  ai: [PERMISSIONS.AI_VIEW],
  documents: [PERMISSIONS.DOCUMENTS_VIEW],
  communications: [PERMISSIONS.COMMUNICATIONS_VIEW],
  audit: [PERMISSIONS.AUDIT_VIEW],
  organizations: [PERMISSIONS.ORGANIZATIONS_VIEW],
  reports: [PERMISSIONS.REPORTS_VIEW],
  'survey-reports': [PERMISSIONS.SURVEY_REPORTS_VIEW],
  'role-permissions': [PERMISSIONS.ROLES_VIEW],
  settings: [PERMISSIONS.SETTINGS_VIEW],
}

// ── Page to Edit Permission Mapping (for create/edit actions) ──
export const PAGE_EDIT_PERMISSIONS: Record<string, PermissionCode> = {
  clients: PERMISSIONS.CLIENTS_EDIT,
  projects: PERMISSIONS.PROJECTS_EDIT,
  approvals: PERMISSIONS.APPROVALS_EDIT,
  finance: PERMISSIONS.FINANCE_EDIT,
  workflows: PERMISSIONS.WORKFLOWS_EDIT,
  'field-sync': PERMISSIONS.FIELD_SYNC_EDIT,
  spatial: PERMISSIONS.SPATIAL_EDIT,
  ai: PERMISSIONS.AI_EDIT,
  documents: PERMISSIONS.DOCUMENTS_EDIT,
  communications: PERMISSIONS.COMMUNICATIONS_EDIT,
  organizations: PERMISSIONS.ORGANIZATIONS_EDIT,
  reports: PERMISSIONS.REPORTS_EDIT,
  'survey-reports': PERMISSIONS.SURVEY_REPORTS_EDIT,
  'role-permissions': PERMISSIONS.ROLES_EDIT,
  settings: PERMISSIONS.SETTINGS_EDIT,
}

// ── Role Definitions ──
export const ROLE_DEFINITIONS: Record<string, {
  name: string
  display_name: string
  description: string
  color: string
  permissions: PermissionCode[]
}> = {
  admin: {
    name: 'admin',
    display_name: 'Administrator',
    description: 'Full access to all platform features and data',
    color: '#ef4444',
    permissions: Object.values(PERMISSIONS),
  },
  surveyor: {
    name: 'surveyor',
    display_name: 'Surveyor',
    description: 'Access to clients, projects, field operations, and reports',
    color: '#10b981',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.CLIENTS_VIEW, PERMISSIONS.CLIENTS_EDIT,
      PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_EDIT,
      PERMISSIONS.APPROVALS_VIEW,
      PERMISSIONS.FIELD_SYNC_VIEW, PERMISSIONS.FIELD_SYNC_EDIT,
      PERMISSIONS.SPATIAL_VIEW, PERMISSIONS.SPATIAL_EDIT,
      PERMISSIONS.DOCUMENTS_VIEW, PERMISSIONS.DOCUMENTS_EDIT,
      PERMISSIONS.COMMUNICATIONS_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.SURVEY_REPORTS_VIEW, PERMISSIONS.SURVEY_REPORTS_EDIT,
      PERMISSIONS.AI_VIEW,
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },
  reviewer: {
    name: 'reviewer',
    display_name: 'Reviewer',
    description: 'Access to approvals, reports, and document review',
    color: '#8b5cf6',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.CLIENTS_VIEW,
      PERMISSIONS.PROJECTS_VIEW,
      PERMISSIONS.APPROVALS_VIEW, PERMISSIONS.APPROVALS_EDIT,
      PERMISSIONS.DOCUMENTS_VIEW, PERMISSIONS.DOCUMENTS_EDIT,
      PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EDIT,
      PERMISSIONS.SURVEY_REPORTS_VIEW, PERMISSIONS.SURVEY_REPORTS_EDIT,
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },
  accountant: {
    name: 'accountant',
    display_name: 'Accountant',
    description: 'Access to financial operations, invoices, and quotations',
    color: '#f59e0b',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.CLIENTS_VIEW,
      PERMISSIONS.PROJECTS_VIEW,
      PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_EDIT,
      PERMISSIONS.INVOICES_VIEW, PERMISSIONS.INVOICES_EDIT,
      PERMISSIONS.DOCUMENTS_VIEW,
      PERMISSIONS.COMMUNICATIONS_VIEW, PERMISSIONS.COMMUNICATIONS_EDIT,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },
  viewer: {
    name: 'viewer',
    display_name: 'Viewer',
    description: 'Read-only access to all non-sensitive platform data',
    color: '#6b7280',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.CLIENTS_VIEW,
      PERMISSIONS.PROJECTS_VIEW,
      PERMISSIONS.APPROVALS_VIEW,
      PERMISSIONS.FINANCE_VIEW,
      PERMISSIONS.WORKFLOWS_VIEW,
      PERMISSIONS.FIELD_SYNC_VIEW,
      PERMISSIONS.SPATIAL_VIEW,
      PERMISSIONS.AI_VIEW,
      PERMISSIONS.DOCUMENTS_VIEW,
      PERMISSIONS.COMMUNICATIONS_VIEW,
      PERMISSIONS.AUDIT_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.SURVEY_REPORTS_VIEW,
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },
}

// ── Helper: Check if user has permission for a page ──
export function hasPagePermission(
  userPermissions: string[],
  pageId: string,
  mode: 'view' | 'edit' = 'view'
): boolean {
  // Admin always has access
  if (userPermissions.includes('*')) return true

  const required = mode === 'edit'
    ? PAGE_EDIT_PERMISSIONS[pageId]
    : PAGE_PERMISSIONS[pageId]

  if (!required) return true // No permission required = accessible

  return required.some(p => userPermissions.includes(p))
}

// ── Helper: Get allowed nav items based on permissions ──
export function getAllowedPages(userPermissions: string[]): string[] {
  if (userPermissions.includes('*')) {
    return Object.keys(PAGE_PERMISSIONS)
  }
  return Object.keys(PAGE_PERMISSIONS).filter(pageId =>
    hasPagePermission(userPermissions, pageId, 'view')
  )
}

// ── All permission definitions for seeding ──
export const ALL_PERMISSIONS_SEED: Array<{
  code: string
  name: string
  module: string
  description: string
}> = [
  // Dashboard
  { code: PERMISSIONS.DASHBOARD_VIEW, name: 'View Dashboard', module: 'dashboard', description: 'Access the main dashboard' },

  // Clients
  { code: PERMISSIONS.CLIENTS_VIEW, name: 'View Clients', module: 'clients', description: 'View client records' },
  { code: PERMISSIONS.CLIENTS_EDIT, name: 'Edit Clients', module: 'clients', description: 'Create and edit client records' },
  { code: PERMISSIONS.CLIENTS_DELETE, name: 'Delete Clients', module: 'clients', description: 'Delete client records' },

  // Projects
  { code: PERMISSIONS.PROJECTS_VIEW, name: 'View Projects', module: 'projects', description: 'View survey projects' },
  { code: PERMISSIONS.PROJECTS_EDIT, name: 'Edit Projects', module: 'projects', description: 'Create and edit survey projects' },
  { code: PERMISSIONS.PROJECTS_DELETE, name: 'Delete Projects', module: 'projects', description: 'Delete survey projects' },

  // Approvals
  { code: PERMISSIONS.APPROVALS_VIEW, name: 'View Approvals', module: 'approvals', description: 'View approval workflow' },
  { code: PERMISSIONS.APPROVALS_EDIT, name: 'Manage Approvals', module: 'approvals', description: 'Approve or reject items' },

  // Finance
  { code: PERMISSIONS.FINANCE_VIEW, name: 'View Finance', module: 'finance', description: 'View financial data' },
  { code: PERMISSIONS.FINANCE_EDIT, name: 'Manage Finance', module: 'finance', description: 'Create and edit financial records' },
  { code: PERMISSIONS.INVOICES_VIEW, name: 'View Invoices', module: 'finance', description: 'View invoice records' },
  { code: PERMISSIONS.INVOICES_EDIT, name: 'Manage Invoices', module: 'finance', description: 'Create and edit invoices' },

  // Workflows
  { code: PERMISSIONS.WORKFLOWS_VIEW, name: 'View Workflows', module: 'workflows', description: 'View workflow definitions' },
  { code: PERMISSIONS.WORKFLOWS_EDIT, name: 'Manage Workflows', module: 'workflows', description: 'Create and edit workflows' },

  // Field Sync
  { code: PERMISSIONS.FIELD_SYNC_VIEW, name: 'View Field Sync', module: 'field-sync', description: 'View field sync data' },
  { code: PERMISSIONS.FIELD_SYNC_EDIT, name: 'Manage Field Sync', module: 'field-sync', description: 'Create field observations' },

  // Spatial
  { code: PERMISSIONS.SPATIAL_VIEW, name: 'View Spatial Data', module: 'spatial', description: 'View spatial layers and maps' },
  { code: PERMISSIONS.SPATIAL_EDIT, name: 'Manage Spatial Data', module: 'spatial', description: 'Create and edit spatial data' },

  // AI
  { code: PERMISSIONS.AI_VIEW, name: 'View AI Insights', module: 'ai', description: 'View AI model and insights' },
  { code: PERMISSIONS.AI_EDIT, name: 'Manage AI', module: 'ai', description: 'Configure AI models and prompts' },

  // Documents
  { code: PERMISSIONS.DOCUMENTS_VIEW, name: 'View Documents', module: 'documents', description: 'View document vault' },
  { code: PERMISSIONS.DOCUMENTS_EDIT, name: 'Manage Documents', module: 'documents', description: 'Upload and manage documents' },

  // Communications
  { code: PERMISSIONS.COMMUNICATIONS_VIEW, name: 'View Communications', module: 'communications', description: 'View messages and SMS' },
  { code: PERMISSIONS.COMMUNICATIONS_EDIT, name: 'Send Communications', module: 'communications', description: 'Send messages and SMS' },

  // Audit
  { code: PERMISSIONS.AUDIT_VIEW, name: 'View Audit Trail', module: 'audit', description: 'View audit trail events' },

  // Organizations
  { code: PERMISSIONS.ORGANIZATIONS_VIEW, name: 'View Organizations', module: 'organizations', description: 'View organization details' },
  { code: PERMISSIONS.ORGANIZATIONS_EDIT, name: 'Manage Organizations', module: 'organizations', description: 'Create and edit organizations' },

  // Reports
  { code: PERMISSIONS.REPORTS_VIEW, name: 'View Reports', module: 'reports', description: 'View reports and analytics' },
  { code: PERMISSIONS.REPORTS_EDIT, name: 'Generate Reports', module: 'reports', description: 'Generate and export reports' },

  // Survey Reports
  { code: PERMISSIONS.SURVEY_REPORTS_VIEW, name: 'View Survey Reports', module: 'survey-reports', description: 'View survey report templates' },
  { code: PERMISSIONS.SURVEY_REPORTS_EDIT, name: 'Manage Survey Reports', module: 'survey-reports', description: 'Create and edit survey reports' },

  // Roles
  { code: PERMISSIONS.ROLES_VIEW, name: 'View Roles & Permissions', module: 'roles', description: 'View role and permission settings' },
  { code: PERMISSIONS.ROLES_EDIT, name: 'Manage Roles & Permissions', module: 'roles', description: 'Edit roles and assign permissions' },

  // Settings
  { code: PERMISSIONS.SETTINGS_VIEW, name: 'View Settings', module: 'settings', description: 'View platform settings' },
  { code: PERMISSIONS.SETTINGS_EDIT, name: 'Manage Settings', module: 'settings', description: 'Edit platform settings' },
]
