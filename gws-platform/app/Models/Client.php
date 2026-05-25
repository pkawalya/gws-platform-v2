<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Client extends Model
{
    use RecordsDomainEvents;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'client_number',
        'first_name',
        'last_name',
        'email',
        'phone',
        'nin',
        'date_of_birth',
        'gender',
        'address',
        'district',
        'lc1_area',
        'village',
        'parish',
        'sub_county',
        'county',
        'kyc_verified',
        'kyc_verified_at',
        'lifecycle_state',
        'sms_opt_out',
        'assigned_officer_user_id',
        'notes',
        'organization_id',
        'branch_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'kyc_verified' => 'boolean',
        'sms_opt_out' => 'boolean',
        'kyc_verified_at' => 'datetime',
        'date_of_birth' => 'date',
    ];

    // --------------------------------------------------------------------------
    // Relationships
    // --------------------------------------------------------------------------

    /**
     * The user (officer) assigned to this client.
     */
    public function assignedOfficer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_officer_user_id');
    }

    /**
     * The organization this client belongs to.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * The branch this client belongs to.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * The survey projects associated with this client.
     */
    public function surveyProjects(): HasMany
    {
        return $this->hasMany(SurveyProject::class);
    }

    // --------------------------------------------------------------------------
    // Accessors
    // --------------------------------------------------------------------------

    /**
     * Get the client's full name.
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    // --------------------------------------------------------------------------
    // Scopes
    // --------------------------------------------------------------------------

    /**
     * Scope to only active clients.
     */
    public function scopeActive($query)
    {
        return $query->where('lifecycle_state', 'active');
    }

    /**
     * Scope to filter by lifecycle state.
     */
    public function scopeByLifecycle($query, string $state)
    {
        return $query->where('lifecycle_state', $state);
    }

    // --------------------------------------------------------------------------
    // Boot / Auto-generation
    // --------------------------------------------------------------------------

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function (self $client) {
            if (empty($client->client_number)) {
                $client->client_number = static::generateClientNumber();
            }
        });
    }

    /**
     * Generate a unique client number in the format GWS-YYYY-NNNN.
     *
     * The numeric portion (NNNN) is sequential within the current year,
     * starting from 0001. If the highest existing number for this year
     * is GWS-2026-0042, the next will be GWS-2026-0043.
     */
    public static function generateClientNumber(): string
    {
        $year = now()->year;
        $prefix = "GWS-{$year}-";

        $lastClient = static::query()
            ->where('client_number', 'LIKE', "{$prefix}%")
            ->orderByDesc('client_number')
            ->first();

        if ($lastClient) {
            $lastSequential = (int) Str::afterLast($lastClient->client_number, '-');
            $nextSequential = $lastSequential + 1;
        } else {
            $nextSequential = 1;
        }

        return $prefix . str_pad((string) $nextSequential, 4, '0', STR_PAD_LEFT);
    }
}
