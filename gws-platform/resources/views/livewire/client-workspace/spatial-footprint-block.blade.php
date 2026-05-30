@php
$summary = $this->spatialSummary;
$projects = $this->spatialProjects;
$mapData = $this->mapData;
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
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600">
            <div class="mx-auto w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4">
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
            <div class="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <div class="absolute top-0 right-0 w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full -mr-6 -mt-6"></div>
                <div class="relative">
                    <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                    </div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-3">Total Projects</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{{ $summary['total_projects'] ?? 0 }}</p>
                </div>
            </div>

            {{-- Total Area --}}
            <div class="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <div class="absolute top-0 right-0 w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full -mr-6 -mt-6"></div>
                <div class="relative">
                    <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                        </svg>
                    </div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-3">Total Area</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                        {{ number_format($summary['total_area_hectares'] ?? 0, 2) }}
                        <span class="text-sm font-normal text-gray-500 dark:text-gray-400">ha</span>
                    </p>
                </div>
            </div>

            {{-- Districts Covered --}}
            <div class="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <div class="absolute top-0 right-0 w-20 h-20 bg-purple-50 dark:bg-purple-900/20 rounded-full -mr-6 -mt-6"></div>
                <div class="relative">
                    <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                    </div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-3">Districts Covered</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{{ $summary['district_count'] ?? 0 }}</p>
                </div>
            </div>
        </div>

        {{-- Interactive Leaflet Map --}}
        <div class="mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                    </svg>
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Project Map</h3>
                    <span class="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-400">
                        {{ count($mapData['markers'] ?? []) }} pinned
                    </span>
                </div>
                <button
                    type="button"
                    wire:click="refreshMap"
                    class="inline-flex items-center gap-1 rounded-md bg-white dark:bg-gray-600 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                    wire:loading.attr="disabled"
                >
                    <svg wire:loading.remove wire:target="refreshMap" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    <svg wire:loading wire:target="refreshMap" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refresh
                </button>
            </div>
            {{-- Map container with wire:ignore so Leaflet DOM isn't disrupted --}}
            <div wire:ignore id="spatial-map-{{ $clientId }}" class="w-full" style="height: 400px; z-index: 1;"></div>
        </div>

        {{-- Breakdowns Row --}}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {{-- District Breakdown --}}
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">District Breakdown</h3>
                </div>
                <div class="p-4 space-y-3 max-h-96 overflow-y-auto">
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
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Project Types</h3>
                </div>
                <div class="p-4 max-h-96 overflow-y-auto">
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
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
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

        {{-- Project List --}}
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">Projects</h3>
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

                <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
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
                            @if($project['coordinates'])
                                <button
                                    type="button"
                                    wire:click="panToProject({{ $project['id'] }})"
                                    class="inline-flex items-center gap-1 rounded-md bg-purple-100 dark:bg-purple-900/30 px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                                    title="Pan map to this project"
                                >
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                    Locate
                                </button>
                            @endif
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

                    {{-- Spatial Data Indicator --}}
                    @if($project['has_spatial_data'])
                        <div class="mt-1.5 flex items-center gap-1">
                            <svg class="w-3 h-3 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            <span class="text-xs text-green-600 dark:text-green-400 font-medium">Spatial boundary available</span>
                        </div>
                    @elseif($project['coordinates'])
                        <div class="mt-1.5 flex items-center gap-1">
                            <svg class="w-3 h-3 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">GPS coordinates available</span>
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

@script
<script>
    // Initialize Leaflet map for this spatial footprint block
    document.addEventListener('DOMContentLoaded', function() {
        initSpatialMap{{ $clientId }}();
    });

    // Also init on Livewire navigation
    if (typeof Livewire !== 'undefined') {
        Livewire.hook('element.init', () => {
            setTimeout(() => initSpatialMap{{ $clientId }}(), 100);
        });
    }

    function initSpatialMap{{ $clientId }}() {
        const mapContainer = document.getElementById('spatial-map-{{ $clientId }}');
        if (!mapContainer || mapContainer._leafletMap) return;

        const mapData = @js($mapData);
        const center = mapData.center || [1.3733, 32.2903];
        const zoom = mapData.zoom || 7;

        // Create the Leaflet map
        const map = L.map(mapContainer, {
            center: center,
            zoom: zoom,
            scrollWheelZoom: true,
            zoomControl: true,
        });

        mapContainer._leafletMap = true;

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(map);

        // Status icon colors for markers
        const statusIcons = {
            inquiry: '#6b7280',
            active: '#3b82f6',
            surveying: '#6366f1',
            completed: '#10b981',
            on_hold: '#f59e0b',
            cancelled: '#ef4444',
        };

        // Create custom marker icon
        function createMarkerIcon(color) {
            return L.divIcon({
                className: 'custom-marker-icon',
                html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
                    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
                    <circle cx="14" cy="14" r="6" fill="#fff"/>
                </svg>`,
                iconSize: [28, 40],
                iconAnchor: [14, 40],
                popupAnchor: [0, -42],
            });
        }

        // Add project markers
        const markers = [];
        const markerGroup = L.featureGroup();

        (mapData.markers || []).forEach(function(marker) {
            const color = marker.color || statusIcons[marker.status] || '#6b7280';
            const icon = createMarkerIcon(color);

            const leafletMarker = L.marker([marker.lat, marker.lng], { icon: icon })
                .addTo(markerGroup)
                .bindPopup(`
                    <div style="min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
                        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${marker.projectNumber}</div>
                        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px;">
                            <span style="background: ${color}22; color: ${color}; padding: 1px 6px; border-radius: 9999px; font-size: 11px; font-weight: 500;">
                                ${marker.projectType ? marker.projectType.charAt(0).toUpperCase() + marker.projectType.slice(1) : ''}
                            </span>
                            <span style="background: ${color}22; color: ${color}; padding: 1px 6px; border-radius: 9999px; font-size: 11px; font-weight: 500;">
                                ${marker.status ? marker.status.charAt(0).toUpperCase() + marker.status.replace('_', ' ').slice(1) : ''}
                            </span>
                        </div>
                        ${marker.district ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">📍 ${marker.district}</div>` : ''}
                        ${marker.areaHectares ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">📐 ${Number(marker.areaHectares).toFixed(2)} ha</div>` : ''}
                        <div style="margin-top: 6px;">
                            <div style="background: #e5e7eb; border-radius: 9999px; height: 6px; overflow: hidden;">
                                <div style="background: ${color}; height: 6px; border-radius: 9999px; width: ${Math.min(marker.progress || 0, 100)}%;"></div>
                            </div>
                            <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">${Math.round(marker.progress || 0)}% complete</div>
                        </div>
                    </div>
                `, { maxWidth: 280 });

            markers.push(leafletMarker);
        });

        markerGroup.addTo(map);

        // Add polygon boundaries
        (mapData.polygons || []).forEach(function(polygon) {
            const color = polygon.color || '#6b7280';

            try {
                const geoJsonLayer = L.geoJSON(polygon.geometry, {
                    style: {
                        color: color,
                        weight: 2,
                        opacity: 0.8,
                        fillColor: color,
                        fillOpacity: 0.15,
                    }
                }).addTo(map);

                geoJsonLayer.bindPopup(`
                    <div style="font-family: system-ui, -apple-system, sans-serif;">
                        <div style="font-weight: 600; font-size: 14px;">${polygon.projectNumber}</div>
                        <div style="font-size: 12px; color: #6b7280;">Boundary Area</div>
                    </div>
                `);
            } catch(e) {
                console.warn('Failed to render polygon for', polygon.projectNumber, e);
            }
        });

        // Auto-fit bounds to show all markers if any exist
        if (markers.length > 0) {
            try {
                map.fitBounds(markerGroup.getBounds().pad(0.15));
            } catch(e) {
                // Fall back to default Uganda center
                map.setView([1.3733, 32.2903], 7);
            }
        }

        // Listen for Livewire pan-to-project events
        if (typeof Livewire !== 'undefined') {
            Livewire.on('pan-to-project', (event) => {
                const data = Array.isArray(event) ? event[0] : event;
                if (data.lat && data.lng) {
                    map.setView([data.lat, data.lng], 13, { animate: true, duration: 1 });
                }
            });
        }

        // Invalidate size after a small delay to ensure proper rendering
        setTimeout(() => map.invalidateSize(), 200);
    }
</script>
@endscript

{{-- Leaflet CSS --}}
@once
@push('styles')
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin="" />
<style>
    .custom-marker-icon {
        background: none !important;
        border: none !important;
    }
    /* Fix z-index for Leaflet popups inside Filament */
    .leaflet-popup-content-wrapper {
        z-index: 1000 !important;
    }
    .leaflet-control-container {
        z-index: 999 !important;
    }
</style>
@endpush
@endonce

{{-- Leaflet JS --}}
@once
@push('scripts')
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossorigin=""></script>
@endpush
@endonce
