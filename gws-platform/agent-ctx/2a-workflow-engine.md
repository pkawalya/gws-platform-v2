# Task 2A: Workflow Engine Implementation

## Summary
Implemented the full Phase 2A Workflow Engine for the GWS Platform V2. This generalizes the hard-coded 8-step approval process into a configurable, state-machine-based workflow system.

## Files Created

### Migrations (4)
- `database/migrations/2026_07_01_000000_create_workflow_definitions_table.php` — Workflow templates
- `database/migrations/2026_07_01_000001_create_workflow_steps_table.php` — Steps within definitions
- `database/migrations/2026_07_01_000002_create_workflow_instances_table.php` — Running instances
- `database/migrations/2026_07_01_000003_create_workflow_transitions_table.php` — State change records

### Models (4)
- `app/Models/WorkflowDefinition.php` — Uses RecordsDomainEvents, auto-generates slug, supports versioning, has `seedFromApprovalSteps()` static method
- `app/Models/WorkflowStep.php` — Uses RecordsDomainEvents, STEP_TYPES/ASSIGNEE_TYPES constants, ordered/ofType/mandatory scopes
- `app/Models/WorkflowInstance.php` — Uses RecordsDomainEvents, STATUSES constant, morphTo entity, isOverdue/daysInCurrentStep accessors, cancel/suspend/resume methods, stalled scope
- `app/Models/WorkflowTransition.php` — NO RecordsDomainEvents (transitions ARE events), STATUSES/ACTIONS constants, approved/deferred/rejected scopes

### Service (1)
- `app/Services/WorkflowEngine.php` — Core workflow lifecycle service with: start(), advance(), defer(), reject(), skip(), escalate(), cancel(), suspend(), resume(), getStalledInstances(), calculateProgress(), replayHistory()

### Seeder (1)
- `database/seeders/WorkflowDefinitionSeeder.php` — Seeds from ApprovalStep::DEFAULT_STEPS
- Updated `database/seeders/DatabaseSeeder.php` to include WorkflowDefinitionSeeder

### Filament Resources (2)
- `app/Filament/Resources/Workflow/WorkflowDefinitions/` — Full CRUD resource with "Create New Version" action on View page
- `app/Filament/Resources/Workflow/WorkflowInstances/` — Read-only resource with Cancel/Suspend/Resume actions, "View Timeline" slide-over

### Updated Files
- `app/Livewire/ClientWorkspace/ApprovalTimelineBlock.php` — Added getWorkflowInstance(), advanceWorkflow(), backward-compatible startWorkflow()
- `resources/views/livewire/client-workspace/approval-timeline-block.blade.php` — Dual-mode rendering for WorkflowEngine and legacy ApprovalSteps

### Blade Views (1)
- `resources/views/filament/resources/workflow/timeline-slideover.blade.php` — Transition timeline slide-over

## Design Decisions
1. WorkflowEngine follows EventStore pattern — single entry point for all mutations
2. All mutations wrapped in DB transactions for consistency
3. Transitions do NOT use RecordsDomainEvents (they ARE the event records)
4. Backward compatibility: ApprovalTimelineBlock falls back to legacy logic if no workflow definition exists
5. SLA/stalled detection mirrors existing ApprovalStep::STALLED_THRESHOLD_DAYS pattern
6. Auto-advance on approval with configurable per-step behavior
7. Versioning support — createNewVersion() duplicates steps, deactivates old version

## Notes
- PHP is not available in this sandbox, so migrations could not be run
- All code follows existing project patterns (RecordsDomainEvents, Filament v5 Schema classes, Livewire v4 attributes)
