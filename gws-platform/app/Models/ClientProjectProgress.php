<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClientProjectProgress extends Model
{
    use RecordsDomainEvents;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'survey_project_id',
        'client_id',
        'progress_percentage',
        'current_stage',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'progress_percentage' => 'decimal:2',
    ];

    // --------------------------------------------------------------------------
    // Relationships
    // --------------------------------------------------------------------------

    /**
     * The survey project this progress record belongs to.
     */
    public function surveyProject(): BelongsTo
    {
        return $this->belongsTo(SurveyProject::class);
    }

    /**
     * The client this progress record belongs to.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * The approval steps for this progress record.
     */
    public function approvalSteps(): HasMany
    {
        return $this->hasMany(ApprovalStep::class);
    }
}
