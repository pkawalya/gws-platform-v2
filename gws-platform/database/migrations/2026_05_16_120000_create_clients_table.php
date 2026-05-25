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
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('client_number', 30)->unique();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email', 150)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('nin', 20)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 10)->nullable();
            $table->text('address')->nullable();
            $table->string('district', 100)->nullable();
            $table->string('lc1_area', 150)->nullable();
            $table->string('village', 150)->nullable();
            $table->string('parish', 150)->nullable();
            $table->string('sub_county', 150)->nullable();
            $table->string('county', 150)->nullable();
            $table->boolean('kyc_verified')->default(false);
            $table->timestamp('kyc_verified_at')->nullable();
            $table->string('lifecycle_state', 20)->default('prospect');
            $table->boolean('sms_opt_out')->default(false);
            $table->foreignId('assigned_officer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->timestamps();

            // Indexes for commonly queried columns
            $table->index('client_number');
            $table->index('phone');
            $table->index('nin');
            $table->index('lifecycle_state');
            $table->index('assigned_officer_user_id');
            $table->index('organization_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
