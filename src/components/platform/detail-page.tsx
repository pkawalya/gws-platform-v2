'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MapPin, CheckCircle2, Clock3, Receipt, DollarSign, FileText,
  MessageSquare, ShieldCheck, ScrollText, Cpu, GitBranch,
  ChevronDown, Eye, Send, Trash2, MoreHorizontal, TrendingUp, TrendingDown,
  CalendarDays, ArrowRight, AlertCircle, ArrowLeft, Users, Activity,
  Smartphone, Layers, Brain, BarChart2, Building2, X, Phone, Mail,
  Pencil, Save, Globe, Home, MapPinned, Building, StickyNote,
  CreditCard, Clock, User, ExternalLink, Copy,
} from 'lucide-react'
import { fmt, statusBadge, PRIORITY_BADGE, formatUGX, STATUS_BADGE } from './constants'
import { DetailField } from './helpers'
import type { ClientRecord, ProjectRecord, PageId } from './types'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

// ── Interactive Map for Detail Pages ──
function DetailMap({ latitude, longitude, name, type = 'client' }: { latitude: string; longitude: string; name: string; type?: string }) {
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
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)

      const colors: Record<string, string> = { client: '#10b981', project: '#3b82f6', observation: '#f59e0b' }
      const letters: Record<string, string> = { client: 'C', project: 'P', observation: 'O' }
      const color = colors[type] || '#10b981'
      const letter = letters[type] || 'X'

      const icon = L.divIcon({
        html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;border:4px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:13px;font-weight:bold;">${letter}</span></div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      L.marker([lat, lng], { icon }).addTo(map).bindPopup(`<strong>${name}</strong><br/>${lat.toFixed(4)}, ${lng.toFixed(4)}`)
      mapInstanceRef.current = map
      setTimeout(() => map.invalidateSize(), 200)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [latitude, longitude, name, type])

  return (
    <div className="relative rounded-xl overflow-hidden border shadow-sm">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <div ref={mapRef} style={{ height: '280px', width: '100%' }} />
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs text-slate-500 font-mono shadow-sm">
        {Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)}
      </div>
    </div>
  )
}

// ── Action helpers ──
async function patchRecord(endpoint: string, data: Record<string, unknown>) {
  const res = await fetch(endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  if (!res.ok) throw new Error(`Failed to update ${endpoint}`)
  return res.json()
}

async function deleteRecord(endpoint: string) {
  const res = await fetch(endpoint, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete ${endpoint}`)
  return res.json()
}

// ── Breadcrumb / Back navigation ──
function DetailBreadcrumb({ type, label, onBack }: { type: string; label: string; onBack: () => void }) {
  const icons: Record<string, any> = {
    client: Users, project: MapPin, workflow: GitBranch, observation: Smartphone,
    sync: Smartphone, 'ai-model': Brain, invoice: Receipt, quotation: DollarSign,
    document: FileText, communication: MessageSquare, approval: ShieldCheck,
    event: ScrollText, report: BarChart2, organization: Building2, layer: Layers,
  }
  const Icon = icons[type] || Activity
  const typeLabels: Record<string, string> = {
    client: 'Client', project: 'Project', workflow: 'Workflow', observation: 'Observation',
    sync: 'Sync Event', 'ai-model': 'AI Model', invoice: 'Invoice', quotation: 'Quotation',
    document: 'Document', communication: 'Message', approval: 'Approval',
    event: 'Event', report: 'Report', organization: 'Organization', layer: 'Layer',
  }

  return (
    <div className="flex items-center gap-2 mb-6">
      <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:text-slate-800" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>
      <Separator orientation="vertical" className="h-4" />
      <Icon className="w-4 h-4 text-slate-400" />
      <span className="text-sm text-slate-500">{typeLabels[type] || type}</span>
      <Separator orientation="vertical" className="h-4" />
      <span className="text-sm font-medium text-slate-800 truncate max-w-md">{label}</span>
    </div>
  )
}

// ── Editable Field ──
function EditableField({ label, value, onSave, type = 'text', icon: Icon, placeholder = '—' }: {
  label: string; value: string | null | undefined; onSave: (val: string) => void; type?: string; icon?: any; placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  useEffect(() => { setDraft(value || '') }, [value])

  if (editing) {
    return (
      <div className="space-y-1">
        <p className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</p>
        <div className="flex items-center gap-1">
          {type === 'textarea' ? (
            <Textarea className="text-sm h-16" value={draft} onChange={e => setDraft(e.target.value)} />
          ) : (
            <Input className="h-8 text-sm" type={type} value={draft} onChange={e => setDraft(e.target.value)} />
          )}
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700" onClick={() => { onSave(draft); setEditing(false) }}>
            <Save className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400" onClick={() => { setDraft(value || ''); setEditing(false) }}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative">
      <p className="text-[11px] text-slate-500 uppercase tracking-wide flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </p>
      <div className="flex items-center gap-1 mt-0.5">
        <p className="text-sm">{value || placeholder}</p>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-emerald-600" onClick={() => setEditing(true)}>
          <Pencil className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

// ── Activity Timeline ──
function ActivityTimeline({ clientName, projects, invoices }: { clientName: string; projects: any[]; invoices: any[] }) {
  // Build activity items from available data
  const activities: Array<{ id: string; type: string; description: string; date: string; icon: any; color: string }> = []

  projects.forEach(p => {
    activities.push({
      id: `proj-${p.id}`, type: 'project', description: `Project "${p.title}" — ${fmt(p.status)}`,
      date: p.created_at || new Date().toISOString(),
      icon: MapPin, color: p.status === 'completed' ? 'text-emerald-600 bg-emerald-50' : p.status === 'field_survey' ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50'
    })
  })

  invoices.forEach(i => {
    activities.push({
      id: `inv-${i.id}`, type: 'invoice', description: `Invoice ${i.invoice_number} — UGX ${Number(i.total_amount).toLocaleString()}`,
      date: i.created_at || i.issued_at || new Date().toISOString(),
      icon: Receipt, color: i.status === 'paid' ? 'text-emerald-600 bg-emerald-50' : i.status === 'overdue' ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'
    })
  })

  // Sort by date desc
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No activity recorded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {activities.slice(0, 10).map((a, idx) => (
        <div key={a.id} className="flex items-start gap-3 relative pb-4">
          {idx < Math.min(activities.length, 10) - 1 && (
            <div className="absolute left-[15px] top-[34px] w-px h-[calc(100%-14px)] bg-slate-200" />
          )}
          <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${a.color}`}>
            <a.icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700">{a.description}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{new Date(a.date).toLocaleDateString()} {new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN DETAIL PAGE COMPONENT
// ══════════════════════════════════════════════════════════════

interface DetailPageProps {
  type: string
  data: any
  onBack: () => void
  onRefresh: () => void
  onNavigate?: (page: PageId) => void
  openDetail?: (type: string, data: any) => void
  clients?: any[]
  projects?: any[]
}

export function DetailPage({ type, data, onBack, onRefresh, onNavigate, openDetail, clients, projects }: DetailPageProps) {
  if (!data) return null

  const breadcrumbLabel = (() => {
    switch (type) {
      case 'client': return data.client_type === 'company' ? data.company_name : `${data.first_name} ${data.last_name}`
      case 'project': return data.title
      case 'workflow': return data.name
      case 'observation': return data.title
      case 'sync': return `Sync — ${data.device_id}`
      case 'ai-model': return data.display_name
      case 'invoice': return data.invoice_number
      case 'quotation': return data.quote_number
      case 'document': return data.title
      case 'communication': return data.subject || 'No Subject'
      case 'approval': return data.step_name
      case 'event': return data.event_type
      case 'organization': return data.name
      case 'report': return data.title
      default: return 'Details'
    }
  })()

  return (
    <div className="animate-in fade-in slide-in-from-right-2 duration-300">
      <DetailBreadcrumb type={type} label={breadcrumbLabel} onBack={onBack} />

      {type === 'client' && <ClientDetailPage data={data} onRefresh={onRefresh} openDetail={openDetail} onNavigate={onNavigate} />}
      {type === 'project' && <ProjectDetailPage data={data} onRefresh={onRefresh} openDetail={openDetail} />}
      {type === 'workflow' && <WorkflowDetailPage data={data} />}
      {type === 'observation' && <ObservationDetailPage data={data} />}
      {type === 'sync' && <SyncDetailPage data={data} />}
      {type === 'ai-model' && <AIModelDetailPage data={data} />}
      {type === 'invoice' && <InvoiceDetailPage data={data} onRefresh={onRefresh} />}
      {type === 'quotation' && <QuotationDetailPage data={data} />}
      {type === 'document' && <DocumentDetailPage data={data} onRefresh={onRefresh} />}
      {type === 'communication' && <CommunicationDetailPage data={data} onRefresh={onRefresh} />}
      {type === 'approval' && <ApprovalDetailPage data={data} onRefresh={onRefresh} />}
      {type === 'event' && <DomainEventDetailPage data={data} />}
      {type === 'organization' && <OrganizationDetailPage data={data} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// CLIENT DETAIL PAGE — Comprehensive Full Page Layout
// ══════════════════════════════════════════════════════════════

function ClientDetailPage({ data, onRefresh, openDetail, onNavigate }: { data: ClientRecord; onRefresh: () => void; openDetail?: (type: string, data: any) => void; onNavigate?: (page: PageId) => void }) {
  const [actionLoading, setActionLoading] = useState(false)
  const [copiedRef, setCopiedRef] = useState(false)
  const clientName = data.client_type === 'company' ? data.company_name : `${data.first_name} ${data.last_name}`

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true)
    try { await patchRecord(`/api/clients/${data.id}`, { status: newStatus }); onRefresh() }
    catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) return
    setActionLoading(true)
    try { await deleteRecord(`/api/clients/${data.id}`); onRefresh() }
    catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  const handleFieldSave = async (field: string, value: string) => {
    try { await patchRecord(`/api/clients/${data.id}`, { [field]: value }); onRefresh() }
    catch (e) { console.error(e) }
  }

  const copyRef = () => {
    navigator.clipboard.writeText(data.client_ref)
    setCopiedRef(true)
    setTimeout(() => setCopiedRef(false), 2000)
  }

  const totalInvoiced = data.invoices.reduce((s, i) => s + Number(i.total_amount), 0)
  const totalPaid = data.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total_amount), 0)
  const totalOutstanding = totalInvoiced - totalPaid
  const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0
  const overdueCount = data.invoices.filter(i => i.status === 'overdue' || i.status === 'pending').length
  const activeProjects = data.surveyProjects.filter(p => p.status !== 'completed').length

  return (
    <div>
      {/* ── Hero Header with Cover ── */}
      <div className="relative mb-6">
        <div className="h-32 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-xl" />
        <div className="absolute bottom-0 left-0 right-0 px-6 translate-y-1/2">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center text-3xl font-bold text-emerald-700 border-4 border-white">
                {data.client_type === 'company' ? (data.company_name?.[0] || 'C') : `${data.first_name?.[0] || ''}${data.last_name?.[0] || ''}`}
              </div>
              <div className="pb-1">
                <h2 className="text-2xl font-bold text-slate-900">{clientName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {statusBadge(data.status)}
                  <Badge variant="outline" className="text-xs bg-white">{data.client_type === 'company' ? 'Company' : 'Individual'}</Badge>
                  <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 font-mono bg-white px-1.5 py-0.5 rounded" onClick={copyRef}>
                    {data.client_ref} <Copy className="w-3 h-3" />
                  </button>
                  {copiedRef && <span className="text-[10px] text-emerald-600">Copied!</span>}
                </div>
              </div>
            </div>
            <div className="pb-1 flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 bg-white" disabled={actionLoading}>
                    Actions <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleStatusChange('active')}>Set Active</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('prospect')}>Set Prospect</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('pending')}>Set Pending</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Client
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for the overlapping header */}
      <div className="h-10" />

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Active Projects', value: activeProjects, icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Projects', value: data._count.surveyProjects, icon: GitBranch, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Invoices', value: data.invoices.length, icon: Receipt, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Documents', value: data._count.documents, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Messages', value: data._count.communications, icon: MessageSquare, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(s => (
          <Card key={s.label} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Content with Tabs ── */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-0">
          {[
            { value: 'overview', label: 'Overview' },
            { value: 'projects', label: `Projects (${data.surveyProjects.length})` },
            { value: 'finance', label: `Finance (${data.invoices.length})` },
            { value: 'documents', label: `Documents (${data._count.documents})` },
            { value: 'communications', label: `Messages (${data._count.communications})` },
            { value: 'approvals', label: 'Approvals' },
            { value: 'activity', label: 'Activity' },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm data-[state=active]:text-emerald-700 data-[state=active]:font-semibold text-slate-500"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information Card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-600" /> Contact Information
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">{data.client_ref}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                    <EditableField label="First Name" value={data.first_name} icon={User} onSave={v => handleFieldSave('first_name', v)} />
                    <EditableField label="Last Name" value={data.last_name} icon={User} onSave={v => handleFieldSave('last_name', v)} />
                    <EditableField label="Company" value={data.company_name} icon={Building} onSave={v => handleFieldSave('company_name', v)} />
                    <EditableField label="Email" value={data.email} icon={Mail} onSave={v => handleFieldSave('email', v)} />
                    <EditableField label="Phone" value={data.phone} icon={Phone} onSave={v => handleFieldSave('phone', v)} />
                    <DetailField label="Client Type" value={<Badge variant="outline" className="text-xs">{data.client_type === 'company' ? 'Company' : 'Individual'}</Badge>} />
                    <EditableField label="District" value={data.district} icon={MapPin} onSave={v => handleFieldSave('district', v)} />
                    <DetailField label="Organization" value={data.organization?.name || '—'} />
                    <DetailField label="Branch" value={data.branch?.name || '—'} />
                    <EditableField label="NIN" value={(data as any).nin} icon={CreditCard} onSave={v => handleFieldSave('nin', v)} />
                    <EditableField label="Address" value={(data as any).address} icon={Home} onSave={v => handleFieldSave('address', v)} />
                    {(data as any).notes && <div className="col-span-2 md:col-span-3"><DetailField label="Notes" value={(data as any).notes} /></div>}
                  </div>
                </CardContent>
              </Card>

              {/* Financial Summary Card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" /> Financial Summary
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onNavigate?.('finance')}>
                      View in Finance <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-emerald-50 text-center border border-emerald-100">
                        <p className="text-xs text-emerald-600 uppercase tracking-wide font-medium">Invoiced</p>
                        <p className="text-lg font-bold text-emerald-700 mt-1">{formatUGX(totalInvoiced)}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-blue-50 text-center border border-blue-100">
                        <p className="text-xs text-blue-600 uppercase tracking-wide font-medium">Collected</p>
                        <p className="text-lg font-bold text-blue-700 mt-1">{formatUGX(totalPaid)}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-amber-50 text-center border border-amber-100">
                        <p className="text-xs text-amber-600 uppercase tracking-wide font-medium">Outstanding</p>
                        <p className="text-lg font-bold text-amber-700 mt-1">{formatUGX(totalOutstanding)}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Collection Rate</span>
                        <span className={`font-semibold ${collectionRate >= 80 ? 'text-emerald-600' : collectionRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{collectionRate}%</span>
                      </div>
                      <Progress value={collectionRate} className="h-2" />
                    </div>
                    {overdueCount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="font-medium">{overdueCount} invoice{overdueCount > 1 ? 's' : ''} pending/overdue</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Projects */}
              {data.surveyProjects.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" /> Recent Projects
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => {
                        const tabEl = document.querySelector('[data-value="projects"]') as HTMLButtonElement
                        tabEl?.click()
                      }}>
                        View All <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y">
                      {data.surveyProjects.slice(0, 5).map(p => (
                        <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors cursor-pointer" onClick={() => openDetail?.('project', p)}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                              p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              p.status === 'field_survey' ? 'bg-blue-100 text-blue-700' :
                              p.status === 'data_processing' ? 'bg-amber-100 text-amber-700' :
                              'bg-indigo-100 text-indigo-700'
                            }`}>{p.project_ref.slice(-2)}</div>
                            <div>
                              <p className="text-sm font-medium">{p.title}</p>
                              <p className="text-xs text-slate-400 font-mono">{p.project_ref}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {statusBadge(p.status)}
                            <ArrowRight className="w-4 h-4 text-slate-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Map Card */}
              {data.latitude && data.longitude ? (
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MapPinned className="w-4 h-4 text-emerald-600" /> Location
                  </CardTitle></CardHeader>
                  <CardContent>
                    <DetailMap latitude={data.latitude} longitude={data.longitude} name={clientName} type="client" />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No location data available</p>
                    <p className="text-xs text-slate-300 mt-1">Add coordinates to see client on map</p>
                  </CardContent>
                </Card>
              )}

              {/* Location Details Card */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" /> Location Details
                </CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <EditableField label="District" value={data.district} icon={MapPin} onSave={v => handleFieldSave('district', v)} />
                    <EditableField label="Sub County" value={(data as any).sub_county} icon={Home} onSave={v => handleFieldSave('sub_county', v)} />
                    <EditableField label="Parish" value={(data as any).parish} onSave={v => handleFieldSave('parish', v)} />
                    <EditableField label="Village" value={(data as any).village} icon={Home} onSave={v => handleFieldSave('village', v)} />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Quick Actions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start h-8 text-xs" onClick={() => onNavigate?.('projects')}>
                    <MapPin className="w-3.5 h-3.5 mr-2" /> Create New Project
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-8 text-xs" onClick={() => onNavigate?.('finance')}>
                    <Receipt className="w-3.5 h-3.5 mr-2" /> Create Invoice
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-8 text-xs" onClick={() => onNavigate?.('documents')}>
                    <FileText className="w-3.5 h-3.5 mr-2" /> Upload Document
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-8 text-xs" onClick={() => onNavigate?.('communications')}>
                    <MessageSquare className="w-3.5 h-3.5 mr-2" /> Send Message
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Projects Tab ── */}
        <TabsContent value="projects" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Survey Projects ({data.surveyProjects.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{activeProjects} Active</Badge>
                  <Badge variant="outline" className="text-xs">{data.surveyProjects.length - activeProjects} Completed</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.surveyProjects.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Reference</TableHead>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.surveyProjects.map(p => (
                      <TableRow key={p.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openDetail?.('project', p)}>
                        <TableCell className="font-mono text-xs">{p.project_ref}</TableCell>
                        <TableCell className="text-sm font-medium">{p.title}</TableCell>
                        <TableCell>{statusBadge(p.status)}</TableCell>
                        <TableCell><ArrowRight className="w-4 h-4 text-slate-300" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center">
                  <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-600">No projects yet</p>
                  <p className="text-xs text-slate-400 mt-1">Create a survey project for this client</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => onNavigate?.('projects')}>
                    <MapPin className="w-3.5 h-3.5 mr-1" /> New Project
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Finance Tab ── */}
        <TabsContent value="finance" className="mt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card><CardContent className="p-4 text-center">
                <p className="text-xs text-emerald-500 uppercase">Total Invoiced</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">{formatUGX(totalInvoiced)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-xs text-blue-500 uppercase">Collected</p>
                <p className="text-xl font-bold text-blue-700 mt-1">{formatUGX(totalPaid)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-xs text-amber-500 uppercase">Outstanding</p>
                <p className="text-xl font-bold text-amber-700 mt-1">{formatUGX(totalOutstanding)}</p>
              </CardContent></Card>
            </div>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Invoices ({data.invoices.length})</CardTitle>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onNavigate?.('finance')}>
                    View in Finance <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Invoice #</TableHead>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.invoices.map(i => (
                      <TableRow key={i.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openDetail?.('invoice', i)}>
                        <TableCell className="font-mono text-xs font-medium">{i.invoice_number}</TableCell>
                        <TableCell className="text-sm">UGX {Number(i.total_amount).toLocaleString()}</TableCell>
                        <TableCell>{statusBadge(i.status)}</TableCell>
                        <TableCell><ArrowRight className="w-4 h-4 text-slate-300" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Documents Tab ── */}
        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">{data._count.documents} documents on file</p>
              <p className="text-xs text-slate-400 mt-1">View and manage documents from the Document Vault module</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => onNavigate?.('documents')}>
                Go to Document Vault <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Communications Tab ── */}
        <TabsContent value="communications" className="mt-6">
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">{data._count.communications} messages recorded</p>
              <p className="text-xs text-slate-400 mt-1">View and manage messages from the Messages & SMS module</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => onNavigate?.('communications')}>
                Go to Messages <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Approvals Tab ── */}
        <TabsContent value="approvals" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" /> Approval Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.surveyProjects.length > 0 ? (
                <div className="divide-y">
                  {data.surveyProjects.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium">{p.title}</p>
                        <p className="text-xs text-slate-400 font-mono">{p.project_ref}</p>
                      </div>
                      {statusBadge(p.status)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">No approval steps yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Activity Tab ── */}
        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-600" /> Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline clientName={clientName} projects={data.surveyProjects} invoices={data.invoices} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// PROJECT DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function ProjectDetailPage({ data, onRefresh, openDetail }: { data: ProjectRecord; onRefresh: () => void; openDetail?: (type: string, data: any) => void }) {
  const [actionLoading, setActionLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true)
    try { await patchRecord(`/api/projects/${data.id}`, { status: newStatus }); onRefresh() }
    catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  const clientName = data.client?.company_name || `${data.client?.first_name} ${data.client?.last_name}`
  const approvedSteps = data.approvalSteps.filter(s => s.status === 'approved').length
  const totalSteps = data.approvalSteps.length
  const progressPercent = totalSteps > 0 ? Math.round((approvedSteps / totalSteps) * 100) : 0

  return (
    <div>
      {/* Hero Header */}
      <div className="relative mb-6">
        <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-xl" />
        <div className="absolute bottom-0 left-0 right-0 px-6 translate-y-1/2">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                <MapPin className="w-7 h-7 text-blue-600" />
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">{data.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {statusBadge(data.status)}
                  <Badge variant="outline" className={`text-xs ${PRIORITY_BADGE[data.priority] || ''}`}>{data.priority}</Badge>
                  <Badge variant="outline" className="text-xs">{fmt(data.project_type)}</Badge>
                  <span className="text-xs text-slate-400 font-mono">{data.project_ref}</span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 bg-white" disabled={actionLoading}>
                  Status <ChevronDown className="w-4 h-4 ml-1" />
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
        </div>
      </div>

      <div className="h-8" />

      {/* Progress Bar */}
      {totalSteps > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Project Progress</span>
              <span className="text-sm text-slate-500">{approvedSteps}/{totalSteps} approvals ({progressPercent}%)</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Details Card */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Project Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DetailField label="Reference" value={<span className="font-mono">{data.project_ref}</span>} />
                <DetailField label="Type" value={fmt(data.project_type)} />
                <DetailField label="Client" value={
                  <span className="cursor-pointer text-emerald-600 hover:text-emerald-700" onClick={() => openDetail?.('client', data.client)}>
                    {clientName}
                  </span>
                } />
                <DetailField label="District" value={data.district || '—'} />
                <DetailField label="Area" value={data.area_hectares ? `${data.area_hectares} hectares` : '—'} />
                <DetailField label="Due Date" value={data.due_date ? new Date(data.due_date).toLocaleDateString() : '—'} />
                <DetailField label="Created" value={new Date(data.created_at).toLocaleDateString()} />
                {data.description && <div className="col-span-2 md:col-span-3"><DetailField label="Description" value={data.description} /></div>}
              </div>
            </CardContent>
          </Card>

          {/* Approval Steps Card */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" /> Approval Steps ({data.approvalSteps.length})
            </CardTitle></CardHeader>
            <CardContent>
              {data.approvalSteps.length > 0 ? (
                <div className="space-y-3">
                  {data.approvalSteps.map((step) => (
                    <div key={step.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold
                        ${step.status === 'approved' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : step.status === 'pending' ? 'border-slate-200 bg-white text-slate-400' : 'border-amber-500 bg-amber-50 text-amber-600'}`}>
                        {step.status === 'approved' ? <CheckCircle2 className="w-5 h-5" /> : step.step_order}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{step.step_name}</p>
                        <p className="text-xs text-slate-400">{step.approver_role || 'No assignee'}</p>
                      </div>
                      {statusBadge(step.status)}
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-400 text-center py-4">No approval steps defined</p>}
            </CardContent>
          </Card>

          {/* Field Observations Card */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-violet-600" /> Field Observations ({data.fieldObservations.length})
            </CardTitle></CardHeader>
            <CardContent>
              {data.fieldObservations.length > 0 ? (
                <div className="divide-y">
                  {data.fieldObservations.map(o => (
                    <div key={o.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-slate-50 -mx-2 px-2 rounded cursor-pointer transition-colors" onClick={() => openDetail?.('observation', o)}>
                      <div>
                        <p className="text-sm font-medium">{o.title}</p>
                        <p className="text-xs text-slate-400">{fmt(o.observation_type)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusBadge(o.status)}
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-400 text-center py-4">No observations yet</p>}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info Card */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail?.('client', data.client)}>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Client</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                  {data.client?.client_type === 'company' ? (data.client?.company_name?.[0] || 'C') : `${data.client?.first_name?.[0] || ''}${data.client?.last_name?.[0] || ''}`}
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-700 hover:text-emerald-800">{clientName}</p>
                  <p className="text-xs text-slate-400 font-mono">{data.client?.client_ref}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-300 ml-auto" />
              </div>
            </CardContent>
          </Card>

          {/* Location Card */}
          {(data.latitude && data.longitude) ? (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPinned className="w-4 h-4 text-emerald-600" /> Project Location
              </CardTitle></CardHeader>
              <CardContent>
                <DetailMap latitude={data.latitude!} longitude={data.longitude!} name={data.title} type="project" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" /> Location
              </CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.district && <DetailField label="District" value={data.district} />}
                  {(data as any).sub_county && <DetailField label="Sub County" value={(data as any).sub_county} />}
                  {data.area_hectares && <DetailField label="Area" value={`${data.area_hectares} ha`} />}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline Card */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-500" /> Timeline
            </CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <DetailField label="Created" value={new Date(data.created_at).toLocaleDateString()} />
                {data.due_date && <DetailField label="Due" value={new Date(data.due_date).toLocaleDateString()} />}
                {(data as any).completed_at && <DetailField label="Completed" value={new Date((data as any).completed_at).toLocaleDateString()} />}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// WORKFLOW DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function WorkflowDetailPage({ data }: any) {
  if (!data) return null
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Workflow Steps</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.steps?.map((step: any, idx: number) => (
                <div key={step.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors relative">
                  {idx < (data.steps?.length || 0) - 1 && (
                    <div className="absolute left-[31px] top-[60px] w-0.5 h-[calc(100%-24px)] bg-slate-200" />
                  )}
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold shrink-0">{step.step_order}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{step.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{step.step_type}</Badge>
                      {step.sla_hours && <span className="text-xs text-slate-400"><Clock3 className="w-3 h-3 inline mr-1" />{step.sla_hours}h SLA</span>}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{step.assignee_id || 'Unassigned'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <DetailField label="Name" value={data.name} />
            <DetailField label="Version" value={`v${data.version}`} />
            <DetailField label="Trigger" value={fmt(data.trigger_type)} />
            <DetailField label="Status" value={data.is_active ? <Badge className="bg-emerald-100 text-emerald-800">Active</Badge> : <Badge className="bg-slate-100 text-slate-600">Inactive</Badge>} />
            {data.description && <DetailField label="Description" value={data.description} />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// OBSERVATION DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function ObservationDetailPage({ data }: any) {
  if (!data) return null
  const hasCoords = data.latitude && data.longitude && !isNaN(Number(data.latitude)) && !isNaN(Number(data.longitude))
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {hasCoords && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" /> Observation Location
            </CardTitle></CardHeader>
            <CardContent>
              <DetailMap latitude={data.latitude} longitude={data.longitude} name={data.title} type="observation" />
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Observation Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DetailField label="Title" value={data.title} />
              <DetailField label="Type" value={fmt(data.observation_type)} />
              <DetailField label="Status" value={statusBadge(data.status)} />
              <DetailField label="Latitude" value={<span className="font-mono">{Number(data.latitude).toFixed(6)}</span>} />
              <DetailField label="Longitude" value={<span className="font-mono">{Number(data.longitude).toFixed(6)}</span>} />
              <DetailField label="Accuracy" value={data.accuracy_meters ? `${Number(data.accuracy_meters)}m` : '—'} />
              <DetailField label="Altitude" value={data.altitude_meters ? `${Number(data.altitude_meters)}m` : '—'} />
              <DetailField label="Observer" value={data.observer_id || '—'} />
              <DetailField label="Synced" value={data.synced_at ? new Date(data.synced_at).toLocaleString() : '—'} />
            </div>
          </CardContent>
        </Card>
        {data.description && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Description</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-slate-600 whitespace-pre-wrap">{data.description}</p></CardContent>
          </Card>
        )}
        {data.form_data && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Form Data</CardTitle></CardHeader>
            <CardContent><pre className="text-xs bg-slate-50 p-4 rounded-xl overflow-auto">{JSON.stringify(data.form_data, null, 2)}</pre></CardContent>
          </Card>
        )}
      </div>
      <div>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Quick Info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <DetailField label="Status" value={statusBadge(data.status)} />
            <DetailField label="Sync ID" value={data.sync_id ? <span className="font-mono text-xs">{data.sync_id}</span> : '—'} />
            <DetailField label="Created" value={new Date(data.created_at).toLocaleString()} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// SYNC DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function SyncDetailPage({ data }: any) {
  if (!data) return null
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Sync Details</CardTitle></CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
      {data.error_message && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Error
          </CardTitle></CardHeader>
          <CardContent><pre className="text-xs bg-red-50 p-4 rounded-xl text-red-700 whitespace-pre-wrap">{data.error_message}</pre></CardContent>
        </Card>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// AI MODEL DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function AIModelDetailPage({ data }: any) {
  if (!data) return null
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Model Configuration</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DetailField label="Provider" value={data.provider} />
              <DetailField label="Model Name" value={<span className="font-mono text-xs">{data.model_name}</span>} />
              <DetailField label="Status" value={data.is_active ? <Badge className="bg-emerald-100 text-emerald-800">Active</Badge> : <Badge className="bg-slate-100 text-slate-600">Inactive</Badge>} />
              <DetailField label="Cost / 1K Input" value={data.cost_per_1k_input ? `$${Number(data.cost_per_1k_input).toFixed(4)}` : '—'} />
              <DetailField label="Cost / 1K Output" value={data.cost_per_1k_output ? `$${Number(data.cost_per_1k_output).toFixed(4)}` : '—'} />
              <DetailField label="Max Tokens" value={data.max_tokens?.toLocaleString() || '—'} />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
            <Cpu className="w-8 h-8 text-violet-600" />
          </div>
          <p className="font-semibold">{data.display_name}</p>
          <p className="text-xs text-slate-400 font-mono mt-1">{data.id}</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// INVOICE DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function InvoiceDetailPage({ data, onRefresh }: { data: any; onRefresh: () => void }) {
  const [actionLoading, setActionLoading] = useState(false)
  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true)
    try { await patchRecord(`/api/invoices/${data.id}`, { status: newStatus }); onRefresh() }
    catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Invoice Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DetailField label="Invoice Number" value={<span className="font-mono font-bold">{data.invoice_number}</span>} />
              <DetailField label="Total Amount" value={<span className="text-lg font-bold">UGX {Number(data.total_amount).toLocaleString()}</span>} />
              <DetailField label="Status" value={statusBadge(data.status)} />
              <DetailField label="Client" value={data.client?.company_name || `${data.client?.first_name} ${data.client?.last_name}`} />
              <DetailField label="Issue Date" value={data.issued_at ? new Date(data.issued_at).toLocaleDateString() : data.created_at ? new Date(data.created_at).toLocaleDateString() : '—'} />
              <DetailField label="Due Date" value={data.due_date ? new Date(data.due_date).toLocaleDateString() : '—'} />
            </div>
          </CardContent>
        </Card>
        {data.line_items && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Line Items</CardTitle></CardHeader>
            <CardContent><pre className="text-xs bg-slate-50 p-4 rounded-xl overflow-auto">{JSON.stringify(data.line_items, null, 2)}</pre></CardContent>
          </Card>
        )}
      </div>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Receipt className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
            <p className="text-2xl font-bold">UGX {Number(data.total_amount).toLocaleString()}</p>
            {statusBadge(data.status)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {['draft', 'sent', 'pending', 'paid', 'cancelled'].map(s => (
              <Button key={s} variant="outline" size="sm" className="w-full text-xs justify-start h-8" disabled={actionLoading} onClick={() => handleStatusChange(s)}>
                Mark as {fmt(s)}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// QUOTATION DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function QuotationDetailPage({ data }: any) {
  if (!data) return null
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Quotation Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DetailField label="Quote Number" value={<span className="font-mono font-bold">{data.quote_number}</span>} />
              <DetailField label="Total Amount" value={<span className="text-lg font-bold">UGX {Number(data.amount || data.total_amount || 0).toLocaleString()}</span>} />
              <DetailField label="Status" value={statusBadge(data.status)} />
              <DetailField label="Client" value={data.client?.company_name || `${data.client?.first_name} ${data.client?.last_name}`} />
              <DetailField label="Valid Until" value={data.valid_until ? new Date(data.valid_until).toLocaleDateString() : '—'} />
              <DetailField label="Created" value={new Date(data.created_at).toLocaleDateString()} />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-6 text-center">
          <DollarSign className="w-10 h-10 text-blue-600 mx-auto mb-3" />
          <p className="text-2xl font-bold">UGX {Number(data.amount || data.total_amount || 0).toLocaleString()}</p>
          {statusBadge(data.status)}
        </CardContent>
      </Card>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// DOCUMENT DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function DocumentDetailPage({ data, onRefresh }: { data: any; onRefresh: () => void }) {
  const [actionLoading, setActionLoading] = useState(false)
  const handleVerify = async () => {
    setActionLoading(true)
    try { await patchRecord(`/api/documents/${data.id}`, { is_verified: true }); onRefresh() }
    catch (e) { console.error(e) } finally { setActionLoading(false) }
  }
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return
    setActionLoading(true)
    try { await deleteRecord(`/api/documents/${data.id}`); onRefresh() }
    catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Document Information</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DetailField label="Title" value={<span className="font-semibold">{data.title}</span>} />
              <DetailField label="Document Type" value={fmt(data.document_type)} />
              <DetailField label="Verification" value={data.is_verified ? <Badge className="bg-emerald-100 text-emerald-800">Verified</Badge> : <Badge className="bg-amber-100 text-amber-800">Unverified</Badge>} />
              <DetailField label="Client" value={data.client?.company_name || `${data.client?.first_name} ${data.client?.last_name}`} />
              <DetailField label="MIME Type" value={<span className="font-mono text-xs">{data.mime_type}</span>} />
              <DetailField label="File Size" value={data.file_size ? `${(Number(data.file_size) / 1024).toFixed(1)} KB` : '—'} />
              <DetailField label="File Path" value={<span className="font-mono text-xs break-all">{data.file_path}</span>} />
              <DetailField label="Uploaded By" value={data.uploaded_by || '—'} />
              <DetailField label="Created" value={new Date(data.created_at).toLocaleString()} />
            </div>
          </CardContent>
        </Card>
        {data.description && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Description</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-slate-600 whitespace-pre-wrap">{data.description}</p></CardContent>
          </Card>
        )}
      </div>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-10 h-10 text-amber-600 mx-auto mb-3" />
            <p className="font-semibold">{data.title}</p>
            {data.is_verified ? <Badge className="bg-emerald-100 text-emerald-800 mt-2">Verified</Badge> : <Badge className="bg-amber-100 text-amber-800 mt-2">Unverified</Badge>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {!data.is_verified && (
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading} onClick={handleVerify}>
                <Eye className="w-4 h-4 mr-2" /> Verify Document
              </Button>
            )}
            <Button variant="destructive" size="sm" className="w-full" disabled={actionLoading} onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Document
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// COMMUNICATION DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function CommunicationDetailPage({ data, onRefresh }: { data: any; onRefresh: () => void }) {
  const [actionLoading, setActionLoading] = useState(false)
  const handleMarkDelivered = async () => {
    setActionLoading(true)
    try { await patchRecord(`/api/communications/${data.id}`, { status: 'delivered' }); onRefresh() }
    catch (e) { console.error(e) } finally { setActionLoading(false) }
  }
  const handleMarkRead = async () => {
    setActionLoading(true)
    try { await patchRecord(`/api/communications/${data.id}`, { status: 'delivered' }); onRefresh() }
    catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Message Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DetailField label="Subject" value={data.subject || 'No Subject'} />
              <DetailField label="Channel" value={fmt(data.channel)} />
              <DetailField label="Direction" value={<Badge className={data.direction === 'outbound' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}>{fmt(data.direction)}</Badge>} />
              <DetailField label="Client" value={data.client?.company_name || `${data.client?.first_name} ${data.client?.last_name}`} />
              <DetailField label="Status" value={statusBadge(data.status)} />
              <DetailField label="Sent At" value={data.sent_at ? new Date(data.sent_at).toLocaleString() : '—'} />
            </div>
          </CardContent>
        </Card>
        {data.body && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Message Body</CardTitle></CardHeader>
            <CardContent><div className="text-sm bg-slate-50 p-6 rounded-xl max-h-96 overflow-y-auto whitespace-pre-wrap">{data.body}</div></CardContent>
          </Card>
        )}
      </div>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-10 h-10 text-violet-600 mx-auto mb-3" />
            <p className="font-semibold">{fmt(data.channel)}</p>
            {statusBadge(data.status)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.status === 'queued' && (
              <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled={actionLoading} onClick={handleMarkRead}>
                <Send className="w-4 h-4 mr-2" /> Send Message
              </Button>
            )}
            {data.status === 'sent' && (
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading} onClick={handleMarkDelivered}>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Delivered
              </Button>
            )}
            {(data.status === 'pending' || data.status === 'received') && (
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading} onClick={handleMarkRead}>
                <Eye className="w-4 h-4 mr-2" /> Mark Read
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// APPROVAL DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function ApprovalDetailPage({ data, onRefresh }: { data: any; onRefresh: () => void }) {
  const [actionLoading, setActionLoading] = useState(false)
  const handleApprove = async () => {
    setActionLoading(true)
    try { await patchRecord(`/api/approvals/${data.id}`, { status: 'approved', approved_by: 'current_user' }); onRefresh() }
    catch (e) { console.error(e) } finally { setActionLoading(false) }
  }
  const handleDefer = async () => {
    setActionLoading(true)
    try { await patchRecord(`/api/approvals/${data.id}`, { status: 'deferred' }); onRefresh() }
    catch (e) { console.error(e) } finally { setActionLoading(false) }
  }
  const handleReject = async () => {
    setActionLoading(true)
    try { await patchRecord(`/api/approvals/${data.id}`, { status: 'rejected' }); onRefresh() }
    catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Approval Step Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DetailField label="Step Name" value={<span className="font-semibold">{fmt(data.step_name)}</span>} />
              <DetailField label="Order" value={`Step ${data.step_order}`} />
              <DetailField label="Status" value={statusBadge(data.status)} />
              <DetailField label="Approver Role" value={data.approver_role || '—'} />
              <DetailField label="Assigned To" value={data.assigned_to || '—'} />
              <DetailField label="Project" value={data.surveyProject?.title || '—'} />
              {data.approved_by && <DetailField label="Approved By" value={data.approved_by} />}
              {data.approved_at && <DetailField label="Approved At" value={new Date(data.approved_at).toLocaleString()} />}
              {data.notes && <div className="col-span-2 md:col-span-3"><DetailField label="Notes" value={data.notes} /></div>}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <ShieldCheck className="w-10 h-10 text-amber-600 mx-auto mb-3" />
            <p className="font-semibold">{fmt(data.step_name)}</p>
            {statusBadge(data.status)}
          </CardContent>
        </Card>
        {data.status === 'pending' && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading} onClick={handleApprove}>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
              </Button>
              <Button variant="outline" className="w-full" disabled={actionLoading} onClick={handleDefer}>
                <Clock3 className="w-4 h-4 mr-2" /> Defer
              </Button>
              <Button variant="destructive" className="w-full" disabled={actionLoading} onClick={handleReject}>
                <X className="w-4 h-4 mr-2" /> Reject
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// DOMAIN EVENT DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function DomainEventDetailPage({ data }: any) {
  if (!data) return null
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Event Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DetailField label="Event Type" value={<span className="font-semibold">{fmt(data.event_type)}</span>} />
              <DetailField label="Aggregate" value={fmt(data.aggregate)} />
              <DetailField label="Aggregate ID" value={<span className="font-mono text-xs">{data.aggregate_id}</span>} />
              <DetailField label="Created" value={new Date(data.created_at).toLocaleString()} />
            </div>
          </CardContent>
        </Card>
        {data.payload && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Payload</CardTitle></CardHeader>
            <CardContent><pre className="text-xs bg-slate-50 p-4 rounded-xl overflow-auto max-h-96">{JSON.stringify(data.payload, null, 2)}</pre></CardContent>
          </Card>
        )}
      </div>
      <Card>
        <CardContent className="p-6 text-center">
          <ScrollText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="font-semibold">{fmt(data.event_type)}</p>
          <p className="text-xs text-slate-400 mt-1">{fmt(data.aggregate)}</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ORGANIZATION DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function OrganizationDetailPage({ data }: any) {
  if (!data) return null
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Organization Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DetailField label="Name" value={<span className="font-semibold">{data.name}</span>} />
              <DetailField label="Slug" value={<span className="font-mono">{data.slug}</span>} />
              <DetailField label="Status" value={data.is_active ? <Badge className="bg-emerald-100 text-emerald-800">Active</Badge> : <Badge className="bg-slate-100 text-slate-600">Inactive</Badge>} />
              <DetailField label="Clients" value={data._count?.clients ?? '—'} />
              <DetailField label="Workflows" value={data._count?.workflowDefinitions ?? '—'} />
              <DetailField label="Created" value={new Date(data.created_at).toLocaleDateString()} />
            </div>
          </CardContent>
        </Card>
        {data.branches && data.branches.length > 0 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Branches ({data.branches.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="divide-y">
                {data.branches.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${b.is_head_office ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {b.is_head_office ? 'HQ' : b.slug?.[0]?.toUpperCase() || 'B'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{b.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{b.slug}</p>
                      </div>
                    </div>
                    {b.is_active ? <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Active</Badge> : <Badge className="bg-slate-100 text-slate-600 text-[10px]">Inactive</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Card>
        <CardContent className="p-6 text-center">
          <Building2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <p className="font-semibold">{data.name}</p>
          <p className="text-xs text-slate-400 font-mono mt-1">{data.slug}</p>
          {data.settings && (
            <div className="mt-4 text-left space-y-1">
              {data.settings.country && <p className="text-xs text-slate-500">Country: {data.settings.country}</p>}
              {data.settings.currency && <p className="text-xs text-slate-500">Currency: {data.settings.currency}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
