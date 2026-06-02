'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText, ShieldCheck, AlertCircle, Layers, ChevronRight, Plus, Download, Eye } from 'lucide-react'
import { fmt, statusBadge } from './constants'
import { SortableHeader } from './helpers'
import { DataTablePagination } from './data-table-pagination'
import { FileUpload, FileThumbnail, FileDownloadButton, type UploadedFile } from './file-upload'
import type { ClientRecord } from './types'

interface DocumentsPageProps {
  documentsData: any
  openDetail: (type: string, data: any) => void
  selectedIds: Set<number>
  toggleSelect: (id: number) => void
  toggleAll: (ids: number[]) => void
  clients: ClientRecord[]
  onRefresh?: () => void
  onToast?: (type: 'success' | 'error', message: string) => void
}

export function DocumentsPage({ documentsData, openDetail, selectedIds, toggleSelect, toggleAll, clients, onRefresh, onToast }: DocumentsPageProps) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '',
    document_type: 'title_deed',
    client_id: '',
    file_path: '',
    description: '',
    mime_type: 'application/pdf',
    file_size: 0,
  })
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isCreating, setIsCreating] = useState(false)

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

  const handleUploadComplete = (files: UploadedFile[]) => {
    if (files.length > 0) {
      const file = files[0]
      setUploadedFile(file)
      setCreateForm(f => ({
        ...f,
        file_path: file.path,
        mime_type: file.mime_type,
        file_size: file.size,
        title: f.title || file.name.replace(/\.[^/.]+$/, ''),
      }))
    }
  }

  const handleCreate = async () => {
    if (!createForm.title || !createForm.client_id) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          client_id: Number(createForm.client_id),
        }),
      })
      if (res.ok) {
        setShowCreateDialog(false)
        setCreateForm({ title: '', document_type: 'title_deed', client_id: '', file_path: '', description: '', mime_type: 'application/pdf', file_size: 0 })
        setUploadedFile(null)
        onRefresh?.()
        onToast?.('success', 'Document uploaded successfully')
      } else {
        onToast?.('error', 'Failed to create document')
      }
    } catch (e) {
      console.error(e)
      onToast?.('error', 'Failed to create document')
    } finally {
      setIsCreating(false)
    }
  }

  const resetCreateForm = () => {
    setCreateForm({ title: '', document_type: 'title_deed', client_id: '', file_path: '', description: '', mime_type: 'application/pdf', file_size: 0 })
    setUploadedFile(null)
  }

  const getFilePath = (doc: any): string | null => {
    if (!doc.file_path) return null
    // Convert relative paths like /upload/2025/01/file.jpg to the files API path
    if (doc.file_path.startsWith('/upload/')) {
      return doc.file_path
    }
    // Legacy paths that don't follow the /upload/ pattern
    return doc.file_path.startsWith('/') ? doc.file_path : `/${doc.file_path}`
  }

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
        <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 ml-auto" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />Upload Document
        </Button>
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
              <TableHead className="text-xs w-20">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {paginated.map((doc: any) => {
                const filePath = getFilePath(doc)
                return (
                  <TableRow key={doc.id} className={`cursor-pointer hover:bg-slate-50 ${selectedIds.has(doc.id) ? 'bg-emerald-50/50' : ''}`}>
                    <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(doc.id)} onCheckedChange={() => toggleSelect(doc.id)} /></TableCell>
                    <TableCell onClick={() => openDetail('document', doc)}>
                      <div className="flex items-center gap-2">
                        <FileThumbnail filePath={filePath} mimeType={doc.mime_type} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{doc.title}</p>
                          <p className="text-[11px] text-slate-400">{doc.mime_type?.split('/').pop()?.toUpperCase() || 'File'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell" onClick={() => openDetail('document', doc)}><Badge variant="outline" className="text-[10px]">{fmt(doc.document_type)}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-xs" onClick={() => openDetail('document', doc)}>{doc.client?.company_name || `${doc.client?.first_name} ${doc.client?.last_name}`}</TableCell>
                    <TableCell onClick={() => openDetail('document', doc)}>
                      <Badge variant="outline" className={`text-[10px] ${doc.is_verified ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                        {doc.is_verified ? '✓ Verified' : 'Unverified'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-slate-500" onClick={() => openDetail('document', doc)}>{doc.file_size ? `${(Number(doc.file_size) / 1024).toFixed(1)} KB` : '—'}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5">
                        {filePath && <FileDownloadButton filePath={filePath} fileName={doc.title} />}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openDetail('document', doc)}>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <DataTablePagination totalItems={filtered.length} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1) }} />
        </CardContent>
      </Card>

      {/* Create Document Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) resetCreateForm() }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Add a new document to the vault</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label className="text-xs">Document Title</Label><Input className="h-9 text-xs mt-1" value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} placeholder="e.g. Title Deed - Kampala Plot 23" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Document Type</Label>
                <Select value={createForm.document_type} onValueChange={v => setCreateForm({ ...createForm, document_type: v })}>
                  <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title_deed">Title Deed</SelectItem>
                    <SelectItem value="survey_plan">Survey Plan</SelectItem>
                    <SelectItem value="agreement">Agreement</SelectItem>
                    <SelectItem value="certificate">Certificate</SelectItem>
                    <SelectItem value="identification">Identification</SelectItem>
                    <SelectItem value="correspondence">Correspondence</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Client</Label>
                <Select value={createForm.client_id} onValueChange={v => setCreateForm({ ...createForm, client_id: v })}>
                  <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.client_type === 'company' ? c.company_name : `${c.first_name} ${c.last_name}`}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* File Upload Section */}
            <div>
              <Label className="text-xs mb-2 block">Upload File</Label>
              <FileUpload
                onUploadComplete={handleUploadComplete}
                onUploadError={(err) => onToast?.('error', err)}
                multiple={false}
                variant="full"
                label="Choose File"
              />
              {uploadedFile && (
                <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <FileThumbnail filePath={uploadedFile.path} mimeType={uploadedFile.mime_type} thumbnailPath={uploadedFile.thumbnail_path} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{uploadedFile.name}</p>
                    <p className="text-[10px] text-slate-400">{(uploadedFile.size / 1024).toFixed(1)} KB • {uploadedFile.mime_type.split('/').pop()?.toUpperCase()}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setUploadedFile(null); setCreateForm(f => ({ ...f, file_path: '', file_size: 0 })) }}>
                    <span className="text-slate-400 hover:text-slate-600 text-xs">✕</span>
                  </Button>
                </div>
              )}
            </div>

            <div><Label className="text-xs">Description</Label><Textarea className="text-xs mt-1" rows={2} value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Optional description of the document..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setShowCreateDialog(false); resetCreateForm() }}>Cancel</Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreate} disabled={!createForm.title || !createForm.client_id || isCreating}>
              {isCreating ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
