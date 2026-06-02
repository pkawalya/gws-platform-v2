'use client'

import { useEffect, useRef, useCallback } from 'react'

// ── Types ──

interface MapMarker {
  lat: number
  lng: number
  title: string
  type: 'client' | 'observation' | 'project'
  status?: string
  description?: string
  district?: string
}

interface BoundaryData {
  id: string | number
  name: string
  geojson: object
  color?: string
  status: string
  client?: string
  area_hectares?: number | string | null
}

type DrawingMode = 'none' | 'point' | 'line' | 'polygon' | 'rectangle' | 'circle'

interface DrawnFeature {
  type: 'marker' | 'polyline' | 'polygon' | 'rectangle' | 'circle'
  geojson: object
  measurement?: string
  layer?: any
}

interface SpatialMapProps {
  markers: MapMarker[]
  polygons?: Array<{
    coordinates: number[][][]
    title: string
    color: string
  }>
  boundaries?: BoundaryData[]
  center: [number, number]
  zoom: number
  drawingMode?: DrawingMode
  onDraw?: (feature: DrawnFeature) => void
  onBoundaryClick?: (boundary: BoundaryData) => void
  onMapReady?: () => void
  selectedBoundaryId?: string | number | null
}

// ── Status → color mapping ──
function getStatusColor(status: string): string {
  const s = status.toLowerCase()
  if (['active', 'field_survey', 'in_progress'].includes(s)) return '#10b981' // emerald
  if (['pending', 'intake', 'data_processing', 'draft'].includes(s)) return '#f59e0b' // amber
  if (['completed', 'approved', 'delivered'].includes(s)) return '#3b82f6' // blue
  if (['overdue', 'cancelled', 'failed'].includes(s)) return '#ef4444' // red
  return '#6b7280' // gray
}

// ── Measurement helpers ──
function calculatePolygonAreaM2(latlngs: any[]): number {
  // Shoelace formula adapted for lat/lng → approximate meters
  if (latlngs.length < 3) return 0
  const R = 6371000 // Earth radius in meters
  let area = 0
  for (let i = 0; i < latlngs.length; i++) {
    const j = (i + 1) % latlngs.length
    const lat1 = (latlngs[i].lat * Math.PI) / 180
    const lat2 = (latlngs[j].lat * Math.PI) / 180
    const lng1 = (latlngs[i].lng * Math.PI) / 180
    const lng2 = (latlngs[j].lng * Math.PI) / 180
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2))
  }
  area = Math.abs((area * R * R) / 2)
  return area
}

function calculateLineLengthM(latlngs: any[]): number {
  let total = 0
  for (let i = 1; i < latlngs.length; i++) {
    const lat1 = (latlngs[i - 1].lat * Math.PI) / 180
    const lat2 = (latlngs[i].lat * Math.PI) / 180
    const dLat = lat2 - lat1
    const dLng = ((latlngs[i].lng - latlngs[i - 1].lng) * Math.PI) / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
    total += 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }
  return total
}

function formatMeasurement(meters: number): string {
  if (meters >= 1000000) return `${(meters / 1000000).toFixed(2)} km²`
  if (meters >= 10000) return `${(meters / 10000).toFixed(2)} ha`
  return `${meters.toFixed(1)} m²`
}

function formatLength(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`
  return `${meters.toFixed(1)} m`
}

export default function SpatialMap({
  markers,
  polygons = [],
  boundaries = [],
  center,
  zoom,
  drawingMode = 'none',
  onDraw,
  onBoundaryClick,
  onMapReady,
  selectedBoundaryId,
}: SpatialMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const drawingStateRef = useRef<{
    mode: DrawingMode
    points: any[]
    tempLayer: any
    guideLayers: any[]
    drawnLayers: any[]
    undoStack: any[]
    redoStack: any[]
  }>({
    mode: 'none',
    points: [],
    tempLayer: null,
    guideLayers: [],
    drawnLayers: [],
    undoStack: [],
    redoStack: [],
  })
  const drawingModeRef = useRef(drawingMode)
  const measurementRef = useRef<HTMLDivElement>(null)
  const drawToolbarRef = useRef<HTMLDivElement>(null)

  // Keep ref in sync with prop
  useEffect(() => {
    drawingModeRef.current = drawingMode
    updateDrawToolbarState(drawingMode)
  }, [drawingMode])

  const updateDrawToolbarState = useCallback((mode: DrawingMode) => {
    const toolbar = drawToolbarRef.current
    if (!toolbar) return
    toolbar.querySelectorAll<HTMLButtonElement>('[data-draw-mode]').forEach((btn) => {
      if (btn.dataset.drawMode === mode) {
        btn.classList.add('bg-emerald-600', 'text-white')
        btn.classList.remove('bg-white', 'text-slate-700')
      } else {
        btn.classList.remove('bg-emerald-600', 'text-white')
        btn.classList.add('bg-white', 'text-slate-700')
      }
    })
  }, [])

  // ── Drawing handlers ──
  const setupDrawingHandlers = useCallback((L: any, map: any) => {
    const state = drawingStateRef.current

    const finishDrawing = () => {
      if (state.points.length < 2 && state.mode !== 'point') {
        clearTempLayers(L, map)
        state.points = []
        return
      }

      if (state.mode === 'point') {
        // Already handled on click
        return
      }

      if (state.mode === 'polygon' && state.points.length >= 3) {
        const closedPoints = [...state.points, state.points[0]]
        const geojson = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [closedPoints.map((p: any) => [p.lng, p.lat])],
          },
        }
        const area = calculatePolygonAreaM2(state.points)
        const layer = L.polygon(state.points.map((p: any) => [p.lat, p.lng]), {
          color: '#10b981',
          weight: 2,
          fillOpacity: 0.15,
          dashArray: '6 3',
        }).addTo(map)
        layer.bindPopup(`<div style="font-size:12px"><b>Polygon</b><br/>Area: ${formatMeasurement(area)}</div>`)
        state.drawnLayers.push(layer)
        state.undoStack.push(layer)
        state.redoStack = []
        onDraw?.({ type: 'polygon', geojson, measurement: formatMeasurement(area), layer })
      }

      if (state.mode === 'line' && state.points.length >= 2) {
        const geojson = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: state.points.map((p: any) => [p.lng, p.lat]),
          },
        }
        const length = calculateLineLengthM(state.points)
        const layer = L.polyline(state.points.map((p: any) => [p.lat, p.lng]), {
          color: '#f59e0b',
          weight: 3,
          dashArray: '8 4',
        }).addTo(map)
        layer.bindPopup(`<div style="font-size:12px"><b>Line</b><br/>Length: ${formatLength(length)}</div>`)
        state.drawnLayers.push(layer)
        state.undoStack.push(layer)
        state.redoStack = []
        onDraw?.({ type: 'polyline', geojson, measurement: formatLength(length), layer })
      }

      if (state.mode === 'rectangle' && state.points.length === 2) {
        const [p1, p2] = state.points
        const bounds = [
          [Math.min(p1.lat, p2.lat), Math.min(p1.lng, p2.lng)],
          [Math.max(p1.lat, p2.lat), Math.max(p1.lng, p2.lng)],
        ]
        const corners = [
          [bounds[0][0], bounds[0][1]],
          [bounds[1][0], bounds[0][1]],
          [bounds[1][0], bounds[1][1]],
          [bounds[0][0], bounds[1][1]],
          [bounds[0][0], bounds[0][1]],
        ]
        const geojson = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [corners.map((c) => [c[1], c[0]])],
          },
        }
        const latlngs = corners.map((c) => c as [number, number])
        const area = calculatePolygonAreaM2(latlngs.slice(0, -1).map((c) => ({ lat: c[0], lng: c[1] })))
        const layer = L.rectangle(bounds as any, {
          color: '#8b5cf6',
          weight: 2,
          fillOpacity: 0.15,
          dashArray: '6 3',
        }).addTo(map)
        layer.bindPopup(`<div style="font-size:12px"><b>Rectangle</b><br/>Area: ${formatMeasurement(area)}</div>`)
        state.drawnLayers.push(layer)
        state.undoStack.push(layer)
        state.redoStack = []
        onDraw?.({ type: 'rectangle', geojson, measurement: formatMeasurement(area), layer })
      }

      clearTempLayers(L, map)
      state.points = []
    }

    const clearTempLayers = (L: any, map: any) => {
      state.guideLayers.forEach((l) => map.removeLayer(l))
      state.guideLayers = []
      if (state.tempLayer) {
        map.removeLayer(state.tempLayer)
        state.tempLayer = null
      }
      if (measurementRef.current) {
        measurementRef.current.style.display = 'none'
      }
    }

    // Map click handler for drawing
    map.on('click', (e: any) => {
      const mode = drawingModeRef.current
      if (mode === 'none') return

      const { lat, lng } = e.latlng

      if (mode === 'point') {
        const geojson = {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: [lng, lat] },
        }
        const markerIcon = L.divIcon({
          html: `<div style="background:#f59e0b;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
          className: '',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        })
        const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map)
        marker.bindPopup(`<div style="font-size:12px"><b>Point</b><br/>${lat.toFixed(5)}, ${lng.toFixed(5)}</div>`)
        state.drawnLayers.push(marker)
        state.undoStack.push(marker)
        state.redoStack = []
        onDraw?.({ type: 'marker', geojson, measurement: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, layer: marker })
        return
      }

      state.points.push({ lat, lng })

      // Add vertex marker
      const vertexIcon = L.divIcon({
        html: `<div style="background:#10b981;width:8px;height:8px;border-radius:50%;border:1px solid white;"></div>`,
        className: '',
        iconSize: [8, 8],
        iconAnchor: [4, 4],
      })
      const vertex = L.marker([lat, lng], { icon: vertexIcon }).addTo(map)
      state.guideLayers.push(vertex)

      // Update temp line/polygon preview
      if (state.tempLayer) map.removeLayer(state.tempLayer)

      if (mode === 'line' && state.points.length >= 2) {
        state.tempLayer = L.polyline(
          state.points.map((p: any) => [p.lat, p.lng]),
          { color: '#f59e0b', weight: 2, dashArray: '5 5', opacity: 0.7 }
        ).addTo(map)
        const length = calculateLineLengthM(state.points)
        showMeasurement(formatLength(length), e)
      }

      if (mode === 'polygon' && state.points.length >= 2) {
        state.tempLayer = L.polygon(
          state.points.map((p: any) => [p.lat, p.lng]),
          { color: '#10b981', weight: 2, fillOpacity: 0.1, dashArray: '5 5' }
        ).addTo(map)
        if (state.points.length >= 3) {
          const area = calculatePolygonAreaM2(state.points)
          showMeasurement(formatMeasurement(area), e)
        }
      }

      if (mode === 'rectangle') {
        if (state.points.length === 1) {
          // Show crosshair guide
          state.tempLayer = L.circleMarker([lat, lng], {
            radius: 4, color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.5,
          }).addTo(map)
        }
        if (state.points.length === 2) {
          finishDrawing()
          return
        }
      }
    })

    // Double-click to finish polygon/line
    map.on('dblclick', (e: any) => {
      const mode = drawingModeRef.current
      if (mode === 'polygon' || mode === 'line') {
        L.DomEvent.stopPropagation(e)
        L.DomEvent.preventDefault(e)
        // Remove last point (dblclick adds an extra one)
        if (state.points.length > 0) state.points.pop()
        finishDrawing()
      }
    })

    // Right-click to finish polygon
    map.on('contextmenu', (e: any) => {
      const mode = drawingModeRef.current
      if (mode === 'polygon' || mode === 'line') {
        L.DomEvent.preventDefault(e)
        finishDrawing()
      }
    })

    // Mouse move for preview
    map.on('mousemove', (e: any) => {
      const mode = drawingModeRef.current
      if (mode === 'none' || state.points.length === 0) return
      const { lat, lng } = e.latlng

      if (state.tempLayer) map.removeLayer(state.tempLayer)

      if (mode === 'line' && state.points.length >= 1) {
        state.tempLayer = L.polyline(
          [...state.points, { lat, lng }].map((p: any) => [p.lat, p.lng]),
          { color: '#f59e0b', weight: 2, dashArray: '5 5', opacity: 0.5 }
        ).addTo(map)
      }

      if (mode === 'polygon' && state.points.length >= 1) {
        state.tempLayer = L.polygon(
          [...state.points, { lat, lng }].map((p: any) => [p.lat, p.lng]),
          { color: '#10b981', weight: 2, fillOpacity: 0.08, dashArray: '5 5' }
        ).addTo(map)
      }

      if (mode === 'rectangle' && state.points.length === 1) {
        const p1 = state.points[0]
        const bounds = [
          [Math.min(p1.lat, lat), Math.min(p1.lng, lng)],
          [Math.max(p1.lat, lat), Math.max(p1.lng, lng)],
        ]
        state.tempLayer = L.rectangle(bounds as any, {
          color: '#8b5cf6', weight: 2, fillOpacity: 0.1, dashArray: '5 5',
        }).addTo(map)
      }
    })

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearTempLayers(L, map)
        state.points = []
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        const last = state.undoStack.pop()
        if (last) {
          map.removeLayer(last)
          state.redoStack.push(last)
          const idx = state.drawnLayers.indexOf(last)
          if (idx > -1) state.drawnLayers.splice(idx, 1)
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        const redo = state.redoStack.pop()
        if (redo) {
          redo.addTo(map)
          state.undoStack.push(redo)
          state.drawnLayers.push(redo)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    // Expose undo/redo/clear for toolbar buttons
    ;(map as any)._drawUndo = () => {
      const last = state.undoStack.pop()
      if (last) {
        map.removeLayer(last)
        state.redoStack.push(last)
        const idx = state.drawnLayers.indexOf(last)
        if (idx > -1) state.drawnLayers.splice(idx, 1)
      }
    }
    ;(map as any)._drawRedo = () => {
      const redo = state.redoStack.pop()
      if (redo) {
        redo.addTo(map)
        state.undoStack.push(redo)
        state.drawnLayers.push(redo)
      }
    }
    ;(map as any)._drawClear = () => {
      state.drawnLayers.forEach((l) => map.removeLayer(l))
      state.drawnLayers = []
      state.undoStack = []
      state.redoStack = []
      clearTempLayers(L, map)
      state.points = []
    }
  }, [onDraw])

  const showMeasurement = (text: string, e: any) => {
    if (measurementRef.current) {
      measurementRef.current.textContent = text
      measurementRef.current.style.display = 'block'
    }
  }

  // ── Main map initialization ──
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then((L) => {
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center,
        zoom,
        zoomControl: true,
      })

      // ── Tile layers ──
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      })
      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri',
        maxZoom: 18,
      })
      const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenTopoMap',
        maxZoom: 17,
      })

      osmLayer.addTo(map)

      L.control.layers(
        { 'Street Map': osmLayer, Satellite: satelliteLayer, Topographic: topoLayer },
        {},
        { position: 'topright' }
      ).addTo(map)

      L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map)

      // ── Marker icons ──
      const clientIcon = L.divIcon({
        html: `<div style="background:#3b82f6;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:12px;font-weight:bold;">C</span></div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
      const observationIcon = L.divIcon({
        html: `<div style="background:#ef4444;width:24px;height:24px;border-radius:4px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:10px;font-weight:bold;">O</span></div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
      const projectIcon = L.divIcon({
        html: `<div style="background:#10b981;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:12px;font-weight:bold;">P</span></div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
      const iconMap: Record<string, any> = { client: clientIcon, observation: observationIcon, project: projectIcon }
      const typeLabels: Record<string, string> = { client: 'Client', observation: 'Observation', project: 'Project' }

      // ── Markers ──
      const districtGroups: Record<string, MapMarker[]> = {}
      markers.forEach((m) => {
        const key = m.district || m.description || 'Other'
        if (!districtGroups[key]) districtGroups[key] = []
        districtGroups[key].push(m)
      })

      markers.forEach((m) => {
        const icon = iconMap[m.type] || clientIcon
        L.marker([m.lat, m.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="min-width:200px">
              <strong style="font-size:13px">${m.title}</strong><br/>
              <span style="color:#6b7280;font-size:11px">${typeLabels[m.type] || m.type}</span>
              ${m.status ? `<br/>Status: <b style="font-size:11px">${m.status}</b>` : ''}
              ${m.description ? `<br/><small style="color:#6b7280">${m.description}</small>` : ''}
              <br/><small style="color:#94a3b8">${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}</small>
            </div>`
          )
      })

      // ── District cluster circles ──
      Object.entries(districtGroups).forEach(([district, dMarkers]) => {
        if (dMarkers.length <= 1) return
        const avgLat = dMarkers.reduce((s, m) => s + m.lat, 0) / dMarkers.length
        const avgLng = dMarkers.reduce((s, m) => s + m.lng, 0) / dMarkers.length
        const clusterIcon = L.divIcon({
          html: `<div style="position:relative;">
            <div style="background:rgba(16,185,129,0.15);border:2px solid rgba(16,185,129,0.4);border-radius:50%;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
              <span style="background:#10b981;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;box-shadow:0 1px 4px rgba(0,0,0,0.2);">${dMarkers.length}</span>
            </div>
          </div>`,
          className: '',
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        })
        if (dMarkers.length >= 3) {
          L.marker([avgLat, avgLng], { icon: clusterIcon, zIndexOffset: -1000 })
            .addTo(map)
            .bindTooltip(`${district}: ${dMarkers.length} points`, { direction: 'top', offset: [0, -24] })
        }
      })

      // ── Legacy polygons ──
      polygons.forEach((p) => {
        L.polygon(p.coordinates as any, { color: p.color, weight: 2, fillOpacity: 0.2 })
          .addTo(map)
          .bindPopup(`<strong>${p.title}</strong>`)
      })

      // ── GeoJSON Boundaries ──
      const boundaryLayerGroup = L.featureGroup().addTo(map)
      const boundaryLayers: Record<string, any> = {}

      boundaries.forEach((b) => {
        try {
          const geojson = typeof b.geojson === 'string' ? JSON.parse(b.geojson) : b.geojson
          if (!geojson) return

          const color = b.color || getStatusColor(b.status)
          const isSelected = String(b.id) === String(selectedBoundaryId)

          const layer = L.geoJSON(geojson as any, {
            style: {
              color: isSelected ? '#f59e0b' : color,
              weight: isSelected ? 4 : 2.5,
              fillColor: color,
              fillOpacity: isSelected ? 0.25 : 0.12,
              opacity: 0.9,
            },
            onEachFeature: (feature: any, leafletLayer: any) => {
              // Popup
              const popupContent = `
                <div style="min-width:220px;font-size:12px;">
                  <strong style="font-size:14px;color:#1e293b;">${b.name}</strong><br/>
                  <span style="display:inline-block;margin-top:4px;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600;background:${color}22;color:${color};border:1px solid ${color}44;">
                    ${b.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                  ${b.client ? `<br/><span style="color:#6b7280;">Client: ${b.client}</span>` : ''}
                  ${b.area_hectares ? `<br/><span style="color:#6b7280;">Area: ${Number(b.area_hectares).toFixed(2)} ha</span>` : ''}
                </div>`
              leafletLayer.bindPopup(popupContent)

              // Hover highlight
              leafletLayer.on('mouseover', () => {
                leafletLayer.setStyle({ weight: 4, fillOpacity: 0.3 })
                leafletLayer.bringToFront()
              })
              leafletLayer.on('mouseout', () => {
                leafletLayer.setStyle({
                  weight: String(b.id) === String(selectedBoundaryId) ? 4 : 2.5,
                  fillOpacity: String(b.id) === String(selectedBoundaryId) ? 0.25 : 0.12,
                })
              })

              // Click handler
              leafletLayer.on('click', () => {
                onBoundaryClick?.(b)
              })
            },
          })

          boundaryLayerGroup.addLayer(layer)
          boundaryLayers[String(b.id)] = layer
        } catch (err) {
          console.warn('Failed to render boundary:', b.id, err)
        }
      })

      // ── Fit bounds to include boundaries ──
      if (boundaries.length > 0) {
        try {
          const allBounds = (boundaryLayerGroup as any).getBounds()
          if (allBounds && allBounds.isValid()) {
            if (markers.length > 0) {
              const markerBounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as L.LatLngExpression))
              allBounds.extend(markerBounds)
              map.fitBounds(allBounds, { padding: [40, 40] })
            } else {
              map.fitBounds(allBounds, { padding: [40, 40] })
            }
          }
        } catch {
          // fallback to marker bounds
        }
      } else if (markers.length > 0) {
        const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as L.LatLngExpression))
        map.fitBounds(bounds, { padding: [40, 40] })
      }

      // ── Setup drawing handlers ──
      setupDrawingHandlers(L, map)

      mapInstanceRef.current = map

      setTimeout(() => map.invalidateSize(), 100)
      onMapReady?.()
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update boundary selection ──
  useEffect(() => {
    if (!mapInstanceRef.current || !boundaries.length) return
    // The boundary layers are created once; selection highlighting is handled via style
    // For dynamic updates, we'd need a more complex re-render approach
  }, [selectedBoundaryId, boundaries])

  // ── Drawing toolbar actions ──
  const handleUndo = () => mapInstanceRef.current?._drawUndo?.()
  const handleRedo = () => mapInstanceRef.current?._drawRedo?.()
  const handleClearDrawn = () => mapInstanceRef.current?._drawClear?.()

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <div className="relative w-full h-full">
        <div ref={mapRef} style={{ height: '100%', width: '100%', minHeight: '400px' }} />

        {/* ── Drawing Toolbar ── */}
        <div
          ref={drawToolbarRef}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-1.5"
          style={{ display: drawingMode !== 'none' ? 'flex' : 'none' }}
        >
          <button
            data-draw-mode="point"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 transition-colors"
            title="Draw Point"
            onClick={() => {
              drawingModeRef.current = 'point'
              updateDrawToolbarState('point')
            }}
          >
            ●
          </button>
          <button
            data-draw-mode="line"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 transition-colors"
            title="Draw Line"
            onClick={() => {
              drawingModeRef.current = 'line'
              updateDrawToolbarState('line')
            }}
          >
            ╱
          </button>
          <button
            data-draw-mode="polygon"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 transition-colors"
            title="Draw Polygon (dbl-click or right-click to finish)"
            onClick={() => {
              drawingModeRef.current = 'polygon'
              updateDrawToolbarState('polygon')
            }}
          >
            ▲
          </button>
          <button
            data-draw-mode="rectangle"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 transition-colors"
            title="Draw Rectangle (2 clicks)"
            onClick={() => {
              drawingModeRef.current = 'rectangle'
              updateDrawToolbarState('rectangle')
            }}
          >
            ▭
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs bg-white text-slate-500 hover:bg-slate-100 transition-colors"
            title="Undo (Ctrl+Z)"
            onClick={handleUndo}
          >
            ↶
          </button>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs bg-white text-slate-500 hover:bg-slate-100 transition-colors"
            title="Redo (Ctrl+Y)"
            onClick={handleRedo}
          >
            ↷
          </button>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs bg-white text-red-400 hover:bg-red-50 transition-colors"
            title="Clear All Drawn"
            onClick={handleClearDrawn}
          >
            ✕
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <span className="text-[10px] text-slate-400 px-1 hidden sm:inline">Dbl-click/Right-click to finish</span>
        </div>

        {/* ── Measurement Display ── */}
        <div
          ref={measurementRef}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 text-white text-xs font-mono px-3 py-1.5 rounded-lg shadow-lg"
          style={{ display: 'none' }}
        />

        {/* ── Legend ── */}
        {boundaries.length > 0 && (
          <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-3 max-w-[200px]">
            <h4 className="text-[11px] font-semibold text-slate-700 mb-2 uppercase tracking-wide">Boundary Legend</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-2.5 rounded-sm" style={{ background: '#10b981', opacity: 0.6 }} />
                <span className="text-[10px] text-slate-600">Active / In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-2.5 rounded-sm" style={{ background: '#f59e0b', opacity: 0.6 }} />
                <span className="text-[10px] text-slate-600">Pending / Intake</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-2.5 rounded-sm" style={{ background: '#3b82f6', opacity: 0.6 }} />
                <span className="text-[10px] text-slate-600">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-2.5 rounded-sm" style={{ background: '#ef4444', opacity: 0.6 }} />
                <span className="text-[10px] text-slate-600">Overdue / Cancelled</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-slate-100">
                <div className="w-5 h-2.5 rounded-sm border-2 border-amber-400" style={{ background: 'rgba(245,158,11,0.15)' }} />
                <span className="text-[10px] text-slate-600">Selected</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
