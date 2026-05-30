<x-filament-panels::page>
    @php
        $client = $this->client;
        $initials = collect(explode(' ', $client->full_name ?? ''))
            ->filter()
            ->take(2)
            ->map(fn($w) => strtoupper($w[0]))
            ->implode('');
        $lifecycleColors = [
            'prospect' => ['bg' => 'bg-sky-50', 'text' => 'text-sky-700', 'border' => 'border-sky-200', 'dot' => 'bg-sky-500', 'dark_bg' => 'dark:bg-sky-900/30', 'dark_text' => 'dark:text-sky-300', 'dark_border' => 'dark:border-sky-800'],
            'active' => ['bg' => 'bg-emerald-50', 'text' => 'text-emerald-700', 'border' => 'border-emerald-200', 'dot' => 'bg-emerald-500', 'dark_bg' => 'dark:bg-emerald-900/30', 'dark_text' => 'dark:text-emerald-300', 'dark_border' => 'dark:border-emerald-800'],
            'dormant' => ['bg' => 'bg-gray-50', 'text' => 'text-gray-600', 'border' => 'border-gray-200', 'dot' => 'bg-gray-400', 'dark_bg' => 'dark:bg-gray-800', 'dark_text' => 'dark:text-gray-300', 'dark_border' => 'dark:border-gray-700'],
            'suspended' => ['bg' => 'bg-red-50', 'text' => 'text-red-700', 'border' => 'border-red-200', 'dot' => 'bg-red-500', 'dark_bg' => 'dark:bg-red-900/30', 'dark_text' => 'dark:text-red-300', 'dark_border' => 'dark:border-red-800'],
            'closed' => ['bg' => 'bg-slate-50', 'text' => 'text-slate-500', 'border' => 'border-slate-200', 'dot' => 'bg-slate-400', 'dark_bg' => 'dark:bg-slate-800', 'dark_text' => 'dark:text-slate-400', 'dark_border' => 'dark:border-slate-700'],
        ];
        $lc = $lifecycleColors[$client->lifecycle_state] ?? $lifecycleColors['prospect'];
        $projectCount = $client->surveyProjects()->count();
        $activeProjectCount = $client->surveyProjects()->whereIn('status', ['active', 'in_progress', 'surveying'])->count();
        $invoiceCount = $client->invoices()->count();
        $outstandingAmount = $client->invoices()->whereNotIn('status', ['paid', 'cancelled', 'draft'])->sum('amount_due');
        $documentCount = $client->documents()->count();
    @endphp

    {{-- ──────────────────────────────────────────────
         Suspension Banner
         ────────────────────────────────────────────── --}}
    @if($client->lifecycle_state === 'suspended')
    <div class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
            <svg class="w-4.5 h-4.5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
        </div>
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
    <div class="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-r-lg flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
            <svg class="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div>
            <span class="font-semibold text-amber-800 dark:text-amber-300">{{ $stalledSteps }} file(s) stalled</span>
            <span class="text-amber-700 dark:text-amber-400 ml-2">Approval step(s) idle for more than 7 days</span>
        </div>
    </div>
    @endif

    {{-- ──────────────────────────────────────────────
         Client Profile Header
         ────────────────────────────────────────────── --}}
    <div class="mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {{-- Gradient Banner --}}
        <div class="h-28 bg-gradient-to-r from-primary-600 via-primary-500 to-amber-500 relative">
            <div class="absolute inset-0 opacity-10" style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;40&quot; height=&quot;40&quot; viewBox=&quot;0 0 40 40&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;%23fff&quot; fill-opacity=&quot;1&quot; fill-rule=&quot;evenodd&quot;%3E%3Cpath d=&quot;M0 40L40 0H20L0 20M40 40V20L20 40&quot;/%3E%3C/g%3E%3C/svg%3E');"></div>
        </div>

        {{-- Profile Content --}}
        <div class="px-6 pb-6 -mt-12 relative">
            <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                {{-- Left: Avatar + Identity --}}
                <div class="flex items-end gap-4">
                    {{-- Avatar --}}
                    <div class="w-24 h-24 rounded-2xl bg-white dark:bg-gray-900 border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center flex-shrink-0">
                        <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">{{ $initials }}</span>
                    </div>
                    {{-- Info --}}
                    <div class="pb-1">
                        <div class="flex items-center gap-3 flex-wrap">
                            <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ $client->full_name }}</h1>
                            <span class="inline-flex items-center gap-1.5 rounded-lg {{ $lc['bg'] }} {{ $lc['dark_bg'] }} px-2.5 py-1 text-xs font-semibold {{ $lc['text'] }} {{ $lc['dark_text'] }} border {{ $lc['border'] }} {{ $lc['dark_border'] }}">
                                <span class="w-1.5 h-1.5 rounded-full {{ $lc['dot'] }}"></span>
                                {{ ucfirst($client->lifecycle_state) }}
                            </span>
                            @if($client->kyc_verified)
                                <span class="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
                                    KYC Verified
                                </span>
                            @endif
                        </div>
                        <div class="mt-1.5 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <span class="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{{ $client->client_number }}</span>
                        </div>
                        <div class="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                            @if($client->phone)
                            <span class="flex items-center gap-1.5">
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                {{ $client->phone }}
                            </span>
                            @endif
                            @if($client->email)
                            <span class="flex items-center gap-1.5">
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                {{ $client->email }}
                            </span>
                            @endif
                            @if($client->district)
                            <span class="flex items-center gap-1.5">
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                {{ $client->district }}
                            </span>
                            @endif
                            @if($client->branch)
                            <span class="flex items-center gap-1.5">
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                                {{ $client->branch?->name ?? '--' }}
                            </span>
                            @endif
                        </div>
                    </div>
                </div>

                {{-- Right: Quick Actions --}}
                <div class="flex items-center gap-2 flex-wrap pb-1">
                    {{-- Quick Create Dropdown --}}
                    <div x-data="{ open: false }" class="relative">
                        <button @click="open = !open" @click.away="open = false"
                            class="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-all hover:shadow-md">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                            Create New
                            <svg class="w-3.5 h-3.5 transition-transform" :class="open ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </button>
                        <div x-show="open" x-transition:enter="transition ease-out duration-100" x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100" x-transition:leave="transition ease-in duration-75" x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95"
                             class="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 ring-1 ring-black/5 z-50 overflow-hidden">
                            <div class="py-1">
                                <a href="{{ \App\Filament\Resources\Clients\ClientResource::getUrl('index') }}?create_project={{ $client->id }}"
                                   class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                        <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                                    </div>
                                    <div>
                                        <p class="font-medium">Survey Project</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">Create a new survey</p>
                                    </div>
                                </a>
                                <a href="#" wire:click="$dispatch('createInvoice', { clientId: {{ $client->id }} })"
                                   class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                    </div>
                                    <div>
                                        <p class="font-medium">Invoice</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">Create an invoice</p>
                                    </div>
                                </a>
                                <a href="#" wire:click="$dispatch('createQuotation', { clientId: {{ $client->id }} })"
                                   class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                    </div>
                                    <div>
                                        <p class="font-medium">Quotation</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">Prepare a quotation</p>
                                    </div>
                                </a>
                                <a href="#" wire:click="$dispatch('openNoteModal', { clientId: {{ $client->id }} })"
                                   class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                        <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                    </div>
                                    <div>
                                        <p class="font-medium">Add Note</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">Log a quick note</p>
                                    </div>
                                </a>
                                <div class="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                                <a href="#" wire:click="$dispatch('openSmsModal', { clientId: {{ $client->id }} })"
                                   class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                                    </div>
                                    <div>
                                        <p class="font-medium">Send SMS</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">Send text message</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>

                    <a href="{{ ClientResource::getUrl('edit', ['record' => $client]) }}"
                        class="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all hover:shadow-md">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        Edit
                    </a>
                </div>
            </div>
        </div>

        {{-- Quick Stats Row --}}
        <div class="grid grid-cols-2 md:grid-cols-4 border-t border-gray-200 dark:border-gray-700">
            <div class="px-6 py-4 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Projects</p>
                <p class="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{{ $projectCount }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ $activeProjectCount }} active</p>
            </div>
            <div class="px-6 py-4 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invoices</p>
                <p class="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{{ $invoiceCount }}</p>
                <p class="text-xs {{ $outstandingAmount > 0 ? 'text-red-500 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400' }}">UGX {{ number_format($outstandingAmount) }} outstanding</p>
            </div>
            <div class="px-6 py-4 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Documents</p>
                <p class="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{{ $documentCount }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">On file</p>
            </div>
            <div class="px-6 py-4">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client Since</p>
                <p class="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{{ $client->created_at?->format('M Y') ?? '--' }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ $client->created_at?->diffForHumans() ?? '--' }}</p>
            </div>
        </div>
    </div>

    {{-- ──────────────────────────────────────────────
         Tab Bar + Content Area (Alpine.js)
         ────────────────────────────────────────────── --}}
    <div x-data="{
        activeBlock: '{{ $activeBlock }}',
        blocks: [
            { key: 'approvals', label: 'Approvals', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { key: 'financial', label: 'Financial', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { key: 'documents', label: 'Documents', icon: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z' },
            { key: 'communications', label: 'Communications', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
            { key: 'spatial', label: 'Spatial', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
            { key: 'ai', label: 'AI Insights', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
        ],
        switchBlock(key) {
            this.activeBlock = key;
            const url = new URL(window.location);
            url.searchParams.set('block', key);
            history.pushState({}, '', url);
        }
    }">
        {{-- Tab Navigation --}}
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 px-2 py-1">
            <nav class="flex gap-1 overflow-x-auto" role="tablist" aria-label="Client workspace sections">
                <template x-for="block in blocks" :key="block.key">
                    <button
                        type="button"
                        role="tab"
                        :aria-selected="activeBlock === block.key"
                        :aria-controls="'panel-' + block.key"
                        @click="switchBlock(block.key)"
                        :class="activeBlock === block.key
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/50'"
                        class="inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                    >
                        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" x-bind:d="block.icon"/>
                        </svg>
                        <span x-text="block.label"></span>
                    </button>
                </template>
            </nav>
        </div>

        {{-- Tab Content Panels --}}
        <div>
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
                <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Approval Pipeline</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Track and manage approval steps for this client's applications and project progress.
                            </p>
                        </div>
                        <button wire:click="$dispatch('startWorkflow', { clientId: {{ $client->id }} })"
                            class="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            Start Workflow
                        </button>
                    </div>
                    <div class="p-6">
                        <livewire:client-workspace.approval-timeline-block :client-id="$client->id" :key="'approvals-' . $client->id" />
                    </div>
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
                <livewire:client-workspace.financial-cockpit-block :client-id="$client->id" :key="'financial-' . $client->id" />
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
                <livewire:client-workspace.document-vault-block :client-id="$client->id" :key="'documents-' . $client->id" />
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
                <livewire:client-workspace.communication-hub-block :client-id="$client->id" :key="'comms-' . $client->id" />
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
                <livewire:client-workspace.spatial-footprint-block :client-id="$client->id" :key="'spatial-' . $client->id" />
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
                <livewire:client-workspace.ai-insights-block :client-id="$client->id" :key="'ai-' . $client->id" />
            </div>
        </div>
    </div>
</x-filament-panels::page>
