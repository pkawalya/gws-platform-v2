'use client'

import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

interface SortableHeaderProps {
  label: string
  field: string
  sortField: string
  sortDir: 'asc' | 'desc'
  onSort: (f: string) => void
}

export function SortableHeader({ label, field, sortField, sortDir, onSort }: SortableHeaderProps) {
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
