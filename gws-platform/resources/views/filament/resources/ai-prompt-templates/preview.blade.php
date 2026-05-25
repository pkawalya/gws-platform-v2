<div class="space-y-6">
    {{-- Template Metadata --}}
    <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
            <span class="font-medium text-gray-500 dark:text-gray-400">Key:</span>
            <span class="ml-2 font-mono">{{ $template->key }}</span>
        </div>
        <div>
            <span class="font-medium text-gray-500 dark:text-gray-400">Version:</span>
            <span class="ml-2">{{ $template->version }}</span>
        </div>
        <div>
            <span class="font-medium text-gray-500 dark:text-gray-400">Model:</span>
            <span class="ml-2">{{ $template->aiModelVersion?->display_name ?? 'Default' }}</span>
        </div>
        <div>
            <span class="font-medium text-gray-500 dark:text-gray-400">Temperature:</span>
            <span class="ml-2">{{ number_format($template->temperature, 2) }}</span>
        </div>
        <div>
            <span class="font-medium text-gray-500 dark:text-gray-400">Max Tokens:</span>
            <span class="ml-2">{{ number_format($template->max_tokens) }}</span>
        </div>
        <div>
            <span class="font-medium text-gray-500 dark:text-gray-400">Status:</span>
            @if($template->is_active)
                <span class="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">Active</span>
            @else
                <span class="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">Inactive</span>
            @endif
        </div>
    </div>

    {{-- Rendered Output --}}
    <div>
        <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Rendered Preview (with dummy variables):</h4>
        <div class="rounded-lg bg-gray-900 p-4 text-sm text-gray-100 font-mono whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
            {{ $rendered }}
        </div>
    </div>

    {{-- Raw Template --}}
    <div>
        <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Raw Template (with placeholders):</h4>
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
            {{ $template->template_text }}
        </div>
    </div>
</div>
