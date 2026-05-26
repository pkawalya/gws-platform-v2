<?php

namespace App\Models;

use App\Traits\RecordsDomainEvents;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * FieldObservation — A geospatial observation recorded by a field surveyor.
 *
 * Each observation captures a specific field data point (boundary marker,
 * landmark, photo, note, measurement, or sketch) tied to a survey project.
 * Observations support offline-first sync via UUID and sync_status tracking.
 *
 * @property int         $id
 * @property string      $uuid
 * @property int         $survey_project_id
 * @property string      $observation_type
 * @property string      $title
 * @property string|null $description
 * @property array|null  $geometry
 * @property float|null  $latitude
 * @property float|null  $longitude
 * @property float|null  $accuracy_meters
 * @property float|null  $altitude_meters
 * @property array|null  $observation_data
 * @property array|null  $media_paths
 * @property \Carbon\Carbon $observed_at
 * @property bool        $is_offline_creation
 * @property string      $sync_status
 * @property \Carbon\Carbon|null $synced_at
 * @property string|null $conflict_resolution
 * @property int         $recorded_by_user_id
 * @property int|null    $organization_id
 * @property int|null    $branch_id
 */
class FieldObservation extends Model
{
    use RecordsDomainEvents, SoftDeletes;

    /**
     * Valid observation types.
     */
    public const OBSERVATION_TYPES = [
        'boundary_point',
        'landmark',
        'photo',
        'video',
        'note',
        'measurement',
        'sketch',
    ];

    /**
     * Valid sync statuses.
     */
    public const SYNC_STATUSES = [
        'pending',
        'synced',
        'conflict',
    ];

    /**
     * Valid conflict resolution strategies.
     */
    public const CONFLICT_RESOLUTIONS = [
        'server_wins',
        'client_wins',
        'merged',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'survey_project_id',
        'observation_type',
        'title',
        'description',
        'geometry',
        'latitude',
        'longitude',
        'accuracy_meters',
        'altitude_meters',
        'observation_data',
        'media_paths',
        'observed_at',
        'is_offline_creation',
        'sync_status',
        'synced_at',
        'conflict_resolution',
        'recorded_by_user_id',
        'organization_id',
        'branch_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'geometry' => 'array',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'accuracy_meters' => 'decimal:2',
        'altitude_meters' => 'decimal:2',
        'observation_data' => 'array',
        'media_paths' => 'array',
        'observed_at' => 'datetime',
        'is_offline_creation' => 'boolean',
        'synced_at' => 'datetime',
    ];

    // --------------------------------------------------------------------------
    // Boot
    // --------------------------------------------------------------------------

    /**
     * The "booted" method of the model.
     *
     * Auto-generates a UUID on creation and extracts lat/lng from geometry
     * if present but lat/lng are not explicitly set.
     */
    protected static function booted(): void
    {
        static::creating(function (self $observation) {
            if (empty($observation->uuid)) {
                $observation->uuid = (string) Str::uuid();
            }

            // Extract lat/lng from geometry if not explicitly set
            if ($observation->geometry && empty($observation->latitude) && empty($observation->longitude)) {
                $geometry = is_array($observation->geometry)
                    ? $observation->geometry
                    : json_decode($observation->geometry, true);

                if (isset($geometry['type']) && $geometry['type'] === 'Point' && isset($geometry['coordinates'])) {
                    $observation->longitude = $geometry['coordinates'][0];
                    $observation->latitude = $geometry['coordinates'][1];
                }
            }
        });
    }

    // --------------------------------------------------------------------------
    // Relationships
    // --------------------------------------------------------------------------

    /**
     * The survey project this observation belongs to.
     */
    public function surveyProject(): BelongsTo
    {
        return $this->belongsTo(SurveyProject::class);
    }

    /**
     * The user who recorded this observation.
     */
    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by_user_id');
    }

    /**
     * The organization this observation belongs to.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * The branch this observation belongs to.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    // --------------------------------------------------------------------------
    // Scopes
    // --------------------------------------------------------------------------

    /**
     * Scope: only observations with pending sync status.
     */
    public function scopePendingSync(Builder $query): Builder
    {
        return $query->where('sync_status', 'pending');
    }

    /**
     * Scope: only observations with conflict sync status.
     */
    public function scopeConflicted(Builder $query): Builder
    {
        return $query->where('sync_status', 'conflict');
    }

    /**
     * Scope: filter by observation type.
     */
    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('observation_type', $type);
    }

    /**
     * Scope: filter by survey project.
     */
    public function scopeForProject(Builder $query, int $projectId): Builder
    {
        return $query->where('survey_project_id', $projectId);
    }

    /**
     * Scope: find observations near a given point within a radius.
     *
     * Uses the Haversine formula for approximate distance calculation.
     *
     * @param  float  $lat  Latitude of the center point
     * @param  float  $lng  Longitude of the center point
     * @param  float  $radiusKm  Search radius in kilometers (default 5km)
     */
    public function scopeNearPoint(Builder $query, float $lat, float $lng, float $radiusKm = 5.0): Builder
    {
        // Haversine formula for approximate distance in km
        $haversine = "(6371 * acos(cos(radians({$lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians({$lng})) + sin(radians({$lat})) * sin(radians(latitude))))";

        return $query
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->whereRaw("{$haversine} <= ?", [$radiusKm]);
    }

    /**
     * Scope: filter by the user who recorded the observation.
     */
    public function scopeByUser(Builder $query, int $userId): Builder
    {
        return $query->where('recorded_by_user_id', $userId);
    }

    // --------------------------------------------------------------------------
    // Business Logic
    // --------------------------------------------------------------------------

    /**
     * Mark this observation as synced.
     *
     * Sets the sync_status to 'synced' and records the synced_at timestamp.
     */
    public function markSynced(): void
    {
        $this->update([
            'sync_status' => 'synced',
            'synced_at' => now(),
        ]);
    }

    /**
     * Mark this observation as conflicted with a specified resolution strategy.
     *
     * @param  string  $resolution  The conflict resolution strategy (server_wins|client_wins|merged)
     */
    public function markConflicted(string $resolution): void
    {
        $this->update([
            'sync_status' => 'conflict',
            'conflict_resolution' => $resolution,
        ]);
    }

    /**
     * Convert this observation to a GeoJSON Feature.
     *
     * Returns a GeoJSON Feature with the observation's geometry (or a Point
     * constructed from latitude/longitude) and all observation properties.
     *
     * @return array<string, mixed>
     */
    public function toGeoJSON(): array
    {
        $geometry = $this->geometry;

        // Fallback to lat/lng Point if no geometry is stored
        if (empty($geometry) && $this->latitude && $this->longitude) {
            $geometry = [
                'type' => 'Point',
                'coordinates' => [(float) $this->longitude, (float) $this->latitude],
            ];
        }

        return [
            'type' => 'Feature',
            'id' => $this->uuid,
            'geometry' => $geometry,
            'properties' => [
                'observation_id' => $this->id,
                'observation_type' => $this->observation_type,
                'title' => $this->title,
                'description' => $this->description,
                'observed_at' => $this->observed_at?->toIso8601String(),
                'accuracy_meters' => $this->accuracy_meters,
                'altitude_meters' => $this->altitude_meters,
                'sync_status' => $this->sync_status,
                'is_offline_creation' => $this->is_offline_creation,
                'recorded_by' => $this->recordedBy?->name,
                'project_id' => $this->survey_project_id,
            ],
        ];
    }

    /**
     * Convert this observation to a sync payload for the mobile app.
     *
     * Includes all fields needed for offline sync, including the UUID
     * which serves as the offline identifier.
     *
     * @return array<string, mixed>
     */
    public function toSyncPayload(): array
    {
        return [
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
            'recorded_by_user_id' => $this->recorded_by_user_id,
            'updated_at' => $this->updated_at?->toIso8601String(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
