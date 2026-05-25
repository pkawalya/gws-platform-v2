<?php

namespace App\Livewire\ClientWorkspace;

use App\Models\Client;
use App\Models\SurveyProject;
use App\Services\EventStore;
use Filament\Notifications\Notification;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Computed;
use Livewire\Attributes\Locked;
use Livewire\Component;

class SpatialFootprintBlock extends Component
{
    #[Locked]
    public int $clientId;

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
                    'coordinates' => $project->metadata['coordinates'] ?? null,
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
            ->map(fn($items) => $items->count())
            ->sortDesc()
            ->toArray();
        $projectsByType = $projects->groupBy('project_type')
            ->map(fn($items) => $items->count())
            ->sortDesc()
            ->toArray();
        $projectsByStatus = $projects->groupBy('status')
            ->map(fn($items) => $items->count())
            ->toArray();

        return [
            'total_projects' => $projects->count(),
            'total_area_hectares' => round($totalArea, 2),
            'district_count' => $districtCount,
            'projects_by_district' => $projectsByDistrict,
            'projects_by_type' => $projectsByType,
            'projects_by_status' => $projectsByStatus,
        ];
    }

    public function render()
    {
        return view('livewire.client-workspace.spatial-footprint-block');
    }
}
