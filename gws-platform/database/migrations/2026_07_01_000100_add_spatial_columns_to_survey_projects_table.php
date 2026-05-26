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
     * Adds spatial columns for PostGIS (production) and JSON fallbacks for SQLite (dev).
     * Geometry columns are only created when the database driver is pgsql since
     * Laravel's schema builder does not support PostGIS natively.
     */
    public function up(): void
    {
        Schema::table('survey_projects', function (Blueprint $table) {
            $table->integer('srid')->default(4326)->after('area_hectares');
            $table->json('geojson_data')->nullable()->after('srid');
            $table->timestamp('last_georef_update')->nullable()->after('geojson_data');
        });

        // Add PostGIS geometry columns only on PostgreSQL
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE survey_projects ADD COLUMN boundary_geom geometry(Polygon, 4326)');
            DB::statement('ALTER TABLE survey_projects ADD COLUMN centroid_geom geometry(Point, 4326)');

            // Spatial indexes via GiST
            DB::statement('CREATE INDEX survey_projects_boundary_geom_idx ON survey_projects USING GIST (boundary_geom)');
            DB::statement('CREATE INDEX survey_projects_centroid_geom_idx ON survey_projects USING GIST (centroid_geom)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS survey_projects_centroid_geom_idx');
            DB::statement('DROP INDEX IF EXISTS survey_projects_boundary_geom_idx');
            DB::statement('ALTER TABLE survey_projects DROP COLUMN IF EXISTS centroid_geom');
            DB::statement('ALTER TABLE survey_projects DROP COLUMN IF EXISTS boundary_geom');
        }

        Schema::table('survey_projects', function (Blueprint $table) {
            $table->dropColumn(['srid', 'geojson_data', 'last_georef_update']);
        });
    }
};
