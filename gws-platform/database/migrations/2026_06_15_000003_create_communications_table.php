<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Phase 1B — Communications
     * -------------------------
     * Stores all client communications across channels (SMS, call,
     * email, note, WhatsApp, letter). Supports polymorphic sender
     * via sender_type/sender_id and tracks delivery status through
     * timestamps. Channel, direction, and status values are enforced
     * at the application level for SQLite compatibility.
     */
    public function up(): void
    {
        Schema::create('communications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('survey_project_id')->nullable()->constrained('survey_projects')->nullOnDelete();

            // Channel stored as string — ENUM values enforced at app level.
            // Allowed: sms, call, email, note, whatsapp, letter
            $table->string('channel', 20);

            // Direction stored as string — ENUM values enforced at app level.
            // Allowed: inbound, outbound
            $table->string('direction', 10)->default('outbound');

            $table->string('subject', 255)->nullable();
            $table->text('body');

            // Status stored as string — ENUM values enforced at app level.
            // Allowed: draft, sent, delivered, failed, read
            $table->string('status', 20)->default('sent');

            // Polymorphic sender — allows different user/staff types
            $table->string('sender_type', 100)->nullable();
            $table->unsignedBigInteger('sender_id')->nullable();

            $table->string('recipient_phone', 30)->nullable();
            $table->string('recipient_email', 150)->nullable();

            // Provider data, delivery receipts, etc.
            $table->json('metadata')->nullable();

            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('read_at')->nullable();

            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->timestamps();

            // Indexes for commonly queried columns
            $table->index('client_id');
            $table->index('channel');
            $table->index('direction');
            $table->index('status');
            $table->index('sent_at');
            $table->index('organization_id');

            // Composite index for polymorphic sender lookups
            $table->index(['sender_type', 'sender_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('communications');
    }
};
