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
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChevronRight, Phone, Mail, Plus, Search, SlidersHorizontal, Users, Inbox, Filter, Download, FileSpreadsheet } from 'lucide-react'
import { fmt, statusBadge, UGANDA_DISTRICTS } from './constants'
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
  onToast?: (type: 'success' | 'error', message: string) => void
}

type VisibleColumns = {
  ref: boolean; district: boolean; contact: boolean; status: boolean; projects: boolean
}

export function ClientsPage({ clients, search, openDetail, selectedIds, toggleSelect, toggleAll, onRefresh, onToast }: ClientsPageProps) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [localSearch, setLocalSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({ client_type: 'individual', first_name: '', last_name: '', company_name: '', email: '', phone: '', district: '', status: 'prospect', notes: '' })
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({ ref: true, district: true, contact: false, status: true, projects: true })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [districtSuggestions, setDistrictSuggestions] = useState<string[]>([])

  // CSV Export handler
  const handleExport = () => {
    const headers = ['Client Ref', 'Type', 'First Name', 'Last Name', 'Company Name', 'Email', 'Phone', 'District', 'Status', 'Projects', 'Invoices']
    const rows = filtered.map(c => [
      c.client_ref, c.client_type, c.first_name || '', c.last_name || '', c.company_name || '',
      c.email || '', c.phone || '', c.district || '', c.status,
      String(c._count.surveyProjects), String(c.invoices.length),
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `clients-export-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
    onToast?.('success', `Exported ${filtered.length} clients`)
  }

  const handleSort = (field: string) => {
    if (sortField === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc') }
    else { setSortField(field); setSortDir('asc') }
  }

  const effectiveSearch = search || localSearch

  let filtered = clients.filter(c => {
    if (!effectiveSearch) return true
    const q = effectiveSearch.toLowerCase()
    return (c.first_name?.toLowerCase().includes(q) || c.last_name?.toLowerCase().includes(q) ||
      c.company_name?.toLowerCase().includes(q) || c.client_ref.toLowerCase().includes(q) ||
      c.district?.toLowerCase().includes(q))
  })
  if (statusFilter !== 'all') filtered = filtered.filter(c => c.status === statusFilter)
  if (typeFilter !== 'all') filtered = filtered.filter(c => c.client_type === typeFilter)
  if (sortField) {
    filtered = [...filtered].sort((a: any, b: any) => {
      const av = (a[sortField] ?? '').toString().toLowerCase()
      const bv = (b[sortField] ?? '').toString().toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (createForm.client_type === 'individual') {
      if (!createForm.first_name.trim()) errors.first_name = 'First name is required'
      if (!createForm.last_name.trim()) errors.last_name = 'Last name is required'
    } else {
      if (!createForm.company_name.trim()) errors.company_name = 'Company name is required'
    }
    if (createForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errors.email = 'Invalid email format'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreate = async () => {
    if (!validateForm()) return
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      if (res.ok) {
        setShowCreateDialog(false)
        setCreateForm({ client_type: 'individual', first_name: '', last_name: '', company_name: '', email: '', phone: '', district: '', status: 'prospect', notes: '' })
        setFormErrors({})
        onRefresh?.()
        onToast?.('success', 'Client created successfully')
      } else {
        onToast?.('error', 'Failed to create client')
      }
    } catch (e) {
      console.error(e)
      onToast?.('error', 'Failed to create client')
    }
  }

  const handleDistrictChange = (value: string) => {
    setCreateForm({ ...createForm, district: value })
    if (value.length > 0) {
      setDistrictSuggestions(UGANDA_DISTRICTS.filter(d => d.toLowerCase().startsWith(value.toLowerCase())).slice(0, 5))
    } else {
      setDistrictSuggestions([])
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-lg font-semibold">Client Directory</h2>
            <p className="text-sm text-slate-500">Showing {paginated.length} of {filtered.length} clients</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Local Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search clients..."
              value={localSearch}
              onChange={e => { setLocalSearch(e.target.value); setCurrentPage(1) }}
              className="pl-8 h-8 w-44 text-xs"
            />
          </div>
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1) }}>
            <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>
          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem checked={visibleColumns.ref} onCheckedChange={(c) => setVisibleColumns({ ...visibleColumns, ref: !!c })}>Reference</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.district} onCheckedChange={(c) => setVisibleColumns({ ...visibleColumns, district: !!c })}>District</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.contact} onCheckedChange={(c) => setVisibleColumns({ ...visibleColumns, contact: !!c })}>Contact</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.status} onCheckedChange={(c) => setVisibleColumns({ ...visibleColumns, status: !!c })}>Status</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.projects} onCheckedChange={(c) => setVisibleColumns({ ...visibleColumns, projects: !!c })}>Projects</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />New Client
          </Button>
          {filtered.length > 0 && (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExport}>
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />Export
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {(statusFilter !== 'all' || typeFilter !== 'all' || localSearch) && (
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3 h-3 text-slate-400" />
          <span className="text-slate-500">Active filters:</span>
          {statusFilter !== 'all' && <Badge variant="secondary" className="text-[10px]">Status: {fmt(statusFilter)}</Badge>}
          {typeFilter !== 'all' && <Badge variant="secondary" className="text-[10px]">Type: {fmt(typeFilter)}</Badge>}
          {localSearch && <Badge variant="secondary" className="text-[10px]">Search: "{localSearch}"</Badge>}
          <Button variant="ghost" size="sm" className="h-5 text-[10px] text-slate-500" onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setLocalSearch('') }}>
            Clear all
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {clients.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">No clients found</p>
              <p className="text-xs text-slate-400 mt-1">Create your first client to get started</p>
              <Button size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />New Client
              </Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-12 text-center">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No clients match your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs w-10"><Checkbox checked={paginated.length > 0 && paginated.every(c => selectedIds.has(c.id))} onCheckedChange={() => toggleAll(paginated.map(c => c.id))} /></TableHead>
                {visibleColumns.ref && <TableHead className="text-xs"><SortableHeader label="Ref" field="client_ref" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>}
                <TableHead className="text-xs"><SortableHeader label="Name / Company" field="first_name" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                {visibleColumns.district && <TableHead className="text-xs hidden sm:table-cell"><SortableHeader label="District" field="district" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>}
                {visibleColumns.contact && <TableHead className="text-xs hidden md:table-cell">Contact</TableHead>}
                {visibleColumns.status && <TableHead className="text-xs"><SortableHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>}
                {visibleColumns.projects && <TableHead className="text-xs hidden lg:table-cell">Projects</TableHead>}
                <TableHead className="text-xs w-8"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {paginated.map(c => (
                  <TableRow key={c.id} className={`cursor-pointer hover:bg-slate-50 transition-colors ${selectedIds.has(c.id) ? 'bg-emerald-50/50' : ''}`}>
                    <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} /></TableCell>
                    {visibleColumns.ref && <TableCell className="font-mono text-xs" onClick={() => openDetail('client', c)}>{c.client_ref}</TableCell>}
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
                    {visibleColumns.district && <TableCell className="hidden sm:table-cell text-xs text-slate-600" onClick={() => openDetail('client', c)}>{c.district || '—'}</TableCell>}
                    {visibleColumns.contact && <TableCell className="hidden md:table-cell" onClick={() => openDetail('client', c)}>
                      <div className="text-xs space-y-0.5">
                        {c.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{c.phone}</p>}
                        {c.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" />{c.email}</p>}
                      </div>
                    </TableCell>}
                    {visibleColumns.status && <TableCell onClick={() => openDetail('client', c)}>{statusBadge(c.status)}</TableCell>}
                    {visibleColumns.projects && <TableCell className="hidden lg:table-cell" onClick={() => openDetail('client', c)}><Badge variant="secondary" className="text-[11px]">{c._count.surveyProjects} projects</Badge></TableCell>}
                    <TableCell onClick={() => openDetail('client', c)}><ChevronRight className="w-4 h-4 text-slate-300" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Users className="w-4 h-4 text-emerald-600" /></div>
              New Client
            </DialogTitle>
            <DialogDescription>Add a new client to the platform</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Type & Status Section */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classification</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Client Type <span className="text-red-500">*</span></Label>
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
            </div>

            {/* Names Section */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {createForm.client_type === 'individual' ? 'Personal Information' : 'Company Information'}
              </p>
              {createForm.client_type === 'individual' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">First Name <span className="text-red-500">*</span></Label>
                    <Input className={`h-9 text-xs mt-1 ${formErrors.first_name ? 'border-red-300 focus:border-red-500' : ''}`} value={createForm.first_name} onChange={e => setCreateForm({ ...createForm, first_name: e.target.value })} />
                    {formErrors.first_name && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.first_name}</p>}
                  </div>
                  <div>
                    <Label className="text-xs">Last Name <span className="text-red-500">*</span></Label>
                    <Input className={`h-9 text-xs mt-1 ${formErrors.last_name ? 'border-red-300 focus:border-red-500' : ''}`} value={createForm.last_name} onChange={e => setCreateForm({ ...createForm, last_name: e.target.value })} />
                    {formErrors.last_name && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.last_name}</p>}
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-xs">Company Name <span className="text-red-500">*</span></Label>
                  <Input className={`h-9 text-xs mt-1 ${formErrors.company_name ? 'border-red-300 focus:border-red-500' : ''}`} value={createForm.company_name} onChange={e => setCreateForm({ ...createForm, company_name: e.target.value })} />
                  {formErrors.company_name && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.company_name}</p>}
                </div>
              )}
            </div>

            {/* Contact Section */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input type="email" className={`h-9 text-xs mt-1 ${formErrors.email ? 'border-red-300 focus:border-red-500' : ''}`} value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
                  {formErrors.email && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.email}</p>}
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input className="h-9 text-xs mt-1" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="+256..." />
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</p>
              <div className="relative">
                <Label className="text-xs">District</Label>
                <Input className="h-9 text-xs mt-1" value={createForm.district} onChange={e => handleDistrictChange(e.target.value)} placeholder="Start typing..." />
                {districtSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-32 overflow-y-auto">
                    {districtSuggestions.map(d => (
                      <button key={d} className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 transition-colors" onClick={() => { setCreateForm({ ...createForm, district: d }); setDistrictSuggestions([]) }}>
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div><Label className="text-xs">Notes</Label><Textarea className="text-xs mt-1" rows={2} value={createForm.notes} onChange={e => setCreateForm({ ...createForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setShowCreateDialog(false); setFormErrors({}) }}>Cancel</Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreate}>Create Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
