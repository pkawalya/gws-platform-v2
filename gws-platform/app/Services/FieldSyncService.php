<?php

namespace App\Services;

use App\Models\FieldObservation;
use App\Models\FieldSyncEvent;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * FieldSyncService — Central service for offline-first field data synchronization.
 *
 * Handles pushing observations from mobile devices to the server, pulling
 * changed records back to devices, tracking sync status, and resolving
 * conflicts. All operations are idempotent and create FieldSyncEvent
 * records for auditing and traceability.
 */
class FieldSyncService
{
    /**
     * Push observations from a mobile device to the server.
     *
     * Processes a batch of observations, creating new records or updating
     * existing ones (matched by UUID). Detects conflicts where the same
     * UUID has been modified both on the device and the server since the
     * last sync. All operations are wrapped in a database transaction.
     *
     * @param  User  $user  The authenticated user pushing data
     * @param  string  $deviceId  The unique device identifier
     * @param  array  $observations  Array of observation data from the device
     * @param  Carbon  $deviceTimestamp  The timestamp on the device when sync was initiated
     * @return array{synced: array<int>, conflicts: Collection, errors: array, records_pushed: int, records_conflicted: int, sync_event_id: int}
     */
    public static function push(User $user, string $deviceId, array $observations, Carbon $deviceTimestamp): array
    {
        // Create sync event record
        $syncEvent = FieldSyncEvent::create([
            'device_id' => $deviceId,
            'user_id' => $user->id,
            'sync_type' => 'push',
            'status' => 'started',
            'records_pushed' => 0,
            'records_pulled' => 0,
            'records_conflicted' => 0,
            'device_timestamp' => $deviceTimestamp,
            'started_at' => now(),
            'organization_id' => $user->organization_id,
            'metadata' => [
                'observation_count' => count($observations),
                'app_version' => request()->header('X-App-Version'),
                'platform' => request()->header('X-Platform'),
            ],
        ]);

        $synced = [];
        $conflicts = new Collection();
        $errors = [];

        try {
            DB::transaction(function () use ($observations, $user, $syncEvent, &$synced, &$conflicts, &$errors) {
                foreach ($observations as $index => $observationData) {
                    try {
                        $observation = static::upsertObservation($observationData, $user);

                        if ($observation->sync_status === 'conflict') {
                            $conflicts->push($observation);
                        } else {
                            $synced[] = $observation->id;
                        }
                    } catch (\Exception $e) {
                        $errors[] = [
                            'index' => $index,
                            'uuid' => $observationData['uuid'] ?? null,
                            'error' => $e->getMessage(),
                        ];
                    }
                }
            });

            // Update sync event with results
            $syncEvent->markCompleted(
                pushed: count($synced),
                pulled: 0,
                conflicted: $conflicts->count()
            );

            // Store conflict details if any
            if ($conflicts->count() > 0) {
                $syncEvent->update([
                    'conflicts' => $conflicts->map(fn ($obs) => [
                        'uuid' => $obs->uuid,
                        'observation_type' => $obs->observation_type,
                        'title' => $obs->title,
                        'server_updated_at' => $obs->updated_at?->toIso8601String(),
                    ])->toArray(),
                ]);
            }
        } catch (\Exception $e) {
            $syncEvent->markFailed($e->getMessage());
        }

        return [
            'synced' => $synced,
            'conflicts' => $conflicts,
            'errors' => $errors,
            'records_pushed' => count($synced),
            'records_conflicted' => $conflicts->count(),
            'sync_event_id' => $syncEvent->id,
        ];
    }

    /**
     * Pull changed records from the server since the last sync timestamp.
     *
     * Returns observations, project summaries, and client summaries that
     * have been modified since the given timestamp, allowing the mobile
     * device to incrementally catch up.
     *
     * @param  User  $user  The authenticated user pulling data
     * @param  string  $deviceId  The unique device identifier
     * @param  Carbon|null  $since  Timestamp of last successful sync (null = full sync)
     * @return array{observations: Collection, projects: array, clients: array, records_pulled: int, sync_event_id: int}
     */
    public static function pull(User $user, string $deviceId, ?Carbon $since = null): array
    {
        // Create sync event record
        $syncEvent = FieldSyncEvent::create([
            'device_id' => $deviceId,
            'user_id' => $user->id,
            'sync_type' => 'pull',
            'status' => 'started',
            'records_pushed' => 0,
            'records_pulled' => 0,
            'records_conflicted' => 0,
            'device_timestamp' => now(),
            'started_at' => now(),
            'organization_id' => $user->organization_id,
            'metadata' => [
                'since' => $since?->toIso8601String(),
            ],
        ]);

        try {
            // Get the user's assigned project IDs
            $projectIds = \App\Models\SurveyProject::where('assigned_surveyor_user_id', $user->id)
                ->pluck('id');

            // Pull observations modified since the given timestamp
            $observationQuery = FieldObservation::whereIn('survey_project_id', $projectIds)
                ->with(['surveyProject', 'recordedBy']);

            if ($since) {
                $observationQuery->where('updated_at', '>', $since);
            }

            $observations = $observationQuery->orderBy('updated_at', 'asc')
                ->limit(500)
                ->get();

            // Pull project summaries
            $projectsQuery = \App\Models\SurveyProject::where('assigned_surveyor_user_id', $user->id)
                ->with(['client', 'progress']);

            if ($since) {
                $projectsQuery->where('updated_at', '>', $since);
            }

            $projects = $projectsQuery->get()->map(fn ($project) => [
                'id' => $project->id,
                'project_number' => $project->project_number,
                'project_type' => $project->project_type,
                'status' => $project->status,
                'district' => $project->district,
                'location_description' => $project->location_description,
                'area_hectares' => $project->area_hectares ? (float) $project->area_hectares : null,
                'updated_at' => $project->updated_at?->toIso8601String(),
            ]);

            // Pull client summaries (from assigned projects)
            $clientIds = \App\Models\SurveyProject::where('assigned_surveyor_user_id', $user->id)
                ->pluck('client_id')
                ->unique()
                ->filter();

            $clientsQuery = \App\Models\Client::whereIn('id', $clientIds);

            if ($since) {
                $clientsQuery->where('updated_at', '>', $since);
            }

            $clients = $clientsQuery->get()->map(fn ($client) => [
                'id' => $client->id,
                'client_number' => $client->client_number,
                'full_name' => $client->full_name,
                'phone' => $client->phone,
                'district' => $client->district,
                'lc1_area' => $client->lc1_area,
                'updated_at' => $client->updated_at?->toIso8601String(),
            ]);

            $totalPulled = $observations->count() + $projects->count() + $clients->count();

            $syncEvent->markCompleted(
                pushed: 0,
                pulled: $totalPulled
            );

            return [
                'observations' => $observations,
                'projects' => $projects,
                'clients' => $clients,
                'records_pulled' => $totalPulled,
                'sync_event_id' => $syncEvent->id,
            ];
        } catch (\Exception $e) {
            $syncEvent->markFailed($e->getMessage());

            return [
                'observations' => new Collection(),
                'projects' => [],
                'clients' => [],
                'records_pulled' => 0,
                'sync_event_id' => $syncEvent->id,
            ];
        }
    }

    /**
     * Get sync status for a specific device.
     *
     * Returns the last sync timestamp, number of pending records,
     * and number of conflicted records for the given device.
     *
     * @param  User  $user  The authenticated user
     * @param  string  $deviceId  The unique device identifier
     * @return array{last_sync_at: string|null, pending_count: int, conflict_count: int, last_sync_event: array|null}
     */
    public static function getStatus(User $user, string $deviceId): array
    {
        // Find the last completed sync event for this device
        $lastSync = FieldSyncEvent::forDevice($deviceId)
            ->forUser($user->id)
            ->whereIn('status', ['completed', 'conflict'])
            ->orderBy('completed_at', 'desc')
            ->first();

        // Count pending observations for this user
        $pendingCount = FieldObservation::byUser($user->id)
            ->pendingSync()
            ->count();

        // Count conflicted observations for this user
        $conflictCount = FieldObservation::byUser($user->id)
            ->conflicted()
            ->count();

        return [
            'last_sync_at' => $lastSync?->completed_at?->toIso8601String(),
            'pending_count' => $pendingCount,
            'conflict_count' => $conflictCount,
            'last_sync_event' => $lastSync ? [
                'id' => $lastSync->id,
                'sync_type' => $lastSync->sync_type,
                'status' => $lastSync->status,
                'records_pushed' => $lastSync->records_pushed,
                'records_pulled' => $lastSync->records_pulled,
                'records_conflicted' => $lastSync->records_conflicted,
                'started_at' => $lastSync->started_at?->toIso8601String(),
                'completed_at' => $lastSync->completed_at?->toIso8601String(),
            ] : null,
        ];
    }

    /**
     * Resolve a sync conflict with a specified resolution strategy.
     *
     * Applies the given conflict resolution strategy:
     * - server_wins: Keep the server version, discard client changes
     * - client_wins: Apply the client version over the server version
     * - merged: Apply the provided merged data
     *
     * @param  FieldObservation  $observation  The conflicted observation
     * @param  string  $resolution  The resolution strategy (server_wins|client_wins|merged)
     * @param  array|null  $mergedData  Merged observation data (required if resolution is 'merged')
     * @return FieldObservation The resolved observation
     */
    public static function resolveConflict(FieldObservation $observation, string $resolution, ?array $mergedData = null): FieldObservation
    {
        return DB::transaction(function () use ($observation, $resolution, $mergedData) {
            switch ($resolution) {
                case 'server_wins':
                    // Keep server version, mark as synced
                    $observation->update([
                        'sync_status' => 'synced',
                        'synced_at' => now(),
                        'conflict_resolution' => 'server_wins',
                    ]);
                    break;

                case 'client_wins':
                    // The client data was already applied during push (as it's the latest),
                    // just mark the conflict as resolved
                    $observation->update([
                        'sync_status' => 'synced',
                        'synced_at' => now(),
                        'conflict_resolution' => 'client_wins',
                    ]);
                    break;

                case 'merged':
                    // Apply the merged data
                    $updateData = array_merge([
                        'sync_status' => 'synced',
                        'synced_at' => now(),
                        'conflict_resolution' => 'merged',
                    ], $mergedData ?? []);

                    $observation->update($updateData);
                    break;
            }

            // Record domain event for the conflict resolution
            EventStore::record(
                eventType: 'field_observation.conflict_resolved',
                aggregate: $observation,
                payload: [
                    'resolution' => $resolution,
                    'has_merged_data' => $mergedData !== null,
                ],
                causer: auth()->user()
            );

            return $observation->fresh();
        });
    }

    /**
     * Detect conflicts between incoming and existing data.
     *
     * A conflict exists when an incoming observation has the same UUID as
     * an existing observation but the server version has been updated more
     * recently than the device's last sync.
     *
     * @param  array  $incoming  The incoming observation data from the device
     * @param  Collection  $existing  Existing observations with matching UUIDs
     * @return array Array of conflict details
     */
    protected static function detectConflicts(array $incoming, Collection $existing): array
    {
        $conflicts = [];
        $existingByUuid = $existing->keyBy('uuid');

        foreach ($incoming as $observationData) {
            $uuid = $observationData['uuid'] ?? null;

            if (! $uuid) {
                continue;
            }

            $existingObs = $existingByUuid->get($uuid);

            if (! $existingObs) {
                continue;
            }

            // If the existing observation has been updated after it was last synced,
            // and the incoming data is from an offline creation, there's a conflict
            if ($existingObs->sync_status === 'synced' && $existingObs->updated_at > $existingObs->synced_at) {
                $conflicts[] = [
                    'uuid' => $uuid,
                    'reason' => 'server_modified_after_sync',
                    'server_updated_at' => $existingObs->updated_at?->toIso8601String(),
                    'server_synced_at' => $existingObs->synced_at?->toIso8601String(),
                ];
            }

            // If the existing observation is already in conflict status
            if ($existingObs->sync_status === 'conflict') {
                $conflicts[] = [
                    'uuid' => $uuid,
                    'reason' => 'existing_conflict',
                    'existing_resolution' => $existingObs->conflict_resolution,
                ];
            }
        }

        return $conflicts;
    }

    /**
     * Create or update an observation from sync data.
     *
     * If an observation with the same UUID exists, updates it if the incoming
     * data is newer. If no matching UUID exists, creates a new observation.
     * Handles offline creation flags and conflict detection.
     *
     * @param  array  $data  The observation data from the device
     * @param  User  $user  The authenticated user
     * @return FieldObservation The created or updated observation
     */
    protected static function upsertObservation(array $data, User $user): FieldObservation
    {
        $uuid = $data['uuid'] ?? (string) Str::uuid();

        // Try to find existing observation by UUID
        $existing = FieldObservation::where('uuid', $uuid)->first();

        if ($existing) {
            // Check for conflict: if the server record was modified after it was synced
            if ($existing->synced_at && $existing->updated_at > $existing->synced_at) {
                // Mark as conflict — both server and client have changes
                $existing->markConflicted('pending');

                return $existing;
            }

            // Update existing observation with device data
            $existing->update([
                'observation_type' => $data['observation_type'] ?? $existing->observation_type,
                'title' => $data['title'] ?? $existing->title,
                'description' => $data['description'] ?? $existing->description,
                'geometry' => $data['geometry'] ?? $existing->geometry,
                'latitude' => $data['latitude'] ?? $existing->latitude,
                'longitude' => $data['longitude'] ?? $existing->longitude,
                'accuracy_meters' => $data['accuracy_meters'] ?? $existing->accuracy_meters,
                'altitude_meters' => $data['altitude_meters'] ?? $existing->altitude_meters,
                'observation_data' => $data['observation_data'] ?? $existing->observation_data,
                'media_paths' => $data['media_paths'] ?? $existing->media_paths,
                'observed_at' => $data['observed_at'] ?? $existing->observed_at?->toIso8601String(),
                'is_offline_creation' => $data['is_offline_creation'] ?? $existing->is_offline_creation,
                'sync_status' => 'synced',
                'synced_at' => now(),
            ]);

            return $existing;
        }

        // Create new observation
        return FieldObservation::create([
            'uuid' => $uuid,
            'survey_project_id' => $data['survey_project_id'],
            'observation_type' => $data['observation_type'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'geometry' => $data['geometry'] ?? null,
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'accuracy_meters' => $data['accuracy_meters'] ?? null,
            'altitude_meters' => $data['altitude_meters'] ?? null,
            'observation_data' => $data['observation_data'] ?? null,
            'media_paths' => $data['media_paths'] ?? null,
            'observed_at' => $data['observed_at'],
            'is_offline_creation' => $data['is_offline_creation'] ?? true,
            'sync_status' => 'synced',
            'synced_at' => now(),
            'recorded_by_user_id' => $user->id,
            'organization_id' => $user->organization_id,
            'branch_id' => $user->branch_id,
        ]);
    }
}
