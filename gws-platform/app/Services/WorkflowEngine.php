<?php

namespace App\Services;

use App\Models\ApprovalStep;
use App\Models\User;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowInstance;
use App\Models\WorkflowStep;
use App\Models\WorkflowTransition;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * WorkflowEngine — Core service for managing workflow lifecycle.
 *
 * This is the ONLY entry point for workflow mutations. All creates, advances,
 * deferrals, rejections, skips, and cancellations MUST go through this
 * service to ensure consistent event recording and state management.
 *
 * Usage:
 *   $instance = WorkflowEngine::start($definition, $surveyProject, $user);
 *   $transition = WorkflowEngine::advance($instance, 'approve', 'Looks good', $user);
 *   $transition = WorkflowEngine::defer($instance, 'Missing documents', $user);
 *   $progress = WorkflowEngine::calculateProgress($instance);
 *   $stalled = WorkflowEngine::getStalledInstances('SurveyProject');
 */
class WorkflowEngine
{
    // --------------------------------------------------------------------------
    // Start
    // --------------------------------------------------------------------------

    /**
     * Start a new workflow instance for an entity.
     *
     * Creates the instance and initial 'pending' transitions for each step
     * in the workflow definition. The instance status is set to 'active'
     * and the current_step_order points to the first step.
     *
     * @param  WorkflowDefinition  $definition  The workflow definition to instantiate.
     * @param  Model  $entity  The entity this workflow is attached to (e.g., SurveyProject).
     * @param  User|null  $startedBy  The user who started the workflow (optional).
     * @return WorkflowInstance The newly created workflow instance.
     *
     * @throws \InvalidArgumentException If the definition is not active.
     */
    public static function start(WorkflowDefinition $definition, Model $entity, ?User $startedBy = null): WorkflowInstance
    {
        if (! $definition->is_active) {
            throw new \InvalidArgumentException("Cannot start workflow: definition '{$definition->name}' is not active.");
        }

        return DB::transaction(function () use ($definition, $entity, $startedBy) {
            $steps = $definition->steps()->ordered()->get();

            if ($steps->isEmpty()) {
                throw new \InvalidArgumentException("Cannot start workflow: definition '{$definition->name}' has no steps.");
            }

            $firstStep = $steps->first();

            $instance = WorkflowInstance::create([
                'workflow_definition_id' => $definition->id,
                'entity_type' => $definition->entity_type,
                'entity_id' => $entity->getKey(),
                'status' => 'active',
                'current_step_order' => $firstStep->step_order,
                'started_at' => Carbon::now(),
                'organization_id' => $entity->organization_id ?? $definition->organization_id,
                'branch_id' => $entity->branch_id ?? null,
                'created_by_user_id' => $startedBy?->getKey(),
            ]);

            // Create initial 'pending' transition for each step
            foreach ($steps as $step) {
                WorkflowTransition::create([
                    'workflow_instance_id' => $instance->id,
                    'workflow_step_id' => $step->id,
                    'from_status' => 'pending',
                    'to_status' => 'pending',
                    'action' => 'submit',
                    'actor_type' => $startedBy ? get_class($startedBy) : 'System',
                    'actor_id' => $startedBy?->getKey(),
                    'comment' => 'Workflow started',
                    'metadata' => null,
                    'transitioned_at' => Carbon::now(),
                ]);
            }

            // Record domain event
            EventStore::record(
                'workflow.instance_started',
                $entity,
                [
                    'instance_id' => $instance->id,
                    'definition_id' => $definition->id,
                    'definition_name' => $definition->name,
                    'entity_type' => $definition->entity_type,
                    'entity_id' => $entity->getKey(),
                    'total_steps' => $steps->count(),
                ],
                causer: $startedBy
            );

            return $instance;
        });
    }

    // --------------------------------------------------------------------------
    // Advance
    // --------------------------------------------------------------------------

    /**
     * Advance the workflow by performing a transition on the current step.
     *
     * Records the transition, updates the instance status, and auto-advances
     * to the next step if the action is 'approve' and the step has
     * auto_advance_on_approval enabled. When all steps are approved,
     * the instance is marked as completed.
     *
     * @param  WorkflowInstance  $instance  The workflow instance to advance.
     * @param  string  $action  The action to perform (approve|defer|reject|skip|submit|reopen|escalate).
     * @param  string|null  $comment  An optional comment for the transition.
     * @param  Model|null  $actor  Who performed the action.
     * @param  array  $metadata  Additional metadata for the transition.
     * @return WorkflowTransition The created transition record.
     *
     * @throws \InvalidArgumentException If the action is invalid or instance is not active.
     */
    public static function advance(
        WorkflowInstance $instance,
        string $action,
        ?string $comment = null,
        ?Model $actor = null,
        array $metadata = []
    ): WorkflowTransition {
        if (! in_array($instance->status, ['pending', 'active'])) {
            throw new \InvalidArgumentException("Cannot advance workflow: instance status is '{$instance->status}'.");
        }

        if (! in_array($action, WorkflowTransition::ACTIONS)) {
            throw new \InvalidArgumentException("Invalid action: '{$action}'.");
        }

        return DB::transaction(function () use ($instance, $action, $comment, $actor, $metadata) {
            $currentStep = $instance->currentStep;

            if (! $currentStep) {
                throw new \InvalidArgumentException('Cannot advance workflow: no current step found.');
            }

            // Determine the from_status from the most recent transition on this step
            $lastTransition = $instance->transitions()
                ->where('workflow_step_id', $currentStep->id)
                ->orderByDesc('transitioned_at')
                ->first();

            $fromStatus = $lastTransition?->to_status ?? 'pending';

            // Map action to to_status
            $toStatus = match ($action) {
                'approve' => 'approved',
                'defer' => 'deferred',
                'reject' => 'rejected',
                'skip' => 'skipped',
                'submit' => 'submitted',
                'reopen' => 'submitted',
                'escalate' => 'submitted',
                default => 'submitted',
            };

            $transition = WorkflowTransition::create([
                'workflow_instance_id' => $instance->id,
                'workflow_step_id' => $currentStep->id,
                'from_status' => $fromStatus,
                'to_status' => $toStatus,
                'action' => $action,
                'actor_type' => $actor ? get_class($actor) : 'System',
                'actor_id' => $actor?->getKey(),
                'comment' => $comment,
                'metadata' => ! empty($metadata) ? $metadata : null,
                'transitioned_at' => Carbon::now(),
            ]);

            // Handle auto-advance on approval
            if ($action === 'approve' && $currentStep->auto_advance_on_approval) {
                static::moveToNextStep($instance);
            }

            // Check if workflow is complete (all mandatory steps approved)
            if ($action === 'approve' && static::isWorkflowComplete($instance)) {
                $instance->update([
                    'status' => 'completed',
                    'completed_at' => Carbon::now(),
                ]);

                EventStore::record(
                    'workflow.instance_completed',
                    $instance->entity ?? $instance,
                    [
                        'instance_id' => $instance->id,
                        'definition_name' => $instance->definition?->name,
                        'progress' => static::calculateProgress($instance),
                    ],
                    causer: $actor
                );
            }

            // Record domain event for the transition
            EventStore::record(
                'workflow.step_' . $action . 'd',
                $instance->entity ?? $instance,
                [
                    'instance_id' => $instance->id,
                    'step_id' => $currentStep->id,
                    'step_name' => $currentStep->name,
                    'from_status' => $fromStatus,
                    'to_status' => $toStatus,
                    'action' => $action,
                    'comment' => $comment,
                ],
                causer: $actor
            );

            return $transition;
        });
    }

    // --------------------------------------------------------------------------
    // Defer
    // --------------------------------------------------------------------------

    /**
     * Defer the current step with a reason.
     *
     * Records a 'defer' transition, which marks the current step as deferred.
     * The workflow does not advance — it stays on the current step awaiting
     * further action.
     *
     * @param  WorkflowInstance  $instance  The workflow instance.
     * @param  string  $reason  The reason for deferral.
     * @param  Model|null  $actor  Who performed the deferral.
     * @return WorkflowTransition The created transition record.
     */
    public static function defer(WorkflowInstance $instance, string $reason, ?Model $actor = null): WorkflowTransition
    {
        return static::advance($instance, 'defer', $reason, $actor, [
            'deferred_reason' => $reason,
        ]);
    }

    // --------------------------------------------------------------------------
    // Reject
    // --------------------------------------------------------------------------

    /**
     * Reject the workflow at the current step.
     *
     * Records a 'reject' transition. The instance status is updated to
     * 'cancelled' since a rejection typically terminates the workflow.
     *
     * @param  WorkflowInstance  $instance  The workflow instance.
     * @param  string  $reason  The reason for rejection.
     * @param  Model|null  $actor  Who performed the rejection.
     * @return WorkflowTransition The created transition record.
     */
    public static function reject(WorkflowInstance $instance, string $reason, ?Model $actor = null): WorkflowTransition
    {
        return DB::transaction(function () use ($instance, $reason, $actor) {
            $transition = static::advance($instance, 'reject', $reason, $actor, [
                'rejection_reason' => $reason,
            ]);

            $instance->update([
                'status' => 'cancelled',
                'cancelled_at' => Carbon::now(),
                'cancellation_reason' => $reason,
            ]);

            return $transition;
        });
    }

    // --------------------------------------------------------------------------
    // Skip
    // --------------------------------------------------------------------------

    /**
     * Skip a non-mandatory step.
     *
     * Only non-mandatory steps can be skipped. If the step is mandatory,
     * an exception is thrown.
     *
     * @param  WorkflowInstance  $instance  The workflow instance.
     * @param  string|null  $comment  An optional comment explaining the skip.
     * @param  Model|null  $actor  Who performed the skip.
     * @return WorkflowTransition The created transition record.
     *
     * @throws \InvalidArgumentException If the current step is mandatory.
     */
    public static function skip(WorkflowInstance $instance, ?string $comment = null, ?Model $actor = null): WorkflowTransition
    {
        $currentStep = $instance->currentStep;

        if ($currentStep && $currentStep->is_mandatory) {
            throw new \InvalidArgumentException("Cannot skip mandatory step: '{$currentStep->name}'.");
        }

        return DB::transaction(function () use ($instance, $comment, $actor, $currentStep) {
            $transition = static::advance($instance, 'skip', $comment, $actor);

            // Auto-advance to next step after skipping
            if ($currentStep && $currentStep->auto_advance_on_approval) {
                static::moveToNextStep($instance);
            }

            return $transition;
        });
    }

    // --------------------------------------------------------------------------
    // Escalate
    // --------------------------------------------------------------------------

    /**
     * Escalate a stalled step.
     *
     * Records an 'escalate' transition that signals the current step
     * requires urgent attention. The system user is the default actor.
     *
     * @param  WorkflowInstance  $instance  The workflow instance.
     * @param  string|null  $comment  An optional comment for escalation.
     * @return WorkflowTransition The created transition record.
     */
    public static function escalate(WorkflowInstance $instance, ?string $comment = null): WorkflowTransition
    {
        $systemUser = Auth::user();

        return static::advance($instance, 'escalate', $comment ?? 'Step escalated due to SLA breach', $systemUser, [
            'escalated' => true,
            'escalated_at' => Carbon::now()->toIso8601String(),
        ]);
    }

    // --------------------------------------------------------------------------
    // Cancel
    // --------------------------------------------------------------------------

    /**
     * Cancel the entire workflow instance.
     *
     * @param  WorkflowInstance  $instance  The workflow instance to cancel.
     * @param  string  $reason  The reason for cancellation.
     * @param  Model|null  $actor  Who performed the cancellation.
     * @return WorkflowInstance The cancelled instance.
     */
    public static function cancel(WorkflowInstance $instance, string $reason, ?Model $actor = null): WorkflowInstance
    {
        return DB::transaction(function () use ($instance, $reason, $actor) {
            $instance->cancel($reason);

            EventStore::record(
                'workflow.instance_cancelled',
                $instance->entity ?? $instance,
                [
                    'instance_id' => $instance->id,
                    'cancellation_reason' => $reason,
                ],
                causer: $actor
            );

            return $instance;
        });
    }

    // --------------------------------------------------------------------------
    // Suspend
    // --------------------------------------------------------------------------

    /**
     * Suspend the workflow instance.
     *
     * A suspended instance cannot have transitions applied until it is resumed.
     *
     * @param  WorkflowInstance  $instance  The workflow instance to suspend.
     * @param  string|null  $reason  An optional reason for suspension.
     * @return WorkflowInstance The suspended instance.
     */
    public static function suspend(WorkflowInstance $instance, ?string $reason = null): WorkflowInstance
    {
        return DB::transaction(function () use ($instance, $reason) {
            $instance->suspend();

            EventStore::record(
                'workflow.instance_suspended',
                $instance->entity ?? $instance,
                [
                    'instance_id' => $instance->id,
                    'reason' => $reason,
                ],
                causer: Auth::user()
            );

            return $instance;
        });
    }

    // --------------------------------------------------------------------------
    // Resume
    // --------------------------------------------------------------------------

    /**
     * Resume a suspended workflow instance.
     *
     * @param  WorkflowInstance  $instance  The workflow instance to resume.
     * @return WorkflowInstance The resumed instance.
     */
    public static function resume(WorkflowInstance $instance): WorkflowInstance
    {
        return DB::transaction(function () use ($instance) {
            $instance->resume();

            EventStore::record(
                'workflow.instance_resumed',
                $instance->entity ?? $instance,
                [
                    'instance_id' => $instance->id,
                ],
                causer: Auth::user()
            );

            return $instance;
        });
    }

    // --------------------------------------------------------------------------
    // Query
    // --------------------------------------------------------------------------

    /**
     * Get all stalled instances, optionally filtered by entity type.
     *
     * A stalled instance is one where the most recent transition on the
     * current step has exceeded the step's SLA days, or the fallback
     * STALLED_THRESHOLD_DAYS from ApprovalStep.
     *
     * @param  string|null  $entityType  Optional entity type filter.
     * @return Collection<WorkflowInstance>
     */
    public static function getStalledInstances(?string $entityType = null): Collection
    {
        $query = WorkflowInstance::query()
            ->whereIn('status', ['pending', 'active'])
            ->with(['definition', 'entity']);

        if ($entityType) {
            $query->where('entity_type', $entityType);
        }

        $instances = $query->get();

        return $instances->filter(function (WorkflowInstance $instance) {
            return $instance->is_overdue;
        });
    }

    /**
     * Get workflow progress as a percentage.
     *
     * Calculates the percentage of approved steps (including skipped non-mandatory
     * steps) relative to the total number of steps.
     *
     * @param  WorkflowInstance  $instance  The workflow instance.
     * @return float Progress percentage (0.0 to 100.0).
     */
    public static function calculateProgress(WorkflowInstance $instance): float
    {
        $steps = $instance->definition?->steps()->ordered()->get();

        if ($steps->isEmpty()) {
            return 0.0;
        }

        $completedStepIds = $instance->transitions()
            ->where('to_status', 'approved')
            ->pluck('workflow_step_id')
            ->unique()
            ->toArray();

        $skippedStepIds = $instance->transitions()
            ->where('to_status', 'skipped')
            ->pluck('workflow_step_id')
            ->unique()
            ->toArray();

        $completedCount = 0;
        foreach ($steps as $step) {
            if (in_array($step->id, $completedStepIds)) {
                $completedCount++;
            } elseif (in_array($step->id, $skippedStepIds) && ! $step->is_mandatory) {
                $completedCount++;
            }
        }

        return round(($completedCount / $steps->count()) * 100, 2);
    }

    /**
     * Replay the full transition history for an instance.
     *
     * Returns all transitions in chronological order, providing a complete
     * audit trail of every state change in the workflow.
     *
     * @param  WorkflowInstance  $instance  The workflow instance.
     * @return Collection<WorkflowTransition>
     */
    public static function replayHistory(WorkflowInstance $instance): Collection
    {
        return $instance->transitions()
            ->with(['step'])
            ->orderBy('transitioned_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();
    }

    // --------------------------------------------------------------------------
    // Internal Helpers
    // --------------------------------------------------------------------------

    /**
     * Move the instance to the next step in the sequence.
     *
     * Skips non-mandatory steps that are already completed (approved/skipped).
     * If there are no more steps, the instance is completed.
     */
    protected static function moveToNextStep(WorkflowInstance $instance): void
    {
        $steps = $instance->definition?->steps()->ordered()->get();
        if (! $steps) {
            return;
        }

        $currentOrder = $instance->current_step_order;
        $nextStep = null;

        // Find the next step that hasn't been completed
        foreach ($steps as $step) {
            if ($step->step_order > $currentOrder) {
                // Check if this step is already completed (approved or skipped)
                $alreadyCompleted = $instance->transitions()
                    ->where('workflow_step_id', $step->id)
                    ->whereIn('to_status', ['approved', 'skipped'])
                    ->exists();

                if (! $alreadyCompleted) {
                    $nextStep = $step;
                    break;
                }
            }
        }

        if ($nextStep) {
            $instance->update([
                'current_step_order' => $nextStep->step_order,
            ]);
        }
        // If no next step, the isWorkflowComplete check will handle completion
    }

    /**
     * Check if the workflow is complete (all mandatory steps approved).
     *
     * A workflow is complete when every mandatory step has an 'approved'
     * transition, and all non-mandatory steps are either approved or skipped.
     */
    protected static function isWorkflowComplete(WorkflowInstance $instance): bool
    {
        $steps = $instance->definition?->steps()->ordered()->get();
        if (! $steps || $steps->isEmpty()) {
            return false;
        }

        foreach ($steps as $step) {
            $latestTransition = $instance->transitions()
                ->where('workflow_step_id', $step->id)
                ->orderByDesc('transitioned_at')
                ->first();

            $stepStatus = $latestTransition?->to_status ?? 'pending';

            if ($step->is_mandatory && $stepStatus !== 'approved') {
                return false;
            }

            if (! $step->is_mandatory && ! in_array($stepStatus, ['approved', 'skipped'])) {
                return false;
            }
        }

        return true;
    }
}
