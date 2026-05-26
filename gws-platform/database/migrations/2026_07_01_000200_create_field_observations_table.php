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
        Schema::create('field_observations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('survey_project_id')->constrained('survey_projects')->cascadeOnDelete();
            $table->string('observation_type', 50);
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->json('geometry')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('accuracy_meters', 8, 2)->nullable();
            $table->decimal('altitude_meters', 8, 2)->nullable();
            $table->json('observation_data')->nullable();
            $table->json('media_paths')->nullable();
            $table->timestamp('observed_at');
            $table->boolean('is_offline_creation')->default(false);
            $table->string('sync_status', 20)->default('synced');
            $table->timestamp('synced_at')->nullable();
            $table->string('conflict_resolution', 20)->nullable();
            $table->foreignId('recorded_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();

            // Indexes for commonly queried columns
            $table->index('uuid');
            $table->index('survey_project_id');
            $table->index('observation_type');
            $table->index('sync_status');
            $table->index('observed_at');
            $table->index('recorded_by_user_id');
            $table->index(['latitude', 'longitude']);
            $table->index('organization_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('field_observations');
    }
};
