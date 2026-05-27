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
  TrendingUp, TrendingDown, Zap, ArrowUpRight,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, AreaChart, Area,
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
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
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
}

function ActivityFeed({ events }: { events: any[] }) {
  const activities: ActivityItem[] = (events || []).slice(0, 8).map((e: any, i: number) => ({
    id: `evt-${i}`,
    type: (e.aggregate || e.event_type || 'project') as ActivityItem['type'],
    action: fmt(e.event_type || e.action || 'created'),
    description: e.description || e.metadata?.title || e.aggregate_id || 'System event',
    timestamp: e.occurred_at || e.created_at || new Date().toISOString(),
  }))

  const typeIcons: Record<string, string> = {
    client: '👥', project: '📍', invoice: '💰', approval: '✅', workflow: '🔄', observation: '🔭',
  }
  const typeColors: Record<string, string> = {
    client: 'bg-blue-100 text-blue-700', project: 'bg-emerald-100 text-emerald-700',
    invoice: 'bg-amber-100 text-amber-700', approval: 'bg-green-100 text-green-700',
    workflow: 'bg-violet-100 text-violet-700', observation: 'bg-rose-100 text-rose-700',
  }

  return (
    <div className="space-y-1 max-h-80 overflow-y-auto">
      {activities.length === 0 && (
        <div className="text-center py-8">
          <div className="text-3xl mb-2">📭</div>
          <p className="text-sm text-slate-500">No recent activity</p>
        </div>
      )}
      {activities.map((a) => (
        <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${typeColors[a.type] || 'bg-slate-100 text-slate-600'}`}>
            {typeIcons[a.type] || '📋'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 group-hover:text-slate-900">{a.action}</p>
            <p className="text-[11px] text-slate-500 truncate">{a.description}</p>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
            {new Date(a.timestamp).toLocaleString('en-UG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ))}
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

  // Revenue waterfall data
  const waterfallData = [
    { name: 'Invoiced', value: Number(fm.totalInvoiced || 0), fill: '#6366f1' },
    { name: 'Paid', value: Number(fm.totalPaid || 0), fill: '#10b981' },
    { name: 'Outstanding', value: Number(fm.totalOutstanding || 0), fill: '#f59e0b' },
    { name: 'Overdue', value: Number(fm.overdueAmount || 0), fill: '#ef4444' },
  ]

  // Revenue trend (from invoices)
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

  const domainEvents = eventsData?.events || eventsData?.domainEvents || []

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

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Projects by Status Pie */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <p className="text-sm font-semibold mb-3">Projects by Status</p>
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

        {/* Activity Feed */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Activity Feed</p>
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
