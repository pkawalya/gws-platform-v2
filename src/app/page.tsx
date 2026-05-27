'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger,
} from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { MapPin, Search, Database, LayoutDashboard, Users, ShieldCheck, Receipt, GitBranch, Smartphone, Layers, Brain, ScrollText, MessageSquare, FileText, Building2, BarChart2 } from 'lucide-react'

// Platform components
import type { PageId, ClientRecord, ProjectRecord, DetailPanelState, NavItem } from '@/components/platform/types'
import { BulkActionBar } from '@/components/platform/helpers'
import { DashboardPage } from '@/components/platform/dashboard-page'
import { ClientsPage } from '@/components/platform/clients-page'
import { ProjectsPage } from '@/components/platform/projects-page'
import { WorkflowsPage } from '@/components/platform/workflows-page'
import { SpatialPage } from '@/components/platform/spatial-page'
import { FieldSyncPage } from '@/components/platform/field-sync-page'
import { AIPage } from '@/components/platform/ai-page'
import { FinancePage } from '@/components/platform/finance-page'
import { DocumentsPage } from '@/components/platform/documents-page'
import { CommunicationsPage } from '@/components/platform/communications-page'
import { ApprovalsPage } from '@/components/platform/approvals-page'
import { AuditTrailPage } from '@/components/platform/audit-trail-page'
import { OrganizationsPage } from '@/components/platform/organizations-page'
import { ReportsPage } from '@/components/platform/reports-page'
import {
  ClientDetail, ProjectDetail, WorkflowDetail, ObservationDetail, SyncDetail,
  AIModelDetail, InvoiceDetail, QuotationDetail, DocumentDetail, CommunicationDetail,
  ApprovalDetail, DomainEventDetail, ReportDetail,
} from '@/components/platform/detail-panels'

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
  const [detailPanel, setDetailPanel] = useState<DetailPanelState>({ open: false, type: '', data: null })
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

  const NAV_ITEMS: NavItem[] = [
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
  }, [] as Array<{ group: string; items: NavItem[] }>)

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
      case 'projects': return <ProjectsPage projects={projects} clients={clients} search={search} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} />
      case 'workflows': return <WorkflowsPage workflows={workflows} openDetail={openDetail} />
      case 'spatial': return <SpatialPage spatial={spatial} />
      case 'field-sync': return <FieldSyncPage fieldSync={fieldSync} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} />
      case 'ai': return <AIPage aiData={aiData} openDetail={openDetail} />
      case 'finance': return <FinancePage financeData={financeData} clients={clients} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} />
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
