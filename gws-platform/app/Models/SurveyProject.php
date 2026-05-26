<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class SurveyProject extends Model
{
    use RecordsDomainEvents;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'project_number',
        'project_type',
        'client_id',
        'description',
        'district',
        'location_description',
        'status',
        'assigned_surveyor_user_id',
        'inquiry_date',
        'start_date',
        'completion_date',
        'area_hectares',
        'srid',
        'geojson_data',
        'last_georef_update',
        'organization_id',
        'branch_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'inquiry_date' => 'date',
        'start_date' => 'date',
        'completion_date' => 'date',
        'area_hectares' => 'decimal:4',
        'srid' => 'integer',
        'geojson_data' => 'array',
        'last_georef_update' => 'datetime',
    ];

    // --------------------------------------------------------------------------
    // Relationships
    // --------------------------------------------------------------------------

    /**
     * The client who owns this survey project.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * The surveyor (user) assigned to this project.
     */
    public function assignedSurveyor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_surveyor_user_id');
    }

    /**
     * The organization this project belongs to.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * The branch this project belongs to.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * The progress record for this survey project.
     */
    public function progress(): HasOne
    {
        return $this->hasOne(ClientProjectProgress::class);
    }

    /**
     * The field observations associated with this project.
     */
    public function fieldObservations(): HasMany
    {
        return $this->hasMany(FieldObservation::class);
    }

    /**
     * The map annotations associated with this project.
     */
    public function annotations(): MorphMany
    {
        return $this->morphMany(MapAnnotation::class, 'entity');
    }

    // --------------------------------------------------------------------------
    // Spatial Methods
    // --------------------------------------------------------------------------

    /**
     * Check if this project has spatial data available.
     *
     * Returns true if the project has cached GeoJSON data or a centroid
     * geometry column populated (PostGIS production).
     */
    public function hasSpatialData(): bool
    {
        return !empty($this->geojson_data);
    }

    /**
     * Convert this project to a GeoJSON Feature array.
     *
     * Returns a complete GeoJSON Feature with the project's spatial
     * geometry and descriptive properties.
     *
     * @return array<string, mixed>
     */
    public function toGeoJSONFeature(): array
    {
        $geojson = $this->geojson_data;

        // If geojson_data contains a full Feature, use it
        if (is_array($geojson) && isset($geojson['type']) && $geojson['type'] === 'Feature') {
            $geojson['properties'] = array_merge($geojson['properties'] ?? [], $this->getGeoJSONProperties());

            return $geojson;
        }

        // If geojson_data contains just a geometry, wrap it in a Feature
        if (is_array($geojson) && isset($geojson['type'])) {
            return [
                'type' => 'Feature',
                'geometry' => $geojson,
                'properties' => $this->getGeoJSONProperties(),
            ];
        }

        // Fallback: create a Point geometry from center coordinates
        $center = $this->getCenterCoordinates();

        if ($center) {
            return [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [$center[1], $center[0]], // [lng, lat] for GeoJSON
                ],
                'properties' => $this->getGeoJSONProperties(),
            ];
        }

        // No spatial data at all
        return [
            'type' => 'Feature',
            'geometry' => null,
            'properties' => $this->getGeoJSONProperties(),
        ];
    }

    /**
     * Get the center coordinates [lat, lng] for this project.
     *
     * Attempts to extract center from geojson_data first, then falls back
     * to a district-based lookup for known Uganda districts.
     *
     * @return array{0: float, 1: float}|null
     */
    public function getCenterCoordinates(): ?array
    {
        // Try extracting from geojson_data
        if (is_array($this->geojson_data)) {
            // If it's a Feature with Point geometry
            if (($this->geojson_data['type'] ?? null) === 'Feature') {
                $geometry = $this->geojson_data['geometry'] ?? null;
                if ($geometry && ($geometry['type'] ?? null) === 'Point') {
                    $coords = $geometry['coordinates'] ?? [];

                    return count($coords) >= 2 ? [$coords[1], $coords[0]] : null;
                }
                // For Polygon/MultiPolygon, compute centroid from first ring
                if ($geometry && in_array($geometry['type'] ?? '', ['Polygon', 'MultiPolygon'])) {
                    $ring = $geometry['type'] === 'MultiPolygon'
                        ? ($geometry['coordinates'][0][0] ?? [])
                        : ($geometry['coordinates'][0] ?? []);

                    if (count($ring) >= 3) {
                        $lngSum = 0;
                        $latSum = 0;
                        foreach ($ring as $coord) {
                            $lngSum += $coord[0];
                            $latSum += $coord[1];
                        }

                        return [$latSum / count($ring), $lngSum / count($ring)];
                    }
                }
            }

            // If it's just a Point geometry
            if (($this->geojson_data['type'] ?? null) === 'Point') {
                $coords = $this->geojson_data['coordinates'] ?? [];

                return count($coords) >= 2 ? [$coords[1], $coords[0]] : null;
            }
        }

        // Fall back to district lookup
        if ($this->district) {
            return static::getDistrictCenter($this->district);
        }

        return null;
    }

    /**
     * Update spatial data for this project.
     *
     * Updates the cached GeoJSON and records the timestamp of the update.
     *
     * @param  array<string, mixed>  $geojson
     */
    public function updateSpatialData(array $geojson): void
    {
        $this->update([
            'geojson_data' => $geojson,
            'last_georef_update' => now(),
        ]);
    }

    // --------------------------------------------------------------------------
    // Helpers
    // --------------------------------------------------------------------------

    /**
     * Get the properties array for GeoJSON Feature output.
     *
     * @return array<string, mixed>
     */
    protected function getGeoJSONProperties(): array
    {
        return [
            'id' => $this->id,
            'projectNumber' => $this->project_number,
            'projectType' => $this->project_type,
            'status' => $this->status,
            'district' => $this->district,
            'locationDescription' => $this->location_description,
            'areaHectares' => $this->area_hectares ? (float) $this->area_hectares : null,
            'clientId' => $this->client_id,
            'clientName' => $this->client?->full_name,
            'progress' => $this->progress?->progress_percentage ?? 0,
        ];
    }

    /**
     * Get approximate center coordinates for known Uganda districts.
     *
     * This serves as a fallback when no precise spatial data is available.
     * Coordinates are [lat, lng] pairs for major Ugandan districts.
     *
     * @return array{0: float, 1: float}|null
     */
    public static function getDistrictCenter(string $district): ?array
    {
        $districtCenters = [
            'kampala' => [0.3476, 32.5825],
            'wakiso' => [0.4044, 32.4594],
            'mukono' => [0.3560, 32.7517],
            'jinja' => [0.4240, 33.2037],
            'entebbe' => [0.0633, 32.4467],
            'mbarara' => [-0.6083, 30.6544],
            'gulu' => [2.7744, 32.2990],
            'lira' => [2.2499, 32.8999],
            'soroti' => [1.7150, 33.6112],
            'arua' => [3.0201, 30.9110],
            'fort portal' => [0.6712, 30.2750],
            'masaka' => [-0.3361, 31.7400],
            'hoima' => [1.4333, 31.3500],
            'kabale' => [-1.2486, 29.9859],
            'mbale' => [1.0833, 34.1667],
            'kasese' => [0.1833, 30.0833],
            'masindi' => [1.6744, 31.7150],
            'luwero' => [0.8450, 32.4670],
            'mpigi' => [0.2333, 32.3333],
            'kiboga' => [0.9167, 31.7667],
            'nakasongola' => [1.3167, 32.0500],
            'rakai' => [-0.7667, 31.2333],
            'ssembabule' => [-0.0833, 31.4500],
            'kalisizo' => [-0.9000, 31.1000],
            'bugiri' => [0.5667, 33.7500],
            'busia' => [0.4833, 34.0833],
            'iganga' => [0.6167, 33.7000],
            'kamuli' => [0.9500, 33.1167],
            'kumi' => [1.4667, 33.9500],
            'pallisa' => [1.1833, 33.7167],
            'tororo' => [0.7000, 34.1833],
            'apac' => [1.6667, 32.5333],
            'katakwi' => [1.9000, 34.2000],
            'kotido' => [3.0333, 34.1167],
            'moroto' => [2.5333, 34.6667],
            'nakapiripirit' => [1.9500, 34.7000],
            'adjumani' => [3.4000, 31.7833],
            'moyo' => [3.6500, 31.7000],
            'nebbi' => [2.4500, 31.2500],
            'yumbe' => [3.4667, 31.2500],
            'bundibugyo' => [0.7167, 30.0667],
            'kabarole' => [0.6167, 30.2833],
            'kamwenge' => [0.2500, 30.4500],
            'kyenjojo' => [0.6000, 30.6167],
            'kibaale' => [0.8333, 31.0833],
            'kiryandongo' => [1.8500, 31.8833],
            'buliisa' => [1.9500, 31.0833],
            'ntungamo' => [-0.9000, 30.2667],
            'rukungiri' => [-0.7833, 29.9333],
            'kabale' => [-1.2500, 29.9833],
            'kanungu' => [-0.9000, 29.7500],
            'kisoro' => [-1.2833, 29.6833],
            'ruhama' => [-1.1333, 30.7500],
            'isigiro' => [-1.0500, 30.9000],
            'mbarara' => [-0.6083, 30.6544],
        ];

        return $districtCenters[strtolower(trim($district))] ?? null;
    }
}
