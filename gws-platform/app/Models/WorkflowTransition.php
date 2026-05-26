<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * WorkflowTransition — Record of a single state change in a workflow instance.
 *
 * Transitions are the immutable audit trail of the workflow engine. Each
 * transition captures the from/to status, the action taken, who performed
 * it, and any associated comment or metadata. Unlike other models, this
 * model does NOT use RecordsDomainEvents because transitions ARE the
 * event records themselves.
 *
 * Usage:
 *   WorkflowTransition::forInstance($id)->approved()->get();
 *   WorkflowTransition::byAction('reject')->count();
 *
 * @property int         $id
 * @property int         $workflow_instance_id
 * @property int         $workflow_step_id
 * @property string      $from_status
 * @property string      $to_status
 * @property string      $action
 * @property string|null $actor_type
 * @property int|null    $actor_id
 * @property string|null $comment
 * @property array|null  $metadata
 * @property Carbon      $transitioned_at
 */
class WorkflowTransition extends Model
{
    /**
     * Valid transition statuses.
     */
    public const STATUSES = ['pending', 'submitted', 'approved', 'deferred', 'rejected', 'skipped'];

    /**
     * Valid transition actions.
     */
    public const ACTIONS = ['approve', 'defer', 'reject', 'skip', 'submit', 'reopen', 'escalate'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'workflow_instance_id',
        'workflow_step_id',
        'from_status',
        'to_status',
        'action',
        'actor_type',
        'actor_id',
        'comment',
        'metadata',
        'transitioned_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'transitioned_at' => 'datetime',
        'metadata' => 'array',
    ];

    // --------------------------------------------------------------------------
    // Relationships
    // --------------------------------------------------------------------------

    /**
     * The workflow instance this transition belongs to.
     */
    public function instance(): BelongsTo
    {
        return $this->belongsTo(WorkflowInstance::class, 'workflow_instance_id');
    }

    /**
     * The workflow step this transition applies to.
     */
    public function step(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class, 'workflow_step_id');
    }

    // --------------------------------------------------------------------------
    // Scopes
    // --------------------------------------------------------------------------

    /**
     * Scope to only approved transitions.
     */
    public function scopeApproved($query)
    {
        return $query->where('to_status', 'approved');
    }

    /**
     * Scope to only deferred transitions.
     */
    public function scopeDeferred($query)
    {
        return $query->where('to_status', 'deferred');
    }

    /**
     * Scope to only rejected transitions.
     */
    public function scopeRejected($query)
    {
        return $query->where('to_status', 'rejected');
    }

    /**
     * Scope to filter transitions by workflow instance.
     */
    public function scopeForInstance($query, int $id)
    {
        return $query->where('workflow_instance_id', $id);
    }

    /**
     * Scope to filter transitions by action type.
     */
    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }
}
