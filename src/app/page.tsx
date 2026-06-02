'use client'

import { useEffect, useCallback, useMemo, useState } from 'react'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Search, Database, LayoutDashboard, Users, ShieldCheck, Receipt, GitBranch, Smartphone, Layers, Brain, ScrollText, MessageSquare, FileText, Building2, BarChart2, Moon, Sun, Settings, Shield, FileCheck, LogOut, Lock } from 'lucide-react'
import { useOffline } from '@/hooks/use-offline'
import { OfflineIndicator } from '@/components/platform/offline-indicator'

// Auth
import { useAuth } from '@/components/auth-provider'
import { AuthGuard } from '@/components/auth-guard'
import { PAGE_PERMISSIONS } from '@/lib/permissions'

// Zustand Store
import { useGWSStore } from '@/lib/store'

// Platform components
import type { NavItem } from '@/components/platform/types'
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
import { SurveyReportsPage } from '@/components/platform/survey-reports-page'
import { SettingsPage } from '@/components/platform/settings-page'
import { RolePermissionsPage } from '@/components/platform/role-permissions-page'
import { NotificationCenter } from '@/components/platform/notification-center'
import { CommandPalette } from '@/components/platform/command-palette'
import { DetailPage } from '@/components/platform/detail-page'

// ── Main App ──
export default function GWSPlatform() {
  const { user, roleDisplayName, roleColor, permissions, isAuthenticated, signOut } = useAuth()
  const offline = useOffline()

  // ── Zustand Store ──
  const page = useGWSStore(s => s.page)
  const detailPanel = useGWSStore(s => s.detailPanel)
  const dashData = useGWSStore(s => s.dashData)
  const clients = useGWSStore(s => s.clients)
  const projects = useGWSStore(s => s.projects)
  const workflows = useGWSStore(s => s.workflows)
  const spatial = useGWSStore(s => s.spatial)
  const fieldSync = useGWSStore(s => s.fieldSync)
  const aiData = useGWSStore(s => s.aiData)
  const financeData = useGWSStore(s => s.financeData)
  const documentsData = useGWSStore(s => s.documentsData)
  const commsData = useGWSStore(s => s.commsData)
  const approvalsData = useGWSStore(s => s.approvalsData)
  const eventsData = useGWSStore(s => s.eventsData)
  const orgsData = useGWSStore(s => s.orgsData)
  const reportsData = useGWSStore(s => s.reportsData)
  const search = useGWSStore(s => s.search)
  const selectedIds = useGWSStore(s => s.selectedIds)
  const commandOpen = useGWSStore(s => s.commandOpen)
  const loading = useGWSStore(s => s.loading)
  const darkMode = useGWSStore(s => s.darkMode)

  const setPage = useGWSStore(s => s.setPage)
  const openDetail = useGWSStore(s => s.openDetail)
  const closeDetail = useGWSStore(s => s.closeDetail)
  const setSearch = useGWSStore(s => s.setSearch)
  const setCommandOpen = useGWSStore(s => s.setCommandOpen)
  const toggleDarkMode = useGWSStore(s => s.toggleDarkMode)
  const toggleSelect = useGWSStore(s => s.toggleSelect)
  const toggleAll = useGWSStore(s => s.toggleAll)
  const clearSelection = useGWSStore(s => s.clearSelection)
  const showToast = useGWSStore(s => s.showToast)
  const refreshData = useGWSStore(s => s.refreshData)
  const refreshWithDashboard = useGWSStore(s => s.refreshWithDashboard)
  const fetchAllData = useGWSStore(s => s.fetchAllData)
  const handleBulkAction = useGWSStore(s => s.handleBulkAction)

  // ── 2FA Badge State (read from localStorage) ──
  const [twoFAEnabled, setTwoFAEnabled] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('gws-2fa-enabled') === 'true'
  })

  // ── Initialize accent color and compact mode on mount ──
  useEffect(() => {
    const accent = localStorage.getItem('gws-accent-color') || 'emerald'
    document.documentElement.setAttribute('data-accent', accent)

    if (localStorage.getItem('gws-compact-mode') === 'true') {
      document.documentElement.classList.add('compact-mode')
    }

    // Listen for 2FA changes (from settings page)
    const check2FA = () => {
      setTwoFAEnabled(localStorage.getItem('gws-2fa-enabled') === 'true')
    }
    window.addEventListener('storage', check2FA)
    const interval = setInterval(check2FA, 2000)

    return () => {
      window.removeEventListener('storage', check2FA)
      clearInterval(interval)
    }
  }, [])

  // ── Initial Data Fetch ──
  useEffect(() => { fetchAllData() }, [fetchAllData])

  // ── Command Palette Keyboard Shortcut ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(!commandOpen)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandOpen, setCommandOpen])

  // ── Detail Refresh ──
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
  }, [detailPanel.type, refreshData])

  // ── Navigation Items ──
  const ALL_NAV_ITEMS: NavItem[] = useMemo(() => [
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
    { id: 'survey-reports', label: 'Survey Reports', icon: FileCheck, group: 'Core' },
    { id: 'settings', label: 'Settings', icon: Settings, group: 'System' },
  ], [clients, projects, approvalsData, financeData, workflows, fieldSync, eventsData, commsData, documentsData])

  const NAV_ITEMS = useMemo(() => {
    if (!isAuthenticated) return []
    if (permissions.includes('*')) return ALL_NAV_ITEMS
    return ALL_NAV_ITEMS.filter(item => {
      const requiredPerms = PAGE_PERMISSIONS[item.id]
      if (!requiredPerms) return true
      return requiredPerms.some(p => permissions.includes(p))
    })
  }, [isAuthenticated, permissions, ALL_NAV_ITEMS])

  const grouped = NAV_ITEMS.reduce((acc, item) => {
    const g = acc.find(a => a.group === item.group)
    if (g) g.items.push(item); else acc.push({ group: item.group, items: [item] })
    return acc
  }, [] as Array<{ group: string; items: NavItem[] }>)

  // ── Loading Screen ──
  if (loading) {
    return (
      <AuthGuard currentPage={page}>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground">GWS Platform V2</h2>
            <p className="text-sm text-muted-foreground">Connecting to Prisma Postgres...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const m = dashData?.metrics || {}

  const pageRefreshMap: Record<string, () => void> = {
    clients: () => refreshWithDashboard(['/api/clients']),
    projects: () => refreshWithDashboard(['/api/projects']),
    finance: () => refreshWithDashboard(['/api/finance']),
    documents: () => refreshWithDashboard(['/api/documents']),
    communications: () => refreshWithDashboard(['/api/communications']),
    approvals: () => refreshWithDashboard(['/api/approvals']),
    workflows: () => refreshWithDashboard(['/api/workflows']),
  }

  const navigateTo = (p: string) => { setPage(p as any); setSearch(''); clearSelection() }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage m={m} dashData={dashData} onNavigate={setPage} openDetail={openDetail} clients={clients} projects={projects} financeData={financeData} eventsData={eventsData} />
      case 'clients': return <ClientsPage clients={clients} search={search} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} onRefresh={pageRefreshMap.clients} onToast={showToast} />
      case 'projects': return <ProjectsPage projects={projects} clients={clients} search={search} openDetail={openDetail} selectedIds={selectedIds} toggleSelect={toggleSelect} toggleAll={toggleAll} onRefresh={pageRefreshMap.projects} onToast={showToast} />
      case 'workflows': return <WorkflowsPage workflows={workflows} openDetail={openDetail} onToast={showToast} onRefresh={() => refreshWithDashboard(['/api/workflows'])} projects={projects} clients={clients} />
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
      case 'survey-reports': return <SurveyReportsPage clients={clients} projects={projects} onToast={showToast} onRefresh={() => refreshWithDashboard(['/api/projects', '/api/clients'])} />
      case 'role-permissions': return <RolePermissionsPage onToast={showToast} />
      case 'settings': return <SettingsPage darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      default: return null
    }
  }

  return (
    <AuthGuard currentPage={page}>
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
                        onClick={() => { setPage(item.id); setSearch(''); clearSelection(); closeDetail() }}
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
            {user && (
              <SidebarMenuItem>
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs font-bold">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none min-w-0">
                    <span className="text-xs font-medium text-foreground truncate">{user.name}</span>
                    <div className="flex items-center gap-1">
                      {roleDisplayName && (
                        <Badge
                          variant="outline"
                          className="h-4 px-1 text-[9px] font-medium border-0"
                          style={{ backgroundColor: roleColor ? `${roleColor}20` : undefined, color: roleColor || undefined }}
                        >
                          {roleDisplayName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </SidebarMenuItem>
            )}
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
                  'survey-report': 'Survey Report',
                }
                return typeLabels[detailPanel.type] || 'Details'
              })() : (ALL_NAV_ITEMS.find(n => n.id === page)?.label || 'Dashboard')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
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
            <NotificationCenter events={eventsData?.events || eventsData?.domainEvents || []} onNavigate={(p) => navigateTo(p)} />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={toggleDarkMode} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <OfflineIndicator
              isOnline={offline.isOnline}
              isSyncing={offline.isSyncing}
              syncQueueCount={offline.syncQueueCount}
              lastSyncTime={offline.lastSyncTime}
              onSyncNow={offline.syncNow}
            />
            {user && (
              <div className="flex items-center gap-1.5 ml-1 pl-2 border-l">
                <div className="flex items-center gap-1.5 h-8 px-2 rounded-md hover:bg-accent transition-colors">
                  <div className="flex items-center justify-center size-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-[10px] font-bold">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs text-foreground font-medium hidden sm:inline max-w-[80px] truncate">{user.name?.split(' ')[0]}</span>
                  {twoFAEnabled && (
                    <Badge variant="outline" className="h-4 px-1 text-[8px] font-medium border-0 text-blue-700 bg-blue-50 hidden md:inline-flex">
                      <Lock className="w-2.5 h-2.5 mr-0.5" />2FA
                    </Badge>
                  )}
                  {roleDisplayName && (
                    <Badge
                      variant="outline"
                      className="h-4 px-1 text-[8px] font-medium border-0 hidden md:inline-flex"
                      style={{ backgroundColor: roleColor ? `${roleColor}20` : undefined, color: roleColor || undefined }}
                    >
                      {roleDisplayName}
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500" onClick={signOut} title="Sign out">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 pb-20">
          {detailPanel.open ? (
            <DetailPage
              type={detailPanel.type}
              data={detailPanel.data}
              onBack={closeDetail}
              onRefresh={handleDetailRefresh}
              onNavigate={(p) => navigateTo(p)}
              openDetail={(type, data) => { openDetail(type, data) }}
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
        <BulkActionBar selectedCount={selectedIds.size} onClear={clearSelection} onAction={handleBulkAction} />
      )}

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onNavigate={(p) => navigateTo(p)}
        openDetail={openDetail}
        clients={clients}
        projects={projects}
        invoices={financeData?.invoices || []}
        workflows={workflows}
      />
    </SidebarProvider>
    </AuthGuard>
  )
}
