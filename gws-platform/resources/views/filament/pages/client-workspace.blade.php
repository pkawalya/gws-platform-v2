<x-filament-panels::page>
    {{-- ──────────────────────────────────────────────
         Suspension Banner
         ────────────────────────────────────────────── --}}
    @if($client->lifecycle_state === 'suspended')
    <div class="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3 dark:bg-red-950 dark:border-red-800">
        <span class="text-xl">&#9888;&#65039;</span>
        <div>
            <span class="font-semibold text-red-800 dark:text-red-300">Account Suspended</span>
            <span class="text-red-700 dark:text-red-400 ml-2">Contact administrator for details</span>
        </div>
    </div>
    @endif

    {{-- ──────────────────────────────────────────────
         Bottleneck Banner — approval steps idle > 7 days
         ────────────────────────────────────────────── --}}
    @php
        $stalledSteps = \App\Models\ApprovalStep::where('status', 'submitted')
            ->where('submitted_at', '<', now()->subDays(7))
            ->whereHas('clientProjectProgress', fn($q) => $q->where('client_id', $client->id))
            ->count();
    @endphp
    @if($stalledSteps > 0)
    <div class="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-center gap-3 dark:bg-amber-950 dark:border-amber-800">
        <span class="text-xl">&#9888;&#65039;</span>
        <div>
            <span class="font-semibold text-amber-800 dark:text-amber-300">{{ $stalledSteps }} file(s) stalled</span>
            <span class="text-amber-700 dark:text-amber-400 ml-2">Approval step(s) idle for more than 7 days</span>
        </div>
    </div>
    @endif

    {{-- ──────────────────────────────────────────────
         Client Header — Sticky
         ────────────────────────────────────────────── --}}
    <div class="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 -mx-6 -mt-6 px-6 pt-6 pb-4 mb-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {{-- Left: Client Identity --}}
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 flex-wrap">
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white truncate">
                        {{ $client->full_name }}
                    </h1>
                    <span class="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {{ $client->client_number }}
                    </span>
                    @php
                        $lifecycleColors = [
                            'prospect' => 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
                            'active' => 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                            'dormant' => 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                            'suspended' => 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
                            'closed' => 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
                        ];
                        $lifecycleClass = $lifecycleColors[$client->lifecycle_state] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
                    @endphp
                    <span class="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold {{ $lifecycleClass }}">
                        {{ ucfirst($client->lifecycle_state) }}
                    </span>
                    @if($client->kyc_verified)
                        <span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
                            KYC Verified
                        </span>
                    @endif
                </div>
                <div class="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                    @if($client->phone)
                    <span class="flex items-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                        {{ $client->phone }}
                    </span>
                    @endif
                    @if($client->email)
                    <span class="flex items-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        {{ $client->email }}
                    </span>
                    @endif
                    @if($client->branch)
                    <span class="flex items-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                        {{ $client->branch?->name ?? '—' }}
                    </span>
                    @endif
                </div>
            </div>

            {{-- Right: Quick Actions --}}
            <div class="flex items-center gap-2 flex-wrap">
                <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-700 transition-colors"
                    wire:click="$dispatch('openSmsModal', { clientId: {{ $client->id }} })"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                    Send SMS
                </button>
                <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-700 transition-colors"
                    wire:click="$dispatch('openTaskModal', { clientId: {{ $client->id }} })"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    Add Task
                </button>
                <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-700 transition-colors"
                    wire:click="$dispatch('openNoteModal', { clientId: {{ $client->id }} })"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    Add Note
                </button>
                <a
                    href="{{ ClientResource::getUrl('edit', ['record' => $client]) }}"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    Edit Client
                </a>
            </div>
        </div>
    </div>

    {{-- ──────────────────────────────────────────────
         Tab Bar + Content Area (Alpine.js)
         ────────────────────────────────────────────── --}}
    <div x-data="{
        activeBlock: '{{ $activeBlock }}',
        blocks: [
            { key: 'approvals', icon: '&#128203;', label: 'Approvals' },
            { key: 'financial', icon: '&#128176;', label: 'Financial' },
            { key: 'documents', icon: '&#128193;', label: 'Documents' },
            { key: 'communications', icon: '&#128172;', label: 'Communications' },
            { key: 'spatial', icon: '&#128506;', label: 'Spatial' },
            { key: 'ai', icon: '&#129302;', label: 'AI Insights' },
        ],
        switchBlock(key) {
            this.activeBlock = key;
            const url = new URL(window.location);
            url.searchParams.set('block', key);
            history.pushState({}, '', url);
        }
    }">
        {{-- Tab Navigation --}}
        <div class="border-b border-gray-200 dark:border-gray-700 -mx-6 px-6 overflow-x-auto">
            <nav class="flex gap-1 min-w-max" role="tablist" aria-label="Client workspace sections">
                <template x-for="block in blocks" :key="block.key">
                    <button
                        type="button"
                        role="tab"
                        :aria-selected="activeBlock === block.key"
                        :aria-controls="'panel-' + block.key"
                        @click="switchBlock(block.key)"
                        :class="activeBlock === block.key
                            ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
                        class="inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors"
                    >
                        <span x-text="block.icon" class="text-base"></span>
                        <span x-text="block.label"></span>
                    </button>
                </template>
            </nav>
        </div>

        {{-- Tab Content Panels --}}
        <div class="mt-6">
            {{-- Approvals Block --}}
            <div
                x-show="activeBlock === 'approvals'"
                x-transition:enter="transition ease-out duration-200"
                x-transition:enter-start="opacity-0 translate-y-1"
                x-transition:enter-end="opacity-100 translate-y-0"
                x-transition:leave="transition ease-in duration-150"
                x-transition:leave-start="opacity-100 translate-y-0"
                x-transition:leave-end="opacity-0 translate-y-1"
                id="panel-approvals"
                role="tabpanel"
                aria-labelledby="tab-approvals"
            >
                <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Approval Pipeline</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Track and manage approval steps for this client's loan applications and project progress.
                    </p>
                    <livewire:client-workspace.approval-timeline-block :client-id="$client->id" :key="'approvals-' . $client->id" />
                </div>
            </div>

            {{-- Financial Block --}}
            <div
                x-show="activeBlock === 'financial'"
                x-transition:enter="transition ease-out duration-200"
                x-transition:enter-start="opacity-0 translate-y-1"
                x-transition:enter-end="opacity-100 translate-y-0"
                x-transition:leave="transition ease-in duration-150"
                x-transition:leave-start="opacity-100 translate-y-0"
                x-transition:leave-end="opacity-0 translate-y-1"
                id="panel-financial"
                role="tabpanel"
                aria-labelledby="tab-financial"
            >
                <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Summary</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Loans, repayments, savings, and transaction history for this client.
                    </p>
                    <div class="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <p class="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">Financial summary component</p>
                        <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Will be wired to <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">livewire:client-financial-summary</code></p>
                    </div>
                </div>
            </div>

            {{-- Documents Block --}}
            <div
                x-show="activeBlock === 'documents'"
                x-transition:enter="transition ease-out duration-200"
                x-transition:enter-start="opacity-0 translate-y-1"
                x-transition:enter-end="opacity-100 translate-y-0"
                x-transition:leave="transition ease-in duration-150"
                x-transition:leave-start="opacity-100 translate-y-0"
                x-transition:leave-end="opacity-0 translate-y-1"
                id="panel-documents"
                role="tabpanel"
                aria-labelledby="tab-documents"
            >
                <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Documents</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Uploaded files, KYC documents, and supporting materials for this client.
                    </p>
                    <div class="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                        <p class="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">Documents manager component</p>
                        <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Will be wired to <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">livewire:client-documents-manager</code></p>
                    </div>
                </div>
            </div>

            {{-- Communications Block --}}
            <div
                x-show="activeBlock === 'communications'"
                x-transition:enter="transition ease-out duration-200"
                x-transition:enter-start="opacity-0 translate-y-1"
                x-transition:enter-end="opacity-100 translate-y-0"
                x-transition:leave="transition ease-in duration-150"
                x-transition:leave-start="opacity-100 translate-y-0"
                x-transition:leave-end="opacity-0 translate-y-1"
                id="panel-communications"
                role="tabpanel"
                aria-labelledby="tab-communications"
            >
                <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Communications</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        SMS history, call logs, and notes exchanged with this client.
                    </p>
                    <div class="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                        <p class="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">Communications log component</p>
                        <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Will be wired to <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">livewire:client-communications-log</code></p>
                    </div>
                </div>
            </div>

            {{-- Spatial Block --}}
            <div
                x-show="activeBlock === 'spatial'"
                x-transition:enter="transition ease-out duration-200"
                x-transition:enter-start="opacity-0 translate-y-1"
                x-transition:enter-end="opacity-100 translate-y-0"
                x-transition:leave="transition ease-in duration-150"
                x-transition:leave-start="opacity-100 translate-y-0"
                x-transition:leave-end="opacity-0 translate-y-1"
                id="panel-spatial"
                role="tabpanel"
                aria-labelledby="tab-spatial"
            >
                <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Spatial Data</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Geolocation, mapped assets, field visit routes, and spatial analytics for this client.
                    </p>
                    <div class="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <p class="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">Spatial map component</p>
                        <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Will be wired to <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">livewire:client-spatial-map</code></p>
                    </div>
                </div>
            </div>

            {{-- AI Insights Block --}}
            <div
                x-show="activeBlock === 'ai'"
                x-transition:enter="transition ease-out duration-200"
                x-transition:enter-start="opacity-0 translate-y-1"
                x-transition:enter-end="opacity-100 translate-y-0"
                x-transition:leave="transition ease-in duration-150"
                x-transition:leave-start="opacity-100 translate-y-0"
                x-transition:leave-end="opacity-0 translate-y-1"
                id="panel-ai"
                role="tabpanel"
                aria-labelledby="tab-ai"
            >
                <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Insights</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        AI-generated recommendations, risk assessments, and next-best-action suggestions for this client.
                    </p>
                    <div class="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/></svg>
                        <p class="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">AI insights component</p>
                        <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Will be wired to <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">livewire:client-ai-insights</code></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-filament-panels::page>
