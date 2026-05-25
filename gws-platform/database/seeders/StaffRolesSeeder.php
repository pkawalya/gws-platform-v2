<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class StaffRolesSeeder extends Seeder
{
    /**
     * Seed roles and permissions for the GWS Platform using Spatie Laravel Permission.
     *
     * This seeder is idempotent — it uses firstOrCreate so it can be run
     * multiple times without creating duplicates.
     */
    public function run(): void
    {
        // ──────────────────────────────────────────────
        // 1. Define all permissions grouped by module
        // ──────────────────────────────────────────────

        $permissionsByModule = [
            // Domain Events
            'Domain Events' => [
                'view_domain_events',
                'replay_domain_events',
            ],

            // AI Studio
            'AI Studio' => [
                'manage_ai_prompts',
                'manage_ai_models',
            ],

            // Clients
            'Clients' => [
                'view_clients',
                'create_clients',
                'edit_clients',
                'delete_clients',
            ],

            // Survey Projects
            'Survey Projects' => [
                'view_projects',
                'create_projects',
                'edit_projects',
                'delete_projects',
            ],

            // Properties
            'Properties' => [
                'view_properties',
                'create_properties',
                'edit_properties',
            ],

            // MZO
            'MZO' => [
                'view_mzo_submissions',
                'manage_mzo_submissions',
            ],

            // Titles
            'Titles' => [
                'view_title_applications',
                'manage_title_applications',
            ],

            // Financials
            'Financials' => [
                'view_financials',
                'create_quotations',
                'manage_invoices',
                'record_payments',
            ],

            // Documents
            'Documents' => [
                'view_documents',
                'upload_documents',
                'delete_documents',
            ],

            // SMS / Communications
            'SMS/Communications' => [
                'view_communications',
                'send_sms',
            ],

            // Workflows
            'Workflows' => [
                'view_workflows',
                'manage_workflows',
            ],

            // Spatial
            'Spatial' => [
                'view_spatial',
                'manage_spatial_layers',
            ],

            // Reports
            'Reports' => [
                'view_reports',
                'export_reports',
            ],

            // System
            'System' => [
                'manage_users',
                'manage_organizations',
                'manage_branches',
            ],
        ];

        // Create all permissions (idempotent)
        $allPermissions = [];
        foreach ($permissionsByModule as $module => $permissionNames) {
            foreach ($permissionNames as $permissionName) {
                $allPermissions[] = Permission::firstOrCreate(
                    ['name' => $permissionName, 'guard_name' => 'web'],
                )->name;
            }
        }

        // ──────────────────────────────────────────────
        // 2. Define roles
        // ──────────────────────────────────────────────

        $roleNames = [
            'super_admin',
            'admin',
            'manager',
            'surveyor',
            'compliance',
            'accountant',
            'field_surveyor',
            'client',
        ];

        $roles = [];
        foreach ($roleNames as $roleName) {
            $roles[$roleName] = Role::firstOrCreate(
                ['name' => $roleName, 'guard_name' => 'web'],
            );
        }

        // ──────────────────────────────────────────────
        // 3. Assign permissions to roles
        // ──────────────────────────────────────────────

        // super_admin — ALL permissions
        $roles['super_admin']->syncPermissions($allPermissions);

        // admin — All except manage_organizations
        $adminPermissions = array_values(array_filter(
            $allPermissions,
            fn (string $permission) => $permission !== 'manage_organizations',
        ));
        $roles['admin']->syncPermissions($adminPermissions);

        // manager — Operational permissions across modules
        $managerPermissions = [
            'view_clients',
            'create_clients',
            'edit_clients',
            'view_projects',
            'create_projects',
            'edit_projects',
            'view_properties',
            'view_mzo_submissions',
            'manage_mzo_submissions',
            'view_title_applications',
            'view_financials',
            'create_quotations',
            'manage_invoices',
            'record_payments',
            'view_documents',
            'upload_documents',
            'view_communications',
            'send_sms',
            'view_domain_events',
            'view_workflows',
            'manage_workflows',
            'view_spatial',
            'view_reports',
            'export_reports',
        ];
        $roles['manager']->syncPermissions($managerPermissions);

        // compliance — Read-only oversight across compliance-relevant modules
        $compliancePermissions = [
            'view_clients',
            'view_projects',
            'view_mzo_submissions',
            'view_title_applications',
            'view_domain_events',
            'view_workflows',
            'view_reports',
        ];
        $roles['compliance']->syncPermissions($compliancePermissions);

        // surveyor — Project & property work
        $surveyorPermissions = [
            'view_clients',
            'view_projects',
            'create_projects',
            'edit_projects',
            'view_properties',
            'create_properties',
            'view_documents',
            'upload_documents',
            'view_spatial',
        ];
        $roles['surveyor']->syncPermissions($surveyorPermissions);

        // field_surveyor — Minimal field access
        $fieldSurveyorPermissions = [
            'view_projects',
            'create_projects',
            'edit_projects',
            'view_documents',
            'upload_documents',
            'view_spatial',
        ];
        $roles['field_surveyor']->syncPermissions($fieldSurveyorPermissions);

        // accountant — Financial operations only
        $accountantPermissions = [
            'view_financials',
            'create_quotations',
            'manage_invoices',
            'record_payments',
            'view_reports',
            'export_reports',
        ];
        $roles['accountant']->syncPermissions($accountantPermissions);

        // client — Minimal portal access (no permissions assigned by default)
        $roles['client']->syncPermissions([]);
    }
}
