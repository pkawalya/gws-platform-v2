'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Users, Activity, GitBranch, Eye, DollarSign, CheckCircle2, Clock, AlertCircle,
  ChevronRight, Layers, Workflow, RadioTower, Cpu, MapPin,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { STATUS_COLORS, fmt, statusBadge, PRIORITY_BADGE } from './constants'
import type { PageId, ProjectRecord } from './types'

interface DashboardPageProps {
  m: any
  dashData: any
  onNavigate: (page: PageId) => void
  openDetail: (type: string, data: any) => void
  clients: any[]
  projects: ProjectRecord[]
  financeData: any
}

export function DashboardPage({ m, dashData, onNavigate, openDetail, clients, projects, financeData }: DashboardPageProps) {
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
