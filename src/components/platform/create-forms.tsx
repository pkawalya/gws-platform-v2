'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { UGANDA_DISTRICTS } from './constants'

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
    status: 'prospect',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [districtSuggestions, setDistrictSuggestions] = useState<string[]>([])

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
        setForm({ client_type: 'individual', first_name: '', last_name: '', company_name: '', email: '', phone: '', district: '', status: 'prospect' })
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

  const handleDistrictChange = (value: string) => {
    setForm(f => ({ ...f, district: value }))
    if (value.length > 0) {
      setDistrictSuggestions(UGANDA_DISTRICTS.filter(d => d.toLowerCase().startsWith(value.toLowerCase())).slice(0, 5))
    } else {
      setDistrictSuggestions([])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-600 text-sm">👤</span>
            </div>
            Add New Client
          </DialogTitle>
          <DialogDescription>Create a new client record in the system.</DialogDescription>
        </DialogHeader>
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

          {/* Location Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</p>
              <Separator className="flex-1" />
            </div>
            <div className="relative grid gap-1.5">
              <Label className="text-xs">District</Label>
              <Input className="h-9 text-sm" value={form.district} onChange={e => handleDistrictChange(e.target.value)} placeholder="Start typing..." />
              {districtSuggestions.length > 0 && (
                <div className="absolute z-50 w-full top-full mt-1 bg-white border rounded-md shadow-lg max-h-32 overflow-y-auto">
                  {districtSuggestions.map(d => (
                    <button key={d} className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 transition-colors" onClick={() => { setForm(f => ({ ...f, district: d })); setDistrictSuggestions([]) }}>
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); setErrors({}) }} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? 'Creating...' : 'Create Client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const [districtSuggestions, setDistrictSuggestions] = useState<string[]>([])

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

  const handleDistrictChange = (value: string) => {
    setForm(f => ({ ...f, district: value }))
    if (value.length > 0) {
      setDistrictSuggestions(UGANDA_DISTRICTS.filter(d => d.toLowerCase().startsWith(value.toLowerCase())).slice(0, 5))
    } else {
      setDistrictSuggestions([])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-600 text-sm">📍</span>
            </div>
            New Survey Project
          </DialogTitle>
          <DialogDescription>Create a new survey project for a client.</DialogDescription>
        </DialogHeader>
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
            <div className="relative grid gap-1.5">
              <Label className="text-xs">District</Label>
              <Input className="h-9 text-sm" value={form.district} onChange={e => handleDistrictChange(e.target.value)} placeholder="Start typing..." />
              {districtSuggestions.length > 0 && (
                <div className="absolute z-50 w-full top-full mt-1 bg-white border rounded-md shadow-lg max-h-32 overflow-y-auto">
                  {districtSuggestions.map(d => (
                    <button key={d} className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 transition-colors" onClick={() => { setForm(f => ({ ...f, district: d })); setDistrictSuggestions([]) }}>
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); setErrors({}) }} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !form.client_id} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-600 text-sm">💰</span>
            </div>
            New Invoice
          </DialogTitle>
          <DialogDescription>Create a new invoice for a client.</DialogDescription>
        </DialogHeader>
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
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); setErrors({}) }} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !form.client_id || !form.amount} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? 'Creating...' : 'Create Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
