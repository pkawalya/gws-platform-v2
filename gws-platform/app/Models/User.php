<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password', 'organization_id', 'branch_id'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    /**
     * API token abilities supported by the platform.
     *
     * These abilities control what actions a mobile field app token
     * can perform against the API.
     */
    public const TOKEN_ABILITIES = [
        'field-read'  => 'Read field assignments, observations, and client data',
        'field-write' => 'Create and update field observations',
        'sync'        => 'Push and pull offline sync data',
        'offline'     => 'Perform offline-first sync operations',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // --------------------------------------------------------------------------
    // Relationships
    // --------------------------------------------------------------------------

    /**
     * The organization this user belongs to.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * The branch this user belongs to.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * The survey projects assigned to this user as a surveyor.
     */
    public function assignedProjects(): HasMany
    {
        return $this->hasMany(SurveyProject::class, 'assigned_surveyor_user_id');
    }

    /**
     * The field observations recorded by this user.
     */
    public function fieldObservations(): HasMany
    {
        return $this->hasMany(FieldObservation::class, 'recorded_by_user_id');
    }

    /**
     * The sync events initiated by this user.
     */
    public function syncEvents(): HasMany
    {
        return $this->hasMany(FieldSyncEvent::class);
    }

    // --------------------------------------------------------------------------
    // Helper Methods
    // --------------------------------------------------------------------------

    /**
     * Determine if the user is a field surveyor.
     */
    public function isFieldSurveyor(): bool
    {
        return $this->hasRole('surveyor') || $this->hasRole('field-surveyor');
    }

    /**
     * Get the default API token abilities for this user based on their role.
     *
     * @return array<string>
     */
    public function getDefaultTokenAbilities(): array
    {
        if ($this->hasRole('admin') || $this->hasRole('super-admin')) {
            return ['field-read', 'field-write', 'sync', 'offline'];
        }

        if ($this->isFieldSurveyor()) {
            return ['field-read', 'field-write', 'sync', 'offline'];
        }

        return ['field-read'];
    }
}
