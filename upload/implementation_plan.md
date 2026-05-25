# GWS Client-Centric Platform Pivot — Implementation Plan

**Based on:** GWS Platform Feature Breakdown v1.1

---

## Architecture Decisions

### 1. Approval Checklist Redesign (Section 3)
The current `ClientProjectProgress` uses **6 boolean columns**. The spec requires **8 institution-based steps** with per-step officer, dates, status, and deferral reason.

**Decision:** Create a new `ApprovalStep` child model (row-per-step) under `ClientProjectProgress`. The parent links client↔project; children track each institution.

### 2. Drawings — Polymorphic (Section 5)
**Decision:** Create `DrawingAttachment` as a **polymorphic** model (`attachable_type` + `attachable_id`) so it can attach to `SurveyProject`, `MinistryFile`, or `Property`.

### 3. Property Listings (Section 8)
The existing `Property` model already has `owner_id`, `listing_price`, `status` (available_sale/sold/etc), `reserved_by_client_id`, images, `PropertyOffer`, and `SalesAgreement`. **We extend `Property`** rather than creating a new `PropertyListing` model. Add: `buyer_client_id`, `agreed_price`, `sale_date`, `commission_percent`.

### 4. TitleApplication — Transaction Types (Section 7)
The existing `application_type` enum maps to the spec's `transaction_type`. We **add `new_title`, `transfer`, `verification`** to the enum and add transfer-specific fields.

### 5. SMS Log
The existing `NotificationLog` model already has `channel`, `recipient`, `message`, `status`, `metadata`. **We extend it** with `client_id` and `trigger_event` rather than creating a new table.

---

## Week 1 — Migrations & Core Model Changes

### [NEW] `database/migrations/2026_05_16_120000_client_centric_pivot.php`

**Table: `mzo_submissions` — add columns:**
- `client_id` FK (nullable, for direct link)
- `assigned_tracker_id` FK → users (staff tracking this stage)
- `title_application_id` FK (nullable, links to resulting title)

**Table: `ministry_files` — add columns:**
- `assigned_to_id` FK → users (replaces string `officer_in_charge`)
- `memo_number` string
- `memo_date` date
- `memo_day` string(10) — Mo/Tu/We/Th/Fr/Sa/Su
- `current_stage` string — free-text sub-step label
- `days_at_ministry` — virtual (computed in model)

**Table: `title_applications` — add columns:**
- `transaction_type` string(30) — `new_title|transfer|verification` (alongside existing `application_type`)
- `valuation_amount` decimal(15,2)
- `valuation_date` date
- `chief_valuer_reference` string
- `transferor_name` string
- `transferee_name` string
- `mzo_submission_id` FK (nullable)
- `dispatched_date` date

**Table: `clients` — add columns:**
- `lc1_area` string(100) — LC1 jurisdiction
- `sms_opt_out` boolean default false

**Table: `properties` — add columns:**
- `buyer_client_id` FK (nullable)
- `agreed_price` decimal(15,2)
- `sale_date` date
- `commission_percent` decimal(5,2)

**Table: `notification_logs` — add columns:**
- `client_id` FK (nullable)
- `trigger_event` string(50) — which event fired (mzo_stage, survey_completed, etc)

### [NEW] `database/migrations/2026_05_16_120001_create_approval_steps_table.php`

```
approval_steps:
  id, client_project_progress_id FK,
  step_order int (1-8),
  institution enum (client|lc1|alc|physical_planning|dlb|gws|mzo|land_office),
  officer_name string,
  submitted_at date, approved_at date,
  deferred_reason text,
  status enum (pending|submitted|approved|deferred),
  notes text, timestamps
```

### [NEW] `database/migrations/2026_05_16_120002_create_drawing_attachments_table.php`

```
drawing_attachments:
  id, attachable_type, attachable_id (polymorphic),
  client_id FK (always set for fast queries),
  file_type enum (dwg|dxf|pdf|jpg|png|property_photo),
  drawing_type enum (preliminary|final|boundary|topographic|property_photo),
  file_path string, original_filename string,
  notes text,
  uploaded_by_id FK → users,
  timestamps
```

### [NEW] `database/migrations/2026_05_16_120003_create_computation_files_table.php`

```
computation_files:
  id, survey_project_id FK,
  client_id FK,
  computation_type enum (jr|traversal|area|coordinates),
  file_path string, original_filename string,
  computed_by string, computed_at date,
  notes text,
  created_by FK → users,
  timestamps
```

---

## Week 1 — Model Changes

### [MODIFY] [Client.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Models/Client.php)
- Add `lc1_area`, `sms_opt_out` to `$fillable` and `$casts`
- Add `titleApplications(): HasMany`
- Add `drawingAttachments(): HasMany`
- Add `computationFiles(): HasMany`
- Add `properties(): HasMany` (via owner_id)
- Add `smsLogs()` — NotificationLog where client_id matches
- Add `routeNotificationForSms()` returning phone (respecting opt-out)
- Add `shouldReceiveSms(): bool` helper

### [MODIFY] [MzoSubmission.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Models/MzoSubmission.php)
- Add `client_id`, `assigned_tracker_id`, `title_application_id` to `$fillable`
- Add `client()`, `assignedTracker()`, `titleApplication()` relationships
- Add `transitionStage(string $toStage, ?string $comments)` method that logs workflow + notifies client via SMS

### [MODIFY] [MinistryFile.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Models/MinistryFile.php)
- Add `assigned_to_id`, `memo_number`, `memo_date`, `memo_day`, `current_stage` to `$fillable`
- Add `assignedTo(): BelongsTo` (User)
- Add `drawingAttachments(): MorphMany`
- Add `getDaysAtMinistryAttribute()` computed accessor

### [MODIFY] [TitleApplication.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Models/TitleApplication.php)
- Add transfer fields to `$fillable`: `transaction_type`, `valuation_amount`, `valuation_date`, `chief_valuer_reference`, `transferor_name`, `transferee_name`, `mzo_submission_id`, `dispatched_date`
- Add `TRANSACTION_TYPES` constant: `new_title`, `transfer`, `verification`
- Update `STATUSES` to include `dispatched`
- Add `mzoSubmission(): BelongsTo`

### [MODIFY] [Property.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Models/Property.php)
- Add `buyer_client_id`, `agreed_price`, `sale_date`, `commission_percent` to `$fillable`
- Add `buyer(): BelongsTo` (Client)
- Add `drawingAttachments(): MorphMany`
- Add `getCommissionAmountAttribute()` computed from agreed_price × commission_percent

### [MODIFY] [ClientProjectProgress.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Models/ClientProjectProgress.php)
- Add `approvalSteps(): HasMany`
- Update `STEPS` constant to 8 institutions
- Update `getCompletionPercentAttribute()` to use ApprovalStep rows
- Add `seedDefaultSteps()` method to create 8 rows on record creation

### [NEW] [ApprovalStep.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Models/ApprovalStep.php)
Institution-based approval step model with `INSTITUTIONS` constant, status helpers, `getDaysTakenAttribute()`.

### [NEW] [DrawingAttachment.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Models/DrawingAttachment.php)
Polymorphic attachment model with file type/drawing type enums.

### [NEW] [ComputationFile.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Models/ComputationFile.php)
JR/traversal/area computation file linked to SurveyProject and Client.

---

## Week 2 — Drawing & Computation Filament Components

### [NEW] `app/Filament/Resources/Clients/RelationManagers/DrawingAttachmentsRelationManager.php`
Grid view of all drawings across client's projects. FileUpload for DWG/DXF/PDF/JPG. Filterable by drawing_type.

### [NEW] `app/Filament/Resources/Clients/RelationManagers/ComputationFilesRelationManager.php`
Table of computation files. FileUpload for XLSX/CSV/PDF. Shows computation_type badge, computed_by, date.

### [NEW] `app/Filament/Resources/Clients/RelationManagers/TitleApplicationsRelationManager.php`
Full CRUD scoped to client. Shows transaction_type, status, DLB, dates, fees.

### [MODIFY] [ClientResource.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Filament/Resources/Clients/ClientResource.php)
Register 3 new relation managers: `TitleApplicationsRelationManager`, `DrawingAttachmentsRelationManager`, `ComputationFilesRelationManager`.

### [NEW] `app/Filament/Resources/SurveyProjects/RelationManagers/DrawingsRelationManager.php`
Drawings scoped to a survey project (polymorphic).

### [NEW] `app/Filament/Resources/SurveyProjects/RelationManagers/ComputationsRelationManager.php`
Computation files scoped to a survey project.

---

## Week 3 — Ministry File & Transfer Enhancements

### [MODIFY] [MinistryFileResource.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Filament/Resources/MinistryFiles/MinistryFileResource.php)
- Add `memo_number`, `memo_date`, `memo_day` fields to form
- Add `assigned_to_id` Select (User relationship) replacing string `officer_in_charge`
- Add `current_stage` TextInput (inline-editable)
- Add `days_at_ministry` computed column to table (red if >14 days)
- Add transaction-type colour coding: IS=blue, Deed Plan=teal, Cover Letter=amber, Title=green

### [MODIFY] [TitleApplicationResource.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Filament/Resources/TitleApplications/TitleApplicationResource.php)
- Add `transaction_type` Select (new_title/transfer/verification)
- Add conditional transfer fields section (visible when transaction_type=transfer): valuation_amount, stamp_duty, valuation_date, chief_valuer_reference, transferor_name, transferee_name
- Add `dispatched_date` field
- Link to MzoSubmission

### [MODIFY] [MzoSubmissionResource.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Filament/Resources/MzoSubmissions/MzoSubmissionResource.php)
- Add `client_id` Select (searchable, preload)
- Add `assigned_tracker_id` Select
- Add **"Change Stage" Header Action** that calls `transitionStage()` with modal for comments → triggers SMS
- Show client name column in table

### [MODIFY] [ProgressTrackingRelationManager.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Filament/Resources/Clients/RelationManagers/ProgressTrackingRelationManager.php)
Complete redesign: replace boolean checkboxes with an embedded table of `ApprovalStep` rows showing Institution | Submitted | Officer | Status | Approved | Days.

---

## Week 4 — SMS Notifications

### [MODIFY] [MzoStageChanged.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Notifications/MzoStageChanged.php)
- Ensure it works when notifiable is a Client (not just User)
- Log to `notification_logs` with `client_id` and `trigger_event = 'mzo_stage'`

### [NEW] `app/Notifications/SurveyCompletedClientSms.php`
Fires when `SurveyProject.status → completed`. SMS: "GWS: Your [TYPE] survey for [LOCATION] has been completed."

### [NEW] `app/Notifications/MinistryFileSubmitted.php`
Fires when MzoSubmission created with status=submitted. SMS: "GWS: Your land file has been submitted to Ministry. Ref: [REF]."

### [NEW] `app/Notifications/TitleReadyForCollection.php`
Fires when `TitleApplication.status → issued`. SMS differs by transaction_type (new_title vs transfer).

### [NEW] `app/Notifications/PropertySaleCompleted.php`
Fires when `Property.status → sold`. SMS to seller client.

### [NEW] `app/Notifications/BirthdayGreeting.php`
Simple SMS: "GWS wishes you a Happy Birthday, [NAME]!"

### [NEW] `app/Console/Commands/SendBirthdayGreetings.php`
Daily scheduled command. Queries `clients` where `date_of_birth` matches today (month+day), `sms_opt_out = false`, sends `BirthdayGreeting`.

### [MODIFY] `app/Console/Kernel.php` (or `routes/console.php`)
Schedule `SendBirthdayGreetings` daily at 8:00 AM EAT.

### [MODIFY] [NotificationLog.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Models/NotificationLog.php)
Add `client_id`, `trigger_event` to `$fillable`. Add `client(): BelongsTo`.

### [NEW] `app/Filament/Resources/Clients/RelationManagers/SmsHistoryRelationManager.php`
Read-only table of `NotificationLog` filtered by `client_id` and `channel = 'sms'`.

---

## Week 5 — Property Sales Workflow

### [MODIFY] [PropertyResource.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Filament/Resources/Properties/PropertyResource.php)
- Add `buyer_client_id` Select
- Add `agreed_price`, `sale_date`, `commission_percent` fields
- Add "Mark as Sold" action: sets status=sold, sale_date=today, fires PropertySaleCompleted notification
- Add commission display column

### [NEW] `app/Filament/Resources/Clients/RelationManagers/PropertiesRelationManager.php`
Shows properties where client is owner (seller) OR buyer. Badge indicating role.

### [MODIFY] [ClientResource.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Filament/Resources/Clients/ClientResource.php)
Register `PropertiesRelationManager` and `SmsHistoryRelationManager`.

---

## Week 6 — Dashboard, Timeline & Bottleneck Banner

### [MODIFY] [ClientPortfolioWidget.php](file:///home/pkawalya/Desktop/projects/geo%20surveyors/app/Filament/Resources/Clients/Widgets/ClientPortfolioWidget.php)
Add to `getData()`:
- `titleApplications` — all title apps for this client
- `drawings` — all DrawingAttachments for this client
- `computations` — all ComputationFiles for this client
- `smsHistory` — recent SMS logs
- `timeline` — unified chronological merge of all events (from activity_log + notification_logs)
- `bottlenecks` — any service idle >7 days

### [MODIFY] `resources/views/filament/widgets/client-portfolio.blade.php`
Add new sections:
- **Bottleneck Banner** — red warning at top if any service stalled >7 days
- **Title Applications** tab
- **Drawings & Documents** grid
- **Timeline** tab (reverse-chronological)
- **SMS History** tab

### [NEW] `app/Filament/Widgets/ClientPipelineFunnel.php`
Dashboard widget: Application Signed → ALC → Physical Planning → DLB → MZO → Title Issued. Shows counts, clickable to filtered client lists.

### [NEW] `app/Filament/Widgets/FieldWorkSummary.php`
Dashboard widget: Counts per survey type (Preliminary/Final/Boundary/Topographic/Demarcation) with Done/Pending.

### [NEW] `app/Filament/Widgets/MinistryStallAlert.php`
Dashboard widget: Lists ministry files idle >14 days, sorted by days stalled. One-click reassign.

---

## Full File Summary

| Wk | Action | File | What |
|----|--------|------|------|
| 1 | NEW | Migration: client_centric_pivot | MZO, MinistryFile, TitleApp, Client, Property, NotificationLog columns |
| 1 | NEW | Migration: approval_steps | 8-step institution approval table |
| 1 | NEW | Migration: drawing_attachments | Polymorphic drawings table |
| 1 | NEW | Migration: computation_files | JR/traversal files table |
| 1 | MOD | Client.php | New relationships, SMS routing, lc1_area |
| 1 | MOD | MzoSubmission.php | client_id, tracker, transitionStage() |
| 1 | MOD | MinistryFile.php | memo fields, assigned_to, days_at_ministry |
| 1 | MOD | TitleApplication.php | transaction_type, transfer fields |
| 1 | MOD | Property.php | buyer, sale, commission fields |
| 1 | MOD | ClientProjectProgress.php | approvalSteps relationship, seedDefaults |
| 1 | NEW | ApprovalStep.php | Institution-based step model |
| 1 | NEW | DrawingAttachment.php | Polymorphic drawing model |
| 1 | NEW | ComputationFile.php | JR computation file model |
| 2 | NEW | DrawingAttachmentsRelationManager | Client drawings tab |
| 2 | NEW | ComputationFilesRelationManager | Client computations tab |
| 2 | NEW | TitleApplicationsRelationManager | Client titles tab |
| 2 | NEW | SurveyProject DrawingsRM | Survey drawings |
| 2 | NEW | SurveyProject ComputationsRM | Survey computations |
| 2 | MOD | ClientResource.php | Register new RMs |
| 3 | MOD | MinistryFileResource.php | Memo fields, assigned_to, days, colours |
| 3 | MOD | TitleApplicationResource.php | transaction_type, transfer fields |
| 3 | MOD | MzoSubmissionResource.php | client_id, tracker, stage change action |
| 3 | MOD | ProgressTrackingRelationManager | Redesign to ApprovalStep rows |
| 4 | MOD | MzoStageChanged.php | Client-aware, logs to NotificationLog |
| 4 | NEW | SurveyCompletedClientSms.php | SMS on survey complete |
| 4 | NEW | MinistryFileSubmitted.php | SMS on MZO submit |
| 4 | NEW | TitleReadyForCollection.php | SMS on title issued |
| 4 | NEW | PropertySaleCompleted.php | SMS on property sold |
| 4 | NEW | BirthdayGreeting.php | Birthday SMS |
| 4 | NEW | SendBirthdayGreetings.php | Daily artisan command |
| 4 | MOD | NotificationLog.php | client_id, trigger_event |
| 4 | NEW | SmsHistoryRelationManager | Client SMS log tab |
| 5 | MOD | PropertyResource.php | Buyer, sale, commission, mark-sold action |
| 5 | NEW | PropertiesRelationManager | Client properties tab |
| 6 | MOD | ClientPortfolioWidget.php | Titles, drawings, timeline, bottleneck |
| 6 | MOD | client-portfolio.blade.php | New tabs and bottleneck banner |
| 6 | NEW | ClientPipelineFunnel.php | Dashboard funnel widget |
| 6 | NEW | FieldWorkSummary.php | Dashboard survey counts widget |
| 6 | NEW | MinistryStallAlert.php | Dashboard stall alert widget |

---

## Verification Plan

```bash
# After each week:
php artisan migrate
php artisan serve

# Week 1: Models compile
php artisan tinker --execute="new \App\Models\ApprovalStep; new \App\Models\DrawingAttachment; new \App\Models\ComputationFile; echo 'OK';"

# Week 4: SMS pipeline
php artisan tinker --execute="\$c = \App\Models\Client::first(); \$c->notify(new \App\Notifications\BirthdayGreeting(\$c)); echo 'SMS sent';"

# Week 6: Dashboard widgets render
# Manual: visit /admin dashboard, verify funnel + stall alert
# Manual: view a client, verify all tabs render including timeline
```
