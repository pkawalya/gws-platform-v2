'use client'

import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MapPin, CheckCircle2, Clock3, Receipt, DollarSign, FileText,
  MessageSquare, ShieldCheck, ScrollText, Cpu, GitBranch,
  ChevronDown, Eye, Send, Trash2, MoreHorizontal, TrendingUp, TrendingDown,
  CalendarDays, ArrowRight, AlertCircle, Download,
} from 'lucide-react'
import { fmt, statusBadge, PRIORITY_BADGE, formatUGX } from './constants'
import { DetailField } from './helpers'
import { FileThumbnail, FileDownloadButton } from './file-upload'
import type { ClientRecord, ProjectRecord } from './types'

// ── Client Documents Tab ──
function ClientDocumentsTab({ clientId, count }: { clientId: number; count: number }) {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/documents')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        const docs = (data.documents || []).filter((d: any) => Number(d.client_id) === Number(clientId))
        setDocuments(docs)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [clientId])

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 rounded bg-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-6">
        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">{count} documents on file</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Upload documents from the Documents Vault or Client creation form</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 mb-2">{documents.length} document{documents.length !== 1 ? 's' : ''} on file</p>
      {documents.map((doc: any) => {
        const fp = doc.file_path?.startsWith('/upload/') ? doc.file_path : doc.file_path?.startsWith('/') ? doc.file_path : null
        return (
          <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
            <FileThumbnail filePath={fp} mimeType={doc.mime_type} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{doc.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px]">{fmt(doc.document_type)}</Badge>
                {doc.file_size && <span className="text-[10px] text-slate-400">{(Number(doc.file_size) / 1024).toFixed(1)} KB</span>}
                <Badge variant="outline" className={`text-[9px] ${doc.is_verified ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                  {doc.is_verified ? '✓ Verified' : 'Unverified'}
                </Badge>
              </div>
            </div>
            {fp && <FileDownloadButton filePath={fp} fileName={doc.title} />}
          </div>
        )
      })}
    </div>
  )
}

// ── Mini Map for Client Location ──
function ClientMiniMap({ latitude, longitude, name }: { latitude: string; longitude: string; name: string }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    const lat = Number(latitude)
    const lng = Number(longitude)
    if (isNaN(lat) || isNaN(lng)) return

    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: [lat, lng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map)

      const icon = L.divIcon({
        html: `<div style="background:#10b981;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:10px;font-weight:bold;">C</span></div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      L.marker([lat, lng], { icon }).addTo(map).bindPopup(`<strong>${name}</strong><br/>${lat.toFixed(4)}, ${lng.toFixed(4)}`)
      mapInstanceRef.current = map
      setTimeout(() => map.invalidateSize(), 100)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [latitude, longitude, name])

  return (
    <div className="relative rounded-lg overflow-hidden border">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <div ref={mapRef} style={{ height: '140px', width: '100%' }} />
      <div className="absolute bottom-1 left-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-slate-500 font-mono">
        {Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)}
      </div>
    </div>
  )
}

// ── Projects Timeline ──
function ProjectsTimeline({ projects }: { projects: Array<{ id: number; project_ref: string; title: string; status: string }> }) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-4">
        <MapPin className="w-6 h-6 text-slate-300 mx-auto mb-1" />
        <p className="text-xs text-slate-400">No projects yet</p>
      </div>
    )
  }

  const statusDot: Record<string, string> = {
    intake: 'bg-indigo-500', field_survey: 'bg-blue-500',
    data_processing: 'bg-amber-500', completed: 'bg-emerald-500',
    pending: 'bg-slate-400', active: 'bg-emerald-500',
  }

  return (
    <div className="space-y-0">
      {projects.map((p, idx) => (
        <div key={p.id} className="flex items-start gap-3 relative">
          {/* Timeline line */}
          {idx < projects.length - 1 && (
            <div className="absolute left-[9px] top-[22px] w-px h-[calc(100%-8px)] bg-slate-200" />
          )}
          <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center ${statusDot[p.status] || 'bg-slate-400'}`}>
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <div className="flex-1 pb-3">
            <p className="text-xs font-medium text-slate-800">{p.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-400 font-mono">{p.project_ref}</span>
              {statusBadge(p.status)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Action helper to call PATCH APIs ──
async function patchRecord(endpoint: string, data: Record<string, unknown>) {
  const res = await fetch(endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to update ${endpoint}`)
  return res.json()
}

async function deleteRecord(endpoint: string) {
  const res = await fetch(endpoint, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete ${endpoint}`)
  return res.json()
}

// ── Client Detail with Workspace Tabs ──
export function ClientDetail({ data, onRefresh }: { data: ClientRecord; onRefresh?: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'finance' | 'documents' | 'communications' | 'approvals'>('overview')
  const [actionLoading, setActionLoading] = useState(false)

  if (!data) return null
  const clientName = data.client_type === 'company' ? data.company_name : `${data.first_name} ${data.last_name}`

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true)
    try {
      await patchRecord(`/api/clients/${data.id}`, { status: newStatus })
      onRefresh?.()
    } catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this client?')) return
    setActionLoading(true)
    try {
      await deleteRecord(`/api/clients/${data.id}`)
      onRefresh?.()
    } catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  const TABS = [
    { id: 'overview' as const, label: 'Overview', icon: null },
    { id: 'projects' as const, label: `Projects (${data.surveyProjects.length})`, icon: MapPin },
    { id: 'finance' as const, label: `Finance (${data.invoices.length})`, icon: Receipt },
    { id: 'documents' as const, label: `Docs (${data._count.documents})`, icon: FileText },
    { id: 'communications' as const, label: `Messages (${data._count.communications})`, icon: MessageSquare },
    { id: 'approvals' as const, label: 'Approvals', icon: ShieldCheck },
  ]

  return (
    <div className="space-y-5">
      {/* Header with Status Actions */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-700">
            {data.client_type === 'company' ? (data.company_name?.[0] || 'C') : `${data.first_name?.[0] || ''}${data.last_name?.[0] || ''}`}
          </div>
          <div>
            <p className="font-semibold">{clientName}</p>
            {statusBadge(data.status)}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs" disabled={actionLoading}>
              Actions <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleStatusChange('active')}>Set Active</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('prospect')}>Set Prospect</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('pending')}>Set Pending</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Client
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Workspace Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b pb-0">
        {TABS.map(tab => (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            className={`h-7 text-[11px] whitespace-nowrap rounded-b-none ${activeTab === tab.id ? 'border-b-2 border-emerald-600 text-emerald-700 font-semibold' : 'text-slate-500'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <DetailField label="Client Ref" value={<span className="font-mono">{data.client_ref}</span>} />
            <DetailField label="Type" value={<span className="capitalize">{data.client_type}</span>} />
            <DetailField label="District" value={data.district} />
            <DetailField label="Organization" value={data.organization?.name} />
            <DetailField label="Branch" value={data.branch?.name} />
            <DetailField label="Phone" value={data.phone} />
            <DetailField label="Email" value={data.email} />
          </div>

          {/* Mini Map of Client Location */}
          {data.latitude && data.longitude && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> Location
                </h4>
                <ClientMiniMap latitude={data.latitude} longitude={data.longitude} name={clientName} />
              </div>
            </>
          )}

          <Separator />

          {/* Financial Summary Bar */}
          <div>
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3 h-3" /> Financial Summary
            </h4>
            {(() => {
              const totalInvoiced = data.invoices.reduce((s, i) => s + Number(i.total_amount), 0)
              const totalPaid = data.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total_amount), 0)
              const totalOutstanding = totalInvoiced - totalPaid
              const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0
              const overdueCount = data.invoices.filter(i => i.status === 'overdue' || i.status === 'pending').length

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-center">
                      <p className="text-[9px] text-emerald-600 uppercase tracking-wide font-medium">Invoiced</p>
                      <p className="text-xs font-bold text-emerald-700 mt-0.5">{formatUGX(totalInvoiced)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-blue-50 text-center">
                      <p className="text-[9px] text-blue-600 uppercase tracking-wide font-medium">Collected</p>
                      <p className="text-xs font-bold text-blue-700 mt-0.5">{formatUGX(totalPaid)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-50 text-center">
                      <p className="text-[9px] text-amber-600 uppercase tracking-wide font-medium">Outstanding</p>
                      <p className="text-xs font-bold text-amber-700 mt-0.5">{formatUGX(totalOutstanding)}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Collection Rate</span>
                      <span className={`font-semibold ${collectionRate >= 80 ? 'text-emerald-600' : collectionRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{collectionRate}%</span>
                    </div>
                    <Progress value={collectionRate} className="h-1.5" />
                  </div>
                  {overdueCount > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5">
                      <AlertCircle className="w-3 h-3" />
                      <span>{overdueCount} invoice{overdueCount > 1 ? 's' : ''} pending/overdue</span>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          <Separator />

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-blue-50 text-center"><p className="text-lg font-bold text-blue-600">{data._count.surveyProjects}</p><p className="text-[10px] text-blue-500">Projects</p></div>
            <div className="p-3 rounded-lg bg-emerald-50 text-center"><p className="text-lg font-bold text-emerald-600">{data.invoices.length}</p><p className="text-[10px] text-emerald-500">Invoices</p></div>
            <div className="p-3 rounded-lg bg-amber-50 text-center"><p className="text-lg font-bold text-amber-600">{data._count.documents}</p><p className="text-[10px] text-amber-500">Documents</p></div>
            <div className="p-3 rounded-lg bg-violet-50 text-center"><p className="text-lg font-bold text-violet-600">{data._count.communications}</p><p className="text-[10px] text-violet-500">Messages</p></div>
          </div>

          {/* Projects Timeline */}
          {data.surveyProjects.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <GitBranch className="w-3 h-3" /> Projects Timeline
                </h4>
                <ProjectsTimeline projects={data.surveyProjects} />
              </div>
            </>
          )}
        </>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-3">
          {data.surveyProjects.length > 0 ? data.surveyProjects.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              <div>
                <p className="text-sm font-medium">{p.title}</p>
                <p className="text-[11px] text-slate-400 font-mono">{p.project_ref}</p>
              </div>
              {statusBadge(p.status)}
            </div>
          )) : <p className="text-sm text-slate-400 text-center py-6">No projects yet</p>}
        </div>
      )}

      {/* Finance Tab */}
      {activeTab === 'finance' && (
        <div className="space-y-3">
          {data.invoices.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-emerald-50 text-center">
                  <p className="text-[10px] text-emerald-500 uppercase">Total Invoiced</p>
                  <p className="text-sm font-bold text-emerald-700">UGX {data.invoices.reduce((s, i) => s + Number(i.total_amount), 0).toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 text-center">
                  <p className="text-[10px] text-blue-500 uppercase">Paid</p>
                  <p className="text-sm font-bold text-blue-700">UGX {data.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total_amount), 0).toLocaleString()}</p>
                </div>
              </div>
              {data.invoices.map(i => (
                <div key={i.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div>
                    <span className="text-sm font-mono">{i.invoice_number}</span>
                    <p className="text-[11px] text-slate-400">UGX {Number(i.total_amount).toLocaleString()}</p>
                  </div>
                  {statusBadge(i.status)}
                </div>
              ))}
            </>
          ) : <p className="text-sm text-slate-400 text-center py-6">No invoices yet</p>}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <ClientDocumentsTab clientId={data.id} count={data._count.documents} />
      )}

      {/* Communications Tab */}
      {activeTab === 'communications' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">{data._count.communications} messages recorded</p>
          <p className="text-[11px] text-slate-400">View and manage messages from the Messages & SMS module</p>
        </div>
      )}

      {/* Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-3">
          {data.surveyProjects.length > 0 ? (
            data.surveyProjects.map(p => (
              <div key={p.id} className="p-3 rounded-lg bg-slate-50">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{p.title}</p>
                  {statusBadge(p.status)}
                </div>
                <p className="text-[11px] text-slate-400">Approval status tracked in project details</p>
              </div>
            ))
          ) : <p className="text-sm text-slate-400 text-center py-6">No approval steps yet</p>}
        </div>
      )}
    </div>
  )
}

// ── Project Detail ──
export function ProjectDetail({ data, onRefresh }: { data: ProjectRecord; onRefresh?: () => void }) {
  const [actionLoading, setActionLoading] = useState(false)

  if (!data) return null

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true)
    try {
      await patchRecord(`/api/projects/${data.id}`, { status: newStatus })
      onRefresh?.()
    } catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center"><MapPin className="w-6 h-6 text-blue-600" /></div>
          <div>
            <p className="font-semibold">{data.title}</p>
            <div className="flex items-center gap-2 mt-1">{statusBadge(data.status)}<Badge variant="outline" className={`text-xs ${PRIORITY_BADGE[data.priority] || ''}`}>{data.priority}</Badge></div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs" disabled={actionLoading}>
              Status <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleStatusChange('intake')}>Intake</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('field_survey')}>Field Survey</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('data_processing')}>Data Processing</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('completed')}>Completed</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Reference" value={<span className="font-mono">{data.project_ref}</span>} />
        <DetailField label="Type" value={fmt(data.project_type)} />
        <DetailField label="Client" value={data.client?.company_name || `${data.client?.first_name} ${data.client?.last_name}`} />
        <DetailField label="District" value={data.district} />
        <DetailField label="Area" value={data.area_hectares ? `${data.area_hectares} hectares` : '—'} />
        <DetailField label="Due Date" value={data.due_date ? new Date(data.due_date).toLocaleDateString() : '—'} />
      </div>
      <Separator />
      <div>
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Approval Steps ({data.approvalSteps.length})</h4>
        <div className="space-y-2">
          {data.approvalSteps.map((step) => (
            <div key={step.id} className="flex items-center gap-3 p-2 rounded bg-slate-50">
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold
                ${step.status === 'approved' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : step.status === 'pending' ? 'border-slate-200 bg-white text-slate-400' : 'border-amber-500 bg-amber-50 text-amber-600'}`}>
                {step.status === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.step_order}
              </div>
              <div className="flex-1"><p className="text-sm font-medium">{step.step_name}</p><p className="text-[11px] text-slate-400">{step.approver_role || 'No assignee'}</p></div>
              {statusBadge(step.status)}
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Field Observations ({data.fieldObservations.length})</h4>
        {data.fieldObservations.length > 0 ? data.fieldObservations.map(o => (
          <div key={o.id} className="flex items-center justify-between p-2 rounded bg-slate-50 mb-1"><span className="text-sm">{o.title}</span>{statusBadge(o.status)}</div>
        )) : <p className="text-sm text-slate-400">No observations yet</p>}
      </div>
    </div>
  )
}

// ── Workflow Detail ──
export function WorkflowDetail({ data }: any) {
  if (!data) return null
  return (
    <div className="space-y-5">
      <DetailField label="Name" value={data.name} />
      <DetailField label="Version" value={`v${data.version}`} />
      <DetailField label="Trigger" value={fmt(data.trigger_type)} />
      <DetailField label="Description" value={data.description} />
      <Separator />
      <div>
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">All Steps</h4>
        <div className="space-y-2">
          {data.steps.map((step: any) => (
            <div key={step.id} className="flex items-center gap-3 p-2.5 rounded bg-slate-50">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">{step.step_order}</div>
              <div className="flex-1">
                <p className="text-sm font-medium">{step.name}</p>
                <div className="flex items-center gap-2 mt-0.5"><Badge variant="outline" className="text-[10px]">{step.step_type}</Badge>{step.sla_hours && <span className="text-[10px] text-slate-400"><Clock3 className="w-3 h-3 inline mr-0.5" />{step.sla_hours}h</span>}</div>
              </div>
              <span className="text-[11px] text-slate-400">{step.assignee_id || 'Unassigned'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Observation Detail ──
export function ObservationDetail({ data }: any) {
  if (!data) return null
  return (
    <div className="space-y-5">
      <div className="w-full h-40 rounded-lg bg-slate-100 flex items-center justify-center"><MapPin className="w-8 h-8 text-slate-300" /></div>
      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Title" value={data.title} />
        <DetailField label="Type" value={fmt(data.observation_type)} />
        <DetailField label="Latitude" value={<span className="font-mono">{Number(data.latitude).toFixed(6)}</span>} />
        <DetailField label="Longitude" value={<span className="font-mono">{Number(data.longitude).toFixed(6)}</span>} />
        <DetailField label="Accuracy" value={data.accuracy_meters ? `${Number(data.accuracy_meters)}m` : '—'} />
        <DetailField label="Altitude" value={data.altitude_meters ? `${Number(data.altitude_meters)}m` : '—'} />
        <DetailField label="Status" value={statusBadge(data.status)} />
        <DetailField label="Synced" value={data.synced_at ? new Date(data.synced_at).toLocaleString() : '—'} />
      </div>
      {data.description && <><Separator /><DetailField label="Description" value={data.description} /></>}
      {data.form_data && <><Separator /><DetailField label="Form Data" value={<pre className="text-[11px] bg-slate-50 p-2 rounded overflow-auto">{JSON.stringify(data.form_data, null, 2)}</pre>} /></>}
    </div>
  )
}

// ── Sync Detail ──
export function SyncDetail({ data }: any) {
  if (!data) return null
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Device" value={<span className="font-mono text-xs">{data.device_id}</span>} />
        <DetailField label="User" value={data.user_id} />
        <DetailField label="Type" value={<Badge className={data.sync_type === 'push' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}>{data.sync_type.toUpperCase()}</Badge>} />
        <DetailField label="Status" value={statusBadge(data.status)} />
        <DetailField label="Records Pushed" value={data.records_pushed} />
        <DetailField label="Records Pulled" value={data.records_pulled} />
        <DetailField label="Conflicts" value={data.conflicts_count} />
        <DetailField label="Started" value={new Date(data.started_at).toLocaleString()} />
        {data.completed_at && <DetailField label="Completed" value={new Date(data.completed_at).toLocaleString()} />}
        {data.completed_at && <DetailField label="Duration" value={`${Math.round((new Date(data.completed_at).getTime() - new Date(data.started_at).getTime()) / 1000)}s`} />}
      </div>
    </div>
  )
}

// ── AI Model Detail ──
export function AIModelDetail({ data }: any) {
  if (!data) return null
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center"><Cpu className="w-6 h-6 text-violet-600" /></div>
        <div><p className="font-semibold">{data.display_name}</p><Badge className={data.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}>{data.is_active ? 'Active' : 'Inactive'}</Badge></div>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Provider" value={data.provider} />
        <DetailField label="Model Name" value={<span className="font-mono text-xs">{data.model_name}</span>} />
        <DetailField label="Cost / 1K Input" value={data.cost_per_1k_input ? `$${Number(data.cost_per_1k_input).toFixed(4)}` : '—'} />
        <DetailField label="Cost / 1K Output" value={data.cost_per_1k_output ? `$${Number(data.cost_per_1k_output).toFixed(4)}` : '—'} />
        <DetailField label="Max Tokens" value={data.max_tokens?.toLocaleString()} />
        <DetailField label="ID" value={<span className="font-mono text-[11px]">{data.id}</span>} />
      </div>
    </div>
  )
}

// ── Invoice Detail ──
export function InvoiceDetail({ data, onRefresh }: { data: any; onRefresh?: () => void }) {
  const [actionLoading, setActionLoading] = useState(false)

  if (!data) return null

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true)
    try {
      await patchRecord(`/api/invoices/${data.id}`, { status: newStatus })
      onRefresh?.()
    } catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center"><Receipt className="w-6 h-6 text-emerald-600" /></div>
          <div><p className="font-semibold">{data.invoice_number}</p>{statusBadge(data.status)}</div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs" disabled={actionLoading}>
              Status <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleStatusChange('draft')}>Draft</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('sent')}>Sent</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('pending')}>Pending</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('paid')}>Paid</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('cancelled')}>Cancelled</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Client" value={data.client?.company_name || `${data.client?.first_name} ${data.client?.last_name}`} />
        <DetailField label="Total Amount" value={<span className="font-bold">UGX {Number(data.total_amount).toLocaleString()}</span>} />
        <DetailField label="Issue Date" value={data.issued_at ? new Date(data.issued_at).toLocaleDateString() : data.created_at ? new Date(data.created_at).toLocaleDateString() : '—'} />
        <DetailField label="Due Date" value={data.due_date ? new Date(data.due_date).toLocaleDateString() : '—'} />
        <DetailField label="Status" value={statusBadge(data.status)} />
        <DetailField label="Client Ref" value={data.client?.client_ref} />
      </div>
      {data.line_items && <><Separator /><DetailField label="Line Items" value={<pre className="text-[11px] bg-slate-50 p-2 rounded overflow-auto">{JSON.stringify(data.line_items, null, 2)}</pre>} /></>}
    </div>
  )
}

// ── Quotation Detail ──
export function QuotationDetail({ data }: any) {
  if (!data) return null
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center"><DollarSign className="w-6 h-6 text-blue-600" /></div>
        <div><p className="font-semibold">{data.quote_number}</p>{statusBadge(data.status)}</div>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Client" value={data.client?.company_name || `${data.client?.first_name} ${data.client?.last_name}`} />
        <DetailField label="Total Amount" value={<span className="font-bold">UGX {Number(data.amount || data.total_amount || 0).toLocaleString()}</span>} />
        <DetailField label="Valid Until" value={data.valid_until ? new Date(data.valid_until).toLocaleDateString() : '—'} />
        <DetailField label="Status" value={statusBadge(data.status)} />
        <DetailField label="Created" value={new Date(data.created_at).toLocaleDateString()} />
        <DetailField label="Client Ref" value={data.client?.client_ref} />
      </div>
    </div>
  )
}

// ── Document Detail ──
export function DocumentDetail({ data, onRefresh }: { data: any; onRefresh?: () => void }) {
  const [actionLoading, setActionLoading] = useState(false)

  if (!data) return null

  const isImage = data.mime_type?.startsWith('image/')
  const isPdf = data.mime_type === 'application/pdf'
  const filePath = data.file_path?.startsWith('/upload/') ? data.file_path : data.file_path?.startsWith('/') ? data.file_path : null
  const fileUrl = filePath ? `/api/files${filePath}` : null
  const thumbUrl = isImage && filePath ? `/api/files${filePath}?w=400&h=400` : null

  const handleVerify = async () => {
    setActionLoading(true)
    try {
      await patchRecord(`/api/documents/${data.id}`, { is_verified: true })
      onRefresh?.()
    } catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return
    setActionLoading(true)
    try {
      await deleteRecord(`/api/documents/${data.id}`)
      onRefresh?.()
    } catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  const handleDownload = () => {
    if (!fileUrl) return
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = data.title || 'download'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center"><FileText className="w-6 h-6 text-amber-600" /></div>
          <div><p className="font-semibold">{data.title}</p>
            <Badge variant="outline" className={`text-[10px] mt-0.5 ${data.is_verified ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
              {data.is_verified ? '✓ Verified' : 'Unverified'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {fileUrl && (
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleDownload}>
              <Download className="w-3.5 h-3.5 mr-1" /> Download
            </Button>
          )}
          {!data.is_verified && (
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading} onClick={handleVerify}>
              <Eye className="w-3.5 h-3.5 mr-1" /> Verify
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={actionLoading}>
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* File Preview */}
      {thumbUrl && (
        <div className="rounded-lg overflow-hidden border bg-slate-50">
          <img src={thumbUrl} alt={data.title} className="w-full h-auto max-h-64 object-contain" />
        </div>
      )}
      {isPdf && fileUrl && (
        <div className="rounded-lg border bg-slate-50 p-4 text-center">
          <FileText className="w-10 h-10 text-red-400 mx-auto mb-2" />
          <p className="text-xs text-slate-500">PDF Document</p>
          <Button size="sm" variant="outline" className="h-7 text-[11px] mt-2" onClick={handleDownload}>
            <Eye className="w-3 h-3 mr-1" /> View PDF
          </Button>
        </div>
      )}

      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Document Type" value={fmt(data.document_type)} />
        <DetailField label="File Type" value={<span className="font-mono text-xs">{data.mime_type?.split('/').pop()?.toUpperCase() || 'Unknown'}</span>} />
        <DetailField label="Client" value={data.client?.company_name || `${data.client?.first_name} ${data.client?.last_name}`} />
        <DetailField label="File Size" value={data.file_size ? `${(Number(data.file_size) / 1024).toFixed(1)} KB` : '—'} />
        <DetailField label="MIME Type" value={<span className="font-mono text-[11px]">{data.mime_type}</span>} />
        <DetailField label="Uploaded By" value={data.uploaded_by} />
        <DetailField label="Created" value={new Date(data.created_at).toLocaleString()} />
      </div>
      {data.description && <><Separator /><DetailField label="Description" value={data.description} /></>}
    </div>
  )
}

// ── Communication Detail ──
export function CommunicationDetail({ data, onRefresh }: { data: any; onRefresh?: () => void }) {
  const [actionLoading, setActionLoading] = useState(false)

  if (!data) return null

  const handleMarkDelivered = async () => {
    setActionLoading(true)
    try {
      await patchRecord(`/api/communications/${data.id}`, { status: 'delivered' })
      onRefresh?.()
    } catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  const handleMarkRead = async () => {
    setActionLoading(true)
    try {
      await patchRecord(`/api/communications/${data.id}`, { status: 'delivered' })
      onRefresh?.()
    } catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center"><MessageSquare className="w-6 h-6 text-violet-600" /></div>
          <div>
            <p className="font-semibold">{data.subject || 'No Subject'}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px]">{fmt(data.channel)}</Badge>
              <Badge className={data.direction === 'outbound' ? 'bg-blue-100 text-blue-800 text-[10px]' : 'bg-emerald-100 text-emerald-800 text-[10px]'}>{fmt(data.direction)}</Badge>
              {statusBadge(data.status)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.status === 'queued' && (
            <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700" disabled={actionLoading} onClick={handleMarkRead}>
              <Send className="w-3.5 h-3.5 mr-1" /> Send
            </Button>
          )}
          {data.status === 'sent' && (
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading} onClick={handleMarkDelivered}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Delivered
            </Button>
          )}
          {(data.status === 'pending' || data.status === 'received') && (
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading} onClick={handleMarkRead}>
              <Eye className="w-3.5 h-3.5 mr-1" /> Mark Read
            </Button>
          )}
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Client" value={data.client?.company_name || `${data.client?.first_name} ${data.client?.last_name}`} />
        <DetailField label="Channel" value={fmt(data.channel)} />
        <DetailField label="Direction" value={fmt(data.direction)} />
        <DetailField label="Sent At" value={data.sent_at ? new Date(data.sent_at).toLocaleString() : '—'} />
        <DetailField label="Created" value={new Date(data.created_at).toLocaleString()} />
      </div>
      {data.body && <><Separator /><DetailField label="Body" value={<div className="text-sm bg-slate-50 p-3 rounded-lg max-h-60 overflow-y-auto whitespace-pre-wrap">{data.body}</div>} /></>}
    </div>
  )
}

// ── Approval Detail ──
export function ApprovalDetail({ data, onRefresh }: { data: any; onRefresh?: () => void }) {
  const [actionLoading, setActionLoading] = useState(false)

  if (!data) return null

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      await patchRecord(`/api/approvals/${data.id}`, { status: 'approved', approved_by: 'current_user' })
      onRefresh?.()
    } catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  const handleDefer = async () => {
    setActionLoading(true)
    try {
      await patchRecord(`/api/approvals/${data.id}`, { status: 'deferred' })
      onRefresh?.()
    } catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  const handleReject = async () => {
    setActionLoading(true)
    try {
      await patchRecord(`/api/approvals/${data.id}`, { status: 'rejected' })
      onRefresh?.()
    } catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-amber-600" /></div>
          <div><p className="font-semibold">{fmt(data.step_name)}</p>{statusBadge(data.status)}</div>
        </div>
        {data.status === 'pending' && (
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading} onClick={handleApprove}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" disabled={actionLoading} onClick={handleDefer}>
              <Clock3 className="w-3.5 h-3.5 mr-1" /> Defer
            </Button>
            <Button size="sm" variant="destructive" className="h-8 text-xs" disabled={actionLoading} onClick={handleReject}>
              Reject
            </Button>
          </div>
        )}
        {data.status === 'deferred' && (
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading} onClick={handleApprove}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
            </Button>
          </div>
        )}
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Step Order" value={data.step_order} />
        <DetailField label="Approver Role" value={data.approver_role || '—'} />
        <DetailField label="Assigned To" value={data.assigned_to || '—'} />
        <DetailField label="Approved By" value={data.approved_by || '—'} />
        <DetailField label="Approved At" value={data.approved_at ? new Date(data.approved_at).toLocaleString() : '—'} />
        <DetailField label="Project" value={data.surveyProject?.title} />
      </div>
      {data.surveyProject && <><Separator />
        <div>
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Project Context</h4>
          <div className="p-3 rounded-lg bg-slate-50">
            <p className="text-sm font-medium">{data.surveyProject.title}</p>
            <p className="text-[11px] text-slate-400">{data.surveyProject.project_ref}</p>
            {data.surveyProject.client && <p className="text-[11px] text-slate-500 mt-1">Client: {data.surveyProject.client.company_name || `${data.surveyProject.client.first_name} ${data.surveyProject.client.last_name}`}</p>}
          </div>
        </div>
      </>}
      {data.notes && <><Separator /><DetailField label="Notes" value={data.notes} /></>}
    </div>
  )
}

// ── Domain Event Detail ──
export function DomainEventDetail({ data }: any) {
  if (!data) return null
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center"><ScrollText className="w-6 h-6 text-slate-600" /></div>
        <div><p className="font-semibold">{fmt(data.event_type)}</p><Badge variant="outline" className="text-[10px] font-mono mt-0.5">{data.aggregate}</Badge></div>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Event Type" value={<Badge variant="outline" className="text-[10px] font-mono">{data.event_type}</Badge>} />
        <DetailField label="Aggregate" value={fmt(data.aggregate)} />
        <DetailField label="Aggregate ID" value={<span className="font-mono text-[11px] break-all">{data.aggregate_id}</span>} />
        <DetailField label="Created At" value={new Date(data.created_at).toLocaleString()} />
        {data.organization_id && <DetailField label="Organization ID" value={<span className="font-mono text-[11px]">{data.organization_id}</span>} />}
        {data.branch_id && <DetailField label="Branch ID" value={<span className="font-mono text-[11px]">{data.branch_id}</span>} />}
      </div>
      {data.payload && <><Separator /><div><h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Payload</h4><pre className="text-[11px] bg-slate-50 p-3 rounded-lg overflow-auto max-h-80">{JSON.stringify(data.payload, null, 2)}</pre></div></>}
      {data.metadata && <><Separator /><div><h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Metadata</h4><pre className="text-[11px] bg-slate-50 p-3 rounded-lg overflow-auto max-h-40">{JSON.stringify(data.metadata, null, 2)}</pre></div></>}
    </div>
  )
}

// ── Report Detail ──
export function ReportDetail({ data }: any) {
  if (!data) return null
  const rt = data.reportType

  if (rt === 'project') {
    const p = data.data
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center"><MapPin className="w-6 h-6 text-blue-600" /></div>
          <div><p className="font-semibold">{p.title}</p><div className="flex items-center gap-2 mt-1">{statusBadge(p.status)}<Badge variant="outline" className={`text-xs ${PRIORITY_BADGE[p.priority] || ''}`}>{p.priority}</Badge></div></div>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          <DetailField label="Reference" value={<span className="font-mono">{p.project_ref}</span>} />
          <DetailField label="Type" value={fmt(p.project_type)} />
          <DetailField label="Client" value={p.client?.company_name || `${p.client?.first_name} ${p.client?.last_name}`} />
          <DetailField label="District" value={p.district || '—'} />
          <DetailField label="Area" value={p.area_hectares ? `${p.area_hectares} hectares` : '—'} />
          <DetailField label="Created" value={new Date(p.created_at).toLocaleDateString()} />
        </div>
        <Separator />
        <div>
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Approval Progress</h4>
          <Progress value={p.totalSteps > 0 ? (p.approvedSteps / p.totalSteps) * 100 : 0} className="h-2" />
          <p className="text-sm text-slate-600 mt-1">{p.approvedSteps} of {p.totalSteps} steps approved</p>
        </div>
      </div>
    )
  }

  if (rt === 'invoice') {
    const inv = data.data
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center"><Receipt className="w-6 h-6 text-emerald-600" /></div>
          <div><p className="font-semibold">{inv.invoice_number}</p>{statusBadge(inv.status)}</div>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          <DetailField label="Client" value={inv.client?.company_name || `${inv.client?.first_name} ${inv.client?.last_name}`} />
          <DetailField label="Total Amount" value={<span className="font-bold">UGX {Number(inv.total_amount).toLocaleString()}</span>} />
          <DetailField label="Due Date" value={inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'} />
          <DetailField label="Created" value={inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'} />
        </div>
      </div>
    )
  }

  if (rt === 'client') {
    const c = data.data
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-lg font-bold text-violet-700">{c.name?.[0] || '?'}</div>
          <div><p className="font-semibold">{c.name}</p><div className="flex items-center gap-2 mt-1">{statusBadge(c.status)}<Badge variant="outline" className="text-[10px] capitalize">{c.client_type}</Badge></div></div>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          <DetailField label="District" value={c.district || '—'} />
          <DetailField label="Organization" value={c.organization || '—'} />
          <DetailField label="Branch" value={c.branch || '—'} />
          <DetailField label="Client Ref" value={<span className="font-mono text-xs">{c.client_ref}</span>} />
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-blue-50 text-center"><p className="text-lg font-bold text-blue-600">{c.projectCount}</p><p className="text-[10px] text-blue-500">Projects</p></div>
          <div className="p-3 rounded-lg bg-emerald-50 text-center"><p className="text-lg font-bold text-emerald-600">{c.invoiceCount}</p><p className="text-[10px] text-emerald-500">Invoices</p></div>
          <div className="p-3 rounded-lg bg-amber-50 text-center"><p className="text-lg font-bold text-amber-600">{c.documentCount}</p><p className="text-[10px] text-amber-500">Documents</p></div>
          <div className="p-3 rounded-lg bg-violet-50 text-center"><p className="text-lg font-bold text-violet-600">{c.communicationCount}</p><p className="text-[10px] text-violet-500">Messages</p></div>
        </div>
      </div>
    )
  }

  if (rt === 'workflow') {
    const w = data.data
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center"><GitBranch className="w-6 h-6 text-violet-600" /></div>
          <div><p className="font-semibold">{w.name}</p><Badge variant="outline" className="text-[10px]">v{w.version} • {fmt(w.triggerType)}</Badge></div>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          <DetailField label="Steps" value={w.stepCount} />
          <DetailField label="Instances" value={w.instanceCount} />
        </div>
        <Separator />
        <div>
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Workflow Steps</h4>
          <div className="space-y-2">
            {w.steps.map((step: any, idx: number) => (
              <div key={step.id} className="flex items-center gap-3 p-2.5 rounded bg-slate-50">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{step.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px]">{step.step_type}</Badge>
                    {step.sla_hours && <span className="text-[10px] text-slate-400">{step.sla_hours}h SLA</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DetailField label="Report Type" value={<Badge variant="outline" className="text-xs capitalize">{rt}</Badge>} />
      <DetailField label="Generated" value={new Date().toLocaleString()} />
      <Separator />
      <pre className="text-[11px] bg-slate-50 p-3 rounded-lg overflow-auto max-h-80">{JSON.stringify(data.data, null, 2)}</pre>
    </div>
  )
}
