<?php

namespace App\Livewire\ClientWorkspace;

use App\Models\ApprovalStep;
use App\Models\Client;
use App\Models\ClientProjectProgress;
use App\Services\EventStore;
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
 */
class ApprovalTimelineBlock extends Component
{
    #[Locked]
    public int $clientId;

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
     * Mark an approval step as approved.
     */
    public function markApproved(int $stepId): void
    {
        $step = ApprovalStep::findOrFail($stepId);
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
     */
    public function recordDeferral(int $stepId, string $reason): void
    {
        $step = ApprovalStep::findOrFail($stepId);
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
     */
    public function startWorkflow(int $projectId): void
    {
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

    /**
     * Update the progress percentage based on approved steps.
     */
    protected function updateProgressPercentage(int $progressId): void
    {
        $progress = ClientProjectProgress::find($progressId);
        if (!$progress) return;

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
