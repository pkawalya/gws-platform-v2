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
import { ChevronRight, Plus } from 'lucide-react'
import { fmt, statusBadge, PRIORITY_BADGE } from './constants'
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
}

export function ProjectsPage({ projects, clients, search, openDetail, selectedIds, toggleSelect, toggleAll, onRefresh }: ProjectsPageProps) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({ title: '', project_type: 'cadastral', client_id: '', district: '', priority: 'normal', status: 'intake', description: '' })

  const handleSort = (field: string) => {
    if (sortField === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc') }
    else { setSortField(field); setSortDir('asc') }
  }

  let filtered = projects.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return (p.title.toLowerCase().includes(q) || p.project_ref.toLowerCase().includes(q) ||
      p.district?.toLowerCase().includes(q) || p.project_type.toLowerCase().includes(q))
  })
  if (statusFilter !== 'all') filtered = filtered.filter(p => p.status === statusFilter)
  if (sortField) {
    filtered = [...filtered].sort((a: any, b: any) => {
      const av = (a[sortField] ?? '').toString().toLowerCase()
      const bv = (b[sortField] ?? '').toString().toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      if (res.ok) {
        setShowCreateDialog(false)
        setCreateForm({ title: '', project_type: 'cadastral', client_id: '', district: '', priority: 'normal', status: 'intake', description: '' })
        onRefresh?.()
      }
    } catch (e) { console.error(e) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Survey Projects</h2>
          <p className="text-sm text-slate-500">{filtered.length} projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Filter status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="intake">Intake</SelectItem>
              <SelectItem value="field_survey">Field Survey</SelectItem>
              <SelectItem value="data_processing">Data Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />New Project
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs w-10"><Checkbox checked={paginated.length > 0 && paginated.every(p => selectedIds.has(p.id))} onCheckedChange={() => toggleAll(paginated.map(p => p.id))} /></TableHead>
              <TableHead className="text-xs"><SortableHeader label="Ref" field="project_ref" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs"><SortableHeader label="Title" field="title" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs hidden sm:table-cell">Client</TableHead>
              <TableHead className="text-xs hidden md:table-cell"><SortableHeader label="Type" field="project_type" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs"><SortableHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs hidden lg:table-cell">Area</TableHead>
              <TableHead className="text-xs">Priority</TableHead>
              <TableHead className="text-xs w-8"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {paginated.map(p => (
                <TableRow key={p.id} className={`cursor-pointer hover:bg-slate-50 ${selectedIds.has(p.id) ? 'bg-emerald-50/50' : ''}`}>
                  <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} /></TableCell>
                  <TableCell className="font-mono text-xs" onClick={() => openDetail('project', p)}>{p.project_ref}</TableCell>
                  <TableCell onClick={() => openDetail('project', p)}><p className="text-sm font-medium">{p.title}</p><p className="text-[11px] text-slate-400">{p.district || 'No district'}</p></TableCell>
                  <TableCell className="hidden sm:table-cell text-xs" onClick={() => openDetail('project', p)}>{p.client?.company_name || `${p.client?.first_name} ${p.client?.last_name}`}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs capitalize" onClick={() => openDetail('project', p)}>{fmt(p.project_type)}</TableCell>
                  <TableCell onClick={() => openDetail('project', p)}>{statusBadge(p.status)}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs" onClick={() => openDetail('project', p)}>{p.area_hectares ? `${p.area_hectares} ha` : '—'}</TableCell>
                  <TableCell onClick={() => openDetail('project', p)}><Badge variant="outline" className={`text-xs ${PRIORITY_BADGE[p.priority] || ''}`}>{p.priority}</Badge></TableCell>
                  <TableCell onClick={() => openDetail('project', p)}><ChevronRight className="w-4 h-4 text-slate-300" /></TableCell>
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

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Survey Project</DialogTitle>
            <DialogDescription>Create a new land survey project</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label className="text-xs">Project Title</Label><Input className="h-9 text-xs mt-1" value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} placeholder="e.g. Kampala Cadastral Survey" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Project Type</Label>
                <Select value={createForm.project_type} onValueChange={v => setCreateForm({ ...createForm, project_type: v })}>
                  <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cadastral">Cadastral</SelectItem><SelectItem value="topographic">Topographic</SelectItem>
                    <SelectItem value="boundary">Boundary</SelectItem><SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="hydrographic">Hydrographic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Priority</Label>
                <Select value={createForm.priority} onValueChange={v => setCreateForm({ ...createForm, priority: v })}>
                  <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem><SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Client</Label>
              <Select value={createForm.client_id} onValueChange={v => setCreateForm({ ...createForm, client_id: v })}>
                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.client_type === 'company' ? c.company_name : `${c.first_name} ${c.last_name}`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">District</Label><Input className="h-9 text-xs mt-1" value={createForm.district} onChange={e => setCreateForm({ ...createForm, district: e.target.value })} /></div>
            <div><Label className="text-xs">Description</Label><Textarea className="text-xs mt-1" rows={2} value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreate}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
