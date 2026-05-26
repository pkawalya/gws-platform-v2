<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the map_annotations table for storing map markers, polygons,
     * polylines, and circles associated with any entity (polymorphic).
     */
    public function up(): void
    {
        Schema::create('map_annotations', function (Blueprint $table) {
            $table->id();
            $table->string('annotation_type', 50); // marker|polygon|polyline|circle
            $table->string('entity_type', 100)->nullable(); // morph target
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->json('geometry'); // GeoJSON geometry
            $table->json('style')->nullable(); // per-annotation styling overrides
            $table->decimal('latitude', 10, 7)->nullable(); // derived from geometry
            $table->decimal('longitude', 10, 7)->nullable(); // derived from geometry
            $table->boolean('is_public')->default(true);
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->timestamps();

            // Indexes
            $table->index(['entity_type', 'entity_id']);
            $table->index('annotation_type');
            $table->index('is_public');
            $table->index('latitude');
            $table->index('longitude');
            $table->index('organization_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('map_annotations');
    }
};
