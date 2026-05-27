'use client'

interface DetailFieldProps {
  label: string
  value: React.ReactNode
}

export function DetailField({ label, value }: DetailFieldProps) {
  return <div><p className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</p><p className="text-sm mt-0.5">{value || '—'}</p></div>
}
