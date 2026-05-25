<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalStep extends Model
{
    /**
     * The default institution steps in their required order.
     *
     * These represent the 8-step approval workflow for a land survey
     * project in Uganda, from client signing through land office registration.
     */
    public const DEFAULT_STEPS = [
        1 => 'client_signed',
        2 => 'lc1',
        3 => 'alc',
        4 => 'physical_planning',
        5 => 'dlb',
        6 => 'gws',
        7 => 'mzo',
        8 => 'land_office',
    ];

    /**
     * Valid institution values.
     */
    public const INSTITUTIONS = [
        'client_signed',
        'lc1',
        'alc',
        'physical_planning',
        'dlb',
        'gws',
        'mzo',
        'land_office',
    ];

    /**
     * Valid status values.
     */
    public const STATUSES = [
        'pending',
        'submitted',
        'approved',
        'deferred',
    ];

    /**
     * The number of days after which a submitted step is considered stalled.
     */
    public const STALLED_THRESHOLD_DAYS = 7;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'client_project_progress_id',
        'institution',
        'step_order',
        'status',
        'officer_name',
        'submitted_at',
        'approved_at',
        'deferred_at',
        'deferred_reason',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'step_order' => 'integer',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'deferred_at' => 'datetime',
    ];

    // --------------------------------------------------------------------------
    // Relationships
    // --------------------------------------------------------------------------

    /**
     * The client project progress record this approval step belongs to.
     */
    public function clientProjectProgress(): BelongsTo
    {
        return $this->belongsTo(ClientProjectProgress::class);
    }

    // --------------------------------------------------------------------------
    // Scopes
    // --------------------------------------------------------------------------

    /**
     * Scope to only pending approval steps.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to only submitted approval steps.
     */
    public function scopeSubmitted($query)
    {
        return $query->where('status', 'submitted');
    }

    /**
     * Scope to only approved approval steps.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope to only deferred approval steps.
     */
    public function scopeDeferred($query)
    {
        return $query->where('status', 'deferred');
    }

    /**
     * Scope to steps that are submitted but have had no update for more than
     * the stalled threshold (7 days by default).
     *
     * A step is considered "stalled" when it has been in the "submitted"
     * status for longer than STALLED_THRESHOLD_DAYS without being approved
     * or deferred.
     */
    public function scopeStalled($query, int $thresholdDays = self::STALLED_THRESHOLD_DAYS)
    {
        return $query->where('status', 'submitted')
            ->where('submitted_at', '<', Carbon::now()->subDays($thresholdDays));
    }

    // --------------------------------------------------------------------------
    // Accessors
    // --------------------------------------------------------------------------

    /**
     * Get the number of days since this step was submitted.
     *
     * Returns null if the step has not been submitted yet.
     */
    public function getDaysSinceSubmissionAttribute(): ?int
    {
        if (! $this->submitted_at) {
            return null;
        }

        return (int) $this->submitted_at->diffInDays(Carbon::now());
    }

    // --------------------------------------------------------------------------
    // Business Logic
    // --------------------------------------------------------------------------

    /**
     * Seed the 8 default approval steps for a given ClientProjectProgress.
     *
     * Creates all 8 institution steps in their defined order with a
     * default status of "pending". If steps already exist for the
     * given progress record, this method does nothing.
     *
     * @param  \App\Models\ClientProjectProgress  $progress  The progress record to create steps for.
     * @return bool Whether the steps were created.
     */
    public static function seedDefaultSteps(ClientProjectProgress $progress): bool
    {
        // Don't seed if steps already exist
        if ($progress->approvalSteps()->exists()) {
            return false;
        }

        $steps = [];

        foreach (self::DEFAULT_STEPS as $order => $institution) {
            $steps[] = [
                'client_project_progress_id' => $progress->id,
                'institution' => $institution,
                'step_order' => $order,
                'status' => 'pending',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ];
        }

        self::insert($steps);

        return true;
    }
}
