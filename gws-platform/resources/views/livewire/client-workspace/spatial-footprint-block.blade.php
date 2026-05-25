@php
$summary = $this->spatialSummary;
$projects = $this->spatialProjects;
$districts = $summary['projects_by_district'] ?? [];
$types = $summary['projects_by_type'] ?? [];
$statuses = $summary['projects_by_status'] ?? [];
$maxDistrictCount = !empty($districts) ? max($districts) : 1;

$typeColors = [
    'cadastral' => 'bg-indigo-500',
    'topographic' => 'bg-teal-500',
    'engineering' => 'bg-amber-500',
    'hydrographic' => 'bg-cyan-500',
    'boundary' => 'bg-purple-500',
    'mortgage' => 'bg-rose-500',
    'subdivision' => 'bg-emerald-500',
];
$typeBadgeColors = [
    'cadastral' => 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    'topographic' => 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    'engineering' => 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'hydrographic' => 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    'boundary' => 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'mortgage' => 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    'subdivision' => 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
];
$statusColors = [
    'inquiry' => 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
    'active' => 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'surveying' => 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    'completed' => 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'on_hold' => 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'cancelled' => 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
];
@endphp

<div>
    {{-- Empty State --}}
    @if(($summary['total_projects'] ?? 0) === 0)
        <div class="text-center py-12">
            <div class="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">No spatial data yet</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Projects with district information will appear here once created.</p>
        </div>
    @else
        {{-- Summary Row: 3 Stat Cards --}}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {{-- Total Projects --}}
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Projects</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                            {{ $summary['total_projects'] ?? 0 }}
                        </p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                    </div>
                </div>
            </div>

            {{-- Total Area --}}
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Area</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                            {{ number_format($summary['total_area_hectares'] ?? 0, 2) }}
                            <span class="text-sm font-normal text-gray-500 dark:text-gray-400">ha</span>
                        </p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                        </svg>
                    </div>
                </div>
            </div>

            {{-- Districts Covered --}}
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Districts Covered</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                            {{ $summary['district_count'] ?? 0 }}
                        </p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        {{-- Breakdowns Row --}}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {{-- District Breakdown --}}
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">District Breakdown</h3>
                </div>
                <div class="p-4 space-y-3">
                    @forelse(collect($districts)->take(8) as $district => $count)
                        <div>
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{{ $district }}</span>
                                <span class="text-sm font-semibold text-gray-900 dark:text-gray-100 ml-2">{{ $count }}</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                                <div class="h-2.5 rounded-full bg-blue-500 dark:bg-blue-400 transition-all duration-500"
                                     style="width: {{ $maxDistrictCount > 0 ? ($count / $maxDistrictCount) * 100 : 0 }}%">
                                </div>
                            </div>
                        </div>
                    @empty
                        <p class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No district data</p>
                    @endforelse
                </div>
            </div>

            {{-- Project Type Breakdown --}}
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Project Types</h3>
                </div>
                <div class="p-4">
                    @forelse(collect($types) as $type => $count)
                        <div class="flex items-center justify-between py-2 {{ !$loop->last ? 'border-b border-gray-100 dark:border-gray-700' : '' }}">
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 rounded-full {{ $typeColors[$type] ?? 'bg-gray-400' }}"></div>
                                <span class="text-sm text-gray-700 dark:text-gray-300">{{ ucfirst(str_replace('_', ' ', $type)) }}</span>
                            </div>
                            <span class="text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 rounded-full px-2.5 py-0.5">{{ $count }}</span>
                        </div>
                    @empty
                        <p class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No type data</p>
                    @endforelse
                </div>
            </div>

            {{-- Projects by Status --}}
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">By Status</h3>
                </div>
                <div class="p-4 flex flex-wrap gap-2">
                    @forelse(collect($statuses) as $status => $count)
                        <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium {{ $statusColors[$status] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300' }}">
                            {{ ucfirst(str_replace('_', ' ', $status)) }}
                            <span class="font-bold">{{ $count }}</span>
                        </span>
                    @empty
                        <p class="text-sm text-gray-500 dark:text-gray-400 text-center py-4 w-full">No status data</p>
                    @endforelse
                </div>
            </div>
        </div>

        {{-- Map Placeholder --}}
        <div class="mb-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-800/50">
            <div class="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                </svg>
            </div>
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Interactive Map</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Interactive map requires PostGIS (Phase 2B)</p>
        </div>

        {{-- Project List --}}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Projects</h3>
            </div>

            @forelse($projects as $project)
                @php
                    $projectStatusColor = $statusColors[$project['status']] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300';
                    $projectTypeBadge = $typeBadgeColors[$project['project_type']] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300';
                    $progressValue = $project['progress'] ?? 0;
                    $progressColor = $progressValue >= 100
                        ? 'bg-green-500'
                        : ($progressValue >= 50
                            ? 'bg-blue-500'
                            : 'bg-amber-500');
                @endphp

                <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {{ $project['project_number'] }}
                                </p>
                                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {{ $projectTypeBadge }}">
                                    {{ ucfirst(str_replace('_', ' ', $project['project_type'])) }}
                                </span>
                                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {{ $projectStatusColor }}">
                                    {{ ucfirst(str_replace('_', ' ', $project['status'])) }}
                                </span>
                            </div>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                @if($project['district'])
                                    <span class="inline-flex items-center gap-1">
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        </svg>
                                        {{ $project['district'] }}
                                    </span>
                                @endif
                                @if($project['location_description'])
                                    &middot; {{ $project['location_description'] }}
                                @endif
                            </p>
                        </div>
                        <div class="flex items-center gap-4 flex-shrink-0">
                            @if($project['area_hectares'])
                                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {{ number_format($project['area_hectares'], 2) }} ha
                                </span>
                            @endif
                            <span class="text-sm font-bold {{ $progressValue >= 100 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100' }}">
                                {{ number_format($progressValue, 0) }}%
                            </span>
                        </div>
                    </div>

                    {{-- Progress Bar --}}
                    @if($progressValue > 0)
                        <div class="mt-2">
                            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                <div class="h-1.5 rounded-full transition-all duration-500 {{ $progressColor }}"
                                     style="width: {{ min($progressValue, 100) }}%">
                                </div>
                            </div>
                        </div>
                    @endif

                    {{-- Coordinates Indicator --}}
                    @if($project['coordinates'])
                        <div class="mt-1.5 flex items-center gap-1">
                            <svg class="w-3 h-3 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            <span class="text-xs text-green-600 dark:text-green-400 font-medium">GPS coordinates available</span>
                        </div>
                    @endif
                </div>
            @empty
                <div class="text-center py-12">
                    <div class="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                        <svg class="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">No projects with district data</p>
                </div>
            @endforelse
        </div>
    @endif
</div>
