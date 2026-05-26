<?php

namespace App\Livewire\ClientWorkspace;

use App\Models\Client;
use App\Models\MapAnnotation;
use App\Models\SurveyProject;
use App\Services\EventStore;
use App\Services\SpatialQueryService;
use Filament\Notifications\Notification;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Computed;
use Livewire\Attributes\Locked;
use Livewire\Component;

class SpatialFootprintBlock extends Component
{
    #[Locked]
    public int $clientId;

    #[Locked]
    public float $mapCenterLat = 1.3733;

    #[Locked]
    public float $mapCenterLng = 32.2903;

    #[Locked]
    public int $mapZoom = 7;

    /**
     * Get map data for rendering the Leaflet map.
     *
     * Returns center coordinates, zoom level, project markers with
     * color-coded icons by status, and polygon boundaries where available.
     *
     * @return array{center: array{0: float, 1: float}, zoom: int, markers: array, polygons: array}
     */
    #[Computed]
    public function mapData(): array
    {
        $projects = SurveyProject::where('client_id', $this->clientId)
            ->whereNotNull('district')
            ->with(['client', 'progress'])
            ->get();

        $markers = [];
        $polygons = [];
        $allLats = [];
        $allLngs = [];

        $statusColors = [
            'inquiry' => '#6b7280',
            'active' => '#3b82f6',
            'surveying' => '#6366f1',
            'completed' => '#10b981',
            'on_hold' => '#f59e0b',
            'cancelled' => '#ef4444',
        ];

        foreach ($projects as $project) {
            $center = $project->getCenterCoordinates();

            if ($center) {
                $allLats[] = $center[0];
                $allLngs[] = $center[1];

                $markers[] = [
                    'id' => $project->id,
                    'projectId' => $project->id,
                    'projectNumber' => $project->project_number,
                    'projectType' => $project->project_type,
                    'status' => $project->status,
                    'district' => $project->district,
                    'areaHectares' => $project->area_hectares ? (float) $project->area_hectares : null,
                    'progress' => $project->progress?->progress_percentage ?? 0,
                    'lat' => $center[0],
                    'lng' => $center[1],
                    'color' => $statusColors[$project->status] ?? '#6b7280',
                ];
            }

            // Extract polygon boundaries from geojson_data
            if ($project->geojson_data) {
                $geojson = $project->geojson_data;
                $geometry = null;

                if (isset($geojson['type']) && $geojson['type'] === 'Feature') {
                    $geometry = $geojson['geometry'] ?? null;
                } elseif (isset($geojson['type']) && in_array($geojson['type'], ['Polygon', 'MultiPolygon'])) {
                    $geometry = $geojson;
                }

                if ($geometry && in_array($geometry['type'] ?? '', ['Polygon', 'MultiPolygon'])) {
                    $polygons[] = [
                        'id' => $project->id,
                        'projectNumber' => $project->project_number,
                        'status' => $project->status,
                        'color' => $statusColors[$project->status] ?? '#6b7280',
                        'geometry' => $geometry,
                    ];
                }
            }
        }

        // Auto-center map on project markers
        $center = [$this->mapCenterLat, $this->mapCenterLng];
        $zoom = $this->mapZoom;

        if (count($allLats) > 0) {
            $center = [
                (min($allLats) + max($allLats)) / 2,
                (min($allLngs) + max($allLngs)) / 2,
            ];

            // Adjust zoom based on spread
            $latSpread = max($allLats) - min($allLats);
            $lngSpread = max($allLngs) - min($allLngs);
            $maxSpread = max($latSpread, $lngSpread);

            if ($maxSpread > 5) {
                $zoom = 6;
            } elseif ($maxSpread > 2) {
                $zoom = 7;
            } elseif ($maxSpread > 1) {
                $zoom = 8;
            } elseif ($maxSpread > 0.5) {
                $zoom = 9;
            } elseif ($maxSpread > 0.1) {
                $zoom = 10;
            } else {
                $zoom = 12;
            }

            // If only one marker, zoom closer
            if (count($allLats) === 1) {
                $zoom = 11;
            }
        }

        return [
            'center' => $center,
            'zoom' => $zoom,
            'markers' => $markers,
            'polygons' => $polygons,
        ];
    }

    /**
     * Get the client's projects with location data.
     */
    #[Computed]
    public function spatialProjects()
    {
        return SurveyProject::where('client_id', $this->clientId)
            ->whereNotNull('district')
            ->with(['client', 'progress'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($project) {
                return [
                    'id' => $project->id,
                    'project_number' => $project->project_number,
                    'project_type' => $project->project_type,
                    'district' => $project->district,
                    'location_description' => $project->location_description,
                    'area_hectares' => $project->area_hectares,
                    'status' => $project->status,
                    'progress' => $project->progress?->progress_percentage ?? 0,
                    'coordinates' => $project->getCenterCoordinates(),
                    'has_spatial_data' => $project->hasSpatialData(),
                ];
            });
    }

    /**
     * Get spatial summary stats.
     */
    #[Computed]
    public function spatialSummary(): array
    {
        $projects = SurveyProject::where('client_id', $this->clientId)->get();

        $totalArea = $projects->sum('area_hectares');
        $districtCount = $projects->whereNotNull('district')->pluck('district')->unique()->count();
        $projectsByDistrict = $projects->whereNotNull('district')
            ->groupBy('district')
            ->map(fn ($items) => $items->count())
            ->sortDesc()
            ->toArray();
        $projectsByType = $projects->groupBy('project_type')
            ->map(fn ($items) => $items->count())
            ->sortDesc()
            ->toArray();
        $projectsByStatus = $projects->groupBy('status')
            ->map(fn ($items) => $items->count())
            ->toArray();
        $spatialCount = $projects->filter(fn ($p) => $p->getCenterCoordinates() !== null)->count();

        return [
            'total_projects' => $projects->count(),
            'total_area_hectares' => round($totalArea, 2),
            'district_count' => $districtCount,
            'projects_by_district' => $projectsByDistrict,
            'projects_by_type' => $projectsByType,
            'projects_by_status' => $projectsByStatus,
            'spatial_count' => $spatialCount,
        ];
    }

    /**
     * Pan map to a specific project.
     *
     * Dispatches a browser event to pan the Leaflet map to the
     * given project's coordinates.
     */
    public function panToProject(int $projectId): void
    {
        $project = SurveyProject::find($projectId);

        if ($project) {
            $center = $project->getCenterCoordinates();
            if ($center) {
                $this->dispatch('pan-to-project', [
                    'lat' => $center[0],
                    'lng' => $center[1],
                    'projectId' => $projectId,
                    'projectNumber' => $project->project_number,
                ]);
            }
        }
    }

    /**
     * Refresh map data.
     *
     * Unsets the computed mapData cache so it is recalculated on next access.
     */
    public function refreshMap(): void
    {
        unset($this->mapData);

        Notification::make()
            ->title('Map data refreshed')
            ->success()
            ->send();
    }

    public function render()
    {
        return view('livewire.client-workspace.spatial-footprint-block');
    }
}
