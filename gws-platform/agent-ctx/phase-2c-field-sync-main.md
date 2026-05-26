# Phase 2C: Mobile Field App API Contract + Field Sync

## Task ID: phase-2c-field-sync
## Agent: main
## Date: 2026-03-04

## Summary

Implemented the complete Mobile Field App API layer for the GWS Platform V2, including:
- Sanctum authentication configuration
- API routes with versioned prefix (v1)
- Database migrations for field observations and sync events
- Models with full relationships, scopes, and business logic
- API controllers for auth, assignments, observations, sync, clients, and spatial data
- Form requests for validation and authorization
- API resources for consistent JSON responses
- FieldSyncService for offline-first sync operations
- Middleware for token ability checks and per-user rate limiting
- Filament admin resources for viewing field observations and sync events

## Files Created/Modified

### Configuration
- `config/sanctum.php` — Sanctum configuration (30-day token expiration)
- `config/auth.php` — Added 'sanctum' guard
- `bootstrap/app.php` — Registered API routes and middleware aliases

### Migrations
- `database/migrations/2026_07_01_000199_create_personal_access_tokens_table.php`
- `database/migrations/2026_07_01_000200_create_field_observations_table.php`
- `database/migrations/2026_07_01_000201_create_field_sync_events_table.php`

### Models
- `app/Models/User.php` — Updated with HasApiTokens, HasRoles, relationships, token abilities
- `app/Models/FieldObservation.php` — Full model with UUID, sync status, GeoJSON, scopes
- `app/Models/FieldSyncEvent.php` — Sync event tracking with status management
- `app/Models/SurveyProject.php` — Added fieldObservations() relationship

### Controllers
- `app/Http/Controllers/Api/V1/AuthController.php` — Login, registerDevice, logout, me
- `app/Http/Controllers/Api/V1/AssignmentController.php` — List, show, updateStatus
- `app/Http/Controllers/Api/V1/ObservationController.php` — Full CRUD with authorization
- `app/Http/Controllers/Api/V1/SyncController.php` — Push, pull, status, resolveConflict
- `app/Http/Controllers/Api/V1/ClientController.php` — Read-only client summaries
- `app/Http/Controllers/Api/V1/SpatialController.php` — GeoJSON projects, layers, annotations

### Form Requests
- `app/Http/Requests/Api/V1/StoreFieldObservationRequest.php`
- `app/Http/Requests/Api/V1/UpdateFieldObservationRequest.php`
- `app/Http/Requests/Api/V1/SyncPushRequest.php`
- `app/Http/Requests/Api/V1/ResolveConflictRequest.php`

### API Resources
- `app/Http/Resources/Api/V1/UserResource.php`
- `app/Http/Resources/Api/V1/AssignmentResource.php`
- `app/Http/Resources/Api/V1/ObservationResource.php`
- `app/Http/Resources/Api/V1/ClientSummaryResource.php`
- `app/Http/Resources/Api/V1/SyncStatusResource.php`
- `app/Http/Resources/Api/V1/SpatialLayerResource.php`
- `app/Http/Resources/Api/V1/ProjectGeoJsonResource.php`

### Services
- `app/Services/FieldSyncService.php` — Push, pull, status, resolveConflict, conflict detection

### Middleware
- `app/Http/Middleware/Api/EnsureApiTokenAbility.php`
- `app/Http/Middleware/Api/ThrottlePerUser.php`

### Routes
- `routes/api.php` — Versioned API routes with auth:sanctum and ability middleware

### Filament Resources
- `app/Filament/Resources/Field/FieldObservations/FieldObservationResource.php`
- `app/Filament/Resources/Field/FieldObservations/Schemas/FieldObservationInfolist.php`
- `app/Filament/Resources/Field/FieldObservations/Tables/FieldObservationsTable.php`
- `app/Filament/Resources/Field/FieldObservations/Pages/ListFieldObservations.php`
- `app/Filament/Resources/Field/FieldObservations/Pages/ViewFieldObservation.php`
- `app/Filament/Resources/Field/FieldSyncEvents/FieldSyncEventResource.php`
- `app/Filament/Resources/Field/FieldSyncEvents/Schemas/FieldSyncEventInfolist.php`
- `app/Filament/Resources/Field/FieldSyncEvents/Tables/FieldSyncEventsTable.php`
- `app/Filament/Resources/Field/FieldSyncEvents/Pages/ListFieldSyncEvents.php`
- `app/Filament/Resources/Field/FieldSyncEvents/Pages/ViewFieldSyncEvent.php`

## Key Design Decisions

1. **UUID-based offline sync**: FieldObservation uses UUID as the primary offline identifier, allowing idempotent upsert during sync
2. **Token abilities**: Four abilities (field-read, field-write, sync, offline) control API access granularity
3. **Conflict detection**: Server-side detection of concurrent modifications using updated_at vs synced_at comparison
4. **Read-only Filament resources**: Field observations and sync events are view-only in the admin panel; they're created via the mobile API
5. **Consistent response envelope**: All API responses use `{data: ..., meta: {...}}` format
6. **Authorization**: Surveyors can only access their assigned projects; admins have full access
7. **Privacy**: ClientSummaryResource exposes only field-relevant data, not NIN or full address
