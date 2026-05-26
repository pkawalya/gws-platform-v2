<?php

namespace App\Models;

use App\Traits\RecordsDomainEvents;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * SpatialLayer — A configurable map overlay layer in the GWS Platform.
 *
 * Each layer represents a distinct set of geographic data that can be
 * toggled on/off in the map UI. Layers may be sourced from uploaded GeoJSON,
 * OpenStreetMap, WMS endpoints, or external APIs.
 *
 * Usage:
 *   SpatialLayer::active()->visibleByDefault()->ordered()->get();
 *   $layer->toLeafletConfig();
 *
 * @property int         $id
 * @property string      $name
 * @property string      $slug
 * @property string      $layer_type
 * @property string      $source_type
 * @property array|null  $source_config
 * @property array|null  $geojson_data
 * @property array|null  $style_config
 * @property bool        $is_visible_by_default
 * @property int|null    $min_zoom
 * @property int|null    $max_zoom
 * @property int         $display_order
 * @property int|null    $organization_id
 * @property bool        $is_active
 */
class SpatialLayer extends Model
{
    use RecordsDomainEvents;

    /**
     * Valid layer types.
     */
    public const LAYER_TYPES = ['boundary', 'parcel', 'infrastructure', 'annotation', 'overlay'];

    /**
     * Valid source types.
     */
    public const SOURCE_TYPES = ['upload', 'osm', 'wms', 'api'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'layer_type',
        'source_type',
        'source_config',
        'geojson_data',
        'style_config',
        'is_visible_by_default',
        'min_zoom',
        'max_zoom',
        'display_order',
        'organization_id',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'source_config' => 'array',
        'geojson_data' => 'array',
        'style_config' => 'array',
        'is_visible_by_default' => 'boolean',
        'min_zoom' => 'integer',
        'max_zoom' => 'integer',
        'display_order' => 'integer',
        'is_active' => 'boolean',
    ];

    // --------------------------------------------------------------------------
    // Boot
    // --------------------------------------------------------------------------

    /**
     * Auto-generate slug from name when creating a new spatial layer.
     */
    protected static function booted(): void
    {
        static::creating(function (self $layer) {
            if (empty($layer->slug)) {
                $layer->slug = static::generateUniqueSlug($layer->name);
            }
        });
    }

    // --------------------------------------------------------------------------
    // Relationships
    // --------------------------------------------------------------------------

    /**
     * The organization this layer belongs to.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    // --------------------------------------------------------------------------
    // Scopes
    // --------------------------------------------------------------------------

    /**
     * Scope: only active layers.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: only layers visible by default.
     */
    public function scopeVisibleByDefault(Builder $query): Builder
    {
        return $query->where('is_visible_by_default', true);
    }

    /**
     * Scope: filter layers by type.
     */
    public function scopeForType(Builder $query, string $type): Builder
    {
        return $query->where('layer_type', $type);
    }

    /**
     * Scope: order layers by display_order then name.
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('display_order')->orderBy('name');
    }

    // --------------------------------------------------------------------------
    // Methods
    // --------------------------------------------------------------------------

    /**
     * Get the default style merged with any custom style_config.
     *
     * Returns a complete Leaflet style array with sensible defaults
     * for the layer's type, overridden by any user-specified style.
     *
     * @return array<string, mixed>
     */
    public function getDefaultStyle(): array
    {
        $defaultsByType = [
            'boundary' => [
                'color' => '#f59e0b',
                'weight' => 2,
                'opacity' => 0.8,
                'fillColor' => '#f59e0b',
                'fillOpacity' => 0.1,
                'dashArray' => '5, 5',
            ],
            'parcel' => [
                'color' => '#10b981',
                'weight' => 2,
                'opacity' => 0.9,
                'fillColor' => '#10b981',
                'fillOpacity' => 0.15,
            ],
            'infrastructure' => [
                'color' => '#6366f1',
                'weight' => 3,
                'opacity' => 0.9,
                'fillColor' => '#6366f1',
                'fillOpacity' => 0.1,
            ],
            'annotation' => [
                'color' => '#ef4444',
                'weight' => 2,
                'opacity' => 0.8,
                'fillColor' => '#ef4444',
                'fillOpacity' => 0.2,
            ],
            'overlay' => [
                'color' => '#8b5cf6',
                'weight' => 2,
                'opacity' => 0.7,
                'fillColor' => '#8b5cf6',
                'fillOpacity' => 0.1,
            ],
        ];

        $defaults = $defaultsByType[$this->layer_type] ?? $defaultsByType['overlay'];

        return array_merge($defaults, $this->style_config ?? []);
    }

    /**
     * Convert the layer to a Leaflet-compatible configuration array for JS consumption.
     *
     * @return array<string, mixed>
     */
    public function toLeafletConfig(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'layerType' => $this->layer_type,
            'sourceType' => $this->source_type,
            'sourceConfig' => $this->source_config,
            'geojsonData' => $this->geojson_data,
            'style' => $this->getDefaultStyle(),
            'isVisibleByDefault' => $this->is_visible_by_default,
            'minZoom' => $this->min_zoom,
            'maxZoom' => $this->max_zoom,
            'displayOrder' => $this->display_order,
        ];
    }

    /**
     * Generate a unique slug from the given name.
     *
     * On collision, appends a numeric suffix: "uganda-districts-2", etc.
     */
    public static function generateUniqueSlug(string $name): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 2;

        while (static::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
