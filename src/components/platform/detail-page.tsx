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
  CreditCard, Clock, User, ExternalLink, Copy, Plus,
  Zap, Workflow, FileCheck, ArrowUpRight, ArrowDownLeft,
  Database, Upload, Download, Settings, Timer, CircleDot,
  ListChecks, RefreshCw, Ban, Pause, ChevronRight,
  Tag, Sparkles, Link2, Hash, Check, Shield, Paperclip,
  ArrowLeftRight, CircleCheck, CircleX, MessageCircle,
} from 'lucide-react'
import { fmt, statusBadge, PRIORITY_BADGE, formatUGX, STATUS_BADGE, UGANDA_DISTRICTS } from './constants'
import { DetailField } from './helpers'
import type { ClientRecord, ProjectRecord, PageId } from './types'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

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
  documentsData?: any
  commsData?: any
}

export function DetailPage({ type, data, onBack, onRefresh, onNavigate, openDetail, clients, projects, documentsData, commsData }: DetailPageProps) {
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

      {type === 'client' && <ClientDetailPage data={data} onRefresh={onRefresh} openDetail={openDetail} onNavigate={onNavigate} documentsData={documentsData} commsData={commsData} />}
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

function ClientDetailPage({ data, onRefresh, openDetail, onNavigate, documentsData, commsData }: {
  data: ClientRecord; onRefresh: () => void; openDetail?: (type: string, data: any) => void; onNavigate?: (page: PageId) => void
  documentsData?: any; commsData?: any
}) {
  const [actionLoading, setActionLoading] = useState(false)
  const [copiedRef, setCopiedRef] = useState(false)
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showDocumentDialog, setShowDocumentDialog] = useState(false)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const clientName = data.client_type === 'company' ? data.company_name : `${data.first_name} ${data.last_name}`

  // ── Inline Create: Project ──
  const [projectForm, setProjectForm] = useState({ title: '', project_type: 'cadastral', district: data.district || '', priority: 'normal', status: 'intake' })
  const [projectErrors, setProjectErrors] = useState<Record<string, string>>({})
  const [projectLoading, setProjectLoading] = useState(false)

  const handleCreateProject = async () => {
    const errs: Record<string, string> = {}
    if (!projectForm.title.trim()) errs.title = 'Project title is required'
    setProjectErrors(errs)
    if (Object.keys(errs).length > 0) return
    setProjectLoading(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...projectForm, client_id: data.id }),
      })
      if (res.ok) {
        setShowProjectDialog(false)
        setProjectForm({ title: '', project_type: 'cadastral', district: data.district || '', priority: 'normal', status: 'intake' })
        setProjectErrors({})
        onRefresh()
        toast.success('Project created successfully')
      } else {
        toast.error('Failed to create project')
      }
    } catch { toast.error('Failed to create project') }
    finally { setProjectLoading(false) }
  }

  // ── Inline Create: Invoice ──
  const [invoiceForm, setInvoiceForm] = useState({ amount: '', tax_amount: '', status: 'draft', due_date: '' })
  const [invoiceErrors, setInvoiceErrors] = useState<Record<string, string>>({})
  const [invoiceLoading, setInvoiceLoading] = useState(false)

  const handleCreateInvoice = async () => {
    const errs: Record<string, string> = {}
    if (!invoiceForm.amount || parseFloat(invoiceForm.amount) <= 0) errs.amount = 'Enter a valid amount'
    setInvoiceErrors(errs)
    if (Object.keys(errs).length > 0) return
    setInvoiceLoading(true)
    try {
      const amount = Number(invoiceForm.amount)
      const taxAmount = invoiceForm.tax_amount ? Number(invoiceForm.tax_amount) : 0
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: data.id, invoice_number: invoiceNumber, amount, tax_amount: taxAmount, total_amount: amount + taxAmount, status: invoiceForm.status, due_date: invoiceForm.due_date || null }),
      })
      if (res.ok) {
        setShowInvoiceDialog(false)
        setInvoiceForm({ amount: '', tax_amount: '', status: 'draft', due_date: '' })
        setInvoiceErrors({})
        onRefresh()
        toast.success('Invoice created successfully')
      } else { toast.error('Failed to create invoice') }
    } catch { toast.error('Failed to create invoice') }
    finally { setInvoiceLoading(false) }
  }

  // ── Inline Create: Document ──
  const [docForm, setDocForm] = useState({ title: '', document_type: 'survey_report', description: '' })
  const [docErrors, setDocErrors] = useState<Record<string, string>>({})
  const [docLoading, setDocLoading] = useState(false)

  const handleCreateDocument = async () => {
    const errs: Record<string, string> = {}
    if (!docForm.title.trim()) errs.title = 'Document title is required'
    setDocErrors(errs)
    if (Object.keys(errs).length > 0) return
    setDocLoading(true)
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...docForm, client_id: data.id }),
      })
      if (res.ok) {
        setShowDocumentDialog(false)
        setDocForm({ title: '', document_type: 'survey_report', description: '' })
        setDocErrors({})
        onRefresh()
        toast.success('Document created successfully')
      } else { toast.error('Failed to create document') }
    } catch { toast.error('Failed to create document') }
    finally { setDocLoading(false) }
  }

  // ── Inline Create: Message ──
  const [msgForm, setMsgForm] = useState({ subject: '', body: '', channel: 'sms', direction: 'outbound' })
  const [msgErrors, setMsgErrors] = useState<Record<string, string>>({})
  const [msgLoading, setMsgLoading] = useState(false)

  const handleCreateMessage = async () => {
    const errs: Record<string, string> = {}
    if (!msgForm.body.trim()) errs.body = 'Message body is required'
    setMsgErrors(errs)
    if (Object.keys(errs).length > 0) return
    setMsgLoading(true)
    try {
      const res = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...msgForm, client_id: data.id }),
      })
      if (res.ok) {
        setShowMessageDialog(false)
        setMsgForm({ subject: '', body: '', channel: 'sms', direction: 'outbound' })
        setMsgErrors({})
        onRefresh()
        toast.success('Message sent successfully')
      } else { toast.error('Failed to send message') }
    } catch { toast.error('Failed to send message') }
    finally { setMsgLoading(false) }
  }

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

  // Filter documents and communications for this client
  const clientDocs = documentsData?.documents?.filter((d: any) => d.client_id === data.id) || []
  const clientComms = commsData?.communications?.filter((c: any) => c.client_id === data.id) || []

  const invoiceTotalPreview = (parseFloat(invoiceForm.amount) || 0) + (parseFloat(invoiceForm.tax_amount) || 0)

  return (
    <div>
      {/* ── Hero Header ── */}
      <div className="relative mb-8">
        <div className="h-36 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl shadow-lg" />
        <div className="absolute bottom-0 left-0 right-0 px-6 translate-y-1/2">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="w-22 h-22 rounded-2xl bg-white shadow-xl flex items-center justify-center text-3xl font-bold text-emerald-700 border-4 border-white" style={{ width: '88px', height: '88px' }}>
                {data.client_type === 'company' ? (data.company_name?.[0] || 'C') : `${data.first_name?.[0] || ''}${data.last_name?.[0] || ''}`}
              </div>
              <div className="pb-2">
                <h2 className="text-2xl font-bold text-slate-900">{clientName}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {statusBadge(data.status)}
                  <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm">{data.client_type === 'company' ? 'Company' : 'Individual'}</Badge>
                  <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 font-mono bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md transition-colors" onClick={copyRef}>
                    {data.client_ref} <Copy className="w-3 h-3" />
                  </button>
                  {copiedRef && <span className="text-[10px] text-emerald-600 font-medium">Copied!</span>}
                  {data.email && <a href={`mailto:${data.email}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md transition-colors"><Mail className="w-3 h-3" />{data.email}</a>}
                  {data.phone && <a href={`tel:${data.phone}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md transition-colors"><Phone className="w-3 h-3" />{data.phone}</a>}
                </div>
              </div>
            </div>
            <div className="pb-2 flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 bg-white/95 backdrop-blur-sm shadow-sm" disabled={actionLoading}>
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

      <div className="h-12" />

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Active Projects', value: activeProjects, icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Total Projects', value: data._count.surveyProjects, icon: GitBranch, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Invoices', value: data.invoices.length, icon: Receipt, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Documents', value: data._count.documents, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Messages', value: data._count.communications, icon: MessageSquare, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
        ].map(s => (
          <Card key={s.label} className={`hover:shadow-md transition-all cursor-pointer border ${s.border}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
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
                    <div className="divide-y divide-slate-100">
                      {data.surveyProjects.slice(0, 5).map(p => (
                        <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-slate-50/80 -mx-2 px-2 rounded-lg transition-colors cursor-pointer" onClick={() => openDetail?.('project', p)}>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
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
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No location data</p>
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

              {/* Quick Create Card - BEAUTIFIED */}
              <Card className="border-emerald-100 bg-gradient-to-b from-emerald-50/50 to-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-600" /> Quick Create
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="h-auto py-2.5 flex flex-col items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowProjectDialog(true)}>
                    <MapPin className="w-4 h-4" />
                    <span className="text-[11px] font-medium">New Project</span>
                  </Button>
                  <Button size="sm" className="h-auto py-2.5 flex flex-col items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowInvoiceDialog(true)}>
                    <Receipt className="w-4 h-4" />
                    <span className="text-[11px] font-medium">New Invoice</span>
                  </Button>
                  <Button size="sm" className="h-auto py-2.5 flex flex-col items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setShowDocumentDialog(true)}>
                    <FileText className="w-4 h-4" />
                    <span className="text-[11px] font-medium">New Document</span>
                  </Button>
                  <Button size="sm" className="h-auto py-2.5 flex flex-col items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setShowMessageDialog(true)}>
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-[11px] font-medium">New Message</span>
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
                  <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowProjectDialog(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> New Project
                  </Button>
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
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-blue-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">No projects yet</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Create a survey project for this client</p>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowProjectDialog(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> New Project
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
              <Card className="border-emerald-100"><CardContent className="p-4 text-center">
                <p className="text-xs text-emerald-500 uppercase font-medium">Total Invoiced</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">{formatUGX(totalInvoiced)}</p>
              </CardContent></Card>
              <Card className="border-blue-100"><CardContent className="p-4 text-center">
                <p className="text-xs text-blue-500 uppercase font-medium">Collected</p>
                <p className="text-xl font-bold text-blue-700 mt-1">{formatUGX(totalPaid)}</p>
              </CardContent></Card>
              <Card className="border-amber-100"><CardContent className="p-4 text-center">
                <p className="text-xs text-amber-500 uppercase font-medium">Outstanding</p>
                <p className="text-xl font-bold text-amber-700 mt-1">{formatUGX(totalOutstanding)}</p>
              </CardContent></Card>
            </div>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Invoices ({data.invoices.length})</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onNavigate?.('finance')}>
                      View in Finance <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                    <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowInvoiceDialog(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> New Invoice
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {data.invoices.length > 0 ? (
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
                ) : (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                      <Receipt className="w-8 h-8 text-emerald-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">No invoices yet</p>
                    <p className="text-xs text-slate-400 mt-1 mb-4">Create an invoice for this client</p>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowInvoiceDialog(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> New Invoice
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Documents Tab ── */}
        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" /> Documents ({clientDocs.length || data._count.documents})
                </CardTitle>
                <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setShowDocumentDialog(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> New Document
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {clientDocs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Verified</TableHead>
                      <TableHead className="text-xs">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientDocs.map((d: any) => (
                      <TableRow key={d.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openDetail?.('document', d)}>
                        <TableCell className="text-sm font-medium">{d.title}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{fmt(d.document_type)}</Badge></TableCell>
                        <TableCell>{d.is_verified ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Clock3 className="w-4 h-4 text-amber-400" />}</TableCell>
                        <TableCell className="text-xs text-slate-400">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-amber-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">No documents yet</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Upload a document for this client</p>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setShowDocumentDialog(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> New Document
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Communications Tab ── */}
        <TabsContent value="communications" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-violet-600" /> Messages ({clientComms.length || data._count.communications})
                </CardTitle>
                <Button size="sm" className="h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setShowMessageDialog(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> New Message
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {clientComms.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Subject</TableHead>
                      <TableHead className="text-xs">Channel</TableHead>
                      <TableHead className="text-xs">Direction</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientComms.map((c: any) => (
                      <TableRow key={c.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openDetail?.('communication', c)}>
                        <TableCell className="text-sm font-medium">{c.subject || '(No Subject)'}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] capitalize">{c.channel}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] capitalize">{c.direction}</Badge></TableCell>
                        <TableCell>{statusBadge(c.status)}</TableCell>
                        <TableCell className="text-xs text-slate-400">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-violet-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">No messages yet</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Send a message to this client</p>
                  <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setShowMessageDialog(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> New Message
                  </Button>
                </div>
              )}
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
                <div className="divide-y divide-slate-100">
                  {data.surveyProjects.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer" onClick={() => openDetail?.('project', p)}>
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
                <Activity className="w-4 h-4 text-slate-600" /> Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline clientName={clientName} projects={data.surveyProjects} invoices={data.invoices} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Inline Create Sheet: Project ── */}
      <Sheet open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><MapPin className="w-4 h-4 text-blue-600" /></div>
              New Project for {clientName}
            </SheetTitle>
            <SheetDescription>Create a survey project linked to this client.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <Label className="text-xs">Project Title <span className="text-red-500">*</span></Label>
              <Input className={`h-9 text-sm ${projectErrors.title ? 'border-red-300' : ''}`} placeholder="e.g. Land Survey - Kampala Block 234" value={projectForm.title} onChange={e => setProjectForm({ ...projectForm, title: e.target.value })} />
              {projectErrors.title && <p className="text-[10px] text-red-500">{projectErrors.title}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Project Type</Label>
                <Select value={projectForm.project_type} onValueChange={v => setProjectForm({ ...projectForm, project_type: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cadastral">Cadastral</SelectItem>
                    <SelectItem value="topographic">Topographic</SelectItem>
                    <SelectItem value="boundary">Boundary</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="hydrographic">Hydrographic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Priority</Label>
                <Select value={projectForm.priority} onValueChange={v => setProjectForm({ ...projectForm, priority: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">District</Label>
              <Input className="h-9 text-sm" value={projectForm.district} onChange={e => setProjectForm({ ...projectForm, district: e.target.value })} placeholder="District" />
            </div>
          </div>
          <SheetFooter>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateProject} disabled={projectLoading}>
              {projectLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Inline Create Sheet: Invoice ── */}
      <Sheet open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Receipt className="w-4 h-4 text-emerald-600" /></div>
              New Invoice for {clientName}
            </SheetTitle>
            <SheetDescription>Create an invoice for this client.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Base Amount (UGX) <span className="text-red-500">*</span></Label>
                <Input type="number" className={`h-9 text-sm ${invoiceErrors.amount ? 'border-red-300' : ''}`} placeholder="0" value={invoiceForm.amount} onChange={e => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} />
                {invoiceErrors.amount && <p className="text-[10px] text-red-500">{invoiceErrors.amount}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Tax Amount (UGX)</Label>
                <Input type="number" className="h-9 text-sm" placeholder="0" value={invoiceForm.tax_amount} onChange={e => setInvoiceForm({ ...invoiceForm, tax_amount: e.target.value })} />
              </div>
            </div>
            {invoiceTotalPreview > 0 && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-700">Total</span>
                <span className="text-sm font-bold text-emerald-800">UGX {invoiceTotalPreview.toLocaleString()}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={invoiceForm.status} onValueChange={v => setInvoiceForm({ ...invoiceForm, status: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Due Date</Label>
                <Input type="date" className="h-9 text-sm" value={invoiceForm.due_date} onChange={e => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} />
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreateInvoice} disabled={invoiceLoading || !invoiceForm.amount}>
              {invoiceLoading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Inline Create Sheet: Document ── */}
      <Sheet open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><FileText className="w-4 h-4 text-amber-600" /></div>
              New Document for {clientName}
            </SheetTitle>
            <SheetDescription>Register a document for this client.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <Label className="text-xs">Document Title <span className="text-red-500">*</span></Label>
              <Input className={`h-9 text-sm ${docErrors.title ? 'border-red-300' : ''}`} placeholder="e.g. Land Title - Kampala" value={docForm.title} onChange={e => setDocForm({ ...docForm, title: e.target.value })} />
              {docErrors.title && <p className="text-[10px] text-red-500">{docErrors.title}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Document Type</Label>
              <Select value={docForm.document_type} onValueChange={v => setDocForm({ ...docForm, document_type: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="survey_report">Survey Report</SelectItem>
                  <SelectItem value="land_title">Land Title</SelectItem>
                  <SelectItem value="agreement">Agreement</SelectItem>
                  <SelectItem value="id_copy">ID Copy</SelectItem>
                  <SelectItem value="correspondence">Correspondence</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea className="text-sm" rows={2} value={docForm.description} onChange={e => setDocForm({ ...docForm, description: e.target.value })} placeholder="Optional description..." />
            </div>
          </div>
          <SheetFooter>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleCreateDocument} disabled={docLoading}>
              {docLoading ? 'Creating...' : 'Create Document'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Inline Create Sheet: Message ── */}
      <Sheet open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-violet-600" /></div>
              New Message to {clientName}
            </SheetTitle>
            <SheetDescription>Send a message to this client.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Channel</Label>
                <Select value={msgForm.channel} onValueChange={v => setMsgForm({ ...msgForm, channel: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="call">Phone Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Direction</Label>
                <Select value={msgForm.direction} onValueChange={v => setMsgForm({ ...msgForm, direction: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Subject</Label>
              <Input className="h-9 text-sm" placeholder="Optional subject" value={msgForm.subject} onChange={e => setMsgForm({ ...msgForm, subject: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Message <span className="text-red-500">*</span></Label>
              <Textarea className={`text-sm ${msgErrors.body ? 'border-red-300' : ''}`} rows={4} placeholder="Type your message..." value={msgForm.body} onChange={e => setMsgForm({ ...msgForm, body: e.target.value })} />
              {msgErrors.body && <p className="text-[10px] text-red-500">{msgErrors.body}</p>}
            </div>
          </div>
          <SheetFooter>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleCreateMessage} disabled={msgLoading}>
              {msgLoading ? 'Sending...' : 'Send Message'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
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
  const handleFieldSave = async (field: string, value: string) => {
    try { await patchRecord(`/api/workflows/${data.id}`, { [field]: value }) } catch (e) { console.error(e) }
  }
  const stepTypeColors: Record<string, string> = {
    approval: 'border-amber-400 bg-amber-50 text-amber-700',
    notification: 'border-blue-400 bg-blue-50 text-blue-700',
    action: 'border-emerald-400 bg-emerald-50 text-emerald-700',
    review: 'border-violet-400 bg-violet-50 text-violet-700',
  }
  const stepTypeBadgeColors: Record<string, string> = {
    approval: 'bg-amber-100 text-amber-800',
    notification: 'bg-blue-100 text-blue-800',
    action: 'bg-emerald-100 text-emerald-800',
    review: 'bg-violet-100 text-violet-800',
  }

  return (
    <div>
      {/* ── Hero Header ── */}
      <div className="relative mb-8">
        <div className="h-28 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-2xl shadow-lg" />
        <div className="absolute bottom-0 left-0 right-0 px-6 translate-y-1/2">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                <GitBranch className="w-7 h-7 text-orange-600" />
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">{data.name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {data.is_active ? <Badge className="bg-emerald-100 text-emerald-800">Active</Badge> : <Badge className="bg-slate-100 text-slate-600">Inactive</Badge>}
                  <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm">
                    <Zap className="w-3 h-3 mr-1" />{fmt(data.trigger_type)}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm font-mono">v{data.version}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-10" />

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Steps', value: data.steps?.length || 0, icon: ListChecks, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
          { label: 'Approval Steps', value: data.steps?.filter((s: any) => s.step_type === 'approval').length || 0, icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Trigger', value: fmt(data.trigger_type), icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Status', value: data.is_active ? 'Active' : 'Inactive', icon: Activity, color: data.is_active ? 'text-emerald-600' : 'text-slate-500', bg: data.is_active ? 'bg-emerald-50' : 'bg-slate-50', border: data.is_active ? 'border-emerald-100' : 'border-slate-100' },
        ].map(s => (
          <Card key={s.label} className={`hover:shadow-md transition-all border ${s.border}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight">{s.value}</p>
                <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Content with Tabs ── */}
      <Tabs defaultValue="steps" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-0">
          {[
            { value: 'steps', label: `Steps (${data.steps?.length || 0})` },
            { value: 'details', label: 'Details' },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm data-[state=active]:text-orange-700 data-[state=active]:font-semibold text-slate-500"
            >{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        {/* ── Steps Tab ── */}
        <TabsContent value="steps" className="mt-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-orange-600" /> Workflow Steps
            </CardTitle></CardHeader>
            <CardContent>
              {data.steps?.length > 0 ? (
                <div className="space-y-0">
                  {data.steps.map((step: any, idx: number) => (
                    <div key={step.id} className="flex items-start gap-4 relative pb-6">
                      {idx < data.steps.length - 1 && (
                        <div className="absolute left-[19px] top-[40px] w-0.5 h-[calc(100%-16px)] bg-slate-200" />
                      )}
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 ${stepTypeColors[step.step_type] || 'border-slate-300 bg-slate-50 text-slate-600'}`}>
                        {step.step_order}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{step.name}</p>
                          <Badge className={`text-[10px] ${stepTypeBadgeColors[step.step_type] || 'bg-slate-100 text-slate-600'}`}>
                            {fmt(step.step_type)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          {step.sla_hours && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Timer className="w-3 h-3" />{step.sla_hours}h SLA
                            </span>
                          )}
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <User className="w-3 h-3" />{step.assignee_id || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <GitBranch className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No steps defined</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Details Tab ── */}
        <TabsContent value="details" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-orange-600" /> Workflow Configuration
                </CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                    <EditableField label="Name" value={data.name} icon={GitBranch} onSave={v => handleFieldSave('name', v)} />
                    <DetailField label="Version" value={`v${data.version}`} />
                    <EditableField label="Trigger Type" value={data.trigger_type} icon={Zap} onSave={v => handleFieldSave('trigger_type', v)} />
                    <DetailField label="Status" value={data.is_active ? <Badge className="bg-emerald-100 text-emerald-800">Active</Badge> : <Badge className="bg-slate-100 text-slate-600">Inactive</Badge>} />
                    <DetailField label="Created" value={new Date(data.created_at).toLocaleString()} />
                    <DetailField label="Organization" value={data.organization?.name || '—'} />
                  </div>
                </CardContent>
              </Card>
              {data.description && (
                <Card className="mt-6">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Description</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-slate-600 whitespace-pre-wrap">{data.description}</p></CardContent>
                </Card>
              )}
            </div>
            <div>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock3 className="w-4 h-4 text-slate-500" /> Timeline
                </CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <DetailField label="Created" value={new Date(data.created_at).toLocaleString()} />
                  <DetailField label="Updated" value={data.updated_at ? new Date(data.updated_at).toLocaleString() : '—'} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// OBSERVATION DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function ObservationDetailPage({ data }: any) {
  if (!data) return null
  const hasCoords = data.latitude && data.longitude && !isNaN(Number(data.latitude)) && !isNaN(Number(data.longitude))
  const formDataEntries = data.form_data ? (typeof data.form_data === 'object' ? Object.entries(data.form_data) : []) : []

  return (
    <div>
      {/* ── Hero Header ── */}
      <div className="relative mb-8">
        <div className="h-28 bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 rounded-2xl shadow-lg" />
        <div className="absolute bottom-0 left-0 right-0 px-6 translate-y-1/2">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                <Smartphone className="w-7 h-7 text-cyan-600" />
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">{data.title}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {statusBadge(data.status)}
                  <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm">{fmt(data.observation_type)}</Badge>
                  {data.synced_at && <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">Synced</Badge>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-10" />

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Type', value: fmt(data.observation_type), icon: Smartphone, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
          { label: 'Accuracy', value: data.accuracy_meters ? `${Number(data.accuracy_meters)}m` : '—', icon: CircleDot, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
          { label: 'Altitude', value: data.altitude_meters ? `${Number(data.altitude_meters)}m` : '—', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Sync Status', value: data.synced_at ? 'Synced' : 'Pending', icon: RefreshCw, color: data.synced_at ? 'text-emerald-600' : 'text-amber-600', bg: data.synced_at ? 'bg-emerald-50' : 'bg-amber-50', border: data.synced_at ? 'border-emerald-100' : 'border-amber-100' },
        ].map(s => (
          <Card key={s.label} className={`hover:shadow-md transition-all border ${s.border}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight">{s.value}</p>
                <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          {hasCoords && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPinned className="w-4 h-4 text-cyan-600" /> Observation Location
              </CardTitle></CardHeader>
              <CardContent>
                <DetailMap latitude={data.latitude} longitude={data.longitude} name={data.title} type="observation" />
              </CardContent>
            </Card>
          )}

          {/* Details Card */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-600" /> Observation Details
            </CardTitle></CardHeader>
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

          {/* Form Data as Key-Value Table */}
          {formDataEntries.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-600" /> Form Data
              </CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs h-9">Field</TableHead>
                        <TableHead className="text-xs h-9">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formDataEntries.map(([key, val]) => (
                        <TableRow key={String(key)}>
                          <TableCell className="text-xs font-medium text-slate-700 py-2">{fmt(String(key))}</TableCell>
                          <TableCell className="text-xs text-slate-600 py-2 font-mono">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Media Paths */}
          {data.media_paths && Array.isArray(data.media_paths) && data.media_paths.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-cyan-600" /> Media Attachments
              </CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.media_paths.map((path: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-xs">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-slate-600 truncate">{path}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Hash className="w-4 h-4 text-slate-500" /> Quick Info
            </CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <DetailField label="Status" value={statusBadge(data.status)} />
              <DetailField label="Sync ID" value={data.sync_id ? <span className="font-mono text-xs">{data.sync_id}</span> : '—'} />
              <DetailField label="Created" value={new Date(data.created_at).toLocaleString()} />
              <DetailField label="Project" value={data.surveyProject?.title || '—'} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// SYNC DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function SyncDetailPage({ data }: any) {
  if (!data) return null
  const durationSec = data.completed_at ? Math.round((new Date(data.completed_at).getTime() - new Date(data.started_at).getTime()) / 1000) : null
  const isPush = data.sync_type === 'push'
  const statusProgress: Record<string, number> = { pending: 10, in_progress: 50, completed: 100, failed: 100 }

  return (
    <div>
      {/* ── Hero Header ── */}
      <div className="relative mb-8">
        <div className="h-28 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-2xl shadow-lg" />
        <div className="absolute bottom-0 left-0 right-0 px-6 translate-y-1/2">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                {isPush ? <Upload className="w-7 h-7 text-blue-600" /> : <Download className="w-7 h-7 text-cyan-600" />}
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">Sync — {data.device_id}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {statusBadge(data.status)}
                  <Badge className={isPush ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}>
                    {isPush ? <Upload className="w-3 h-3 mr-1" /> : <Download className="w-3 h-3 mr-1" />}
                    {data.sync_type.toUpperCase()}
                  </Badge>
                  {durationSec !== null && (
                    <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm font-mono">{durationSec}s</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-10" />

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Pushed', value: data.records_pushed ?? 0, icon: Upload, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Pulled', value: data.records_pulled ?? 0, icon: Download, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Conflicts', value: data.conflicts_count ?? 0, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Duration', value: durationSec !== null ? `${durationSec}s` : 'Running…', icon: Timer, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
        ].map(s => (
          <Card key={s.label} className={`hover:shadow-md transition-all border ${s.border}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight">{s.value}</p>
                <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Sync Progress */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-600" /> Sync Progress
            </CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Status</span>
                  <span className="font-medium">{fmt(data.status)}</span>
                </div>
                <Progress value={statusProgress[data.status] || 0} className={`h-3 ${data.status === 'failed' ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'}`} />
                {/* Visual metrics */}
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="p-3 rounded-xl bg-blue-50 text-center border border-blue-100">
                    <Upload className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-blue-700">{data.records_pushed ?? 0}</p>
                    <p className="text-[10px] text-blue-500 uppercase tracking-wide">Pushed</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 text-center border border-emerald-100">
                    <Download className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-emerald-700">{data.records_pulled ?? 0}</p>
                    <p className="text-[10px] text-emerald-500 uppercase tracking-wide">Pulled</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 text-center border border-amber-100">
                    <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-amber-700">{data.conflicts_count ?? 0}</p>
                    <p className="text-[10px] text-amber-500 uppercase tracking-wide">Conflicts</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sync Details */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" /> Sync Details
            </CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Device" value={<span className="font-mono text-xs">{data.device_id}</span>} />
                <DetailField label="User" value={data.user_id} />
                <DetailField label="Type" value={<Badge className={isPush ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}>{data.sync_type.toUpperCase()}</Badge>} />
                <DetailField label="Status" value={statusBadge(data.status)} />
                <DetailField label="Started" value={new Date(data.started_at).toLocaleString()} />
                {data.completed_at && <DetailField label="Completed" value={new Date(data.completed_at).toLocaleString()} />}
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {data.error_message && (
            <Card className="border-red-200">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Sync Error
              </CardTitle></CardHeader>
              <CardContent>
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <pre className="text-xs text-red-700 whitespace-pre-wrap">{data.error_message}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-slate-500" /> Timeline
            </CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <DetailField label="Started" value={new Date(data.started_at).toLocaleString()} />
              {data.completed_at && <DetailField label="Completed" value={new Date(data.completed_at).toLocaleString()} />}
              {durationSec !== null && <DetailField label="Duration" value={`${durationSec}s`} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// AI MODEL DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function AIModelDetailPage({ data }: any) {
  if (!data) return null
  return (
    <div>
      {/* ── Hero Header ── */}
      <div className="relative mb-8">
        <div className="h-28 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl shadow-lg" />
        <div className="absolute bottom-0 left-0 right-0 px-6 translate-y-1/2">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                <Brain className="w-7 h-7 text-violet-600" />
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">{data.display_name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {data.is_active ? <Badge className="bg-emerald-100 text-emerald-800">Active</Badge> : <Badge className="bg-slate-100 text-slate-600">Inactive</Badge>}
                  <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm">{data.provider}</Badge>
                  <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm font-mono">{data.model_name}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-10" />

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Cost / 1K In', value: data.cost_per_1k_input ? `$${Number(data.cost_per_1k_input).toFixed(4)}` : '—', icon: DollarSign, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
          { label: 'Cost / 1K Out', value: data.cost_per_1k_output ? `$${Number(data.cost_per_1k_output).toFixed(4)}` : '—', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
          { label: 'Max Tokens', value: data.max_tokens?.toLocaleString() || '—', icon: Hash, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-100' },
          { label: 'Status', value: data.is_active ? 'Active' : 'Inactive', icon: Sparkles, color: data.is_active ? 'text-emerald-600' : 'text-slate-500', bg: data.is_active ? 'bg-emerald-50' : 'bg-slate-50', border: data.is_active ? 'border-emerald-100' : 'border-slate-100' },
        ].map(s => (
          <Card key={s.label} className={`hover:shadow-md transition-all border ${s.border}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight">{s.value}</p>
                <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Model Configuration */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-600" /> Model Configuration
            </CardTitle></CardHeader>
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

          {/* Related Prompt Templates */}
          {data.promptTemplates && data.promptTemplates.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-purple-600" /> Prompt Templates ({data.promptTemplates.length})
              </CardTitle></CardHeader>
              <CardContent>
                <div className="divide-y">
                  {data.promptTemplates.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{t.template?.slice(0, 80)}</p>
                      </div>
                      {t.is_active ? <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Active</Badge> : <Badge className="bg-slate-100 text-slate-600 text-[10px]">Inactive</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-violet-600" />
              </div>
              <p className="font-semibold">{data.display_name}</p>
              <p className="text-xs text-slate-400 font-mono mt-1">{data.id}</p>
              <div className="mt-3">
                {data.is_active ? <Badge className="bg-emerald-100 text-emerald-800">Active</Badge> : <Badge className="bg-slate-100 text-slate-600">Inactive</Badge>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-slate-500" /> Timeline
            </CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <DetailField label="Created" value={new Date(data.created_at).toLocaleString()} />
              <DetailField label="Updated" value={data.updated_at ? new Date(data.updated_at).toLocaleString() : '—'} />
            </CardContent>
          </Card>
        </div>
      </div>
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
  const handleFieldSave = async (field: string, value: string) => {
    try { await patchRecord(`/api/invoices/${data.id}`, { [field]: value }); onRefresh() }
    catch (e) { console.error(e) }
  }
  const clientName = data.client?.company_name || `${data.client?.first_name} ${data.client?.last_name}`
  const subtotal = Number(data.amount || 0)
  const tax = Number(data.tax_amount || 0)
  const total = Number(data.total_amount || 0)
  const isOverdue = data.due_date && new Date(data.due_date) < new Date() && data.status !== 'paid'
  const paymentSteps = ['draft', 'sent', 'paid']
  const currentStepIdx = paymentSteps.indexOf(data.status)

  return (
    <div>
      {/* ── Hero Header ── */}
      <div className="relative mb-8">
        <div className="h-28 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl shadow-lg" />
        <div className="absolute bottom-0 left-0 right-0 px-6 translate-y-1/2">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                <Receipt className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">{data.invoice_number}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {statusBadge(data.status)}
                  <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm font-mono">{data.invoice_number}</Badge>
                  {isOverdue && <Badge className="bg-red-100 text-red-800">Overdue</Badge>}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 bg-white/95 backdrop-blur-sm shadow-sm" disabled={actionLoading}>
                  Status <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {['draft', 'sent', 'pending', 'paid', 'cancelled'].map(s => (
                  <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>Mark as {fmt(s)}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="h-10" />

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Subtotal', value: formatUGX(subtotal), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Tax', value: formatUGX(tax), icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Total', value: formatUGX(total), icon: CreditCard, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
          { label: 'Due Date', value: data.due_date ? new Date(data.due_date).toLocaleDateString() : '—', icon: CalendarDays, color: isOverdue ? 'text-red-600' : 'text-slate-600', bg: isOverdue ? 'bg-red-50' : 'bg-slate-50', border: isOverdue ? 'border-red-100' : 'border-slate-100' },
        ].map(s => (
          <Card key={s.label} className={`hover:shadow-md transition-all border ${s.border}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight">{s.value}</p>
                <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Content with Tabs ── */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-0">
          {[
            { value: 'details', label: 'Details' },
            { value: 'breakdown', label: 'Amount Breakdown' },
            { value: 'activity', label: 'Activity' },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm data-[state=active]:text-emerald-700 data-[state=active]:font-semibold text-slate-500"
            >{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        {/* ── Details Tab ── */}
        <TabsContent value="details" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" /> Invoice Details
                </CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                    <DetailField label="Invoice Number" value={<span className="font-mono font-bold">{data.invoice_number}</span>} />
                    <EditableField label="Status" value={data.status} icon={CheckCircle2} onSave={v => handleStatusChange(v)} />
                    <EditableField label="Due Date" value={data.due_date ? new Date(data.due_date).toISOString().split('T')[0] : ''} icon={CalendarDays} type="date" onSave={v => handleFieldSave('due_date', v)} />
                    <DetailField label="Issue Date" value={data.issued_at ? new Date(data.issued_at).toLocaleDateString() : data.created_at ? new Date(data.created_at).toLocaleDateString() : '—'} />
                    <DetailField label="Total Amount" value={<span className="text-lg font-bold">{formatUGX(total)}</span>} />
                    <EditableField label="Notes" value={(data as any).notes} icon={StickyNote} type="textarea" onSave={v => handleFieldSave('notes', v)} />
                  </div>
                </CardContent>
              </Card>
              {data.line_items && (
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-emerald-600" /> Line Items
                  </CardTitle></CardHeader>
                  <CardContent><pre className="text-xs bg-slate-50 p-4 rounded-xl overflow-auto max-h-64">{JSON.stringify(data.line_items, null, 2)}</pre></CardContent>
                </Card>
              )}
            </div>
            <div className="space-y-6">
              {/* Client Link Card */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Client</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                      {data.client?.client_type === 'company' ? (data.client?.company_name?.[0] || 'C') : `${data.client?.first_name?.[0] || ''}${data.client?.last_name?.[0] || ''}`}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{clientName}</p>
                      <p className="text-xs text-slate-400 font-mono">{data.client?.client_ref}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-300 ml-auto" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Breakdown Tab ── */}
        <TabsContent value="breakdown" className="mt-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Amount Breakdown
            </CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50 text-center border border-emerald-100">
                    <p className="text-xs text-emerald-600 uppercase tracking-wide font-medium">Subtotal</p>
                    <p className="text-lg font-bold text-emerald-700 mt-1">{formatUGX(subtotal)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 text-center border border-amber-100">
                    <p className="text-xs text-amber-600 uppercase tracking-wide font-medium">Tax</p>
                    <p className="text-lg font-bold text-amber-700 mt-1">{formatUGX(tax)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-teal-50 text-center border border-teal-100">
                    <p className="text-xs text-teal-600 uppercase tracking-wide font-medium">Total</p>
                    <p className="text-lg font-bold text-teal-700 mt-1">{formatUGX(total)}</p>
                  </div>
                </div>
                {/* Visual breakdown bar */}
                {total > 0 && (
                  <div className="space-y-2">
                    <div className="h-8 rounded-xl overflow-hidden flex bg-slate-100">
                      <div className="bg-emerald-400 h-full flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${(subtotal / total) * 100}%` }}>
                        {subtotal > 0 && 'Subtotal'}
                      </div>
                      <div className="bg-amber-400 h-full flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${(tax / total) * 100}%` }}>
                        {tax > 0 && 'Tax'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Status Timeline */}
          <Card className="mt-6">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-slate-500" /> Payment Status
            </CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {paymentSteps.map((step, idx) => (
                  <div key={step} className="flex items-center gap-2 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      idx <= currentStepIdx ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {idx <= currentStepIdx ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={`text-xs font-medium ${idx <= currentStepIdx ? 'text-emerald-700' : 'text-slate-400'}`}>{fmt(step)}</span>
                    {idx < paymentSteps.length - 1 && (
                      <div className={`flex-1 h-0.5 ${idx < currentStepIdx ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Activity Tab ── */}
        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-slate-500" /> Activity
            </CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-0">
                {[
                  { label: 'Created', date: data.created_at, icon: Clock3, color: 'text-blue-600 bg-blue-50' },
                  data.issued_at && { label: 'Issued', date: data.issued_at, icon: Send, color: 'text-amber-600 bg-amber-50' },
                  data.status === 'paid' && data.updated_at && { label: 'Paid', date: data.updated_at, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
                ].filter(Boolean).map((a: any, idx: number, arr: any[]) => (
                  <div key={a.label} className="flex items-start gap-3 relative pb-4">
                    {idx < arr.length - 1 && <div className="absolute left-[15px] top-[34px] w-px h-[calc(100%-14px)] bg-slate-200" />}
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${a.color}`}>
                      <a.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{a.label}</p>
                      <p className="text-[11px] text-slate-400">{new Date(a.date).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// QUOTATION DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function QuotationDetailPage({ data }: any) {
  if (!data) return null
  const clientName = data.client?.company_name || `${data.client?.first_name} ${data.client?.last_name}`
  const amount = Number(data.amount || data.total_amount || 0)
  const isExpired = data.valid_until && new Date(data.valid_until) < new Date() && data.status !== 'accepted'

  return (
    <div>
      {/* ── Hero Header ── */}
      <div className="relative mb-8">
        <div className="h-28 bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 rounded-2xl shadow-lg" />
        <div className="absolute bottom-0 left-0 right-0 px-6 translate-y-1/2">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                <DollarSign className="w-7 h-7 text-blue-600" />
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">{data.quote_number}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {statusBadge(data.status)}
                  <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm font-mono">{data.quote_number}</Badge>
                  {isExpired && <Badge className="bg-red-100 text-red-800">Expired</Badge>}
                </div>
              </div>
            </div>
            <Button className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => toast.info('Convert to invoice coming soon')}>
              <Receipt className="w-4 h-4 mr-1.5" /> Convert to Invoice
            </Button>
          </div>
        </div>
      </div>

      <div className="h-10" />

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Amount', value: formatUGX(amount), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Valid Until', value: data.valid_until ? new Date(data.valid_until).toLocaleDateString() : '—', icon: CalendarDays, color: isExpired ? 'text-red-600' : 'text-indigo-600', bg: isExpired ? 'bg-red-50' : 'bg-indigo-50', border: isExpired ? 'border-red-100' : 'border-indigo-100' },
          { label: 'Status', value: fmt(data.status), icon: CheckCircle2, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
        ].map(s => (
          <Card key={s.label} className={`hover:shadow-md transition-all border ${s.border}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight">{s.value}</p>
                <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> Quotation Details
            </CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DetailField label="Quote Number" value={<span className="font-mono font-bold">{data.quote_number}</span>} />
                <DetailField label="Total Amount" value={<span className="text-lg font-bold">{formatUGX(amount)}</span>} />
                <DetailField label="Status" value={statusBadge(data.status)} />
                <DetailField label="Valid Until" value={data.valid_until ? new Date(data.valid_until).toLocaleDateString() : '—'} />
                <DetailField label="Created" value={new Date(data.created_at).toLocaleDateString()} />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          {/* Client Link Card */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Client</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                  {data.client?.client_type === 'company' ? (data.client?.company_name?.[0] || 'C') : `${data.client?.first_name?.[0] || ''}${data.client?.last_name?.[0] || ''}`}
                </div>
                <div>
                  <p className="text-sm font-medium">{clientName}</p>
                  <p className="text-xs text-slate-400 font-mono">{data.client?.client_ref}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-300 ml-auto" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-slate-500" /> Timeline
            </CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <DetailField label="Created" value={new Date(data.created_at).toLocaleString()} />
              {data.valid_until && <DetailField label="Valid Until" value={new Date(data.valid_until).toLocaleDateString()} />}
            </CardContent>
          </Card>
        </div>
      </div>
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
  const clientName = data.client?.company_name || `${data.client?.first_name} ${data.client?.last_name}`
  const docTypeIcons: Record<string, any> = {
    survey_report: FileText, title_deed: FileCheck, correspondence: Mail,
    contract: StickyNote, photo: Eye, map: MapPinned, other: FileText,
  }
  const docTypeColors: Record<string, string> = {
    survey_report: 'bg-blue-50 text-blue-700 border-blue-100',
    title_deed: 'bg-amber-50 text-amber-700 border-amber-100',
    correspondence: 'bg-violet-50 text-violet-700 border-violet-100',
    contract: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    photo: 'bg-pink-50 text-pink-700 border-pink-100',
    map: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    other: 'bg-slate-50 text-slate-700 border-slate-100',
  }
  const DocIcon = docTypeIcons[data.document_type] || FileText

  return (
    <div>
      {/* ── Hero Header ── */}
      <div className="relative mb-8">
        <div className="h-28 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl shadow-lg" />
        <div className="absolute bottom-0 left-0 right-0 px-6 translate-y-1/2">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                <DocIcon className="w-7 h-7 text-amber-600" />
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">{data.title}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className={docTypeColors[data.document_type] || 'bg-slate-50 text-slate-700'}>
                    {fmt(data.document_type)}
                  </Badge>
                  {data.is_verified ? (
                    <Badge className="bg-emerald-100 text-emerald-800"><Check className="w-3 h-3 mr-1" />Verified</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800"><Clock3 className="w-3 h-3 mr-1" />Unverified</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-10" />

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Type', value: fmt(data.document_type), icon: DocIcon, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'File Size', value: data.file_size ? `${(Number(data.file_size) / 1024).toFixed(1)} KB` : '—', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
          { label: 'Verification', value: data.is_verified ? 'Verified' : 'Unverified', icon: FileCheck, color: data.is_verified ? 'text-emerald-600' : 'text-amber-600', bg: data.is_verified ? 'bg-emerald-50' : 'bg-amber-50', border: data.is_verified ? 'border-emerald-100' : 'border-amber-100' },
          { label: 'Created', value: new Date(data.created_at).toLocaleDateString(), icon: CalendarDays, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
        ].map(s => (
          <Card key={s.label} className={`hover:shadow-md transition-all border ${s.border}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight">{s.value}</p>
                <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Document Information */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" /> Document Information
            </CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DetailField label="Title" value={<span className="font-semibold">{data.title}</span>} />
                <DetailField label="Document Type" value={<Badge className={docTypeColors[data.document_type] || 'bg-slate-50 text-slate-700'}>{fmt(data.document_type)}</Badge>} />
                <DetailField label="Verification" value={data.is_verified ? <Badge className="bg-emerald-100 text-emerald-800">Verified</Badge> : <Badge className="bg-amber-100 text-amber-800">Unverified</Badge>} />
                <DetailField label="MIME Type" value={<span className="font-mono text-xs">{data.mime_type}</span>} />
                <DetailField label="File Size" value={data.file_size ? `${(Number(data.file_size) / 1024).toFixed(1)} KB` : '—'} />
                <DetailField label="Uploaded By" value={data.uploaded_by || '—'} />
              </div>
              {data.file_path && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">File Path</p>
                  <p className="font-mono text-xs text-slate-600 break-all">{data.file_path}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {data.description && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Description</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-slate-600 whitespace-pre-wrap">{data.description}</p></CardContent>
            </Card>
          )}

          {/* Verification Workflow Timeline */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" /> Verification Workflow
            </CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-blue-700">Uploaded</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-200" />
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${data.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    {data.is_verified ? <Check className="w-4 h-4" /> : <Clock3 className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs font-medium ${data.is_verified ? 'text-emerald-700' : 'text-slate-400'}`}>Verified</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Link Card */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Client</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700">
                  {data.client?.client_type === 'company' ? (data.client?.company_name?.[0] || 'C') : `${data.client?.first_name?.[0] || ''}${data.client?.last_name?.[0] || ''}`}
                </div>
                <div>
                  <p className="text-sm font-medium">{clientName}</p>
                  <p className="text-xs text-slate-400 font-mono">{data.client?.client_ref}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-300 ml-auto" />
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" /> Actions
            </CardTitle></CardHeader>
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
  const clientName = data.client?.company_name || `${data.client?.first_name} ${data.client?.last_name}`
  const isOutbound = data.direction === 'outbound'
  const channelIcons: Record<string, any> = { sms: Smartphone, email: Mail, whatsapp: MessageCircle }
  const channelColors: Record<string, string> = { sms: 'text-blue-600', email: 'text-violet-600', whatsapp: 'text-emerald-600' }
  const ChannelIcon = channelIcons[data.channel] || MessageSquare
  const deliverySteps = ['queued', 'sent', 'delivered', 'read']
  const currentDeliveryIdx = deliverySteps.indexOf(data.status)

  return (
    <div>
      {/* ── Hero Header ── */}
      <div className="relative mb-8">
        <div className="h-28 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl shadow-lg" />
        <div className="absolute bottom-0 left-0 right-0 px-6 translate-y-1/2">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                <ChannelIcon className={`w-7 h-7 ${channelColors[data.channel] || 'text-violet-600'}`} />
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">{data.subject || 'No Subject'}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {statusBadge(data.status)}
                  <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm">
                    <ChannelIcon className={`w-3 h-3 mr-1 ${channelColors[data.channel] || ''}`} />{fmt(data.channel)}
                  </Badge>
                  <Badge className={isOutbound ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}>
                    {isOutbound ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownLeft className="w-3 h-3 mr-1" />}
                    {fmt(data.direction)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-10" />

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Channel', value: fmt(data.channel), icon: ChannelIcon, color: channelColors[data.channel] || 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
          { label: 'Direction', value: fmt(data.direction), icon: isOutbound ? ArrowUpRight : ArrowDownLeft, color: isOutbound ? 'text-blue-600' : 'text-emerald-600', bg: isOutbound ? 'bg-blue-50' : 'bg-emerald-50', border: isOutbound ? 'border-blue-100' : 'border-emerald-100' },
          { label: 'Status', value: fmt(data.status), icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
          { label: 'Sent At', value: data.sent_at ? new Date(data.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—', icon: Clock3, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-100' },
        ].map(s => (
          <Card key={s.label} className={`hover:shadow-md transition-all border ${s.border}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight">{s.value}</p>
                <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Chat-style Message Body */}
          {data.body && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-violet-600" /> Message Body
              </CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className={`max-w-[85%] ${isOutbound ? 'self-end' : 'self-start'}`}>
                    <div className={`rounded-2xl px-4 py-3 ${
                      isOutbound
                        ? 'bg-violet-100 text-violet-900 rounded-br-md'
                        : 'bg-slate-100 text-slate-800 rounded-bl-md'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{data.body}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] text-slate-400">
                        {isOutbound ? 'Outbound' : 'Inbound'} · {data.sent_at ? new Date(data.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                      </span>
                      {isOutbound && currentDeliveryIdx >= 2 && (
                        <CheckCircle2 className="w-3 h-3 text-violet-400" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery Status Timeline */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-slate-500" /> Delivery Status
            </CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-1">
                {deliverySteps.map((step, idx) => (
                  <div key={step} className="flex items-center gap-1 flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      idx <= currentDeliveryIdx ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {idx <= currentDeliveryIdx ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <span className={`text-[10px] font-medium ${idx <= currentDeliveryIdx ? 'text-violet-700' : 'text-slate-400'}`}>{fmt(step)}</span>
                    {idx < deliverySteps.length - 1 && (
                      <div className={`flex-1 h-0.5 ${idx < currentDeliveryIdx ? 'bg-violet-400' : 'bg-slate-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Message Details */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-600" /> Message Details
            </CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DetailField label="Subject" value={data.subject || 'No Subject'} />
                <DetailField label="Channel" value={fmt(data.channel)} />
                <DetailField label="Direction" value={<Badge className={isOutbound ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}>{fmt(data.direction)}</Badge>} />
                <DetailField label="Status" value={statusBadge(data.status)} />
                <DetailField label="Sent At" value={data.sent_at ? new Date(data.sent_at).toLocaleString() : '—'} />
                <DetailField label="Created" value={new Date(data.created_at).toLocaleString()} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Link Card */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Client</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700">
                  {data.client?.client_type === 'company' ? (data.client?.company_name?.[0] || 'C') : `${data.client?.first_name?.[0] || ''}${data.client?.last_name?.[0] || ''}`}
                </div>
                <div>
                  <p className="text-sm font-medium">{clientName}</p>
                  <p className="text-xs text-slate-400 font-mono">{data.client?.client_ref}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-300 ml-auto" />
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" /> Actions
            </CardTitle></CardHeader>
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
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// APPROVAL DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function ApprovalDetailPage({ data, onRefresh }: { data: any; onRefresh: () => void }) {
  const [actionLoading, setActionLoading] = useState(false)
  const [notes, setNotes] = useState(data.notes || '')
  const handleApprove = async () => {
    setActionLoading(true)
    try { await patchRecord(`/api/approvals/${data.id}`, { status: 'approved', approved_by: 'current_user', notes }); onRefresh() }
    catch (e) { console.error(e) } finally { setActionLoading(false) }
  }
  const handleDefer = async () => {
    setActionLoading(true)
    try { await patchRecord(`/api/approvals/${data.id}`, { status: 'deferred', notes }); onRefresh() }
    catch (e) { console.error(e) } finally { setActionLoading(false) }
  }
  const handleReject = async () => {
    setActionLoading(true)
    try { await patchRecord(`/api/approvals/${data.id}`, { status: 'rejected', notes }); onRefresh() }
    catch (e) { console.error(e) } finally { setActionLoading(false) }
  }

  const statusColors: Record<string, string> = {
    pending: 'text-amber-700 bg-amber-50 border-amber-200',
    approved: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    deferred: 'text-blue-700 bg-blue-50 border-blue-200',
    rejected: 'text-red-700 bg-red-50 border-red-200',
  }

  return (
    <div>
      {/* ── Hero Header ── */}
      <div className="relative mb-8">
        <div className="h-28 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-2xl shadow-lg" />
        <div className="absolute bottom-0 left-0 right-0 px-6 translate-y-1/2">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                <Shield className="w-7 h-7 text-amber-600" />
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">{fmt(data.step_name)}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {statusBadge(data.status)}
                  <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm">
                    Step {data.step_order}
                  </Badge>
                  {data.approver_role && <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm">{data.approver_role}</Badge>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-10" />

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Step', value: `#${data.step_order}`, icon: CircleDot, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Status', value: fmt(data.status), icon: ShieldCheck, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
          { label: 'Approver', value: data.assigned_to || data.approver_role || '—', icon: User, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
          { label: 'Project', value: data.surveyProject?.title ? data.surveyProject.title.split(' ').slice(0, 3).join(' ') : '—', icon: MapPin, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
        ].map(s => (
          <Card key={s.label} className={`hover:shadow-md transition-all border ${s.border}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight truncate max-w-[140px]">{s.value}</p>
                <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Approval Step Details */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" /> Approval Step Details
            </CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DetailField label="Step Name" value={<span className="font-semibold">{fmt(data.step_name)}</span>} />
                <DetailField label="Order" value={`Step ${data.step_order}`} />
                <DetailField label="Status" value={statusBadge(data.status)} />
                <DetailField label="Approver Role" value={data.approver_role || '—'} />
                <DetailField label="Assigned To" value={data.assigned_to || '—'} />
                {data.approved_by && <DetailField label="Approved By" value={data.approved_by} />}
                {data.approved_at && <DetailField label="Approved At" value={new Date(data.approved_at).toLocaleString()} />}
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-amber-600" /> Notes
            </CardTitle></CardHeader>
            <CardContent>
              <Textarea
                className="text-sm"
                placeholder="Add approval comments..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Link Card */}
          {data.surveyProject && (
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Project</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{data.surveyProject.title}</p>
                    <p className="text-xs text-slate-400 font-mono">{data.surveyProject.project_ref}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-300 ml-auto" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Approver Info Card */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" /> Approver Info
            </CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <DetailField label="Role" value={data.approver_role || '—'} />
              <DetailField label="Assigned To" value={data.assigned_to || '—'} />
              <DetailField label="Created" value={new Date(data.created_at).toLocaleString()} />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {data.status === 'pending' && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-500" /> Actions
              </CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10" disabled={actionLoading} onClick={handleApprove}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                </Button>
                <Button variant="outline" className="w-full h-10 border-amber-300 text-amber-700 hover:bg-amber-50" disabled={actionLoading} onClick={handleDefer}>
                  <Pause className="w-4 h-4 mr-2" /> Defer
                </Button>
                <Button variant="destructive" className="w-full h-10" disabled={actionLoading} onClick={handleReject}>
                  <X className="w-4 h-4 mr-2" /> Reject
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// DOMAIN EVENT DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function DomainEventDetailPage({ data }: any) {
  if (!data) return null
  const payloadEntries = data.payload ? (typeof data.payload === 'object' ? Object.entries(data.payload) : []) : []

  return (
    <div>
      {/* ── Hero Header ── */}
      <div className="relative mb-8">
        <div className="h-28 bg-gradient-to-br from-slate-500 via-gray-500 to-zinc-600 rounded-2xl shadow-lg" />
        <div className="absolute bottom-0 left-0 right-0 px-6 translate-y-1/2">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                <ScrollText className="w-7 h-7 text-slate-600" />
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">{fmt(data.event_type)}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm">{fmt(data.aggregate)}</Badge>
                  <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm font-mono">{data.aggregate_id?.slice(0, 8)}…</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-10" />

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Event Type', value: fmt(data.event_type), icon: ScrollText, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
          { label: 'Aggregate', value: fmt(data.aggregate), icon: Database, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100' },
          { label: 'Created', value: new Date(data.created_at).toLocaleString(), icon: Clock3, color: 'text-zinc-600', bg: 'bg-zinc-50', border: 'border-zinc-100' },
        ].map(s => (
          <Card key={s.label} className={`hover:shadow-md transition-all border ${s.border}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight">{s.value}</p>
                <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Event Metadata */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" /> Event Metadata
            </CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DetailField label="Event Type" value={<span className="font-semibold">{fmt(data.event_type)}</span>} />
                <DetailField label="Aggregate" value={fmt(data.aggregate)} />
                <DetailField label="Aggregate ID" value={<span className="font-mono text-xs">{data.aggregate_id}</span>} />
                <DetailField label="Created" value={new Date(data.created_at).toLocaleString()} />
              </div>
            </CardContent>
          </Card>

          {/* Payload as Key-Value Table */}
          {payloadEntries.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-600" /> Event Payload
              </CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs h-9">Key</TableHead>
                        <TableHead className="text-xs h-9">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payloadEntries.map(([key, val]) => (
                        <TableRow key={String(key)}>
                          <TableCell className="text-xs font-medium text-slate-700 py-2">{fmt(String(key))}</TableCell>
                          <TableCell className="text-xs text-slate-600 py-2 font-mono">
                            {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '—')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fallback: raw JSON if no parsed entries */}
          {data.payload && payloadEntries.length === 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-600" /> Event Payload
              </CardTitle></CardHeader>
              <CardContent><pre className="text-xs bg-slate-50 p-4 rounded-xl overflow-auto max-h-96">{JSON.stringify(data.payload, null, 2)}</pre></CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <ScrollText className="w-8 h-8 text-slate-500" />
              </div>
              <p className="font-semibold">{fmt(data.event_type)}</p>
              <p className="text-xs text-slate-400 mt-1">{fmt(data.aggregate)}</p>
              <p className="text-[10px] text-slate-300 font-mono mt-2">{data.aggregate_id}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-slate-500" /> Timeline
            </CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <DetailField label="Created" value={new Date(data.created_at).toLocaleString()} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ORGANIZATION DETAIL PAGE
// ══════════════════════════════════════════════════════════════

function OrganizationDetailPage({ data }: any) {
  if (!data) return null
  const settingsEntries = data.settings ? (typeof data.settings === 'object' ? Object.entries(data.settings) : []) : []

  return (
    <div>
      {/* ── Hero Header ── */}
      <div className="relative mb-8">
        <div className="h-28 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl shadow-lg" />
        <div className="absolute bottom-0 left-0 right-0 px-6 translate-y-1/2">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                <Building2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">{data.name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {data.is_active ? <Badge className="bg-emerald-100 text-emerald-800">Active</Badge> : <Badge className="bg-slate-100 text-slate-600">Inactive</Badge>}
                  <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm font-mono">{data.slug}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-10" />

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Clients', value: data._count?.clients ?? '—', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Workflows', value: data._count?.workflowDefinitions ?? '—', icon: GitBranch, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
          { label: 'Branches', value: data.branches?.length ?? data._count?.branches ?? '—', icon: Building, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
          { label: 'Status', value: data.is_active ? 'Active' : 'Inactive', icon: Activity, color: data.is_active ? 'text-emerald-600' : 'text-slate-500', bg: data.is_active ? 'bg-emerald-50' : 'bg-slate-50', border: data.is_active ? 'border-emerald-100' : 'border-slate-100' },
        ].map(s => (
          <Card key={s.label} className={`hover:shadow-md transition-all border ${s.border}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight">{s.value}</p>
                <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Content with Tabs ── */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-0">
          {[
            { value: 'details', label: 'Details' },
            { value: 'branches', label: `Branches (${data.branches?.length ?? 0})` },
            { value: 'settings', label: 'Settings' },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm data-[state=active]:text-emerald-700 data-[state=active]:font-semibold text-slate-500"
            >{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        {/* ── Details Tab ── */}
        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" /> Organization Details
            </CardTitle></CardHeader>
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
        </TabsContent>

        {/* ── Branches Tab ── */}
        <TabsContent value="branches" className="mt-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" /> Branches ({data.branches?.length ?? 0})
            </CardTitle></CardHeader>
            <CardContent>
              {data.branches && data.branches.length > 0 ? (
                <div className="space-y-3">
                  {data.branches.map((b: any) => (
                    <div key={b.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${b.is_head_office ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {b.is_head_office ? 'HQ' : b.slug?.[0]?.toUpperCase() || 'B'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{b.name}</p>
                          {b.is_head_office && <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Head Office</Badge>}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{b.slug}</p>
                      </div>
                      {b.is_active ? <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Active</Badge> : <Badge className="bg-slate-100 text-slate-600 text-[10px]">Inactive</Badge>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No branches defined</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Settings Tab ── */}
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-600" /> Organization Settings
            </CardTitle></CardHeader>
            <CardContent>
              {settingsEntries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settingsEntries.map(([key, val]) => (
                    <div key={String(key)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Tag className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">{fmt(String(key))}</p>
                        <p className="text-sm font-medium">{typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No settings configured</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
