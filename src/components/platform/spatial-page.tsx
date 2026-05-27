'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Map, Layers } from 'lucide-react'
import { fmt } from './constants'

const SpatialMap = dynamic(() => import('@/components/spatial-map'), { ssr: false })

interface SpatialPageProps {
  spatial: any
}

export function SpatialPage({ spatial }: SpatialPageProps) {
  const mapMarkers = [
    ...(spatial?.clients.map((c: any) => ({
      lat: Number(c.latitude), lng: Number(c.longitude),
      title: c.client_type === 'company' ? c.company_name : `${c.first_name} ${c.last_name}`,
      type: 'client' as const, status: c.status, description: c.district,
    })) || []),
    ...(spatial?.observations.map((o: any) => ({
      lat: Number(o.latitude), lng: Number(o.longitude),
      title: o.title, type: 'observation' as const, status: o.status, description: o.observation_type,
    })) || []),
  ]
  const mapPolygons = (spatial?.annotations?.filter((a: any) => a.feature_type === 'polygon' && a.geojson?.coordinates).map((a: any) => ({
    coordinates: a.geojson.coordinates[0], title: a.title || 'Boundary', color: a.properties?.color || '#3b82f6',
  })) || [])

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4">
      <Card className="overflow-hidden">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Map className="w-4 h-4 text-emerald-600" /> Interactive Map — Uganda</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div style={{ height: 'calc(100vh - 200px)', minHeight: '400px' }}>
            <SpatialMap markers={mapMarkers} polygons={mapPolygons} center={[0.3476, 32.5825]} zoom={9} />
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Layers</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {spatial?.layers.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between p-2 rounded bg-slate-50 text-sm">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.default_style?.color || '#3b82f6' }} /><span className="text-xs font-medium">{l.name}</span></div>
                  <Badge variant="outline" className="text-[10px]">{l.layer_type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Legend</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-500" /> Client</div>
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-red-500" /> Observation</div>
            <div className="flex items-center gap-2"><div className="w-4 h-2.5 rounded bg-emerald-500/30 border border-emerald-500" /> Boundary</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Annotations</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {spatial?.annotations.map((a: any) => (
              <div key={a.id} className="p-2 rounded bg-slate-50"><p className="text-xs font-medium">{a.title}</p><Badge variant="outline" className="text-[10px] mt-0.5">{a.feature_type}</Badge></div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
