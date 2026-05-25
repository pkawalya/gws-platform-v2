# DATABASE MIGRATION STRUCTURE
**Laravel 12 + PostgreSQL + PostGIS Schema**

---

## MIGRATION EXECUTION ORDER

### **1. Enable PostGIS Extension**
```php
// database/migrations/2026_02_10_000001_enable_postgis.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS postgis');
        DB::statement('CREATE EXTENSION IF NOT EXISTS postgis_topology');
        DB::statement('CREATE EXTENSION IF NOT EXISTS fuzzystrmatch');
        DB::statement('CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder');
    }

    public function down(): void
    {
        DB::statement('DROP EXTENSION IF EXISTS postgis_tiger_geocoder');
        DB::statement('DROP EXTENSION IF EXISTS fuzzystrmatch');
        DB::statement('DROP EXTENSION IF EXISTS postgis_topology');
        DB::statement('DROP EXTENSION IF EXISTS postgis');
    }
};
```

---

### **2. Core System Tables**

#### **Users & Roles**
```php
// database/migrations/2026_02_10_000100_create_roles_table.php
Schema::create('roles', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('slug')->unique();
    $table->json('permissions')->nullable();
    $table->text('description')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

// database/migrations/2026_02_10_000101_create_permissions_table.php
Schema::create('permissions', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('slug')->unique();
    $table->string('module'); // surveying, real_estate, legal, finance, system
    $table->text('description')->nullable();
    $table->timestamps();
});

// database/migrations/2026_02_10_000102_create_role_user_table.php
Schema::create('role_user', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('role_id')->constrained()->cascadeOnDelete();
    $table->timestamps();
    
    $table->primary(['user_id', 'role_id']);
});

// database/migrations/2026_02_10_000103_enhance_users_table.php
Schema::table('users', function (Blueprint $table) {
    $table->string('phone')->nullable()->after('email');
    $table->string('nin')->nullable()->unique()->after('phone'); // National ID
    $table->string('license_number')->nullable()->after('nin'); // Surveyor license
    $table->boolean('is_active')->default(true)->after('license_number');
    $table->timestamp('last_login_at')->nullable()->after('is_active');
    $table->string('avatar_url')->nullable()->after('last_login_at');
    $table->softDeletes();
});
```

---

### **3. Client Management**

```php
// database/migrations/2026_02_10_000200_create_clients_table.php
Schema::create('clients', function (Blueprint $table) {
    $table->id();
    $table->string('client_number')->unique(); // Auto-generated: CLI-2026-0001
    $table->enum('client_type', ['individual', 'organization']);
    $table->string('name'); // Individual name or organization name
    $table->string('organization_name')->nullable();
    $table->string('email')->unique();
    $table->string('phone');
    $table->string('alternative_phone')->nullable();
    $table->string('nin')->nullable(); // National ID Number
    $table->string('tin')->nullable(); // Tax Identification Number
    $table->text('physical_address')->nullable();
    $table->text('postal_address')->nullable();
    $table->string('district')->nullable();
    $table->string('region')->nullable();
    $table->enum('preferred_contact_method', ['email', 'phone', 'sms', 'whatsapp'])->default('email');
    $table->string('budget_range')->nullable();
    $table->json('property_preferences')->nullable(); // Location, type, size preferences
    $table->timestamp('kyc_verified_at')->nullable();
    $table->json('kyc_documents')->nullable(); // IDs, proof of address
    $table->text('notes')->nullable();
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
    $table->softDeletes();
    
    // Indexes
    $table->index('client_number');
    $table->index('email');
    $table->index('phone');
    $table->index('district');
});
```

---

### **4. Survey Projects**

```php
// database/migrations/2026_02_10_000300_create_survey_projects_table.php
use Illuminate\Support\Facades\DB;

Schema::create('survey_projects', function (Blueprint $table) {
    $table->id();
    $table->string('project_number')->unique(); // SUR-2026-0001
    $table->foreignId('client_id')->constrained()->cascadeOnDelete();
    
    // Project Classification
    $table->enum('project_type', [
        'boundary', 'subdivision', 'topographic', 'engineering',
        'cadastral', 'gis_mapping', 'dispute', 'volumetric', 'as_built'
    ]);
    
    // Location Details
    $table->text('location_address');
    $table->string('location_district');
    $table->string('location_region')->nullable();
    $table->decimal('location_latitude', 10, 8)->nullable();
    $table->decimal('location_longitude', 11, 8)->nullable();
    
    // Status Workflow
    $table->enum('status', [
        'inquiry', 'quotation_sent', 'quotation_accepted', 'payment_pending',
        'fieldwork_scheduled', 'fieldwork_in_progress', 'fieldwork_complete',
        'office_processing', 'quality_review', 'mzo_submission', 'mzo_processing',
        'approved_for_delivery', 'delivered', 'completed', 'on_hold', 'cancelled'
    ])->default('inquiry');
    
    // Assignment
    $table->foreignId('assigned_surveyor_id')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('assigned_team_id')->nullable()->constrained('teams')->nullOnDelete();
    $table->foreignId('quality_reviewer_id')->nullable()->constrained('users')->nullOnDelete();
    
    // Dates
    $table->date('requested_completion_date')->nullable();
    $table->date('fieldwork_scheduled_date')->nullable();
    $table->date('fieldwork_completed_date')->nullable();
    $table->date('office_processing_completed_date')->nullable();
    $table->date('delivered_date')->nullable();
    $table->date('actual_completion_date')->nullable();
    
    // Technical Details
    $table->string('coordinate_system')->default('WGS84'); // WGS84, UTM_36N, etc.
    $table->decimal('total_area_sqm', 15, 2)->nullable();
    $table->decimal('total_area_hectares', 15, 4)->nullable();
    $table->decimal('total_area_acres', 15, 4)->nullable();
    $table->decimal('perimeter_m', 15, 2)->nullable();
    $table->decimal('closure_error', 10, 6)->nullable();
    
    // Notes & Instructions
    $table->text('special_instructions')->nullable();
    $table->text('field_notes')->nullable();
    $table->text('office_notes')->nullable();
    $table->text('quality_review_notes')->nullable();
    $table->text('client_feedback')->nullable();
    
    // Metadata
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('approved_at')->nullable();
    $table->timestamps();
    $table->softDeletes();
    
    // Indexes
    $table->index('project_number');
    $table->index('client_id');
    $table->index('status');
    $table->index('assigned_surveyor_id');
    $table->index('location_district');
});

// Add PostGIS geometry column
DB::statement("
    ALTER TABLE survey_projects 
    ADD COLUMN location_gps geography(POINT, 4326)
");

// Create spatial index
DB::statement("
    CREATE INDEX survey_projects_location_gps_idx 
    ON survey_projects 
    USING GIST (location_gps)
");

// database/migrations/2026_02_10_000301_create_survey_coordinates_table.php
Schema::create('survey_coordinates', function (Blueprint $table) {
    $table->id();
    $table->foreignId('project_id')->constrained('survey_projects')->cascadeOnDelete();
    $table->integer('version')->default(1); // For versioning coordinate datasets
    $table->string('point_number'); // e.g., "P1", "CP1", "TP1"
    $table->decimal('x_coordinate', 15, 8); // Easting or Longitude
    $table->decimal('y_coordinate', 15, 8); // Northing or Latitude
    $table->decimal('z_elevation', 10, 3)->nullable(); // Elevation in meters
    $table->string('description')->nullable(); // "Corner post", "Iron peg", etc.
    $table->string('observation_type')->nullable(); // GPS, Total Station, etc.
    $table->string('instrument_used')->nullable();
    $table->string('observer_name')->nullable();
    $table->timestamp('observation_datetime')->nullable();
    $table->text('environmental_notes')->nullable(); // Weather, visibility
    $table->timestamps();
    
    // Indexes
    $table->index(['project_id', 'version']);
    $table->unique(['project_id', 'version', 'point_number']);
});

// Add geometry column
DB::statement("
    ALTER TABLE survey_coordinates 
    ADD COLUMN geometry geography(POINT, 4326)
");

// database/migrations/2026_02_10_000302_create_survey_polygons_table.php
Schema::create('survey_polygons', function (Blueprint $table) {
    $table->id();
    $table->foreignId('project_id')->constrained('survey_projects')->cascadeOnDelete();
    $table->integer('version')->default(1);
    $table->enum('polygon_type', ['boundary', 'subdivision', 'easement', 'buffer', 'exclusion']);
    $table->string('description')->nullable();
    $table->decimal('area_sqm', 15, 2);
    $table->decimal('area_hectares', 15, 4);
    $table->decimal('area_acres', 15, 4);
    $table->decimal('perimeter_m', 15, 2);
    $table->json('coordinate_points')->nullable(); // Array of point_numbers
    $table->timestamps();
    
    $table->index(['project_id', 'version']);
});

// Add geometry column
DB::statement("
    ALTER TABLE survey_polygons 
    ADD COLUMN geometry geography(POLYGON, 4326)
");

DB::statement("
    CREATE INDEX survey_polygons_geometry_idx 
    ON survey_polygons 
    USING GIST (geometry)
");

// database/migrations/2026_02_10_000303_create_survey_milestones_table.php
Schema::create('survey_milestones', function (Blueprint $table) {
    $table->id();
    $table->foreignId('project_id')->constrained('survey_projects')->cascadeOnDelete();
    $table->string('milestone_name'); // "Fieldwork Complete", "Report Approved"
    $table->text('milestone_description')->nullable();
    $table->date('planned_date')->nullable();
    $table->date('actual_completion_date')->nullable();
    $table->foreignId('responsible_user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->enum('status', ['pending', 'in_progress', 'completed', 'delayed', 'cancelled'])->default('pending');
    $table->text('comments')->nullable();
    $table->integer('order')->default(0); // Display order
    $table->timestamps();
    
    $table->index('project_id');
});

// database/migrations/2026_02_10_000304_create_survey_reports_table.php
Schema::create('survey_reports', function (Blueprint $table) {
    $table->id();
    $table->foreignId('project_id')->constrained('survey_projects')->cascadeOnDelete();
    $table->integer('report_version')->default(1);
    $table->string('report_number')->unique(); // REP-2026-0001
    $table->enum('report_type', ['preliminary', 'final', 'as_built', 'supplementary']);
    $table->string('file_path'); // Storage path
    $table->string('file_name');
    $table->string('file_hash')->nullable(); // SHA256 for integrity
    $table->integer('file_size')->nullable(); // Bytes
    $table->text('methodology_description')->nullable();
    $table->text('compliance_statement')->nullable();
    $table->string('surveyor_name')->nullable();
    $table->string('surveyor_license')->nullable();
    $table->string('surveyor_signature_path')->nullable();
    $table->string('manager_signature_path')->nullable();
    $table->timestamp('generated_at')->nullable();
    $table->timestamp('approved_at')->nullable();
    $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
    $table->boolean('is_final')->default(false);
    $table->timestamps();
    $table->softDeletes();
    
    $table->index('project_id');
    $table->index('report_number');
});
```

---

### **5. MZO Integration**

```php
// database/migrations/2026_02_10_000400_create_mzo_submissions_table.php
Schema::create('mzo_submissions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('project_id')->constrained('survey_projects')->cascadeOnDelete();
    
    $table->enum('submission_type', ['is', 'deed_plan', 'jrj']); // I/S, Deed Plan, Job Record Jacket
    $table->string('kbo_number')->nullable()->unique(); // KBO transaction number
    
    // Dates
    $table->date('submission_date')->nullable();
    $table->date('receipt_date')->nullable();
    $table->date('expected_completion_date')->nullable();
    $table->date('actual_completion_date')->nullable();
    
    // Workflow Tracking
    $table->enum('current_stage', [
        'draft', 'submitted', 'intake', 'scanning', 'physical_planner',
        'land_officer', 'sss_review', 'approved', 'deferred', 'rejected'
    ])->default('draft');
    
    $table->string('assigned_land_officer')->nullable();
    $table->string('land_office_location')->nullable();
    
    // Cadastral Checks
    $table->enum('cadastral_check_status', ['pending', 'in_progress', 'passed', 'failed'])->default('pending');
    $table->boolean('encroachment_detected')->default(false);
    $table->boolean('reserve_encroachment')->default(false);
    $table->boolean('block_verification_passed')->default(false);
    $table->text('cadastral_notes')->nullable();
    
    // Deferral Management
    $table->text('deferral_reason')->nullable();
    $table->integer('resubmission_count')->default(0);
    $table->date('resubmission_deadline')->nullable();
    
    // Documents
    $table->json('submitted_documents')->nullable(); // Array of document IDs
    $table->json('required_documents_checklist')->nullable();
    
    $table->text('notes')->nullable();
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
    $table->softDeletes();
    
    $table->index('project_id');
    $table->index('kbo_number');
    $table->index('current_stage');
});

// database/migrations/2026_02_10_000401_create_mzo_workflow_logs_table.php
Schema::create('mzo_workflow_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('submission_id')->constrained('mzo_submissions')->cascadeOnDelete();
    $table->string('from_stage')->nullable();
    $table->string('to_stage');
    $table->string('processed_by_name')->nullable(); // MZO officer name
    $table->foreignId('processed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('processing_datetime');
    $table->text('comments')->nullable();
    $table->json('documents_attached')->nullable();
    $table->timestamps();
    
    $table->index('submission_id');
});
```

---

### **6. Title Processing**

```php
// database/migrations/2026_02_10_000500_create_title_applications_table.php
Schema::create('title_applications', function (Blueprint $table) {
    $table->id();
    $table->string('application_number')->unique(); // TTL-2026-0001
    $table->foreignId('project_id')->nullable()->constrained('survey_projects')->nullOnDelete();
    $table->foreignId('client_id')->constrained()->cascadeOnDelete();
    
    $table->enum('application_type', [
        'customary_to_freehold', 'title_transfer', 'leasehold_application',
        'subdivision', 'amalgamation', 'correction', 'renewal'
    ]);
    
    $table->enum('land_tenure_type', ['freehold', 'leasehold', 'mailo', 'customary']);
    
    // Title Information
    $table->string('current_title_number')->nullable();
    $table->string('new_title_number')->nullable();
    $table->string('plot_number')->nullable();
    $table->string('block_number')->nullable();
    $table->decimal('land_size_hectares', 10, 4)->nullable();
    
    // Processing
    $table->enum('application_status', [
        'draft', 'submitted', 'under_review', 'dlb_review', 'approved',
        'rejected', 'pending_payment', 'title_issued', 'completed'
    ])->default('draft');
    
    $table->string('district_land_board')->nullable();
    $table->date('submission_date')->nullable();
    $table->date('dlb_meeting_date')->nullable();
    $table->date('approval_date')->nullable();
    $table->date('title_issue_date')->nullable();
    $table->text('rejection_reason')->nullable();
    
    // Fees & Payments
    $table->decimal('application_fee', 10, 2)->nullable();
    $table->decimal('stamp_duty', 10, 2)->nullable();
    $table->decimal('other_fees', 10, 2)->nullable();
    $table->boolean('fees_paid')->default(false);
    
    $table->text('notes')->nullable();
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
    $table->softDeletes();
    
    $table->index('application_number');
    $table->index(['client_id', 'application_status']);
});

// database/migrations/2026_02_10_000501_create_bonafide_occupants_table.php
Schema::create('bonafide_occupants', function (Blueprint $table) {
    $table->id();
    $table->foreignId('title_application_id')->constrained()->cascadeOnDelete();
    
    $table->string('occupant_name');
    $table->string('nin')->nullable();
    $table->string('phone')->nullable();
    $table->date('occupancy_start_date');
    $table->integer('years_occupied')->nullable(); // Calculated field
    $table->string('dwelling_type')->nullable(); // Permanent, semi-permanent
    $table->decimal('cultivation_area_sqm', 10, 2)->nullable();
    $table->text('description_of_developments')->nullable();
    $table->json('evidence_documents')->nullable(); // IDs, photos, affidavits
    
    $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending');
    $table->boolean('rights_confirmed')->default(false);
    $table->timestamp('rights_confirmed_at')->nullable();
    
    $table->text('notes')->nullable();
    $table->timestamps();
    
    $table->index('title_application_id');
});

// database/migrations/2026_02_10_000502_create_statutory_forms_table.php
Schema::create('statutory_forms', function (Blueprint $table) {
    $table->id();
    $table->foreignId('project_id')->nullable()->constrained('survey_projects')->nullOnDelete();
    $table->foreignId('title_application_id')->nullable()->constrained()->nullOnDelete();
    
    $table->enum('form_type', ['form_4', 'form_5', 'form_7', 'form_8', 'form_10', 'form_18', 'form_23']);
    $table->string('form_number')->unique(); // FORM4-2026-0001
    
    $table->json('form_data'); // All form field data
    $table->integer('copies_generated')->default(3); // Triplicate
    
    $table->string('file_path')->nullable();
    $table->timestamp('generated_at')->nullable();
    $table->timestamp('filed_at')->nullable();
    $table->string('filing_reference')->nullable();
    
    $table->timestamps();
    
    $table->index(['project_id', 'form_type']);
    $table->index('form_number');
});
```

---

### **7. Real Estate Management**

```php
// database/migrations/2026_02_10_000600_create_properties_table.php
Schema::create('properties', function (Blueprint $table) {
    $table->id();
    $table->string('property_number')->unique(); // PROP-2026-0001
    
    $table->enum('property_type', [
        'land', 'residential', 'commercial', 'industrial', 
        'agricultural', 'mixed_use'
    ]);
    
    // Ownership & Title
    $table->string('title_number')->nullable();
    $table->foreignId('owner_id')->nullable()->constrained('clients')->nullOnDelete();
    $table->enum('ownership_type', ['freehold', 'leasehold', 'mailo'])->nullable();
    $table->date('acquisition_date')->nullable();
    
    // Location
    $table->text('location_address');
    $table->string('district');
    $table->string('region')->nullable();
    $table->string('plot_number')->nullable();
    $table->string('block_number')->nullable();
    $table->decimal('location_latitude', 10, 8)->nullable();
    $table->decimal('location_longitude', 11, 8)->nullable();
    
    // Physical Details
    $table->decimal('size_sqm', 15, 2)->nullable();
    $table->decimal('size_hectares', 15, 4)->nullable();
    $table->decimal('size_acres', 15, 4)->nullable();
    $table->string('dimensions')->nullable(); // e.g., "50m x 30m"
    $table->text('topography_description')->nullable();
    $table->string('zoning_classification')->nullable();
    $table->text('development_potential')->nullable();
    
    // Utilities & Access
    $table->json('utilities_available')->nullable(); // water, electricity, sewage, internet
    $table->boolean('water_available')->default(false);
    $table->boolean('electricity_available')->default(false);
    $table->boolean('sewage_available')->default(false);
    $table->text('access_roads')->nullable();
    
    // Listing Status
    $table->enum('status', [
        'available_sale', 'available_lease', 'reserved', 'sold', 
        'leased', 'under_development', 'disputed', 'withdrawn'
    ])->default('available_sale');
    
    $table->decimal('listing_price', 15, 2)->nullable();
    $table->decimal('lease_price_monthly', 10, 2)->nullable();
    $table->date('listing_date')->nullable();
    $table->date('reservation_expiry')->nullable();
    $table->foreignId('reserved_by_client_id')->nullable()->constrained('clients')->nullOnDelete();
    
    // References
    $table->foreignId('survey_project_id')->nullable()->constrained('survey_projects')->nullOnDelete();
    
    // Marketing
    $table->text('description')->nullable();
    $table->text('highlights')->nullable();
    $table->json('amenities')->nullable();
    $table->boolean('featured')->default(false);
    $table->integer('view_count')->default(0);
    
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
    $table->softDeletes();
    
    $table->index('property_number');
    $table->index('status');
    $table->index(['district', 'property_type']);
});

// Add geometry
DB::statement("
    ALTER TABLE properties 
    ADD COLUMN location_gps geography(POINT, 4326)
");

DB::statement("
    CREATE INDEX properties_location_gps_idx 
    ON properties 
    USING GIST (location_gps)
");

// database/migrations/2026_02_10_000601_create_property_valuations_table.php
Schema::create('property_valuations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('property_id')->constrained()->cascadeOnDelete();
    $table->string('valuation_number')->unique(); // VAL-2026-0001
    
    $table->date('valuation_date');
    $table->enum('valuation_method', ['market_comparison', 'cost_approach', 'income_approach', 'residual']);
    $table->decimal('valuation_amount', 15, 2);
    $table->string('currency', 3)->default('UGX');
    
    $table->string('valuer_name');
    $table->string('valuer_credentials')->nullable();
    $table->string('valuer_organization')->nullable();
    $table->integer('validity_period_months')->default(12);
    $table->date('expiry_date')->nullable();
    
    $table->json('supporting_documents')->nullable();
    $table->text('methodology_notes')->nullable();
    $table->text('market_conditions')->nullable();
    $table->json('comparable_properties')->nullable();
    
    $table->enum('approval_status', ['draft', 'pending', 'approved', 'rejected'])->default('draft');
    $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('approved_at')->nullable();
    
    $table->timestamps();
    
    $table->index('property_id');
    $table->index('valuation_date');
});

// database/migrations/2026_02_10_000602_create_property_offers_table.php
Schema::create('property_offers', function (Blueprint $table) {
    $table->id();
    $table->foreignId('property_id')->constrained()->cascadeOnDelete();
    $table->foreignId('offeror_client_id')->constrained('clients')->cascadeOnDelete();
    
    $table->decimal('offer_amount', 15, 2);
    $table->date('offer_date');
    $table->integer('validity_days')->default(30);
    $table->date('expiry_date')->nullable();
    
    $table->text('payment_terms')->nullable();
    $table->text('special_conditions')->nullable();
    
    $table->enum('status', ['pending', 'accepted', 'rejected', 'countered', 'withdrawn', 'expired'])->default('pending');
    
    $table->decimal('counter_offer_amount', 15, 2)->nullable();
    $table->text('counter_offer_terms')->nullable();
    $table->text('response_notes')->nullable();
    $table->timestamp('responded_at')->nullable();
    
    $table->timestamps();
    
    $table->index('property_id');
    $table->index('offeror_client_id');
});

// database/migrations/2026_02_10_000603_create_sales_agreements_table.php
Schema::create('sales_agreements', function (Blueprint $table) {
    $table->id();
    $table->string('agreement_number')->unique(); // SALE-2026-0001
    $table->foreignId('property_id')->constrained()->cascadeOnDelete();
    $table->foreignId('buyer_client_id')->constrained('clients')->cascadeOnDelete();
    $table->foreignId('seller_client_id')->constrained('clients')->cascadeOnDelete();
    
    $table->decimal('purchase_price', 15, 2);
    $table->decimal('deposit_amount', 15, 2)->nullable();
    $table->json('payment_schedule')->nullable(); // Installment details
    
    $table->date('agreement_date');
    $table->date('closing_date')->nullable();
    $table->date('completion_date')->nullable();
    
    $table->json('contingencies')->nullable(); // Financing, inspection, etc.
    $table->text('special_terms')->nullable();
    
    $table->string('agreement_file_path')->nullable();
    $table->timestamp('signed_at')->nullable();
    $table->boolean('buyer_signed')->default(false);
    $table->boolean('seller_signed')->default(false);
    
    $table->enum('status', ['draft', 'pending_signatures', 'signed', 'in_progress', 'completed', 'cancelled'])->default('draft');
    
    $table->timestamps();
    
    $table->index('agreement_number');
    $table->index('property_id');
});

// database/migrations/2026_02_10_000604_create_lease_agreements_table.php
Schema::create('lease_agreements', function (Blueprint $table) {
    $table->id();
    $table->string('lease_number')->unique(); // LEASE-2026-0001
    $table->foreignId('property_id')->constrained()->cascadeOnDelete();
    $table->foreignId('tenant_client_id')->constrained('clients')->cascadeOnDelete();
    $table->foreignId('landlord_client_id')->constrained('clients')->cascadeOnDelete();
    
    $table->date('lease_start_date');
    $table->date('lease_end_date');
    $table->integer('lease_period_months')->nullable();
    
    $table->decimal('monthly_rent', 10, 2);
    $table->decimal('security_deposit', 10, 2)->nullable();
    $table->enum('payment_frequency', ['monthly', 'quarterly', 'semi_annual', 'annual'])->default('monthly');
    $table->integer('payment_due_day')->default(1); // Day of month
    
    $table->boolean('renewal_option')->default(false);
    $table->integer('renewal_notice_days')->default(90);
    $table->text('maintenance_responsibility')->nullable();
    $table->integer('termination_notice_days')->default(30);
    
    $table->string('agreement_file_path')->nullable();
    $table->timestamp('signed_at')->nullable();
    $table->timestamp('terminated_at')->nullable();
    $table->text('termination_reason')->nullable();
    
    $table->enum('status', ['draft', 'active', 'expired', 'terminated', 'renewed'])->default('draft');
    
    $table->timestamps();
    
    $table->index('lease_number');
    $table->index(['property_id', 'status']);
});
```

---

### **8. Financial Management**

```php
// database/migrations/2026_02_10_000700_create_quotations_table.php
Schema::create('quotations', function (Blueprint $table) {
    $table->id();
    $table->string('quotation_number')->unique(); // QUO-2026-0001
    $table->foreignId('client_id')->constrained()->cascadeOnDelete();
    $table->foreignId('project_id')->nullable()->constrained('survey_projects')->nullOnDelete();
    $table->foreignId('property_id')->nullable()->constrained('properties')->nullOnDelete();
    
    $table->date('quotation_date');
    $table->integer('validity_days')->default(30);
    $table->date('expiry_date')->nullable();
    
    $table->decimal('subtotal', 15, 2)->default(0);
    $table->decimal('tax_rate', 5, 2)->default(18.00); // 18% VAT
    $table->decimal('tax_amount', 15, 2)->default(0);
    
    $table->enum('discount_type', ['none', 'percentage', 'fixed'])->default('none');
    $table->decimal('discount_value', 10, 2)->default(0);
    $table->decimal('discount_amount', 15, 2)->default(0);
    
    $table->decimal('total_amount', 15, 2)->default(0);
    $table->string('currency', 3)->default('UGX');
    
    $table->text('payment_terms')->nullable();
    $table->text('notes')->nullable();
    $table->text('terms_conditions')->nullable();
    
    $table->enum('status', [
        'draft', 'pending_approval', 'approved', 'sent', 
        'accepted', 'rejected', 'expired', 'converted'
    ])->default('draft');
    
    $table->timestamp('sent_at')->nullable();
    $table->timestamp('accepted_at')->nullable();
    $table->timestamp('rejected_at')->nullable();
    $table->text('rejection_reason')->nullable();
    
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('approved_at')->nullable();
    
    $table->timestamps();
    $table->softDeletes();
    
    $table->index('quotation_number');
    $table->index(['client_id', 'status']);
});

// database/migrations/2026_02_10_000701_create_quotation_items_table.php
Schema::create('quotation_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('quotation_id')->constrained()->cascadeOnDelete();
    
    $table->string('item_description');
    $table->decimal('quantity', 10, 2)->default(1);
    $table->string('unit')->nullable(); // hours, sqm, etc.
    $table->decimal('unit_price', 15, 2);
    $table->decimal('line_total', 15, 2);
    $table->boolean('is_taxable')->default(true);
    $table->integer('sort_order')->default(0);
    
    $table->timestamps();
    
    $table->index('quotation_id');
});

// database/migrations/2026_02_10_000702_create_invoices_table.php
Schema::create('invoices', function (Blueprint $table) {
    $table->id();
    $table->string('invoice_number')->unique(); // INV-2026-0001
    $table->foreignId('quotation_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('client_id')->constrained()->cascadeOnDelete();
    $table->foreignId('project_id')->nullable()->constrained('survey_projects')->nullOnDelete();
    $table->foreignId('property_id')->nullable()->constrained('properties')->nullOnDelete();
    
    $table->date('invoice_date');
    $table->date('due_date');
    $table->integer('payment_terms_days')->default(30);
    
    $table->decimal('subtotal', 15, 2)->default(0);
    $table->decimal('tax_amount', 15, 2)->default(0);
    $table->decimal('total_amount', 15, 2)->default(0);
    $table->decimal('amount_paid', 15, 2)->default(0);
    $table->decimal('balance_due', 15, 2)->default(0);
    $table->string('currency', 3)->default('UGX');
    
    $table->text('payment_instructions')->nullable();
    $table->text('notes')->nullable();
    
    $table->enum('status', [
        'draft', 'pending_approval', 'sent', 'partially_paid', 
        'paid', 'overdue', 'written_off', 'cancelled'
    ])->default('draft');
    
    $table->timestamp('sent_at')->nullable();
    $table->timestamp('paid_at')->nullable();
    $table->timestamp('written_off_at')->nullable();
    
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
    $table->softDeletes();
    
    $table->index('invoice_number');
    $table->index(['client_id', 'status']);
    $table->index('due_date');
});

// database/migrations/2026_02_10_000703_create_invoice_items_table.php
Schema::create('invoice_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
    
    $table->string('item_description');
    $table->decimal('quantity', 10, 2)->default(1);
    $table->string('unit')->nullable();
    $table->decimal('unit_price', 15, 2);
    $table->decimal('line_total', 15, 2);
    $table->boolean('is_taxable')->default(true);
    $table->integer('sort_order')->default(0);
    
    $table->timestamps();
    
    $table->index('invoice_id');
});

// database/migrations/2026_02_10_000704_create_payments_table.php
Schema::create('payments', function (Blueprint $table) {
    $table->id();
    $table->string('payment_reference')->unique(); // PAY-2026-0001
    $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
    
    $table->date('payment_date');
    $table->decimal('payment_amount', 15, 2);
    $table->string('currency', 3)->default('UGX');
    
    $table->enum('payment_method', [
        'cash', 'bank_transfer', 'mobile_money', 'check', 
        'card', 'online'
    ]);
    
    $table->string('transaction_reference')->nullable(); // Bank/MM transaction ID
    $table->string('payer_name')->nullable();
    $table->text('payment_notes')->nullable();
    
    $table->string('receipt_number')->unique()->nullable(); // REC-2026-0001
    $table->string('receipt_file_path')->nullable();
    
    // Reversal
    $table->boolean('is_reversed')->default(false);
    $table->timestamp('reversed_at')->nullable();
    $table->text('reversal_reason')->nullable();
    $table->foreignId('reversed_by')->nullable()->constrained('users')->nullOnDelete();
    
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
    
    $table->index('payment_reference');
    $table->index('invoice_id');
    $table->index('payment_date');
});

// database/migrations/2026_02_10_000705_create_payment_allocations_table.php
Schema::create('payment_allocations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
    $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
    $table->decimal('allocated_amount', 15, 2);
    $table->timestamps();
    
    $table->index(['payment_id', 'invoice_id']);
});
```

---

### **9. Document Management**

```php
// database/migrations/2026_02_10_000800_create_documents_table.php
Schema::create('documents', function (Blueprint $table) {
    $table->id();
    
    // Polymorphic relationship
    $table->morphs('documentable'); // documentable_type, documentable_id
    
    $table->string('document_number')->unique(); // DOC-2026-0001
    $table->enum('category', [
        'contract', 'title', 'permit', 'correspondence', 'report',
        'statutory_form', 'survey_plan', 'deed_plan', 'id_document',
        'proof_of_ownership', 'financial', 'other'
    ]);
    
    $table->string('file_name');
    $table->string('file_path');
    $table->integer('file_size')->nullable(); // Bytes
    $table->string('file_type')->nullable(); // MIME type
    $table->string('file_hash')->nullable(); // SHA256
    $table->integer('version')->default(1);
    
    $table->string('title')->nullable();
    $table->text('description')->nullable();
    $table->json('tags')->nullable();
    
    // Security & Classification
    $table->boolean('is_confidential')->default(false);
    $table->enum('classification', [
        'public', 'confidential', 'highly_confidential', 
        'attorney_client_privileged', 'time_sensitive'
    ])->default('public');
    
    // Expiry & Retention
    $table->date('expiry_date')->nullable();
    $table->integer('retention_period_years')->nullable();
    $table->date('archive_date')->nullable();
    $table->boolean('is_archived')->default(false);
    
    // Verification
    $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('verified_at')->nullable();
    $table->text('verification_notes')->nullable();
    $table->boolean('is_verified')->default(false);
    
    $table->timestamps();
    $table->softDeletes();
    
    $table->index('document_number');
    $table->index(['documentable_type', 'documentable_id']);
    $table->index('category');
});

// database/migrations/2026_02_10_000801_create_document_signatures_table.php
Schema::create('document_signatures', function (Blueprint $table) {
    $table->id();
    $table->foreignId('document_id')->constrained()->cascadeOnDelete();
    $table->foreignId('signer_user_id')->constrained('users')->cascadeOnDelete();
    
    $table->integer('signature_order')->default(1);
    $table->enum('signature_type', ['digital', 'electronic', 'wet_signature']);
    $table->timestamp('signed_at')->nullable();
    $table->string('signature_certificate_path')->nullable();
    $table->string('ip_address')->nullable();
    $table->text('signing_notes')->nullable();
    
    $table->timestamps();
    
    $table->index('document_id');
    $table->unique(['document_id', 'signer_user_id']);
});

// database/migrations/2026_02_10_000802_create_document_access_logs_table.php
Schema::create('document_access_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('document_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
    
    $table->enum('action', ['view', 'download', 'edit', 'delete', 'share', 'print']);
    $table->string('ip_address')->nullable();
    $table->text('user_agent')->nullable();
    $table->timestamp('accessed_at');
    
    $table->index('document_id');
    $table->index('user_id');
    $table->index('accessed_at');
});
```

---

### **10. CRM & Communications**

```php
// database/migrations/2026_02_10_000900_create_client_interactions_table.php
Schema::create('client_interactions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('client_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // Staff member
    
    $table->enum('interaction_type', ['call', 'email', 'meeting', 'site_visit', 'chat', 'whatsapp', 'other']);
    $table->timestamp('interaction_date');
    $table->integer('duration_minutes')->nullable();
    
    $table->text('summary');
    $table->text('outcome')->nullable();
    $table->boolean('follow_up_required')->default(false);
    $table->date('follow_up_date')->nullable();
    $table->json('attachments')->nullable();
    
    $table->timestamps();
    
    $table->index('client_id');
    $table->index('interaction_date');
});

// database/migrations/2026_02_10_000901_create_inquiries_table.php
Schema::create('inquiries', function (Blueprint $table) {
    $table->id();
    $table->string('inquiry_number')->unique(); // INQ-2026-0001
    $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('property_id')->nullable()->constrained('properties')->nullOnDelete();
    
    $table->enum('inquiry_source', [
        'website', 'referral', 'walk_in', 'advertisement', 
        'social_media', 'phone', 'email', 'other'
    ]);
    
    $table->date('inquiry_date');
    $table->text('inquiry_details');
    
    $table->enum('status', [
        'new', 'contacted', 'qualified', 'viewing_scheduled', 
        'offer_made', 'negotiation', 'closed_won', 'closed_lost'
    ])->default('new');
    
    $table->foreignId('assigned_agent_id')->nullable()->constrained('users')->nullOnDelete();
    $table->text('agent_notes')->nullable();
    $table->date('next_follow_up_date')->nullable();
    
    $table->timestamps();
    
    $table->index('inquiry_number');
    $table->index(['client_id', 'status']);
});

// database/migrations/2026_02_10_000902_create_tasks_table.php
Schema::create('tasks', function (Blueprint $table) {
    $table->id();
    
    // Polymorphic relationship
    $table->morphs('taskable'); // taskable_type, taskable_id
    
    $table->string('task_title');
    $table->text('task_description')->nullable();
    
    $table->foreignId('assigned_to_user_id')->constrained('users')->cascadeOnDelete();
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    
    $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
    $table->date('due_date')->nullable();
    $table->timestamp('reminder_at')->nullable();
    
    $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold'])->default('pending');
    
    $table->timestamp('started_at')->nullable();
    $table->timestamp('completed_at')->nullable();
    $table->text('completion_notes')->nullable();
    
    $table->timestamps();
    
    $table->index(['taskable_type', 'taskable_id']);
    $table->index('assigned_to_user_id');
    $table->index(['status', 'due_date']);
});

// database/migrations/2026_02_10_000903_create_messages_table.php
Schema::create('messages', function (Blueprint $table) {
    $table->id();
    $table->foreignId('sender_user_id')->constrained('users')->cascadeOnDelete();
    $table->foreignId('recipient_user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
    
    // Context references
    $table->foreignId('project_id')->nullable()->constrained('survey_projects')->nullOnDelete();
    $table->foreignId('property_id')->nullable()->constrained('properties')->nullOnDelete();
    
    $table->string('subject')->nullable();
    $table->text('message_body');
    $table->json('attachments')->nullable();
    
    $table->timestamp('read_at')->nullable();
    $table->boolean('is_internal')->default(false); // Internal staff communication
    
    $table->timestamps();
    
    $table->index(['sender_user_id', 'recipient_user_id']);
    $table->index('client_id');
});
```

---

### **11. Workflow & Automation**

```php
// database/migrations/2026_02_10_001000_create_workflow_instances_table.php
Schema::create('workflow_instances', function (Blueprint $table) {
    $table->id();
    $table->string('workflow_type'); // survey_approval, title_processing, etc.
    
    // Polymorphic relationship
    $table->morphs('workflowable'); // workflowable_type, workflowable_id
    
    $table->integer('current_step')->default(1);
    $table->integer('total_steps');
    
    $table->enum('status', ['in_progress', 'completed', 'cancelled', 'on_hold'])->default('in_progress');
    
    $table->foreignId('initiated_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('initiated_at');
    $table->timestamp('completed_at')->nullable();
    
    $table->text('cancellation_reason')->nullable();
    
    $table->timestamps();
    
    $table->index(['workflowable_type', 'workflowable_id']);
});

// database/migrations/2026_02_10_001001_create_workflow_steps_table.php
Schema::create('workflow_steps', function (Blueprint $table) {
    $table->id();
    $table->foreignId('workflow_instance_id')->constrained()->cascadeOnDelete();
    
    $table->integer('step_number');
    $table->string('step_name');
    $table->text('step_description')->nullable();
    
    $table->foreignId('assigned_role_id')->nullable()->constrained('roles')->nullOnDelete();
    $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
    
    $table->enum('status', ['pending', 'in_progress', 'approved', 'rejected', 'skipped'])->default('pending');
    
    $table->foreignId('action_taken_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('action_taken_at')->nullable();
    $table->text('comments')->nullable();
    
    $table->integer('time_limit_hours')->nullable();
    $table->timestamp('due_at')->nullable();
    $table->boolean('is_overdue')->default(false);
    
    $table->timestamps();
    
    $table->index('workflow_instance_id');
    $table->index(['assigned_user_id', 'status']);
});
```

---

### **12. System Configuration**

```php
// database/migrations/2026_02_10_001100_create_settings_table.php
Schema::create('settings', function (Blueprint $table) {
    $table->id();
    $table->string('key')->unique();
    $table->text('value')->nullable();
    $table->json('value_json')->nullable(); // For complex settings
    $table->string('category')->default('general'); // general, finance, notifications, etc.
    $table->string('data_type')->default('string'); // string, integer, boolean, json
    $table->text('description')->nullable();
    $table->boolean('is_public')->default(false); // Can clients see this?
    $table->timestamps();
    
    $table->index('category');
});

// database/migrations/2026_02_10_001101_create_service_catalog_table.php
Schema::create('service_catalog', function (Blueprint $table) {
    $table->id();
    $table->string('service_code')->unique(); // SRV-SURVEY-001
    $table->string('service_name');
    $table->enum('service_type', ['survey', 'valuation', 'legal', 'real_estate', 'other']);
    $table->text('description')->nullable();
    
    $table->decimal('base_price', 15, 2);
    $table->string('unit')->nullable(); // per_sqm, per_hour, per_hectare, fixed
    $table->boolean('tax_applicable')->default(true);
    $table->decimal('tax_rate', 5, 2)->default(18.00);
    
    $table->json('pricing_tiers')->nullable(); // Volume discounts
    $table->integer('estimated_duration_days')->nullable();
    
    $table->boolean('is_active')->default(true);
    $table->integer('sort_order')->default(0);
    
    $table->timestamps();
    
    $table->index('service_type');
});

// database/migrations/2026_02_10_001102_create_tax_configurations_table.php
Schema::create('tax_configurations', function (Blueprint $table) {
    $table->id();
    $table->string('tax_name');
    $table->enum('tax_type', ['vat', 'stamp_duty', 'service_tax', 'withholding_tax', 'other']);
    $table->decimal('rate_percentage', 5, 2);
    $table->json('applicable_services')->nullable(); // Which services this applies to
    $table->string('region')->nullable(); // If regional variations
    $table->date('effective_from');
    $table->date('effective_to')->nullable();
    $table->boolean('is_active')->default(true);
    $table->text('description')->nullable();
    $table->timestamps();
    
    $table->index(['tax_type', 'effective_from']);
});

// database/migrations/2026_02_10_001103_create_teams_table.php
Schema::create('teams', function (Blueprint $table) {
    $table->id();
    $table->string('team_name');
    $table->string('team_code')->unique(); // TEAM-FIELD-01
    $table->text('description')->nullable();
    $table->foreignId('team_lead_id')->nullable()->constrained('users')->nullOnDelete();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

// database/migrations/2026_02_10_001104_create_team_members_table.php
Schema::create('team_members', function (Blueprint $table) {
    $table->id();
    $table->foreignId('team_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->enum('role', ['member', 'lead', 'assistant'])->default('member');
    $table->date('joined_date')->nullable();
    $table->date('left_date')->nullable();
    $table->timestamps();
    
    $table->unique(['team_id', 'user_id']);
});
```

---

### **13. Activity Logging (Spatie)**

```php
// database/migrations/2026_02_10_001200_create_activity_log_table.php
// This is from Spatie Laravel Activity Log package
// php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider" --tag="activitylog-migrations"

Schema::create('activity_log', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->string('log_name')->nullable();
    $table->text('description');
    $table->nullableMorphs('subject', 'subject');
    $table->string('event')->nullable();
    $table->nullableMorphs('causer', 'causer');
    $table->json('properties')->nullable();
    $table->uuid('batch_uuid')->nullable();
    $table->timestamps();
    
    $table->index('log_name');
    $table->index('batch_uuid');
});
```

---

### **14. Media Library (Spatie)**

```php
// database/migrations/2026_02_10_001300_create_media_table.php
// This is from Spatie Laravel Media Library package
// php artisan vendor:publish --provider="Spatie\MediaLibrary\MediaLibraryServiceProvider" --tag="medialibrary-migrations"

Schema::create('media', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->morphs('model');
    $table->uuid('uuid')->nullable()->unique();
    $table->string('collection_name');
    $table->string('name');
    $table->string('file_name');
    $table->string('mime_type')->nullable();
    $table->string('disk');
    $table->string('conversions_disk')->nullable();
    $table->unsignedBigInteger('size');
    $table->json('manipulations');
    $table->json('custom_properties');
    $table->json('generated_conversions');
    $table->json('responsive_images');
    $table->unsignedInteger('order_column')->nullable();
    $table->nullableTimestamps();
    
    $table->index(['model_type', 'model_id']);
});
```

---

## SEEDERS

### **Role & Permission Seeder**
```php
// database/seeders/RolePermissionSeeder.php
use App\Models\Role;
use App\Models\Permission;

public function run()
{
    // Create Permissions
    $permissions = [
        // Surveying
        ['name' => 'View Survey Projects', 'slug' => 'view_surveys', 'module' => 'surveying'],
        ['name' => 'Create Survey Projects', 'slug' => 'create_surveys', 'module' => 'surveying'],
        ['name' => 'Edit Survey Projects', 'slug' => 'edit_surveys', 'module' => 'surveying'],
        ['name' => 'Delete Survey Projects', 'slug' => 'delete_surveys', 'module' => 'surveying'],
        ['name' => 'Approve Survey Reports', 'slug' => 'approve_survey_reports', 'module' => 'surveying'],
        
        // Real Estate
        ['name' => 'Manage Properties', 'slug' => 'manage_properties', 'module' => 'real_estate'],
        ['name' => 'Create Valuations', 'slug' => 'create_valuations', 'module' => 'real_estate'],
        ['name' => 'Process Sales', 'slug' => 'process_sales', 'module' => 'real_estate'],
        
        // Finance
        ['name' => 'Create Quotations', 'slug' => 'create_quotations', 'module' => 'finance'],
        ['name' => 'Generate Invoices', 'slug' => 'generate_invoices', 'module' => 'finance'],
        ['name' => 'Record Payments', 'slug' => 'record_payments', 'module' => 'finance'],
        ['name' => 'View Financial Reports', 'slug' => 'view_financial_reports', 'module' => 'finance'],
        
        // Legal
        ['name' => 'Manage Documents', 'slug' => 'manage_documents', 'module' => 'legal'],
        ['name' => 'Process Title Applications', 'slug' => 'process_titles', 'module' => 'legal'],
        ['name' => 'Apply Digital Signatures', 'slug' => 'digital_signatures', 'module' => 'legal'],
        
        // System
        ['name' => 'Manage Users', 'slug' => 'manage_users', 'module' => 'system'],
        ['name' => 'Manage Roles', 'slug' => 'manage_roles', 'module' => 'system'],
        ['name' => 'System Settings', 'slug' => 'system_settings', 'module' => 'system'],
        ['name' => 'View Audit Logs', 'slug' => 'view_audit_logs', 'module' => 'system'],
    ];
    
    foreach ($permissions as $permission) {
        Permission::create($permission);
    }
    
    // Create Roles
    Role::create([
        'name' => 'System Administrator',
        'slug' => 'admin',
        'permissions' => Permission::all()->pluck('slug')->toArray(),
    ]);
    
    Role::create([
        'name' => 'Survey Manager',
        'slug' => 'survey_manager',
        'permissions' => ['view_surveys', 'create_surveys', 'edit_surveys', 'approve_survey_reports'],
    ]);
    
    Role::create([
        'name' => 'Licensed Surveyor',
        'slug' => 'surveyor',
        'permissions' => ['view_surveys', 'create_surveys', 'edit_surveys'],
    ]);
    
    Role::create([
        'name' => 'Finance Officer',
        'slug' => 'finance',
        'permissions' => ['create_quotations', 'generate_invoices', 'record_payments', 'view_financial_reports'],
    ]);
    
    Role::create([
        'name' => 'Real Estate Officer',
        'slug' => 'real_estate',
        'permissions' => ['manage_properties', 'create_valuations', 'process_sales'],
    ]);
    
    Role::create([
        'name' => 'Legal Officer',
        'slug' => 'legal',
        'permissions' => ['manage_documents', 'process_titles', 'digital_signatures'],
    ]);
    
    Role::create([
        'name' => 'Client',
        'slug' => 'client',
        'permissions' => [],
    ]);
}
```

---

## INDEXES & OPTIMIZATION

### **Composite Indexes**
```sql
-- Performance optimization indexes
CREATE INDEX idx_projects_client_status ON survey_projects(client_id, status);
CREATE INDEX idx_invoices_client_status ON invoices(client_id, status);
CREATE INDEX idx_properties_district_type ON properties(district, property_type);
CREATE INDEX idx_payments_date_method ON payments(payment_date, payment_method);
CREATE INDEX idx_documents_type_verified ON documents(category, is_verified);
```

### **Full-Text Search Indexes**
```sql
-- Enable full-text search on relevant columns
CREATE INDEX idx_clients_fulltext ON clients USING gin(to_tsvector('english', name || ' ' || email));
CREATE INDEX idx_properties_fulltext ON properties USING gin(to_tsvector('english', location_address || ' ' || description));
```

---

**Document Version:** 1.0  
**Database Schema Version:** 1.0  
**PostgreSQL Version:** 16+  
**PostGIS Version:** 3.4+  
**Laravel Version:** 12  
**Last Updated:** February 10, 2026
