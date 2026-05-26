<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Workflow Engine — Phase 2A
     * --------------------------
     * Creates the workflow_instances table that stores running instances of
     * workflow definitions attached to entities (e.g., a SurveyProject).
     * Tracks current position, status, and timing information.
     */
    public function up(): void
    {
        Schema::create('workflow_instances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('workflow_definition_id')
                ->constrained('workflow_definitions');

            // Polymorphic target entity
            $table->string('entity_type', 100);
            $table->unsignedBigInteger('entity_id');

            // pending|active|completed|cancelled|suspended
            $table->string('status', 30)->default('pending');

            $table->unsignedInteger('current_step_order')->default(0);

            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();

            $table->json('metadata')->nullable();

            // Multi-tenancy
            $table->foreignId('organization_id')
                ->nullable()
                ->constrained('organizations')
                ->nullOnDelete();

            $table->foreignId('branch_id')
                ->nullable()
                ->constrained('branches')
                ->nullOnDelete();

            // Who started this workflow instance
            $table->foreignId('created_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            // Indexes
            $table->index(
                ['entity_type', 'entity_id'],
                'workflow_instances_entity_morph_index'
            );
            $table->index('status', 'workflow_instances_status_index');
            $table->index('workflow_definition_id', 'workflow_instances_definition_index');
            $table->index('organization_id', 'workflow_instances_organization_id_index');
            $table->index('current_step_order', 'workflow_instances_current_step_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_instances');
    }
};
