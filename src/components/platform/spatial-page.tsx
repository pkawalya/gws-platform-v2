'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Map, Layers, ChevronRight, Search, Filter, Eye, MapPin, Radio,
  Pencil, MousePointer, Hexagon, Square, Minus, Save, X,
} from 'lucide-react'
import { fmt, statusBadge } from './constants'
import { SortableHeader } from './helpers'
import { DataTablePagination } from './data-table-pagination'
import { MapAnnotations, type AnnotationItem } from './map-annotations'

const SpatialMap = dynamic(() => import('@/components/spatial-map'), { ssr: false })

type DrawingMode = 'none' | 'point' | 'line' | 'polygon' | 'rectangle' | 'circle'

interface DrawnFeature {
  type: 'marker' | 'polyline' | 'polygon' | 'rectangle' | 'circle'
  geojson: object
  measurement?: string
  layer?: any
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

interface SpatialPageProps {
  spatial: any
  openDetail: (type: string, data: any) => void
  selectedIds: Set<number>
  toggleSelect: (id: number) => void
  toggleAll: (ids: number[]) => void
  projects?: any[]
}

export function SpatialPage({ spatial, openDetail, selectedIds, toggleSelect, toggleAll, projects }: SpatialPageProps) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [mapLayer, setMapLayer] = useState<'all' | 'clients' | 'observations' | 'projects'>('all')

  // ── Drawing state ──
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('none')
  const [drawnFeatures, setDrawnFeatures] = useState<DrawnFeature[]>([])
  const [showDrawPanel, setShowDrawPanel] = useState(false)

  // ── Boundary state ──
  const [boundaryStatusFilter, setBoundaryStatusFilter] = useState('all')
  const [boundaryDistrictFilter, setBoundaryDistrictFilter] = useState('all')
  const [selectedBoundaryId, setSelectedBoundaryId] = useState<string | number | null>(null)

  // ── Annotations state ──
  const [annotations, setAnnotations] = useState<AnnotationItem[]>(
    (spatial?.annotations || []).map((a: any) => ({
      id: a.id,
      feature_type: a.feature_type || 'marker',
      title: a.title || 'Untitled',
      description: a.description || '',
      geojson: a.geojson || {},
      properties: a.properties || {},
      created_at: a.created_at,
      layer_id: a.layer_id,
    }))
  )

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  // ── Build map markers ──
  const mapMarkers = [
    ...(spatial?.clients?.filter((c: any) => c.latitude && c.longitude).map((c: any) => ({
      lat: Number(c.latitude), lng: Number(c.longitude),
      title: c.client_type === 'company' ? c.company_name : `${c.first_name} ${c.last_name}`,
      type: 'client' as const, status: c.status, description: c.district,
      district: c.district,
    })) || []),
    ...(spatial?.observations?.filter((o: any) => o.latitude && o.longitude).map((o: any) => ({
      lat: Number(o.latitude), lng: Number(o.longitude),
      title: o.title, type: 'observation' as const, status: o.status, description: o.observation_type,
      district: o.district,
    })) || []),
    ...(projects || []).filter((p: any) => p.district).map((p: any) => {
      const districtCoords: Record<string, [number, number]> = {
        'Kampala': [0.3476, 32.5825], 'Wakiso': [0.3676, 32.6316], 'Mukono': [0.3516, 32.7526],
        'Jinja': [0.4243, 33.2047], 'Entebbe': [0.0633, 32.4477], 'Mbale': [1.0833, 34.1750],
        'Gulu': [2.7746, 32.2990], 'Lira': [2.2497, 32.8997], 'Mbarara': [-0.6083, 30.6583],
        'Masaka': [-0.3414, 31.7356], 'Fort Portal': [0.6714, 30.2753],
      }
      const coords = districtCoords[p.district] || [1.0 + Math.random() * 0.5, 32.0 + Math.random() * 0.5]
      return {
        lat: coords[0], lng: coords[1],
        title: p.title, type: 'project' as const, status: p.status,
        description: `${fmt(p.project_type)} — ${p.district}`,
        district: p.district,
      }
    }),
  ].filter(m => mapLayer === 'all' || m.type === mapLayer)

  const mapPolygons = (spatial?.annotations?.filter((a: any) => a.feature_type === 'polygon' && a.geojson?.coordinates).map((a: any) => ({
    coordinates: a.geojson.coordinates[0], title: a.title || 'Boundary', color: a.properties?.color || '#3b82f6',
  })) || [])

  // ── Build boundaries from spatial.projectBoundaries (API) or projects prop ──
  const boundarySource = spatial?.projectBoundaries || (projects || []).filter((p: any) => p.boundary_geojson)
  const allBoundaries: BoundaryData[] = boundarySource
    .map((p: any) => {
      let geojson = p.boundary_geojson
      if (typeof geojson === 'string') {
        try { geojson = JSON.parse(geojson) } catch { geojson = {} }
      }
      const clientObj = p.client
      const clientName = clientObj
        ? clientObj.client_type === 'company'
          ? clientObj.company_name
          : `${clientObj.first_name || ''} ${clientObj.last_name || ''}`.trim()
        : undefined
      return {
        id: p.id,
        name: p.title,
        geojson: geojson || {},
        status: p.status,
        client: clientName,
        area_hectares: p.area_hectares,
      }
    })
    .filter((b: BoundaryData) => b.geojson && Object.keys(b.geojson).length > 0)

  // Collect unique districts from boundaries for the filter
  const boundaryDistricts: string[] = [...new Set(
    (spatial?.projectBoundaries || []).map((p: any) => p.district).filter(Boolean) as string[]
  )]

  // Apply boundary filters
  const filteredBoundaries = allBoundaries.filter((b) => {
    if (boundaryStatusFilter !== 'all' && b.status !== boundaryStatusFilter) return false
    if (boundaryDistrictFilter !== 'all') {
      const bDistrict = (spatial?.projectBoundaries || []).find(
        (p: any) => String(p.id) === String(b.id)
      )?.district
      if (bDistrict !== boundaryDistrictFilter) return false
    }
    return true
  })

  // ── Drawing handlers ──
  const handleDraw = useCallback((feature: DrawnFeature) => {
    setDrawnFeatures(prev => [...prev, { ...feature, layer: undefined }])
  }, [])

  const handleSaveAnnotation = useCallback(async (data: {
    title: string
    description: string
    feature_type: string
    geojson: object
    color: string
  }) => {
    try {
      const res = await fetch('/api/spatial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_annotation',
          ...data,
        }),
      })
      if (res.ok) {
        const result = await res.json()
        setAnnotations(prev => [...prev, {
          id: result.annotation?.id || `local-${Date.now()}`,
          feature_type: data.feature_type as any,
          title: data.title,
          description: data.description,
          geojson: data.geojson,
          properties: { color: data.color },
        }])
        // Remove from drawn features
        setDrawnFeatures(prev => prev.slice(0, -1))
      }
    } catch (err) {
      console.error('Failed to save annotation:', err)
      // Still add locally
      setAnnotations(prev => [...prev, {
        id: `local-${Date.now()}`,
        feature_type: data.feature_type as any,
        title: data.title,
        description: data.description,
        geojson: data.geojson,
        properties: { color: data.color },
      }])
    }
  }, [])

  const handleUpdateAnnotation = useCallback(async (id: string, data: Partial<AnnotationItem>) => {
    try {
      await fetch('/api/spatial', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      })
    } catch (err) {
      console.error('Failed to update annotation:', err)
    }
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...data } : a))
  }, [])

  const handleDeleteAnnotation = useCallback(async (id: string) => {
    try {
      await fetch('/api/spatial', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'delete' }),
      })
    } catch (err) {
      console.error('Failed to delete annotation:', err)
    }
    setAnnotations(prev => prev.filter(a => a.id !== id))
  }, [])

  const handleZoomToAnnotation = useCallback((annotation: AnnotationItem) => {
    // The SpatialMap would need an imperative handle for zoom
    // For now, we'll just highlight it
    setSelectedBoundaryId(null)
  }, [])

  const handleBoundaryClick = useCallback((boundary: BoundaryData) => {
    setSelectedBoundaryId(prev => prev === boundary.id ? null : boundary.id)
    openDetail('project', { id: boundary.id, title: boundary.name })
  }, [openDetail])

  // ── Observations table data ──
  const observations = spatial?.observations || []
  let filteredObs = statusFilter !== 'all' ? observations.filter((o: any) => o.status === statusFilter) : observations
  if (typeFilter !== 'all') filteredObs = filteredObs.filter((o: any) => o.observation_type === typeFilter)
  if (sortField) {
    filteredObs = [...filteredObs].sort((a: any, b: any) => {
      const av = (a[sortField] ?? '').toString().toLowerCase()
      const bv = (b[sortField] ?? '').toString().toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }
  const paginatedObs = filteredObs.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const clientCount = spatial?.clients?.filter((c: any) => c.latitude && c.longitude).length || 0
  const obsCount = spatial?.observations?.filter((o: any) => o.latitude && o.longitude).length || 0
  const projectCount = (projects || []).filter((p: any) => p.district).length || 0
  const boundaryCount = allBoundaries.length

  const DRAW_TOOLS: Array<{ mode: DrawingMode; icon: any; label: string }> = [
    { mode: 'point', icon: MapPin, label: 'Point' },
    { mode: 'line', icon: Minus, label: 'Line' },
    { mode: 'polygon', icon: Hexagon, label: 'Polygon' },
    { mode: 'rectangle', icon: Square, label: 'Rectangle' },
  ]

  return (
    <div className="space-y-6">
      {/* Map Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => setMapLayer('all')}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Map className="w-4 h-4 text-slate-600" /></div>
            <div><p className="text-xs text-slate-500">Total Points</p><p className="text-lg font-bold">{mapMarkers.length}</p></div>
          </CardContent>
        </Card>
        <Card className={`hover:shadow-md transition-all duration-200 cursor-pointer ${mapLayer === 'clients' ? 'ring-2 ring-blue-400' : ''}`} onClick={() => setMapLayer(mapLayer === 'clients' ? 'all' : 'clients')}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><MapPin className="w-4 h-4 text-blue-600" /></div>
            <div><p className="text-xs text-slate-500">Clients</p><p className="text-lg font-bold">{clientCount}</p></div>
          </CardContent>
        </Card>
        <Card className={`hover:shadow-md transition-all duration-200 cursor-pointer ${mapLayer === 'observations' ? 'ring-2 ring-red-400' : ''}`} onClick={() => setMapLayer(mapLayer === 'observations' ? 'all' : 'observations')}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><Eye className="w-4 h-4 text-red-600" /></div>
            <div><p className="text-xs text-slate-500">Observations</p><p className="text-lg font-bold">{obsCount}</p></div>
          </CardContent>
        </Card>
        <Card className={`hover:shadow-md transition-all duration-200 cursor-pointer ${mapLayer === 'projects' ? 'ring-2 ring-emerald-400' : ''}`} onClick={() => setMapLayer(mapLayer === 'projects' ? 'all' : 'projects')}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Radio className="w-4 h-4 text-emerald-600" /></div>
            <div><p className="text-xs text-slate-500">Projects</p><p className="text-lg font-bold">{projectCount}</p></div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-all duration-200">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center"><Hexagon className="w-4 h-4 text-violet-600" /></div>
            <div><p className="text-xs text-slate-500">Boundaries</p><p className="text-lg font-bold">{boundaryCount}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Map + Sidebar */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-3">
          {/* Map Controls Bar */}
          <Card>
            <CardContent className="p-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant={drawingMode === 'none' ? 'default' : 'outline'}
                    className={`h-7 text-xs ${drawingMode === 'none' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    onClick={() => { setDrawingMode('none'); setShowDrawPanel(false) }}
                  >
                    <MousePointer className="w-3.5 h-3.5 mr-1" />
                    View
                  </Button>
                  {DRAW_TOOLS.map((tool) => (
                    <Button
                      key={tool.mode}
                      size="sm"
                      variant={drawingMode === tool.mode ? 'default' : 'outline'}
                      className={`h-7 text-xs ${drawingMode === tool.mode ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                      onClick={() => { setDrawingMode(tool.mode); setShowDrawPanel(true) }}
                    >
                      <tool.icon className="w-3.5 h-3.5 mr-1" />
                      <span className="hidden sm:inline">{tool.label}</span>
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {drawingMode !== 'none' && (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                      <Pencil className="w-3 h-3 mr-1" />
                      Drawing Mode
                    </Badge>
                  )}
                  <Select value={boundaryStatusFilter} onValueChange={setBoundaryStatusFilter}>
                    <SelectTrigger className="h-7 w-32 text-xs">
                      <Filter className="w-3 h-3 mr-1" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="field_survey">Field Survey</SelectItem>
                      <SelectItem value="data_processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="intake">Intake</SelectItem>
                    </SelectContent>
                  </Select>
                  {boundaryDistricts.length > 1 && (
                    <Select value={boundaryDistrictFilter} onValueChange={setBoundaryDistrictFilter}>
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue placeholder="District" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Districts</SelectItem>
                        {boundaryDistricts.map((d: string) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Map className="w-4 h-4 text-emerald-600" />
                Interactive Map — Uganda
                {filteredBoundaries.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{filteredBoundaries.length} boundaries</Badge>
                )}
                {drawingMode !== 'none' && (
                  <Badge className="text-[10px] bg-amber-100 text-amber-700">Drawing: {drawingMode}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div style={{ height: 'calc(100vh - 520px)', minHeight: '400px' }}>
                <SpatialMap
                  markers={mapMarkers}
                  polygons={mapPolygons}
                  boundaries={filteredBoundaries}
                  center={[0.3476, 32.5825]}
                  zoom={9}
                  drawingMode={drawingMode}
                  onDraw={handleDraw}
                  onBoundaryClick={handleBoundaryClick}
                  selectedBoundaryId={selectedBoundaryId}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Layers</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {spatial?.layers?.map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-sm hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.default_style?.color || '#3b82f6' }} /><span className="text-xs font-medium">{l.name}</span></div>
                    <Badge variant="outline" className="text-[10px]">{l.layer_type}</Badge>
                  </div>
                )) || (
                  <p className="text-xs text-slate-400 text-center py-2">No layers defined</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* District Cluster Summary */}
          {(() => {
            const districtMap: Record<string, { count: number; types: Record<string, number> }> = {}
            mapMarkers.forEach(m => {
              const d = m.district || m.description || 'Unknown'
              if (!districtMap[d]) districtMap[d] = { count: 0, types: {} }
              districtMap[d].count++
              districtMap[d].types[m.type] = (districtMap[d].types[m.type] || 0) + 1
            })
            const districts = Object.entries(districtMap).sort((a, b) => b[1].count - a[1].count)
            return districts.length > 0 ? (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">District Clusters ({districts.length})</CardTitle></CardHeader>
                <CardContent className="space-y-1.5 max-h-40 overflow-y-auto">
                  {districts.map(([name, data]) => (
                    <div key={name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{name}</span>
                        <div className="flex items-center gap-1">
                          {data.types.client ? <Badge className="bg-blue-100 text-blue-700 text-[9px] px-1 py-0">C:{data.types.client}</Badge> : null}
                          {data.types.project ? <Badge className="bg-emerald-100 text-emerald-700 text-[9px] px-1 py-0">P:{data.types.project}</Badge> : null}
                          {data.types.observation ? <Badge className="bg-red-100 text-red-700 text-[9px] px-1 py-0">O:{data.types.observation}</Badge> : null}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{data.count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null
          })()}

          {/* Boundaries List */}
          {filteredBoundaries.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Hexagon className="w-4 h-4 text-violet-600" />
                  Project Boundaries ({filteredBoundaries.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 max-h-48 overflow-y-auto">
                {filteredBoundaries.map((b) => {
                  const statusColor = b.color || (
                    ['active', 'field_survey', 'in_progress'].includes(b.status) ? '#10b981' :
                    ['pending', 'intake', 'data_processing', 'draft'].includes(b.status) ? '#f59e0b' :
                    ['completed', 'approved', 'delivered'].includes(b.status) ? '#3b82f6' : '#6b7280'
                  )
                  const isSelected = selectedBoundaryId === b.id
                  return (
                    <div
                      key={String(b.id)}
                      className={`p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                        isSelected ? 'bg-amber-50 ring-1 ring-amber-300' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                      onClick={() => handleBoundaryClick(b)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: statusColor, opacity: 0.7 }} />
                        <span className="font-medium truncate">{b.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 ml-5">
                        <Badge variant="outline" className="text-[9px]">{fmt(b.status)}</Badge>
                        {b.area_hectares && <span className="text-[10px] text-slate-400">{Number(b.area_hectares).toFixed(1)} ha</span>}
                        {b.client && <span className="text-[10px] text-slate-400 truncate">{b.client}</span>}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Annotations Panel */}
          <MapAnnotations
            annotations={annotations}
            drawnFeatures={drawnFeatures}
            onZoomTo={handleZoomToAnnotation}
            onSaveAnnotation={handleSaveAnnotation}
            onUpdateAnnotation={handleUpdateAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
          />

          {/* Legend */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Legend</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Markers</p>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-500" /> Client</div>
              <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-red-500" /> Observation</div>
              <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-emerald-500" /> Project</div>
              <div className="mt-2 pt-2 border-t border-slate-100">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Boundaries</p>
                <div className="space-y-1.5 mt-1">
                  <div className="flex items-center gap-2"><div className="w-4 h-2.5 rounded-sm" style={{ background: '#10b981', opacity: 0.5 }} /> Active / In Progress</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-2.5 rounded-sm" style={{ background: '#f59e0b', opacity: 0.5 }} /> Pending / Intake</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-2.5 rounded-sm" style={{ background: '#3b82f6', opacity: 0.5 }} /> Completed</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-2.5 rounded-sm" style={{ background: '#ef4444', opacity: 0.5 }} /> Overdue</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Observations Data Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Field Observations ({observations.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
                <SelectTrigger className="h-7 w-28 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {observations.length === 0 ? (
            <div className="py-12 text-center">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No field observations</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-10">
                    <Checkbox checked={paginatedObs.length > 0 && paginatedObs.every((o: any) => selectedIds.has(o.id))} onCheckedChange={() => toggleAll(paginatedObs.map((o: any) => o.id))} />
                  </TableHead>
                  <TableHead className="text-xs"><SortableHeader label="Title" field="title" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                  <TableHead className="text-xs hidden sm:table-cell"><SortableHeader label="Type" field="observation_type" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Coordinates</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Accuracy</TableHead>
                  <TableHead className="text-xs"><SortableHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Created</TableHead>
                  <TableHead className="text-xs w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedObs.map((o: any) => (
                  <TableRow key={o.id} className={`cursor-pointer hover:bg-slate-50 transition-colors ${selectedIds.has(o.id) ? 'bg-emerald-50/50' : ''}`}>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(o.id)} onCheckedChange={() => toggleSelect(o.id)} />
                    </TableCell>
                    <TableCell onClick={() => openDetail('observation', o)}>
                      <p className="text-sm font-medium">{o.title}</p>
                      <p className="text-[11px] text-slate-400">{o.description?.substring(0, 50) || 'No description'}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell" onClick={() => openDetail('observation', o)}>
                      <Badge variant="outline" className="text-[10px]">{fmt(o.observation_type)}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell" onClick={() => openDetail('observation', o)}>
                      <span className="font-mono text-[11px]">{Number(o.latitude).toFixed(4)}, {Number(o.longitude).toFixed(4)}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-slate-500" onClick={() => openDetail('observation', o)}>
                      {o.accuracy_meters ? `${Number(o.accuracy_meters)}m` : '—'}
                    </TableCell>
                    <TableCell onClick={() => openDetail('observation', o)}>{statusBadge(o.status)}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-slate-500" onClick={() => openDetail('observation', o)}>
                      {new Date(o.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell onClick={() => openDetail('observation', o)}><ChevronRight className="w-4 h-4 text-slate-300" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <DataTablePagination
            totalItems={filteredObs.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1) }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
