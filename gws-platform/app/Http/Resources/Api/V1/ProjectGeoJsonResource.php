<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * ProjectGeoJsonResource — Transforms a SurveyProject into a GeoJSON Feature.
 *
 * Each project is represented as a GeoJSON Feature with its spatial
 * geometry and descriptive properties, suitable for rendering on
 * a mobile map client.
 */
class ProjectGeoJsonResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return $this->resource->toGeoJSONFeature();
    }
}
