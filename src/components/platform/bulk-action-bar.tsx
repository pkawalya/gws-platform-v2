'use client'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Download, UserPlus, X, Trash2 } from 'lucide-react'

interface BulkActionBarProps {
  selectedCount: number
  onClear: () => void
  onAction: (action: string) => void
}

export function BulkActionBar({ selectedCount, onClear, onAction }: BulkActionBarProps) {
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
