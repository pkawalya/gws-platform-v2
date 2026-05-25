<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Phase 1B — Client Documents
     * ---------------------------
     * Stores documents uploaded for or by clients — KYC records, title
     * deeds, survey reports, agreements, correspondence, and other
     * file types. Document type and status values are enforced at the
     * application level for SQLite compatibility.
     */
    public function up(): void
    {
        Schema::create('client_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('survey_project_id')->nullable()->constrained('survey_projects')->nullOnDelete();

            // Document type stored as string — ENUM values enforced at app level.
            // Allowed: kyc, title_deed, survey_report, agreement, correspondence, other
            $table->string('document_type', 50);

            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->string('file_path', 500);
            $table->string('file_name', 255);
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('file_size')->default(0);

            // Status stored as string — ENUM values enforced at app level.
            // Allowed: uploaded, verified, rejected, archived
            $table->string('status', 20)->default('uploaded');

            $table->string('verified_by_user_id', 36)->nullable(); // UUID or FK
            $table->timestamp('verified_at')->nullable();
            $table->boolean('is_confidential')->default(false);
            $table->date('document_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->text('verification_notes')->nullable();
            $table->foreignId('uploaded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->timestamps();

            // Indexes for commonly queried columns
            $table->index('client_id');
            $table->index('document_type');
            $table->index('status');
            $table->index('organization_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_documents');
    }
};
