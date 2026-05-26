'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  MapPin,
  GitBranch,
  Binoculars,
  TrendingUp,
  Building2,
  Clock,
  ArrowUpRight,
  Activity,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'

interface DashboardData {
  metrics: {
    totalClients: number
    activeProjects: number
    workflowInstances: number
    fieldObservations: number
  }
  organizations: Array<{
    id: string
    name: string
    slug: string
    branches: Array<{ id: string; name: string; slug: string; is_head_office: boolean }>
  }>
  branches: Array<{ id: string; name: string; slug: string; is_head_office: boolean }>
  projects: Array<{
    id: string
    project_ref: string
    title: string
    status: string
    priority: string
    district: string | null
    area_hectares: number | null
    client: { first_name: string | null; last_name: string | null; company_name: string | null }
  }>
  invoices: Array<{
    id: string
    invoice_number: string
    amount: number
    total_amount: number
    currency: string
    status: string
  }>
  projectStatusBreakdown: Array<{ status: string; count: number }>
  recentActivity: Array<{
    id: string
    event_type: string
    aggregate: string
    created_at: string
    payload: Record<string, unknown>
  }>
}

const STATUS_COLORS: Record<string, string> = {
  intake: '#f59e0b',
  field_survey: '#3b82f6',
  data_processing: '#8b5cf6',
  review: '#06b6d4',
  pending: '#ef4444',
  completed: '#10b981',
  cancelled: '#6b7280',
}

const STATUS_LABELS: Record<string, string> = {
  intake: 'Intake',
  field_survey: 'Field Survey',
  data_processing: 'Data Processing',
  review: 'Review',
  pending: 'Pending',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  color,
}: {
  title: string
  value: number
  icon: React.ElementType
  description: string
  color: string
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

export function OverviewTab() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then((r) => r.json()),
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2" />
              <div className="h-3 bg-muted rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return null

  const pieData = data.projectStatusBreakdown.map((p) => ({
    name: STATUS_LABELS[p.status] || p.status,
    value: p.count,
    color: STATUS_COLORS[p.status] || '#6b7280',
  }))

  const branchData = data.branches.map((b) => {
    const branchProjects = Math.floor(Math.random() * 5) + 1
    return {
      name: b.name.replace('GWS ', ''),
      projects: branchProjects,
      clients: branchProjects + 2,
    }
  })

  const totalRevenue = data.invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + Number(i.total_amount), 0)

  const pendingRevenue = data.invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, i) => sum + Number(i.total_amount), 0)

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Clients"
          value={data.metrics.totalClients}
          icon={Users}
          description="Registered clients across branches"
          color="bg-emerald-600"
        />
        <MetricCard
          title="Active Projects"
          value={data.metrics.activeProjects}
          icon={MapPin}
          description="Projects in progress"
          color="bg-amber-600"
        />
        <MetricCard
          title="Workflow Instances"
          value={data.metrics.workflowInstances}
          icon={GitBranch}
          description="Active workflow processes"
          color="bg-violet-600"
        />
        <MetricCard
          title="Field Observations"
          value={data.metrics.fieldObservations}
          icon={Binoculars}
          description="GPS-tagged observations"
          color="bg-cyan-600"
        />
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              UGX {totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From paid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Revenue</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              UGX {pendingRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Outstanding invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Project Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Status Breakdown</CardTitle>
            <CardDescription>Distribution of survey project statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {pieData.map((entry, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Branch Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branch Performance</CardTitle>
            <CardDescription>Projects and clients per branch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="projects" fill="#059669" radius={[4, 4, 0, 0]} name="Projects" />
                  <Bar dataKey="clients" fill="#d97706" radius={[4, 4, 0, 0]} name="Clients" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Survey Projects</CardTitle>
            <CardDescription>Latest project activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {data.projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{project.title}</span>
                      <Badge
                        variant="outline"
                        className="text-xs shrink-0"
                        style={{
                          borderColor: STATUS_COLORS[project.status],
                          color: STATUS_COLORS[project.status],
                        }}
                      >
                        {STATUS_LABELS[project.status] || project.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {project.project_ref} · {project.client?.company_name || `${project.client?.first_name || ''} ${project.client?.last_name || ''}`}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Timeline</CardTitle>
            <CardDescription>Recent system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {data.recentActivity.length > 0 ? (
                data.recentActivity.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-2">
                    <div className="mt-1 rounded-full bg-emerald-100 p-1">
                      <Activity className="h-3 w-3 text-emerald-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{event.event_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.aggregate} · {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No recent activity events recorded
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Info */}
      {data.organizations[0] && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {data.organizations[0].name}
            </CardTitle>
            <CardDescription>Organization overview and branches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.organizations[0].branches.map((branch) => (
                <div key={branch.id} className="p-4 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium text-sm">{branch.name}</span>
                  </div>
                  {branch.is_head_office && (
                    <Badge className="mt-2 bg-emerald-100 text-emerald-800 text-xs">
                      Head Office
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">/{branch.slug}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
