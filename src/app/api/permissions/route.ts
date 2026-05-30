import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextRequest, NextResponse } from 'next/server'

// Seed permissions if they don't exist
const PERMISSION_SEEDS = [
  // Dashboard
  { code: 'dashboard.view', name: 'View Dashboard', module: 'dashboard', description: 'Access the main dashboard' },
  // Clients
  { code: 'clients.view', name: 'View Clients', module: 'clients', description: 'View client list and details' },
  { code: 'clients.create', name: 'Create Clients', module: 'clients', description: 'Add new clients' },
  { code: 'clients.edit', name: 'Edit Clients', module: 'clients', description: 'Modify client information' },
  { code: 'clients.delete', name: 'Delete Clients', module: 'clients', description: 'Remove clients from the system' },
  { code: 'clients.export', name: 'Export Clients', module: 'clients', description: 'Export client data' },
  // Projects
  { code: 'projects.view', name: 'View Projects', module: 'projects', description: 'View survey projects' },
  { code: 'projects.create', name: 'Create Projects', module: 'projects', description: 'Add new survey projects' },
  { code: 'projects.edit', name: 'Edit Projects', module: 'projects', description: 'Modify project details' },
  { code: 'projects.delete', name: 'Delete Projects', module: 'projects', description: 'Remove projects' },
  { code: 'projects.export', name: 'Export Projects', module: 'projects', description: 'Export project data' },
  // Approvals
  { code: 'approvals.view', name: 'View Approvals', module: 'approvals', description: 'View approval workflows' },
  { code: 'approvals.edit', name: 'Edit Approvals', module: 'approvals', description: 'Modify approval steps' },
  { code: 'approvals.approve', name: 'Approve/Reject', module: 'approvals', description: 'Approve or reject approval steps' },
  // Finance
  { code: 'finance.view', name: 'View Finance', module: 'finance', description: 'View invoices and financial data' },
  { code: 'finance.create', name: 'Create Invoices', module: 'finance', description: 'Create new invoices' },
  { code: 'finance.edit', name: 'Edit Invoices', module: 'finance', description: 'Modify invoice details' },
  { code: 'finance.delete', name: 'Delete Invoices', module: 'finance', description: 'Remove invoices' },
  { code: 'finance.export', name: 'Export Finance', module: 'finance', description: 'Export financial reports' },
  // Workflows
  { code: 'workflows.view', name: 'View Workflows', module: 'workflows', description: 'View workflow definitions' },
  { code: 'workflows.create', name: 'Create Workflows', module: 'workflows', description: 'Create new workflow definitions' },
  { code: 'workflows.edit', name: 'Edit Workflows', module: 'workflows', description: 'Modify workflow definitions' },
  { code: 'workflows.manage', name: 'Manage Workflows', module: 'workflows', description: 'Full workflow management' },
  // Field Sync
  { code: 'field-sync.view', name: 'View Field Sync', module: 'field-sync', description: 'View field observations' },
  { code: 'field-sync.create', name: 'Create Observations', module: 'field-sync', description: 'Submit field observations' },
  { code: 'field-sync.edit', name: 'Edit Observations', module: 'field-sync', description: 'Modify field observations' },
  { code: 'field-sync.manage', name: 'Manage Field Sync', module: 'field-sync', description: 'Full field sync management' },
  // Spatial
  { code: 'spatial.view', name: 'View Spatial', module: 'spatial', description: 'View spatial layers and maps' },
  { code: 'spatial.edit', name: 'Edit Spatial', module: 'spatial', description: 'Modify spatial data' },
  { code: 'spatial.manage', name: 'Manage Spatial', module: 'spatial', description: 'Full spatial data management' },
  // AI
  { code: 'ai.view', name: 'View AI', module: 'ai', description: 'View AI models and logs' },
  { code: 'ai.manage', name: 'Manage AI', module: 'ai', description: 'Configure AI models and prompts' },
  // Documents
  { code: 'documents.view', name: 'View Documents', module: 'documents', description: 'View document vault' },
  { code: 'documents.create', name: 'Upload Documents', module: 'documents', description: 'Upload new documents' },
  { code: 'documents.edit', name: 'Edit Documents', module: 'documents', description: 'Modify document metadata' },
  { code: 'documents.delete', name: 'Delete Documents', module: 'documents', description: 'Remove documents' },
  // Communications
  { code: 'communications.view', name: 'View Messages', module: 'communications', description: 'View communications' },
  { code: 'communications.create', name: 'Send Messages', module: 'communications', description: 'Send messages and SMS' },
  { code: 'communications.edit', name: 'Edit Messages', module: 'communications', description: 'Modify communications' },
  { code: 'communications.delete', name: 'Delete Messages', module: 'communications', description: 'Remove communications' },
  // Organizations
  { code: 'organizations.view', name: 'View Organizations', module: 'organizations', description: 'View organization details' },
  { code: 'organizations.edit', name: 'Edit Organizations', module: 'organizations', description: 'Modify organization settings' },
  { code: 'organizations.manage', name: 'Manage Organizations', module: 'organizations', description: 'Full organization management' },
  // Reports
  { code: 'reports.view', name: 'View Reports', module: 'reports', description: 'View generated reports' },
  { code: 'reports.create', name: 'Create Reports', module: 'reports', description: 'Generate new reports' },
  { code: 'reports.export', name: 'Export Reports', module: 'reports', description: 'Export report data' },
  // Audit
  { code: 'audit.view', name: 'View Audit Trail', module: 'audit', description: 'View audit logs' },
  // Settings
  { code: 'settings.view', name: 'View Settings', module: 'settings', description: 'View system settings' },
  { code: 'settings.edit', name: 'Edit Settings', module: 'settings', description: 'Modify system settings' },
  // Users & Roles
  { code: 'users.view', name: 'View Users', module: 'users', description: 'View user list' },
  { code: 'users.create', name: 'Create Users', module: 'users', description: 'Add new users' },
  { code: 'users.edit', name: 'Edit Users', module: 'users', description: 'Modify user details' },
  { code: 'users.delete', name: 'Delete Users', module: 'users', description: 'Remove users' },
  { code: 'users.manage_roles', name: 'Manage Roles', module: 'users', description: 'Assign and manage user roles' },
]

const ROLE_SEEDS = [
  {
    name: 'super_admin', display_name: 'Super Admin', description: 'Full system access with all permissions', color: '#dc2626', is_system: true,
    permissions: '*' // all permissions
  },
  {
    name: 'administrator', display_name: 'Administrator', description: 'System administrator with broad access', color: '#7c3aed', is_system: true,
    permissions: '*' // all permissions
  },
  {
    name: 'survey_manager', display_name: 'Survey Manager', description: 'Manages survey projects, approvals, and field operations', color: '#2563eb', is_system: true,
    permissions: ['dashboard.view', 'clients.view', 'clients.create', 'clients.edit', 'projects.view', 'projects.create', 'projects.edit', 'projects.delete', 'projects.export', 'approvals.view', 'approvals.edit', 'approvals.approve', 'workflows.view', 'field-sync.view', 'field-sync.create', 'field-sync.edit', 'field-sync.manage', 'spatial.view', 'spatial.edit', 'documents.view', 'documents.create', 'documents.edit', 'reports.view', 'reports.create', 'reports.export']
  },
  {
    name: 'surveyor', display_name: 'Surveyor', description: 'Field surveyor with project and observation access', color: '#059669', is_system: true,
    permissions: ['dashboard.view', 'clients.view', 'projects.view', 'projects.edit', 'field-sync.view', 'field-sync.create', 'field-sync.edit', 'spatial.view', 'documents.view', 'documents.create']
  },
  {
    name: 'finance_officer', display_name: 'Finance Officer', description: 'Manages invoices, payments, and financial reports', color: '#d97706', is_system: true,
    permissions: ['dashboard.view', 'clients.view', 'finance.view', 'finance.create', 'finance.edit', 'finance.export', 'reports.view', 'reports.create', 'reports.export', 'documents.view']
  },
  {
    name: 'client_relations', display_name: 'Client Relations', description: 'Manages client communications and documents', color: '#0891b2', is_system: true,
    permissions: ['dashboard.view', 'clients.view', 'clients.create', 'clients.edit', 'clients.export', 'communications.view', 'communications.create', 'communications.edit', 'documents.view', 'documents.create', 'documents.edit', 'reports.view']
  },
  {
    name: 'viewer', display_name: 'Viewer', description: 'Read-only access to most modules', color: '#6b7280', is_system: true,
    permissions: ['dashboard.view', 'clients.view', 'projects.view', 'finance.view', 'workflows.view', 'field-sync.view', 'spatial.view', 'ai.view', 'documents.view', 'communications.view', 'organizations.view', 'reports.view', 'audit.view']
  },
]

export async function GET() {
  try {
    // Ensure permissions are seeded
    const existingPermCount = await db.permission.count()
    if (existingPermCount === 0) {
      await db.permission.createMany({
        data: PERMISSION_SEEDS.map(p => ({
          code: p.code,
          name: p.name,
          module: p.module,
          description: p.description,
        })),
        skipDuplicates: true,
      })
    }

    // Ensure roles are seeded
    const existingRoleCount = await db.role.count()
    if (existingRoleCount === 0) {
      const allPermissions = await db.permission.findMany()

      for (const roleSeed of ROLE_SEEDS) {
        const role = await db.role.create({
          data: {
            name: roleSeed.name,
            display_name: roleSeed.display_name,
            description: roleSeed.description,
            color: roleSeed.color,
            is_system: roleSeed.is_system,
          },
        })

        if (roleSeed.permissions === '*') {
          // Assign all permissions
          await db.rolePermission.createMany({
            data: allPermissions.map(p => ({
              role_id: role.id,
              permission_id: p.id,
            })),
            skipDuplicates: true,
          })
        } else {
          const permIds = allPermissions
            .filter(p => (roleSeed.permissions as string[]).includes(p.code))
            .map(p => p.id)
          await db.rolePermission.createMany({
            data: permIds.map(pid => ({
              role_id: role.id,
              permission_id: pid,
            })),
            skipDuplicates: true,
          })
        }
      }
    }

    // Ensure default users are seeded
    const existingUserCount = await db.user.count()
    if (existingUserCount === 0) {
      const superAdminRole = await db.role.findFirst({ where: { name: 'super_admin' } })
      const adminRole = await db.role.findFirst({ where: { name: 'administrator' } })
      const surveyManagerRole = await db.role.findFirst({ where: { name: 'survey_manager' } })
      const surveyorRole = await db.role.findFirst({ where: { name: 'surveyor' } })
      const financeRole = await db.role.findFirst({ where: { name: 'finance_officer' } })
      const clientRelRole = await db.role.findFirst({ where: { name: 'client_relations' } })
      const viewerRole = await db.role.findFirst({ where: { name: 'viewer' } })

      const users = await db.user.createMany({
        data: [
          { email: 'admin@gws.co.ug', name: 'Admin User', job_title: 'System Administrator', department: 'IT', status: 'active' },
          { email: 'james.okello@gws.co.ug', name: 'James Okello', job_title: 'Senior Surveyor', department: 'Surveying', status: 'active' },
          { email: 'sarah.nakamya@gws.co.ug', name: 'Sarah Nakamya', job_title: 'Survey Manager', department: 'Operations', status: 'active' },
          { email: 'robert.mugisha@gws.co.ug', name: 'Robert Mugisha', job_title: 'Finance Officer', department: 'Finance', status: 'active' },
          { email: 'grace.achieng@gws.co.ug', name: 'Grace Achieng', job_title: 'Client Relations Manager', department: 'Client Services', status: 'active' },
          { email: 'peter.oboi@gws.co.ug', name: 'Peter Oboi', job_title: 'Field Surveyor', department: 'Surveying', status: 'active' },
          { email: 'mary.kato@gws.co.ug', name: 'Mary Kato', job_title: 'GIS Analyst', department: 'Spatial', status: 'active' },
          { email: 'david.besigye@gws.co.ug', name: 'David Besigye', job_title: 'Intern Surveyor', department: 'Surveying', status: 'inactive' },
        ],
      })

      // Assign roles to users
      const allUsers = await db.user.findMany({ orderBy: { created_at: 'asc' } })
      if (allUsers.length >= 8) {
        await db.userRole.createMany({
          data: [
            { user_id: allUsers[0].id, role_id: superAdminRole!.id },
            { user_id: allUsers[1].id, role_id: adminRole!.id },
            { user_id: allUsers[2].id, role_id: surveyManagerRole!.id },
            { user_id: allUsers[3].id, role_id: financeRole!.id },
            { user_id: allUsers[4].id, role_id: clientRelRole!.id },
            { user_id: allUsers[5].id, role_id: surveyorRole!.id },
            { user_id: allUsers[6].id, role_id: viewerRole!.id },
            { user_id: allUsers[7].id, role_id: surveyorRole!.id },
          ],
          skipDuplicates: true,
        })
      }
    }

    const permissions = await db.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
      include: {
        _count: { select: { rolePermissions: true } },
      },
    })

    return NextResponse.json(serialize({
      permissions,
      modules: [...new Set(PERMISSION_SEEDS.map(p => p.module))],
    }))
  } catch (error) {
    console.error('Permissions API error:', error)
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 })
  }
}
