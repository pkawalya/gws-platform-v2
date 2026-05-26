<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * ObservationResource — Transforms a FieldObservation for API responses.
 *
 * Includes the full observation data along with sync status information
 * for the mobile field app.
 */
class ObservationResource extends JsonResource
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
            'uuid' => $this->uuid,
            'survey_project_id' => $this->survey_project_id,
            'observation_type' => $this->observation_type,
            'title' => $this->title,
            'description' => $this->description,
            'geometry' => $this->geometry,
            'latitude' => $this->latitude ? (float) $this->latitude : null,
            'longitude' => $this->longitude ? (float) $this->longitude : null,
            'accuracy_meters' => $this->accuracy_meters ? (float) $this->accuracy_meters : null,
            'altitude_meters' => $this->altitude_meters ? (float) $this->altitude_meters : null,
            'observation_data' => $this->observation_data,
            'media_paths' => $this->media_paths,
            'observed_at' => $this->observed_at?->toIso8601String(),
            'is_offline_creation' => $this->is_offline_creation,
            'sync_status' => $this->sync_status,
            'synced_at' => $this->synced_at?->toIso8601String(),
            'conflict_resolution' => $this->conflict_resolution,
            'recorded_by' => [
                'id' => $this->recorded_by_user_id,
                'name' => $this->whenLoaded('recordedBy', fn () => $this->recordedBy?->name),
            ],
            'project' => $this->when($this->relationLoaded('surveyProject'), function () {
                return [
                    'id' => $this->surveyProject->id,
                    'project_number' => $this->surveyProject->project_number,
                    'project_type' => $this->surveyProject->project_type,
                ];
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
