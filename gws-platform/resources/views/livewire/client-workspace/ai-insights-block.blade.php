@php
$recentCalls = $this->recentAiCalls;
$insightTypes = $this->insightTypes();
@endphp

<div>
    {{-- Generate Insight Section --}}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Generate AI Insight</h3>
        </div>
        <div class="p-4">
            <div class="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                <div class="flex-1 w-full">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Insight Type</label>
                    <select wire:model="insightType"
                        class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        @foreach($insightTypes as $key => $label)
                            <option value="{{ $key }}">{{ $label }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="flex-shrink-0">
                    <button wire:click="generateInsight"
                        wire:loading.attr="disabled"
                        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg wire:loading.remove wire:target="generateInsight" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        <svg wire:loading wire:target="generateInsight" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span wire:loading.remove wire:target="generateInsight">Generate</span>
                        <span wire:loading wire:target="generateInsight">Generating...</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    {{-- Generated Insight Display --}}
    @if($generatedInsight)
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
            <div class="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Latest Insight</h3>
                    <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {{ $insightTypes[$insightType] ?? ucfirst(str_replace('_', ' ', $insightType)) }}
                    </span>
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ now()->format('M j, Y \a\t g:i A') }}</span>
            </div>
            <div class="p-4">
                <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{{ $generatedInsight }}</p>
            </div>
        </div>
    @endif

    {{-- AI Call History --}}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Call History</h3>
        </div>

        @if($recentCalls->isNotEmpty())
            {{-- Desktop: Table --}}
            <div class="hidden md:block overflow-x-auto">
                <table class="w-full text-sm text-left">
                    <thead class="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="px-4 py-3 font-medium">Type</th>
                            <th class="px-4 py-3 font-medium">Model</th>
                            <th class="px-4 py-3 font-medium">Tokens</th>
                            <th class="px-4 py-3 font-medium">Latency</th>
                            <th class="px-4 py-3 font-medium">Confidence</th>
                            <th class="px-4 py-3 font-medium">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($recentCalls as $call)
                            @php
                                $promptKey = $call->promptTemplate?->key ?? $call->input_prompt
                                    ? \Illuminate\Support\Str::limit($call->input_prompt, 30)
                                    : 'Ad-hoc';
                            @endphp
                            <tr class="border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td class="px-4 py-3">
                                    <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                        {{ $promptKey }}
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
                                    {{ $call->aiModelVersion?->model_name ?? 'Unknown' }}
                                </td>
                                <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
                                    @if($call->input_tokens || $call->output_tokens)
                                        <span class="font-medium">{{ number_format($call->totalTokens()) }}</span>
                                        <span class="text-xs text-gray-500 dark:text-gray-400">({{ number_format($call->input_tokens ?? 0) }}/{{ number_format($call->output_tokens ?? 0) }})</span>
                                    @else
                                        <span class="text-gray-400 dark:text-gray-500">--</span>
                                    @endif
                                </td>
                                <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
                                    @if($call->latency_ms)
                                        <span class="{{ $call->latency_ms > 5000 ? 'text-amber-600 dark:text-amber-400' : '' }}">
                                            {{ number_format($call->latency_ms) }}ms
                                        </span>
                                    @else
                                        <span class="text-gray-400 dark:text-gray-500">--</span>
                                    @endif
                                </td>
                                <td class="px-4 py-3">
                                    @php
                                        $confidence = null;
                                        // Confidence may be stored in metadata or parsed from response
                                    @endphp
                                    <span class="text-gray-400 dark:text-gray-500">--</span>
                                </td>
                                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                                    {{ $call->created_at?->format('M j, Y \a\t g:i A') ?? '--' }}
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>

            {{-- Mobile: Card List --}}
            <div class="md:hidden">
                @foreach($recentCalls as $call)
                    @php
                        $promptKey = $call->promptTemplate?->key ?? $call->input_prompt
                            ? \Illuminate\Support\Str::limit($call->input_prompt, 30)
                            : 'Ad-hoc';
                    @endphp
                    <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                        <div class="flex items-center justify-between mb-1">
                            <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                {{ $promptKey }}
                            </span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">
                                {{ $call->created_at?->format('M j') ?? '--' }}
                            </span>
                        </div>
                        <p class="text-sm text-gray-700 dark:text-gray-300">
                            {{ $call->aiModelVersion?->model_name ?? 'Unknown' }}
                            &middot;
                            @if($call->latency_ms)
                                {{ number_format($call->latency_ms) }}ms
                            @else
                                --
                            @endif
                            &middot;
                            @if($call->input_tokens || $call->output_tokens)
                                {{ number_format($call->totalTokens()) }} tokens
                            @else
                                -- tokens
                            @endif
                        </p>
                    </div>
                @endforeach
            </div>
        @else
            {{-- Empty State --}}
            <div class="text-center py-12">
                <div class="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">No AI insights yet</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Generate your first AI insight to get started.</p>
                <button wire:click="generateInsight"
                    class="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    Generate First Insight
                </button>
            </div>
        @endif
    </div>
</div>
