'use client'

import { useEffect, useRef } from 'react'

interface MapMarker {
  lat: number
  lng: number
  title: string
  type: 'client' | 'observation' | 'project'
  status?: string
  description?: string
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

      // Custom icons for different types
      const clientIcon = L.divIcon({
        html: `<div style="background:#3b82f6;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:12px;font-weight:bold;">C</span></div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })

      const observationIcon = L.divIcon({
        html: `<div style="background:#ef4444;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:10px;font-weight:bold;">O</span></div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      const projectIcon = L.divIcon({
        html: `<div style="background:#10b981;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:12px;font-weight:bold;">P</span></div>`,
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

      // Add markers
      markers.forEach((m) => {
        const icon = iconMap[m.type] || clientIcon
        L.marker([m.lat, m.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="min-width:180px"><strong style="font-size:13px">${m.title}</strong><br/><span style="color:#6b7280;font-size:11px">${typeLabels[m.type] || m.type}</span>${m.status ? `<br/>Status: <b style="font-size:11px">${m.status}</b>` : ''}${m.description ? `<br/><small style="color:#6b7280">${m.description}</small>` : ''}<br/><small style="color:#94a3b8">${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}</small></div>`
          )
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
