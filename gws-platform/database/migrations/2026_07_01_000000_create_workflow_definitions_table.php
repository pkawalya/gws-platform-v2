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
     * Creates the workflow_definitions table that stores templates for
     * workflows (e.g., "Uganda Land Survey Approval", "Title Registration").
     * Each definition has a version, entity type, and optional SLA metadata.
     */
    public function up(): void
    {
        Schema::create('workflow_definitions', function (Blueprint $table) {
            $table->id();

            $table->string('name', 200);
            $table->string('slug', 200)->unique();
            $table->text('description')->nullable();

            // Polymorphic target — e.g., "SurveyProject", "Client"
            $table->string('entity_type', 100);

            // Versioning for definitions — allows evolving workflows
            $table->unsignedInteger('version')->default(1);

            $table->boolean('is_active')->default(true);

            // Extra config like SLA days per step, notification channels, etc.
            $table->json('metadata')->nullable();

            // Multi-tenancy
            $table->foreignId('organization_id')
                ->nullable()
                ->constrained('organizations')
                ->nullOnDelete();

            $table->timestamps();

            // Indexes
            $table->index('slug', 'workflow_definitions_slug_index');
            $table->index('entity_type', 'workflow_definitions_entity_type_index');
            $table->index('is_active', 'workflow_definitions_is_active_index');
            $table->index('organization_id', 'workflow_definitions_organization_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_definitions');
    }
};
