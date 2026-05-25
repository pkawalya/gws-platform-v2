<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Multi-Tenancy Scaffold — Phase 0.3
     * ----------------------------------
     * Creates the core organization and branch tables that underpin
     * the GWS Platform's multi-tenant architecture. Every tenant
     * (organization) can have multiple branches; each branch may
     * optionally designate a headquarters flag and a manager.
     */
    public function up(): void
    {
        /*
        |-------------------------------------------------------------
        | Table: organizations
        |-------------------------------------------------------------
        | Top-level tenant entity. Organizations own branches, users,
        | clients, and all downstream business data.
        */
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();

            $table->string('name', 150);
            $table->string('slug', 150)->unique();
            $table->string('logo_path', 255)->nullable();

            // Flexible key-value settings stored as JSON.
            // Examples: timezone, locale, feature_flags, etc.
            $table->json('settings_json')->nullable();

            // ENUM(basic, professional, enterprise) — stored as string
            // for SQLite compatibility; constrained at the application level.
            $table->string('subscription_plan', 50)->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // Index for quick active-organization lookups
            $table->index('is_active', 'organizations_is_active_index');
        });

        /*
        |-------------------------------------------------------------
        | Table: branches
        |-------------------------------------------------------------
        | A physical or logical office belonging to an organization.
        | Each branch has a unique short code for quick reference.
        */
        Schema::create('branches', function (Blueprint $table) {
            $table->id();

            $table->foreignId('organization_id')
                ->constrained('organizations')
                ->cascadeOnDelete();

            $table->string('name', 150);

            // Unique human-readable code, e.g. "HQ", "WND-01"
            $table->string('code', 20)->unique();

            $table->text('address')->nullable();
            $table->string('district', 100)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email', 150)->nullable();

            $table->boolean('is_headquarters')->default(false);

            // Optional branch manager — null on user deletion
            $table->foreignId('manager_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // Index for scoping queries by organization
            $table->index('organization_id', 'branches_organization_id_index');

            // Index for finding the headquarters of an org quickly
            $table->index(
                ['organization_id', 'is_headquarters'],
                'branches_org_hq_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branches');
        Schema::dropIfExists('organizations');
    }
};
