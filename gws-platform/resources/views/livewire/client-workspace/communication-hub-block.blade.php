@php
$communications = $this->communications;
$channelCounts = $this->channelCounts;
$stats = $this->communicationStats;
$channels = ['All', 'SMS', 'Call', 'Email', 'Note', 'WhatsApp', 'Letter'];
@endphp

<div x-data="{ showForm: false }">
    {{-- Stats Row --}}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {{-- Last 7 Days --}}
        <div class="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div class="absolute top-0 right-0 w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full -mr-6 -mt-6"></div>
            <div class="relative">
                <div class="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg class="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                </div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-3">Last 7 Days</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{{ $stats['last_7_days'] ?? 0 }}</p>
            </div>
        </div>
        {{-- Last 30 Days --}}
        <div class="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div class="absolute top-0 right-0 w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full -mr-6 -mt-6"></div>
            <div class="relative">
                <div class="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <svg class="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                </div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-3">Last 30 Days</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{{ $stats['last_30_days'] ?? 0 }}</p>
            </div>
        </div>
        {{-- Failed SMS --}}
        <div class="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div class="absolute top-0 right-0 w-20 h-20 {{ ($stats['failed_sms'] ?? 0) > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-900/20' }} rounded-full -mr-6 -mt-6"></div>
            <div class="relative">
                <div class="w-9 h-9 rounded-xl {{ ($stats['failed_sms'] ?? 0) > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700' }} flex items-center justify-center">
                    <svg class="w-4.5 h-4.5 {{ ($stats['failed_sms'] ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400' }}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-3">Failed SMS</p>
                <p class="text-2xl font-bold {{ ($stats['failed_sms'] ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100' }} mt-0.5">{{ $stats['failed_sms'] ?? 0 }}</p>
            </div>
        </div>
    </div>

    {{-- Add Communication Button --}}
    <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <svg class="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">History</h3>
        </div>
        <button @click="showForm = !showForm"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all shadow-sm hover:shadow-md">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Log Communication
        </button>
    </div>

    {{-- Collapsible Communication Form --}}
    <div x-show="showForm" x-transition class="mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4 bg-cyan-50 dark:bg-cyan-900/20 border-b border-cyan-100 dark:border-cyan-800">
            <h3 class="text-sm font-semibold text-cyan-800 dark:text-cyan-300">Log New Communication</h3>
        </div>
        <div class="p-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Channel</label>
                    <select wire:model="commChannel"
                        class="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                        <option value="">Select channel</option>
                        <option value="sms">SMS</option>
                        <option value="call">Call</option>
                        <option value="email">Email</option>
                        <option value="note">Note</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="letter">Letter</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Direction</label>
                    <div class="flex gap-3 mt-2.5">
                        <label class="inline-flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border {{ ($commDirection ?? 'outbound') === 'outbound' ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700' : 'border-gray-300 dark:border-gray-600' }} transition-colors">
                            <input type="radio" wire:model="commDirection" value="outbound"
                                class="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700" />
                            <span class="text-sm text-gray-700 dark:text-gray-300">Outbound</span>
                            <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                            </svg>
                        </label>
                        <label class="inline-flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border {{ ($commDirection ?? '') === 'inbound' ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700' : 'border-gray-300 dark:border-gray-600' }} transition-colors">
                            <input type="radio" wire:model="commDirection" value="inbound"
                                class="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700" />
                            <span class="text-sm text-gray-700 dark:text-gray-300">Inbound</span>
                            <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                            </svg>
                        </label>
                    </div>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
                    <input type="text" wire:model="commSubject"
                        class="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Brief subject line" />
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Body</label>
                    <textarea wire:model="commBody" rows="3"
                        class="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Communication details"></textarea>
                </div>
            </div>
            <div class="mt-4 flex justify-end gap-3">
                <button @click="showForm = false"
                    class="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors">
                    Cancel
                </button>
                <button wire:click="sendCommunication" @click="showForm = false"
                    class="px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
                    Send
                </button>
            </div>
        </div>
    </div>

    {{-- Filter Bar --}}
    <div class="mb-4 flex flex-wrap gap-2">
        @foreach($channels as $channel)
            @php
                $count = $channel === 'All' ? $communications->count() : ($channelCounts[$channel] ?? 0);
                $isActive = ($filterChannel ?? 'All') === $channel;
            @endphp
            <button wire:click="$set('filterChannel', '{{ $channel }}')"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                    {{ $isActive
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600' }}">
                {{ $channel }}
                @if($count > 0)
                    <span class="{{ $isActive ? 'bg-primary-500 text-primary-100' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-400' }} rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                        {{ $count }}
                    </span>
                @endif
            </button>
        @endforeach
    </div>

    {{-- Communication Timeline --}}
    @forelse($communications as $communication)
        @php
            $borderColor = match($communication->channel) {
                'sms' => 'border-l-green-500',
                'call' => 'border-l-blue-500',
                'email' => 'border-l-purple-500',
                'note' => 'border-l-amber-500',
                'whatsapp' => 'border-l-emerald-500',
                'letter' => 'border-l-gray-400 dark:border-l-gray-500',
                default => 'border-l-gray-300 dark:border-l-gray-600',
            };
            $channelIconColor = match($communication->channel) {
                'sms' => 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
                'call' => 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
                'email' => 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
                'note' => 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
                'whatsapp' => 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
                'letter' => 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700',
                default => 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700',
            };
            $channelIconPath = match($communication->channel) {
                'sms' => 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
                'call' => 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
                'email' => 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
                'note' => 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
                'whatsapp' => 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
                'letter' => 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
                default => 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            };
            $statusBadgeColor = match($communication->status ?? 'sent') {
                'sent' => 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                'delivered' => 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                'failed' => 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                'pending' => 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                default => 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
            };
            $isInbound = ($communication->direction ?? 'outbound') === 'inbound';
        @endphp

        <div class="mb-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 border-l-4 {{ $borderColor }} overflow-hidden hover:shadow-md transition-shadow">
            <div class="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                <div class="flex-shrink-0 w-10 h-10 rounded-xl {{ $channelIconColor }} flex items-center justify-center">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{{ $channelIconPath }}"/>
                    </svg>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {{ $communication->subject ?? 'No subject' }}
                        </p>
                        @if($isInbound)
                            <span class="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-md">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                                Inbound
                            </span>
                        @else
                            <span class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-1.5 py-0.5 rounded-md">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                                Outbound
                            </span>
                        @endif
                        <span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium {{ $statusBadgeColor }}">
                            {{ ucfirst($communication->status ?? 'sent') }}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2">
                        {{ \Illuminate\Support\Str::limit($communication->body ?? $communication->message ?? '', 150) }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                        {{ $communication->created_at->format('M j, Y \a\t g:i A') }}
                        @if($communication->created_by ?? $communication->user_id ?? null)
                            &middot; {{ $communication->creator?->name ?? $communication->user?->name ?? 'System' }}
                        @endif
                    </p>
                </div>
            </div>
        </div>
    @empty
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600">
            <div class="mx-auto w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4">
                <svg class="w-7 h-7 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">No communications yet</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Log a communication to start tracking interactions.</p>
            <button @click="showForm = true"
                class="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                Log Communication
            </button>
        </div>
    @endforelse
</div>
