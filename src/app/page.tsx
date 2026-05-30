'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger,
} from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
// Sheet and ScrollArea removed - using full page detail view
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Search, Database, LayoutDashboard, Users, ShieldCheck, Receipt, GitBranch, Smartphone, Layers, Brain, ScrollText, MessageSquare, FileText, Building2, BarChart2, Moon, Sun, Command, Settings, Shield } from 'lucide-react'
import { toast } from 'sonner'

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
import { SettingsPage } from '@/components/platform/settings-page'
import { RolePermissionsPage } from '@/components/platform/role-permissions-page'
import { NotificationCenter } from '@/components/platform/notification-center'
import { CommandPalette } from '@/components/platform/command-palette'
import { DetailPage } from '@/components/platform/detail-page'

// ── Dark Mode Hook ──
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('gws-dark-mode')
    const prefersDark = saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (prefersDark) document.documentElement.classList.add('dark')
    return prefersDark
  })
  const toggle = useCallback(() => {
    setDark(prev => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      localStorage.setItem('gws-dark-mode', String(next))
      return next
    })
  }, [])
  return { dark, toggle }
}

// ── Data fetcher map ──
async function fetchEndpoint(endpoint: string) {
  const res = await fetch(endpoint)
  if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`)
  return res.json()
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
  const [detailPanel, setDetailPanel] = useState<DetailPanelState>({ open: false, type: '', data: null })
  const [detailReturnPage, setDetailReturnPage] = useState<PageId>('dashboard')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [commandOpen, setCommandOpen] = useState(false)

  const { dark, toggle: toggleDark } = useDarkMode()

  // ── Toast wrapper ──
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      toast.success(message, { duration: 3000 })
    } else {
      toast.error(message, { duration: 4000 })
    }
  }, [])

  // ── Refresh Data Function ──
  const refreshData = useCallback(async (endpoints?: string[]) => {
    const allEndpoints: Record<string, () => Promise<void>> = {
      '/api/dashboard': async () => { const d = await fetchEndpoint('/api/dashboard'); setDashData(d) },
      '/api/clients': async () => { const c = await fetchEndpoint('/api/clients'); setClients(c) },
      '/api/projects': async () => { const p = await fetchEndpoint('/api/projects'); setProjects(p) },
      '/api/workflows': async () => { const w = await fetchEndpoint('/api/workflows'); setWorkflows(w) },
      '/api/spatial': async () => { const s = await fetchEndpoint('/api/spatial'); setSpatial(s) },
      '/api/field-sync': async () => { const f = await fetchEndpoint('/api/field-sync'); setFieldSync(f) },
      '/api/ai': async () => { const a = await fetchEndpoint('/api/ai'); setAiData(a) },
      '/api/finance': async () => { const fin = await fetchEndpoint('/api/finance'); setFinanceData(fin) },
      '/api/documents': async () => { const docs = await fetchEndpoint('/api/documents'); setDocumentsData(docs) },
      '/api/communications': async () => { const comms = await fetchEndpoint('/api/communications'); setCommsData(comms) },
      '/api/approvals': async () => { const approvals = await fetchEndpoint('/api/approvals'); setApprovalsData(approvals) },
      '/api/events': async () => { const events = await fetchEndpoint('/api/events'); setEventsData(events) },
      '/api/organizations': async () => { const orgs = await fetchEndpoint('/api/organizations'); setOrgsData(orgs) },
      '/api/reports': async () => { const reps = await fetchEndpoint('/api/reports'); setReportsData(reps) },
    }

    const toRefresh = endpoints || Object.keys(allEndpoints)
    try {
      await Promise.all(toRefresh.map(ep => allEndpoints[ep]?.()))
    } catch (e) {
      console.error('Refresh error:', e)
    }
  }, [])

  const refreshWithDashboard = useCallback(async (endpoints: string[]) => {
    const eps = new Set([...endpoints, '/api/dashboard'])
    await refreshData(Array.from(eps))
  }, [refreshData])

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

  // ── Bulk Action Handler ──
  const handleBulkAction = useCallback(async (action: string) => {
    const idsArray = Array.from(selectedIds)
    if (idsArray.length === 0) return

    try {
      if (page === 'clients') {
        if (action.startsWith('status-')) {
          const status = action.replace('status-', '')
          await fetch('/api/clients/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'status-change', ids: idsArray, status }),
          })
          showToast('success', `${idsArray.length} clients updated to ${status}`)
        } else if (action === 'delete') {
          await fetch('/api/clients/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', ids: idsArray }),
          })
          showToast('success', `${idsArray.length} clients deleted`)
        } else if (action === 'export') {
          const res = await fetch('/api/clients/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'export', ids: idsArray }),
          })
          if (res.ok) {
            const data = await res.json()
            const csv = convertToCSV(data.data)
            downloadCSV(csv, 'clients-export.csv')
            showToast('success', 'Export downloaded')
          }
        }
        await refreshWithDashboard(['/api/clients'])
      } else if (page === 'projects') {
        if (action.startsWith('status-')) {
          const status = action.replace('status-', '')
          await fetch('/api/projects/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'status-change', ids: idsArray, status }),
          })
          showToast('success', `${idsArray.length} projects updated to ${status}`)
        } else if (action === 'delete') {
          await fetch('/api/projects/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', ids: idsArray }),
          })
          showToast('success', `${idsArray.length} projects deleted`)
        } else if (action === 'export') {
          const res = await fetch('/api/projects/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'export', ids: idsArray }),
          })
          if (res.ok) {
            const data = await res.json()
            const csv = convertToCSV(data.data)
            downloadCSV(csv, 'projects-export.csv')
            showToast('success', 'Export downloaded')
          }
        }
        await refreshWithDashboard(['/api/projects'])
      } else if (page === 'finance') {
        if (action.startsWith('status-')) {
          const status = action.replace('status-', '')
          await Promise.all(idsArray.map(id =>
            fetch(`/api/invoices/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status }),
            })
          ))
          showToast('success', `${idsArray.length} invoices updated`)
        }
        await refreshWithDashboard(['/api/finance'])
      } else if (page === 'approvals') {
        if (action.startsWith('status-')) {
          const status = action.replace('status-', '')
          await Promise.all(idsArray.map(id =>
            fetch(`/api/approvals/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status }),
            })
          ))
          showToast('success', `${idsArray.length} approvals updated`)
        }
        await refreshWithDashboard(['/api/approvals'])
      } else if (page === 'documents') {
        if (action.startsWith('status-') && action === 'status-active') {
          await Promise.all(idsArray.map(id =>
            fetch(`/api/documents/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ is_verified: true }),
            })
          ))
          showToast('success', `${idsArray.length} documents verified`)
        } else if (action === 'delete') {
          await Promise.all(idsArray.map(id =>
            fetch(`/api/documents/${id}`, { method: 'DELETE' })
          ))
          showToast('success', `${idsArray.length} documents deleted`)
        }
        await refreshWithDashboard(['/api/documents'])
      } else if (page === 'communications') {
        if (action.startsWith('status-')) {
          const status = action.replace('status-', '') === 'active' ? 'delivered' : action.replace('status-', '')
          await Promise.all(idsArray.map(id =>
            fetch(`/api/communications/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: status || 'delivered' }),
            })
          ))
          showToast('success', `${idsArray.length} communications updated`)
        }
        await refreshWithDashboard(['/api/communications'])
      }
    } catch (e) {
      console.error('Bulk action error:', e)
      showToast('error', 'Bulk action failed')
    }

    setSelectedIds(new Set())
  }, [selectedIds, page, refreshWithDashboard, showToast])

  useEffect(() => {
    async function fetchAll() {
      const endpoints = [
        { key: 'dashboard', url: '/api/dashboard' },
        { key: 'clients', url: '/api/clients' },
        { key: 'projects', url: '/api/projects' },
        { key: 'workflows', url: '/api/workflows' },
        { key: 'spatial', url: '/api/spatial' },
        { key: 'field-sync', url: '/api/field-sync' },
        { key: 'ai', url: '/api/ai' },
        { key: 'finance', url: '/api/finance' },
        { key: 'documents', url: '/api/documents' },
        { key: 'communications', url: '/api/communications' },
        { key: 'approvals', url: '/api/approvals' },
        { key: 'events', url: '/api/events' },
        { key: 'organizations', url: '/api/organizations' },
        { key: 'reports', url: '/api/reports' },
      ]

      try {
        const dashRes = await fetchEndpoint('/api/dashboard')
        setDashData(dashRes)
        setLoading(false)
      } catch (e) {
        console.error('Dashboard fetch failed:', e)
        setLoading(false)
      }

      const remaining = endpoints.filter(e => e.key !== 'dashboard')
      const results = await Promise.allSettled(
        remaining.map(async (ep) => {
          try {
            const data = await fetchEndpoint(ep.url)
            return { key: ep.key, data }
          } catch (e) {
            console.error(`Failed to fetch ${ep.url}:`, e)
            return { key: ep.key, data: null }
          }
        })
      )

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value?.data) {
          const { key, data } = result.value
          switch (key) {
            case 'clients': setClients(data); break
            case 'projects': setProjects(data); break
            case 'workflows': setWorkflows(data); break
            case 'spatial': setSpatial(data); break
            case 'field-sync': setFieldSync(data); break
            case 'ai': setAiData(data); break
            case 'finance': setFinanceData(data); break
            case 'documents': setDocumentsData(data); break
            case 'communications': setCommsData(data); break
            case 'approvals': setApprovalsData(data); break
            case 'events': setEventsData(data); break
            case 'organizations': setOrgsData(data); break
            case 'reports': setReportsData(data); break
          }
        }
      }
    }
    fetchAll()
  }, [])

  // ── Command Palette Keyboard Shortcut ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const openDetail = (type: string, data: any) => {
    setDetailReturnPage(page)
    setDetailPanel({ open: true, type, data })
  }
  const closeDetail = () => {
    setDetailPanel({ open: false, type: '', data: null })
  }

  const getRefreshEndpoints = (type: string): string[] => {
    switch (type) {
      case 'client': return ['/api/clients', '/api/dashboard']
      case 'project': return ['/api/projects', '/api/dashboard']
      case 'approval': return ['/api/approvals', '/api/projects', '/api/dashboard']
      case 'invoice': return ['/api/finance', '/api/dashboard']
      case 'document': return ['/api/documents', '/api/dashboard']
      case 'communication': return ['/api/communications', '/api/dashboard']
      default: return ['/api/dashboard']
    }
  }

  const handleDetailRefresh = useCallback(() => {
    const endpoints = getRefreshEndpoints(detailPanel.type)
    refreshData(endpoints)
    // Also update the detail data from refreshed lists
    if (detailPanel.data) {
      let updatedData = null
      if (detailPanel.type === 'client') updatedData = clients.find(c => c.id === detailPanel.data.id)
      if (detailPanel.type === 'project') updatedData = projects.find(p => p.id === detailPanel.data.id)
      if (updatedData) setDetailPanel(prev => ({ ...prev, data: updatedData }))
    }
  }, [detailPanel.type, detailPanel.data, refreshData, clients, projects])

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
    { id: 'role-permissions', label: 'Roles & Permissions', icon: Shield, group: 'System' },
    { id: 'reports', label: 'Reports', icon: BarChart2, group: 'Intelligence' },
    { id: 'settings', label: 'Settings', icon: Settings, group: 'System' },
  ]

  const grouped = NAV_ITEMS.reduce((acc, item) => {
    const g = acc.find(a => a.group === item.group)
    if (g) g.items.push(item); else acc.push({ group: item.group, items: [item] })
    return acc
  }, [] as Array<{ group: string; items: NavItem[] }>)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground">GWS Platform V2</h2>
          <p className="text-sm text-muted-foreground">Connecting to Prisma Postgres...</p>
        </div>
      </div>
    )
  }

  // ── Skeleton loading for initial data fetch ──
  const SkeletonDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center gap-2">
        <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
        <div className="h-8 w-28 bg-slate-200 rounded animate-pulse" />
        <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 h-72 bg-slate-100 rounded-lg animate-pulse" />
        <div className="lg:col-span-3 h-72 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    </div>
  )

  const m = dashData?.metrics || {}

  const pageRefreshMap: Record<string, () => void> = {
    clients: () => refreshWithDashboard(['/api/clients']),
    projects: () => refreshWithDashboard(['/api/projects']),
    finance: () => refreshWithDashboard(['/api/finance']),
    documents: () => refreshWithDashboard(['/api/documents']),
    communications: () => refreshWithDashboard(['/api/communications']),
    approvals: () => refreshWithDashboard(['/api/approvals']),
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage m={m} dashData={dashData} onNavigate={setPage} openDetail={openDetail} clients={clients} projects={projects} financeData={financeData} eventsData={eventsData} />
      case 'clients': return <ClientsPage clients={clients} search={search} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} onRefresh={pageRefreshMap.clients} onToast={showToast} />
      case 'projects': return <ProjectsPage projects={projects} clients={clients} search={search} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} onRefresh={pageRefreshMap.projects} onToast={showToast} />
      case 'workflows': return <WorkflowsPage workflows={workflows} openDetail={openDetail} />
      case 'spatial': return <SpatialPage spatial={spatial} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} projects={projects} />
      case 'field-sync': return <FieldSyncPage fieldSync={fieldSync} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} />
      case 'ai': return <AIPage aiData={aiData} openDetail={openDetail} />
      case 'finance': return <FinancePage financeData={financeData} clients={clients} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} onRefresh={pageRefreshMap.finance} onToast={showToast} />
      case 'documents': return <DocumentsPage documentsData={documentsData} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} clients={clients} onRefresh={pageRefreshMap.documents} />
      case 'communications': return <CommunicationsPage commsData={commsData} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} clients={clients} onRefresh={pageRefreshMap.communications} />
      case 'approvals': return <ApprovalsPage approvalsData={approvalsData} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} onRefresh={pageRefreshMap.approvals} />
      case 'audit': return <AuditTrailPage eventsData={eventsData} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} />
      case 'organizations': return <OrganizationsPage orgsData={orgsData} openDetail={openDetail} />
      case 'reports': return <ReportsPage reportsData={reportsData} openDetail={openDetail} dashData={dashData} />
      case 'role-permissions': return <RolePermissionsPage onToast={showToast} />
      case 'settings': return <SettingsPage darkMode={dark} toggleDarkMode={toggleDark} />
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
                  <span className="text-[11px] text-muted-foreground">V2 — Uganda</span>
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
                        isActive={page === item.id || (detailPanel.open && ((detailPanel.type === 'client' && item.id === 'clients') || (detailPanel.type === 'project' && item.id === 'projects') || (detailPanel.type === 'invoice' && item.id === 'finance') || (detailPanel.type === 'approval' && item.id === 'approvals') || (detailPanel.type === 'document' && item.id === 'documents') || (detailPanel.type === 'communication' && item.id === 'communications') || (detailPanel.type === 'event' && item.id === 'audit') || (detailPanel.type === 'organization' && item.id === 'organizations')))}
                        onClick={() => { setPage(item.id); setSearch(''); setSelectedIds(new Set()); closeDetail() }}
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
              <SidebarMenuButton size="sm" className="text-xs text-muted-foreground">
                <Database className="size-3.5" />
                <span>Prisma Postgres • 22 tables</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-3 border-b bg-background/80 backdrop-blur-sm px-4 sticky top-0 z-40">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex-1 flex items-center gap-2">
            <h1 className="text-sm font-semibold">
              {detailPanel.open ? (() => {
                const typeLabels: Record<string, string> = {
                  client: 'Client Details', project: 'Project Details', workflow: 'Workflow', observation: 'Observation',
                  sync: 'Sync Event', 'ai-model': 'AI Model', invoice: 'Invoice', quotation: 'Quotation',
                  document: 'Document', communication: 'Message', approval: 'Approval',
                  event: 'Event', report: 'Report', organization: 'Organization', layer: 'Layer',
                }
                return typeLabels[detailPanel.type] || 'Details'
              })() : (NAV_ITEMS.find(n => n.id === page)?.label || 'Dashboard')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Command Palette Trigger */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 hidden sm:flex items-center gap-2 text-xs text-muted-foreground w-48 justify-start"
              onClick={() => setCommandOpen(true)}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search...</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            {/* Notification Center */}
            <NotificationCenter events={eventsData?.events || eventsData?.domainEvents || []} onNavigate={(p) => { setPage(p as PageId); setSearch(''); setSelectedIds(new Set()) }} />
            {/* Dark Mode Toggle */}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={toggleDark} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 text-[10px] hidden sm:flex dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
              Live
            </Badge>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 pb-20">
          {detailPanel.open ? (
            <DetailPage
              type={detailPanel.type}
              data={detailPanel.data}
              onBack={closeDetail}
              onRefresh={handleDetailRefresh}
              onNavigate={(p) => { setPage(p); setSearch(''); setSelectedIds(new Set()) }}
              openDetail={(type, data) => { setDetailReturnPage(detailReturnPage); openDetail(type, data) }}
              clients={clients}
              projects={projects}
              documentsData={documentsData}
              commsData={commsData}
            />
          ) : (
            renderPage()
          )}
        </div>
      </SidebarInset>

      {selectedIds.size > 0 && !detailPanel.open && (
        <BulkActionBar selectedCount={selectedIds.size} onClear={() => setSelectedIds(new Set())} onAction={handleBulkAction} />
      )}

      {/* Command Palette */}
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onNavigate={(p) => { setPage(p); setSearch(''); setSelectedIds(new Set()) }}
        openDetail={openDetail}
        clients={clients}
        projects={projects}
        invoices={financeData?.invoices || []}
        workflows={workflows}
      />
    </SidebarProvider>
  )
}

// ── CSV Helpers ──
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return ''
  const keys = Object.keys(data[0]).filter(k => !k.startsWith('_') && typeof data[0][k] !== 'object')
  const header = keys.join(',')
  const rows = data.map(row =>
    keys.map(k => {
      const val = row[k]
      if (val === null || val === undefined) return ''
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }).join(',')
  )
  return [header, ...rows].join('\n')
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
