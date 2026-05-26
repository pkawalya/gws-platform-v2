<?php

namespace App\Models;

use App\Traits\RecordsDomainEvents;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * FieldSyncEvent — Tracks a sync operation between a mobile device and the server.
 *
 * Every time a field surveyor pushes or pulls data, a FieldSyncEvent is created
 * to record the operation's details: which device, how many records were
 * transferred, whether any conflicts arose, and the final status.
 *
 * @property int         $id
 * @property string      $device_id
 * @property int         $user_id
 * @property string      $sync_type
 * @property string      $status
 * @property int         $records_pushed
 * @property int         $records_pulled
 * @property int         $records_conflicted
 * @property array|null  $conflicts
 * @property \Carbon\Carbon $device_timestamp
 * @property \Carbon\Carbon $started_at
 * @property \Carbon\Carbon|null $completed_at
 * @property string|null $error_message
 * @property array|null  $metadata
 * @property int|null    $organization_id
 */
class FieldSyncEvent extends Model
{
    use RecordsDomainEvents;

    /**
     * Valid sync types.
     */
    public const SYNC_TYPES = [
        'push',
        'pull',
        'full',
    ];

    /**
     * Valid statuses.
     */
    public const STATUSES = [
        'started',
        'completed',
        'failed',
        'conflict',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'device_id',
        'user_id',
        'sync_type',
        'status',
        'records_pushed',
        'records_pulled',
        'records_conflicted',
        'conflicts',
        'device_timestamp',
        'started_at',
        'completed_at',
        'error_message',
        'metadata',
        'organization_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'records_pushed' => 'integer',
        'records_pulled' => 'integer',
        'records_conflicted' => 'integer',
        'conflicts' => 'array',
        'device_timestamp' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'metadata' => 'array',
    ];

    // --------------------------------------------------------------------------
    // Relationships
    // --------------------------------------------------------------------------

    /**
     * The user who initiated this sync event.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The organization this sync event belongs to.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    // --------------------------------------------------------------------------
    // Scopes
    // --------------------------------------------------------------------------

    /**
     * Scope: filter by device ID.
     */
    public function scopeForDevice(Builder $query, string $deviceId): Builder
    {
        return $query->where('device_id', $deviceId);
    }

    /**
     * Scope: filter by user.
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: filter by sync type.
     */
    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('sync_type', $type);
    }

    /**
     * Scope: filter by status.
     */
    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: get the most recent sync events.
     */
    public function scopeRecent(Builder $query, int $limit = 50): Builder
    {
        return $query->orderBy('started_at', 'desc')->limit($limit);
    }

    // --------------------------------------------------------------------------
    // Business Logic
    // --------------------------------------------------------------------------

    /**
     * Mark this sync event as completed with the given record counts.
     *
     * @param  int  $pushed  Number of records pushed to the server
     * @param  int  $pulled  Number of records pulled from the server
     * @param  int  $conflicted  Number of records that had conflicts
     */
    public function markCompleted(int $pushed, int $pulled, int $conflicted = 0): void
    {
        $status = $conflicted > 0 ? 'conflict' : 'completed';

        $this->update([
            'status' => $status,
            'records_pushed' => $pushed,
            'records_pulled' => $pulled,
            'records_conflicted' => $conflicted,
            'completed_at' => now(),
        ]);
    }

    /**
     * Mark this sync event as failed with the given error message.
     *
     * @param  string  $error  The error message describing the failure
     */
    public function markFailed(string $error): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $error,
            'completed_at' => now(),
        ]);
    }

    /**
     * Convert this sync event to a payload for the mobile app.
     *
     * @return array<string, mixed>
     */
    public function toSyncPayload(): array
    {
        return [
            'id' => $this->id,
            'device_id' => $this->device_id,
            'sync_type' => $this->sync_type,
            'status' => $this->status,
            'records_pushed' => $this->records_pushed,
            'records_pulled' => $this->records_pulled,
            'records_conflicted' => $this->records_conflicted,
            'conflicts' => $this->conflicts,
            'started_at' => $this->started_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'error_message' => $this->error_message,
        ];
    }
}
