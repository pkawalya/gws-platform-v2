<div class="fi-wi-ctn">
    <div class="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
        <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div class="flex-1">
            <p class="text-sm font-medium text-blue-800 dark:text-blue-300">
                This page is being replaced by the Client Workspace
            </p>
            <p class="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                The new Client Workspace provides a unified view with approvals, financials, documents, communications, spatial data, and AI insights — all in one place.
            </p>
        </div>
        <a href="{{ \App\Filament\Resources\Clients\ClientResource::getUrl('workspace', ['record' => $this->clientId]) }}"
           class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors flex-shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
            Open Workspace
        </a>
    </div>
</div>
