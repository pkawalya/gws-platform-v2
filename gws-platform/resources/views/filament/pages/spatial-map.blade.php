<x-filament-panels::page>
    @php
        $projectsGeoJson = $this->getProjectsGeoJson();
        $visibleLayers = $this->getVisibleLayers();
        $clusterData = $this->getClusterData();
        $statusOptions = $this->getStatusOptions();
        $projectCount = count($projectsGeoJson['features'] ?? []);
        $layersJson = $visibleLayers->map(fn($l) => $l->toLeafletConfig())->values()->toJson();
    @endphp

    <div class="relative" style="height: calc(100vh - 64px); margin: -24px; overflow: hidden;">
        {{-- Map Container --}}
        <div id="spatial-map-full" wire:ignore class="w-full h-full" style="z-index: 1;"></div>

        {{-- Search Bar Overlay --}}
        <div class="absolute top-4 left-14 z-[1000] w-80">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="flex items-center px-3 py-2">
                    <svg class="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <input
                        type="text"
                        id="spatial-search-input"
                        placeholder="Search by project number, district..."
                        class="w-full text-sm text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none placeholder-gray-400"
                    />
                </div>
            </div>
        </div>

        {{-- Project Count Badge --}}
        <div class="absolute top-4 left-96 z-[1000] ml-3">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {{ $projectCount }} project{{ $projectCount !== 1 ? 's' : '' }}
            </span>
        </div>

        {{-- Sidebar: Layer Toggles + Status Filters --}}
        <div class="absolute top-4 right-4 z-[1000] w-72 max-h-[calc(100vh-96px)] overflow-y-auto" id="spatial-sidebar">
            {{-- Layer Toggles --}}
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mb-3">
                <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                        </svg>
                        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Layers</h3>
                    </div>
                    <button
                        type="button"
                        onclick="toggleAllLayers()"
                        class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Toggle All
                    </button>
                </div>
                <div class="p-3 space-y-2" id="layer-toggles">
                    {{-- Projects layer (always present) --}}
                    <label class="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked class="layer-toggle rounded border-gray-300 text-purple-600 shadow-sm focus:ring-purple-500" data-layer-id="projects" onchange="toggleLayer('projects', this.checked)">
                        <div class="w-3 h-3 rounded-full bg-purple-500 flex-shrink-0"></div>
                        <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">Projects</span>
                    </label>

                    @foreach($visibleLayers as $layer)
                        <label class="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" {{ $layer->is_visible_by_default ? 'checked' : '' }} class="layer-toggle rounded border-gray-300 text-purple-600 shadow-sm focus:ring-purple-500" data-layer-id="layer-{{ $layer->id }}" onchange="toggleLayer('layer-{{ $layer->id }}', this.checked)">
                            <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: {{ $layer->getDefaultStyle()['color'] ?? '#8b5cf6' }}"></div>
                            <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">{{ $layer->name }}</span>
                        </label>
                    @endforeach
                </div>
            </div>

            {{-- Status Filter Chips --}}
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mb-3">
                <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                        </svg>
                        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Status Filter</h3>
                    </div>
                </div>
                <div class="p-3 flex flex-wrap gap-1.5">
                    @php
                        $statusChipColors = [
                            'inquiry' => 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
                            'active' => 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
                            'surveying' => 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
                            'completed' => 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
                            'on_hold' => 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
                            'cancelled' => 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
                        ];
                        $statusMarkerColors = [
                            'inquiry' => '#6b7280',
                            'active' => '#3b82f6',
                            'surveying' => '#6366f1',
                            'completed' => '#10b981',
                            'on_hold' => '#f59e0b',
                            'cancelled' => '#ef4444',
                        ];
                    @endphp
                    @foreach($statusOptions as $key => $label)
                        <button
                            type="button"
                            class="status-chip inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors {{ $statusChipColors[$key] ?? 'bg-gray-100 text-gray-700 border-gray-300' }}"
                            data-status="{{ $key }}"
                            onclick="toggleStatusFilter('{{ $key }}', this)"
                        >
                            <span class="w-2 h-2 rounded-full" style="background-color: {{ $statusMarkerColors[$key] ?? '#6b7280' }}"></span>
                            {{ $label }}
                        </button>
                    @endforeach
                </div>
            </div>

            {{-- Map Legend --}}
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Legend</h3>
                    </div>
                </div>
                <div class="p-3 space-y-1.5">
                    @foreach($statusMarkerColors as $status => $color)
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: {{ $color }}"></div>
                            <span class="text-xs text-gray-600 dark:text-gray-400">{{ ucfirst(str_replace('_', ' ', $status)) }}</span>
                        </div>
                    @endforeach
                </div>
            </div>
        </div>
    </div>
</x-filament-panels::page>

@script
<script>
    // Full-screen spatial map initialization
    document.addEventListener('DOMContentLoaded', function() {
        initSpatialMapFull();
    });

    if (typeof Livewire !== 'undefined') {
        Livewire.hook('element.init', () => {
            setTimeout(() => initSpatialMapFull(), 100);
        });
    }

    let spatialMap = null;
    let projectsLayer = null;
    let layerGroups = {};
    let activeStatusFilters = new Set();
    let allMarkers = [];

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

    function initSpatialMapFull() {
        const mapContainer = document.getElementById('spatial-map-full');
        if (!mapContainer || spatialMap) return;

        // Get project data from PHP
        const projectsData = @js($projectsGeoJson);
        const layersData = JSON.parse('{!! $layersJson !!}');

        // Create the Leaflet map centered on Uganda
        spatialMap = L.map(mapContainer, {
            center: [1.3733, 32.2903],
            zoom: 7,
            zoomControl: true,
            scrollWheelZoom: true,
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(spatialMap);

        // Status colors
        const statusColors = {
            inquiry: '#6b7280',
            active: '#3b82f6',
            surveying: '#6366f1',
            completed: '#10b981',
            on_hold: '#f59e0b',
            cancelled: '#ef4444',
        };

        // Add project markers
        projectsLayer = L.featureGroup();
        const features = projectsData.features || [];

        features.forEach(function(feature) {
            if (!feature.geometry) return;

            const props = feature.properties || {};
            const status = props.status || 'inquiry';
            const color = statusColors[status] || '#6b7280';

            if (feature.geometry.type === 'Point') {
                const coords = feature.geometry.coordinates;
                if (coords && coords.length >= 2) {
                    const icon = createMarkerIcon(color);
                    const marker = L.marker([coords[1], coords[0]], { icon: icon });

                    marker.featureData = feature;
                    marker.bindPopup(buildProjectPopup(props, color));
                    projectsLayer.addLayer(marker);
                    allMarkers.push(marker);
                }
            } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                const geoJsonLayer = L.geoJSON(feature, {
                    style: {
                        color: color,
                        weight: 2,
                        opacity: 0.8,
                        fillColor: color,
                        fillOpacity: 0.15,
                    }
                });
                geoJsonLayer.bindPopup(buildProjectPopup(props, color));
                projectsLayer.addLayer(geoJsonLayer);
            }
        });

        projectsLayer.addTo(spatialMap);

        // Auto-fit to show all markers
        if (allMarkers.length > 0) {
            try {
                spatialMap.fitBounds(projectsLayer.getBounds().pad(0.1));
            } catch(e) {
                spatialMap.setView([1.3733, 32.2903], 7);
            }
        }

        // Add spatial layers
        layersData.forEach(function(layerConfig) {
            const layerGroup = L.featureGroup();
            const style = layerConfig.style || {};

            if (layerConfig.geojsonData) {
                try {
                    const geoJsonLayer = L.geoJSON(layerConfig.geojsonData, {
                        style: style,
                        pointToLayer: function(feature, latlng) {
                            return L.circleMarker(latlng, {
                                radius: 6,
                                ...style,
                            });
                        },
                        onEachFeature: function(feature, layer) {
                            if (feature.properties) {
                                let popupContent = '<div style="font-family: system-ui, sans-serif;">';
                                if (feature.properties.name) popupContent += `<div style="font-weight: 600;">${feature.properties.name}</div>`;
                                if (feature.properties.description) popupContent += `<div style="font-size: 12px; color: #6b7280;">${feature.properties.description}</div>`;
                                popupContent += '</div>';
                                layer.bindPopup(popupContent);
                            }
                        }
                    });
                    geoJsonLayer.addTo(layerGroup);
                } catch(e) {
                    console.warn('Failed to parse GeoJSON for layer:', layerConfig.name, e);
                }
            }

            if (layerConfig.isVisibleByDefault) {
                layerGroup.addTo(spatialMap);
            }

            layerGroups['layer-' + layerConfig.id] = {
                group: layerGroup,
                visible: layerConfig.isVisibleByDefault,
            };
        });

        // Store projects layer toggle state
        layerGroups['projects'] = { group: projectsLayer, visible: true };

        // Invalidate size after delay
        setTimeout(() => spatialMap.invalidateSize(), 200);

        // Setup search functionality
        setupSearch();
    }

    function buildProjectPopup(props, color) {
        return `
            <div style="min-width: 220px; font-family: system-ui, -apple-system, sans-serif;">
                <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${props.projectNumber || 'Unknown'}</div>
                <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px;">
                    ${props.projectType ? `<span style="background: ${color}22; color: ${color}; padding: 1px 6px; border-radius: 9999px; font-size: 11px; font-weight: 500;">${props.projectType.charAt(0).toUpperCase() + props.projectType.slice(1)}</span>` : ''}
                    ${props.status ? `<span style="background: ${color}22; color: ${color}; padding: 1px 6px; border-radius: 9999px; font-size: 11px; font-weight: 500;">${props.status.charAt(0).toUpperCase() + props.status.replace('_', ' ').slice(1)}</span>` : ''}
                </div>
                ${props.district ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">📍 ${props.district}</div>` : ''}
                ${props.locationDescription ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">📝 ${props.locationDescription}</div>` : ''}
                ${props.areaHectares ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">📐 ${Number(props.areaHectares).toFixed(2)} ha</div>` : ''}
                ${props.clientName ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">👤 ${props.clientName}</div>` : ''}
                <div style="margin-top: 8px;">
                    <div style="background: #e5e7eb; border-radius: 9999px; height: 6px; overflow: hidden;">
                        <div style="background: ${color}; height: 6px; border-radius: 9999px; width: ${Math.min(props.progress || 0, 100)}%;"></div>
                    </div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">${Math.round(props.progress || 0)}% complete</div>
                </div>
            </div>
        `;
    }

    function toggleLayer(layerId, visible) {
        if (!spatialMap || !layerGroups[layerId]) return;

        const layerInfo = layerGroups[layerId];
        layerInfo.visible = visible;

        if (visible) {
            spatialMap.addLayer(layerInfo.group);
        } else {
            spatialMap.removeLayer(layerInfo.group);
        }
    }

    function toggleAllLayers() {
        const checkboxes = document.querySelectorAll('.layer-toggle');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);

        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
            const layerId = cb.dataset.layerId;
            toggleLayer(layerId, cb.checked);
        });
    }

    function toggleStatusFilter(status, button) {
        const chip = button;

        if (activeStatusFilters.has(status)) {
            activeStatusFilters.delete(status);
            chip.style.opacity = '0.5';
        } else {
            activeStatusFilters.add(status);
            chip.style.opacity = '1';
        }

        // Apply filter to markers
        applyStatusFilter();
    }

    function applyStatusFilter() {
        if (!projectsLayer || !spatialMap) return;

        const hasFilters = activeStatusFilters.size > 0;

        allMarkers.forEach(function(marker) {
            if (!hasFilters) {
                // Show all when no filters active
                if (!projectsLayer.hasLayer(marker)) {
                    projectsLayer.addLayer(marker);
                }
                return;
            }

            const status = marker.featureData?.properties?.status || 'inquiry';
            const shouldShow = activeStatusFilters.has(status);

            if (shouldShow && !projectsLayer.hasLayer(marker)) {
                projectsLayer.addLayer(marker);
            } else if (!shouldShow && projectsLayer.hasLayer(marker)) {
                projectsLayer.removeLayer(marker);
            }
        });
    }

    function setupSearch() {
        const searchInput = document.getElementById('spatial-search-input');
        if (!searchInput) return;

        let debounceTimer;

        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const query = searchInput.value.toLowerCase().trim();

                if (!query) {
                    // Show all markers
                    allMarkers.forEach(m => {
                        if (!projectsLayer.hasLayer(m)) projectsLayer.addLayer(m);
                    });
                    return;
                }

                allMarkers.forEach(function(marker) {
                    const props = marker.featureData?.properties || {};
                    const searchable = [
                        props.projectNumber || '',
                        props.district || '',
                        props.clientName || '',
                        props.projectType || '',
                        props.status || '',
                        props.locationDescription || '',
                    ].join(' ').toLowerCase();

                    const shouldShow = searchable.includes(query);

                    if (shouldShow && !projectsLayer.hasLayer(marker)) {
                        projectsLayer.addLayer(marker);
                    } else if (!shouldShow && projectsLayer.hasLayer(marker)) {
                        projectsLayer.removeLayer(marker);
                    }
                });
            }, 300);
        });
    }
</script>
@endscript

{{-- Leaflet CSS & JS (only loaded once) --}}
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
    /* Ensure Leaflet controls and popups are above Filament UI */
    .leaflet-popup-content-wrapper {
        z-index: 1000 !important;
    }
    .leaflet-control-container {
        z-index: 999 !important;
    }
    /* Scrollbar styling for sidebar */
    #spatial-sidebar::-webkit-scrollbar {
        width: 6px;
    }
    #spatial-sidebar::-webkit-scrollbar-track {
        background: transparent;
    }
    #spatial-sidebar::-webkit-scrollbar-thumb {
        background-color: #d1d5db;
        border-radius: 3px;
    }
    #spatial-sidebar::-webkit-scrollbar-thumb:hover {
        background-color: #9ca3af;
    }
</style>
@endpush
@endonce

@once
@push('scripts')
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossorigin=""></script>
@endpush
@endonce
