# Task: Phase 0.3 Multi-Tenancy Scaffold — GWS Platform

## Summary

Created the complete multi-tenancy scaffold for the GWS Platform, including database migrations, Eloquent models, and Filament v5 CRUD resources for Organizations and Branches.

## Files Created

### 1. Migration: `database/migrations/2026_06_01_000002_create_organizations_branches_tables.php`
- Creates `organizations` table with: id, name, slug (unique), logo_path, settings_json (JSON), subscription_plan, is_active, timestamps
- Creates `branches` table with: id, organization_id (FK cascade), name, code (unique), address, district, phone, email, is_headquarters, manager_user_id (FK nullOnDelete), is_active, timestamps
- Includes strategic indexes for organization_id and org+HQ lookups

### 2. Migration: `database/migrations/2026_06_01_000003_add_tenancy_columns_to_core_tables.php`
- Adds nullable `organization_id` and `branch_id` FKs to `users` table
- Adds nullable `organization_id` and `branch_id` FKs to `clients` table (guarded with `Schema::hasTable()`)
- Each column has FK constraint with `nullOnDelete()` and an index on `organization_id`
- Proper `down()` method for rollback

### 3. Model: `app/Models/Organization.php`
- `$fillable` for all spec fields
- Casts: `settings_json` → array, `is_active` → boolean
- Relationships: `branches()` hasMany, `users()` hasMany
- Auto-generates slug from name on creation via `boot()` method
- `generateUniqueSlug()` helper with collision suffix
- `scopeActive()` scope

### 4. Model: `app/Models/Branch.php`
- `$fillable` for all spec fields
- Casts: `is_headquarters` → boolean, `is_active` → boolean
- Relationships: `organization()` belongsTo, `manager()` belongsTo(User, 'manager_user_id'), `users()` hasMany
- Scopes: `scopeActive()`, `scopeForOrganization()`, `scopeHeadquarters()`

### 5. Filament Resource: `app/Filament/Resources/System/OrganizationResource.php`
- NavigationGroup: 'System', Icon: building-office-2, Sort: 10
- Form: name, slug (auto-gen, readonly after create), logo_path, subscription_plan (select), settings_json (KeyValue), is_active (toggle)
- Table: name, slug, subscription_plan (badge), is_active (badge), branches_count, users_count, created_at
- Filters: subscription_plan, is_active
- Page classes: ListOrganizations, CreateOrganization, EditOrganization, ViewOrganization (inline)
- Access: super_admin TODO comment

### 6. Filament Resource: `app/Filament/Resources/System/BranchResource.php`
- NavigationGroup: 'System', Icon: building-storefront, Sort: 20
- Form: organization_id (select relationship), name, code, address, district, phone, email, is_headquarters, manager_user_id, is_active
- Table: name, code (badge), organization.name, district, is_headquarters (badge), manager.name, is_active (badge)
- Filters: organization_id, is_headquarters, is_active
- Page classes: ListBranches, CreateBranch, EditBranch, ViewBranch (inline)
- Access: super_admin TODO comment

## Technical Notes

- Filament v5 API: Uses `Filament\Schemas\Schema` for form/infolist schemas
- Schema components (Section, Fieldset) are from `Filament\Schemas\Components`
- Form components (TextInput, Select, KeyValue, etc.) are from `Filament\Forms\Components`
- BadgeColumn is deprecated in v5; use `TextColumn::make()->badge()` instead
- Resources are auto-discovered from `app/Filament/Resources` by AdminPanelProvider
- All code follows existing project conventions (migration style, model patterns, etc.)
