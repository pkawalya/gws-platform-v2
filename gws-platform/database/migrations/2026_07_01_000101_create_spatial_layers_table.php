<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the spatial_layers table for managing map overlay layers
     * (districts, parcels, infrastructure, annotations, etc.).
     */
    public function up(): void
    {
        Schema::create('spatial_layers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200);
            $table->string('slug', 200)->unique();
            $table->string('layer_type', 50); // boundary|parcel|infrastructure|annotation|overlay
            $table->string('source_type', 50)->default('upload'); // upload|osm|wms|api
            $table->json('source_config')->nullable();
            $table->json('geojson_data')->nullable();
            $table->json('style_config')->nullable();
            $table->boolean('is_visible_by_default')->default(true);
            $table->integer('min_zoom')->nullable()->default(0);
            $table->integer('max_zoom')->nullable()->default(18);
            $table->integer('display_order')->default(0);
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Indexes
            $table->index('slug');
            $table->index('layer_type');
            $table->index('is_active');
            $table->index('organization_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('spatial_layers');
    }
};
