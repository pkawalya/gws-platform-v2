'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessageSquare, Radio, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react'
import { fmt, statusBadge } from './constants'
import { SortableHeader } from './helpers'
import { DataTablePagination } from './data-table-pagination'
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'

interface CommunicationsPageProps {
  commsData: any
  openDetail: (type: string, data: any) => void
  selectedIds: Set<number>
  toggleSelect: (id: number) => void
  toggleAll: (ids: number[]) => void
}

export function CommunicationsPage({ commsData, openDetail, selectedIds, toggleSelect, toggleAll }: CommunicationsPageProps) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [channelFilter, setChannelFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const handleSort = (field: string) => { if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc') } }

  const metrics = commsData?.metrics || {}
  const comms = commsData?.communications || []
  const channels = Object.keys(metrics.byChannel || {})

  let filtered = channelFilter !== 'all' ? comms.filter((c: any) => c.channel === channelFilter) : comms
  if (sortField) {
    filtered = [...filtered].sort((a: any, b: any) => {
      const av = (a[sortField] ?? '').toString().toLowerCase(); const bv = (b[sortField] ?? '').toString().toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }

  const channelChartData = Object.entries(metrics.byChannel || {}).map(([name, value]) => ({ name: fmt(name), value: value as number, color: name === 'sms' ? '#10b981' : name === 'email' ? '#3b82f6' : '#f59e0b' }))
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Messages', value: metrics.total || 0, icon: MessageSquare },
          { label: 'Channels', value: channels.length, icon: Radio },
          { label: 'Outbound', value: (metrics.byDirection as any)?.outbound || 0, icon: ArrowUpRight },
          { label: 'Inbound', value: (metrics.byDirection as any)?.inbound || 0, icon: ArrowDownRight },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p><p className="text-xl font-bold mt-0.5">{k.value}</p></div>
            <k.icon className="w-5 h-5 text-slate-300" />
          </CardContent></Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Channel Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={channelChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                {channelChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie><RechartsTooltip /><Legend fontSize={11} /></PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Messages</CardTitle>
              <Select value={channelFilter} onValueChange={(v) => { setChannelFilter(v); setCurrentPage(1) }}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Filter channel" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Channels</SelectItem>{channels.map(c => <SelectItem key={c} value={c}>{fmt(c)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs w-10"><Checkbox checked={paginated.length > 0 && paginated.every((c: any) => selectedIds.has(c.id))} onCheckedChange={() => toggleAll(paginated.map((c: any) => c.id))} /></TableHead>
                <TableHead className="text-xs"><SortableHeader label="Subject" field="subject" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs hidden sm:table-cell"><SortableHeader label="Channel" field="channel" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs hidden md:table-cell">Direction</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Client</TableHead>
                <TableHead className="text-xs"><SortableHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs w-8"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {paginated.map((c: any) => (
                  <TableRow key={c.id} className={`cursor-pointer hover:bg-slate-50 ${selectedIds.has(c.id) ? 'bg-emerald-50/50' : ''}`}>
                    <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} /></TableCell>
                    <TableCell onClick={() => openDetail('communication', c)}><p className="text-sm font-medium">{c.subject || 'No Subject'}</p><p className="text-[11px] text-slate-400 line-clamp-1">{c.body?.substring(0, 60)}</p></TableCell>
                    <TableCell className="hidden sm:table-cell" onClick={() => openDetail('communication', c)}><Badge variant="outline" className="text-[10px]">{fmt(c.channel)}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell" onClick={() => openDetail('communication', c)}>
                      <Badge className={c.direction === 'outbound' ? 'bg-blue-100 text-blue-800 text-[10px]' : 'bg-emerald-100 text-emerald-800 text-[10px]'}>{fmt(c.direction)}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs" onClick={() => openDetail('communication', c)}>{c.client?.company_name || `${c.client?.first_name} ${c.client?.last_name}`}</TableCell>
                    <TableCell onClick={() => openDetail('communication', c)}>{statusBadge(c.status)}</TableCell>
                    <TableCell onClick={() => openDetail('communication', c)}><ChevronRight className="w-4 h-4 text-slate-300" /></TableCell>
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
