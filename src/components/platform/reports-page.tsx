'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MapPin, DollarSign, Users, Cpu, GitBranch, Crosshair, ScrollText, Receipt, FileSpreadsheet, CalendarDays, Printer, BarChart2, Download, FileText } from 'lucide-react'
import { fmt, statusBadge, STATUS_COLORS, PRIORITY_BADGE } from './constants'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line,
} from 'recharts'

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

interface ReportsPageProps {
  reportsData: any
  openDetail: (type: string, data: any) => void
  dashData: any
}

export function ReportsPage({ reportsData, openDetail, dashData }: ReportsPageProps) {
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

  // Generate comprehensive downloadable report
  const generateFullReport = () => {
    const sections: string[] = []
    sections.push('GWS PLATFORM V2 - COMPREHENSIVE REPORT')
    sections.push('=========================================')
    sections.push(`Generated: ${new Date().toLocaleString()}`)
    sections.push(`Date Range: ${dateFrom || 'All'} to ${dateTo || 'All'}`)
    sections.push('')

    // Project section
    sections.push('PROJECT SUMMARY')
    sections.push('---------------')
    sections.push(`Total Projects: ${pr.total || 0}`)
    sections.push(`Overdue: ${pr.overdue || 0}`)
    sections.push(`Total Area: ${pr.totalAreaHectares || 0} hectares`)
    sections.push(`Districts Covered: ${(pr.byDistrict || []).length}`)
    sections.push('')
    if (pr.byStatus && pr.byStatus.length > 0) {
      sections.push('Projects by Status:')
      pr.byStatus.forEach((s: any) => sections.push(`  ${fmt(s.status)}: ${s.count}`))
      sections.push('')
    }
    if (pr.byType && pr.byType.length > 0) {
      sections.push('Projects by Type:')
      pr.byType.forEach((t: any) => sections.push(`  ${fmt(t.type)}: ${t.count}`))
      sections.push('')
    }

    // Financial section
    sections.push('FINANCIAL SUMMARY')
    sections.push('-----------------')
    sections.push(`Total Invoiced: UGX ${Number(fr.totalInvoiced || 0).toLocaleString()}`)
    sections.push(`Total Paid: UGX ${Number(fr.totalPaid || 0).toLocaleString()}`)
    sections.push(`Outstanding: UGX ${Number(fr.totalOutstanding || 0).toLocaleString()}`)
    sections.push(`Collection Rate: ${fr.collectionRate || 0}%`)
    sections.push(`Overdue Amount: UGX ${Number(fr.overdueAmount || 0).toLocaleString()}`)
    sections.push('')

    // Client section
    sections.push('CLIENT SUMMARY')
    sections.push('--------------')
    sections.push(`Total Clients: ${cr.total || 0}`)
    if (cr.byStatus && cr.byStatus.length > 0) {
      sections.push('Clients by Status:')
      cr.byStatus.forEach((s: any) => sections.push(`  ${fmt(s.status)}: ${s.count}`))
      sections.push('')
    }

    // Workflow section
    sections.push('WORKFLOW SUMMARY')
    sections.push('----------------')
    sections.push(`Definitions: ${wr.definitionCount || 0}`)
    sections.push(`Total Instances: ${wr.instanceCount || 0}`)
    sections.push(`Active: ${wr.activeCount || 0}`)
    sections.push(`Completed: ${wr.completedCount || 0}`)
    sections.push('')

    // Spatial section
    sections.push('SPATIAL & FIELD SUMMARY')
    sections.push('----------------------')
    sections.push(`Observations: ${sr.observationCount || 0}`)
    sections.push(`Sync Events: ${sr.syncEventCount || 0}`)
    sections.push(`Total Conflicts: ${sr.totalConflicts || 0}`)
    sections.push('')

    // AI section
    sections.push('AI USAGE SUMMARY')
    sections.push('----------------')
    sections.push(`Total Calls: ${ar.totalCalls || 0}`)
    sections.push(`Success Rate: ${ar.successRate || 0}%`)
    sections.push(`Total Cost: $${Number(ar.totalCost || 0).toFixed(2)}`)
    sections.push('')

    // Audit section
    sections.push('AUDIT TRAIL SUMMARY')
    sections.push('-------------------')
    sections.push(`Total Events: ${aur.totalEvents || 0}`)
    sections.push('')

    sections.push('=========================================')
    sections.push('End of Report — GWS Platform V2')

    const text = sections.join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gws-platform-report-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

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
  const projectTypeData = (pr.byType || []).map((t: any) => ({ name: fmt(t.type), count: t.count }))
  const financialMonthData = Object.entries(fr.byMonth || {}).map(([name, data]: [string, any]) => ({ name, Invoiced: data.invoiced, Paid: data.paid }))
  const clientStatusData = (cr.byStatus || []).map((s: any) => ({ name: fmt(s.status), value: s.count, color: STATUS_COLORS[s.status] || '#94a3b8' }))
  const workflowStatusData = Object.entries(wr.byStatus || {}).map(([name, count]) => ({ name: fmt(name), value: count as number, color: name === 'completed' ? '#10b981' : name === 'in_progress' ? '#3b82f6' : '#94a3b8' }))
  const spatialTypeData = Object.entries(sr.byType || {}).map(([name, count]) => ({ name: fmt(name), count: count as number }))
  const aiModelData = Object.entries(ar.byModel || {}).map(([name, data]: [string, any]) => ({ name, Calls: data.calls, Cost: Number(data.cost).toFixed(2), Tokens: data.tokens }))
  const auditTypeData = Object.entries(aur.byType || {}).slice(0, 8).map(([name, count]) => ({ name: fmt(name), count: count as number }))
  const auditDateData = Object.entries(aur.byDate || {}).slice(0, 14).map(([name, count]) => ({ name, Events: count as number }))
  const syncDateData = Object.entries(sr.syncByDate || {}).map(([name, data]: [string, any]) => ({ name, Pushed: data.pushed, Pulled: data.pulled, Conflicts: data.conflicts }))

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => generateFullReport()}>
            <Download className="w-3.5 h-3.5 mr-1" />Download Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b">
        {REPORT_TABS.map(tab => (
          <Button key={tab.id} size="sm" variant={activeTab === tab.id ? 'default' : 'ghost'}
            className={`h-8 text-xs whitespace-nowrap ${activeTab === tab.id ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
            onClick={() => setActiveTab(tab.id)}>
            <tab.icon className="w-3.5 h-3.5 mr-1.5" />{tab.label}
          </Button>
        ))}
      </div>

      {/* Overview */}
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
                    <div><p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{k.label}</p><p className="text-xl font-bold mt-0.5">{k.value}</p><p className="text-[11px] text-slate-400">{k.sub}</p></div>
                    <k.icon className={`w-7 h-7 ${k.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card><CardContent className="pt-6"><p className="text-sm font-semibold mb-3">Projects by Status</p>
              <ResponsiveContainer width="100%" height={240}><PieChart><Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">{projectStatusData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}</Pie><RechartsTooltip /><Legend fontSize={11} /></PieChart></ResponsiveContainer>
            </CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm font-semibold mb-3">Revenue Trend</p>
              <ResponsiveContainer width="100%" height={240}><BarChart data={financialMonthData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><RechartsTooltip /><Bar dataKey="Invoiced" fill="#94a3b8" radius={[3, 3, 0, 0]} /><Bar dataKey="Paid" fill="#10b981" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
            </CardContent></Card>
          </div>
        </div>
      )}

      {/* Projects */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[{ label: 'Total Projects', value: pr.total || 0 }, { label: 'Overdue', value: pr.overdue || 0 }, { label: 'Total Area', value: `${pr.totalAreaHectares || 0} ha` }, { label: 'Districts', value: (pr.byDistrict || []).length }, { label: 'Project Types', value: (pr.byType || []).length }].map(k => (
              <Card key={k.label}><CardContent className="p-4"><p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p><p className="text-xl font-bold mt-0.5">{k.value}</p></CardContent></Card>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card><CardContent className="pt-6"><p className="text-sm font-semibold mb-3">Projects by Status</p>
              <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3} dataKey="value">{projectStatusData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}</Pie><RechartsTooltip /><Legend fontSize={11} /></PieChart></ResponsiveContainer>
            </CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm font-semibold mb-3">Projects by Type</p>
              <ResponsiveContainer width="100%" height={220}><BarChart data={projectTypeData} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" fontSize={11} /><YAxis dataKey="name" type="category" fontSize={10} width={100} /><RechartsTooltip /><Bar dataKey="count" fill="#3b82f6" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer>
            </CardContent></Card>
          </div>
          <Card>
            <div className="p-6 pb-2"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Recent Projects Detail</p>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => exportCSV((pr.recentProjects || []).map((p: any) => ({ Reference: p.project_ref, Title: p.title, Status: p.status, Priority: p.priority, Type: p.project_type, District: p.district || '', Area_Hectares: p.area_hectares || '', Client: p.client?.company_name || `${p.client?.first_name} ${p.client?.last_name}`, Approval_Progress: `${p.approvedSteps}/${p.totalSteps}`, Created: p.created_at })), 'project-report')}><FileSpreadsheet className="w-3.5 h-3.5 mr-1" />Export CSV</Button>
            </div></div>
            <CardContent className="p-0"><Table>
              <TableHeader><TableRow><TableHead className="text-xs">Ref</TableHead><TableHead className="text-xs">Title</TableHead><TableHead className="text-xs hidden sm:table-cell">Client</TableHead><TableHead className="text-xs hidden md:table-cell">Type</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs hidden lg:table-cell">Approval</TableHead><TableHead className="text-xs w-8"></TableHead></TableRow></TableHeader>
              <TableBody>{(pr.recentProjects || []).map((p: any) => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openDetail('report', { title: p.title, description: `Project Report — ${p.project_ref}`, reportType: 'project', data: p })}>
                  <TableCell className="font-mono text-xs">{p.project_ref}</TableCell>
                  <TableCell><p className="text-sm font-medium">{p.title}</p><p className="text-[11px] text-slate-400">{p.district || 'No district'}</p></TableCell>
                  <TableCell className="hidden sm:table-cell text-xs">{p.client?.company_name || `${p.client?.first_name} ${p.client?.last_name}`}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs capitalize">{fmt(p.project_type)}</TableCell>
                  <TableCell>{statusBadge(p.status)}</TableCell>
                  <TableCell className="hidden lg:table-cell"><div className="flex items-center gap-2"><Progress value={p.totalSteps > 0 ? (p.approvedSteps / p.totalSteps) * 100 : 0} className="h-1.5 w-16" /><span className="text-[11px] text-slate-400">{p.approvedSteps}/{p.totalSteps}</span></div></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table></CardContent>
          </Card>
        </div>
      )}

      {/* Financial */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[{ label: 'Total Invoiced', value: `UGX ${Number(fr.totalInvoiced || 0).toLocaleString()}` }, { label: 'Total Paid', value: `UGX ${Number(fr.totalPaid || 0).toLocaleString()}` }, { label: 'Outstanding', value: `UGX ${Number(fr.totalOutstanding || 0).toLocaleString()}` }, { label: 'Collection Rate', value: `${fr.collectionRate || 0}%` }, { label: 'Overdue Amount', value: `UGX ${Number(fr.overdueAmount || 0).toLocaleString()}` }].map(k => (
              <Card key={k.label}><CardContent className="p-4"><p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p><p className="text-lg font-bold mt-0.5">{k.value}</p></CardContent></Card>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card><CardContent className="pt-6"><p className="text-sm font-semibold mb-3">Revenue by Month</p>
              <ResponsiveContainer width="100%" height={260}><BarChart data={financialMonthData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><RechartsTooltip /><Legend /><Bar dataKey="Invoiced" fill="#94a3b8" radius={[3, 3, 0, 0]} /><Bar dataKey="Paid" fill="#10b981" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
            </CardContent></Card>
            <Card>
              <div className="p-6 pb-2"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Top Debtors</p>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => exportCSV((fr.topDebtors || []).map((d: any) => ({ Client: d.client, Client_Ref: d.clientRef, Outstanding: d.outstanding, Invoice_Count: d.invoiceCount })), 'top-debtors-report')}><FileSpreadsheet className="w-3.5 h-3.5 mr-1" />Export</Button>
              </div></div>
              <CardContent className="p-0"><Table>
                <TableHeader><TableRow><TableHead className="text-xs">Client</TableHead><TableHead className="text-xs">Outstanding</TableHead><TableHead className="text-xs hidden sm:table-cell">Invoices</TableHead></TableRow></TableHeader>
                <TableBody>{(fr.topDebtors || []).map((d: any, i: number) => (
                  <TableRow key={i} className="hover:bg-slate-50">
                    <TableCell><p className="text-sm font-medium">{d.client}</p><p className="text-[11px] text-slate-400 font-mono">{d.clientRef}</p></TableCell>
                    <TableCell className="text-sm font-semibold text-red-600">UGX {Number(d.outstanding).toLocaleString()}</TableCell>
                    <TableCell className="hidden sm:table-cell"><Badge variant="secondary" className="text-[11px]">{d.invoiceCount}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table></CardContent>
            </Card>
          </div>
          <Card>
            <div className="p-6 pb-2"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Invoice Ledger</p>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => exportCSV((fr.invoices || []).map((i: any) => ({ Invoice: i.invoice_number, Client: i.client?.company_name || `${i.client?.first_name} ${i.client?.last_name}`, Amount: i.total_amount, Status: i.status, Due_Date: i.due_date || '', Created: i.created_at })), 'invoice-ledger-report')}><FileSpreadsheet className="w-3.5 h-3.5 mr-1" />Export CSV</Button>
            </div></div>
            <CardContent className="p-0"><Table>
              <TableHeader><TableRow><TableHead className="text-xs">Invoice #</TableHead><TableHead className="text-xs hidden sm:table-cell">Client</TableHead><TableHead className="text-xs">Amount</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs hidden md:table-cell">Due Date</TableHead></TableRow></TableHeader>
              <TableBody>{(fr.invoices || []).slice(0, 20).map((inv: any) => (
                <TableRow key={inv.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => openDetail('report', { title: inv.invoice_number, description: 'Invoice Report', reportType: 'invoice', data: inv })}>
                  <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                  <TableCell className="hidden sm:table-cell text-xs">{inv.client?.company_name || `${inv.client?.first_name} ${inv.client?.last_name}`}</TableCell>
                  <TableCell className="text-sm font-semibold">UGX {Number(inv.total_amount).toLocaleString()}</TableCell>
                  <TableCell>{statusBadge(inv.status)}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-slate-500">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table></CardContent>
          </Card>
        </div>
      )}

      {/* Clients */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[{ label: 'Total Clients', value: cr.total || 0 }, { label: 'Companies', value: (cr.byType || []).find((t: any) => t.type === 'company')?.count || 0 }, { label: 'Individuals', value: (cr.byType || []).find((t: any) => t.type === 'individual')?.count || 0 }, { label: 'Districts', value: (cr.byDistrict || []).length }].map(k => (
              <Card key={k.label}><CardContent className="p-4"><p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p><p className="text-xl font-bold mt-0.5">{k.value}</p></CardContent></Card>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card><CardContent className="pt-6"><p className="text-sm font-semibold mb-3">Clients by Status</p>
              <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={clientStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3} dataKey="value">{clientStatusData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}</Pie><RechartsTooltip /><Legend fontSize={11} /></PieChart></ResponsiveContainer>
            </CardContent></Card>
            <Card>
              <div className="p-6 pb-2"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Top Clients by Projects</p>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => exportCSV((cr.topClients || []).map((c: any) => ({ Name: c.name, Type: c.client_type, Status: c.status, District: c.district || '', Organization: c.organization || '', Branch: c.branch || '', Projects: c.projectCount, Invoices: c.invoiceCount, Documents: c.documentCount })), 'client-report')}><FileSpreadsheet className="w-3.5 h-3.5 mr-1" />Export CSV</Button>
              </div></div>
              <CardContent className="p-0"><Table>
                <TableHeader><TableRow><TableHead className="text-xs">Client</TableHead><TableHead className="text-xs hidden sm:table-cell">Organization</TableHead><TableHead className="text-xs">Projects</TableHead><TableHead className="text-xs hidden md:table-cell">Invoices</TableHead><TableHead className="text-xs">Status</TableHead></TableRow></TableHeader>
                <TableBody>{(cr.topClients || []).slice(0, 15).map((c: any) => (
                  <TableRow key={c.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => openDetail('report', { title: c.name, description: `Client Report — ${c.client_ref}`, reportType: 'client', data: c })}>
                    <TableCell><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-semibold">{c.name?.[0] || '?'}</div><div><p className="text-sm font-medium">{c.name}</p><p className="text-[10px] text-slate-400 capitalize">{c.client_type}</p></div></div></TableCell>
                    <TableCell className="hidden sm:table-cell text-xs">{c.organization || '—'}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[11px]">{c.projectCount}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-[11px]">{c.invoiceCount}</Badge></TableCell>
                    <TableCell>{statusBadge(c.status)}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table></CardContent>
            </Card>
          </div>
          {(cr.byDistrict || []).length > 0 && <Card><CardContent className="pt-6"><p className="text-sm font-semibold mb-3">Clients by District</p>
            <ResponsiveContainer width="100%" height={220}><BarChart data={(cr.byDistrict || []).slice(0, 10)}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="district" fontSize={11} /><YAxis fontSize={11} /><RechartsTooltip /><Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
          </CardContent></Card>}
        </div>
      )}

      {/* Workflows */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[{ label: 'Definitions', value: wr.definitionCount || 0 }, { label: 'Total Instances', value: wr.instanceCount || 0 }, { label: 'Active', value: wr.activeCount || 0 }, { label: 'Completed', value: wr.completedCount || 0 }, { label: 'Avg Completion', value: `${wr.avgCompletionHours || 0}h` }].map(k => (
              <Card key={k.label}><CardContent className="p-4"><p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p><p className="text-xl font-bold mt-0.5">{k.value}</p></CardContent></Card>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card><CardContent className="pt-6"><p className="text-sm font-semibold mb-3">Instances by Status</p>
              <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={workflowStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3} dataKey="value">{workflowStatusData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}</Pie><RechartsTooltip /><Legend fontSize={11} /></PieChart></ResponsiveContainer>
            </CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm font-semibold mb-3">Workflow Definitions</p>
              <div className="space-y-3">{(wr.definitions || []).map((d: any) => (
                <div key={d.id} className="p-3 rounded-lg border cursor-pointer hover:border-violet-200 transition-colors" onClick={() => openDetail('report', { title: d.name, description: `Workflow Report — v${d.version}`, reportType: 'workflow', data: d })}>
                  <div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm">{d.name}</span><Badge variant="outline" className="text-[10px]">v{d.version}</Badge></div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500"><span>{d.stepCount} steps</span><span>{d.instanceCount} instances</span><span className="capitalize">{fmt(d.triggerType)}</span></div>
                </div>
              ))}</div>
            </CardContent></Card>
          </div>
        </div>
      )}

      {/* Spatial & Field */}
      {activeTab === 'spatial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[{ label: 'Observations', value: sr.observationCount || 0 }, { label: 'Sync Events', value: sr.syncEventCount || 0 }, { label: 'Records Synced', value: (sr.totalPushed || 0) + (sr.totalPulled || 0) }, { label: 'Conflicts', value: sr.totalConflicts || 0 }].map(k => (
              <Card key={k.label}><CardContent className="p-4"><p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p><p className="text-xl font-bold mt-0.5">{k.value}</p></CardContent></Card>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card><CardContent className="pt-6"><p className="text-sm font-semibold mb-3">Observations by Type</p>
              <ResponsiveContainer width="100%" height={220}><BarChart data={spatialTypeData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={11} /><RechartsTooltip /><Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
            </CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm font-semibold mb-3">Sync Activity</p>
              <ResponsiveContainer width="100%" height={220}><BarChart data={syncDateData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={11} /><RechartsTooltip /><Legend /><Bar dataKey="Pushed" fill="#3b82f6" radius={[3, 3, 0, 0]} /><Bar dataKey="Pulled" fill="#10b981" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
            </CardContent></Card>
          </div>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between mb-3"><p className="text-sm font-semibold">Field Accuracy Summary</p><Badge variant="outline" className="text-xs">Avg Accuracy: {sr.avgAccuracy || 0}m</Badge></div>
            <div className="grid sm:grid-cols-3 gap-4">{Object.entries(sr.byStatus || {}).map(([status, count]) => (
              <div key={status} className="p-3 rounded-lg bg-slate-50"><div className="flex items-center justify-between"><span className="text-sm font-medium">{fmt(status)}</span><span className="text-lg font-bold">{count as number}</span></div></div>
            ))}</div>
          </CardContent></Card>
        </div>
      )}

      {/* AI Usage */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[{ label: 'Total Calls', value: ar.totalCalls || 0 }, { label: 'Success Rate', value: `${ar.successRate || 0}%` }, { label: 'Total Cost', value: `$${Number(ar.totalCost || 0).toFixed(2)}` }, { label: 'Avg Latency', value: `${ar.avgLatency || 0}ms` }].map(k => (
              <Card key={k.label}><CardContent className="p-4"><p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p><p className="text-xl font-bold mt-0.5">{k.value}</p></CardContent></Card>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6 pb-2"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Usage by Model</p>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => exportCSV(aiModelData.map((m: any) => ({ Model: m.name, Calls: m.Calls, Cost_USD: m.Cost, Tokens: m.Tokens })), 'ai-usage-report')}><FileSpreadsheet className="w-3.5 h-3.5 mr-1" />Export</Button>
              </div></div>
              <CardContent><ResponsiveContainer width="100%" height={220}><BarChart data={aiModelData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={11} /><RechartsTooltip /><Bar dataKey="Calls" fill="#8b5cf6" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></CardContent>
            </Card>
            <Card><CardContent className="pt-6"><p className="text-sm font-semibold mb-3">Token & Cost Summary</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-violet-50"><p className="text-[11px] text-violet-600 uppercase tracking-wide">Input Tokens</p><p className="text-xl font-bold text-violet-700">{(ar.totalInputTokens || 0).toLocaleString()}</p></div>
                  <div className="p-3 rounded-lg bg-blue-50"><p className="text-[11px] text-blue-600 uppercase tracking-wide">Output Tokens</p><p className="text-xl font-bold text-blue-700">{(ar.totalOutputTokens || 0).toLocaleString()}</p></div>
                </div>
                <div className="space-y-2">{(Object.entries(ar.byModel || {}) as [string, any][]).map(([name, data]) => (
                  <div key={name} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                    <div><p className="text-sm font-medium">{name}</p><p className="text-[11px] text-slate-400">{data.calls} calls, {data.tokens.toLocaleString()} tokens</p></div>
                    <span className="text-sm font-semibold">${Number(data.cost).toFixed(4)}</span>
                  </div>
                ))}</div>
              </div>
            </CardContent></Card>
          </div>
        </div>
      )}

      {/* Audit Trail */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[{ label: 'Total Events', value: aur.totalEvents || 0 }, { label: 'Event Types', value: Object.keys(aur.byType || {}).length }, { label: 'Aggregates', value: Object.keys(aur.byAggregate || {}).length }, { label: 'Active Days', value: Object.keys(aur.byDate || {}).length }].map(k => (
              <Card key={k.label}><CardContent className="p-4"><p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p><p className="text-xl font-bold mt-0.5">{k.value}</p></CardContent></Card>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card><CardContent className="pt-6"><p className="text-sm font-semibold mb-3">Events by Type</p>
              <ResponsiveContainer width="100%" height={260}><BarChart data={auditTypeData} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" fontSize={11} /><YAxis dataKey="name" type="category" fontSize={10} width={90} /><RechartsTooltip /><Bar dataKey="count" fill="#6366f1" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer>
            </CardContent></Card>
            <Card>
              <div className="p-6 pb-2"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Event Timeline</p>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => exportCSV((aur.recentEvents || []).map((e: any) => ({ Event_Type: e.event_type, Aggregate: e.aggregate, Aggregate_ID: e.aggregate_id, Created_At: e.created_at })), 'audit-trail-report')}><FileSpreadsheet className="w-3.5 h-3.5 mr-1" />Export CSV</Button>
              </div></div>
              <CardContent><ResponsiveContainer width="100%" height={260}><LineChart data={auditDateData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={11} /><RechartsTooltip /><Line type="monotone" dataKey="Events" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></CardContent>
            </Card>
          </div>
          <Card><CardContent className="pt-6"><p className="text-sm font-semibold mb-3">Aggregate Breakdown</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{Object.entries(aur.byAggregate || {}).map(([name, count]) => (
              <div key={name} className="p-3 rounded-lg bg-slate-50 flex items-center justify-between"><span className="text-sm font-medium">{fmt(name)}</span><Badge variant="secondary" className="text-[11px]">{count as number}</Badge></div>
            ))}</div>
          </CardContent></Card>
        </div>
      )}
    </div>
  )
}
