<?php

namespace App\Filament\Pages;

use App\Models\SpatialLayer;
use App\Services\SpatialQueryService;
use Filament\Pages\Page;
use Filament\Support\Icons\Heroicon;

/**
 * SpatialMapPage — Full-screen map navigation surface for the GWS Platform.
 *
 * Displays all projects as interactive markers on a Leaflet map with
 * layer toggles, search, status filters, and cluster rendering.
 * Serves as the primary spatial navigation entry point.
 */
class SpatialMapPage extends Page
{
    protected static ?string $navigationIcon = Heroicon::OutlinedMap;

    protected static string $navigationGroup = 'Spatial';

    protected static ?int $navigationSort = 5;

    protected static ?string $navigationLabel = 'Spatial Map';

    protected static ?string $title = 'Spatial Map';

    protected static string $view = 'filament.pages.spatial-map';

    /**
     * Get the GeoJSON data for all mappable projects.
     *
     * @return array{type: string, features: array}
     */
    public function getProjectsGeoJson(): array
    {
        return SpatialQueryService::projectsAsGeoJson();
    }

    /**
     * Get all visible spatial layers for the map.
     *
     * @return \Illuminate\Support\Collection<int, SpatialLayer>
     */
    public function getVisibleLayers()
    {
        return SpatialQueryService::getVisibleLayers();
    }

    /**
     * Get the cluster data for the current map view.
     *
     * @return array
     */
    public function getClusterData(): array
    {
        // Default to Uganda bounds
        return SpatialQueryService::getProjectClusters(
            southWestLat: -1.5,
            southWestLng: 29.5,
            northEastLat: 4.2,
            northEastLng: 35.0,
            zoomLevel: 7
        );
    }

    /**
     * Get status filter options.
     *
     * @return array<string, string>
     */
    public function getStatusOptions(): array
    {
        return [
            'inquiry' => 'Inquiry',
            'active' => 'Active',
            'surveying' => 'Surveying',
            'completed' => 'Completed',
            'on_hold' => 'On Hold',
            'cancelled' => 'Cancelled',
        ];
    }
}
