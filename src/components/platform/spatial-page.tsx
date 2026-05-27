'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Map, Layers, ChevronRight } from 'lucide-react'
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
}

export function SpatialPage({ spatial, openDetail, selectedIds, toggleSelect, toggleAll }: SpatialPageProps) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

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

  // Observations data table
  const observations = spatial?.observations || []
  let filteredObs = statusFilter !== 'all' ? observations.filter((o: any) => o.status === statusFilter) : observations
  if (sortField) {
    filteredObs = [...filteredObs].sort((a: any, b: any) => {
      const av = (a[sortField] ?? '').toString().toLowerCase()
      const bv = (b[sortField] ?? '').toString().toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }
  const paginatedObs = filteredObs.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Map className="w-4 h-4 text-emerald-600" /> Interactive Map — Uganda</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div style={{ height: 'calc(100vh - 440px)', minHeight: '320px' }}>
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

      {/* Observations Data Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Field Observations ({observations.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs w-10">
                  <Checkbox
                    checked={paginatedObs.length > 0 && paginatedObs.every((o: any) => selectedIds.has(o.id))}
                    onCheckedChange={() => toggleAll(paginatedObs.map((o: any) => o.id))}
                  />
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
                <TableRow key={o.id} className={`cursor-pointer hover:bg-slate-50 ${selectedIds.has(o.id) ? 'bg-emerald-50/50' : ''}`}>
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
              {paginatedObs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-sm text-slate-400">
                    No field observations found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
