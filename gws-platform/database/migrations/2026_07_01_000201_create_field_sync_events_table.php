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
        Schema::create('field_sync_events', function (Blueprint $table) {
            $table->id();
            $table->string('device_id', 200);
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('sync_type', 20);
            $table->string('status', 20);
            $table->integer('records_pushed')->default(0);
            $table->integer('records_pulled')->default(0);
            $table->integer('records_conflicted')->default(0);
            $table->json('conflicts')->nullable();
            $table->timestamp('device_timestamp');
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->json('metadata')->nullable();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->timestamps();

            // Indexes for commonly queried columns
            $table->index('device_id');
            $table->index('user_id');
            $table->index('sync_type');
            $table->index('status');
            $table->index('started_at');
            $table->index('organization_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('field_sync_events');
    }
};
