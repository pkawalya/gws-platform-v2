'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Receipt, CheckCircle2, Clock, AlertCircle, DollarSign, ChevronRight, Plus, TrendingUp, Gauge } from 'lucide-react'
import { fmt, statusBadge, formatUGX } from './constants'
import { SortableHeader } from './helpers'
import { DataTablePagination } from './data-table-pagination'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'
import type { ClientRecord } from './types'

interface FinancePageProps {
  financeData: any
  clients: ClientRecord[]
  openDetail: (type: string, data: any) => void
  selectedIds: Set<number>
  toggleSelect: (id: number) => void
  toggleAll: (ids: number[]) => void
  onRefresh?: () => void
  onToast?: (type: 'success' | 'error', message: string) => void
}

const AGING_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']

export function FinancePage({ financeData, clients, openDetail, selectedIds, toggleSelect, toggleAll, onRefresh, onToast }: FinancePageProps) {
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [tab, setTab] = useState<'invoices' | 'quotations'>('invoices')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({ client_id: '', amount: '', tax_amount: '', status: 'draft', due_date: '' })
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

  const currentData = tab === 'invoices' ? filteredInvoices : filteredQuotations
  const paginated = currentData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Revenue trend data (area chart)
  const revenueTrend = invoices.reduce((acc: any[], inv: any) => {
    const month = new Date(inv.created_at).toLocaleDateString('en-UG', { month: 'short', year: '2-digit' })
    const existing = acc.find(a => a.name === month)
    if (existing) { existing.invoiced += Number(inv.total_amount); if (inv.status === 'paid') existing.collected += Number(inv.total_amount) }
    else acc.push({ name: month, invoiced: Number(inv.total_amount), collected: inv.status === 'paid' ? Number(inv.total_amount) : 0 })
    return acc
  }, [])

  // Revenue bar chart
  const revenueChartData = invoices.reduce((acc: any[], inv: any) => {
    const month = new Date(inv.created_at).toLocaleDateString('en-UG', { month: 'short', year: '2-digit' })
    const existing = acc.find(a => a.name === month)
    if (existing) { existing.Invoiced += Number(inv.total_amount); if (inv.status === 'paid') existing.Paid += Number(inv.total_amount) }
    else acc.push({ name: month, Invoiced: Number(inv.total_amount), Paid: inv.status === 'paid' ? Number(inv.total_amount) : 0 })
    return acc
  }, [])

  // Aging buckets
  const now = new Date()
  const agingBuckets = [
    { name: 'Current', value: 0, color: AGING_COLORS[0] },
    { name: '30 Days', value: 0, color: AGING_COLORS[1] },
    { name: '60 Days', value: 0, color: AGING_COLORS[2] },
    { name: '90+ Days', value: 0, color: AGING_COLORS[3] },
  ]
  invoices.forEach((inv: any) => {
    if (inv.status === 'paid') return
    const amount = Number(inv.total_amount) || 0
    const dueDate = inv.due_date ? new Date(inv.due_date) : null
    if (!dueDate) { agingBuckets[0].value += amount; return }
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysOverdue <= 0) agingBuckets[0].value += amount
    else if (daysOverdue <= 30) agingBuckets[1].value += amount
    else if (daysOverdue <= 60) agingBuckets[2].value += amount
    else agingBuckets[3].value += amount
  })

  // Collection rate
  const totalInvoiced = Number(fm.totalInvoiced || 0)
  const totalPaid = Number(fm.totalPaid || 0)
  const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0

  const handleCreateInvoice = async () => {
    try {
      const amount = parseFloat(createForm.amount)
      const taxAmount = createForm.tax_amount ? parseFloat(createForm.tax_amount) : 0
      const totalAmount = amount + taxAmount
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...createForm, amount, tax_amount: taxAmount, total_amount: totalAmount, currency: 'UGX' }),
      })
      if (res.ok) {
        setShowCreateDialog(false)
        onRefresh?.()
        onToast?.('success', 'Invoice created successfully')
      } else {
        onToast?.('error', 'Failed to create invoice')
      }
    } catch (e) {
      console.error(e)
      onToast?.('error', 'Failed to create invoice')
    }
  }

  return (
    <div className="space-y-6">
      {/* Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Invoiced', value: formatUGX(fm.totalInvoiced || 0), icon: Receipt, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Paid', value: formatUGX(fm.totalPaid || 0), icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Outstanding', value: formatUGX(fm.totalOutstanding || 0), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Overdue', value: fm.overdueCount || 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Quotations', value: fm.quotationCount || 0, icon: DollarSign, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(k => (
          <Card key={k.label} className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1"><p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{k.label}</p><p className="text-lg font-bold mt-0.5 truncate">{k.value}</p></div>
                <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center`}>
                  <k.icon className={`w-5 h-5 ${k.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Revenue Trend
              </p>
              <Badge variant="outline" className="text-[10px]">UGX</Badge>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={10} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <RechartsTooltip formatter={(value: number) => formatUGX(value)} />
                <Area type="monotone" dataKey="invoiced" stroke="#6366f1" fillOpacity={1} fill="url(#colorInvoiced)" strokeWidth={2} />
                <Area type="monotone" dataKey="collected" stroke="#10b981" fillOpacity={1} fill="url(#colorCollected)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-2 text-[11px]">
              <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-indigo-500" /> Invoiced</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-emerald-500" /> Collected</span>
            </div>
          </CardContent>
        </Card>

        {/* Right column: Collection Rate + Aging */}
        <div className="space-y-4">
          {/* Collection Rate Gauge */}
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm font-semibold mb-2 flex items-center justify-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-600" />
                Collection Rate
              </p>
              <div className="relative w-32 h-32 mx-auto">
                <svg viewBox="0 0 120 120" className="transform -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke={collectionRate >= 70 ? '#10b981' : collectionRate >= 40 ? '#f59e0b' : '#ef4444'} strokeWidth="10" strokeDasharray={`${collectionRate * 3.14} ${314 - collectionRate * 3.14}`} strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <p className="text-2xl font-bold">{collectionRate}%</p>
                    <p className="text-[10px] text-slate-500">of invoiced</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aging Buckets */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-semibold mb-3">Aging Analysis</p>
              <div className="space-y-2.5">
                {agingBuckets.map((bucket) => {
                  const total = agingBuckets.reduce((s, b) => s + b.value, 0)
                  const pct = total > 0 ? Math.round((bucket.value / total) * 100) : 0
                  return (
                    <div key={bucket.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{bucket.name}</span>
                        <span className="text-slate-500">{formatUGX(bucket.value)}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: bucket.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoice / Quotation Tabs */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant={tab === 'invoices' ? 'default' : 'outline'} onClick={() => { setTab('invoices'); setStatusFilter('all'); setCurrentPage(1) }}>Invoices ({invoices.length})</Button>
        <Button size="sm" variant={tab === 'quotations' ? 'default' : 'outline'} onClick={() => { setTab('quotations'); setStatusFilter('all'); setCurrentPage(1) }}>Quotations ({quotations.length})</Button>
        <div className="ml-auto flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Filter status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem><SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem><SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {tab === 'invoices' && (
            <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />New Invoice
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {tab === 'invoices' ? (
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs w-10"><Checkbox checked={paginated.length > 0 && paginated.every((i: any) => selectedIds.has(i.id))} onCheckedChange={() => toggleAll(paginated.map((i: any) => i.id))} /></TableHead>
                <TableHead className="text-xs"><SortableHeader label="Invoice #" field="invoice_number" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Client</TableHead>
                <TableHead className="text-xs"><SortableHeader label="Amount" field="total_amount" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs"><SortableHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                <TableHead className="text-xs hidden md:table-cell">Due Date</TableHead>
                <TableHead className="text-xs w-8"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="w-8 h-8 text-slate-300" />
                      <p>No invoices found</p>
                    </div>
                  </TableCell></TableRow>
                ) : paginated.map((inv: any) => (
                  <TableRow key={inv.id} className={`cursor-pointer hover:bg-slate-50 transition-colors ${selectedIds.has(inv.id) ? 'bg-emerald-50/50' : ''}`}>
                    <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(inv.id)} onCheckedChange={() => toggleSelect(inv.id)} /></TableCell>
                    <TableCell className="font-mono text-xs" onClick={() => openDetail('invoice', inv)}>{inv.invoice_number}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs" onClick={() => openDetail('invoice', inv)}>{inv.client?.company_name || `${inv.client?.first_name} ${inv.client?.last_name}`}</TableCell>
                    <TableCell className="text-sm font-semibold" onClick={() => openDetail('invoice', inv)}>{formatUGX(inv.total_amount)}</TableCell>
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
                <TableHead className="text-xs w-10"><Checkbox checked={paginated.length > 0 && paginated.every((q: any) => selectedIds.has(q.id))} onCheckedChange={() => toggleAll(paginated.map((q: any) => q.id))} /></TableHead>
                <TableHead className="text-xs">Quotation #</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Client</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Valid Until</TableHead>
                <TableHead className="text-xs w-8"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <DollarSign className="w-8 h-8 text-slate-300" />
                      <p>No quotations found</p>
                    </div>
                  </TableCell></TableRow>
                ) : paginated.map((q: any) => (
                  <TableRow key={q.id} className={`cursor-pointer hover:bg-slate-50 transition-colors ${selectedIds.has(q.id) ? 'bg-emerald-50/50' : ''}`}>
                    <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(q.id)} onCheckedChange={() => toggleSelect(q.id)} /></TableCell>
                    <TableCell className="font-mono text-xs" onClick={() => openDetail('quotation', q)}>{q.quote_number}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs" onClick={() => openDetail('quotation', q)}>{q.client?.company_name || `${q.client?.first_name} ${q.client?.last_name}`}</TableCell>
                    <TableCell className="text-sm font-semibold" onClick={() => openDetail('quotation', q)}>{formatUGX(q.amount || q.total_amount || 0)}</TableCell>
                    <TableCell onClick={() => openDetail('quotation', q)}>{statusBadge(q.status)}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-slate-500" onClick={() => openDetail('quotation', q)}>{q.valid_until ? new Date(q.valid_until).toLocaleDateString() : '—'}</TableCell>
                    <TableCell onClick={() => openDetail('quotation', q)}><ChevronRight className="w-4 h-4 text-slate-300" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <DataTablePagination totalItems={currentData.length} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1) }} />
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Receipt className="w-4 h-4 text-emerald-600" /></div>
              New Invoice
            </DialogTitle>
            <DialogDescription>Create a new invoice for a client</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label className="text-xs">Client</Label>
              <Select value={createForm.client_id} onValueChange={v => setCreateForm({ ...createForm, client_id: v })}>
                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.client_type === 'company' ? c.company_name : `${c.first_name} ${c.last_name}`}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Amount (UGX)</Label><Input type="number" className="h-9 text-xs mt-1" value={createForm.amount} onChange={e => setCreateForm({ ...createForm, amount: e.target.value })} /></div>
              <div><Label className="text-xs">Tax Amount</Label><Input type="number" className="h-9 text-xs mt-1" value={createForm.tax_amount} onChange={e => setCreateForm({ ...createForm, tax_amount: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Status</Label>
                <Select value={createForm.status} onValueChange={v => setCreateForm({ ...createForm, status: v })}>
                  <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="sent">Sent</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Due Date</Label><Input type="date" className="h-9 text-xs mt-1" value={createForm.due_date} onChange={e => setCreateForm({ ...createForm, due_date: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateInvoice}>Create Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
