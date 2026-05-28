'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users, Activity, GitBranch, Eye, DollarSign, CheckCircle2, Clock, AlertCircle,
  ChevronRight, Layers, Workflow, RadioTower, Cpu, MapPin, Plus, FileBarChart,
  TrendingUp, TrendingDown, Zap, ArrowUpRight, CalendarDays, BarChart3,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, AreaChart, Area,
  FunnelChart, Funnel, LabelList,
} from 'recharts'
import { STATUS_COLORS, fmt, statusBadge, PRIORITY_BADGE, formatUGX } from './constants'
import type { PageId, ProjectRecord } from './types'

// ── Animated Number Counter ──
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = null
    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp
      const progress = Math.min((timestamp - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.floor(eased * value))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value, duration])

  return <>{display.toLocaleString()}</>
}

// ── Micro Sparkline ──
function Sparkline({ data, color = '#10b981', width = 80, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="opacity-70">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Activity Feed Item ──
interface ActivityItem {
  id: string
  type: 'client' | 'project' | 'invoice' | 'approval' | 'workflow' | 'observation'
  action: string
  description: string
  timestamp: string
  icon?: string
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  client: <Users className="w-3.5 h-3.5" />,
  project: <MapPin className="w-3.5 h-3.5" />,
  invoice: <DollarSign className="w-3.5 h-3.5" />,
  approval: <CheckCircle2 className="w-3.5 h-3.5" />,
  workflow: <GitBranch className="w-3.5 h-3.5" />,
  observation: <Eye className="w-3.5 h-3.5" />,
}

function ActivityFeed({ events }: { events: any[] }) {
  const activities: ActivityItem[] = (events || []).slice(0, 10).map((e: any, i: number) => ({
    id: `evt-${i}`,
    type: (e.aggregate || e.event_type || 'project') as ActivityItem['type'],
    action: fmt(e.event_type || e.action || 'created'),
    description: e.description || e.metadata?.title || e.aggregate_id || 'System event',
    timestamp: e.occurred_at || e.created_at || new Date().toISOString(),
  }))

  const typeColors: Record<string, string> = {
    client: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    project: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    invoice: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    approval: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    workflow: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    observation: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  }

  const actionColors: Record<string, string> = {
    Created: 'text-emerald-700 dark:text-emerald-300',
    Updated: 'text-blue-700 dark:text-blue-300',
    Deleted: 'text-red-700 dark:text-red-300',
    Approved: 'text-green-700 dark:text-green-300',
    Submitted: 'text-amber-700 dark:text-amber-300',
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString('en-UG', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-0.5 max-h-96 overflow-y-auto">
      {activities.length === 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Activity className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm text-slate-500">No recent activity</p>
          <p className="text-xs text-slate-400 mt-1">Events will appear here as they occur</p>
        </div>
      )}
      {activities.map((a, idx) => (
        <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group relative">
          {/* Timeline connector */}
          {idx < activities.length - 1 && (
            <div className="absolute left-[22px] top-[40px] w-px h-[calc(100%-16px)] bg-slate-200 dark:bg-slate-700" />
          )}
          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${typeColors[a.type] || 'bg-slate-100 text-slate-600'}`}>
            {ACTIVITY_ICONS[a.type] || <Activity className="w-3.5 h-3.5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold ${actionColors[a.action] || 'text-slate-800 dark:text-slate-200'}`}>
                {a.action}
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase">{a.type}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{a.description}</p>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0 mt-1 tabular-nums">
            {timeAgo(a.timestamp)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Project Pipeline Funnel ──
function PipelineFunnel({ projectByStatus }: { projectByStatus: Record<string, number> }) {
  const pipelineStages = [
    { key: 'intake', label: 'Intake', color: '#6366f1' },
    { key: 'field_survey', label: 'Field Survey', color: '#3b82f6' },
    { key: 'data_processing', label: 'Data Processing', color: '#f59e0b' },
    { key: 'completed', label: 'Completed', color: '#10b981' },
  ]

  const total = pipelineStages.reduce((sum, s) => sum + (projectByStatus[s.key] || 0), 0)

  if (total === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-400">No projects in pipeline</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {pipelineStages.map((stage, idx) => {
        const count = projectByStatus[stage.key] || 0
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        // Funnel width: wider at top, narrower at bottom
        const widthPct = Math.max(30, 100 - idx * 18)

        return (
          <div key={stage.key} className="relative">
            <div
              className="mx-auto rounded-lg overflow-hidden transition-all duration-500"
              style={{ width: `${widthPct}%` }}
            >
              <div
                className="flex items-center justify-between px-4 py-2.5 text-white"
                style={{ backgroundColor: stage.color }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{count}</span>
                  <span className="text-xs opacity-90">{fmt(stage.label)}</span>
                </div>
                <span className="text-xs font-medium opacity-80">{pct}%</span>
              </div>
            </div>
            {idx < pipelineStages.length - 1 && count > 0 && (
              <div className="flex justify-center mt-1">
                <ChevronRight className="w-3 h-3 text-slate-300 rotate-90" />
              </div>
            )}
          </div>
        )
      })}
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-[11px] text-slate-500 font-medium">Total Pipeline</span>
        <span className="text-sm font-bold">{total} projects</span>
      </div>
    </div>
  )
}

interface DashboardPageProps {
  m: any
  dashData: any
  onNavigate: (page: PageId) => void
  openDetail: (type: string, data: any) => void
  clients: any[]
  projects: ProjectRecord[]
  financeData: any
  eventsData?: any
}

export function DashboardPage({ m, dashData, onNavigate, openDetail, clients, projects, financeData, eventsData }: DashboardPageProps) {
  const statusChartData = Object.entries(dashData?.projectByStatus || {}).map(([name, value]) => ({
    name: fmt(name), value: value as number, color: STATUS_COLORS[name] || '#94a3b8',
  }))
  const fm = financeData?.metrics || {}

  // Generate sparkline data (simulated 7-day trends)
  const sparkData = {
    clients: [3, 5, 4, 7, 6, 8, m.clients || 0],
    projects: [2, 3, 5, 4, 6, 5, m.activeProjects || 0],
    workflows: [1, 2, 3, 2, 4, 3, m.workflowInstances || 0],
    observations: [5, 8, 6, 9, 7, 11, m.observations || 0],
  }

  // Revenue trend area chart data (monthly, with MoM change)
  const revenueTrend = (financeData?.invoices || []).reduce((acc: any[], inv: any) => {
    const month = new Date(inv.created_at).toLocaleDateString('en-UG', { month: 'short', year: '2-digit' })
    const existing = acc.find(a => a.name === month)
    if (existing) {
      existing.invoiced += Number(inv.total_amount)
      if (inv.status === 'paid') existing.paid += Number(inv.total_amount)
    } else {
      acc.push({ name: month, invoiced: Number(inv.total_amount), paid: inv.status === 'paid' ? Number(inv.total_amount) : 0 })
    }
    return acc
  }, [])

  // Add MoM percentage change
  const revenueWithMoM = revenueTrend.map((item, idx) => {
    const prev = idx > 0 ? revenueTrend[idx - 1].invoiced : 0
    const momChange = prev > 0 ? ((item.invoiced - prev) / prev) * 100 : 0
    return { ...item, momChange: Math.round(momChange * 10) / 10 }
  })

  // If no invoice data, generate placeholder monthly data
  const revenueChartData = revenueWithMoM.length > 0 ? revenueWithMoM : [
    { name: 'Jan', invoiced: 0, paid: 0, momChange: 0 },
    { name: 'Feb', invoiced: 0, paid: 0, momChange: 0 },
    { name: 'Mar', invoiced: 0, paid: 0, momChange: 0 },
    { name: 'Apr', invoiced: 0, paid: 0, momChange: 0 },
    { name: 'May', invoiced: 0, paid: 0, momChange: 0 },
    { name: 'Jun', invoiced: 0, paid: 0, momChange: 0 },
  ]

  // Waterfall data
  const waterfallData = [
    { name: 'Invoiced', value: Number(fm.totalInvoiced || 0), fill: '#6366f1' },
    { name: 'Paid', value: Number(fm.totalPaid || 0), fill: '#10b981' },
    { name: 'Outstanding', value: Number(fm.totalOutstanding || 0), fill: '#f59e0b' },
    { name: 'Overdue', value: Number(fm.overdueAmount || 0), fill: '#ef4444' },
  ]

  const domainEvents = eventsData?.events || eventsData?.domainEvents || []

  // Calculate current month vs last month revenue for the trend indicator
  const currentMonthRevenue = revenueChartData.length > 0 ? revenueChartData[revenueChartData.length - 1].invoiced : 0
  const lastMonthRevenue = revenueChartData.length > 1 ? revenueChartData[revenueChartData.length - 2].invoiced : 0
  const revenueTrendPct = lastMonthRevenue > 0 ? Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Quick Actions Row */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => onNavigate('clients')}>
          <Plus className="w-3.5 h-3.5 mr-1" />New Client
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onNavigate('projects')}>
          <MapPin className="w-3.5 h-3.5 mr-1" />New Project
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onNavigate('reports')}>
          <FileBarChart className="w-3.5 h-3.5 mr-1" />Run Report
        </Button>
        <div className="ml-auto hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
          <Zap className="w-3 h-3" />
          <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono">⌘K</kbd> for quick actions</span>
        </div>
      </div>

      {/* KPI Cards with Sparklines */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Clients', value: m.clients || 0, icon: Users, sub: `${m.organizations} org`, sparkData: sparkData.clients, sparkColor: '#3b82f6', trend: '+12%', trendUp: true, page: 'clients' as PageId },
          { label: 'Active Projects', value: m.activeProjects || 0, icon: Activity, sub: `${m.projects} total`, sparkData: sparkData.projects, sparkColor: '#10b981', trend: '+8%', trendUp: true, page: 'projects' as PageId },
          { label: 'Workflows Running', value: m.workflowInstances || 0, icon: GitBranch, sub: 'in progress', sparkData: sparkData.workflows, sparkColor: '#8b5cf6', trend: '+3%', trendUp: true, page: 'workflows' as PageId },
          { label: 'Field Observations', value: m.observations || 0, icon: Eye, sub: 'synced', sparkData: sparkData.observations, sparkColor: '#f59e0b', trend: '+15%', trendUp: true, page: 'field-sync' as PageId },
        ].map(k => (
          <Card key={k.label} className="hover:shadow-md transition-all duration-200 cursor-pointer group border-slate-200/80 hover:border-slate-300" onClick={() => onNavigate(k.page)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{k.label}</p>
                <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  {k.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {k.trend}
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    <AnimatedNumber value={k.value} />
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{k.sub}</p>
                </div>
                <Sparkline data={k.sparkData} color={k.sparkColor} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Invoiced', value: formatUGX(fm.totalInvoiced || 0), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Paid', value: formatUGX(fm.totalPaid || 0), icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Outstanding', value: formatUGX(fm.totalOutstanding || 0), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Overdue', value: fm.overdueCount || 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(k => (
          <Card key={k.label} className="hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={() => onNavigate('finance')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{k.label}</p>
                  <p className="text-lg font-bold mt-0.5 truncate">{k.value}</p>
                </div>
                <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center`}>
                  <k.icon className={`w-5 h-5 ${k.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Area Chart - NEW */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold">Revenue Trend</p>
              <p className="text-xs text-slate-500 mt-0.5">Month-over-month invoicing & collections</p>
            </div>
            <div className="flex items-center gap-3">
              {revenueTrendPct !== 0 && (
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${revenueTrendPct >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                  {revenueTrendPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {revenueTrendPct >= 0 ? '+' : ''}{revenueTrendPct}% MoM
                </div>
              )}
              <Badge variant="outline" className="text-[10px]">UGX</Badge>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="invoicedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <RechartsTooltip
                formatter={(value: number, name: string) => [formatUGX(value), fmt(name)]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Legend fontSize={11} />
              <Area type="monotone" dataKey="invoiced" stroke="#6366f1" strokeWidth={2} fill="url(#invoicedGrad)" name="Invoiced" />
              <Area type="monotone" dataKey="paid" stroke="#10b981" strokeWidth={2} fill="url(#paidGrad)" name="Paid" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Main Content Grid - Pipeline Funnel + Recent Projects */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Project Pipeline Funnel - NEW */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold">Project Pipeline</p>
                <p className="text-xs text-slate-500 mt-0.5">Survey lifecycle stages</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onNavigate('projects')}>
                View All <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            </div>
            <PipelineFunnel projectByStatus={dashData?.projectByStatus || {}} />
          </CardContent>
        </Card>

        {/* Recent Projects Table */}
        <Card className="lg:col-span-3">
          <div className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Recent Projects</p>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onNavigate('projects')}>
                View All <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            </div>
          </div>
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
                  <TableRow key={p.id} className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => openDetail('project', p)}>
                    <TableCell><div><p className="text-sm font-medium">{p.title}</p><p className="text-[11px] text-slate-400">{p.project_ref}</p></div></TableCell>
                    <TableCell className="hidden sm:table-cell text-xs">{p.client?.company_name || `${p.client?.first_name} ${p.client?.last_name}`}</TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="outline" className={`text-xs ${PRIORITY_BADGE[p.priority] || ''}`}>{p.priority}</Badge></TableCell>
                  </TableRow>
                ))}
                {(!projects || projects.length === 0) && (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-sm text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <MapPin className="w-8 h-8 text-slate-300" />
                      <p>No projects yet</p>
                    </div>
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Waterfall & Activity Feed */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Revenue Waterfall Chart */}
        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Revenue Waterfall</p>
              <Badge variant="outline" className="text-[10px]">UGX</Badge>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={waterfallData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={10} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <RechartsTooltip formatter={(value: number) => formatUGX(value)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Enhanced Activity Feed */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold">Activity Feed</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{domainEvents.length} recent events</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => onNavigate('audit')}>
                View All
              </Button>
            </div>
            <ActivityFeed events={domainEvents} />
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { id: 'spatial' as PageId, label: 'Spatial Map', icon: Layers, desc: 'View projects & clients on map', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
          { id: 'workflows' as PageId, label: 'Workflow Engine', icon: Workflow, desc: 'Track approvals & processes', color: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
          { id: 'field-sync' as PageId, label: 'Field Sync', icon: RadioTower, desc: 'Mobile data synchronization', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
          { id: 'ai' as PageId, label: 'AI Insights', icon: Cpu, desc: 'Model registry & call logs', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
        ].map(q => (
          <Card key={q.id} className="cursor-pointer hover:shadow-md transition-all duration-200 group" onClick={() => onNavigate(q.id)}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${q.color}`}><q.icon className="w-5 h-5" /></div>
              <div><p className="text-sm font-semibold group-hover:text-emerald-700 transition-colors">{q.label}</p><p className="text-[11px] text-slate-500">{q.desc}</p></div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
