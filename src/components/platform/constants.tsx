// GWS Platform V2 — Constants & Helpers

import { Badge } from '@/components/ui/badge'

export const STATUS_COLORS: Record<string, string> = {
  intake: '#6366f1', field_survey: '#3b82f6', data_processing: '#f59e0b',
  completed: '#059669', pending: '#94a3b8', draft: '#64748b',
  paid: '#10b981', in_progress: '#3b82f6', active: '#10b981', prospect: '#6366f1',
  overdue: '#ef4444', cancelled: '#6b7280', sent: '#3b82f6',
  approved: '#10b981', deferred: '#f59e0b', delivered: '#10b981',
  failed: '#ef4444', queued: '#94a3b8',
}

export const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  normal: 'bg-slate-100 text-slate-700 border-slate-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
}

export const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  prospect: 'bg-blue-100 text-blue-800 border-blue-200',
  intake: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  field_survey: 'bg-blue-100 text-blue-800 border-blue-200',
  data_processing: 'bg-amber-100 text-amber-800 border-amber-200',
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  synced: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  overdue: 'bg-red-100 text-red-800 border-red-200',
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  sent: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  deferred: 'bg-amber-100 text-amber-800 border-amber-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  queued: 'bg-slate-100 text-slate-700 border-slate-200',
  unread: 'bg-blue-100 text-blue-800 border-blue-200',
  verified: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  unverified: 'bg-amber-100 text-amber-800 border-amber-200',
}

// Uganda districts for autocomplete
export const UGANDA_DISTRICTS = [
  'Kampala', 'Wakiso', 'Mukono', 'Jinja', 'Entebbe', 'Mbale', 'Gulu',
  'Lira', 'Fort Portal', 'Mbarara', 'Masaka', 'Kasese', 'Arua', 'Soroti',
  'Pallisa', 'Tororo', 'Iganga', 'Hoima', 'Masindi', 'Kabarole',
  'Bushenyi', 'Kamuli', 'Luweero', 'Mpigi', 'Mubende', 'Nakasongola',
  'Rakai', 'Sembabule', 'Kalangala', 'Kayunga', 'Kiboga', 'Mityana',
  'Nakaseke', 'Wakiso', 'Amuria', 'Budaka', 'Bududa', 'Bugiri', 'Bukedea',
  'Bukwo', 'Bulisa', 'Bundibugyo', 'Busia', 'Butaleja', 'Dokolo',
  'Kaabong', 'Kaberamaido', 'Kalinzu', 'Kampala', 'Kamwenge', 'Kanungu',
  'Kapchorwa', 'Katakwi', 'Kibaale', 'Kibale', 'Kibuku', 'Kiruhura',
  'Kiryandongo', 'Kisoro', 'Kitgum', 'Koboko', 'Kotido', 'Kumi',
  'Kyenjojo', 'Lamwo', 'Manafwa', 'Maracha', 'Mayuge', 'Moroto',
  'Moyo', 'Namutumba', 'Nebbi', 'Ngora', 'Ntungamo', 'Otuke',
  'Oyam', 'Pader', 'Pakwach', 'Rubirizi', 'Sironko', 'Teso',
  'Yumbe', 'Zombo', 'Agago', 'Alebtong', 'Amolatar', 'Amudat',
  'Apac', 'Buvuma', 'Bwanja', 'Gomba', 'Isingiro', 'Kagadi',
  'Kakumiro', 'Kwania', 'Kyankwanzi', 'Lwengo', 'Mitooma',
  'Namayingo', 'NAPAK', 'Ntoroko', 'Nwoya', 'Omoro', 'Rubanda',
  'Rukungiri', 'Sheema', 'Kyegegwa', 'Kikuube', 'Pakwach',
]

export function fmt(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export function statusBadge(status: string) {
  return (
    <Badge variant="outline" className={`text-xs ${STATUS_BADGE[status] || 'bg-slate-100 text-slate-600'}`}>
      {fmt(status)}
    </Badge>
  )
}

export function formatUGX(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return 'UGX 0'
  if (num >= 1000000000) return `UGX ${(num / 1000000000).toFixed(1)}B`
  if (num >= 1000000) return `UGX ${(num / 1000000).toFixed(1)}M`
  return `UGX ${num.toLocaleString()}`
}

// Column visibility toggle helper
export const COMMON_COLUMNS = {
  ref: { key: 'ref', label: 'Ref', defaultVisible: true },
  name: { key: 'name', label: 'Name', defaultVisible: true },
  district: { key: 'district', label: 'District', defaultVisible: true },
  contact: { key: 'contact', label: 'Contact', defaultVisible: false },
  status: { key: 'status', label: 'Status', defaultVisible: true },
  type: { key: 'type', label: 'Type', defaultVisible: true },
  priority: { key: 'priority', label: 'Priority', defaultVisible: true },
  area: { key: 'area', label: 'Area', defaultVisible: false },
  date: { key: 'date', label: 'Date', defaultVisible: true },
}
