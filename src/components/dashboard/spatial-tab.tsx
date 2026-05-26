'use client'

import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Layers, MapPinned } from 'lucide-react'

const MapComponent = dynamic(() => import('./map-component'), { ssr: false })

interface SpatialData {
  spatialLayers: Array<{
    id: string
    name: string
    slug: string
    layer_type: string
    source_type: string
    is_active: boolean
  }>
  mapAnnotations: Array<{
    id: string
    feature_type: string
    geojson: Record<string, unknown>
    title: string | null
    description: string | null
  }>
  fieldObservations: Array<{
    id: string
    observation_type: string
    title: string
    description: string | null
    latitude: number
    longitude: number
    accuracy_meters: number | null
    status: string
  }>
}

interface ClientsData {
  clients: Array<{
    id: string
    client_ref: string
    first_name: string | null
    last_name: string | null
    company_name: string | null
    district: string | null
    latitude: number | null
    longitude: number | null
    status: string
  }>
}

export function SpatialTab() {
  const { data: spatialData, isLoading: spatialLoading } = useQuery<SpatialData>({
    queryKey: ['spatial'],
    queryFn: () => fetch('/api/spatial').then((r) => r.json()),
  })

  const { data: clientsData, isLoading: clientsLoading } = useQuery<ClientsData>({
    queryKey: ['clients'],
    queryFn: () => fetch('/api/clients').then((r) => r.json()),
  })

  if (spatialLoading || clientsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-96 bg-muted rounded-lg animate-pulse flex items-center justify-center">
            <MapPinned className="h-12 w-12 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const clients = clientsData?.clients || []
  const observations = spatialData?.fieldObservations || []
  const annotations = spatialData?.mapAnnotations || []
  const layers = spatialData?.spatialLayers || []

  return (
    <div className="space-y-4">
      {/* Map Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 p-2">
              <Layers className="h-4 w-4 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Layers</p>
              <p className="text-lg font-bold">{layers.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 p-2">
              <MapPinned className="h-4 w-4 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Clients on Map</p>
              <p className="text-lg font-bold">{clients.filter((c) => c.latitude).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-100 p-2">
              <MapPinned className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Observations</p>
              <p className="text-lg font-bold">{observations.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-red-100 p-2">
              <Layers className="h-4 w-4 text-red-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Annotations</p>
              <p className="text-lg font-bold">{annotations.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPinned className="h-4 w-4" />
            Spatial Map — Uganda / Kampala Region
          </CardTitle>
          <CardDescription>
            Interactive map showing client locations, field observations, and spatial annotations.
            Toggle layers using the control in the top-right corner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MapComponent
            clients={clients}
            observations={observations}
            annotations={annotations}
            layers={layers}
          />
        </CardContent>
      </Card>

      {/* Observation Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Field Observation Details</CardTitle>
          <CardDescription>GPS-tagged field observations with coordinates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {observations.map((obs) => (
              <div key={obs.id} className="p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{obs.title}</span>
                  <Badge variant="outline" className="text-xs">{obs.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{obs.observation_type}</p>
                <div className="text-xs text-muted-foreground font-mono">
                  {obs.latitude.toFixed(6)}, {obs.longitude.toFixed(6)}
                </div>
                {obs.accuracy_meters && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Accuracy: ±{obs.accuracy_meters}m
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
