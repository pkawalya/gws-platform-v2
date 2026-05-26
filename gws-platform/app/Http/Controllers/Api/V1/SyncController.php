<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ResolveConflictRequest;
use App\Http\Requests\Api\V1\SyncPushRequest;
use App\Http\Resources\Api\V1\ObservationResource;
use App\Http\Resources\Api\V1\SyncStatusResource;
use App\Models\FieldObservation;
use App\Services\FieldSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * SyncController — Handles offline-first sync operations for the mobile field app.
 *
 * Provides push (device→server), pull (server→device), status, and conflict
 * resolution endpoints. All sync operations are idempotent and create
 * FieldSyncEvent records for auditing.
 */
class SyncController extends Controller
{
    /**
     * Receive a batch of observations from a mobile device.
     *
     * Creates or updates observations in the database, detects conflicts,
     * and returns a summary including any conflicting records.
     *
     * @param  SyncPushRequest  $request  The validated push request with observations batch
     * @return JsonResponse Push result with conflict details
     */
    public function push(SyncPushRequest $request): JsonResponse
    {
        $user = $request->user();

        $result = FieldSyncService::push(
            user: $user,
            deviceId: $request->input('device_id'),
            observations: $request->input('observations'),
            deviceTimestamp: \Carbon\Carbon::parse($request->input('device_timestamp'))
        );

        return response()->json([
            'data' => [
                'synced' => $result['synced'],
                'conflicts' => ObservationResource::collection($result['conflicts']),
                'errors' => $result['errors'],
            ],
            'meta' => [
                'records_pushed' => $result['records_pushed'],
                'records_conflicted' => $result['records_conflicted'],
                'sync_event_id' => $result['sync_event_id'],
            ],
        ]);
    }

    /**
     * Return changed records since the last sync timestamp.
     *
     * Returns observations, projects, and clients modified since the
     * given timestamp, allowing the device to catch up incrementally.
     *
     * @param  Request  $request  The incoming request with optional since timestamp
     * @return JsonResponse Changed records for the device
     */
    public function pull(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'device_id' => 'required|string|max:200',
            'since' => 'nullable|date',
        ]);

        $since = $request->filled('since')
            ? \Carbon\Carbon::parse($request->input('since'))
            : null;

        $result = FieldSyncService::pull(
            user: $user,
            deviceId: $request->input('device_id'),
            since: $since
        );

        return response()->json([
            'data' => [
                'observations' => ObservationResource::collection($result['observations']),
                'projects' => $result['projects'],
                'clients' => $result['clients'],
            ],
            'meta' => [
                'records_pulled' => $result['records_pulled'],
                'since' => $since?->toIso8601String(),
                'pulled_at' => now()->toIso8601String(),
                'sync_event_id' => $result['sync_event_id'],
            ],
        ]);
    }

    /**
     * Return sync status for the device.
     *
     * Provides the last sync timestamp, pending record count, and
     * conflict count for the given device.
     *
     * @param  Request  $request  The incoming request with device_id
     * @return JsonResponse Sync status information
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'device_id' => 'required|string|max:200',
        ]);

        $status = FieldSyncService::getStatus(
            user: $user,
            deviceId: $request->input('device_id')
        );

        return response()->json([
            'data' => new SyncStatusResource($status),
            'meta' => [],
        ]);
    }

    /**
     * Resolve a sync conflict with a specified resolution strategy.
     *
     * Accepts a conflict resolution strategy (server_wins, client_wins, or merged)
     * and applies it to the conflicted observation. If merged, the provided
     * merged_data is applied to the observation.
     *
     * @param  ResolveConflictRequest  $request  The validated conflict resolution request
     * @return JsonResponse The resolved observation
     */
    public function resolveConflict(ResolveConflictRequest $request): JsonResponse
    {
        $observation = FieldObservation::where('uuid', $request->input('observation_uuid'))->firstOrFail();

        $resolved = FieldSyncService::resolveConflict(
            observation: $observation,
            resolution: $request->input('resolution'),
            mergedData: $request->input('merged_data')
        );

        $resolved->load(['surveyProject', 'recordedBy']);

        return response()->json([
            'data' => new ObservationResource($resolved),
            'meta' => [
                'resolution' => $request->input('resolution'),
            ],
        ]);
    }
}
