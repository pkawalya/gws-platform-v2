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
        Schema::create('survey_projects', function (Blueprint $table) {
            $table->id();
            $table->string('project_number', 30)->unique();
            $table->string('project_type', 50);
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->text('description')->nullable();
            $table->string('district', 100)->nullable();
            $table->text('location_description')->nullable();
            $table->string('status', 30)->default('inquiry');
            $table->foreignId('assigned_surveyor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('inquiry_date');
            $table->date('start_date')->nullable();
            $table->date('completion_date')->nullable();
            $table->decimal('area_hectares', 10, 4)->nullable();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->timestamps();

            // Indexes for commonly queried columns
            $table->index('project_number');
            $table->index('client_id');
            $table->index('status');
            $table->index('assigned_surveyor_user_id');
            $table->index('organization_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('survey_projects');
    }
};
