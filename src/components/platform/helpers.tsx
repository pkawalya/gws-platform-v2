'use client'

import { ArrowUpDown, ArrowUp, ArrowDown, X, Trash2, Download, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { fmt, statusBadge } from './constants'
import {
  CheckCircle2, ChevronRight, Phone, Mail, MapPin, Clock3,
  Receipt, DollarSign, FileText, MessageSquare, ShieldCheck,
  ScrollText, Cpu, GitBranch, Activity, Database, Network,
} from 'lucide-react'
import React from 'react'

// ── Sortable Header ──
export function SortableHeader({ label, field, sortField, sortDir, onSort }: {
  label: string; field: string; sortField: string; sortDir: 'asc' | 'desc'; onSort: (f: string) => void
}) {
  return (
    <div className="flex items-center gap-1 cursor-pointer select-none hover:text-slate-900" onClick={() => onSort(field)}>
      <span>{label}</span>
      {sortField === field ? (
        sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-30" />
      )}
    </div>
  )
}

// ── Bulk Action Bar ──
export function BulkActionBar({ selectedCount, onClear, onAction }: {
  selectedCount: number; onClear: () => void; onAction: (action: string) => void
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between z-50 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-bold">{selectedCount}</div>
        <span className="text-sm font-medium">item{selectedCount > 1 ? 's' : ''} selected</span>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="secondary" className="h-8">Change Status</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onAction('status-active')}>Set Active</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('status-pending')}>Set Pending</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('status-completed')}>Set Completed</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('status-cancelled')}>Set Cancelled</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" variant="secondary" className="h-8" onClick={() => onAction('export')}>
          <Download className="w-3.5 h-3.5 mr-1" />Export
        </Button>
        <Button size="sm" variant="secondary" className="h-8" onClick={() => onAction('assign')}>
          <UserPlus className="w-3.5 h-3.5 mr-1" />Assign
        </Button>
        <Button size="sm" variant="destructive" className="h-8" onClick={() => onAction('delete')}>
          <Trash2 className="w-3.5 h-3.5 mr-1" />Delete
        </Button>
        <Button size="sm" variant="ghost" className="h-8 text-slate-300 hover:text-white" onClick={onClear}>
          <X className="w-3.5 h-3.5 mr-1" />Clear
        </Button>
      </div>
    </div>
  )
}

// ── Detail Field ──
export function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm mt-0.5">{value || '—'}</p>
    </div>
  )
}
