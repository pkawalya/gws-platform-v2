# GWS Platform Client Model & Related Models

## Task Summary
Created 8 PHP files for the GWS Platform: 4 database migrations and 4 Eloquent models for the Client domain and its related entities.

## Files Created

### Migrations
1. **`database/migrations/2026_05_16_120000_create_clients_table.php`** — Creates the `clients` table with all specified columns (client_number, personal info, NIN, KYC fields, lifecycle_state, Uganda-specific address fields, foreign keys to users/organizations/branches), plus 6 indexes.

2. **`database/migrations/2026_05_16_120001_create_survey_projects_table.php`** — Creates the `survey_projects` table with project_number, project_type, client_id FK, status workflow, surveyor assignment, date tracking, area_hectares, and org/branch FKs. Includes indexes on project_number, client_id, status, assigned_surveyor_user_id, and organization_id.

3. **`database/migrations/2026_05_16_120002_create_client_project_progress_table.php`** — Creates the `client_project_progress` table linking survey projects to clients with progress_percentage, current_stage, and notes. Indexes on survey_project_id, client_id, and progress_percentage.

4. **`database/migrations/2026_05_16_120003_create_approval_steps_table.php`** — Creates the `approval_steps` table with the 8-step Uganda land survey approval workflow (client_signed → lc1 → alc → physical_planning → dlb → gws → mzo → land_office). Includes status tracking, officer_name, submission/approval/deferral timestamps, deferred_reason, and a unique constraint on (client_project_progress_id, step_order).

### Models
5. **`app/Models/Client.php`** — Eloquent model with `$fillable`, boolean/datetime/date casts, `RecordsDomainEvents` trait, relationships (assignedOfficer→User, organization→Organization, branch→Branch, surveyProjects→SurveyProject), `getFullNameAttribute()` accessor, `scopeActive()` and `scopeByLifecycle()` scopes, and auto-generating client_number in `GWS-YYYY-NNNN` format via `booted()` + `generateClientNumber()`.

6. **`app/Models/SurveyProject.php`** — Eloquent model with `$fillable`, date/decimal casts, `RecordsDomainEvents` trait, relationships (client→Client, assignedSurveyor→User, organization→Organization, branch→Branch, progress→ClientProjectProgress HasOne).

7. **`app/Models/ClientProjectProgress.php`** — Eloquent model with `$fillable`, decimal cast, `RecordsDomainEvents` trait, relationships (surveyProject→SurveyProject, client→Client, approvalSteps→ApprovalStep HasMany).

8. **`app/Models/ApprovalStep.php`** — Full-featured model with `DEFAULT_STEPS`, `INSTITUTIONS`, `STATUSES`, and `STALLED_THRESHOLD_DAYS` constants; `$fillable` and datetime/integer casts; relationship to ClientProjectProgress; scopes (pending, submitted, approved, deferred, stalled with configurable 7-day threshold); `getDaysSinceSubmissionAttribute()` accessor; and `seedDefaultSteps()` static method that creates 8 institution steps for a progress record with idempotency guard.

## Design Decisions
- Used `nullOnDelete` for user/organization/branch FKs on clients to preserve client records when referenced entities are deleted
- Used `cascadeOnDelete` for client_id on survey_projects and for survey_project_id/client_id on progress/approval steps (child records don't outlive parents)
- Added a composite unique constraint `(client_project_progress_id, step_order)` on approval_steps to prevent duplicate step ordering
- The `seedDefaultSteps()` method uses bulk `insert()` for efficiency and returns a boolean for caller awareness
- Client number generation is year-partitioned and sequential, ensuring no collisions within a year
