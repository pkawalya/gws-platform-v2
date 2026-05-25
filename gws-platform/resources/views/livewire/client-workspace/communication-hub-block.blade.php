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
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Last 7 Days</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                        {{ $stats['last_7_days'] ?? 0 }}
                    </p>
                </div>
                <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                </div>
            </div>
        </div>

        {{-- Last 30 Days --}}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Last 30 Days</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                        {{ $stats['last_30_days'] ?? 0 }}
                    </p>
                </div>
                <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                </div>
            </div>
        </div>

        {{-- Failed SMS --}}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Failed SMS</p>
                    <p class="text-2xl font-bold {{ ($stats['failed_sms'] ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100' }} mt-1">
                        {{ $stats['failed_sms'] ?? 0 }}
                    </p>
                </div>
                <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
            </div>
        </div>
    </div>

    {{-- Add Communication Toggle --}}
    <div class="mb-4">
        <button @click="showForm = !showForm"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            Log Communication
        </button>
    </div>

    {{-- Collapsible Communication Form --}}
    <div x-show="showForm" x-transition class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Log Communication</h3>
        </div>
        <div class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {{-- Channel --}}
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Channel</label>
                    <select wire:model="commChannel"
                        class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select channel</option>
                        <option value="SMS">SMS</option>
                        <option value="Call">Call</option>
                        <option value="Email">Email</option>
                        <option value="Note">Note</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Letter">Letter</option>
                    </select>
                </div>

                {{-- Direction --}}
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Direction</label>
                    <div class="flex gap-4 mt-2">
                        <label class="inline-flex items-center gap-2 cursor-pointer">
                            <input type="radio" wire:model="commDirection" value="outbound"
                                class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700" />
                            <span class="text-sm text-gray-700 dark:text-gray-300">Outbound</span>
                            <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                            </svg>
                        </label>
                        <label class="inline-flex items-center gap-2 cursor-pointer">
                            <input type="radio" wire:model="commDirection" value="inbound"
                                class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700" />
                            <span class="text-sm text-gray-700 dark:text-gray-300">Inbound</span>
                            <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                            </svg>
                        </label>
                    </div>
                </div>

                {{-- Subject --}}
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                    <input type="text" wire:model="commSubject"
                        class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Brief subject line" />
                </div>

                {{-- Body --}}
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body</label>
                    <textarea wire:model="commBody" rows="3"
                        class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Communication details"></textarea>
                </div>
            </div>

            <div class="mt-4 flex justify-end gap-2">
                <button @click="showForm = false"
                    class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors">
                    Cancel
                </button>
                <button wire:click="sendCommunication" @click="showForm = false"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
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
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors
                    {{ $isActive
                        ? 'bg-blue-600 text-white dark:bg-blue-500'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600' }}">
                {{ $channel }}
                <span class="{{ $isActive ? 'bg-blue-500 text-blue-100' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-400' }} rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                    {{ $count }}
                </span>
            </button>
        @endforeach
    </div>

    {{-- Communication Timeline --}}
    @forelse($communications as $communication)
        @php
            $borderColor = match($communication->channel) {
                'SMS' => 'border-green-500',
                'Call' => 'border-blue-500',
                'Email' => 'border-purple-500',
                'Note' => 'border-amber-500',
                'WhatsApp' => 'border-emerald-500',
                'Letter' => 'border-gray-400 dark:border-gray-500',
                default => 'border-gray-300 dark:border-gray-600',
            };
            $channelIconColor = match($communication->channel) {
                'SMS' => 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
                'Call' => 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
                'Email' => 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
                'Note' => 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
                'WhatsApp' => 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
                'Letter' => 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700',
                default => 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700',
            };
            $channelIconPath = match($communication->channel) {
                'SMS' => 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
                'Call' => 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
                'Email' => 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
                'Note' => 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
                'WhatsApp' => 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
                'Letter' => 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
                default => 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            };
            $statusBadgeColor = match($communication->status ?? 'sent') {
                'sent' => 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                'delivered' => 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                'failed' => 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                'pending' => 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                default => 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
            };
            $isInbound = ($communication->direction ?? 'outbound') === 'inbound';
        @endphp

        <div class="mb-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden border-l-4 {{ $borderColor }}">
            <div class="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                {{-- Channel Icon --}}
                <div class="flex-shrink-0 w-10 h-10 rounded-full {{ $channelIconColor }} flex items-center justify-center">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{{ $channelIconPath }}"/>
                    </svg>
                </div>

                {{-- Communication Content --}}
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {{ $communication->subject ?? 'No subject' }}
                        </p>
                        {{-- Direction Arrow --}}
                        @if($isInbound)
                            <span class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                                </svg>
                                Inbound
                            </span>
                        @else
                            <span class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                                </svg>
                                Outbound
                            </span>
                        @endif
                        <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {{ $statusBadgeColor }}">
                            {{ ucfirst($communication->status ?? 'sent') }}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
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
        <div class="text-center py-12">
            <div class="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">No communications yet</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Log a communication to start tracking interactions.</p>
        </div>
    @endforelse
</div>
