'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, ShieldCheck, AlertCircle, Layers, ChevronRight } from 'lucide-react'
import { fmt, statusBadge } from './constants'
import { SortableHeader } from './helpers'
import { DataTablePagination } from './data-table-pagination'

interface DocumentsPageProps {
  documentsData: any
  openDetail: (type: string, data: any) => void
  selectedIds: Set<number>
  toggleSelect: (id: number) => void
  toggleAll: (ids: number[]) => void
}

export function DocumentsPage({ documentsData, openDetail, selectedIds, toggleSelect, toggleAll }: DocumentsPageProps) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const handleSort = (field: string) => { if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc') } }

  const metrics = documentsData?.metrics || {}
  const documents = documentsData?.documents || []
  const docTypes = Object.keys(metrics.byType || {})

  let filtered = typeFilter !== 'all' ? documents.filter((d: any) => d.document_type === typeFilter) : documents
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
          { label: 'Total Documents', value: metrics.total || 0, icon: FileText },
          { label: 'Verified', value: metrics.verified || 0, icon: ShieldCheck },
          { label: 'Unverified', value: metrics.unverified || 0, icon: AlertCircle },
          { label: 'Document Types', value: docTypes.length, icon: Layers },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p><p className="text-xl font-bold mt-0.5">{k.value}</p></div>
            <k.icon className="w-5 h-5 text-slate-300" />
          </CardContent></Card>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1) }}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Filter by type" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Types</SelectItem>{docTypes.map(t => <SelectItem key={t} value={t}>{fmt(t)}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs w-10"><Checkbox checked={paginated.length > 0 && paginated.every((d: any) => selectedIds.has(d.id))} onCheckedChange={() => toggleAll(paginated.map((d: any) => d.id))} /></TableHead>
              <TableHead className="text-xs"><SortableHeader label="Title" field="title" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs hidden sm:table-cell"><SortableHeader label="Type" field="document_type" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs hidden md:table-cell">Client</TableHead>
              <TableHead className="text-xs">Verification</TableHead>
              <TableHead className="text-xs hidden lg:table-cell">Size</TableHead>
              <TableHead className="text-xs w-8"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {paginated.map((doc: any) => (
                <TableRow key={doc.id} className={`cursor-pointer hover:bg-slate-50 ${selectedIds.has(doc.id) ? 'bg-emerald-50/50' : ''}`}>
                  <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(doc.id)} onCheckedChange={() => toggleSelect(doc.id)} /></TableCell>
                  <TableCell onClick={() => openDetail('document', doc)}><p className="text-sm font-medium">{doc.title}</p><p className="text-[11px] text-slate-400">{doc.mime_type}</p></TableCell>
                  <TableCell className="hidden sm:table-cell" onClick={() => openDetail('document', doc)}><Badge variant="outline" className="text-[10px]">{fmt(doc.document_type)}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell text-xs" onClick={() => openDetail('document', doc)}>{doc.client?.company_name || `${doc.client?.first_name} ${doc.client?.last_name}`}</TableCell>
                  <TableCell onClick={() => openDetail('document', doc)}>
                    <Badge variant="outline" className={`text-[10px] ${doc.is_verified ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                      {doc.is_verified ? '✓ Verified' : 'Unverified'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-slate-500" onClick={() => openDetail('document', doc)}>{doc.file_size ? `${(Number(doc.file_size) / 1024).toFixed(1)} KB` : '—'}</TableCell>
                  <TableCell onClick={() => openDetail('document', doc)}><ChevronRight className="w-4 h-4 text-slate-300" /></TableCell>
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
