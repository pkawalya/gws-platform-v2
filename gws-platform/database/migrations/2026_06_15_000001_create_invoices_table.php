<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Phase 1B — Invoices
     * -------------------
     * Stores invoices issued to clients. An invoice may originate from
     * a quotation and optionally link to a survey project. Status values
     * (draft, sent, partial, paid, overdue, cancelled) are enforced at
     * the application level for SQLite compatibility.
     */
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 30)->unique();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('quotation_id')->nullable()->constrained('quotations')->nullOnDelete();
            $table->foreignId('survey_project_id')->nullable()->constrained('survey_projects')->nullOnDelete();

            // Status stored as string — ENUM values enforced at app level.
            // Allowed: draft, sent, partial, paid, overdue, cancelled
            $table->string('status', 20)->default('draft');

            $table->date('invoice_date');
            $table->date('due_date')->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->decimal('amount_due', 12, 2)->default(0);
            $table->string('currency', 3)->default('UGX');
            $table->json('line_items')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->timestamps();

            // Indexes for commonly queried columns
            $table->index('client_id');
            $table->index('quotation_id');
            $table->index('status');
            $table->index('invoice_date');
            $table->index('due_date');
            $table->index('organization_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
