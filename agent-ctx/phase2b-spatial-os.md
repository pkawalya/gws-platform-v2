# Phase 2B: Spatial OS — Map as Primary Navigation

## Task Summary
Implemented the complete spatial layer for the GWS Platform V2, making the map the primary navigation surface for finding and managing land projects.

## Files Created/Modified

### Migrations (3 new)
1. **`database/migrations/2026_07_01_000100_add_spatial_columns_to_survey_projects_table.php`**
   - Adds `srid`, `geojson_data`, `last_georef_update` columns
   - Conditional PostGIS geometry columns (`boundary_geom`, `centroid_geom`) only on pgsql driver
   - Spatial GiST indexes on geometry columns
   - Full rollback support

2. **`database/migrations/2026_07_01_000101_create_spatial_layers_table.php`**
   - Full spatial_layers table with all required columns
   - Indexes on slug, layer_type, is_active, organization_id

3. **`database/migrations/2026_07_01_000102_create_map_annotations_table.php`**
   - Full map_annotations table with polymorphic entity support
   - Indexes on entity_type+entity_id, annotation_type, is_public, lat/lng, organization_id

### Models (2 new, 1 updated)
4. **`app/Models/SpatialLayer.php`** — New model
   - Uses `RecordsDomainEvents` trait
   - Constants: LAYER_TYPES, SOURCE_TYPES
   - Auto-generates slug from name on creating
   - Scopes: active(), visibleByDefault(), forType(), ordered()
   - Methods: getDefaultStyle(), toLeafletConfig(), generateUniqueSlug()

5. **`app/Models/MapAnnotation.php`** — New model
   - Uses `RecordsDomainEvents` trait
   - Constants: ANNOTATION_TYPES
   - Auto-extracts lat/lng from Point geometry on saving
   - Polymorphic entity() relationship
   - Scopes: public(), forEntity(), nearPoint(), ofType()
   - Methods: toGeoJSON(), toLeafletMarker()

6. **`app/Models/SurveyProject.php`** — Updated
   - Added `srid`, `geojson_data`, `last_georef_update` to $fillable/$casts
   - Added `annotations()` morphMany relationship
   - Added `hasSpatialData()`, `toGeoJSONFeature()`, `getCenterCoordinates()`, `updateSpatialData()`
   - Comprehensive district center lookup for ~40+ Uganda districts

### Services (1 new)
7. **`app/Services/SpatialQueryService.php`** — New service
   - SQLite-compatible spatial queries with PostGIS optimization
   - Methods: projectsInBounds(), projectsNearPoint(), annotationsNearPoint(), getProjectClusters(), getVisibleLayers(), projectsAsGeoJson(), annotationsAsGeoJson(), haversineDistance()
   - All queries work on both SQLite (dev) and PostgreSQL+PostGIS (production)

### Livewire (1 updated)
8. **`app/Livewire/ClientWorkspace/SpatialFootprintBlock.php`** — Upgraded
   - Added mapCenterLat, mapCenterLng, mapZoom properties
   - New `mapData()` computed returning {center, zoom, markers, polygons}
   - Updated `spatialProjects()` to use `getCenterCoordinates()` and `hasSpatialData()`
   - New `panToProject()` method with Livewire event dispatch
   - New `refreshMap()` method

### Blade Views (2 updated/created)
9. **`resources/views/livewire/client-workspace/spatial-footprint-block.blade.php`** — Upgraded
   - Real Leaflet.js map replacing placeholder
   - Color-coded markers by project status
   - Polygon boundaries when available
   - Click-to-view popup with project details
   - Auto-fit bounds to all markers
   - OpenStreetMap tiles
   - wire:ignore on map container
   - Locate button per project in list
   - @script/@endscript for Livewire v4 JS

10. **`resources/views/filament/pages/spatial-map.blade.php`** — New
    - Full-height map (calc(100vh - 64px))
    - Sidebar with layer toggles
    - Search bar overlay
    - Status filter chips
    - Project count badge
    - Map legend
    - Full marker/polygon rendering

### Filament Pages (1 new)
11. **`app/Filament/Pages/SpatialMapPage.php`** — New
    - Navigation group: "Spatial"
    - Navigation icon: Heroicon::OutlinedMap
    - Navigation sort: 5
    - Methods: getProjectsGeoJson(), getVisibleLayers(), getClusterData(), getStatusOptions()

### Filament Resources (1 new, with supporting files)
12. **`app/Filament/Resources/Spatial/SpatialLayers/SpatialLayerResource.php`**
13. **`app/Filament/Resources/Spatial/SpatialLayers/Schemas/SpatialLayerForm.php`**
14. **`app/Filament/Resources/Spatial/SpatialLayers/Tables/SpatialLayersTable.php`**
15. **`app/Filament/Resources/Spatial/SpatialLayers/Pages/ListSpatialLayers.php`**
16. **`app/Filament/Resources/Spatial/SpatialLayers/Pages/CreateSpatialLayer.php`**
17. **`app/Filament/Resources/Spatial/SpatialLayers/Pages/ViewSpatialLayer.php`**
18. **`app/Filament/Resources/Spatial/SpatialLayers/Pages/EditSpatialLayer.php`**

### Provider (1 updated)
19. **`app/Providers/Filament/AdminPanelProvider.php`** — Updated
    - Added SpatialMapPage import and registration

## Key Design Decisions
- All spatial queries work without PostGIS (SQLite compat) using lat/lng columns and Haversine
- PostGIS spatial functions are used when pgsql driver is detected
- District center lookup provides approximate coordinates for 40+ Uganda districts
- Leaflet.js loaded via CDN with @once/@push to prevent duplicate loads
- wire:ignore on map containers to prevent Livewire DOM disruption
- @script/@endscript used for Livewire v4 compatible JavaScript
