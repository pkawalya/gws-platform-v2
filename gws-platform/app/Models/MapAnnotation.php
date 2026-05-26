<?php

namespace App\Models;

use App\Traits\RecordsDomainEvents;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * MapAnnotation — A geographic annotation on the map (marker, polygon, polyline, circle).
 *
 * Annotations can be linked to any entity (SurveyProject, Client, etc.) via
 * polymorphic relationships, or exist independently. They store GeoJSON geometry
 * and derive latitude/longitude from Point geometries for quick SQLite queries.
 *
 * Usage:
 *   MapAnnotation::public()->nearPoint(1.3733, 32.2903, 10)->get();
 *   $annotation->toGeoJSON();
 *
 * @property int         $id
 * @property string      $annotation_type
 * @property string|null $entity_type
 * @property int|null    $entity_id
 * @property string      $title
 * @property string|null $description
 * @property array       $geometry
 * @property array|null  $style
 * @property float|null  $latitude
 * @property float|null  $longitude
 * @property bool        $is_public
 * @property int|null    $created_by_user_id
 * @property int|null    $organization_id
 */
class MapAnnotation extends Model
{
    use RecordsDomainEvents;

    /**
     * Valid annotation types.
     */
    public const ANNOTATION_TYPES = ['marker', 'polygon', 'polyline', 'circle'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'annotation_type',
        'entity_type',
        'entity_id',
        'title',
        'description',
        'geometry',
        'style',
        'latitude',
        'longitude',
        'is_public',
        'created_by_user_id',
        'organization_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'geometry' => 'array',
        'style' => 'array',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'is_public' => 'boolean',
    ];

    // --------------------------------------------------------------------------
    // Boot
    // --------------------------------------------------------------------------

    /**
     * Auto-extract latitude/longitude from geometry Point on saving.
     *
     * When the geometry is a Point type, the coordinates [lng, lat] are
     * extracted into the dedicated latitude/longitude columns for
     * efficient querying without PostGIS.
     */
    protected static function booted(): void
    {
        static::saving(function (self $annotation) {
            $geometry = $annotation->geometry;

            if (is_array($geometry) && ($geometry['type'] ?? null) === 'Point') {
                $coordinates = $geometry['coordinates'] ?? [];
                if (count($coordinates) >= 2) {
                    $annotation->longitude = $coordinates[0];
                    $annotation->latitude = $coordinates[1];
                }
            }
        });
    }

    // --------------------------------------------------------------------------
    // Relationships
    // --------------------------------------------------------------------------

    /**
     * The entity this annotation belongs to (polymorphic).
     */
    public function entity(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * The user who created this annotation.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * The organization this annotation belongs to.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    // --------------------------------------------------------------------------
    // Scopes
    // --------------------------------------------------------------------------

    /**
     * Scope: only public annotations.
     */
    public function scopePublic(Builder $query): Builder
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope: annotations for a specific entity.
     */
    public function scopeForEntity(Builder $query, string $type, int $id): Builder
    {
        return $query->where('entity_type', $type)->where('entity_id', $id);
    }

    /**
     * Scope: annotations near a given point within a radius (km).
     *
     * Uses a simple bounding-box filter for SQLite compatibility.
     * For more precise results with PostGIS, use ST_DWithin in production.
     */
    public function scopeNearPoint(Builder $query, float $lat, float $lng, float $radiusKm = 10): Builder
    {
        // Approximate degree offsets for the bounding box
        $latDelta = $radiusKm / 111.0;
        $lngDelta = $radiusKm / (111.0 * cos(deg2rad($lat)));

        return $query
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->whereBetween('latitude', [$lat - $latDelta, $lat + $latDelta])
            ->whereBetween('longitude', [$lng - $lngDelta, $lng + $lngDelta]);
    }

    /**
     * Scope: filter by annotation type.
     */
    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('annotation_type', $type);
    }

    // --------------------------------------------------------------------------
    // Methods
    // --------------------------------------------------------------------------

    /**
     * Convert this annotation to a GeoJSON Feature array.
     *
     * @return array<string, mixed>
     */
    public function toGeoJSON(): array
    {
        return [
            'type' => 'Feature',
            'id' => $this->id,
            'geometry' => $this->geometry,
            'properties' => [
                'title' => $this->title,
                'description' => $this->description,
                'annotationType' => $this->annotation_type,
                'entityType' => $this->entity_type,
                'entityId' => $this->entity_id,
                'isPublic' => $this->is_public,
                'style' => $this->style,
            ],
        ];
    }

    /**
     * Convert this annotation to a Leaflet marker configuration array.
     *
     * @return array<string, mixed>
     */
    public function toLeafletMarker(): array
    {
        $config = [
            'id' => $this->id,
            'annotationType' => $this->annotation_type,
            'title' => $this->title,
            'description' => $this->description,
            'geometry' => $this->geometry,
        ];

        if ($this->annotation_type === 'marker' && $this->latitude && $this->longitude) {
            $config['latlng'] = [$this->latitude, $this->longitude];
        }

        // Merge custom style overrides if present
        if ($this->style) {
            $config['style'] = $this->style;
        }

        return $config;
    }
}
