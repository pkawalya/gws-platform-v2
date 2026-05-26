@php
use App\Models\ApprovalStep;
use App\Services\WorkflowEngine;

$progressRecords = $this->progressRecords;
$workflowInstances = $this->workflowInstances;
$institutionLabels = ApprovalStep::DEFAULT_STEPS;
@endphp

<div>
    {{-- Workflow Engine Instances --}}
    @foreach($workflowInstances as $instance)
        @php
            $definition = $instance->definition;
            $steps = $definition?->steps()->ordered()->get() ?? collect();
            $progress = WorkflowEngine::calculateProgress($instance);
            $currentStep = $instance->currentStep;
            $approvedCount = $instance->transitions()->where('to_status', 'approved')->count();
        @endphp

        <div class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {{-- Card Header --}}
            <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {{ $definition?->name ?? 'Workflow' }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ $instance->entity_type }} #{{ $instance->entity_id }}
                        · <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
                            {{ match($instance->status) {
                                'pending' => 'bg-yellow-100 text-yellow-800',
                                'active' => 'bg-green-100 text-green-800',
                                'completed' => 'bg-blue-100 text-blue-800',
                                'cancelled' => 'bg-red-100 text-red-800',
                                'suspended' => 'bg-gray-100 text-gray-800',
                                default => 'bg-gray-100 text-gray-800',
                            }}">
                            {{ ucfirst($instance->status) }}
                        </span>
                        @if($instance->is_overdue)
                            <span class="ml-1 text-red-600 font-semibold text-xs">⚠ OVERDUE</span>
                        @endif
                    </p>
                </div>
                <div class="text-right">
                    <span class="text-2xl font-bold {{ $progress >= 100 ? 'text-green-600' : 'text-blue-600' }}">
                        {{ number_format($progress, 0) }}%
                    </span>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ $approvedCount }} of {{ $steps->count() }} approved
                    </p>
                </div>
            </div>

            {{-- Step Timeline --}}
            <div class="p-4">
                {{-- Desktop: Horizontal Timeline --}}
                <div class="hidden md:flex items-start justify-between gap-1">
                    @foreach($steps as $step)
                        @php
                            $stepTransition = $instance->transitions()
                                ->where('workflow_step_id', $step->id)
                                ->orderByDesc('transitioned_at')
                                ->first();
                            $stepStatus = $stepTransition?->to_status ?? 'pending';
                            $stepColor = match($stepStatus) {
                                'approved' => 'bg-green-500 border-green-600 text-white',
                                'submitted' => 'bg-blue-500 border-blue-600 text-white',
                                'deferred' => 'bg-amber-500 border-amber-600 text-white',
                                'rejected' => 'bg-red-500 border-red-600 text-white',
                                'skipped' => 'bg-gray-400 border-gray-500 text-white',
                                default => 'bg-gray-200 border-gray-300 text-gray-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300',
                            };
                            $isCurrentStep = $currentStep && $step->id === $currentStep->id;
                            $daysSince = $stepTransition?->transitioned_at?->diffInDays(now());
                            $isStalled = $daysSince && $daysSince > 7 && in_array($stepStatus, ['submitted', 'pending']);
                        @endphp

                        <div class="flex-1 text-center min-w-0">
                            <div class="mx-auto w-8 h-8 rounded-full border-2 {{ $stepColor }} flex items-center justify-center text-xs font-bold mb-1
                                {{ $isCurrentStep ? 'ring-2 ring-offset-2 ring-blue-400' : '' }}">
                                @if($stepStatus === 'approved') ✓ @elseif($stepStatus === 'skipped') ⊘ @else {{ $step->step_order }} @endif
                            </div>
                            <p class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                {{ \Illuminate\Support\Str::limit($step->name, 15) }}
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                @if($stepStatus === 'approved' && $stepTransition?->transitioned_at)
                                    {{ $stepTransition->transitioned_at->format('M j') }}
                                @elseif(in_array($stepStatus, ['submitted', 'pending']))
                                    @if($isStalled)
                                        <span class="text-red-600 font-semibold">{{ $daysSince }}d</span>
                                    @elseif($daysSince)
                                        {{ $daysSince }}d
                                    @else —
                                    @endif
                                @elseif($stepStatus === 'deferred')
                                    <span class="text-amber-600">Deferred</span>
                                @elseif($stepStatus === 'rejected')
                                    <span class="text-red-600">Rejected</span>
                                @else —
                                @endif
                            </p>
                            @if($isCurrentStep && in_array($instance->status, ['pending', 'active']))
                                <div class="mt-1 flex gap-1 justify-center">
                                    <button wire:click="advanceWorkflow({{ $instance->id }}, 'approve')"
                                        wire:confirm="Mark as approved?"
                                        class="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200">
                                        ✓
                                    </button>
                                    <button wire:click="advanceWorkflow({{ $instance->id }}, 'defer', 'Needs review')"
                                        class="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded hover:bg-amber-200">
                                        ⚠
                                    </button>
                                </div>
                            @endif
                        </div>
                    @endforeach
                </div>

                {{-- Mobile: Vertical Timeline --}}
                <div class="md:hidden space-y-3">
                    @foreach($steps as $step)
                        @php
                            $stepTransition = $instance->transitions()
                                ->where('workflow_step_id', $step->id)
                                ->orderByDesc('transitioned_at')
                                ->first();
                            $stepStatus = $stepTransition?->to_status ?? 'pending';
                            $borderColor = match($stepStatus) {
                                'approved' => 'border-green-500',
                                'submitted' => 'border-blue-500',
                                'deferred' => 'border-amber-500',
                                'rejected' => 'border-red-500',
                                'skipped' => 'border-gray-400',
                                default => 'border-gray-300',
                            };
                        @endphp
                        <div class="border-l-4 {{ $borderColor }} pl-3 py-2">
                            <p class="font-medium text-sm text-gray-900 dark:text-gray-100">
                                {{ $step->step_order }}. {{ $step->name }}
                            </p>
                            <p class="text-xs text-gray-500">
                                {{ ucfirst($stepStatus) }}
                                @if($stepStatus === 'deferred' && $stepTransition?->comment)
                                    · {{ $stepTransition->comment }}
                                @endif
                            </p>
                        </div>
                    @endforeach
                </div>
            </div>
        </div>
    @endforeach

    {{-- Legacy Approval Steps (backward compatibility) --}}
    @forelse($progressRecords as $progress)
        @php
            // Skip if this project already has a workflow instance
            $hasWorkflowInstance = $workflowInstances->where('entity_id', $progress->survey_project_id)->isNotEmpty();
        @endphp

        @if(!$hasWorkflowInstance)
            <div class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {{-- Card Header --}}
                <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {{ $progress->surveyProject?->project_number ?? 'Unknown Project' }}
                        </h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            {{ $progress->surveyProject?->project_type ?? '' }}
                            @if($progress->surveyProject?->district)
                                · {{ $progress->surveyProject->district }}
                            @endif
                        </p>
                    </div>
                    <div class="text-right">
                        <span class="text-2xl font-bold {{ $progress->progress_percentage >= 100 ? 'text-green-600' : 'text-blue-600' }}">
                            {{ number_format($progress->progress_percentage, 0) }}%
                        </span>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            {{ $progress->approvalSteps()->where('status', 'approved')->count() }} of {{ $progress->approvalSteps()->count() }} approved
                        </p>
                    </div>
                </div>

                {{-- 8-Step Timeline --}}
                <div class="p-4">
                    {{-- Desktop: Horizontal Timeline --}}
                    <div class="hidden md:flex items-start justify-between gap-1">
                        @foreach($progress->approvalSteps->sortBy('step_order') as $step)
                            @php
                                $stepColor = match($step->status) {
                                    'approved' => 'bg-green-500 border-green-600 text-white',
                                    'submitted' => 'bg-blue-500 border-blue-600 text-white',
                                    'deferred' => 'bg-amber-500 border-amber-600 text-white',
                                    default => 'bg-gray-200 border-gray-300 text-gray-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300',
                                };
                                $daysSince = $step->submitted_at ? $step->submitted_at->diffInDays(now()) : null;
                                $isStalled = $daysSince && $daysSince > 7 && $step->status === 'submitted';
                            @endphp

                            <div class="flex-1 text-center min-w-0">
                                <div class="mx-auto w-8 h-8 rounded-full border-2 {{ $stepColor }} flex items-center justify-center text-xs font-bold mb-1">
                                    @if($step->status === 'approved') ✓ @else {{ $step->step_order }} @endif
                                </div>
                                <p class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                    {{ \Illuminate\Support\Str::limit($institutionLabels[$step->step_order - 1] ?? $step->institution, 15) }}
                                </p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">
                                    @if($step->status === 'approved' && $step->approved_at)
                                        {{ $step->approved_at->format('M j') }}
                                    @elseif($step->status === 'submitted')
                                        @if($isStalled)
                                            <span class="text-red-600 font-semibold">{{ $daysSince }}d</span>
                                        @else
                                            {{ $daysSince }}d
                                        @endif
                                    @elseif($step->status === 'deferred')
                                        <span class="text-amber-600">Deferred</span>
                                    @else — @endif
                                </p>
                                @if($step->status !== 'approved')
                                    <div class="mt-1 flex gap-1 justify-center">
                                        @if($step->status === 'submitted')
                                            <button wire:click="markApproved({{ $step->id }})"
                                                wire:confirm="Mark as approved?"
                                                class="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200">
                                                ✓
                                            </button>
                                        @endif
                                        <button wire:click="recordDeferral({{ $step->id }}, 'Needs review')"
                                            class="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded hover:bg-amber-200">
                                            ⚠
                                        </button>
                                    </div>
                                @endif
                            </div>
                        @endforeach
                    </div>

                    {{-- Mobile: Vertical Timeline --}}
                    <div class="md:hidden space-y-3">
                        @foreach($progress->approvalSteps->sortBy('step_order') as $step)
                            @php
                                $borderColor = match($step->status) {
                                    'approved' => 'border-green-500',
                                    'submitted' => 'border-blue-500',
                                    'deferred' => 'border-amber-500',
                                    default => 'border-gray-300',
                                };
                            @endphp
                            <div class="border-l-4 {{ $borderColor }} pl-3 py-2">
                                <p class="font-medium text-sm text-gray-900 dark:text-gray-100">
                                    {{ $step->step_order }}. {{ $institutionLabels[$step->step_order - 1] ?? $step->institution }}
                                </p>
                                <p class="text-xs text-gray-500">
                                    {{ ucfirst($step->status) }}
                                    @if($step->status === 'deferred' && $step->deferred_reason)
                                        · {{ $step->deferred_reason }}
                                    @endif
                                </p>
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>
        @endif
    @empty
        {{-- Only show empty state if there are no workflow instances either --}}
        @if($workflowInstances->isEmpty())
            <div class="text-center py-12">
                <div class="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <span class="text-2xl">📋</span>
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">No approval workflows started yet</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Start an approval workflow to track progress.</p>
            </div>
        @endif
    @endforelse

    {{-- Show empty state if only workflow instances exist but none are there --}}
    @if($progressRecords->isEmpty() && $workflowInstances->isEmpty())
        <div class="text-center py-12">
            <div class="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <span class="text-2xl">📋</span>
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">No approval workflows started yet</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Start an approval workflow to track progress.</p>
        </div>
    @endif
</div>
