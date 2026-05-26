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
     * Creates the workflow_steps table that stores individual steps within
     * a workflow definition. Each step has a type (approval, review, etc.),
     * an assignee strategy, SLA days, and optional configuration.
     */
    public function up(): void
    {
        Schema::create('workflow_steps', function (Blueprint $table) {
            $table->id();

            $table->foreignId('workflow_definition_id')
                ->constrained('workflow_definitions')
                ->cascadeOnDelete();

            $table->string('name', 200);
            $table->string('slug', 200);
            $table->unsignedInteger('step_order');

            // approval|review|notification|payment|external
            $table->string('step_type', 50)->default('approval');

            // role|user|department|external
            $table->string('assignee_type', 50)->default('role');

            // Role name, user ID, department code, etc.
            $table->string('assignee_identifier', 100)->nullable();

            // Service level agreement deadline in days
            $table->unsignedInteger('sla_days')->default(7);

            $table->boolean('is_mandatory')->default(true);
            $table->boolean('auto_advance_on_approval')->default(true);

            // Step-specific config (form fields, notifications, etc.)
            $table->json('config')->nullable();

            $table->timestamps();

            // Unique step slug per definition
            $table->unique(
                ['workflow_definition_id', 'slug'],
                'workflow_steps_definition_slug_unique'
            );

            // Indexes
            $table->index('step_order', 'workflow_steps_step_order_index');
            $table->index('step_type', 'workflow_steps_step_type_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_steps');
    }
};
