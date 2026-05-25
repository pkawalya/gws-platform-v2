<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

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
}
