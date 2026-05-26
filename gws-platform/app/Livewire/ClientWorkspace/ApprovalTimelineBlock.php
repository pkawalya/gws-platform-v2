<?php

namespace App\Livewire\ClientWorkspace;

use App\Models\ApprovalStep;
use App\Models\Client;
use App\Models\ClientProjectProgress;
use App\Models\SurveyProject;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowInstance;
use App\Services\EventStore;
use App\Services\WorkflowEngine;
use Filament\Notifications\Notification;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Computed;
use Livewire\Attributes\Locked;
use Livewire\Component;

/**
 * ApprovalTimelineBlock — Client Workspace approval progress component.
 *
 * Displays the 8-step approval timeline for each of the client's
 * land project progress records. Supports inline step updates,
 * mark-as-approved, and deferral recording.
 *
 * Phase 2A: Now supports the WorkflowEngine. If a workflow definition
 * exists for the entity type, it uses WorkflowEngine for lifecycle
 * management. Falls back to the legacy ApprovalStep logic when no
 * definition is available (backward compatibility).
 */
class ApprovalTimelineBlock extends Component
{
    #[Locked]
    public int $clientId;

    // --------------------------------------------------------------------------
    // Computed Properties
    // --------------------------------------------------------------------------

    /**
     * Load all progress records for this client with eager-loaded relations.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    #[Computed]
    public function progressRecords()
    {
        return ClientProjectProgress::where('client_id', $this->clientId)
            ->with(['approvalSteps', 'surveyProject'])
            ->get();
    }

    /**
     * Load all workflow instances for this client's survey projects.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    #[Computed
    ]
    public function workflowInstances()
    {
        $projectIds = SurveyProject::where('client_id', $this->clientId)->pluck('id');

        return WorkflowInstance::whereIn('entity_id', $projectIds)
            ->where('entity_type', 'SurveyProject')
            ->with(['definition.steps', 'transitions.step'])
            ->get();
    }

    // --------------------------------------------------------------------------
    // WorkflowEngine Methods
    // --------------------------------------------------------------------------

    /**
     * Find or create a WorkflowInstance for a SurveyProject.
     *
     * If an instance already exists for the project, returns it.
     * Otherwise, creates a new one using the first active workflow
     * definition for the SurveyProject entity type.
     *
     * @param  int  $projectId  The SurveyProject ID.
     * @return WorkflowInstance|null The workflow instance, or null if no definition exists.
     */
    public function getWorkflowInstance(int $projectId): ?WorkflowInstance
    {
        // Check for existing instance
        $existing = WorkflowInstance::forEntity('SurveyProject', $projectId)
            ->whereIn('status', ['pending', 'active', 'suspended'])
            ->first();

        if ($existing) {
            return $existing;
        }

        // Try to find an active definition for SurveyProject
        $definition = WorkflowDefinition::active()
            ->forEntity('SurveyProject')
            ->latestVersion()
            ->first();

        if (! $definition) {
            return null;
        }

        $project = SurveyProject::find($projectId);
        if (! $project) {
            return null;
        }

        return WorkflowEngine::start($definition, $project, Auth::user());
    }

    /**
     * Advance a workflow instance by performing an action on the current step.
     *
     * @param  int  $instanceId  The workflow instance ID.
     * @param  string  $action  The action to perform (approve|defer|reject|skip|submit).
     * @param  string|null  $comment  An optional comment for the transition.
     */
    public function advanceWorkflow(int $instanceId, string $action, ?string $comment = null): void
    {
        $instance = WorkflowInstance::find($instanceId);
        if (! $instance) {
            Notification::make()
                ->title('Error')
                ->danger()
                ->body('Workflow instance not found.')
                ->send();
            return;
        }

        $actor = Auth::user();

        try {
            WorkflowEngine::advance($instance, $action, $comment, $actor);

            $actionLabel = ucfirst($action);
            Notification::make()
                ->title("Step {$actionLabel}")
                ->success()
                ->send();
        } catch (\InvalidArgumentException $e) {
            Notification::make()
                ->title('Cannot Advance Workflow')
                ->danger()
                ->body($e->getMessage())
                ->send();
        }
    }

    // --------------------------------------------------------------------------
    // Legacy ApprovalStep Methods (backward compatibility)
    // --------------------------------------------------------------------------

    /**
     * Mark an approval step as approved.
     *
     * If a workflow instance exists for the project, delegates to
     * WorkflowEngine. Otherwise, uses the legacy ApprovalStep logic.
     */
    public function markApproved(int $stepId): void
    {
        $step = ApprovalStep::findOrFail($stepId);
        $progress = $step->clientProjectProgress;

        // Check if a workflow instance exists for this project
        $workflowInstance = $progress ? $this->getWorkflowInstance($progress->survey_project_id) : null;

        if ($workflowInstance) {
            // Delegate to WorkflowEngine
            $this->advanceWorkflow($workflowInstance->id, 'approve');
            return;
        }

        // Legacy path
        $oldStatus = $step->status;

        $step->update([
            'status' => 'approved',
            'approved_at' => now(),
        ]);

        // Update parent progress percentage
        $this->updateProgressPercentage($step->client_project_progress_id);

        // Fire domain event
        EventStore::record(
            'approval.step_updated',
            $step->clientProjectProgress->client ?? Client::find($this->clientId),
            [
                'step_id' => $step->id,
                'institution' => $step->institution,
                'from_status' => $oldStatus,
                'to_status' => 'approved',
                'project_id' => $step->clientProjectProgress->survey_project_id,
            ],
            causer: Auth::user()
        );

        // Log to Spatie activity log
        activity()
            ->performedOn($step)
            ->causedBy(Auth::user())
            ->withProperties([
                'institution' => $step->institution,
                'from_status' => $oldStatus,
                'to_status' => 'approved',
            ])
            ->log("Approval step '{$step->institution}' marked as approved");

        Notification::make()
            ->title('Step Approved')
            ->success()
            ->body("{$step->institution} has been marked as approved.")
            ->send();
    }

    /**
     * Record a deferral for an approval step.
     *
     * If a workflow instance exists for the project, delegates to
     * WorkflowEngine. Otherwise, uses the legacy ApprovalStep logic.
     */
    public function recordDeferral(int $stepId, string $reason): void
    {
        $step = ApprovalStep::findOrFail($stepId);
        $progress = $step->clientProjectProgress;

        // Check if a workflow instance exists for this project
        $workflowInstance = $progress ? $this->getWorkflowInstance($progress->survey_project_id) : null;

        if ($workflowInstance) {
            // Delegate to WorkflowEngine
            $this->advanceWorkflow($workflowInstance->id, 'defer', $reason);
            return;
        }

        // Legacy path
        $oldStatus = $step->status;

        $step->update([
            'status' => 'deferred',
            'deferred_at' => now(),
            'deferred_reason' => $reason,
        ]);

        // Fire domain events
        EventStore::record(
            'approval.step_deferred',
            $step->clientProjectProgress->client ?? Client::find($this->clientId),
            [
                'step_id' => $step->id,
                'institution' => $step->institution,
                'from_status' => $oldStatus,
                'to_status' => 'deferred',
                'deferred_reason' => $reason,
                'project_id' => $step->clientProjectProgress->survey_project_id,
            ],
            causer: Auth::user()
        );

        // Log to Spatie activity log
        activity()
            ->performedOn($step)
            ->causedBy(Auth::user())
            ->withProperties([
                'institution' => $step->institution,
                'deferred_reason' => $reason,
            ])
            ->log("Approval step '{$step->institution}' deferred: {$reason}");

        // TODO: Send SMS to client about deferral (reuse MzoStageChanged notification pattern)

        Notification::make()
            ->title('Step Deferred')
            ->warning()
            ->body("{$step->institution} has been deferred. Reason: {$reason}")
            ->send();
    }

    /**
     * Start an approval workflow for a project that doesn't have one yet.
     *
     * If a workflow definition exists for SurveyProject, uses WorkflowEngine.
     * Otherwise, falls back to the legacy ClientProjectProgress + ApprovalStep
     * approach.
     */
    public function startWorkflow(int $projectId): void
    {
        // Try WorkflowEngine first
        $definition = WorkflowDefinition::active()
            ->forEntity('SurveyProject')
            ->latestVersion()
            ->first();

        if ($definition) {
            $project = SurveyProject::find($projectId);
            if ($project) {
                try {
                    WorkflowEngine::start($definition, $project, Auth::user());

                    Notification::make()
                        ->title('Approval Workflow Started')
                        ->success()
                        ->body('Workflow engine instance created for this project.')
                        ->send();
                    return;
                } catch (\InvalidArgumentException $e) {
                    Notification::make()
                        ->title('Error Starting Workflow')
                        ->danger()
                        ->body($e->getMessage())
                        ->send();
                    return;
                }
            }
        }

        // Legacy fallback — no workflow definition exists
        $progress = ClientProjectProgress::create([
            'survey_project_id' => $projectId,
            'client_id' => $this->clientId,
            'progress_percentage' => 0,
            'current_stage' => 'client_signed',
        ]);

        // Seed the 8 default approval steps
        ApprovalStep::seedDefaultSteps($progress);

        EventStore::record(
            'approval.workflow_started',
            Client::find($this->clientId),
            [
                'progress_id' => $progress->id,
                'project_id' => $projectId,
            ],
            causer: Auth::user()
        );

        Notification::make()
            ->title('Approval Workflow Started')
            ->success()
            ->send();
    }

    // --------------------------------------------------------------------------
    // Internal Helpers
    // --------------------------------------------------------------------------

    /**
     * Update the progress percentage based on approved steps.
     */
    protected function updateProgressPercentage(int $progressId): void
    {
        $progress = ClientProjectProgress::find($progressId);
        if (! $progress) {
            return;
        }

        $totalSteps = $progress->approvalSteps()->count();
        $approvedSteps = $progress->approvalSteps()->where('status', 'approved')->count();

        $percentage = $totalSteps > 0 ? round(($approvedSteps / $totalSteps) * 100, 2) : 0;

        $progress->update([
            'progress_percentage' => $percentage,
            'current_stage' => $progress->approvalSteps()
                ->where('status', '!=', 'approved')
                ->orderBy('step_order')
                ->first()?->institution ?? 'completed',
        ]);
    }

    public function render()
    {
        return view('livewire.client-workspace.approval-timeline-block');
    }
}
