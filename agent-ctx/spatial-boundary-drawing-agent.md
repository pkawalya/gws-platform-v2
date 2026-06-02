# Task: Add GeoJSON Boundary Rendering + Map Drawing/Annotation Tools to Spatial Map

## Summary
Added GeoJSON boundary rendering, drawing tools, and annotation management UI to the GWS Platform V2 spatial map.

## Files Modified

### 1. `/home/z/my-project/src/components/spatial-map.tsx` (Major rewrite)
- Added `BoundaryData` interface with id, name, geojson, color, status, client, area_hectares
- Added `DrawingMode` type: none | point | line | polygon | rectangle | circle
- Added `DrawnFeature` interface for tracking drawn shapes
- Added `boundaries` prop for GeoJSON polygon rendering
- Added `drawingMode` prop to control drawing state
- Added `onDraw` callback for when shapes are drawn
- Added `onBoundaryClick` callback for boundary selection
- Added `selectedBoundaryId` prop for highlighting
- Implemented GeoJSON boundary rendering with:
  - Status-based colors (active=emerald, pending=amber, completed=blue, overdue=red)
  - Popups with project name, client, area, status badge
  - Hover highlight effect (increased weight + fill opacity)
  - Click handler to select/view project details
  - Selected boundary highlighted with amber border
- Implemented custom drawing tools (no external deps):
  - Drawing toolbar (point, line, polygon, rectangle) with mode toggle
  - Click-to-draw for points; multi-click for lines/polygons
  - Double-click/right-click to finish polygon/line
  - Two-click rectangle drawing
  - Live preview with dashed outlines on mouse move
  - Measurement display (area for polygons, length for lines)
  - Undo (Ctrl+Z), Redo (Ctrl+Y), Clear buttons
  - Escape key to cancel current drawing
- Added Legend component showing boundary colors by status
- Added measurement display overlay
- Uses `L.featureGroup()` for boundary layer (supports getBounds)
- Fits map bounds to include all boundaries + markers

### 2. `/home/z/my-project/src/components/platform/map-annotations.tsx` (New file)
- `MapAnnotations` component with full annotation management
- `AnnotationItem` type with id, feature_type, title, description, geojson, properties
- Saved annotations list with:
  - Feature type icon (point/line/polygon/rectangle/circle)
  - Color swatch based on annotation properties
  - Hover actions: Zoom to, Edit, Delete
- Inline editing with:
  - Title and description fields
  - Color picker (6 color options)
  - Save/Cancel buttons
- Drawn features panel (unsaved shapes):
  - Shows shape type, measurement info
  - "Save" button opens dialog to create annotation
- Save annotation dialog:
  - Title, description, color picker
  - Calls `onSaveAnnotation` callback with form data
- Supports update and delete callbacks

### 3. `/home/z/my-project/src/components/platform/spatial-page.tsx` (Major update)
- Added DrawingMode state management
- Added drawnFeatures state for tracking drawn shapes
- Added boundaryStatusFilter and boundaryDistrictFilter states
- Added selectedBoundaryId state
- Added annotations state (initialized from spatial data)
- Updated stats cards to 5 columns (added Boundaries count)
- Added map controls bar with:
  - View mode button (default)
  - Drawing tool buttons (Point, Line, Polygon, Rectangle)
  - Drawing mode indicator badge
  - Boundary status filter dropdown
  - Boundary district filter dropdown (shows when >1 district)
- Updated SpatialMap component props:
  - `boundaries={filteredBoundaries}`
  - `drawingMode={drawingMode}`
  - `onDraw={handleDraw}`
  - `onBoundaryClick={handleBoundaryClick}`
  - `selectedBoundaryId={selectedBoundaryId}`
- Added boundary list in sidebar with:
  - Status-colored swatches
  - Project name, status badge, area, client name
  - Click to select/highlight on map
- Integrated MapAnnotations component
- Updated legend with both marker and boundary sections
- Boundary data source: `spatial.projectBoundaries` (from API) or `projects` prop
- Annotation CRUD handlers:
  - `handleSaveAnnotation` - POST to /api/spatial
  - `handleUpdateAnnotation` - PATCH to /api/spatial
  - `handleDeleteAnnotation` - PATCH with action=delete
  - `handleZoomToAnnotation` - highlight annotation
  - `handleBoundaryClick` - select boundary and open detail

### 4. `/home/z/my-project/src/app/api/spatial/route.ts` (Major update)
- GET handler now returns `projectBoundaries` from `surveyProject.findMany`
  - Filters projects with `boundary_geojson: { not: null }`
  - Includes id, title, project_ref, project_type, status, district, boundary_geojson, area_hectares
  - Includes client relation (id, client_type, first_name, last_name, company_name)
- POST handler for creating annotations:
  - `action: 'create_annotation'`
  - Auto-creates default 'annotations' layer if not exists
  - Creates MapAnnotation record with feature_type, geojson, properties, title, description
- PATCH handler for updating/deleting annotations:
  - `action: 'delete'` - deletes annotation by id
  - Otherwise updates annotation fields (title, description, feature_type, geojson, properties)

## Build Result
✓ Compiled successfully with `npx next build`
- No TypeScript errors in modified files
- All routes generated successfully
