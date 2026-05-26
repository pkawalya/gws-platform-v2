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

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      // Custom icons
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

      // Add markers
      markers.forEach((m) => {
        const icon = m.type === 'client' ? clientIcon : observationIcon
        L.marker([m.lat, m.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="min-width:160px"><strong>${m.title}</strong><br/><span style="color:#6b7280">${m.type === 'client' ? 'Client' : 'Observation'}</span>${m.status ? `<br/>Status: <b>${m.status}</b>` : ''}${m.description ? `<br/><small>${m.description}</small>` : ''}<br/><small>${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}</small></div>`
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
