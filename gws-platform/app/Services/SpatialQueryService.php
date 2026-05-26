<?php

namespace App\Services;

use App\Models\MapAnnotation;
use App\Models\SpatialLayer;
use App\Models\SurveyProject;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * SpatialQueryService — Centralized spatial query logic for the GWS Platform.
 *
 * Provides SQLite-compatible spatial queries that also leverage PostGIS
 * when available (pgsql driver). All methods work in both dev (SQLite)
 * and production (PostgreSQL+PostGIS) environments.
 *
 * Usage:
 *   SpatialQueryService::projectsInBounds(-1.5, 29.5, 4.2, 35.0);
 *   SpatialQueryService::projectsNearPoint(1.3733, 32.2903, 10);
 *   SpatialQueryService::getProjectClusters(...);
 */
class SpatialQueryService
{
    /**
     * Find all projects within a bounding box.
     *
     * Uses bounding-box filtering on derived latitude/longitude from
     * geojson_data (SQLite) or ST_MakeEnvelope (PostGIS).
     *
     * @param  float  $southWestLat  Southwest corner latitude
     * @param  float  $southWestLng  Southwest corner longitude
     * @param  float  $northEastLat  Northeast corner latitude
     * @param  float  $northEastLng  Northeast corner longitude
     * @return Collection<int, SurveyProject>
     */
    public static function projectsInBounds(
        float $southWestLat,
        float $southWestLng,
        float $northEastLat,
        float $northEastLng
    ): Collection {
        if (DB::getDriverName() === 'pgsql') {
            // PostGIS: use bounding box intersection with centroid
            return SurveyProject::whereNotNull('geojson_data')
                ->whereRaw(
                    "ST_Intersects(centroid_geom, ST_MakeEnvelope(?, ?, ?, ?, 4326))",
                    [$southWestLng, $southWestLat, $northEastLng, $northEastLat]
                )
                ->with(['client', 'progress'])
                ->get();
        }

        // SQLite: extract lat/lng from geojson_data JSON and filter
        return SurveyProject::whereNotNull('geojson_data')
            ->whereNotNull('district')
            ->with(['client', 'progress'])
            ->get()
            ->filter(function (SurveyProject $project) use ($southWestLat, $southWestLng, $northEastLat, $northEastLng) {
                $center = $project->getCenterCoordinates();
                if (!$center) {
                    return false;
                }

                return $center[0] >= $southWestLat
                    && $center[0] <= $northEastLat
                    && $center[1] >= $southWestLng
                    && $center[1] <= $northEastLng;
            });
    }

    /**
     * Find projects near a given point within a radius (km).
     *
     * Uses Haversine distance calculation for SQLite compatibility.
     * With PostGIS, uses ST_DWithin for better performance.
     *
     * @param  float  $lat  Center latitude
     * @param  float  $lng  Center longitude
     * @param  float  $radiusKm  Search radius in kilometers
     * @return Collection<int, SurveyProject>
     */
    public static function projectsNearPoint(float $lat, float $lng, float $radiusKm = 10): Collection
    {
        if (DB::getDriverName() === 'pgsql') {
            // PostGIS: use ST_DWithin with geography cast for accurate distance
            return SurveyProject::whereNotNull('centroid_geom')
                ->whereRaw(
                    "ST_DWithin(centroid_geom::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)",
                    [$lng, $lat, $radiusKm * 1000]
                )
                ->with(['client', 'progress'])
                ->get();
        }

        // SQLite: filter using Haversine on extracted coordinates
        return SurveyProject::whereNotNull('district')
            ->with(['client', 'progress'])
            ->get()
            ->filter(function (SurveyProject $project) use ($lat, $lng, $radiusKm) {
                $center = $project->getCenterCoordinates();
                if (!$center) {
                    return false;
                }

                $distance = static::haversineDistance($lat, $lng, $center[0], $center[1]);

                return $distance <= $radiusKm;
            })
            ->sortBy(function (SurveyProject $project) use ($lat, $lng) {
                $center = $project->getCenterCoordinates();

                return $center ? static::haversineDistance($lat, $lng, $center[0], $center[1]) : PHP_FLOAT_MAX;
            });
    }

    /**
     * Find annotations near a given point within a radius (km).
     *
     * Delegates to MapAnnotation::nearPoint scope for bounding-box filtering,
     * then refines with Haversine distance calculation.
     *
     * @param  float  $lat  Center latitude
     * @param  float  $lng  Center longitude
     * @param  float  $radiusKm  Search radius in kilometers
     * @return Collection<int, MapAnnotation>
     */
    public static function annotationsNearPoint(float $lat, float $lng, float $radiusKm = 10): Collection
    {
        return MapAnnotation::nearPoint($lat, $lng, $radiusKm)
            ->with(['entity', 'createdBy'])
            ->get()
            ->filter(function (MapAnnotation $annotation) use ($lat, $lng, $radiusKm) {
                if (!$annotation->latitude || !$annotation->longitude) {
                    return false;
                }

                $distance = static::haversineDistance(
                    $lat,
                    $lng,
                    (float) $annotation->latitude,
                    (float) $annotation->longitude
                );

                return $distance <= $radiusKm;
            })
            ->sortBy(function (MapAnnotation $annotation) use ($lat, $lng) {
                return static::haversineDistance(
                    $lat,
                    $lng,
                    (float) $annotation->latitude,
                    (float) $annotation->longitude
                );
            });
    }

    /**
     * Get cluster data for heatmap/marker cluster rendering.
     *
     * Groups projects into grid cells based on the current zoom level.
     * Higher zoom levels produce smaller cells (more granular clusters).
     *
     * @param  float  $boundsSwLat  Southwest latitude of current map bounds
     * @param  float  $boundsSwLng  Southwest longitude of current map bounds
     * @param  float  $boundsNeLat  Northeast latitude of current map bounds
     * @param  float  $boundsNeLng  Northeast longitude of current map bounds
     * @param  int  $zoomLevel  Current map zoom level (0-18)
     * @return array<int, array{lat: float, lng: float, count: int, projects: array}>
     */
    public static function getProjectClusters(
        float $boundsSwLat,
        float $boundsSwLng,
        float $boundsNeLat,
        float $boundsNeLng,
        int $zoomLevel
    ): array {
        // Determine grid cell size based on zoom level
        $gridSize = match (true) {
            $zoomLevel <= 6 => 2.0,   // ~220km cells
            $zoomLevel <= 8 => 1.0,   // ~111km cells
            $zoomLevel <= 10 => 0.5,  // ~55km cells
            $zoomLevel <= 12 => 0.2,  // ~22km cells
            $zoomLevel <= 14 => 0.1,  // ~11km cells
            default => 0.05,          // ~5.5km cells
        };

        $projects = static::projectsInBounds(
            $boundsSwLat,
            $boundsSwLng,
            $boundsNeLat,
            $boundsNeLng
        );

        $clusters = [];

        foreach ($projects as $project) {
            $center = $project->getCenterCoordinates();
            if (!$center) {
                continue;
            }

            // Calculate grid cell key
            $cellLat = floor($center[0] / $gridSize) * $gridSize;
            $cellLng = floor($center[1] / $gridSize) * $gridSize;
            $key = "{$cellLat},{$cellLng}";

            if (!isset($clusters[$key])) {
                $clusters[$key] = [
                    'lat' => 0.0,
                    'lng' => 0.0,
                    'count' => 0,
                    'projects' => [],
                ];
            }

            $clusters[$key]['lat'] += $center[0];
            $clusters[$key]['lng'] += $center[1];
            $clusters[$key]['count']++;
            $clusters[$key]['projects'][] = [
                'id' => $project->id,
                'projectNumber' => $project->project_number,
                'status' => $project->status,
                'projectType' => $project->project_type,
            ];
        }

        // Calculate centroids for each cluster
        return array_values(array_map(function (array $cluster): array {
            $count = $cluster['count'];

            return [
                'lat' => round($cluster['lat'] / $count, 7),
                'lng' => round($cluster['lng'] / $count, 7),
                'count' => $count,
                'projects' => $cluster['projects'],
            ];
        }, $clusters));
    }

    /**
     * Get all visible layers for the given organization.
     *
     * Returns active layers ordered by display_order, optionally filtered
     * by organization for multi-tenant isolation.
     *
     * @param  int|null  $organizationId  Organization ID or null for global layers
     * @return Collection<int, SpatialLayer>
     */
    public static function getVisibleLayers(?int $organizationId = null): Collection
    {
        return SpatialLayer::active()
            ->when($organizationId, function ($query, $orgId) {
                $query->where(function ($q) use ($orgId) {
                    $q->whereNull('organization_id')
                      ->orWhere('organization_id', $orgId);
                });
            })
            ->ordered()
            ->get();
    }

    /**
     * Get projects as a GeoJSON FeatureCollection.
     *
     * Returns a complete GeoJSON FeatureCollection suitable for API responses
     * or direct consumption by Leaflet/Mapbox.
     *
     * @param  int|null  $organizationId  Filter by organization
     * @param  string|null  $statusFilter  Filter by project status
     * @return array{type: string, features: array}
     */
    public static function projectsAsGeoJson(?int $organizationId = null, ?string $statusFilter = null): array
    {
        $query = SurveyProject::with(['client', 'progress']);

        if ($organizationId) {
            $query->where('organization_id', $organizationId);
        }

        if ($statusFilter) {
            $query->where('status', $statusFilter);
        }

        $projects = $query->get();

        $features = $projects
            ->filter(fn (SurveyProject $project) => $project->getCenterCoordinates() !== null)
            ->map(fn (SurveyProject $project) => $project->toGeoJSONFeature())
            ->values()
            ->toArray();

        return [
            'type' => 'FeatureCollection',
            'features' => $features,
        ];
    }

    /**
     * Get annotations as a GeoJSON FeatureCollection.
     *
     * @param  int|null  $organizationId  Filter by organization
     * @param  string|null  $entityType  Filter by entity type (e.g., SurveyProject)
     * @return array{type: string, features: array}
     */
    public static function annotationsAsGeoJson(?int $organizationId = null, ?string $entityType = null): array
    {
        $query = MapAnnotation::public()->with(['entity']);

        if ($organizationId) {
            $query->where('organization_id', $organizationId);
        }

        if ($entityType) {
            $query->where('entity_type', $entityType);
        }

        $annotations = $query->get();

        $features = $annotations
            ->map(fn (MapAnnotation $annotation) => $annotation->toGeoJSON())
            ->values()
            ->toArray();

        return [
            'type' => 'FeatureCollection',
            'features' => $features,
        ];
    }

    /**
     * Calculate approximate distance between two points using the Haversine formula.
     *
     * Returns the great-circle distance in kilometers between two points
     * on the Earth's surface specified by latitude/longitude.
     *
     * @param  float  $lat1  Latitude of point 1
     * @param  float  $lng1  Longitude of point 1
     * @param  float  $lat2  Latitude of point 2
     * @param  float  $lng2  Longitude of point 2
     * @return float Distance in kilometers
     */
    public static function haversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadiusKm = 6371.0;

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * asin(sqrt($a));

        return $earthRadiusKm * $c;
    }
}
