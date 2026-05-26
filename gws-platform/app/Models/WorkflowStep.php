<?php

namespace App\Models;

use App\Traits\RecordsDomainEvents;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * WorkflowStep — A single step within a workflow definition.
 *
 * Steps define the ordered sequence of actions in a workflow. Each step
 * has a type (approval, review, notification, payment, external), an
 * assignee strategy, and SLA deadline. Steps can be mandatory or optional,
 * and may auto-advance when approved.
 *
 * Usage:
 *   $definition->steps()->ordered()->get();
 *   WorkflowStep::ofType('approval')->mandatory()->get();
 *
 * @property int         $id
 * @property int         $workflow_definition_id
 * @property string      $name
 * @property string      $slug
 * @property int         $step_order
 * @property string      $step_type
 * @property string      $assignee_type
 * @property string|null $assignee_identifier
 * @property int         $sla_days
 * @property bool        $is_mandatory
 * @property bool        $auto_advance_on_approval
 * @property array|null  $config
 */
class WorkflowStep extends Model
{
    use RecordsDomainEvents;

    /**
     * Valid step types.
     */
    public const STEP_TYPES = ['approval', 'review', 'notification', 'payment', 'external'];

    /**
     * Valid assignee types.
     */
    public const ASSIGNEE_TYPES = ['role', 'user', 'department', 'external'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'workflow_definition_id',
        'name',
        'slug',
        'step_order',
        'step_type',
        'assignee_type',
        'assignee_identifier',
        'sla_days',
        'is_mandatory',
        'auto_advance_on_approval',
        'config',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'step_order' => 'integer',
        'sla_days' => 'integer',
        'is_mandatory' => 'boolean',
        'auto_advance_on_approval' => 'boolean',
        'config' => 'array',
    ];

    // --------------------------------------------------------------------------
    // Relationships
    // --------------------------------------------------------------------------

    /**
     * The workflow definition this step belongs to.
     */
    public function definition(): BelongsTo
    {
        return $this->belongsTo(WorkflowDefinition::class, 'workflow_definition_id');
    }

    /**
     * The transitions that have occurred on this step.
     */
    public function transitions(): HasMany
    {
        return $this->hasMany(WorkflowTransition::class, 'workflow_step_id');
    }

    // --------------------------------------------------------------------------
    // Scopes
    // --------------------------------------------------------------------------

    /**
     * Scope to order steps by their step_order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('step_order');
    }

    /**
     * Scope to filter steps by type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('step_type', $type);
    }

    /**
     * Scope to only mandatory steps.
     */
    public function scopeMandatory($query)
    {
        return $query->where('is_mandatory', true);
    }
}
