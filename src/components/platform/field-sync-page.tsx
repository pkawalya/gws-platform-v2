'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RadioTower, ArrowUpRight, ArrowDownRight, AlertCircle, Crosshair, ChevronRight } from 'lucide-react'
import { fmt, statusBadge } from './constants'
import { SortableHeader } from './helpers'
import { DataTablePagination } from './data-table-pagination'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

interface FieldSyncPageProps {
  fieldSync: any
  openDetail: (type: string, data: any) => void
  selectedIds: Set<number>
  toggleSelect: (id: number) => void
  toggleAll: (ids: number[]) => void
}

export function FieldSyncPage({ fieldSync, openDetail, selectedIds, toggleSelect, toggleAll }: FieldSyncPageProps) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const handleSort = (field: string) => { if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc') } }

  const syncChartData = fieldSync?.syncEvents.map((e: any) => ({
    name: new Date(e.started_at).toLocaleDateString('en-UG', { month: 'short', day: 'numeric' }),
    Pushed: e.records_pushed, Pulled: e.records_pulled,
  })) || []

  const observations = fieldSync?.observations || []
  let sortedObs = [...observations]
  if (sortField) { sortedObs.sort((a: any, b: any) => { const av = (a[sortField] ?? '').toString().toLowerCase(); const bv = (b[sortField] ?? '').toString().toLowerCase(); return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av) }) }

  const paginated = sortedObs.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Sync Events', value: fieldSync?.syncEvents?.length || 0, icon: RadioTower },
          { label: 'Records Pushed', value: fieldSync?.syncEvents?.reduce((s: number, e: any) => s + e.records_pushed, 0) || 0, icon: ArrowUpRight },
          { label: 'Records Pulled', value: fieldSync?.syncEvents?.reduce((s: number, e: any) => s + e.records_pulled, 0) || 0, icon: ArrowDownRight },
          { label: 'Conflicts', value: fieldSync?.syncEvents?.reduce((s: number, e: any) => s + e.conflicts_count, 0) || 0, icon: AlertCircle },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-[11px] text-slate-500 uppercase tracking-wide">{s.label}</p><p className="text-xl font-bold mt-0.5">{s.value}</p></div>
            <s.icon className="w-5 h-5 text-slate-300" />
          </CardContent></Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Crosshair className="w-4 h-4 text-emerald-600" /> Field Observations</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs w-10"><Checkbox checked={paginated.length > 0 && paginated.every((o: any) => selectedIds.has(o.id))} onCheckedChange={() => toggleAll(paginated.map((o: any) => o.id))} /></TableHead>
                <TableHead className="text-xs"><SortableHeader label="Title" field="title" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs hidden sm:table-cell"><SortableHeader label="Type" field="observation_type" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs hidden md:table-cell">GPS</TableHead>
                <TableHead className="text-xs"><SortableHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs w-8"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {paginated.map((o: any) => (
                  <TableRow key={o.id} className={`cursor-pointer hover:bg-slate-50 ${selectedIds.has(o.id) ? 'bg-emerald-50/50' : ''}`}>
                    <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(o.id)} onCheckedChange={() => toggleSelect(o.id)} /></TableCell>
                    <TableCell onClick={() => openDetail('observation', o)}><p className="text-sm font-medium">{o.title}</p><p className="text-[11px] text-slate-400 line-clamp-1">{o.description}</p></TableCell>
                    <TableCell className="hidden sm:table-cell text-xs capitalize" onClick={() => openDetail('observation', o)}>{fmt(o.observation_type)}</TableCell>
                    <TableCell className="hidden md:table-cell text-[11px] text-slate-500 font-mono" onClick={() => openDetail('observation', o)}>{Number(o.latitude).toFixed(4)}, {Number(o.longitude).toFixed(4)}</TableCell>
                    <TableCell onClick={() => openDetail('observation', o)}>{statusBadge(o.status)}</TableCell>
                    <TableCell onClick={() => openDetail('observation', o)}><ChevronRight className="w-4 h-4 text-slate-300" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <DataTablePagination totalItems={sortedObs.length} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1) }} />
          </CardContent>
        </Card>
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Sync Activity</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={syncChartData}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} />
                  <RechartsTooltip /><Bar dataKey="Pushed" fill="#3b82f6" radius={[3, 3, 0, 0]} /><Bar dataKey="Pulled" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Sync Events</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {fieldSync?.syncEvents?.map((e: any) => (
                <div key={e.id} className="p-2.5 rounded-lg border cursor-pointer hover:border-blue-200 transition-colors" onClick={() => openDetail('sync', e)}>
                  <div className="flex items-center justify-between mb-1">
                    <Badge className={e.sync_type === 'push' ? 'bg-blue-100 text-blue-800 text-[10px]' : 'bg-emerald-100 text-emerald-800 text-[10px]'}>{e.sync_type.toUpperCase()}</Badge>
                    {statusBadge(e.status)}
                  </div>
                  <p className="text-[11px] text-slate-400">{new Date(e.started_at).toLocaleString()}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px]">
                    <span className="text-blue-600">↑{e.records_pushed}</span>
                    <span className="text-emerald-600">↓{e.records_pulled}</span>
                    {e.conflicts_count > 0 && <span className="text-red-600">⚠ {e.conflicts_count}</span>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
