'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShieldCheck, CheckCircle2, Clock, AlertCircle, ChevronRight } from 'lucide-react'
import { fmt, statusBadge } from './constants'
import { SortableHeader } from './helpers'
import { DataTablePagination } from './data-table-pagination'

interface ApprovalsPageProps {
  approvalsData: any
  openDetail: (type: string, data: any) => void
  selectedIds: Set<number>
  toggleSelect: (id: number) => void
  toggleAll: (ids: number[]) => void
  onRefresh?: () => void
}

export function ApprovalsPage({ approvalsData, openDetail, selectedIds, toggleSelect, toggleAll, onRefresh }: ApprovalsPageProps) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const handleSort = (field: string) => { if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc') } }

  const metrics = approvalsData?.metrics || {}
  const approvals = approvalsData?.approvals || []

  let filtered = statusFilter !== 'all' ? approvals.filter((a: any) => a.status === statusFilter) : approvals
  if (sortField) {
    filtered = [...filtered].sort((a: any, b: any) => {
      const av = (a[sortField] ?? '').toString().toLowerCase(); const bv = (b[sortField] ?? '').toString().toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Steps', value: metrics.total || 0, icon: ShieldCheck },
          { label: 'Approved', value: metrics.approved || 0, icon: CheckCircle2 },
          { label: 'Pending', value: metrics.pending || 0, icon: Clock },
          { label: 'Deferred', value: metrics.deferred || 0, icon: AlertCircle },
        ].map(k => (
          <Card key={k.label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatusFilter(k.label === 'Total Steps' ? 'all' : k.label.toLowerCase()); setCurrentPage(1) }}>
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p><p className="text-xl font-bold mt-0.5">{k.value}</p></div>
              <k.icon className="w-5 h-5 text-slate-300" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="deferred">Deferred</SelectItem></SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs w-10"><Checkbox checked={paginated.length > 0 && paginated.every((a: any) => selectedIds.has(a.id))} onCheckedChange={() => toggleAll(paginated.map((a: any) => a.id))} /></TableHead>
              <TableHead className="text-xs"><SortableHeader label="Step" field="step_name" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs hidden sm:table-cell">Project</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Client</TableHead>
              <TableHead className="text-xs">Order</TableHead>
              <TableHead className="text-xs"><SortableHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs hidden lg:table-cell">Approver</TableHead>
              <TableHead className="text-xs w-8"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {paginated.map((a: any) => (
                <TableRow key={a.id} className={`cursor-pointer hover:bg-slate-50 ${selectedIds.has(a.id) ? 'bg-emerald-50/50' : ''}`}>
                  <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(a.id)} onCheckedChange={() => toggleSelect(a.id)} /></TableCell>
                  <TableCell onClick={() => openDetail('approval', a)}><p className="text-sm font-medium">{fmt(a.step_name)}</p><p className="text-[11px] text-slate-400">{a.approver_role || 'Unassigned'}</p></TableCell>
                  <TableCell className="hidden sm:table-cell text-xs" onClick={() => openDetail('approval', a)}>{a.surveyProject?.title || '—'}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs" onClick={() => openDetail('approval', a)}>{a.surveyProject?.client?.company_name || `${a.surveyProject?.client?.first_name || ''} ${a.surveyProject?.client?.last_name || ''}`}</TableCell>
                  <TableCell className="text-xs" onClick={() => openDetail('approval', a)}>{a.step_order}</TableCell>
                  <TableCell onClick={() => openDetail('approval', a)}>{statusBadge(a.status)}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs" onClick={() => openDetail('approval', a)}>{a.assigned_to || '—'}</TableCell>
                  <TableCell onClick={() => openDetail('approval', a)}><ChevronRight className="w-4 h-4 text-slate-300" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DataTablePagination totalItems={filtered.length} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1) }} />
        </CardContent>
      </Card>
    </div>
  )
}
