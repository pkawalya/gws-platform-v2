<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * AssignmentResource — Transforms a SurveyProject for the field surveyor's assignment view.
 *
 * Includes the project details along with client summary, progress,
 * approval steps, and recent observations for the mobile field app.
 */
class AssignmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_number' => $this->project_number,
            'project_type' => $this->project_type,
            'description' => $this->description,
            'district' => $this->district,
            'location_description' => $this->location_description,
            'status' => $this->status,
            'area_hectares' => $this->area_hectares ? (float) $this->area_hectares : null,
            'inquiry_date' => $this->inquiry_date?->toIso8601String(),
            'start_date' => $this->start_date?->toIso8601String(),
            'completion_date' => $this->completion_date?->toIso8601String(),
            'client' => $this->when($this->relationLoaded('client'), function () {
                return new ClientSummaryResource($this->client);
            }),
            'progress' => $this->when($this->relationLoaded('progress'), function () {
                if (! $this->progress) {
                    return null;
                }

                return [
                    'percentage' => $this->progress->progress_percentage ? (float) $this->progress->progress_percentage : 0,
                    'current_stage' => $this->progress->current_stage,
                    'notes' => $this->progress->notes,
                ];
            }),
            'approval_steps' => $this->when($this->relationLoaded('progress'), function () {
                if (! $this->progress || ! $this->progress->relationLoaded('approvalSteps')) {
                    return [];
                }

                return $this->progress->approvalSteps->map(fn ($step) => [
                    'institution' => $step->institution,
                    'step_order' => $step->step_order,
                    'status' => $step->status,
                    'officer_name' => $step->officer_name,
                    'submitted_at' => $step->submitted_at?->toIso8601String(),
                    'approved_at' => $step->approved_at?->toIso8601String(),
                ]);
            }),
            'recent_observations_count' => $this->whenCounted('fieldObservations'),
            'observations' => ObservationResource::collection($this->whenLoaded('fieldObservations')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
