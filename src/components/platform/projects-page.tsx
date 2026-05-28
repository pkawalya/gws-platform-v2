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
import { ChevronRight, Plus, Search, SlidersHorizontal, MapPin, Inbox, Filter, FileSpreadsheet } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { fmt, statusBadge, PRIORITY_BADGE, UGANDA_DISTRICTS } from './constants'
import { SortableHeader } from './helpers'
import { DataTablePagination } from './data-table-pagination'
import type { ProjectRecord, ClientRecord } from './types'

interface ProjectsPageProps {
  projects: ProjectRecord[]
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
  ref: boolean; client: boolean; type: boolean; district: boolean; status: boolean; area: boolean; priority: boolean
}

export function ProjectsPage({ projects, clients, search, openDetail, selectedIds, toggleSelect, toggleAll, onRefresh, onToast }: ProjectsPageProps) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [localSearch, setLocalSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({ title: '', project_type: 'cadastral', client_id: '', district: '', priority: 'normal', status: 'intake', description: '' })
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({ ref: true, client: true, type: true, district: true, status: true, area: false, priority: true })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [districtSuggestions, setDistrictSuggestions] = useState<string[]>([])

  // CSV Export handler
  const handleExport = () => {
    const headers = ['Project Ref', 'Title', 'Type', 'Status', 'Priority', 'District', 'Area (ha)', 'Client', 'Due Date', 'Created']
    const rows = filtered.map(p => [
      p.project_ref, p.title, p.project_type, p.status, p.priority,
      p.district || '', p.area_hectares || '',
      p.client?.company_name || `${p.client?.first_name} ${p.client?.last_name}`,
      p.due_date || '', p.created_at,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `projects-export-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
    onToast?.('success', `Exported ${filtered.length} projects`)
  }

  const handleSort = (field: string) => {
    if (sortField === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc') }
    else { setSortField(field); setSortDir('asc') }
  }

  const effectiveSearch = search || localSearch

  let filtered = projects.filter(p => {
    if (!effectiveSearch) return true
    const q = effectiveSearch.toLowerCase()
    return (p.title.toLowerCase().includes(q) || p.project_ref.toLowerCase().includes(q) ||
      p.district?.toLowerCase().includes(q) || p.project_type.toLowerCase().includes(q))
  })
  if (statusFilter !== 'all') filtered = filtered.filter(p => p.status === statusFilter)
  if (typeFilter !== 'all') filtered = filtered.filter(p => p.project_type === typeFilter)
  if (priorityFilter !== 'all') filtered = filtered.filter(p => p.priority === priorityFilter)
  if (sortField) {
    filtered = [...filtered].sort((a: any, b: any) => {
      const av = (a[sortField] ?? '').toString().toLowerCase()
      const bv = (b[sortField] ?? '').toString().toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!createForm.title.trim()) errors.title = 'Project title is required'
    if (!createForm.client_id) errors.client_id = 'Please select a client'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreate = async () => {
    if (!validateForm()) return
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      if (res.ok) {
        setShowCreateDialog(false)
        setCreateForm({ title: '', project_type: 'cadastral', client_id: '', district: '', priority: 'normal', status: 'intake', description: '' })
        setFormErrors({})
        onRefresh?.()
        onToast?.('success', 'Project created successfully')
      } else {
        onToast?.('error', 'Failed to create project')
      }
    } catch (e) {
      console.error(e)
      onToast?.('error', 'Failed to create project')
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
        <div>
          <h2 className="text-lg font-semibold">Survey Projects</h2>
          <p className="text-sm text-slate-500">Showing {paginated.length} of {filtered.length} projects</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input placeholder="Search projects..." value={localSearch} onChange={e => { setLocalSearch(e.target.value); setCurrentPage(1) }} className="pl-8 h-8 w-44 text-xs" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="intake">Intake</SelectItem>
              <SelectItem value="field_survey">Field Survey</SelectItem>
              <SelectItem value="data_processing">Data Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1) }}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="cadastral">Cadastral</SelectItem>
              <SelectItem value="topographic">Topographic</SelectItem>
              <SelectItem value="boundary">Boundary</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="hydrographic">Hydrographic</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setCurrentPage(1) }}>
            <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem checked={visibleColumns.ref} onCheckedChange={(c) => setVisibleColumns({ ...visibleColumns, ref: !!c })}>Reference</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.client} onCheckedChange={(c) => setVisibleColumns({ ...visibleColumns, client: !!c })}>Client</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.type} onCheckedChange={(c) => setVisibleColumns({ ...visibleColumns, type: !!c })}>Type</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.district} onCheckedChange={(c) => setVisibleColumns({ ...visibleColumns, district: !!c })}>District</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.area} onCheckedChange={(c) => setVisibleColumns({ ...visibleColumns, area: !!c })}>Area</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleColumns.priority} onCheckedChange={(c) => setVisibleColumns({ ...visibleColumns, priority: !!c })}>Priority</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />New Project
          </Button>
          {filtered.length > 0 && (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExport}>
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />Export
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {(statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all' || localSearch) && (
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3 h-3 text-slate-400" />
          <span className="text-slate-500">Active filters:</span>
          {statusFilter !== 'all' && <Badge variant="secondary" className="text-[10px]">Status: {fmt(statusFilter)}</Badge>}
          {typeFilter !== 'all' && <Badge variant="secondary" className="text-[10px]">Type: {fmt(typeFilter)}</Badge>}
          {priorityFilter !== 'all' && <Badge variant="secondary" className="text-[10px]">Priority: {fmt(priorityFilter)}</Badge>}
          {localSearch && <Badge variant="secondary" className="text-[10px]">Search: "{localSearch}"</Badge>}
          <Button variant="ghost" size="sm" className="h-5 text-[10px] text-slate-500" onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setPriorityFilter('all'); setLocalSearch('') }}>
            Clear all
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {projects.length === 0 ? (
            <div className="py-16 text-center">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">No projects found</p>
              <p className="text-xs text-slate-400 mt-1">Create your first survey project</p>
              <Button size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />New Project
              </Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-12 text-center">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No projects match your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs w-10"><Checkbox checked={paginated.length > 0 && paginated.every(p => selectedIds.has(p.id))} onCheckedChange={() => toggleAll(paginated.map(p => p.id))} /></TableHead>
                {visibleColumns.ref && <TableHead className="text-xs"><SortableHeader label="Ref" field="project_ref" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>}
                <TableHead className="text-xs"><SortableHeader label="Title" field="title" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                {visibleColumns.client && <TableHead className="text-xs hidden sm:table-cell">Client</TableHead>}
                {visibleColumns.type && <TableHead className="text-xs hidden md:table-cell"><SortableHeader label="Type" field="project_type" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>}
                {visibleColumns.status && <TableHead className="text-xs"><SortableHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>}
                {visibleColumns.district && <TableHead className="text-xs hidden lg:table-cell">District</TableHead>}
                {visibleColumns.area && <TableHead className="text-xs hidden lg:table-cell">Area</TableHead>}
                {visibleColumns.priority && <TableHead className="text-xs">Priority</TableHead>}
                <TableHead className="text-xs w-8"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {paginated.map(p => (
                  <TableRow key={p.id} className={`cursor-pointer hover:bg-slate-50 transition-colors ${selectedIds.has(p.id) ? 'bg-emerald-50/50' : ''}`}>
                    <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} /></TableCell>
                    {visibleColumns.ref && <TableCell className="font-mono text-xs" onClick={() => openDetail('project', p)}>{p.project_ref}</TableCell>}
                    <TableCell onClick={() => openDetail('project', p)}><p className="text-sm font-medium">{p.title}</p><p className="text-[11px] text-slate-400">{p.district || 'No district'}</p></TableCell>
                    {visibleColumns.client && <TableCell className="hidden sm:table-cell text-xs" onClick={() => openDetail('project', p)}>{p.client?.company_name || `${p.client?.first_name} ${p.client?.last_name}`}</TableCell>}
                    {visibleColumns.type && <TableCell className="hidden md:table-cell text-xs capitalize" onClick={() => openDetail('project', p)}>{fmt(p.project_type)}</TableCell>}
                    {visibleColumns.status && <TableCell onClick={() => openDetail('project', p)}>{statusBadge(p.status)}</TableCell>}
                    {visibleColumns.district && <TableCell className="hidden lg:table-cell text-xs" onClick={() => openDetail('project', p)}>{p.district || '—'}</TableCell>}
                    {visibleColumns.area && <TableCell className="hidden lg:table-cell text-xs" onClick={() => openDetail('project', p)}>{p.area_hectares ? `${p.area_hectares} ha` : '—'}</TableCell>}
                    {visibleColumns.priority && <TableCell onClick={() => openDetail('project', p)}><Badge variant="outline" className={`text-xs ${PRIORITY_BADGE[p.priority] || ''}`}>{p.priority}</Badge></TableCell>}
                    <TableCell onClick={() => openDetail('project', p)}><ChevronRight className="w-4 h-4 text-slate-300" /></TableCell>
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

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><MapPin className="w-4 h-4 text-emerald-600" /></div>
              New Survey Project
            </DialogTitle>
            <DialogDescription>Create a new land survey project</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project Details</p>
              <div>
                <Label className="text-xs">Project Title <span className="text-red-500">*</span></Label>
                <Input className={`h-9 text-xs mt-1 ${formErrors.title ? 'border-red-300' : ''}`} value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} placeholder="e.g. Kampala Cadastral Survey" />
                {formErrors.title && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.title}</p>}
              </div>
            </div>

            {/* Type & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Project Type</Label>
                <Select value={createForm.project_type} onValueChange={v => setCreateForm({ ...createForm, project_type: v })}>
                  <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cadastral">Cadastral</SelectItem><SelectItem value="topographic">Topographic</SelectItem>
                    <SelectItem value="boundary">Boundary</SelectItem><SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="hydrographic">Hydrographic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={createForm.priority} onValueChange={v => setCreateForm({ ...createForm, priority: v })}>
                  <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem><SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Client */}
            <div>
              <Label className="text-xs">Client <span className="text-red-500">*</span></Label>
              <Select value={createForm.client_id} onValueChange={v => setCreateForm({ ...createForm, client_id: v })}>
                <SelectTrigger className={`h-9 text-xs mt-1 ${formErrors.client_id ? 'border-red-300' : ''}`}><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.client_type === 'company' ? c.company_name : `${c.first_name} ${c.last_name}`}</SelectItem>)}
                </SelectContent>
              </Select>
              {formErrors.client_id && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.client_id}</p>}
            </div>

            {/* District with autocomplete */}
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

            <div><Label className="text-xs">Description</Label><Textarea className="text-xs mt-1" rows={2} value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setShowCreateDialog(false); setFormErrors({}) }}>Cancel</Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreate}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
