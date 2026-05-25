<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('approval_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_project_progress_id')->constrained('client_project_progress')->cascadeOnDelete();
            $table->string('institution', 50);
            $table->unsignedTinyInteger('step_order');
            $table->string('status', 20)->default('pending');
            $table->string('officer_name', 150)->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('deferred_at')->nullable();
            $table->text('deferred_reason')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('client_project_progress_id');
            $table->index('status');
            $table->index('institution');

            // Ensure unique step_order per progress record
            $table->unique(['client_project_progress_id', 'step_order'], 'approval_steps_progress_step_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_steps');
    }
};
