'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronRight, Phone, Mail, Plus } from 'lucide-react'
import { fmt, statusBadge } from './constants'
import { SortableHeader } from './helpers'
import { DataTablePagination } from './data-table-pagination'
import type { ClientRecord } from './types'

interface ClientsPageProps {
  clients: ClientRecord[]
  search: string
  openDetail: (type: string, data: any) => void
  selectedIds: Set<number>
  toggleSelect: (id: number) => void
  toggleAll: (ids: number[]) => void
  onRefresh?: () => void
}

export function ClientsPage({ clients, search, openDetail, selectedIds, toggleSelect, toggleAll, onRefresh }: ClientsPageProps) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({ client_type: 'individual', first_name: '', last_name: '', company_name: '', email: '', phone: '', district: '', status: 'prospect', notes: '' })

  const handleSort = (field: string) => {
    if (sortField === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc') }
    else { setSortField(field); setSortDir('asc') }
  }

  let filtered = clients.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (c.first_name?.toLowerCase().includes(q) || c.last_name?.toLowerCase().includes(q) ||
      c.company_name?.toLowerCase().includes(q) || c.client_ref.toLowerCase().includes(q) ||
      c.district?.toLowerCase().includes(q))
  })
  if (statusFilter !== 'all') filtered = filtered.filter(c => c.status === statusFilter)
  if (sortField) {
    filtered = [...filtered].sort((a: any, b: any) => {
      const av = (a[sortField] ?? '').toString().toLowerCase()
      const bv = (b[sortField] ?? '').toString().toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      if (res.ok) {
        setShowCreateDialog(false)
        setCreateForm({ client_type: 'individual', first_name: '', last_name: '', company_name: '', email: '', phone: '', district: '', status: 'prospect', notes: '' })
        onRefresh?.()
      }
    } catch (e) { console.error(e) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Client Directory</h2>
          <p className="text-sm text-slate-500">{filtered.length} clients found</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Filter status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />New Client
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs w-10"><Checkbox checked={paginated.length > 0 && paginated.every(c => selectedIds.has(c.id))} onCheckedChange={() => toggleAll(paginated.map(c => c.id))} /></TableHead>
              <TableHead className="text-xs"><SortableHeader label="Ref" field="client_ref" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs"><SortableHeader label="Name / Company" field="first_name" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs hidden sm:table-cell"><SortableHeader label="District" field="district" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs hidden md:table-cell">Contact</TableHead>
              <TableHead className="text-xs"><SortableHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs hidden lg:table-cell">Projects</TableHead>
              <TableHead className="text-xs w-8"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {paginated.map(c => (
                <TableRow key={c.id} className={`cursor-pointer hover:bg-slate-50 ${selectedIds.has(c.id) ? 'bg-emerald-50/50' : ''}`}>
                  <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} /></TableCell>
                  <TableCell className="font-mono text-xs" onClick={() => openDetail('client', c)}>{c.client_ref}</TableCell>
                  <TableCell onClick={() => openDetail('client', c)}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-600 shrink-0">
                        {c.client_type === 'company' ? (c.company_name?.[0] || 'C') : `${c.first_name?.[0] || ''}${c.last_name?.[0] || ''}`}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.client_type === 'company' ? c.company_name : `${c.first_name} ${c.last_name}`}</p>
                        <p className="text-[11px] text-slate-400 capitalize">{c.client_type}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-slate-600" onClick={() => openDetail('client', c)}>{c.district || '—'}</TableCell>
                  <TableCell className="hidden md:table-cell" onClick={() => openDetail('client', c)}>
                    <div className="text-xs space-y-0.5">
                      {c.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{c.phone}</p>}
                      {c.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" />{c.email}</p>}
                    </div>
                  </TableCell>
                  <TableCell onClick={() => openDetail('client', c)}>{statusBadge(c.status)}</TableCell>
                  <TableCell className="hidden lg:table-cell" onClick={() => openDetail('client', c)}><Badge variant="secondary" className="text-[11px]">{c._count.surveyProjects} projects</Badge></TableCell>
                  <TableCell onClick={() => openDetail('client', c)}><ChevronRight className="w-4 h-4 text-slate-300" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DataTablePagination
            totalItems={filtered.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1) }}
          />
        </CardContent>
      </Card>

      {/* Create Client Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Client</DialogTitle>
            <DialogDescription>Add a new client to the platform</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Client Type</Label>
                <Select value={createForm.client_type} onValueChange={v => setCreateForm({ ...createForm, client_type: v })}>
                  <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="individual">Individual</SelectItem><SelectItem value="company">Company</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={createForm.status} onValueChange={v => setCreateForm({ ...createForm, status: v })}>
                  <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="prospect">Prospect</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            {createForm.client_type === 'individual' ? (
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">First Name</Label><Input className="h-9 text-xs mt-1" value={createForm.first_name} onChange={e => setCreateForm({ ...createForm, first_name: e.target.value })} /></div>
                <div><Label className="text-xs">Last Name</Label><Input className="h-9 text-xs mt-1" value={createForm.last_name} onChange={e => setCreateForm({ ...createForm, last_name: e.target.value })} /></div>
              </div>
            ) : (
              <div><Label className="text-xs">Company Name</Label><Input className="h-9 text-xs mt-1" value={createForm.company_name} onChange={e => setCreateForm({ ...createForm, company_name: e.target.value })} /></div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Email</Label><Input type="email" className="h-9 text-xs mt-1" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} /></div>
              <div><Label className="text-xs">Phone</Label><Input className="h-9 text-xs mt-1" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">District</Label><Input className="h-9 text-xs mt-1" value={createForm.district} onChange={e => setCreateForm({ ...createForm, district: e.target.value })} /></div>
            <div><Label className="text-xs">Notes</Label><Textarea className="text-xs mt-1" rows={2} value={createForm.notes} onChange={e => setCreateForm({ ...createForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreate}>Create Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
