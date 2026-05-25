<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * IMMUTABLE — append-only event store.
     * No update or delete permissions on this table.
     */
    public function up(): void
    {
        Schema::create('domain_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_type', 150)->index();
            // e.g. 'client.workspace_viewed', 'approval.step_deferred',
            //      'mzo.stage_changed', 'title.issued', 'payment.recorded'

            $table->string('aggregate_type', 100);
            // e.g. 'Client', 'SurveyProject', 'TitleApplication'

            $table->unsignedBigInteger('aggregate_id');
            $table->index(['aggregate_type', 'aggregate_id'], 'domain_events_aggregate_index');

            $table->json('payload');
            // Event-specific data: stage names, amounts, officer names, etc.

            $table->json('metadata');
            // ip_address, user_agent, request_id, correlation_id

            $table->string('causer_type', 100)->nullable();
            // e.g. 'App\Models\User' or 'App\Models\Client' for portal actions

            $table->unsignedBigInteger('causer_id')->nullable();
            $table->index(['causer_type', 'causer_id'], 'domain_events_causer_index');

            $table->timestamp('occurred_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->index('occurred_at');

            $table->timestamp('recorded_at')->default(DB::raw('CURRENT_TIMESTAMP'));

            // No updated_at — events are append-only
        });

        // Add DB comment for immutability documentation (PostgreSQL only)
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("COMMENT ON TABLE domain_events IS 'IMMUTABLE — append-only event store'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('domain_events');
    }
};
