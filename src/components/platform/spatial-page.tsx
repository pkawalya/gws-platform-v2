'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Map, Layers, ChevronRight, Search, Filter, Eye, MapPin, Radio } from 'lucide-react'
import { fmt, statusBadge } from './constants'
import { SortableHeader } from './helpers'
import { DataTablePagination } from './data-table-pagination'

const SpatialMap = dynamic(() => import('@/components/spatial-map'), { ssr: false })

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

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

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
    // Add project locations from projects data
    ...(projects || []).filter((p: any) => p.district).map((p: any) => {
      // Use approximate coordinates for districts in Uganda
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

  // Observations data table
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

  return (
    <div className="space-y-6">
      {/* Map Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Map className="w-4 h-4 text-emerald-600" />
              Interactive Map — Uganda
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div style={{ height: 'calc(100vh - 520px)', minHeight: '360px' }}>
              <SpatialMap markers={mapMarkers} polygons={mapPolygons} center={[0.3476, 32.5825]} zoom={9} />
            </div>
          </CardContent>
        </Card>
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
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Legend</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-500" /> Client</div>
              <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-red-500" /> Observation</div>
              <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-emerald-500" /> Project</div>
              <div className="flex items-center gap-2"><div className="w-4 h-2.5 rounded bg-emerald-500/30 border border-emerald-500" /> Boundary</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Annotations</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-40 overflow-y-auto">
              {spatial?.annotations?.map((a: any) => (
                <div key={a.id} className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"><p className="text-xs font-medium">{a.title}</p><Badge variant="outline" className="text-[10px] mt-0.5">{a.feature_type}</Badge></div>
              )) || (
                <p className="text-xs text-slate-400 text-center py-2">No annotations</p>
              )}
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
