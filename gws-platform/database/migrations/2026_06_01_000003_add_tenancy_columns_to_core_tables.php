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
     * Adds nullable organization_id and branch_id foreign keys to the
     * core tables that need tenancy scoping. Because this is a greenfield
     * project, some tables (e.g. 'clients') may not exist yet — we guard
     * each addition with Schema::hasTable() so the migration is idempotent.
     *
     * IMPORTANT: These columns are nullable so that existing rows are not
     * broken. Application-level logic should enforce tenancy on new records.
     */
    public function up(): void
    {
        // ──────────────────────────────────────────────
        // users table
        // ──────────────────────────────────────────────
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'organization_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('organization_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('organizations')
                    ->nullOnDelete();

                $table->foreignId('branch_id')
                    ->nullable()
                    ->after('organization_id')
                    ->constrained('branches')
                    ->nullOnDelete();

                $table->index('organization_id', 'users_organization_id_index');
            });
        }

        // ──────────────────────────────────────────────
        // clients table (may not exist yet in greenfield)
        // ──────────────────────────────────────────────
        if (Schema::hasTable('clients') && !Schema::hasColumn('clients', 'organization_id')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->foreignId('organization_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('organizations')
                    ->nullOnDelete();

                $table->foreignId('branch_id')
                    ->nullable()
                    ->after('organization_id')
                    ->constrained('branches')
                    ->nullOnDelete();

                $table->index('organization_id', 'clients_organization_id_index');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('clients')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->dropForeign(['branch_id']);
                $table->dropForeign(['organization_id']);
                $table->dropIndex('clients_organization_id_index');
                $table->dropColumn(['organization_id', 'branch_id']);
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['branch_id']);
                $table->dropForeign(['organization_id']);
                $table->dropIndex('users_organization_id_index');
                $table->dropColumn(['organization_id', 'branch_id']);
            });
        }
    }
};
