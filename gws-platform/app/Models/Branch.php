<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Branch — A physical or logical office belonging to an organization.
 *
 * Each branch has a unique short code (e.g. "HQ", "WND-01") for quick
 * reference. A branch may be flagged as the organization's headquarters
 * and may optionally have a manager (User) assigned.
 *
 * Usage:
 *   Branch::active()->forOrganization($orgId)->get();
 *   Branch::headquarters()->first();
 *
 * @property int         $id
 * @property int         $organization_id
 * @property string      $name
 * @property string      $code
 * @property string|null $address
 * @property string|null $district
 * @property string|null $phone
 * @property string|null $email
 * @property bool        $is_headquarters
 * @property int|null    $manager_user_id
 * @property bool        $is_active
 */
class Branch extends Model
{
    protected $fillable = [
        'organization_id',
        'name',
        'code',
        'address',
        'district',
        'phone',
        'email',
        'is_headquarters',
        'manager_user_id',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'is_headquarters' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    /**
     * Get the organization this branch belongs to.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the user who manages this branch.
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_user_id');
    }

    /**
     * Get all users assigned to this branch.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    // ──────────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────────

    /**
     * Scope: only active branches.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: filter branches belonging to a specific organization.
     */
    public function scopeForOrganization(Builder $query, int $organizationId): Builder
    {
        return $query->where('organization_id', $organizationId);
    }

    /**
     * Scope: only headquarters branches.
     */
    public function scopeHeadquarters(Builder $query): Builder
    {
        return $query->where('is_headquarters', true);
    }
}
