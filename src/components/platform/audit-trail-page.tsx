'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollText, Layers, Database, ChevronRight } from 'lucide-react'
import { fmt, statusBadge } from './constants'
import { SortableHeader } from './helpers'
import { DataTablePagination } from './data-table-pagination'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

interface AuditTrailPageProps {
  eventsData: any
  openDetail: (type: string, data: any) => void
  selectedIds: Set<number>
  toggleSelect: (id: number) => void
  toggleAll: (ids: number[]) => void
}

export function AuditTrailPage({ eventsData, openDetail, selectedIds, toggleSelect, toggleAll }: AuditTrailPageProps) {
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const handleSort = (field: string) => { if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc') } }

  const metrics = eventsData?.metrics || {}
  const events = eventsData?.events || []
  const eventTypes = Object.keys(metrics.byType || {})

  let filtered = typeFilter !== 'all' ? events.filter((e: any) => e.event_type === typeFilter) : events
  if (sortField) {
    filtered = [...filtered].sort((a: any, b: any) => {
      const av = (a[sortField] ?? '').toString().toLowerCase(); const bv = (b[sortField] ?? '').toString().toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }

  const typeChartData = Object.entries(metrics.byType || {}).slice(0, 8).map(([name, value]) => ({ name: fmt(name), count: value as number }))
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: 'Total Events', value: metrics.total || 0, icon: ScrollText },
          { label: 'Event Types', value: eventTypes.length, icon: Layers },
          { label: 'Aggregates', value: Object.keys(metrics.byAggregate || {}).length, icon: Database },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p><p className="text-xl font-bold mt-0.5">{k.value}</p></div>
            <k.icon className="w-5 h-5 text-slate-300" />
          </CardContent></Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Events by Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" fontSize={11} /><YAxis dataKey="name" type="category" fontSize={10} width={80} />
                <RechartsTooltip /><Bar dataKey="count" fill="#6366f1" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Domain Events</CardTitle>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1) }}>
                <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Filter by type" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Types</SelectItem>{eventTypes.map(t => <SelectItem key={t} value={t}>{fmt(t)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs w-10"><Checkbox checked={paginated.length > 0 && paginated.every((e: any) => selectedIds.has(e.id))} onCheckedChange={() => toggleAll(paginated.map((e: any) => e.id))} /></TableHead>
                <TableHead className="text-xs"><SortableHeader label="Event Type" field="event_type" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs hidden sm:table-cell"><SortableHeader label="Aggregate" field="aggregate" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs hidden md:table-cell">Aggregate ID</TableHead>
                <TableHead className="text-xs"><SortableHeader label="Time" field="created_at" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs w-8"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {paginated.map((e: any) => (
                  <TableRow key={e.id} className={`cursor-pointer hover:bg-slate-50 ${selectedIds.has(e.id) ? 'bg-emerald-50/50' : ''}`}>
                    <TableCell onClick={ev => ev.stopPropagation()}><Checkbox checked={selectedIds.has(e.id)} onCheckedChange={() => toggleSelect(e.id)} /></TableCell>
                    <TableCell onClick={() => openDetail('event', e)}><Badge variant="outline" className="text-[10px] font-mono">{fmt(e.event_type)}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell text-xs" onClick={() => openDetail('event', e)}>{fmt(e.aggregate)}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-[11px] text-slate-500" onClick={() => openDetail('event', e)}>{e.aggregate_id}</TableCell>
                    <TableCell className="text-[11px] text-slate-400" onClick={() => openDetail('event', e)}>{new Date(e.created_at).toLocaleString()}</TableCell>
                    <TableCell onClick={() => openDetail('event', e)}><ChevronRight className="w-4 h-4 text-slate-300" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <DataTablePagination totalItems={filtered.length} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1) }} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
