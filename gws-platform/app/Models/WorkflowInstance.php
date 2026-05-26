<?php

namespace App\Models;

use App\Traits\RecordsDomainEvents;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * WorkflowInstance — A running instance of a workflow definition.
 *
 * An instance is created when a workflow is started for a specific entity
 * (e.g., a SurveyProject). It tracks the current position in the step
 * sequence, overall status, and timing information. All state mutations
 * on instances should go through the WorkflowEngine service.
 *
 * Usage:
 *   WorkflowInstance::active()->forEntity('SurveyProject', 42)->first();
 *   $instance->currentStep;     // The WorkflowStep at current position
 *   $instance->isOverdue;       // Has the current step exceeded its SLA?
 *   $instance->daysInCurrentStep; // Days since last transition
 *
 * @property int         $id
 * @property int         $workflow_definition_id
 * @property string      $entity_type
 * @property int         $entity_id
 * @property string      $status
 * @property int         $current_step_order
 * @property Carbon|null $started_at
 * @property Carbon|null $completed_at
 * @property Carbon|null $cancelled_at
 * @property string|null $cancellation_reason
 * @property array|null  $metadata
 * @property int|null    $organization_id
 * @property int|null    $branch_id
 * @property int|null    $created_by_user_id
 */
class WorkflowInstance extends Model
{
    use RecordsDomainEvents;

    /**
     * Valid instance statuses.
     */
    public const STATUSES = ['pending', 'active', 'completed', 'cancelled', 'suspended'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'workflow_definition_id',
        'entity_type',
        'entity_id',
        'status',
        'current_step_order',
        'started_at',
        'completed_at',
        'cancelled_at',
        'cancellation_reason',
        'metadata',
        'organization_id',
        'branch_id',
        'created_by_user_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'current_step_order' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'metadata' => 'array',
    ];

    // --------------------------------------------------------------------------
    // Relationships
    // --------------------------------------------------------------------------

    /**
     * The workflow definition this instance belongs to.
     */
    public function definition(): BelongsTo
    {
        return $this->belongsTo(WorkflowDefinition::class, 'workflow_definition_id');
    }

    /**
     * The transitions that have occurred in this instance.
     */
    public function transitions(): HasMany
    {
        return $this->hasMany(WorkflowTransition::class, 'workflow_instance_id');
    }

    /**
     * The entity this workflow instance is attached to (polymorphic).
     */
    public function entity(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * The organization this workflow instance belongs to.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * The branch this workflow instance belongs to.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * The user who started this workflow instance.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    // --------------------------------------------------------------------------
    // Scopes
    // --------------------------------------------------------------------------

    /**
     * Scope to only active (pending or active status) workflow instances.
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['pending', 'active']);
    }

    /**
     * Scope to only completed workflow instances.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope to find instances for a specific entity.
     */
    public function scopeForEntity($query, string $type, int $id)
    {
        return $query->where('entity_type', $type)->where('entity_id', $id);
    }

    /**
     * Scope to find stalled instances — active instances where the most
     * recent transition on the current step exceeds the step's SLA.
     *
     * Uses the STALLED_THRESHOLD_DAYS from ApprovalStep as the fallback
     * threshold when step-specific SLA is not available.
     */
    public function scopeStalled($query, int $thresholdDays = ApprovalStep::STALLED_THRESHOLD_DAYS)
    {
        return $query->whereIn('status', ['pending', 'active'])
            ->whereHas('transitions', function ($q) use ($thresholdDays) {
                $q->where('to_status', 'submitted')
                    ->where('transitioned_at', '<', Carbon::now()->subDays($thresholdDays));
            });
    }

    // --------------------------------------------------------------------------
    // Accessors
    // --------------------------------------------------------------------------

    /**
     * Get the current workflow step based on the current_step_order.
     *
     * Returns null if the step order doesn't match any step in the definition.
     */
    public function getCurrentStepAttribute(): ?WorkflowStep
    {
        return $this->definition?->steps()
            ->where('step_order', $this->current_step_order)
            ->first();
    }

    /**
     * Determine if the current step is overdue (exceeds its SLA).
     *
     * Compares the last transition time plus the step's SLA days against now.
     * Returns false if the instance is not active or has no current step.
     */
    public function getIsOverdueAttribute(): bool
    {
        if (! in_array($this->status, ['pending', 'active'])) {
            return false;
        }

        $currentStep = $this->currentStep;
        if (! $currentStep) {
            return false;
        }

        $lastTransition = $this->transitions()
            ->where('workflow_step_id', $currentStep->id)
            ->where('to_status', 'submitted')
            ->orderByDesc('transitioned_at')
            ->first();

        if (! $lastTransition) {
            return false;
        }

        return $lastTransition->transitioned_at
            ->addDays($currentStep->sla_days)
            ->isPast();
    }

    /**
     * Get the number of days spent in the current step.
     *
     * Returns 0 if the instance has not been started yet.
     */
    public function getDaysInCurrentStepAttribute(): int
    {
        $lastTransition = $this->transitions()
            ->orderByDesc('transitioned_at')
            ->first();

        if (! $lastTransition) {
            return $this->started_at
                ? (int) $this->started_at->diffInDays(Carbon::now())
                : 0;
        }

        return (int) $lastTransition->transitioned_at->diffInDays(Carbon::now());
    }

    // --------------------------------------------------------------------------
    // Business Logic
    // --------------------------------------------------------------------------

    /**
     * Cancel this workflow instance with a reason.
     *
     * @param  string  $reason  The reason for cancellation.
     * @return bool Whether the update was successful.
     */
    public function cancel(string $reason): bool
    {
        return $this->update([
            'status' => 'cancelled',
            'cancelled_at' => Carbon::now(),
            'cancellation_reason' => $reason,
        ]);
    }

    /**
     * Suspend this workflow instance.
     *
     * A suspended instance can be resumed later. No transitions can occur
     * while the instance is suspended.
     *
     * @return bool Whether the update was successful.
     */
    public function suspend(): bool
    {
        return $this->update(['status' => 'suspended']);
    }

    /**
     * Resume a suspended workflow instance.
     *
     * @return bool Whether the update was successful.
     */
    public function resume(): bool
    {
        return $this->update(['status' => 'active']);
    }
}
