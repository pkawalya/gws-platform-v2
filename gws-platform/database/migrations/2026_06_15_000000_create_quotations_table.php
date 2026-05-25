<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Phase 1B — Quotations
     * ---------------------
     * Stores quotations issued to clients. A quotation may or may not
     * be linked to a survey project at creation time. Status values
     * (draft, sent, accepted, rejected, expired) are enforced at the
     * application level for SQLite compatibility.
     */
    public function up(): void
    {
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->string('quotation_number', 30)->unique();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('survey_project_id')->nullable()->constrained('survey_projects')->nullOnDelete();

            // Status stored as string — ENUM values enforced at app level.
            // Allowed: draft, sent, accepted, rejected, expired
            $table->string('status', 20)->default('draft');

            $table->date('quotation_date');
            $table->date('valid_until')->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->string('currency', 3)->default('UGX');

            // Flexible line-item storage: [{description, quantity, unit_price, total}]
            $table->json('line_items')->nullable();

            $table->text('terms_and_conditions')->nullable();
            $table->text('internal_notes')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->timestamps();

            // Indexes for commonly queried columns
            $table->index('client_id');
            $table->index('survey_project_id');
            $table->index('status');
            $table->index('quotation_date');
            $table->index('organization_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};
