<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * Organization — Top-level tenant entity in the GWS Platform.
 *
 * Every organization owns branches, users, clients, and all downstream
 * business data. The slug is auto-generated from the name on creation
 * and provides a human-readable identifier for URLs and lookups.
 *
 * Usage:
 *   Organization::active()->with('branches')->get();
 *   $org->users()->count();
 *
 * @property int         $id
 * @property string      $name
 * @property string      $slug
 * @property string|null $logo_path
 * @property array|null  $settings_json
 * @property string|null $subscription_plan
 * @property bool        $is_active
 */
class Organization extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'logo_path',
        'settings_json',
        'subscription_plan',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'settings_json' => 'array',
            'is_active' => 'boolean',
        ];
    }

    // ──────────────────────────────────────────────
    // Boot
    // ──────────────────────────────────────────────

    /**
     * Auto-generate slug from name when creating a new organization.
     * If the slug is already set (e.g. by Filament form), we do not
     * overwrite it. Duplicate slugs are prevented by the UNIQUE
     * database constraint — on collision we append a short suffix.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $organization) {
            if (empty($organization->slug)) {
                $organization->slug = static::generateUniqueSlug($organization->name);
            }
        });
    }

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    /**
     * Get all branches belonging to this organization.
     */
    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    /**
     * Get all users belonging to this organization.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    // ──────────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────────

    /**
     * Scope: only active organizations.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    /**
     * Generate a unique slug from the given name.
     *
     * On collision (e.g. two orgs named "Acme"), appends a numeric
     * suffix: "acme-2", "acme-3", etc.
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
