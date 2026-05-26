'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger,
} from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Users, MapPin, GitBranch, Smartphone, Brain, Building2,
  TrendingUp, Activity, Clock, CheckCircle2, AlertCircle,
  ArrowRight, Radio, Eye, FileText, LayoutDashboard, Layers,
  Search, ChevronRight, Phone, Mail, Map, Clock3, Zap,
  ArrowUpRight, ArrowDownRight, Database, Shield, Cpu,
  BarChart3, Workflow, Crosshair, RadioTower,
  DollarSign, Receipt, MessageSquare, ShieldCheck, ScrollText,
  Network, ArrowUpDown, ArrowUp, ArrowDown, X, Trash2,
  Download, UserPlus, MoreHorizontal,
  BarChart2, FileSpreadsheet, CalendarDays, Printer, Filter,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line,
} from 'recharts'

const SpatialMap = dynamic(() => import('@/components/spatial-map'), { ssr: false })

// ── Types ──
type PageId = 'dashboard' | 'clients' | 'projects' | 'workflows' | 'spatial' | 'field-sync' | 'ai' | 'finance' | 'documents' | 'communications' | 'approvals' | 'audit' | 'organizations' | 'reports'

interface ClientRecord {
  id: number; client_ref: string; client_type: string; first_name: string | null
  last_name: string | null; company_name: string | null; email: string | null
  phone: string | null; district: string | null; status: string; latitude: string | null; longitude: string | null
  organization: { name: string; slug: string } | null
  branch: { name: string; slug: string } | null
  surveyProjects: Array<{ id: number; project_ref: string; title: string; status: string }>
  invoices: Array<{ id: number; invoice_number: string; total_amount: number; status: string }>
  _count: { surveyProjects: number; invoices: number; documents: number; communications: number }
}

interface ProjectRecord {
  id: number; project_ref: string; project_type: string; title: string
  description: string | null; status: string; priority: string
  district: string | null; area_hectares: string | null; due_date: string | null; created_at: string
  client: { id: number; client_ref: string; first_name: string | null; last_name: string | null; company_name: string | null; client_type: string }
  approvalSteps: Array<{ id: number; step_name: string; step_order: number; status: string; approver_role: string | null }>
  fieldObservations: Array<{ id: number; title: string; observation_type: string; status: string }>
  _count: { approvalSteps: number; fieldObservations: number; progressRecords: number }
}

const STATUS_COLORS: Record<string, string> = {
  intake: '#6366f1', field_survey: '#3b82f6', data_processing: '#f59e0b',
  completed: '#059669', pending: '#94a3b8', draft: '#64748b',
  paid: '#10b981', in_progress: '#3b82f6', active: '#10b981', prospect: '#6366f1',
  overdue: '#ef4444', cancelled: '#6b7280', sent: '#3b82f6',
  approved: '#10b981', deferred: '#f59e0b', delivered: '#10b981',
  failed: '#ef4444', queued: '#94a3b8',
}
const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800 border-red-200', high: 'bg-orange-100 text-orange-800 border-orange-200',
  normal: 'bg-slate-100 text-slate-700 border-slate-200', low: 'bg-gray-100 text-gray-600 border-gray-200',
}
const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200', prospect: 'bg-blue-100 text-blue-800 border-blue-200',
  intake: 'bg-indigo-100 text-indigo-800 border-indigo-200', field_survey: 'bg-blue-100 text-blue-800 border-blue-200',
  data_processing: 'bg-amber-100 text-amber-800 border-amber-200', pending: 'bg-slate-100 text-slate-700 border-slate-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200', in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  synced: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200', overdue: 'bg-red-100 text-red-800 border-red-200',
  draft: 'bg-slate-100 text-slate-700 border-slate-200', sent: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200', deferred: 'bg-amber-100 text-amber-800 border-amber-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200', failed: 'bg-red-100 text-red-800 border-red-200',
  queued: 'bg-slate-100 text-slate-700 border-slate-200', unread: 'bg-blue-100 text-blue-800 border-blue-200',
  verified: 'bg-emerald-100 text-emerald-800 border-emerald-200', unverified: 'bg-amber-100 text-amber-800 border-amber-200',
}
function fmt(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }
function statusBadge(status: string) {
  return <Badge variant="outline" className={`text-xs ${STATUS_BADGE[status] || 'bg-slate-100 text-slate-600'}`}>{fmt(status)}</Badge>
}

// ── Sortable Header Helper ──
function SortableHeader({ label, field, sortField, sortDir, onSort }: { label: string; field: string; sortField: string; sortDir: 'asc' | 'desc'; onSort: (f: string) => void }) {
  return (
    <div className="flex items-center gap-1 cursor-pointer select-none hover:text-slate-900" onClick={() => onSort(field)}>
      <span>{label}</span>
      {sortField === field ? (
        sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-30" />
      )}
    </div>
  )
}

// ── Bulk Action Bar ──
function BulkActionBar({ selectedCount, onClear, onAction }: { selectedCount: number; onClear: () => void; onAction: (action: string) => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between z-50 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-bold">{selectedCount}</div>
        <span className="text-sm font-medium">item{selectedCount > 1 ? 's' : ''} selected</span>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="secondary" className="h-8">Change Status</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onAction('status-active')}>Set Active</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('status-pending')}>Set Pending</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('status-completed')}>Set Completed</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('status-cancelled')}>Set Cancelled</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" variant="secondary" className="h-8" onClick={() => onAction('export')}>
          <Download className="w-3.5 h-3.5 mr-1" />Export
        </Button>
        <Button size="sm" variant="secondary" className="h-8" onClick={() => onAction('assign')}>
          <UserPlus className="w-3.5 h-3.5 mr-1" />Assign
        </Button>
        <Button size="sm" variant="destructive" className="h-8" onClick={() => onAction('delete')}>
          <Trash2 className="w-3.5 h-3.5 mr-1" />Delete
        </Button>
        <Button size="sm" variant="ghost" className="h-8 text-slate-300 hover:text-white" onClick={onClear}>
          <X className="w-3.5 h-3.5 mr-1" />Clear
        </Button>
      </div>
    </div>
  )
}

// ── Main App ──
export default function GWSPlatform() {
  const [page, setPage] = useState<PageId>('dashboard')
  const [dashData, setDashData] = useState<any>(null)
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [workflows, setWorkflows] = useState<any[]>([])
  const [spatial, setSpatial] = useState<any>(null)
  const [fieldSync, setFieldSync] = useState<any>(null)
  const [aiData, setAiData] = useState<any>(null)
  const [financeData, setFinanceData] = useState<any>(null)
  const [documentsData, setDocumentsData] = useState<any>(null)
  const [commsData, setCommsData] = useState<any>(null)
  const [approvalsData, setApprovalsData] = useState<any>(null)
  const [eventsData, setEventsData] = useState<any>(null)
  const [orgsData, setOrgsData] = useState<any>(null)
  const [reportsData, setReportsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [detailPanel, setDetailPanel] = useState<{ open: boolean; type: string; data: any }>({ open: false, type: '', data: null })
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }, [])

  const toggleAll = useCallback((ids: number[]) => {
    setSelectedIds(prev => {
      const allSelected = ids.length > 0 && ids.every(id => prev.has(id))
      const next = new Set(prev)
      if (allSelected) { ids.forEach(id => next.delete(id)) } else { ids.forEach(id => next.add(id)) }
      return next
    })
  }, [])

  const handleBulkAction = useCallback((action: string) => {
    console.log(`Bulk action: ${action} on ${selectedIds.size} items`)
    setSelectedIds(new Set())
  }, [selectedIds])

  useEffect(() => {
    async function fetchAll() {
      try {
        const [d, c, p, w, s, f, a, fin, docs, comms, approvals, events, orgs, reps] = await Promise.all([
          fetch('/api/dashboard').then(r => r.json()),
          fetch('/api/clients').then(r => r.json()),
          fetch('/api/projects').then(r => r.json()),
          fetch('/api/workflows').then(r => r.json()),
          fetch('/api/spatial').then(r => r.json()),
          fetch('/api/field-sync').then(r => r.json()),
          fetch('/api/ai').then(r => r.json()),
          fetch('/api/finance').then(r => r.json()),
          fetch('/api/documents').then(r => r.json()),
          fetch('/api/communications').then(r => r.json()),
          fetch('/api/approvals').then(r => r.json()),
          fetch('/api/events').then(r => r.json()),
          fetch('/api/organizations').then(r => r.json()),
          fetch('/api/reports').then(r => r.json()),
        ])
        setDashData(d); setClients(c); setProjects(p); setWorkflows(w)
        setSpatial(s); setFieldSync(f); setAiData(a)
        setFinanceData(fin); setDocumentsData(docs); setCommsData(comms)
        setApprovalsData(approvals); setEventsData(events); setOrgsData(orgs)
        setReportsData(reps)
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const openDetail = (type: string, data: any) => setDetailPanel({ open: true, type, data })
  const closeDetail = () => setDetailPanel({ open: false, type: '', data: null })

  const NAV_ITEMS: Array<{ id: PageId; label: string; icon: any; group: string; badge?: number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
    { id: 'clients', label: 'Clients', icon: Users, group: 'Core', badge: clients?.length },
    { id: 'projects', label: 'Survey Projects', icon: MapPin, group: 'Core', badge: projects?.length },
    { id: 'approvals', label: 'Approvals', icon: ShieldCheck, group: 'Core', badge: approvalsData?.metrics?.pending },
    { id: 'finance', label: 'Finance', icon: Receipt, group: 'Financial', badge: financeData?.metrics?.invoiceCount },
    { id: 'workflows', label: 'Workflows', icon: GitBranch, group: 'Operations', badge: workflows?.reduce((s: number, w: any) => s + w.instances.length, 0) },
    { id: 'field-sync', label: 'Field Sync', icon: Smartphone, group: 'Operations', badge: fieldSync?.syncEvents?.length },
    { id: 'spatial', label: 'Spatial OS', icon: Layers, group: 'Operations' },
    { id: 'ai', label: 'AI & Insights', icon: Brain, group: 'Intelligence' },
    { id: 'audit', label: 'Audit Trail', icon: ScrollText, group: 'Intelligence', badge: eventsData?.metrics?.total },
    { id: 'communications', label: 'Messages & SMS', icon: MessageSquare, group: 'Communications', badge: commsData?.metrics?.total },
    { id: 'documents', label: 'Document Vault', icon: FileText, group: 'Documents', badge: documentsData?.metrics?.total },
    { id: 'organizations', label: 'Organizations', icon: Building2, group: 'System' },
    { id: 'reports', label: 'Reports', icon: BarChart2, group: 'Intelligence' },
  ]

  const grouped = NAV_ITEMS.reduce((acc, item) => {
    const g = acc.find(a => a.group === item.group)
    if (g) g.items.push(item); else acc.push({ group: item.group, items: [item] })
    return acc
  }, [] as Array<{ group: string; items: typeof NAV_ITEMS }>)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700">GWS Platform V2</h2>
          <p className="text-sm text-slate-500">Connecting to Prisma Postgres...</p>
        </div>
      </div>
    )
  }

  const m = dashData?.metrics || {}

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage m={m} dashData={dashData} onNavigate={setPage} openDetail={openDetail} clients={clients} projects={projects} financeData={financeData} />
      case 'clients': return <ClientsPage clients={clients} search={search} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} />
      case 'projects': return <ProjectsPage projects={projects} search={search} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} />
      case 'workflows': return <WorkflowsPage workflows={workflows} openDetail={openDetail} />
      case 'spatial': return <SpatialPage spatial={spatial} />
      case 'field-sync': return <FieldSyncPage fieldSync={fieldSync} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} />
      case 'ai': return <AIPage aiData={aiData} openDetail={openDetail} />
      case 'finance': return <FinancePage financeData={financeData} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} />
      case 'documents': return <DocumentsPage documentsData={documentsData} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} />
      case 'communications': return <CommunicationsPage commsData={commsData} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} />
      case 'approvals': return <ApprovalsPage approvalsData={approvalsData} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} />
      case 'audit': return <AuditTrailPage eventsData={eventsData} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} />
      case 'organizations': return <OrganizationsPage orgsData={orgsData} openDetail={openDetail} />
      case 'reports': return <ReportsPage reportsData={reportsData} openDetail={openDetail} dashData={dashData} />
      default: return null
    }
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="gap-3">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
                  <MapPin className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-sm">GWS Platform</span>
                  <span className="text-[11px] text-slate-500">V2 — Uganda</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {grouped.map((g) => (
            <SidebarGroup key={g.group}>
              <SidebarGroupLabel>{g.group}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {g.items.map((item) => (
                    <SidebarMenuItem key={item.id + item.label}>
                      <SidebarMenuButton
                        isActive={page === item.id}
                        onClick={() => { setPage(item.id); setSearch(''); setSelectedIds(new Set()) }}
                        tooltip={item.label}
                      >
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" className="text-xs text-slate-500">
                <Database className="size-3.5" />
                <span>Prisma Postgres • 22 tables</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-3 border-b bg-white/80 backdrop-blur-sm px-4 sticky top-0 z-40">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex-1 flex items-center gap-2">
            <h1 className="text-sm font-semibold text-slate-900">
              {NAV_ITEMS.find(n => n.id === page)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 w-48 text-xs bg-slate-50 border-slate-200"
              />
            </div>
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 text-[10px] hidden sm:flex">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
              Live
            </Badge>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 pb-20">
          {renderPage()}
        </div>
      </SidebarInset>

      {selectedIds.size > 0 && (
        <BulkActionBar selectedCount={selectedIds.size} onClear={() => setSelectedIds(new Set())} onAction={handleBulkAction} />
      )}

      <Sheet open={detailPanel.open} onOpenChange={(open) => { if (!open) closeDetail() }}>
        <SheetContent side="right" className="w-full sm:w-[480px] sm:max-w-[480px] p-0">
          <SheetHeader className="p-6 pb-3 border-b">
            <SheetTitle className="text-base">
              {detailPanel.type === 'client' && (detailPanel.data?.company_name || `${detailPanel.data?.first_name} ${detailPanel.data?.last_name}`)}
              {detailPanel.type === 'project' && detailPanel.data?.title}
              {detailPanel.type === 'workflow' && detailPanel.data?.name}
              {detailPanel.type === 'observation' && detailPanel.data?.title}
              {detailPanel.type === 'sync' && `Sync Event`}
              {detailPanel.type === 'ai-model' && detailPanel.data?.display_name}
              {detailPanel.type === 'invoice' && detailPanel.data?.invoice_number}
              {detailPanel.type === 'quotation' && detailPanel.data?.quote_number}
              {detailPanel.type === 'document' && detailPanel.data?.title}
              {detailPanel.type === 'communication' && detailPanel.data?.subject}
              {detailPanel.type === 'approval' && detailPanel.data?.step_name}
              {detailPanel.type === 'event' && detailPanel.data?.event_type}
              {detailPanel.type === 'report' && detailPanel.data?.title}
            </SheetTitle>
            <SheetDescription>
              {detailPanel.type === 'client' && detailPanel.data?.client_ref}
              {detailPanel.type === 'project' && detailPanel.data?.project_ref}
              {detailPanel.type === 'workflow' && 'Workflow Details'}
              {detailPanel.type === 'observation' && detailPanel.data?.observation_type}
              {detailPanel.type === 'invoice' && `Invoice Details`}
              {detailPanel.type === 'quotation' && `Quotation Details`}
              {detailPanel.type === 'document' && detailPanel.data?.document_type}
              {detailPanel.type === 'communication' && detailPanel.data?.channel}
              {detailPanel.type === 'approval' && 'Approval Step'}
              {detailPanel.type === 'event' && detailPanel.data?.aggregate}
              {detailPanel.type === 'report' && detailPanel.data?.description}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 h-[calc(100vh-100px)]">
            <div className="p-6 space-y-5">
              {detailPanel.type === 'client' && <ClientDetail data={detailPanel.data} />}
              {detailPanel.type === 'project' && <ProjectDetail data={detailPanel.data} />}
              {detailPanel.type === 'workflow' && <WorkflowDetail data={detailPanel.data} />}
              {detailPanel.type === 'observation' && <ObservationDetail data={detailPanel.data} />}
              {detailPanel.type === 'sync' && <SyncDetail data={detailPanel.data} />}
              {detailPanel.type === 'ai-model' && <AIModelDetail data={detailPanel.data} />}
              {detailPanel.type === 'invoice' && <InvoiceDetail data={detailPanel.data} />}
              {detailPanel.type === 'quotation' && <QuotationDetail data={detailPanel.data} />}
              {detailPanel.type === 'document' && <DocumentDetail data={detailPanel.data} />}
              {detailPanel.type === 'communication' && <CommunicationDetail data={detailPanel.data} />}
              {detailPanel.type === 'approval' && <ApprovalDetail data={detailPanel.data} />}
              {detailPanel.type === 'event' && <DomainEventDetail data={detailPanel.data} />}
              {detailPanel.type === 'report' && <ReportDetail data={detailPanel.data} />}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  )
}

// ══════════════════════════════════════════════════════
// PAGE COMPONENTS
// ══════════════════════════════════════════════════════

function DashboardPage({ m, dashData, onNavigate, openDetail, clients, projects, financeData }: any) {
  const statusChartData = Object.entries(dashData?.projectByStatus || {}).map(([name, value]) => ({
    name: fmt(name), value: value as number, color: STATUS_COLORS[name] || '#94a3b8',
  }))
  const fm = financeData?.metrics || {}
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Clients', value: m.clients, icon: Users, sub: `${m.organizations} org` },
          { label: 'Active Projects', value: m.activeProjects, icon: Activity, sub: `${m.projects} total` },
          { label: 'Workflows Running', value: m.workflowInstances, icon: GitBranch, sub: 'in progress' },
          { label: 'Field Observations', value: m.observations, icon: Eye, sub: 'synced' },
        ].map(k => (
          <Card key={k.label} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
            if (k.label === 'Clients') onNavigate('clients')
            if (k.label.includes('Project')) onNavigate('projects')
            if (k.label.includes('Workflow')) onNavigate('workflows')
            if (k.label.includes('Observation')) onNavigate('field-sync')
          }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{k.label}</p>
                  <p className="text-2xl font-bold mt-0.5">{k.value}</p>
                  <p className="text-[11px] text-slate-400">{k.sub}</p>
                </div>
                <k.icon className="w-8 h-8 text-slate-300" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Invoiced', value: `UGX ${Number(fm.totalInvoiced || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600' },
          { label: 'Total Paid', value: `UGX ${Number(fm.totalPaid || 0).toLocaleString()}`, icon: CheckCircle2, color: 'text-blue-600' },
          { label: 'Outstanding', value: `UGX ${Number(fm.totalOutstanding || 0).toLocaleString()}`, icon: Clock, color: 'text-amber-600' },
          { label: 'Overdue', value: fm.overdueCount || 0, icon: AlertCircle, color: 'text-red-600' },
        ].map(k => (
          <Card key={k.label} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('finance')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{k.label}</p>
                  <p className="text-lg font-bold mt-0.5">{k.value}</p>
                </div>
                <k.icon className={`w-6 h-6 ${k.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Projects by Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip /><Legend fontSize={11} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Recent Projects</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onNavigate('projects')}>
                View All <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Project</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Client</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Priority</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(projects || []).slice(0, 5).map((p: ProjectRecord) => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openDetail('project', p)}>
                    <TableCell><div><p className="text-sm font-medium">{p.title}</p><p className="text-[11px] text-slate-400">{p.project_ref}</p></div></TableCell>
                    <TableCell className="hidden sm:table-cell text-xs">{p.client?.company_name || `${p.client?.first_name} ${p.client?.last_name}`}</TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="outline" className={`text-xs ${PRIORITY_BADGE[p.priority] || ''}`}>{p.priority}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { id: 'spatial' as PageId, label: 'Spatial Map', icon: Layers, desc: 'View projects & clients on map', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
          { id: 'workflows' as PageId, label: 'Workflow Engine', icon: Workflow, desc: 'Track approvals & processes', color: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
          { id: 'field-sync' as PageId, label: 'Field Sync', icon: RadioTower, desc: 'Mobile data synchronization', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
          { id: 'ai' as PageId, label: 'AI Insights', icon: Cpu, desc: 'Model registry & call logs', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
        ].map(q => (
          <Card key={q.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate(q.id)}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${q.color}`}><q.icon className="w-5 h-5" /></div>
              <div><p className="text-sm font-semibold">{q.label}</p><p className="text-[11px] text-slate-500">{q.desc}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Clients Page ──
function ClientsPage({ clients, search, openDetail, selectedIds, toggleSelect, toggleAll }: {
  clients: ClientRecord[]; search: string; openDetail: (t: string, d: any) => void
  selectedIds: Set<number>; toggleSelect: (id: number) => void; toggleAll: (ids: number[]) => void
}) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState('all')

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Client Directory</h2>
          <p className="text-sm text-slate-500">{filtered.length} clients found</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Filter status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs w-10"><Checkbox checked={filtered.length > 0 && filtered.every(c => selectedIds.has(c.id))} onCheckedChange={() => toggleAll(filtered.map(c => c.id))} /></TableHead>
              <TableHead className="text-xs"><SortableHeader label="Ref" field="client_ref" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs"><SortableHeader label="Name / Company" field="first_name" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs hidden sm:table-cell"><SortableHeader label="District" field="district" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs hidden md:table-cell">Contact</TableHead>
              <TableHead className="text-xs"><SortableHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs hidden lg:table-cell">Projects</TableHead>
              <TableHead className="text-xs w-8"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(c => (
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
        </CardContent>
      </Card>
    </div>
  )
}

// ── Projects Page ──
function ProjectsPage({ projects, search, openDetail, selectedIds, toggleSelect, toggleAll }: {
  projects: ProjectRecord[]; search: string; openDetail: (t: string, d: any) => void
  selectedIds: Set<number>; toggleSelect: (id: number) => void; toggleAll: (ids: number[]) => void
}) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState('all')

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Survey Projects</h2>
          <p className="text-sm text-slate-500">{filtered.length} projects</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="intake">Intake</SelectItem>
            <SelectItem value="field_survey">Field Survey</SelectItem>
            <SelectItem value="data_processing">Data Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs w-10"><Checkbox checked={filtered.length > 0 && filtered.every(p => selectedIds.has(p.id))} onCheckedChange={() => toggleAll(filtered.map(p => p.id))} /></TableHead>
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
              {filtered.map(p => (
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
        </CardContent>
      </Card>
    </div>
  )
}

// ── Workflows Page ──
function WorkflowsPage({ workflows, openDetail }: any) {
  return (
    <div className="space-y-6">
      {workflows.map((wf: any) => (
        <Card key={wf.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center"><GitBranch className="w-5 h-5 text-violet-600" /></div>
                <div><CardTitle className="text-base">{wf.name}</CardTitle><CardDescription className="text-xs">{wf.description}</CardDescription></div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{wf.steps.length} Steps</Badge>
                {wf.instances.length > 0 && <Badge className="bg-blue-100 text-blue-800">{wf.instances.length} Active</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start overflow-x-auto pb-4 gap-1">
              {wf.steps.map((step: any, idx: number) => {
                const isCurrent = wf.instances.some((i: any) => i.current_step_id === step.id)
                const isCompleted = wf.instances.some((inst: any) => inst.transitions.some((t: any) => t.toStep?.id === step.id))
                return (
                  <div key={step.id} className="flex items-start min-w-[130px]">
                    <div className="flex flex-col items-center flex-1 cursor-pointer" onClick={() => openDetail('workflow', { ...wf, selectedStep: step })}>
                      <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors
                        ${isCurrent ? 'border-blue-500 bg-blue-50 text-blue-600' : isCompleted ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-white text-slate-400'}`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.step_order}
                      </div>
                      <p className="text-[11px] font-medium mt-1.5 text-center">{step.name}</p>
                      <Badge variant="outline" className="text-[10px] mt-0.5">{step.step_type}</Badge>
                      {step.sla_hours && <p className="text-[10px] text-slate-400 mt-0.5">{step.sla_hours}h SLA</p>}
                    </div>
                    {idx < wf.steps.length - 1 && <ArrowRight className="w-4 h-4 text-slate-200 mt-3 shrink-0 -ml-0.5" />}
                  </div>
                )
              })}
            </div>
            {wf.instances.length > 0 && (
              <><Separator className="my-4" />
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Active Instances</h4>
                  {wf.instances.map((inst: any) => (
                    <div key={inst.id} className="p-3 rounded-lg border border-blue-200 bg-blue-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800 text-[11px]"><Activity className="w-3 h-3 mr-0.5" />In Progress</Badge>
                          <span className="text-[11px] text-slate-500">Started {new Date(inst.started_at).toLocaleDateString()}</span>
                        </div>
                        {inst.metadata?.client_name && <span className="text-[11px] text-slate-600">{inst.metadata.client_name}</span>}
                      </div>
                      <Progress value={((inst.current_step_order || 0) / wf.steps.length) * 100} className="h-1.5" />
                      <div className="mt-2 space-y-1">
                        {inst.transitions.map((t: any) => (
                          <div key={t.id} className="flex items-center gap-2 text-[11px] p-1.5 rounded bg-white/60">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="font-medium">{t.fromStep?.name || 'Start'}</span>
                            <ArrowRight className="w-3 h-3 text-slate-300" />
                            <span className="font-medium">{t.toStep.name}</span>
                            <span className="text-slate-400 ml-auto text-[10px]">{new Date(t.performed_at).toLocaleString('en-UG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Spatial Page ──
function SpatialPage({ spatial }: any) {
  const mapMarkers = [
    ...(spatial?.clients.map((c: any) => ({
      lat: Number(c.latitude), lng: Number(c.longitude),
      title: c.client_type === 'company' ? c.company_name : `${c.first_name} ${c.last_name}`,
      type: 'client' as const, status: c.status, description: c.district,
    })) || []),
    ...(spatial?.observations.map((o: any) => ({
      lat: Number(o.latitude), lng: Number(o.longitude),
      title: o.title, type: 'observation' as const, status: o.status, description: o.observation_type,
    })) || []),
  ]
  const mapPolygons = (spatial?.annotations?.filter((a: any) => a.feature_type === 'polygon' && a.geojson?.coordinates).map((a: any) => ({
    coordinates: a.geojson.coordinates[0], title: a.title || 'Boundary', color: a.properties?.color || '#3b82f6',
  })) || [])

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4">
      <Card className="overflow-hidden">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Map className="w-4 h-4 text-emerald-600" /> Interactive Map — Uganda</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div style={{ height: 'calc(100vh - 200px)', minHeight: '400px' }}>
            <SpatialMap markers={mapMarkers} polygons={mapPolygons} center={[0.3476, 32.5825]} zoom={9} />
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Layers</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {spatial?.layers.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between p-2 rounded bg-slate-50 text-sm">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.default_style?.color || '#3b82f6' }} /><span className="text-xs font-medium">{l.name}</span></div>
                  <Badge variant="outline" className="text-[10px]">{l.layer_type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Legend</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-500" /> Client</div>
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-red-500" /> Observation</div>
            <div className="flex items-center gap-2"><div className="w-4 h-2.5 rounded bg-emerald-500/30 border border-emerald-500" /> Boundary</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Annotations</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {spatial?.annotations.map((a: any) => (
              <div key={a.id} className="p-2 rounded bg-slate-50"><p className="text-xs font-medium">{a.title}</p><Badge variant="outline" className="text-[10px] mt-0.5">{a.feature_type}</Badge></div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Field Sync Page ──
function FieldSyncPage({ fieldSync, openDetail, selectedIds, toggleSelect, toggleAll }: any) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const handleSort = (field: string) => { if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc') } }

  const syncChartData = fieldSync?.syncEvents.map((e: any) => ({
    name: new Date(e.started_at).toLocaleDateString('en-UG', { month: 'short', day: 'numeric' }),
    Pushed: e.records_pushed, Pulled: e.records_pulled,
  })) || []

  const observations = fieldSync?.observations || []
  let sortedObs = [...observations]
  if (sortField) { sortedObs.sort((a: any, b: any) => { const av = (a[sortField] ?? '').toString().toLowerCase(); const bv = (b[sortField] ?? '').toString().toLowerCase(); return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av) }) }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Sync Events', value: fieldSync?.syncEvents?.length || 0, icon: RadioTower },
          { label: 'Records Pushed', value: fieldSync?.syncEvents?.reduce((s: number, e: any) => s + e.records_pushed, 0) || 0, icon: ArrowUpRight },
          { label: 'Records Pulled', value: fieldSync?.syncEvents?.reduce((s: number, e: any) => s + e.records_pulled, 0) || 0, icon: ArrowDownRight },
          { label: 'Conflicts', value: fieldSync?.syncEvents?.reduce((s: number, e: any) => s + e.conflicts_count, 0) || 0, icon: AlertCircle },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-[11px] text-slate-500 uppercase tracking-wide">{s.label}</p><p className="text-xl font-bold mt-0.5">{s.value}</p></div>
            <s.icon className="w-5 h-5 text-slate-300" />
          </CardContent></Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Crosshair className="w-4 h-4 text-emerald-600" /> Field Observations</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs w-10"><Checkbox checked={sortedObs.length > 0 && sortedObs.every((o: any) => selectedIds.has(o.id))} onCheckedChange={() => toggleAll(sortedObs.map((o: any) => o.id))} /></TableHead>
                <TableHead className="text-xs"><SortableHeader label="Title" field="title" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs hidden sm:table-cell"><SortableHeader label="Type" field="observation_type" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs hidden md:table-cell">GPS</TableHead>
                <TableHead className="text-xs"><SortableHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs w-8"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {sortedObs.map((o: any) => (
                  <TableRow key={o.id} className={`cursor-pointer hover:bg-slate-50 ${selectedIds.has(o.id) ? 'bg-emerald-50/50' : ''}`}>
                    <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(o.id)} onCheckedChange={() => toggleSelect(o.id)} /></TableCell>
                    <TableCell onClick={() => openDetail('observation', o)}><p className="text-sm font-medium">{o.title}</p><p className="text-[11px] text-slate-400 line-clamp-1">{o.description}</p></TableCell>
                    <TableCell className="hidden sm:table-cell text-xs capitalize" onClick={() => openDetail('observation', o)}>{fmt(o.observation_type)}</TableCell>
                    <TableCell className="hidden md:table-cell text-[11px] text-slate-500 font-mono" onClick={() => openDetail('observation', o)}>{Number(o.latitude).toFixed(4)}, {Number(o.longitude).toFixed(4)}</TableCell>
                    <TableCell onClick={() => openDetail('observation', o)}>{statusBadge(o.status)}</TableCell>
                    <TableCell onClick={() => openDetail('observation', o)}><ChevronRight className="w-4 h-4 text-slate-300" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Sync Activity</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={syncChartData}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} />
                  <RechartsTooltip /><Bar dataKey="Pushed" fill="#3b82f6" radius={[3, 3, 0, 0]} /><Bar dataKey="Pulled" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Sync Events</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {fieldSync?.syncEvents?.map((e: any) => (
                <div key={e.id} className="p-2.5 rounded-lg border cursor-pointer hover:border-blue-200 transition-colors" onClick={() => openDetail('sync', e)}>
                  <div className="flex items-center justify-between mb-1">
                    <Badge className={e.sync_type === 'push' ? 'bg-blue-100 text-blue-800 text-[10px]' : 'bg-emerald-100 text-emerald-800 text-[10px]'}>{e.sync_type.toUpperCase()}</Badge>
                    {statusBadge(e.status)}
                  </div>
                  <p className="text-[11px] text-slate-400">{new Date(e.started_at).toLocaleString()}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px]">
                    <span className="text-blue-600">↑{e.records_pushed}</span>
                    <span className="text-emerald-600">↓{e.records_pulled}</span>
                    {e.conflicts_count > 0 && <span className="text-red-600">⚠ {e.conflicts_count}</span>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ── AI Page ──
function AIPage({ aiData, openDetail }: any) {
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Cpu className="w-4 h-4 text-violet-600" /> AI Model Registry</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {aiData?.models.map((model: any) => (
              <div key={model.id} className="p-3 rounded-lg border cursor-pointer hover:border-violet-200 transition-colors" onClick={() => openDetail('ai-model', model)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{model.display_name}</span>
                  <Badge className={model.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}>{model.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <p className="text-xs text-slate-500">{model.provider} • {model.model_name}</p>
                {model.cost_per_1k_input && <p className="text-[11px] text-slate-400 mt-1">${Number(model.cost_per_1k_input).toFixed(4)}/1K in • ${Number(model.cost_per_1k_output).toFixed(4)}/1K out</p>}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /> Prompt Templates</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {aiData?.templates.map((t: any) => (
              <div key={t.id} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{t.name}</span>
                  <Badge variant="outline" className="text-[10px]">{t.aiModelVersion.display_name}</Badge>
                </div>
                <p className="text-xs text-slate-500">{t.description}</p>
                <Badge variant="outline" className="text-[10px] mt-1 font-mono">{t.slug}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">AI Call Log</CardTitle><CardDescription>Recent model invocations</CardDescription></CardHeader>
        <CardContent>
          {aiData?.callLogs?.length > 0 ? (
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Model</TableHead><TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">In/Out Tokens</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Cost</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Latency</TableHead>
                <TableHead className="text-xs">Time</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {aiData.callLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{log.aiModelVersion.display_name}</TableCell>
                    <TableCell>{statusBadge(log.status)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs">{log.input_tokens || '—'} / {log.output_tokens || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs">{log.cost_usd ? `$${Number(log.cost_usd).toFixed(6)}` : '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">{log.latency_ms ? `${log.latency_ms}ms` : '—'}</TableCell>
                    <TableCell className="text-[11px] text-slate-400">{new Date(log.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10"><Brain className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-sm text-slate-500">No AI calls logged yet</p></div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Finance Page ──
function FinancePage({ financeData, openDetail, selectedIds, toggleSelect, toggleAll }: any) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [tab, setTab] = useState<'invoices' | 'quotations'>('invoices')
  const [statusFilter, setStatusFilter] = useState('all')
  const handleSort = (field: string) => { if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc') } }

  const fm = financeData?.metrics || {}
  const invoices = financeData?.invoices || []
  const quotations = financeData?.quotations || []

  let filteredInvoices = statusFilter !== 'all' ? invoices.filter((i: any) => i.status === statusFilter) : invoices
  let filteredQuotations = statusFilter !== 'all' ? quotations.filter((q: any) => q.status === statusFilter) : quotations

  if (sortField) {
    const sorter = (a: any, b: any) => {
      const av = (a[sortField] ?? '').toString().toLowerCase(); const bv = (b[sortField] ?? '').toString().toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    }
    filteredInvoices = [...filteredInvoices].sort(sorter)
    filteredQuotations = [...filteredQuotations].sort(sorter)
  }

  const revenueChartData = invoices.reduce((acc: any[], inv: any) => {
    const month = new Date(inv.created_at).toLocaleDateString('en-UG', { month: 'short', year: '2-digit' })
    const existing = acc.find(a => a.name === month)
    if (existing) { existing.Invoiced += Number(inv.total_amount); if (inv.status === 'paid') existing.Paid += Number(inv.total_amount) }
    else acc.push({ name: month, Invoiced: Number(inv.total_amount), Paid: inv.status === 'paid' ? Number(inv.total_amount) : 0 })
    return acc
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Invoiced', value: `UGX ${Number(fm.totalInvoiced || 0).toLocaleString()}`, icon: Receipt, color: 'text-emerald-600' },
          { label: 'Total Paid', value: `UGX ${Number(fm.totalPaid || 0).toLocaleString()}`, icon: CheckCircle2, color: 'text-blue-600' },
          { label: 'Outstanding', value: `UGX ${Number(fm.totalOutstanding || 0).toLocaleString()}`, icon: Clock, color: 'text-amber-600' },
          { label: 'Overdue', value: fm.overdueCount || 0, icon: AlertCircle, color: 'text-red-600' },
          { label: 'Quotations', value: fm.quotationCount || 0, icon: DollarSign, color: 'text-violet-600' },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{k.label}</p><p className="text-lg font-bold mt-0.5">{k.value}</p></div>
              <k.icon className={`w-6 h-6 ${k.color}`} />
            </div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Revenue Overview</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} />
              <RechartsTooltip /><Bar dataKey="Invoiced" fill="#94a3b8" radius={[3, 3, 0, 0]} /><Bar dataKey="Paid" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button size="sm" variant={tab === 'invoices' ? 'default' : 'outline'} onClick={() => { setTab('invoices'); setStatusFilter('all') }}>Invoices ({invoices.length})</Button>
        <Button size="sm" variant={tab === 'quotations' ? 'default' : 'outline'} onClick={() => { setTab('quotations'); setStatusFilter('all') }}>Quotations ({quotations.length})</Button>
        <div className="ml-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Filter status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {tab === 'invoices' ? (
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs w-10"><Checkbox checked={filteredInvoices.length > 0 && filteredInvoices.every((i: any) => selectedIds.has(i.id))} onCheckedChange={() => toggleAll(filteredInvoices.map((i: any) => i.id))} /></TableHead>
                <TableHead className="text-xs"><SortableHeader label="Invoice #" field="invoice_number" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Client</TableHead>
                <TableHead className="text-xs"><SortableHeader label="Amount" field="total_amount" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs"><SortableHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs hidden md:table-cell">Due Date</TableHead>
                <TableHead className="text-xs w-8"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredInvoices.map((inv: any) => (
                  <TableRow key={inv.id} className={`cursor-pointer hover:bg-slate-50 ${selectedIds.has(inv.id) ? 'bg-emerald-50/50' : ''}`}>
                    <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(inv.id)} onCheckedChange={() => toggleSelect(inv.id)} /></TableCell>
                    <TableCell className="font-mono text-xs" onClick={() => openDetail('invoice', inv)}>{inv.invoice_number}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs" onClick={() => openDetail('invoice', inv)}>{inv.client?.company_name || `${inv.client?.first_name} ${inv.client?.last_name}`}</TableCell>
                    <TableCell className="text-sm font-semibold" onClick={() => openDetail('invoice', inv)}>UGX {Number(inv.total_amount).toLocaleString()}</TableCell>
                    <TableCell onClick={() => openDetail('invoice', inv)}>{statusBadge(inv.status)}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-slate-500" onClick={() => openDetail('invoice', inv)}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</TableCell>
                    <TableCell onClick={() => openDetail('invoice', inv)}><ChevronRight className="w-4 h-4 text-slate-300" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs w-10"><Checkbox checked={filteredQuotations.length > 0 && filteredQuotations.every((q: any) => selectedIds.has(q.id))} onCheckedChange={() => toggleAll(filteredQuotations.map((q: any) => q.id))} /></TableHead>
                <TableHead className="text-xs">Quotation #</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Client</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Valid Until</TableHead>
                <TableHead className="text-xs w-8"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredQuotations.map((q: any) => (
                  <TableRow key={q.id} className={`cursor-pointer hover:bg-slate-50 ${selectedIds.has(q.id) ? 'bg-emerald-50/50' : ''}`}>
                    <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(q.id)} onCheckedChange={() => toggleSelect(q.id)} /></TableCell>
                    <TableCell className="font-mono text-xs" onClick={() => openDetail('quotation', q)}>{q.quote_number}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs" onClick={() => openDetail('quotation', q)}>{q.client?.company_name || `${q.client?.first_name} ${q.client?.last_name}`}</TableCell>
                    <TableCell className="text-sm font-semibold" onClick={() => openDetail('quotation', q)}>UGX {Number(q.amount || q.total_amount || 0).toLocaleString()}</TableCell>
                    <TableCell onClick={() => openDetail('quotation', q)}>{statusBadge(q.status)}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-slate-500" onClick={() => openDetail('quotation', q)}>{q.valid_until ? new Date(q.valid_until).toLocaleDateString() : '—'}</TableCell>
                    <TableCell onClick={() => openDetail('quotation', q)}><ChevronRight className="w-4 h-4 text-slate-300" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Documents Page ──
function DocumentsPage({ documentsData, openDetail, selectedIds, toggleSelect, toggleAll }: any) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [typeFilter, setTypeFilter] = useState('all')
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
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Filter by type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {docTypes.map(t => <SelectItem key={t} value={t}>{fmt(t)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs w-10"><Checkbox checked={filtered.length > 0 && filtered.every((d: any) => selectedIds.has(d.id))} onCheckedChange={() => toggleAll(filtered.map((d: any) => d.id))} /></TableHead>
              <TableHead className="text-xs"><SortableHeader label="Title" field="title" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs hidden sm:table-cell"><SortableHeader label="Type" field="document_type" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs hidden md:table-cell">Client</TableHead>
              <TableHead className="text-xs">Verification</TableHead>
              <TableHead className="text-xs hidden lg:table-cell">Size</TableHead>
              <TableHead className="text-xs w-8"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((doc: any) => (
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
        </CardContent>
      </Card>
    </div>
  )
}

// ── Communications Page ──
function CommunicationsPage({ commsData, openDetail, selectedIds, toggleSelect, toggleAll }: any) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [channelFilter, setChannelFilter] = useState('all')
  const handleSort = (field: string) => { if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc') } }

  const metrics = commsData?.metrics || {}
  const comms = commsData?.communications || []
  const channels = Object.keys(metrics.byChannel || {})

  let filtered = channelFilter !== 'all' ? comms.filter((c: any) => c.channel === channelFilter) : comms
  if (sortField) {
    filtered = [...filtered].sort((a: any, b: any) => {
      const av = (a[sortField] ?? '').toString().toLowerCase(); const bv = (b[sortField] ?? '').toString().toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }

  const channelChartData = Object.entries(metrics.byChannel || {}).map(([name, value]) => ({ name: fmt(name), value: value as number, color: name === 'sms' ? '#10b981' : name === 'email' ? '#3b82f6' : '#f59e0b' }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Messages', value: metrics.total || 0, icon: MessageSquare },
          { label: 'Channels', value: channels.length, icon: Radio },
          { label: 'Outbound', value: (metrics.byDirection as any)?.outbound || 0, icon: ArrowUpRight },
          { label: 'Inbound', value: (metrics.byDirection as any)?.inbound || 0, icon: ArrowDownRight },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p><p className="text-xl font-bold mt-0.5">{k.value}</p></div>
            <k.icon className="w-5 h-5 text-slate-300" />
          </CardContent></Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Channel Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={channelChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                  {channelChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip /><Legend fontSize={11} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Messages</CardTitle>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Filter channel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {channels.map(c => <SelectItem key={c} value={c}>{fmt(c)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs w-10"><Checkbox checked={filtered.length > 0 && filtered.every((c: any) => selectedIds.has(c.id))} onCheckedChange={() => toggleAll(filtered.map((c: any) => c.id))} /></TableHead>
                <TableHead className="text-xs"><SortableHeader label="Subject" field="subject" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs hidden sm:table-cell"><SortableHeader label="Channel" field="channel" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs hidden md:table-cell">Direction</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Client</TableHead>
                <TableHead className="text-xs"><SortableHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs w-8"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((c: any) => (
                  <TableRow key={c.id} className={`cursor-pointer hover:bg-slate-50 ${selectedIds.has(c.id) ? 'bg-emerald-50/50' : ''}`}>
                    <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} /></TableCell>
                    <TableCell onClick={() => openDetail('communication', c)}><p className="text-sm font-medium">{c.subject || 'No Subject'}</p><p className="text-[11px] text-slate-400 line-clamp-1">{c.body?.substring(0, 60)}</p></TableCell>
                    <TableCell className="hidden sm:table-cell" onClick={() => openDetail('communication', c)}><Badge variant="outline" className="text-[10px]">{fmt(c.channel)}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell" onClick={() => openDetail('communication', c)}>
                      <Badge className={c.direction === 'outbound' ? 'bg-blue-100 text-blue-800 text-[10px]' : 'bg-emerald-100 text-emerald-800 text-[10px]'}>{fmt(c.direction)}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs" onClick={() => openDetail('communication', c)}>{c.client?.company_name || `${c.client?.first_name} ${c.client?.last_name}`}</TableCell>
                    <TableCell onClick={() => openDetail('communication', c)}>{statusBadge(c.status)}</TableCell>
                    <TableCell onClick={() => openDetail('communication', c)}><ChevronRight className="w-4 h-4 text-slate-300" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Approvals Page ──
function ApprovalsPage({ approvalsData, openDetail, selectedIds, toggleSelect, toggleAll }: any) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState('all')
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Steps', value: metrics.total || 0, icon: ShieldCheck },
          { label: 'Approved', value: metrics.approved || 0, icon: CheckCircle2 },
          { label: 'Pending', value: metrics.pending || 0, icon: Clock },
          { label: 'Deferred', value: metrics.deferred || 0, icon: AlertCircle },
        ].map(k => (
          <Card key={k.label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(k.label === 'Total Steps' ? 'all' : k.label.toLowerCase())}>
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p><p className="text-xl font-bold mt-0.5">{k.value}</p></div>
              <k.icon className="w-5 h-5 text-slate-300" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="deferred">Deferred</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs w-10"><Checkbox checked={filtered.length > 0 && filtered.every((a: any) => selectedIds.has(a.id))} onCheckedChange={() => toggleAll(filtered.map((a: any) => a.id))} /></TableHead>
              <TableHead className="text-xs"><SortableHeader label="Step" field="step_name" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs hidden sm:table-cell">Project</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Client</TableHead>
              <TableHead className="text-xs">Order</TableHead>
              <TableHead className="text-xs"><SortableHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
              <TableHead className="text-xs hidden lg:table-cell">Approver</TableHead>
              <TableHead className="text-xs w-8"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((a: any) => (
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
        </CardContent>
      </Card>
    </div>
  )
}

// ── Audit Trail Page ──
function AuditTrailPage({ eventsData, openDetail, selectedIds, toggleSelect, toggleAll }: any) {
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [typeFilter, setTypeFilter] = useState('all')
  const handleSort = (field: string) => { if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc') } }

  const metrics = eventsData?.metrics || {}
  const events = eventsData?.events || []
  const eventTypes = Object.keys(metrics.byType || {})

  let filtered = typeFilter !== 'all' ? events.filter((e: any) => e.event_type === typeFilter) : events
  if (sortField) {
    filtered = [...filtered].sort((a: any, b: any) => {
      const av = (a[sortField] ?? '').toString().toLowerCase(); const bv = (b[sortField] ?? '').toString().toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }

  const typeChartData = Object.entries(metrics.byType || {}).slice(0, 8).map(([name, value]) => ({ name: fmt(name), count: value as number }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: 'Total Events', value: metrics.total || 0, icon: ScrollText },
          { label: 'Event Types', value: eventTypes.length, icon: Layers },
          { label: 'Aggregates', value: Object.keys(metrics.byAggregate || {}).length, icon: Database },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p><p className="text-xl font-bold mt-0.5">{k.value}</p></div>
            <k.icon className="w-5 h-5 text-slate-300" />
          </CardContent></Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Events by Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" fontSize={11} /><YAxis dataKey="name" type="category" fontSize={10} width={80} />
                <RechartsTooltip /><Bar dataKey="count" fill="#6366f1" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Domain Events</CardTitle>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Filter by type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {eventTypes.map(t => <SelectItem key={t} value={t}>{fmt(t)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs w-10"><Checkbox checked={filtered.length > 0 && filtered.every((e: any) => selectedIds.has(e.id))} onCheckedChange={() => toggleAll(filtered.map((e: any) => e.id))} /></TableHead>
                <TableHead className="text-xs"><SortableHeader label="Event Type" field="event_type" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs hidden sm:table-cell"><SortableHeader label="Aggregate" field="aggregate" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs hidden md:table-cell">Aggregate ID</TableHead>
                <TableHead className="text-xs"><SortableHeader label="Time" field="created_at" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs w-8"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.slice(0, 50).map((e: any) => (
                  <TableRow key={e.id} className={`cursor-pointer hover:bg-slate-50 ${selectedIds.has(e.id) ? 'bg-emerald-50/50' : ''}`}>
                    <TableCell onClick={ev => ev.stopPropagation()}><Checkbox checked={selectedIds.has(e.id)} onCheckedChange={() => toggleSelect(e.id)} /></TableCell>
                    <TableCell onClick={() => openDetail('event', e)}><Badge variant="outline" className="text-[10px] font-mono">{fmt(e.event_type)}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell text-xs" onClick={() => openDetail('event', e)}>{fmt(e.aggregate)}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-[11px] text-slate-500" onClick={() => openDetail('event', e)}>{e.aggregate_id}</TableCell>
                    <TableCell className="text-[11px] text-slate-400" onClick={() => openDetail('event', e)}>{new Date(e.created_at).toLocaleString()}</TableCell>
                    <TableCell onClick={() => openDetail('event', e)}><ChevronRight className="w-4 h-4 text-slate-300" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Organizations Page ──
function OrganizationsPage({ orgsData, openDetail }: any) {
  const organizations = orgsData?.organizations || []
  const branches = orgsData?.branches || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: 'Organizations', value: organizations.length, icon: Building2 },
          { label: 'Branches', value: branches.length, icon: Network },
          { label: 'Total Clients', value: organizations.reduce((s: number, o: any) => s + (o._count?.clients || 0), 0), icon: Users },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p><p className="text-xl font-bold mt-0.5">{k.value}</p></div>
            <k.icon className="w-5 h-5 text-slate-300" />
          </CardContent></Card>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Organizations</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org: any) => (
            <Card key={org.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-emerald-600" /></div>
                  <div>
                    <CardTitle className="text-sm">{org.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono mt-0.5">{org.slug}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-lg font-bold text-emerald-600">{org._count?.clients || 0}</p><p className="text-[10px] text-slate-500">Clients</p></div>
                  <div><p className="text-lg font-bold text-blue-600">{org.branches?.length || 0}</p><p className="text-[10px] text-slate-500">Branches</p></div>
                  <div><p className="text-lg font-bold text-violet-600">{org._count?.workflowDefinitions || 0}</p><p className="text-[10px] text-slate-500">Workflows</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Branches</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Branch</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Organization</TableHead>
                <TableHead className="text-xs">Clients</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Workflows</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {branches.map((b: any) => (
                  <TableRow key={b.id} className="hover:bg-slate-50">
                    <TableCell><div><p className="text-sm font-medium">{b.name}</p><Badge variant="outline" className="text-[10px] font-mono">{b.slug}</Badge></div></TableCell>
                    <TableCell className="hidden sm:table-cell text-xs">{b.organization?.name || '—'}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[11px]">{b._count?.clients || 0}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="secondary" className="text-[11px]">{b._count?.workflowInstances || 0}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// DETAIL PANEL COMPONENTS
// ══════════════════════════════════════════════════════

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><p className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</p><p className="text-sm mt-0.5">{value || '—'}</p></div>
}

function ClientDetail({ data }: { data: ClientRecord }) {
  if (!data) return null
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-700">
          {data.client_type === 'company' ? (data.company_name?.[0] || 'C') : `${data.first_name?.[0] || ''}${data.last_name?.[0] || ''}`}
        </div>
        <div>
          <p className="font-semibold">{data.client_type === 'company' ? data.company_name : `${data.first_name} ${data.last_name}`}</p>
          {statusBadge(data.status)}
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Client Ref" value={<span className="font-mono">{data.client_ref}</span>} />
        <DetailField label="Type" value={<span className="capitalize">{data.client_type}</span>} />
        <DetailField label="District" value={data.district} />
        <DetailField label="Organization" value={data.organization?.name} />
        <DetailField label="Branch" value={data.branch?.name} />
        <DetailField label="Phone" value={data.phone} />
        <DetailField label="Email" value={data.email} />
        {data.latitude && <DetailField label="Coordinates" value={<span className="font-mono text-xs">{Number(data.latitude).toFixed(4)}, {Number(data.longitude).toFixed(4)}</span>} />}
      </div>
      <Separator />
      <div>
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Related Projects ({data.surveyProjects.length})</h4>
        {data.surveyProjects.length > 0 ? data.surveyProjects.map(p => (
          <div key={p.id} className="flex items-center justify-between p-2 rounded bg-slate-50 mb-1.5">
            <div><p className="text-sm font-medium">{p.title}</p><p className="text-[11px] text-slate-400">{p.project_ref}</p></div>
            {statusBadge(p.status)}
          </div>
        )) : <p className="text-sm text-slate-400">No projects yet</p>}
      </div>
      <div>
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Invoices ({data.invoices.length})</h4>
        {data.invoices.length > 0 ? data.invoices.map(i => (
          <div key={i.id} className="flex items-center justify-between p-2 rounded bg-slate-50 mb-1.5">
            <span className="text-sm font-mono">{i.invoice_number}</span>
            <div className="flex items-center gap-2"><span className="text-sm font-semibold">UGX {Number(i.total_amount).toLocaleString()}</span>{statusBadge(i.status)}</div>
          </div>
        )) : <p className="text-sm text-slate-400">No invoices yet</p>}
      </div>
    </div>
  )
}

function ProjectDetail({ data }: { data: ProjectRecord }) {
  if (!data) return null
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center"><MapPin className="w-6 h-6 text-blue-600" /></div>
        <div>
          <p className="font-semibold">{data.title}</p>
          <div className="flex items-center gap-2 mt-1">{statusBadge(data.status)}<Badge variant="outline" className={`text-xs ${PRIORITY_BADGE[data.priority] || ''}`}>{data.priority}</Badge></div>
        </div>
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

function WorkflowDetail({ data }: any) {
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

function ObservationDetail({ data }: any) {
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

function SyncDetail({ data }: any) {
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

function AIModelDetail({ data }: any) {
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

// ── NEW Detail Panels ──

function InvoiceDetail({ data }: any) {
  if (!data) return null
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center"><Receipt className="w-6 h-6 text-emerald-600" /></div>
        <div>
          <p className="font-semibold">{data.invoice_number}</p>
          {statusBadge(data.status)}
        </div>
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

function QuotationDetail({ data }: any) {
  if (!data) return null
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center"><DollarSign className="w-6 h-6 text-blue-600" /></div>
        <div>
          <p className="font-semibold">{data.quote_number}</p>
          {statusBadge(data.status)}
        </div>
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

function DocumentDetail({ data }: any) {
  if (!data) return null
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center"><FileText className="w-6 h-6 text-amber-600" /></div>
        <div>
          <p className="font-semibold">{data.title}</p>
          <Badge variant="outline" className={`text-[10px] mt-0.5 ${data.is_verified ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
            {data.is_verified ? '✓ Verified' : 'Unverified'}
          </Badge>
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Document Type" value={fmt(data.document_type)} />
        <DetailField label="MIME Type" value={<span className="font-mono text-xs">{data.mime_type}</span>} />
        <DetailField label="Client" value={data.client?.company_name || `${data.client?.first_name} ${data.client?.last_name}`} />
        <DetailField label="File Size" value={data.file_size ? `${(Number(data.file_size) / 1024).toFixed(1)} KB` : '—'} />
        <DetailField label="File Path" value={<span className="font-mono text-[11px] break-all">{data.file_path}</span>} />
        <DetailField label="Uploaded By" value={data.uploaded_by} />
        <DetailField label="Created" value={new Date(data.created_at).toLocaleString()} />
      </div>
      {data.description && <><Separator /><DetailField label="Description" value={data.description} /></>}
    </div>
  )
}

function CommunicationDetail({ data }: any) {
  if (!data) return null
  return (
    <div className="space-y-5">
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

function ApprovalDetail({ data }: any) {
  if (!data) return null
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-amber-600" /></div>
        <div>
          <p className="font-semibold">{fmt(data.step_name)}</p>
          {statusBadge(data.status)}
        </div>
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

function DomainEventDetail({ data }: any) {
  if (!data) return null
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center"><ScrollText className="w-6 h-6 text-slate-600" /></div>
        <div>
          <p className="font-semibold">{fmt(data.event_type)}</p>
          <Badge variant="outline" className="text-[10px] font-mono mt-0.5">{data.aggregate}</Badge>
        </div>
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
      {data.payload && <><Separator />
        <div>
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Payload</h4>
          <pre className="text-[11px] bg-slate-50 p-3 rounded-lg overflow-auto max-h-80">{JSON.stringify(data.payload, null, 2)}</pre>
        </div>
      </>}
      {data.metadata && <><Separator />
        <div>
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Metadata</h4>
          <pre className="text-[11px] bg-slate-50 p-3 rounded-lg overflow-auto max-h-40">{JSON.stringify(data.metadata, null, 2)}</pre>
        </div>
      </>}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// REPORTS PAGE & DETAIL
// ══════════════════════════════════════════════════════

function exportCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = row[h]
      if (val === null || val === undefined) return ''
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`
      const str = String(val).replace(/"/g, '""')
      return str.includes(',') || str.includes('\n') ? `"${str}"` : str
    }).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${filename}.csv`; a.click()
  URL.revokeObjectURL(url)
}

function ReportsPage({ reportsData, openDetail, dashData }: any) {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'financial' | 'clients' | 'workflows' | 'spatial' | 'ai' | 'audit'>('overview')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const pr = reportsData?.projectReport || {}
  const fr = reportsData?.financialReport || {}
  const cr = reportsData?.clientReport || {}
  const wr = reportsData?.workflowReport || {}
  const sr = reportsData?.spatialReport || {}
  const ar = reportsData?.aiReport || {}
  const aur = reportsData?.auditReport || {}

  const generatedAt = reportsData?.generatedAt ? new Date(reportsData.generatedAt).toLocaleString() : '—'

  const REPORT_TABS = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart2 },
    { id: 'projects' as const, label: 'Projects', icon: MapPin },
    { id: 'financial' as const, label: 'Financial', icon: Receipt },
    { id: 'clients' as const, label: 'Clients', icon: Users },
    { id: 'workflows' as const, label: 'Workflows', icon: GitBranch },
    { id: 'spatial' as const, label: 'Spatial & Field', icon: Crosshair },
    { id: 'ai' as const, label: 'AI Usage', icon: Cpu },
    { id: 'audit' as const, label: 'Audit Trail', icon: ScrollText },
  ]

  const projectStatusData = (pr.byStatus || []).map((s: any) => ({
    name: fmt(s.status), value: s.count, color: STATUS_COLORS[s.status] || '#94a3b8',
  }))

  const projectTypeData = (pr.byType || []).map((t: any) => ({
    name: fmt(t.type), count: t.count,
  }))

  const financialMonthData = Object.entries(fr.byMonth || {}).map(([name, data]: [string, any]) => ({
    name, Invoiced: data.invoiced, Paid: data.paid,
  }))

  const clientStatusData = (cr.byStatus || []).map((s: any) => ({
    name: fmt(s.status), value: s.count, color: STATUS_COLORS[s.status] || '#94a3b8',
  }))

  const workflowStatusData = Object.entries(wr.byStatus || {}).map(([name, count]) => ({
    name: fmt(name), value: count as number, color: name === 'completed' ? '#10b981' : name === 'in_progress' ? '#3b82f6' : '#94a3b8',
  }))

  const spatialTypeData = Object.entries(sr.byType || {}).map(([name, count]) => ({
    name: fmt(name), count: count as number,
  }))

  const aiModelData = Object.entries(ar.byModel || {}).map(([name, data]: [string, any]) => ({
    name, Calls: data.calls, Cost: Number(data.cost).toFixed(2), Tokens: data.tokens,
  }))

  const auditTypeData = Object.entries(aur.byType || {}).slice(0, 8).map(([name, count]) => ({
    name: fmt(name), count: count as number,
  }))

  const auditDateData = Object.entries(aur.byDate || {}).slice(0, 14).map(([name, count]) => ({
    name, Events: count as number,
  }))

  const syncDateData = Object.entries(sr.syncByDate || {}).map(([name, data]: [string, any]) => ({
    name, Pushed: data.pushed, Pulled: data.pulled, Conflicts: data.conflicts,
  }))

  return (
    <div className="space-y-6">
      {/* Header with date filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Reports & Analytics</h2>
          <p className="text-sm text-slate-500">Comprehensive platform reports — Generated {generatedAt}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 w-32 text-xs" placeholder="From" />
            <span className="text-xs text-slate-400">to</span>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 w-32 text-xs" placeholder="To" />
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5 mr-1" />Print
          </Button>
        </div>
      </div>

      {/* Report tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b">
        {REPORT_TABS.map(tab => (
          <Button key={tab.id} size="sm" variant={activeTab === tab.id ? 'default' : 'ghost'}
            className={`h-8 text-xs whitespace-nowrap ${activeTab === tab.id ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
            onClick={() => setActiveTab(tab.id)}>
            <tab.icon className="w-3.5 h-3.5 mr-1.5" />{tab.label}
          </Button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Projects', value: pr.total || 0, sub: `${pr.overdue || 0} overdue`, icon: MapPin, color: 'text-blue-600' },
              { label: 'Revenue', value: `UGX ${Number(fr.totalInvoiced || 0).toLocaleString()}`, sub: `${fr.collectionRate || 0}% collected`, icon: DollarSign, color: 'text-emerald-600' },
              { label: 'Clients', value: cr.total || 0, sub: `${(cr.byType || []).find((t: any) => t.type === 'company')?.count || 0} companies`, icon: Users, color: 'text-violet-600' },
              { label: 'AI Calls', value: ar.totalCalls || 0, sub: `$${Number(ar.totalCost || 0).toFixed(2)} total cost`, icon: Cpu, color: 'text-amber-600' },
            ].map(k => (
              <Card key={k.label} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                if (k.label === 'Total Projects') setActiveTab('projects')
                if (k.label === 'Revenue') setActiveTab('financial')
                if (k.label === 'Clients') setActiveTab('clients')
                if (k.label === 'AI Calls') setActiveTab('ai')
              }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{k.label}</p>
                      <p className="text-xl font-bold mt-0.5">{k.value}</p>
                      <p className="text-[11px] text-slate-400">{k.sub}</p>
                    </div>
                    <k.icon className={`w-7 h-7 ${k.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Projects by Status</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setActiveTab('projects')}>Details</Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                      {projectStatusData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip /><Legend fontSize={11} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Revenue Trend</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setActiveTab('financial')}>Details</Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={financialMonthData}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} />
                    <RechartsTooltip /><Bar dataKey="Invoiced" fill="#94a3b8" radius={[3, 3, 0, 0]} /><Bar dataKey="Paid" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('workflows')}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center"><GitBranch className="w-5 h-5 text-violet-600" /></div>
                <div><p className="text-sm font-semibold">Workflows</p><p className="text-[11px] text-slate-500">{wr.instanceCount || 0} instances, {wr.avgCompletionHours || 0}h avg</p></div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('spatial')}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Crosshair className="w-5 h-5 text-blue-600" /></div>
                <div><p className="text-sm font-semibold">Field Operations</p><p className="text-[11px] text-slate-500">{sr.observationCount || 0} observations, {sr.syncEventCount || 0} syncs</p></div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('audit')}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center"><ScrollText className="w-5 h-5 text-slate-600" /></div>
                <div><p className="text-sm font-semibold">Audit Events</p><p className="text-[11px] text-slate-500">{aur.totalEvents || 0} events tracked</p></div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Projects Report Tab ── */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Total Projects', value: pr.total || 0 },
              { label: 'Overdue', value: pr.overdue || 0 },
              { label: 'Total Area', value: `${pr.totalAreaHectares || 0} ha` },
              { label: 'Districts', value: (pr.byDistrict || []).length },
              { label: 'Project Types', value: (pr.byType || []).length },
            ].map(k => (
              <Card key={k.label}><CardContent className="p-4">
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p>
                <p className="text-xl font-bold mt-0.5">{k.value}</p>
              </CardContent></Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Projects by Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3} dataKey="value">
                      {projectStatusData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip /><Legend fontSize={11} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Projects by Type</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={projectTypeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" fontSize={11} /><YAxis dataKey="name" type="category" fontSize={10} width={100} />
                    <RechartsTooltip /><Bar dataKey="count" fill="#3b82f6" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Recent Projects Detail</CardTitle>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => exportCSV(
                  (pr.recentProjects || []).map((p: any) => ({
                    Reference: p.project_ref, Title: p.title, Status: p.status, Priority: p.priority,
                    Type: p.project_type, District: p.district || '', Area_Hectares: p.area_hectares || '',
                    Client: p.client?.company_name || `${p.client?.first_name} ${p.client?.last_name}`,
                    Approval_Progress: `${p.approvedSteps}/${p.totalSteps}`, Created: p.created_at,
                  })),
                  'project-report'
                )}>
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">Ref</TableHead>
                  <TableHead className="text-xs">Title</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Client</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Type</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Approval</TableHead>
                  <TableHead className="text-xs w-8"></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(pr.recentProjects || []).map((p: any) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openDetail('report', {
                      title: p.title,
                      description: `Project Report — ${p.project_ref}`,
                      reportType: 'project',
                      data: p,
                    })}>
                      <TableCell className="font-mono text-xs">{p.project_ref}</TableCell>
                      <TableCell><p className="text-sm font-medium">{p.title}</p><p className="text-[11px] text-slate-400">{p.district || 'No district'}</p></TableCell>
                      <TableCell className="hidden sm:table-cell text-xs">{p.client?.company_name || `${p.client?.first_name} ${p.client?.last_name}`}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs capitalize">{fmt(p.project_type)}</TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <Progress value={p.totalSteps > 0 ? (p.approvedSteps / p.totalSteps) * 100 : 0} className="h-1.5 w-16" />
                          <span className="text-[11px] text-slate-400">{p.approvedSteps}/{p.totalSteps}</span>
                        </div>
                      </TableCell>
                      <TableCell><ChevronRight className="w-4 h-4 text-slate-300" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Financial Report Tab ── */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Total Invoiced', value: `UGX ${Number(fr.totalInvoiced || 0).toLocaleString()}` },
              { label: 'Total Paid', value: `UGX ${Number(fr.totalPaid || 0).toLocaleString()}` },
              { label: 'Outstanding', value: `UGX ${Number(fr.totalOutstanding || 0).toLocaleString()}` },
              { label: 'Collection Rate', value: `${fr.collectionRate || 0}%` },
              { label: 'Overdue Amount', value: `UGX ${Number(fr.overdueAmount || 0).toLocaleString()}` },
            ].map(k => (
              <Card key={k.label}><CardContent className="p-4">
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p>
                <p className="text-lg font-bold mt-0.5">{k.value}</p>
              </CardContent></Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Revenue by Month</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={financialMonthData}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} />
                    <RechartsTooltip /><Legend /><Bar dataKey="Invoiced" fill="#94a3b8" radius={[3, 3, 0, 0]} /><Bar dataKey="Paid" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Top Debtors</CardTitle>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => exportCSV(
                    (fr.topDebtors || []).map((d: any) => ({ Client: d.client, Client_Ref: d.clientRef, Outstanding: d.outstanding, Invoice_Count: d.invoiceCount })),
                    'top-debtors-report'
                  )}>
                    <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-xs">Client</TableHead>
                    <TableHead className="text-xs">Outstanding</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Invoices</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(fr.topDebtors || []).map((d: any, i: number) => (
                      <TableRow key={i} className="hover:bg-slate-50">
                        <TableCell><p className="text-sm font-medium">{d.client}</p><p className="text-[11px] text-slate-400 font-mono">{d.clientRef}</p></TableCell>
                        <TableCell className="text-sm font-semibold text-red-600">UGX {Number(d.outstanding).toLocaleString()}</TableCell>
                        <TableCell className="hidden sm:table-cell"><Badge variant="secondary" className="text-[11px]">{d.invoiceCount}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Invoice Ledger</CardTitle>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => exportCSV(
                  (fr.invoices || []).map((i: any) => ({
                    Invoice: i.invoice_number, Client: i.client?.company_name || `${i.client?.first_name} ${i.client?.last_name}`,
                    Amount: i.total_amount, Status: i.status, Due_Date: i.due_date || '', Created: i.created_at,
                  })),
                  'invoice-ledger-report'
                )}>
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">Invoice #</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Client</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Due Date</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(fr.invoices || []).slice(0, 20).map((inv: any) => (
                    <TableRow key={inv.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => openDetail('report', {
                      title: inv.invoice_number,
                      description: 'Invoice Report',
                      reportType: 'invoice',
                      data: inv,
                    })}>
                      <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                      <TableCell className="hidden sm:table-cell text-xs">{inv.client?.company_name || `${inv.client?.first_name} ${inv.client?.last_name}`}</TableCell>
                      <TableCell className="text-sm font-semibold">UGX {Number(inv.total_amount).toLocaleString()}</TableCell>
                      <TableCell>{statusBadge(inv.status)}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-slate-500">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Clients Report Tab ── */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Clients', value: cr.total || 0 },
              { label: 'Companies', value: (cr.byType || []).find((t: any) => t.type === 'company')?.count || 0 },
              { label: 'Individuals', value: (cr.byType || []).find((t: any) => t.type === 'individual')?.count || 0 },
              { label: 'Districts', value: (cr.byDistrict || []).length },
            ].map(k => (
              <Card key={k.label}><CardContent className="p-4">
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p>
                <p className="text-xl font-bold mt-0.5">{k.value}</p>
              </CardContent></Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Clients by Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={clientStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3} dataKey="value">
                      {clientStatusData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip /><Legend fontSize={11} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Top Clients by Projects</CardTitle>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => exportCSV(
                    (cr.topClients || []).map((c: any) => ({
                      Name: c.name, Type: c.client_type, Status: c.status, District: c.district || '',
                      Organization: c.organization || '', Branch: c.branch || '',
                      Projects: c.projectCount, Invoices: c.invoiceCount, Documents: c.documentCount,
                    })),
                    'client-report'
                  )}>
                    <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-xs">Client</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Organization</TableHead>
                    <TableHead className="text-xs">Projects</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Invoices</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(cr.topClients || []).slice(0, 15).map((c: any) => (
                      <TableRow key={c.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => openDetail('report', {
                        title: c.name,
                        description: `Client Report — ${c.client_ref}`,
                        reportType: 'client',
                        data: c,
                      })}>
                        <TableCell><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-semibold">{c.name?.[0] || '?'}</div><div><p className="text-sm font-medium">{c.name}</p><p className="text-[10px] text-slate-400 capitalize">{c.client_type}</p></div></div></TableCell>
                        <TableCell className="hidden sm:table-cell text-xs">{c.organization || '—'}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[11px]">{c.projectCount}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-[11px]">{c.invoiceCount}</Badge></TableCell>
                        <TableCell>{statusBadge(c.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {(cr.byDistrict || []).length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Clients by District</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={(cr.byDistrict || []).slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="district" fontSize={11} /><YAxis fontSize={11} />
                    <RechartsTooltip /><Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Workflows Report Tab ── */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Definitions', value: wr.definitionCount || 0 },
              { label: 'Total Instances', value: wr.instanceCount || 0 },
              { label: 'Active', value: wr.activeCount || 0 },
              { label: 'Completed', value: wr.completedCount || 0 },
              { label: 'Avg Completion', value: `${wr.avgCompletionHours || 0}h` },
            ].map(k => (
              <Card key={k.label}><CardContent className="p-4">
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p>
                <p className="text-xl font-bold mt-0.5">{k.value}</p>
              </CardContent></Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Instances by Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={workflowStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3} dataKey="value">
                      {workflowStatusData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip /><Legend fontSize={11} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Workflow Definitions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(wr.definitions || []).map((d: any) => (
                  <div key={d.id} className="p-3 rounded-lg border cursor-pointer hover:border-violet-200 transition-colors" onClick={() => openDetail('report', {
                    title: d.name,
                    description: `Workflow Report — v${d.version}`,
                    reportType: 'workflow',
                    data: d,
                  })}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{d.name}</span>
                      <Badge variant="outline" className="text-[10px]">v{d.version}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>{d.stepCount} steps</span>
                      <span>{d.instanceCount} instances</span>
                      <span className="capitalize">{fmt(d.triggerType)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Spatial & Field Report Tab ── */}
      {activeTab === 'spatial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Observations', value: sr.observationCount || 0 },
              { label: 'Sync Events', value: sr.syncEventCount || 0 },
              { label: 'Records Synced', value: (sr.totalPushed || 0) + (sr.totalPulled || 0) },
              { label: 'Conflicts', value: sr.totalConflicts || 0 },
            ].map(k => (
              <Card key={k.label}><CardContent className="p-4">
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p>
                <p className="text-xl font-bold mt-0.5">{k.value}</p>
              </CardContent></Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Observations by Type</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={spatialTypeData}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={11} />
                    <RechartsTooltip /><Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Sync Activity</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={syncDateData}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={11} />
                    <RechartsTooltip /><Legend /><Bar dataKey="Pushed" fill="#3b82f6" radius={[3, 3, 0, 0]} /><Bar dataKey="Pulled" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Field Accuracy Summary</CardTitle>
                <Badge variant="outline" className="text-xs">Avg Accuracy: {sr.avgAccuracy || 0}m</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                {Object.entries(sr.byStatus || {}).map(([status, count]) => (
                  <div key={status} className="p-3 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{fmt(status)}</span>
                      <span className="text-lg font-bold">{count as number}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── AI Usage Report Tab ── */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Calls', value: ar.totalCalls || 0 },
              { label: 'Success Rate', value: `${ar.successRate || 0}%` },
              { label: 'Total Cost', value: `$${Number(ar.totalCost || 0).toFixed(2)}` },
              { label: 'Avg Latency', value: `${ar.avgLatency || 0}ms` },
            ].map(k => (
              <Card key={k.label}><CardContent className="p-4">
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p>
                <p className="text-xl font-bold mt-0.5">{k.value}</p>
              </CardContent></Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Usage by Model</CardTitle>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => exportCSV(
                    aiModelData.map((m: any) => ({ Model: m.name, Calls: m.Calls, Cost_USD: m.Cost, Tokens: m.Tokens })),
                    'ai-usage-report'
                  )}>
                    <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={aiModelData}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={11} />
                    <RechartsTooltip /><Bar dataKey="Calls" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Token & Cost Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-violet-50"><p className="text-[11px] text-violet-600 uppercase tracking-wide">Input Tokens</p><p className="text-xl font-bold text-violet-700">{(ar.totalInputTokens || 0).toLocaleString()}</p></div>
                  <div className="p-3 rounded-lg bg-blue-50"><p className="text-[11px] text-blue-600 uppercase tracking-wide">Output Tokens</p><p className="text-xl font-bold text-blue-700">{(ar.totalOutputTokens || 0).toLocaleString()}</p></div>
                </div>
                <div className="space-y-2">
                  {(Object.entries(ar.byModel || {}) as [string, any][]).map(([name, data]) => (
                    <div key={name} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                      <div><p className="text-sm font-medium">{name}</p><p className="text-[11px] text-slate-400">{data.calls} calls, {data.tokens.toLocaleString()} tokens</p></div>
                      <span className="text-sm font-semibold">${Number(data.cost).toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Audit Trail Report Tab ── */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Events', value: aur.totalEvents || 0 },
              { label: 'Event Types', value: Object.keys(aur.byType || {}).length },
              { label: 'Aggregates', value: Object.keys(aur.byAggregate || {}).length },
              { label: 'Active Days', value: Object.keys(aur.byDate || {}).length },
            ].map(k => (
              <Card key={k.label}><CardContent className="p-4">
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p>
                <p className="text-xl font-bold mt-0.5">{k.value}</p>
              </CardContent></Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Events by Type</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={auditTypeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" fontSize={11} /><YAxis dataKey="name" type="category" fontSize={10} width={90} />
                    <RechartsTooltip /><Bar dataKey="count" fill="#6366f1" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Event Timeline</CardTitle>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => exportCSV(
                    (aur.recentEvents || []).map((e: any) => ({
                      Event_Type: e.event_type, Aggregate: e.aggregate,
                      Aggregate_ID: e.aggregate_id, Created_At: e.created_at,
                    })),
                    'audit-trail-report'
                  )}>
                    <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={auditDateData}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={11} />
                    <RechartsTooltip /><Line type="monotone" dataKey="Events" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Aggregate Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(aur.byAggregate || {}).map(([name, count]) => (
                  <div key={name} className="p-3 rounded-lg bg-slate-50 flex items-center justify-between">
                    <span className="text-sm font-medium">{fmt(name)}</span>
                    <Badge variant="secondary" className="text-[11px]">{count as number}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// ── Report Detail Panel ──
function ReportDetail({ data }: any) {
  if (!data) return null
  const rt = data.reportType

  if (rt === 'project') {
    const p = data.data
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center"><MapPin className="w-6 h-6 text-blue-600" /></div>
          <div>
            <p className="font-semibold">{p.title}</p>
            <div className="flex items-center gap-2 mt-1">{statusBadge(p.status)}<Badge variant="outline" className={`text-xs ${PRIORITY_BADGE[p.priority] || ''}`}>{p.priority}</Badge></div>
          </div>
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
          <div className="space-y-2">
            <Progress value={p.totalSteps > 0 ? (p.approvedSteps / p.totalSteps) * 100 : 0} className="h-2" />
            <p className="text-sm text-slate-600">{p.approvedSteps} of {p.totalSteps} steps approved</p>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Field Observations</h4>
          <p className="text-sm text-slate-600">{p.observationsCount} observations recorded</p>
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
          <div>
            <p className="font-semibold">{inv.invoice_number}</p>
            {statusBadge(inv.status)}
          </div>
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
          <div>
            <p className="font-semibold">{c.name}</p>
            <div className="flex items-center gap-2 mt-1">{statusBadge(c.status)}<Badge variant="outline" className="text-[10px] capitalize">{c.client_type}</Badge></div>
          </div>
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
          <div>
            <p className="font-semibold">{w.name}</p>
            <Badge variant="outline" className="text-[10px]">v{w.version} • {fmt(w.triggerType)}</Badge>
          </div>
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
