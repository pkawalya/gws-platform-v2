'use client'

import { useEffect, useRef } from 'react'

interface MapMarker {
  lat: number
  lng: number
  title: string
  type: 'client' | 'observation' | 'project'
  status?: string
  description?: string
  district?: string
}

interface SpatialMapProps {
  markers: MapMarker[]
  polygons?: Array<{
    coordinates: number[][][]
    title: string
    color: string
  }>
  center: [number, number]
  zoom: number
}

export default function SpatialMap({ markers, polygons = [], center, zoom }: SpatialMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Dynamic import of Leaflet
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

      // Multiple tile layers
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

      // Default layer
      osmLayer.addTo(map)

      // Layer controls
      L.control.layers({
        'Street Map': osmLayer,
        'Satellite': satelliteLayer,
        'Topographic': topoLayer,
      }, {}, { position: 'topright' }).addTo(map)

      // Scale control
      L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map)

      // Custom icons for different types with distinct shapes
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

      const iconMap: Record<string, any> = {
        client: clientIcon,
        observation: observationIcon,
        project: projectIcon,
      }

      const typeLabels: Record<string, string> = {
        client: 'Client',
        observation: 'Observation',
        project: 'Project',
      }

      // Group markers by district for clustering info
      const districtGroups: Record<string, MapMarker[]> = {}
      markers.forEach(m => {
        const key = m.district || m.description || 'Other'
        if (!districtGroups[key]) districtGroups[key] = []
        districtGroups[key].push(m)
      })

      // Add individual markers with popups
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

      // Add district cluster circles for project markers
      Object.entries(districtGroups).forEach(([district, dMarkers]) => {
        if (dMarkers.length <= 1) return
        // Calculate center of district markers
        const avgLat = dMarkers.reduce((s, m) => s + m.lat, 0) / dMarkers.length
        const avgLng = dMarkers.reduce((s, m) => s + m.lng, 0) / dMarkers.length

        // Add a cluster label for districts with multiple markers
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

        // Only show cluster markers at higher zoom levels to avoid clutter
        // They represent the grouping info
        if (dMarkers.length >= 3) {
          L.marker([avgLat, avgLng], { icon: clusterIcon, zIndexOffset: -1000 })
            .addTo(map)
            .bindTooltip(`${district}: ${dMarkers.length} points`, {
              direction: 'top',
              offset: [0, -24],
              className: 'text-xs',
            })
        }
      })

      // Add polygons
      polygons.forEach((p) => {
        L.polygon(p.coordinates as L.LatLngExpression[], {
          color: p.color,
          weight: 2,
          fillOpacity: 0.2,
        })
          .addTo(map)
          .bindPopup(`<strong>${p.title}</strong>`)
      })

      // Fit bounds to markers if any
      if (markers.length > 0) {
        const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as L.LatLngExpression))
        map.fitBounds(bounds, { padding: [40, 40] })
      }

      mapInstanceRef.current = map

      // Force a resize after mount
      setTimeout(() => map.invalidateSize(), 100)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      <div ref={mapRef} style={{ height: '100%', width: '100%', minHeight: '400px' }} />
    </>
  )
}
