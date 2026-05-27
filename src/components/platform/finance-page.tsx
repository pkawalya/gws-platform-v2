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
import { Receipt, CheckCircle2, Clock, AlertCircle, DollarSign, ChevronRight, Plus } from 'lucide-react'
import { fmt, statusBadge } from './constants'
import { SortableHeader } from './helpers'
import { DataTablePagination } from './data-table-pagination'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import type { ClientRecord } from './types'

interface FinancePageProps {
  financeData: any
  clients: ClientRecord[]
  openDetail: (type: string, data: any) => void
  selectedIds: Set<number>
  toggleSelect: (id: number) => void
  toggleAll: (ids: number[]) => void
}

export function FinancePage({ financeData, clients, openDetail, selectedIds, toggleSelect, toggleAll }: FinancePageProps) {
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

  const revenueChartData = invoices.reduce((acc: any[], inv: any) => {
    const month = new Date(inv.created_at).toLocaleDateString('en-UG', { month: 'short', year: '2-digit' })
    const existing = acc.find(a => a.name === month)
    if (existing) { existing.Invoiced += Number(inv.total_amount); if (inv.status === 'paid') existing.Paid += Number(inv.total_amount) }
    else acc.push({ name: month, Invoiced: Number(inv.total_amount), Paid: inv.status === 'paid' ? Number(inv.total_amount) : 0 })
    return acc
  }, [])

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
      if (res.ok) { setShowCreateDialog(false); window.location.reload() }
    } catch (e) { console.error(e) }
  }

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
        <CardContent className="pt-6">
          <p className="text-sm font-semibold mb-3">Revenue Overview</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} />
              <RechartsTooltip /><Bar dataKey="Invoiced" fill="#94a3b8" radius={[3, 3, 0, 0]} /><Bar dataKey="Paid" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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
                {paginated.map((inv: any) => (
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
                <TableHead className="text-xs w-10"><Checkbox checked={paginated.length > 0 && paginated.every((q: any) => selectedIds.has(q.id))} onCheckedChange={() => toggleAll(paginated.map((q: any) => q.id))} /></TableHead>
                <TableHead className="text-xs">Quotation #</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Client</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Valid Until</TableHead>
                <TableHead className="text-xs w-8"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {paginated.map((q: any) => (
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
          <DataTablePagination totalItems={currentData.length} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1) }} />
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>New Invoice</DialogTitle>
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
