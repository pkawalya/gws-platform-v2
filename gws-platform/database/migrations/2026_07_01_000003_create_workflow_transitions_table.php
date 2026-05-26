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
     * Creates the workflow_transitions table that records each state change
     * in a workflow instance. Transitions are the immutable audit trail of
     * the workflow engine — they capture who did what, when, and why.
     */
    public function up(): void
    {
        Schema::create('workflow_transitions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('workflow_instance_id')
                ->constrained('workflow_instances')
                ->cascadeOnDelete();

            $table->foreignId('workflow_step_id')
                ->constrained('workflow_steps');

            // pending|submitted|approved|deferred|rejected|skipped
            $table->string('from_status', 30);
            $table->string('to_status', 30);

            // approve|defer|reject|skip|submit|reopen|escalate
            $table->string('action', 50);

            // Polymorphic actor — User, System, External
            $table->string('actor_type', 50)->nullable();
            $table->unsignedBigInteger('actor_id')->nullable();

            $table->text('comment')->nullable();

            // Reason, attachments, external reference, etc.
            $table->json('metadata')->nullable();

            $table->timestamp('transitioned_at')->useCurrent();

            $table->timestamps();

            // Indexes
            $table->index('workflow_instance_id', 'workflow_transitions_instance_index');
            $table->index('workflow_step_id', 'workflow_transitions_step_index');
            $table->index('to_status', 'workflow_transitions_to_status_index');
            $table->index('action', 'workflow_transitions_action_index');
            $table->index('transitioned_at', 'workflow_transitions_transitioned_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_transitions');
    }
};
