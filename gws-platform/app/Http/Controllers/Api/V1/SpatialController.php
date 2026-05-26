<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ProjectGeoJsonResource;
use App\Http\Resources\Api\V1\SpatialLayerResource;
use App\Models\FieldObservation;
use App\Models\SurveyProject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * SpatialController — Provides spatial data for the mobile field app's map.
 *
 * Returns projects as GeoJSON features, available spatial layers, and
 * field observations as map annotations. Supports optional bounding box
 * filtering for efficient mobile data transfer.
 */
class SpatialController extends Controller
{
    /**
     * Return projects as GeoJSON features within optional bounds.
     *
     * If bounding box parameters (north, south, east, west) are provided,
     * only projects within that area are returned. Otherwise, returns all
     * projects assigned to the authenticated surveyor.
     *
     * @param  Request  $request  The incoming request with optional bounds
     * @return JsonResponse GeoJSON FeatureCollection of projects
     */
    public function projects(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = SurveyProject::with(['client', 'progress']);

        // Non-admin users only see their assigned projects
        if (! $user->hasRole('admin') && ! $user->hasRole('super-admin')) {
            $query->where('assigned_surveyor_user_id', $user->id);
        }

        // Optional status filter
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by projects that have spatial data
        $query->whereNotNull('geojson_data');

        // Optional bounding box filter (for mobile viewport)
        if ($request->filled(['north', 'south', 'east', 'west'])) {
            // Simple bounding box: filter by center coordinates if available
            $north = $request->input('north');
            $south = $request->input('south');
            $east = $request->input('east');
            $west = $request->input('west');

            // This is a simplified filter; production would use PostGIS ST_Within
            $query->where(function ($q) use ($north, $south, $east, $west) {
                $q->whereHas('fieldObservations', function ($q2) use ($north, $south, $east, $west) {
                    $q2->whereNotNull('latitude')
                        ->whereNotNull('longitude')
                        ->where('latitude', '>=', $south)
                        ->where('latitude', '<=', $north)
                        ->where('longitude', '>=', $west)
                        ->where('longitude', '<=', $east);
                });
            });
        }

        $projects = $query->get();

        $features = $projects->map(fn ($project) => $project->toGeoJSONFeature());

        return response()->json([
            'data' => [
                'type' => 'FeatureCollection',
                'features' => $features,
            ],
            'meta' => [
                'total_features' => $features->count(),
            ],
        ]);
    }

    /**
     * Return active spatial layers for the organization.
     *
     * Provides layer configuration data that the mobile map client needs
     * to render overlays, boundaries, and reference layers.
     *
     * @param  Request  $request  The incoming request
     * @return JsonResponse List of spatial layers
     */
    public function layers(Request $request): JsonResponse
    {
        // Default layers for the GWS platform
        $layers = [
            [
                'id' => 'uganda-boundaries',
                'name' => 'Uganda District Boundaries',
                'type' => 'vector',
                'source' => '/spatial/layers/uganda-boundaries.geojson',
                'style' => [
                    'fillColor' => '#e0e0e0',
                    'fillOpacity' => 0.1,
                    'strokeColor' => '#9e9e9e',
                    'strokeWidth' => 1,
                ],
                'visible' => true,
                'opacity' => 0.5,
                'min_zoom' => 6,
                'max_zoom' => 22,
                'metadata' => [
                    'attribution' => 'Uganda Bureau of Statistics',
                ],
            ],
            [
                'id' => 'satellite-imagery',
                'name' => 'Satellite Imagery',
                'type' => 'raster',
                'source' => 'osm',
                'style' => [],
                'visible' => false,
                'opacity' => 1.0,
                'min_zoom' => 0,
                'max_zoom' => 22,
                'metadata' => [
                    'provider' => 'OpenStreetMap',
                ],
            ],
            [
                'id' => 'project-boundaries',
                'name' => 'Project Boundaries',
                'type' => 'vector',
                'source' => '/api/v1/spatial/projects',
                'style' => [
                    'fillColor' => '#4CAF50',
                    'fillOpacity' => 0.2,
                    'strokeColor' => '#388E3C',
                    'strokeWidth' => 2,
                ],
                'visible' => true,
                'opacity' => 0.8,
                'min_zoom' => 8,
                'max_zoom' => 22,
                'metadata' => [
                    'dynamic' => true,
                ],
            ],
            [
                'id' => 'field-observations',
                'name' => 'Field Observations',
                'type' => 'vector',
                'source' => '/api/v1/spatial/annotations',
                'style' => [
                    'markerColor' => '#FF5722',
                    'markerSize' => 24,
                ],
                'visible' => true,
                'opacity' => 1.0,
                'min_zoom' => 10,
                'max_zoom' => 22,
                'metadata' => [
                    'dynamic' => true,
                    'cluster' => true,
                    'clusterRadius' => 50,
                ],
            ],
        ];

        return response()->json([
            'data' => SpatialLayerResource::collection($layers),
            'meta' => [
                'total_layers' => count($layers),
            ],
        ]);
    }

    /**
     * Return field observations as GeoJSON annotations.
     *
     * Returns observations from the surveyor's assigned projects as
     * GeoJSON Features suitable for rendering as map annotations.
     *
     * @param  Request  $request  The incoming request with optional filters
     * @return JsonResponse GeoJSON FeatureCollection of observations
     */
    public function annotations(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = FieldObservation::whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->with(['surveyProject', 'recordedBy']);

        // Non-admin users only see their own observations
        if (! $user->hasRole('admin') && ! $user->hasRole('super-admin')) {
            $query->where('recorded_by_user_id', $user->id);
        }

        // Optional project filter
        if ($request->filled('survey_project_id')) {
            $query->forProject($request->input('survey_project_id'));
        }

        // Optional observation type filter
        if ($request->filled('observation_type')) {
            $query->ofType($request->input('observation_type'));
        }

        // Optional bounding box filter
        if ($request->filled(['north', 'south', 'east', 'west'])) {
            $query->where('latitude', '>=', $request->input('south'))
                ->where('latitude', '<=', $request->input('north'))
                ->where('longitude', '>=', $request->input('west'))
                ->where('longitude', '<=', $request->input('east'));
        }

        // Limit results for mobile performance
        $limit = $request->input('limit', 500);
        $observations = $query->orderBy('observed_at', 'desc')->limit($limit)->get();

        $features = $observations->map(fn ($obs) => $obs->toGeoJSON());

        return response()->json([
            'data' => [
                'type' => 'FeatureCollection',
                'features' => $features,
            ],
            'meta' => [
                'total_features' => $features->count(),
                'limit' => $limit,
            ],
        ]);
    }
}
