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

        <div class="mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {{-- Card Header --}}
            <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl {{ match($instance->status) {
                        'pending' => 'bg-amber-100 dark:bg-amber-900/30',
                        'active' => 'bg-emerald-100 dark:bg-emerald-900/30',
                        'completed' => 'bg-blue-100 dark:bg-blue-900/30',
                        'cancelled' => 'bg-red-100 dark:bg-red-900/30',
                        'suspended' => 'bg-gray-100 dark:bg-gray-700',
                        default => 'bg-gray-100 dark:bg-gray-700',
                    }} flex items-center justify-center">
                        <svg class="w-5 h-5 {{ match($instance->status) {
                            'pending' => 'text-amber-600 dark:text-amber-400',
                            'active' => 'text-emerald-600 dark:text-emerald-400',
                            'completed' => 'text-blue-600 dark:text-blue-400',
                            'cancelled' => 'text-red-600 dark:text-red-400',
                            'suspended' => 'text-gray-500 dark:text-gray-400',
                            default => 'text-gray-500 dark:text-gray-400',
                        }}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">
                            {{ $definition?->name ?? 'Workflow' }}
                        </h3>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-xs text-gray-500 dark:text-gray-400">
                                {{ $instance->entity_type }} #{{ $instance->entity_id }}
                            </span>
                            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold
                                {{ match($instance->status) {
                                    'pending' => 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                                    'active' => 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                                    'completed' => 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                                    'cancelled' => 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                                    'suspended' => 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
                                    default => 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
                                }}">
                                {{ ucfirst($instance->status) }}
                            </span>
                            @if($instance->is_overdue)
                                <span class="text-red-600 font-bold text-xs">OVERDUE</span>
                            @endif
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-2xl font-bold {{ $progress >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400' }}">
                        {{ number_format($progress, 0) }}%
                    </span>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ $approvedCount }} of {{ $steps->count() }} approved
                    </p>
                </div>
            </div>

            {{-- Progress Bar --}}
            <div class="px-5 pt-4">
                <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div class="h-2 rounded-full transition-all duration-700 {{ $progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500' }}"
                         style="width: {{ min($progress, 100) }}%"></div>
                </div>
            </div>

            {{-- Step Timeline --}}
            <div class="p-5">
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
                                'approved' => 'bg-emerald-500 border-emerald-600 text-white',
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
                            <div class="mx-auto w-9 h-9 rounded-xl border-2 {{ $stepColor }} flex items-center justify-center text-xs font-bold mb-1.5
                                {{ $isCurrentStep ? 'ring-2 ring-offset-2 ring-blue-400' : '' }}">
                                @if($stepStatus === 'approved') ✓ @elseif($stepStatus === 'skipped') ⊘ @else {{ $step->step_order }} @endif
                            </div>
                            <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                                {{ \Illuminate\Support\Str::limit($step->name, 15) }}
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                @if($stepStatus === 'approved' && $stepTransition?->transitioned_at)
                                    {{ $stepTransition->transitioned_at->format('M j') }}
                                @elseif(in_array($stepStatus, ['submitted', 'pending']))
                                    @if($isStalled)
                                        <span class="text-red-600 font-bold">{{ $daysSince }}d</span>
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
                                <div class="mt-1.5 flex gap-1 justify-center">
                                    <button wire:click="advanceWorkflow({{ $instance->id }}, 'approve')"
                                        wire:confirm="Mark as approved?"
                                        class="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-200 dark:border-emerald-800">
                                        Approve
                                    </button>
                                    <button wire:click="advanceWorkflow({{ $instance->id }}, 'defer', 'Needs review')"
                                        class="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors border border-amber-200 dark:border-amber-800">
                                        Defer
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
                                'approved' => 'border-l-emerald-500',
                                'submitted' => 'border-l-blue-500',
                                'deferred' => 'border-l-amber-500',
                                'rejected' => 'border-l-red-500',
                                'skipped' => 'border-l-gray-400',
                                default => 'border-l-gray-300',
                            };
                        @endphp
                        <div class="border-l-4 {{ $borderColor }} pl-3 py-2">
                            <p class="font-medium text-sm text-gray-900 dark:text-gray-100">
                                {{ $step->step_order }}. {{ $step->name }}
                            </p>
                            <p class="text-xs text-gray-500">
                                {{ ucfirst($stepStatus) }}
                                @if($stepStatus === 'deferred' && $stepTransition?->comment)
                                    &middot; {{ $stepTransition->comment }}
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
            $hasWorkflowInstance = $workflowInstances->where('entity_id', $progress->survey_project_id)->isNotEmpty();
        @endphp

        @if(!$hasWorkflowInstance)
            <div class="mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {{-- Card Header --}}
                <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">
                            {{ $progress->surveyProject?->project_number ?? 'Unknown Project' }}
                        </h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {{ $progress->surveyProject?->project_type ?? '' }}
                            @if($progress->surveyProject?->district)
                                &middot; {{ $progress->surveyProject->district }}
                            @endif
                        </p>
                    </div>
                    <div class="text-right">
                        <span class="text-2xl font-bold {{ $progress->progress_percentage >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400' }}">
                            {{ number_format($progress->progress_percentage, 0) }}%
                        </span>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            {{ $progress->approvalSteps()->where('status', 'approved')->count() }} of {{ $progress->approvalSteps()->count() }} approved
                        </p>
                    </div>
                </div>

                {{-- 8-Step Timeline --}}
                <div class="p-5">
                    {{-- Desktop: Horizontal Timeline --}}
                    <div class="hidden md:flex items-start justify-between gap-1">
                        @foreach($progress->approvalSteps->sortBy('step_order') as $step)
                            @php
                                $stepColor = match($step->status) {
                                    'approved' => 'bg-emerald-500 border-emerald-600 text-white',
                                    'submitted' => 'bg-blue-500 border-blue-600 text-white',
                                    'deferred' => 'bg-amber-500 border-amber-600 text-white',
                                    default => 'bg-gray-200 border-gray-300 text-gray-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300',
                                };
                                $daysSince = $step->submitted_at ? $step->submitted_at->diffInDays(now()) : null;
                                $isStalled = $daysSince && $daysSince > 7 && $step->status === 'submitted';
                            @endphp

                            <div class="flex-1 text-center min-w-0">
                                <div class="mx-auto w-9 h-9 rounded-xl border-2 {{ $stepColor }} flex items-center justify-center text-xs font-bold mb-1.5">
                                    @if($step->status === 'approved') ✓ @else {{ $step->step_order }} @endif
                                </div>
                                <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                                    {{ \Illuminate\Support\Str::limit($institutionLabels[$step->step_order - 1] ?? $step->institution, 15) }}
                                </p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">
                                    @if($step->status === 'approved' && $step->approved_at)
                                        {{ $step->approved_at->format('M j') }}
                                    @elseif($step->status === 'submitted')
                                        @if($isStalled)
                                            <span class="text-red-600 font-bold">{{ $daysSince }}d</span>
                                        @else
                                            {{ $daysSince }}d
                                        @endif
                                    @elseif($step->status === 'deferred')
                                        <span class="text-amber-600">Deferred</span>
                                    @else — @endif
                                </p>
                                @if($step->status !== 'approved')
                                    <div class="mt-1.5 flex gap-1 justify-center">
                                        @if($step->status === 'submitted')
                                            <button wire:click="markApproved({{ $step->id }})"
                                                wire:confirm="Mark as approved?"
                                                class="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-200 dark:border-emerald-800">
                                                Approve
                                            </button>
                                        @endif
                                        <button wire:click="recordDeferral({{ $step->id }}, 'Needs review')"
                                            class="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors border border-amber-200 dark:border-amber-800">
                                            Defer
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
                                    'approved' => 'border-l-emerald-500',
                                    'submitted' => 'border-l-blue-500',
                                    'deferred' => 'border-l-amber-500',
                                    default => 'border-l-gray-300',
                                };
                            @endphp
                            <div class="border-l-4 {{ $borderColor }} pl-3 py-2">
                                <p class="font-medium text-sm text-gray-900 dark:text-gray-100">
                                    {{ $step->step_order }}. {{ $institutionLabels[$step->step_order - 1] ?? $step->institution }}
                                </p>
                                <p class="text-xs text-gray-500">
                                    {{ ucfirst($step->status) }}
                                    @if($step->status === 'deferred' && $step->deferred_reason)
                                        &middot; {{ $step->deferred_reason }}
                                    @endif
                                </p>
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>
        @endif
    @empty
        @if($workflowInstances->isEmpty())
            <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600">
                <div class="mx-auto w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4">
                    <svg class="w-7 h-7 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                </div>
                <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">No approval workflows started yet</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Start an approval workflow to track progress.</p>
            </div>
        @endif
    @endforelse

    @if($progressRecords->isEmpty() && $workflowInstances->isEmpty())
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600">
            <div class="mx-auto w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4">
                <svg class="w-7 h-7 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">No approval workflows started yet</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Start an approval workflow to track progress.</p>
        </div>
    @endif
</div>
