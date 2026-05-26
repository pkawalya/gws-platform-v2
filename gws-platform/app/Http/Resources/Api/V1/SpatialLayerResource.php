<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * SpatialLayerResource — Transforms spatial layer configuration for the mobile app.
 *
 * Provides layer configuration data that the mobile map client needs
 * to render overlays, boundaries, and reference layers.
 */
class SpatialLayerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this['id'] ?? null,
            'name' => $this['name'] ?? null,
            'type' => $this['type'] ?? null,
            'source' => $this['source'] ?? null,
            'style' => $this['style'] ?? [],
            'visible' => $this['visible'] ?? true,
            'opacity' => $this['opacity'] ?? 1.0,
            'min_zoom' => $this['min_zoom'] ?? 0,
            'max_zoom' => $this['max_zoom'] ?? 22,
            'metadata' => $this['metadata'] ?? [],
        ];
    }
}
