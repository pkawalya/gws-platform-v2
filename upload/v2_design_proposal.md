# GWS Platform V2 — Design Proposal
**Next-Generation Client-Centric Land & Survey Management System**  
**Target Release Window:** Q4 2026 – Q1 2027

---

## Executive Vision

V2 transforms the current highly successful client-centric pivot (V1.5) from a **powerful internal operations tool** into a **market-defining spatial operating system** for land professionals in Uganda and East Africa.

**Core Thesis:**  
Every piece of land, every client interaction, every approval, and every shilling flows through a **single source of truth** — the Client + their Spatial Footprint. V2 makes this truth **visible, intelligent, and collaborative** across clients, staff, regulators, and partners.

---

## Current State Assessment (V1.5 — Client-Centric Pivot)

**Strengths (Already Delivered)**
- Deep client hub with 12+ dedicated management pages (Surveys, MZO, Ministry, Titles, Approvals, Drawings, Financials, CRM, SMS, Tasks, Properties, Transfers)
- 8-institution `ApprovalStep` model with status, officers, deferrals
- Polymorphic `DrawingAttachment` + `ComputationFile`
- Event-driven SMS notifications (`MzoStageChanged`, `TitleReadyForCollection`, `BirthdayGreeting`, etc.)
- Rich widgets: ClientPortfolio, ClientInsights, PipelineFunnel, MinistryStallAlert, TopClients
- NIN OCR, tickets, HR/payroll, requisitions, transfer files
- Strong foundation in Laravel + Filament + PostGIS

**Gaps & Friction Points**
- Fragmented client experience (12+ separate pages instead of one unified workspace)
- Static approval workflows (no visual designer, no conditional logic)
- Map usage is secondary rather than primary navigation
- Limited AI beyond basic OCR
- Client portal is minimal compared to internal power
- Timeline exists in widgets but is not a first-class explorable object
- High context-switching for staff between modules
- Scaling risk: hard to onboard new branches or partner firms

---

## V2 Design Principles

1. **Client Obsession** — Every screen, notification, and workflow must answer: "What does this mean for this specific client right now?"
2. **Spatial as Primary Metaphor** — Land is inherently spatial. Maps, layers, and geometry become the main way users navigate and understand context.
3. **Event Sourcing + Causality** — Every change is an immutable event. Users can ask "why did this happen?" and see the full causal graph.
4. **Progressive Disclosure** — Clients see simplicity and clarity. Staff see power and control. AI sees everything.
5. **Zero Paper by Default** — Every statutory form, drawing, memo, and signature is digital-first with cryptographic audit.
6. **Intelligence as Co-pilot** — AI suggests pricing, flags risks, predicts bottlenecks, auto-fills forms — never decides alone.
7. **Multi-Tenant Ready** — The platform must support multiple firms, branches, or franchises without code changes.

---

## Four Major V2 Pillars

### Pillar 1: Unified Client Command Center (The "Client OS")
**Problem:** Staff currently switch between 12+ ManageClient* pages.

**V2 Solution:**
- Single `ClientWorkspace` page (replaces most per-module pages)
- Composable "Blocks" that can be rearranged per user role:
  - Spatial Footprint (interactive map of all projects/properties/ministry files)
  - Approval Timeline (8-step + custom steps, live status)
  - Financial Cockpit (quotations → invoices → payments → forecasts)
  - Document & Drawing Vault (with version tree + e-sign)
  - Communication Hub (SMS + email + WhatsApp + internal notes)
  - AI Insights Panel (risk score, next best action, predicted completion)
- Deep linking: every block has stable URLs so staff can share "Client X – Ministry Stall" directly
- Role-based default layouts (Surveyor vs Accountant vs Partner)

**Outcome:** 70% reduction in context switching. One place for everything about a client.

### Pillar 2: Visual Workflow Studio + Intelligent Routing
**Problem:** `ApprovalStep` is powerful but static.

**V2 Solution:**
- New `WorkflowDefinition` model + visual designer (node-based, drag-drop)
- Nodes: Institution, Conditional Branch, SLA Timer, Notification, Form Generation, AI Review
- Pre-built templates for:
  - Customary → Freehold (8 institutions)
  - Title Transfer
  - Subdivision + MZO
  - Property Sale (internal + external)
- Runtime engine that:
  - Auto-creates `ApprovalStep` instances from the definition
  - Predicts delays using historical data
  - Suggests re-routing when a step is deferred > X days
- "What-if" simulator for partners to test new processes

**Outcome:** Non-technical managers can evolve processes without developer involvement.

### Pillar 3: Spatial Operating System (Maps First)
**Problem:** Maps are currently widgets, not the primary interface.

**V2 Solution:**
- New top-level navigation: **Map** (alongside Dashboard, Clients, Projects, etc.)
- Layer system:
  - Survey Projects (polygons + points)
  - Properties (with status heat)
  - Ministry Files & MZO Submissions (as location pins)
  - Client Footprint (union of all geometries for one client)
  - DLB / Physical Planning zones (imported shapefiles)
- Click any geometry → opens contextual "Spatial Card" showing:
  - Linked client(s)
  - Current workflow state
  - Documents & drawings
  - Financial summary
- Field mobile app (Flutter/React Native) for offline coordinate capture, photo evidence, and instant sync
- Advanced spatial queries:
  - "Show all clients with land inside this 5km radius of proposed road"
  - "Which ministry files are within 50m of a reserve boundary?"

**Outcome:** The map becomes the fastest way to answer "where are we with this land?"

### Pillar 4: AI Co-Pilot & Compliance Engine
**Problem:** Staff spend too much time on repetitive cognitive work.

**V2 Solution:**
- **Document Intelligence**
  - Auto-classify uploaded PDFs/DWG (statutory form type, survey plan version)
  - Extract fields from scanned title deeds, NINs, affidavits
  - Risk scoring: "This title application has 3 missing bonafide occupant affidavits — 87% chance of deferral"
- **Financial Intelligence**
  - Dynamic pricing engine (historical + market + complexity factors)
  - Client lifetime value + churn risk prediction
  - Automatic "ready for final invoice" detection
- **Operational Intelligence**
  - Bottleneck predictor (replaces simple "idle >14 days")
  - Next-best-action recommendations on every client workspace
  - Auto-generation of statutory forms with 95%+ accuracy
- **Client-Facing AI**
  - Portal chatbot that answers "where is my file?" with accurate status + estimated completion
  - Proactive SMS: "Your file is likely to be deferred at DLB next week — here is what you can prepare"

**Governance:** All AI suggestions are logged, explainable, and require human confirmation for regulatory actions.

---

## Proposed Information Architecture (V2)

### Navigation (Top Level)
- Dashboard (role-customizable)
- **Map** (new primary entry point)
- Clients (now opens ClientWorkspace by default)
- Survey Projects
- Properties & Sales
- Ministry & MZO
- Titles & Legal
- Finance
- Field Operations (new — mobile sync, requisitions)
- AI Studio (new — workflow designer, prompt library, model monitoring)
- Settings & Compliance

### Client Experience
- Public marketing site + lead capture
- Self-service portal v2:
  - Real-time spatial status map for their projects
  - E-signature on all documents
  - Pay now (mobile money + card)
  - Document vault with expiry alerts
  - Direct chat with assigned officer (with SLA)

---

## Data Model Evolution (Key Additions)

| Area                    | New/Changed Concepts                              | Rationale |
|-------------------------|---------------------------------------------------|---------|
| Workflow                | `WorkflowDefinition`, `WorkflowInstance`, `WorkflowNode`, `WorkflowEdge` | Visual designer + execution |
| Events                  | `DomainEvent` (immutable, append-only)            | Full audit + replay + ML training |
| Spatial                 | `SpatialLayer`, `GeometryCollection`, `SpatialQuery` | Map-first experience |
| AI                      | `AiSuggestion`, `AiModelVersion`, `PromptTemplate` | Governance & explainability |
| Multi-tenancy           | `Organization`, `Branch`, `TenantSettings`        | Franchise / branch scaling |
| Field Mobile            | `FieldSession`, `OfflineChange`, `SyncLog`        | Reliable offline capture |

Existing models (`Client`, `ApprovalStep`, `DrawingAttachment`, etc.) remain largely stable — V2 adds orchestration and intelligence layers on top.

---

## Technology & Architecture Shifts

- **Frontend**: Filament v4 (or v5 when stable) + Livewire 3 + Alpine. Heavy use of Filament's new schema & action systems.
- **Maps**: Keep Leaflet + PostGIS. Add Mapbox GL or ArcGIS JS for advanced layers if budget allows. Consider Filament Map builder plugin.
- **AI Layer**: Introduce Laravel + OpenAI/Anthropic + local models (for sensitive data). Use Laravel Reverb + queues for real-time suggestions.
- **Mobile**: New Flutter or React Native app for field teams. Sync via Laravel Sanctum + offline-first architecture (WatermelonDB or similar).
- **Workflow Engine**: Evaluate `temporal.io` or build lightweight engine on top of Laravel queues + state machines. Prefer in-house for regulatory control unless complexity explodes.
- **Event Sourcing**: Introduce lightweight event store (could start with `domain_events` table + projectors) before committing to full EventStoreDB.
- **Multi-tenancy**: Use Laravel's built-in tenancy or Stancl/Tenancy package. Land data must be strictly isolated.
- **Observability**: OpenTelemetry + Grafana + Sentry. Every AI decision and workflow transition must be traceable.

---

## Phased Delivery Roadmap (18 months)

**Phase 0 — Foundation (Months 1-2)**
- Stabilize V1.5 (bug fixes, performance, NIN OCR hardening)
- Define V2 data contracts and event schema
- Set up AI governance & security review process

**Phase 1 — Client Command Center (Months 3-6)**
- Build unified `ClientWorkspace`
- Migrate 80% of existing ManageClient* pages into composable blocks
- Introduce basic AI next-best-action panel

**Phase 2 — Visual Workflows & Spatial OS (Months 7-12)**
- Workflow Studio + execution engine
- New top-level Map with layer system
- Mobile field app MVP (offline coordinates + photos)

**Phase 3 — Intelligence & Scale (Months 13-18)**
- Full AI co-pilot (pricing, risk, form generation)
- Client portal v2 with e-sign and chatbot
- Multi-tenant / multi-branch support
- Public API + partner integration layer

---

## Success Metrics (V2 Launch + 12 months)

- **Internal Efficiency**
  - Average time from client inquiry to first invoice: ↓ 40%
  - Staff context switches per client per day: ↓ 60%
  - Bottleneck resolution time: ↓ 50%

- **Client Experience**
  - Client portal adoption: >65% of active clients
  - NPS score: >70
  - % of documents signed electronically: >85%

- **Revenue & Growth**
  - Revenue per surveyor: ↑ 35%
  - New client acquisition via portal referrals: >25%
  - AI-suggested pricing acceptance rate: >70%

- **Regulatory & Risk**
  - Deferral rate at MZO/DLB: ↓ 30%
  - Audit finding remediation time: <48 hours
  - Zero successful paper-based fraud cases

---

## Risks & Mitigations

| Risk                              | Mitigation |
|-----------------------------------|----------|
| AI hallucinations on legal docs   | Human-in-loop + strict logging + model versioning |
| Map performance with large datasets | Aggressive tiling, PostGIS materialized views, client-side clustering |
| Staff resistance to new workspace | Extensive co-design with power users + role-specific defaults |
| Mobile offline sync conflicts     | Clear conflict resolution UI + immutable event log |
| Regulatory change (new forms)     | Workflow Studio designed so non-devs can adapt quickly |

---

## Open Questions for Leadership

1. Budget range for AI infrastructure and mobile development (2026-2027)?
2. Priority: deeper client self-service portal or faster internal staff tools?
3. Appetite for multi-tenant / white-label offering within 18 months?
4. Preferred mobile stack (Flutter vs React Native) based on existing team skills?
5. Do we want to open a limited public API for banks, law firms, and DLB systems?

---

**Document Status:** Draft for internal review  
**Author:** Kilo (based on analysis of current codebase + implementation plans)  
**Last Updated:** May 25, 2026  
**Next Review:** June 1, 2026 (after leadership alignment on open questions)

---

*This document is intended as the single source of truth for all V2 architectural and product decisions. All subsequent technical spikes, epics, and user stories should trace back to one of the four pillars above.*

---

## AI-Executable V2 System Breakdown & Implementation Blueprint

**Purpose for AI Agents:**  
This section is the **runnable specification**. An AI coding agent must follow it sequentially with minimal deviation. Every instruction is explicit (create file, modify X at line Y pattern, follow existing pattern from Z).

**Strict Rules for Any AI Implementing This:**
1. Never invent new patterns when an existing one is visible in the codebase. Always study and replicate the style of:
   - `ClientPortfolioWidget.php` + `client-insights.blade.php` (for client blocks)
   - `NinOcrService.php` (for AI service structure)
   - `ManageClient*` pages (e.g. `ManageClientMinistry.php`, `ManageClientApprovals.php`) for per-client context handling
   - `ministry-work.blade.php` custom Filament page pattern
   - `PrefillsContextFromUrl.php` and `PrefillsProjectFromUrl.php` traits
   - `SurveyReportController.php` + `survey-report.blade.php` for complex PDF/print views
   - `TopClientsWidget.php`, `ClientInsightsWidget.php`, `ClientPortfolioWidget.php` for dashboard widgets
   - Current client-centric migration `2026_05_06_010000_elevate_client_centric_hierarchy.php` and `2026_05_16_120000_client_centric_pivot.php`
2. All new Filament components must live under the correct `Filament/Resources/...` or `Filament/Pages/...` or `Filament/Widgets/...` namespaces.
3. Use existing Uganda location helpers (`UgandaLocations`, `UgandaAdminUnit`) and NIN patterns.
4. Every new model must have a corresponding migration + factory + seeder update where relevant.
5. All AI-related code must be auditable (log every call, store prompt + response + model version).
6. Preserve all existing `ManageClient*` pages during Phase 1 migration — do not delete until the new workspace is proven.
7. Prioritize PostGIS + Leaflet for spatial work. Do not introduce new map libraries without explicit approval in this doc.
8. Every major user-facing change must include a Filament notification + activity log entry using existing Spatie patterns.

---

### Phase 0 — Foundation Scaffolding (AI Must Complete First)

**0.1 Event Sourcing Foundation**
- Create migration: `database/migrations/2026_06_XX_000000_create_domain_events_table.php`
  - Columns: `id`, `event_type`, `aggregate_type`, `aggregate_id`, `payload` (json), `metadata` (json), `causer_type`, `causer_id`, `occurred_at`, `recorded_at`
  - Add indexes on `aggregate_type + aggregate_id`, `event_type`, `occurred_at`
- Create model: `app/Models/DomainEvent.php` (immutable, append-only, no updates/deletes)
- Create service: `app/Services/EventStore.php`
  - Methods: `record(string $eventType, Model $aggregate, array $payload, array $metadata = [])`
  - `replay(string $aggregateType, int $aggregateId, ?Carbon $since = null)`
- Create trait: `app/Traits/RecordsDomainEvents.php` (boot method that fires events on model changes)
- Update `StaffRolesSeeder.php` with new permissions: `view_events`, `replay_events`, `manage_ai_prompts`

**0.2 AI Governance Layer**
- Create table + model: `ai_model_versions` (provider, model_name, version, is_active, config_json, cost_per_1k_tokens)
- Create table + model: `ai_prompt_templates` (key, version, template_text, variables_schema json, max_tokens, temperature)
- Create service: `app/Services/Ai/AiOrchestrator.php` (inspired exactly by `NinOcrService.php` structure)
  - Must support OpenAI + Anthropic + local (Ollama) via config
  - Every call must create an `AiCallLog` record (new model)
- Create model: `app/Models/AiCallLog.php` + migration
- Create Filament resource (read-only): `AiCallLogResource` under new `Filament/Resources/Ai/` namespace

**0.3 Multi-Tenancy Scaffolding (Minimal)**
- Create migration for `organizations` and `branches` tables (minimal for now: id, name, slug, settings json, is_active)
- Add `organization_id` and `branch_id` (nullable) to `users`, `clients`, `survey_projects`, `properties`, `mzo_submissions`, `title_applications`
- Create middleware + Filament tenant switcher (follow Stancl/Tenancy patterns if package is added, otherwise simple session-based scoping)
- Do **not** enforce isolation yet — just add columns and scope queries where obvious.

---

### Phase 1 — Unified Client Command Center (Months 3-6)

**Goal:** Deliver one `ClientWorkspace` page that renders all current functionality via composable blocks. Existing `ManageClient*` pages remain as fallback during transition.

**1.1 Core Workspace Page**
- Create new Filament Page: `app/Filament/Resources/Clients/Pages/ClientWorkspace.php`
  - Route: `/admin/clients/{record}/workspace`
  - Accept `client` record via `mount()`
  - Use Livewire + Filament sections for blocks
  - Support `?block=approvals` deep linking (use `PrefillsContextFromUrl` trait pattern)
- Modify `ClientResource.php`:
  - Add new navigation item or "Workspace" action that links to the new page
  - Keep `ViewClient` for now

**1.2 Composable Block System (Livewire Components)**
Create these as Livewire components under `app/Livewire/ClientWorkspace/` (or Filament widgets if preferred):

1. `SpatialFootprintBlock.php` + `spatial-footprint-block.blade.php`
   - Embed Leaflet map showing union of all geometries for this client (survey_polygons, properties, mzo_submissions with location)
   - Use existing map patterns from dashboard widgets

2. `ApprovalTimelineBlock.php` + blade
   - Visual 8-step (or dynamic) horizontal/vertical timeline
   - Pull from `ApprovalStep` + new `WorkflowInstance` later
   - Show officer, dates, deferral reasons, SLA warnings (red if >14 days idle)

3. `FinancialCockpitBlock.php` + blade
   - Summary cards: Total quoted, Invoiced, Paid, Outstanding, Forecast
   - Mini table of recent quotations/invoices/payments (link to full resources)
   - Use patterns from `ConsolidatedFinancialsWidget.php`

4. `DocumentVaultBlock.php` + blade
   - Grid + table of `DrawingAttachment`, `ComputationFile`, `ProjectDocument`, `DocumentVersion`
   - Version tree view for drawings
   - Upload action that creates polymorphic attachments

5. `CommunicationHubBlock.php` + blade
   - Unified list of `NotificationLog` (SMS), `ClientInteraction`, internal notes
   - Quick "Send SMS" action that reuses existing notification classes

6. `AiInsightsBlock.php` + blade
   - Call `AiOrchestrator` for:
     - Next best action
     - Risk score (e.g. "High chance of DLB deferral")
     - Predicted completion date
   - Every suggestion must render with "Accept / Reject / Ignore" buttons that log to `AiCallLog` and `DomainEvent`

**1.3 Migration of Existing ManageClient Pages (Do Not Delete Yet)**
- For each existing `ManageClientXxx.php` page, extract the main table/widget logic into a corresponding `*Block` component above.
- Update the old pages to show a banner: "This view will be removed after [date]. Use the new Workspace instead." with a direct link.

**1.4 New Widgets to Create**
- `ClientWorkspaceHeaderWidget.php` (client name, quick stats, primary actions)
- `BottleneckBannerWidget.php` (red banner if any approval step or ministry file idle > threshold)

**1.5 Files to Modify**
- `Client.php` model: add relationships for quick workspace queries (all drawings, all computations, all approval steps, etc.)
- `app/Filament/Resources/Clients/Widgets/` — add the new workspace-specific widgets
- Update `ViewClient.php` to offer "Open in Workspace" button

---

### Phase 2 — Visual Workflow Studio + Spatial OS (Months 7-12)

**2.1 Workflow Engine**

**Models & Migrations (create in order):**
- `workflow_definitions` (id, name, key, version, is_active, definition_json (nodes + edges), created_by)
- `workflow_instances` (enhance existing or new — link to definition)
- `workflow_nodes` and `workflow_edges` (or store as json in definition for v1 of studio)

**Filament Components:**
- New Resource: `WorkflowDefinitionResource` with visual canvas
  - Use Filament Form + a custom view that renders a simple node editor (start with JSON textarea + live preview, then upgrade to drag-drop using Alpine/JS)
  - Pre-load 4 templates mentioned in Pillar 2 as seed data in a new seeder `WorkflowTemplateSeeder.php`

**Runtime:**
- Create `app/Services/Workflow/WorkflowEngine.php`
- On `ClientProjectProgress` or `TitleApplication` creation, check for matching `WorkflowDefinition` and auto-instantiate steps
- Replace or augment current `ApprovalStep` seeding logic

**2.2 Spatial Operating System (Map as First-Class)**

**New Top-Level Navigation**
- Create `app/Filament/Pages/SpatialMap.php` (custom Filament page, not resource)
  - Full-screen Leaflet map (copy pattern from `ministry-work.blade.php` and enhance)
  - Left sidebar: Layer toggles + search
  - Click handler opens "Spatial Card" slide-over (Livewire component)

**New Models:**
- `spatial_layers` (name, type, config_json, is_active, sort_order)
- `spatial_queries` (saved queries for "5km radius of proposed road" etc.)

**Enhancements to Existing Models:**
- Ensure every model with geometry (`SurveyProject`, `Property`, `MzoSubmission`, `MinistryFile`) has proper PostGIS accessors (follow current `SurveyPolygon` / `SurveyCoordinate` patterns)

**Advanced Spatial Features (Phase 2.2):**
- Create `app/Services/Spatial/SpatialQueryService.php`
- Implement the two example queries from Pillar 3 using raw PostGIS or Magellan

**Mobile Field App Scaffolding (Prep only in Phase 2)**
- Document the API contract in `docs/api/field-sync-contract.md`
- Create Sanctum token endpoint + basic `FieldSessionController`
- Do not build the Flutter/React Native app until Phase 2 is approved

---

### Phase 3 — Full AI Co-Pilot + Scale (Months 13-18)

**3.1 AI Features (Build on Phase 0 foundation)**

**Document Intelligence:**
- Enhance `NinOcrService.php` or create `DocumentIntelligenceService.php`
- Add methods:
  - `classifyDocument(UploadedFile $file)`
  - `extractTitleFields(UploadedFile $file)`
  - `detectMissingBonafideAffidavits(TitleApplication $app)`
- Store results in new `ai_document_analyses` table

**Financial & Operational Intelligence:**
- Create `PricingIntelligenceService.php`
- Create `BottleneckPredictorService.php` (uses `DomainEvent` history + simple ML or rules)

**Client-Facing AI:**
- In the future client portal (separate project or Filament custom panel), add a chat endpoint that calls the orchestrator with strict RAG over the client's own `DomainEvent` + documents only.

**3.2 Multi-Tenant Hardening**
- Enforce tenant scoping on all queries using global scopes or Filament's `tenant()` method
- Add `OrganizationResource` and `BranchResource` (minimal)

**3.3 Client Portal v2**
- New Filament panel `ClientPanelProvider` (or enhance existing if any)
- Key pages: `MyProjects`, `MyDocuments`, `MyPayments`, `SpatialStatusMap` (read-only version of internal map)

---

### Cross-Cutting Implementation Checklist (AI Must Verify at End of Each Phase)

- [ ] Every new model has migration, model, factory, and is registered in `StaffRolesSeeder` with appropriate permissions
- [ ] All Filament resources/pages/widgets are discovered automatically or explicitly registered
- [ ] Every AI call creates an `AiCallLog` + `DomainEvent`
- [ ] All new pages support the existing `?client_id=` and `?project_id=` prefill traits
- [ ] Mobile money / SMS integrations continue to work (do not break existing `MzoStageChanged` etc. notifications)
- [ ] All new map code uses the same Leaflet initialization pattern as current dashboard widgets
- [ ] Full test coverage for new services (at minimum happy path + one failure mode)
- [ ] Update this document's "Last Updated" date and add a changelog entry at the top of this section

---

### Reference Implementation Order (Strict)

1. Phase 0 scaffolding (events + AI governance) — do not skip
2. `ClientWorkspace` page shell + header block
3. One block at a time (start with ApprovalTimelineBlock as it has the most existing data)
4. Spatial map page (Phase 2)
5. Workflow studio (Phase 2)
6. AI intelligence features (Phase 3)

**Do not begin Phase 2 until Phase 1 workspace is in production use by at least 3 staff members for 2 weeks.**

---

**End of AI-Executable Blueprint**

This section is the contract. Any AI agent starting work must begin at Phase 0 and report completion of each checklist item before proceeding.
