@php
$documents = $this->documents;
$typeCounts = $this->documentTypeCounts;
$documentTypes = [
    'all' => 'All',
    'kyc' => 'KYC',
    'title_deed' => 'Title Deed',
    'survey_report' => 'Survey Report',
    'agreement' => 'Agreement',
    'correspondence' => 'Correspondence',
    'other' => 'Other',
];
@endphp

<div x-data="{ showUpload: false }">
    {{-- Header with Upload Toggle --}}
    <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"/>
                </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">Documents</h3>
            <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5 font-medium">{{ $documents->count() }} files</span>
        </div>
        <button @click="showUpload = !showUpload"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all shadow-sm hover:shadow-md">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Upload
        </button>
    </div>

    {{-- Collapsible Upload Form --}}
    <div x-show="showUpload" x-transition class="mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-dashed border-primary-200 dark:border-primary-800 overflow-hidden">
        <div class="px-5 py-4 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-800">
            <h3 class="text-sm font-semibold text-primary-800 dark:text-primary-300">Upload New Document</h3>
        </div>
        <div class="p-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
                    <input type="text" wire:model="uploadTitle"
                        class="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Document title" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
                    <select wire:model="uploadDocumentType"
                        class="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                        <option value="kyc">KYC</option>
                        <option value="title_deed">Title Deed</option>
                        <option value="survey_report">Survey Report</option>
                        <option value="agreement">Agreement</option>
                        <option value="correspondence">Correspondence</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">File</label>
                    <input type="file" wire:model="uploadFile"
                        class="w-full text-sm text-gray-700 dark:text-gray-300
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-xl file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary-50 file:text-primary-700
                            dark:file:bg-primary-900/30 dark:file:text-primary-400
                            hover:file:bg-primary-100 dark:hover:file:bg-primary-900/50" />
                    @if($errors->has('uploadFile'))
                        <p class="text-sm text-red-600 dark:text-red-400 mt-1">{{ $errors->first('uploadFile') }}</p>
                    @endif
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Document Date</label>
                    <input type="date" wire:model="uploadDocumentDate"
                        class="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                    <textarea wire:model="uploadDescription" rows="2"
                        class="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Optional description"></textarea>
                </div>
                <div class="md:col-span-2 flex items-center gap-3">
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" wire:model="uploadIsConfidential" class="sr-only peer" />
                        <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:after:border-gray-500 peer-checked:bg-primary-600"></div>
                    </label>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Mark as confidential</span>
                    <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                </div>
            </div>
            <div class="mt-4 flex justify-end gap-3">
                <button @click="showUpload = false"
                    class="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors">
                    Cancel
                </button>
                <button wire:click="uploadDocument" @click="showUpload = false"
                    class="px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
                    Upload
                </button>
            </div>
        </div>
    </div>

    {{-- Filter Bar --}}
    <div class="mb-4 flex flex-wrap gap-2">
        @foreach($documentTypes as $key => $label)
            @php
                $count = $key === 'all' ? ($typeCounts['all'] ?? 0) : ($typeCounts[$key] ?? 0);
                $isActive = $filterType === $key;
            @endphp
            <button wire:click="$set('filterType', '{{ $key }}')"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                    {{ $isActive
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600' }}">
                {{ $label }}
                @if($count > 0)
                    <span class="{{ $isActive ? 'bg-primary-500 text-primary-100' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-400' }} rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                        {{ $count }}
                    </span>
                @endif
            </button>
        @endforeach
    </div>

    {{-- Document Grid/List --}}
    @forelse($documents as $document)
        @php
            $statusColor = match($document->status) {
                'uploaded' => 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                'verified' => 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                'rejected' => 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                'archived' => 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
                default => 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
            };
            $typeBadgeColor = match($document->document_type) {
                'kyc' => 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
                'title_deed' => 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                'survey_report' => 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
                'agreement' => 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                'correspondence' => 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
                default => 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
            };
            $mimeIcon = match(true) {
                str_contains($document->mime_type ?? '', 'pdf') => 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
                str_contains($document->mime_type ?? '', 'image') => 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
                str_contains($document->mime_type ?? '', 'word') || str_contains($document->mime_type ?? '', 'document') => 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
                str_contains($document->mime_type ?? '', 'sheet') || str_contains($document->mime_type ?? '', 'excel') => 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
                default => 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
            };
            $mimeColor = match(true) {
                str_contains($document->mime_type ?? '', 'pdf') => 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                str_contains($document->mime_type ?? '', 'image') => 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
                str_contains($document->mime_type ?? '', 'word') || str_contains($document->mime_type ?? '', 'document') => 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                str_contains($document->mime_type ?? '', 'sheet') || str_contains($document->mime_type ?? '', 'excel') => 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
                default => 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
            };
        @endphp

        <div class="mb-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
            <div class="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                {{-- Document Icon --}}
                <div class="flex-shrink-0 w-10 h-10 rounded-xl {{ $mimeColor }} flex items-center justify-center">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{{ $mimeIcon }}"/>
                    </svg>
                </div>

                {{-- Document Info --}}
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {{ $document->title }}
                        </p>
                        @if($document->is_confidential)
                            <svg class="w-3.5 h-3.5 text-red-500 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                        @endif
                    </div>
                    <div class="flex items-center gap-2 flex-wrap mt-1.5">
                        <span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium {{ $typeBadgeColor }}">
                            {{ $document->documentTypeLabel() }}
                        </span>
                        <span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium {{ $statusColor }}">
                            {{ ucfirst($document->status) }}
                        </span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                        Uploaded {{ $document->created_at->format('M j, Y') }}
                        @if($document->file_size)
                            &middot; {{ $document->fileSizeFormatted() }}
                        @endif
                        @if($document->uploadedBy)
                            &middot; {{ $document->uploadedBy->name }}
                        @endif
                    </p>
                    @if($document->description)
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {{ $document->description }}
                        </p>
                    @endif
                </div>

                {{-- Action Buttons --}}
                <div class="flex items-center gap-1 flex-shrink-0">
                    @if($document->status === 'uploaded')
                        <button wire:click="verifyDocument({{ $document->id }}, 'Verified via client workspace')"
                            wire:confirm="Verify this document?"
                            class="p-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                            title="Verify">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </button>
                        <button wire:click="rejectDocument({{ $document->id }}, 'Does not meet requirements')"
                            wire:confirm="Reject this document?"
                            class="p-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                            title="Reject">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                            </svg>
                        </button>
                    @endif
                    <button wire:click="deleteDocument({{ $document->id }})"
                        wire:confirm="Are you sure you want to delete this document? This action cannot be undone."
                        class="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        title="Delete">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    @empty
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600">
            <div class="mx-auto w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4">
                <svg class="w-7 h-7 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"/>
                </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">No documents yet</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload a document to get started.</p>
            <button @click="showUpload = true"
                class="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                Upload Document
            </button>
        </div>
    @endforelse
</div>
