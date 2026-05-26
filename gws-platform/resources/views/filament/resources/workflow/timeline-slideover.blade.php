<div class="space-y-4 p-4">
    @forelse($transitions as $transition)
        <div class="flex gap-3 items-start">
            {{-- Timeline dot --}}
            <div class="flex-shrink-0 mt-1">
                @php
                    $dotColor = match($transition->to_status) {
                        'approved' => 'bg-green-500',
                        'submitted' => 'bg-blue-500',
                        'deferred' => 'bg-amber-500',
                        'rejected' => 'bg-red-500',
                        'skipped' => 'bg-gray-400',
                        'pending' => 'bg-gray-300',
                        default => 'bg-gray-300',
                    };
                @endphp
                <div class="w-3 h-3 rounded-full {{ $dotColor }}"></div>
            </div>

            {{-- Timeline content --}}
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {{ $transition->step?->name ?? 'Unknown Step' }}
                    </span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                        {{ match($transition->action) {
                            'approve' => 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                            'defer' => 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
                            'reject' => 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                            'skip' => 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
                            'submit' => 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                            'escalate' => 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                            'reopen' => 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                            default => 'bg-gray-100 text-gray-800',
                        }}">
                        {{ ucfirst($transition->action) }}
                    </span>
                </div>

                <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {{ ucfirst($transition->from_status) }} → {{ ucfirst($transition->to_status) }}
                </div>

                @if($transition->comment)
                    <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {{ $transition->comment }}
                    </p>
                @endif

                <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {{ $transition->transitioned_at?->format('M j, Y H:i') }}
                    @if($transition->actor_type)
                        · by {{ class_basename($transition->actor_type) }}{{ $transition->actor_id ? " #{$transition->actor_id}" : '' }}
                    @endif
                </div>
            </div>
        </div>
    @empty
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No transitions recorded yet.</p>
        </div>
    @endforelse
</div>
