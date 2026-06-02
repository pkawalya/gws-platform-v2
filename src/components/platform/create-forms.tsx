'use client'

import { useState } from 'react'
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { UGANDA_DISTRICTS, getRegions, getDistrictsForRegion, getCountiesForDistrict, getSubcountiesForCounty, getParishesForSubcounty } from './constants'

interface CreateClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onToast?: (type: 'success' | 'error', message: string) => void
}

export function CreateClientDialog({ open, onOpenChange, onSuccess, onToast }: CreateClientDialogProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    client_type: 'individual',
    first_name: '',
    last_name: '',
    company_name: '',
    email: '',
    phone: '',
    district: '',
    region: '',
    county: '',
    subcounty: '',
    parish: '',
    status: 'prospect',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (form.client_type === 'individual') {
      if (!form.first_name.trim()) errs.first_name = 'First name required'
      if (!form.last_name.trim()) errs.last_name = 'Last name required'
    } else {
      if (!form.company_name.trim()) errs.company_name = 'Company name required'
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        onSuccess()
        onOpenChange(false)
        setForm({ client_type: 'individual', first_name: '', last_name: '', company_name: '', email: '', phone: '', district: '', region: '', county: '', subcounty: '', parish: '', status: 'prospect' })
        setErrors({})
        onToast?.('success', 'Client created successfully')
      } else {
        onToast?.('error', 'Failed to create client')
      }
    } catch (e) {
      console.error(e)
      onToast?.('error', 'Failed to create client')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-600 text-sm">👤</span>
            </div>
            Add New Client
          </SheetTitle>
          <SheetDescription>Create a new client record in the system.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-5 py-4">
          {/* Classification Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classification</p>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Client Type <span className="text-red-500">*</span></Label>
                <Select value={form.client_type} onValueChange={v => setForm(f => ({ ...f, client_type: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Identity Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {form.client_type === 'individual' ? 'Personal Information' : 'Company Information'}
              </p>
              <Separator className="flex-1" />
            </div>
            {form.client_type === 'individual' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">First Name <span className="text-red-500">*</span></Label>
                  <Input className={`h-9 text-sm ${errors.first_name ? 'border-red-300' : ''}`} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
                  {errors.first_name && <p className="text-[10px] text-red-500">{errors.first_name}</p>}
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Last Name <span className="text-red-500">*</span></Label>
                  <Input className={`h-9 text-sm ${errors.last_name ? 'border-red-300' : ''}`} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
                  {errors.last_name && <p className="text-[10px] text-red-500">{errors.last_name}</p>}
                </div>
              </div>
            ) : (
              <div className="grid gap-1.5">
                <Label className="text-xs">Company Name <span className="text-red-500">*</span></Label>
                <Input className={`h-9 text-sm ${errors.company_name ? 'border-red-300' : ''}`} value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
                {errors.company_name && <p className="text-[10px] text-red-500">{errors.company_name}</p>}
              </div>
            )}
          </div>

          {/* Contact Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Details</p>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Email</Label>
                <Input type="email" className={`h-9 text-sm ${errors.email ? 'border-red-300' : ''}`} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                {errors.email && <p className="text-[10px] text-red-500">{errors.email}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Phone</Label>
                <Input className="h-9 text-sm" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+256..." />
              </div>
            </div>
          </div>

          {/* Location Section - Cascading Dropdowns */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</p>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Region</Label>
                <Select value={form.region} onValueChange={v => setForm(f => ({ ...f, region: v, district: '', county: '', subcounty: '', parish: '' }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {getRegions().map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">District</Label>
                <Select value={form.district} onValueChange={v => setForm(f => ({ ...f, district: v, county: '', subcounty: '', parish: '' }))} disabled={!form.region}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent>
                    {getDistrictsForRegion(form.region).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">County</Label>
                <Select value={form.county} onValueChange={v => setForm(f => ({ ...f, county: v, subcounty: '', parish: '' }))} disabled={!form.district}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select county" /></SelectTrigger>
                  <SelectContent>
                    {getCountiesForDistrict(form.district).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Subcounty</Label>
                <Select value={form.subcounty} onValueChange={v => setForm(f => ({ ...f, subcounty: v, parish: '' }))} disabled={!form.county}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select subcounty" /></SelectTrigger>
                  <SelectContent>
                    {getSubcountiesForCounty(form.district, form.county).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Parish</Label>
                <Select value={form.parish} onValueChange={v => setForm(f => ({ ...f, parish: v }))} disabled={!form.subcounty}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select parish" /></SelectTrigger>
                  <SelectContent>
                    {getParishesForSubcounty(form.district, form.county, form.subcounty).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button onClick={handleSubmit} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? 'Creating...' : 'Create Client'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  clients: Array<{ id: number; client_ref: string; first_name: string | null; last_name: string | null; company_name: string | null; client_type: string }>
  onToast?: (type: 'success' | 'error', message: string) => void
}

export function CreateProjectDialog({ open, onOpenChange, onSuccess, clients, onToast }: CreateProjectDialogProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    project_type: 'cadastral',
    client_id: '',
    district: '',
    priority: 'normal',
    status: 'intake',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'Project title required'
    if (!form.client_id) errs.client_id = 'Select a client'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, client_id: Number(form.client_id) }),
      })
      if (res.ok) {
        onSuccess()
        onOpenChange(false)
        setForm({ title: '', project_type: 'cadastral', client_id: '', district: '', priority: 'normal', status: 'intake' })
        setErrors({})
        onToast?.('success', 'Project created successfully')
      } else {
        onToast?.('error', 'Failed to create project')
      }
    } catch (e) {
      console.error(e)
      onToast?.('error', 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-600 text-sm">📍</span>
            </div>
            New Survey Project
          </SheetTitle>
          <SheetDescription>Create a new survey project for a client.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-5 py-4">
          {/* Project Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project Details</p>
              <Separator className="flex-1" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Project Title <span className="text-red-500">*</span></Label>
              <Input className={`h-9 text-sm ${errors.title ? 'border-red-300' : ''}`} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Land Survey - Kampala Block 234" />
              {errors.title && <p className="text-[10px] text-red-500">{errors.title}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Project Type</Label>
                <Select value={form.project_type} onValueChange={v => setForm(f => ({ ...f, project_type: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cadastral">Cadastral</SelectItem>
                    <SelectItem value="topographic">Topographic</SelectItem>
                    <SelectItem value="boundary">Boundary</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="hydrographic">Hydrographic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Client Assignment */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Assignment</p>
              <Separator className="flex-1" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Client <span className="text-red-500">*</span></Label>
              <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
                <SelectTrigger className={`h-9 text-sm ${errors.client_id ? 'border-red-300' : ''}`}><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {clients.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.client_type === 'company' ? c.company_name : `${c.first_name} ${c.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_id && <p className="text-[10px] text-red-500">{errors.client_id}</p>}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</p>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">District</Label>
                <Input className="h-9 text-sm" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} placeholder="District" />
              </div>
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button onClick={handleSubmit} disabled={loading || !form.client_id} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

interface CreateInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  clients: Array<{ id: number; client_ref: string; first_name: string | null; last_name: string | null; company_name: string | null; client_type: string }>
  onToast?: (type: 'success' | 'error', message: string) => void
}

export function CreateInvoiceDialog({ open, onOpenChange, onSuccess, clients, onToast }: CreateInvoiceDialogProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    client_id: '',
    amount: '',
    tax_amount: '',
    status: 'draft',
    due_date: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.client_id) errs.client_id = 'Select a client'
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = 'Enter a valid amount'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const amount = Number(form.amount)
      const taxAmount = form.tax_amount ? Number(form.tax_amount) : 0
      const totalAmount = amount + taxAmount
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: Number(form.client_id),
          invoice_number: invoiceNumber,
          amount,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          status: form.status,
          due_date: form.due_date || null,
        }),
      })
      if (res.ok) {
        onSuccess()
        onOpenChange(false)
        setForm({ client_id: '', amount: '', tax_amount: '', status: 'draft', due_date: '' })
        setErrors({})
        onToast?.('success', 'Invoice created successfully')
      } else {
        onToast?.('error', 'Failed to create invoice')
      }
    } catch (e) {
      console.error(e)
      onToast?.('error', 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  const totalPreview = (parseFloat(form.amount) || 0) + (parseFloat(form.tax_amount) || 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-600 text-sm">💰</span>
            </div>
            New Invoice
          </SheetTitle>
          <SheetDescription>Create a new invoice for a client.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-5 py-4">
          {/* Client Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</p>
              <Separator className="flex-1" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Client <span className="text-red-500">*</span></Label>
              <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
                <SelectTrigger className={`h-9 text-sm ${errors.client_id ? 'border-red-300' : ''}`}><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {clients.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.client_type === 'company' ? c.company_name : `${c.first_name} ${c.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_id && <p className="text-[10px] text-red-500">{errors.client_id}</p>}
            </div>
          </div>

          {/* Amount Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amounts (UGX)</p>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Base Amount <span className="text-red-500">*</span></Label>
                <Input type="number" className={`h-9 text-sm ${errors.amount ? 'border-red-300' : ''}`} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
                {errors.amount && <p className="text-[10px] text-red-500">{errors.amount}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Tax Amount</Label>
                <Input type="number" className="h-9 text-sm" value={form.tax_amount} onChange={e => setForm(f => ({ ...f, tax_amount: e.target.value }))} placeholder="0" />
              </div>
            </div>
            {totalPreview > 0 && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-700">Total</span>
                <span className="text-sm font-bold text-emerald-800">UGX {totalPreview.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Status & Due Date */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</p>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Due Date</Label>
                <Input type="date" className="h-9 text-sm" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button onClick={handleSubmit} disabled={loading || !form.client_id || !form.amount} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? 'Creating...' : 'Create Invoice'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
