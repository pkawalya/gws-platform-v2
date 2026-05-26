<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * SyncStatusResource — Transforms sync status information for the mobile app.
 *
 * Provides the last sync timestamp, pending record count, and
 * conflict count so the mobile app can display sync status.
 */
class SyncStatusResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'last_sync_at' => $this['last_sync_at'] ?? null,
            'pending_count' => $this['pending_count'] ?? 0,
            'conflict_count' => $this['conflict_count'] ?? 0,
            'last_sync_event' => isset($this['last_sync_event'])
                ? [
                    'id' => $this['last_sync_event']['id'],
                    'sync_type' => $this['last_sync_event']['sync_type'],
                    'status' => $this['last_sync_event']['status'],
                    'records_pushed' => $this['last_sync_event']['records_pushed'],
                    'records_pulled' => $this['last_sync_event']['records_pulled'],
                    'records_conflicted' => $this['last_sync_event']['records_conflicted'],
                    'started_at' => $this['last_sync_event']['started_at'],
                    'completed_at' => $this['last_sync_event']['completed_at'],
                ]
                : null,
        ];
    }
}
