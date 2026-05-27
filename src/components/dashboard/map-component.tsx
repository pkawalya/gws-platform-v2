'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface ClientLocation {
  id: string
  client_ref: string
  first_name: string | null
  last_name: string | null
  company_name: string | null
  district: string | null
  latitude: number | null
  longitude: number
  status: string
}

interface FieldObservation {
  id: string
  observation_type: string
  title: string
  description: string | null
  latitude: number
  longitude: number
  accuracy_meters: number | null
  status: string
}

interface MapAnnotation {
  id: string
  feature_type: string
  geojson: Record<string, unknown>
  title: string | null
  description: string | null
}

interface SpatialLayer {
  id: string
  name: string
  layer_type: string
  is_active: boolean
}

interface MapComponentProps {
  clients: ClientLocation[]
  observations: FieldObservation[]
  annotations: MapAnnotation[]
  layers: SpatialLayer[]
}

const clientIcon = new L.DivIcon({
  html: `<div style="background:#059669;width:28px;height:28px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const observationIcon = new L.DivIcon({
  html: `<div style="background:#d97706;width:28px;height:28px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

export default function MapComponent({
  clients,
  observations,
  annotations,
  layers,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const layerGroupRefs = useRef<Record<string, L.LayerGroup>>({})

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [0.3476, 32.5825],
      zoom: 10,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    // Client markers layer
    const clientLayer = L.layerGroup()
    clients.forEach((client) => {
      if (client.latitude && client.longitude) {
        const marker = L.marker([client.latitude, client.longitude], { icon: clientIcon })
        marker.bindPopup(`
          <div style="min-width:180px">
            <strong style="font-size:13px">${client.company_name || `${client.first_name || ''} ${client.last_name || ''}`}</strong>
            <br/><span style="color:#666;font-size:11px">${client.client_ref}</span>
            <br/><span style="color:#666;font-size:11px">District: ${client.district || 'N/A'}</span>
            <br/><span style="font-size:11px">Status: <b>${client.status}</b></span>
          </div>
        `)
        clientLayer.addLayer(marker)
      }
    })
    clientLayer.addTo(map)
    layerGroupRefs.current['clients'] = clientLayer

    // Observation markers layer
    const observationLayer = L.layerGroup()
    observations.forEach((obs) => {
      if (obs.latitude && obs.longitude) {
        const marker = L.marker([obs.latitude, obs.longitude], { icon: observationIcon })
        marker.bindPopup(`
          <div style="min-width:180px">
            <strong style="font-size:13px">${obs.title}</strong>
            <br/><span style="color:#666;font-size:11px">Type: ${obs.observation_type}</span>
            ${obs.description ? `<br/><span style="color:#666;font-size:11px">${obs.description.substring(0, 80)}</span>` : ''}
            <br/><span style="font-size:11px">Accuracy: ${obs.accuracy_meters ? obs.accuracy_meters + 'm' : 'N/A'}</span>
            <br/><span style="font-size:11px">Status: <b>${obs.status}</b></span>
          </div>
        `)
        observationLayer.addLayer(marker)
      }
    })
    observationLayer.addTo(map)
    layerGroupRefs.current['observations'] = observationLayer

    // Annotations layer
    const annotationLayer = L.layerGroup()
    annotations.forEach((ann) => {
      try {
        if (ann.feature_type === 'marker' && ann.geojson) {
          const coords = (ann.geojson as { coordinates: number[] }).coordinates
          if (coords && coords.length >= 2) {
            const m = L.marker([coords[1], coords[0]])
            m.bindPopup(`
              <div>
                <strong>${ann.title || 'Annotation'}</strong>
                ${ann.description ? `<br/><span style="color:#666;font-size:11px">${ann.description}</span>` : ''}
              </div>
            `)
            annotationLayer.addLayer(m)
          }
        } else if (ann.feature_type === 'polygon' && ann.geojson) {
          const geoJsonData = ann.geojson as GeoJSON.GeoJsonObject
          const gj = L.geoJSON(geoJsonData, {
            style: {
              color: '#ef4444',
              weight: 2,
              fillColor: '#ef4444',
              fillOpacity: 0.15,
            },
          })
          gj.bindPopup(`
            <div>
              <strong>${ann.title || 'Boundary'}</strong>
              ${ann.description ? `<br/><span style="color:#666;font-size:11px">${ann.description}</span>` : ''}
            </div>
          `)
          annotationLayer.addLayer(gj)
        }
      } catch (e) {
        console.error('Error rendering annotation:', e)
      }
    })
    annotationLayer.addTo(map)
    layerGroupRefs.current['annotations'] = annotationLayer

    mapRef.current = map

    // Add layer control
    const overlayMaps: Record<string, L.LayerGroup> = {
      Clients: clientLayer,
      'Field Observations': observationLayer,
      Annotations: annotationLayer,
    }
    L.control.layers(undefined, overlayMaps, { position: 'topright' }).addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div className="space-y-4">
      <div
        ref={mapContainerRef}
        style={{ height: '500px', width: '100%', borderRadius: '8px' }}
        className="border z-0"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {layers.map((layer) => (
          <div key={layer.id} className="flex items-center gap-2 p-3 rounded-lg border bg-muted/20">
            <div
              className={`h-3 w-3 rounded-full ${layer.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}
            />
            <div>
              <p className="text-sm font-medium">{layer.name}</p>
              <p className="text-xs text-muted-foreground">{layer.layer_type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
