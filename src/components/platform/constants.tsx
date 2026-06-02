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

// Uganda districts for autocomplete (kept for backwards compat)
export const UGANDA_DISTRICTS = [
  'Kampala', 'Wakiso', 'Mukono', 'Jinja', 'Entebbe', 'Mbale', 'Gulu',
  'Lira', 'Fort Portal', 'Mbarara', 'Masaka', 'Kasese', 'Arua', 'Soroti',
  'Pallisa', 'Tororo', 'Iganga', 'Hoima', 'Masindi', 'Kabarole',
  'Bushenyi', 'Kamuli', 'Luweero', 'Mpigi', 'Mubende', 'Nakasongola',
  'Rakai', 'Sembabule', 'Kalangala', 'Kayunga', 'Kiboga', 'Mityana',
  'Nakaseke', 'Amuria', 'Budaka', 'Bududa', 'Bugiri', 'Bukedea',
  'Bukwo', 'Bulisa', 'Bundibugyo', 'Busia', 'Butaleja', 'Dokolo',
  'Kaabong', 'Kaberamaido', 'Kamwenge', 'Kanungu',
  'Kapchorwa', 'Katakwi', 'Kibaale', 'Kibale', 'Kibuku', 'Kiruhura',
  'Kiryandongo', 'Kisoro', 'Kitgum', 'Koboko', 'Kotido', 'Kumi',
  'Kyenjojo', 'Lamwo', 'Manafwa', 'Maracha', 'Mayuge', 'Moroto',
  'Moyo', 'Namutumba', 'Nebbi', 'Ngora', 'Ntungamo', 'Otuke',
  'Oyam', 'Pader', 'Pakwach', 'Rubirizi', 'Sironko',
  'Yumbe', 'Zombo', 'Agago', 'Alebtong', 'Amolatar', 'Amudat',
  'Apac', 'Buvuma', 'Gomba', 'Isingiro', 'Kagadi',
  'Kakumiro', 'Kwania', 'Kyankwanzi', 'Lwengo', 'Mitooma',
  'Namayingo', 'Napak', 'Ntoroko', 'Nwoya', 'Omoro', 'Rubanda',
  'Rukungiri', 'Sheema', 'Kyegegwa', 'Kikuube',
]

// ══════════════════════════════════════════════════════════════
// UGANDA ADMINISTRATIVE HIERARCHY (UBOS Data)
// Region → District → County → Subcounty → Parish → Village
// ══════════════════════════════════════════════════════════════

export interface ParishData {
  name: string
  villages?: string[]
}

export interface SubcountyData {
  name: string
  parishes: ParishData[]
}

export interface CountyData {
  name: string
  subcounties: SubcountyData[]
}

export interface DistrictData {
  name: string
  counties: CountyData[]
}

export interface RegionData {
  name: string
  districts: DistrictData[]
}

export const UGANDA_HIERARCHY: RegionData[] = [
  {
    name: 'Central',
    districts: [
      {
        name: 'Kampala',
        counties: [
          { name: 'Kampala Central', subcounties: [
            { name: 'Kampala Central Division', parishes: [{ name: 'Nakasero', villages: ['Nakasero Hill', 'Upper Kololo'] }, { name: 'Kololo', villages: ['Lower Kololo', 'Arts Village'] }] },
            { name: 'Makindye Division', parishes: [{ name: 'Makindye', villages: ['Makindye Central'] }, { name: 'Kansanga', villages: ['Kansanga East', 'Kansanga West'] }] },
          ]},
          { name: 'Kawempe', subcounties: [
            { name: 'Kawempe Division', parishes: [{ name: 'Kawempe', villages: ['Kawempe I', 'Kawempe II'] }, { name: 'Bwaise', villages: ['Bwaise I', 'Bwaise II', 'Bwaise III'] }] },
          ]},
          { name: 'Rubaga', subcounties: [
            { name: 'Rubaga Division', parishes: [{ name: 'Rubaga', villages: ['Rubaga Hill', 'Rubaga Cathedral'] }, { name: 'Nateete', villages: ['Nateete Central', 'Kisenyi'] }] },
          ]},
        ]
      },
      {
        name: 'Wakiso',
        counties: [
          { name: 'Busiro', subcounties: [
            { name: 'Entebbe Municipality', parishes: [{ name: 'Entebbe Central', villages: ['Entebbe Town', 'Lake Side'] }, { name: 'Katabi', villages: ['Katabi Busambaga', 'Katabi Church'] }] },
            { name: 'Nansana Municipality', parishes: [{ name: 'Nansana', villages: ['Nansana East', 'Nansana West'] }] },
          ]},
          { name: 'Kyaddondo', subcounties: [
            { name: 'Kira Municipality', parishes: [{ name: 'Kira', villages: ['Kira Town', 'Bweyogerere'] }, { name: 'Namugongo', villages: ['Namugongo Central', 'Kyaliwajjala'] }] },
          ]},
          { name: 'Bulemeezi', subcounties: [
            { name: 'Mityana', parishes: [{ name: 'Mityana Central', villages: ['Mityana Town'] }] },
          ]},
        ]
      },
      {
        name: 'Mukono',
        counties: [
          { name: 'Mukono Municipality', subcounties: [
            { name: 'Mukono Central', parishes: [{ name: 'Mukono Town', villages: ['Mukono Central', 'Mukono East'] }, { name: 'Ntinda', villages: ['Ntinda Central'] }] },
          ]},
          { name: 'Buikwe', subcounties: [
            { name: 'Buikwe', parishes: [{ name: 'Buikwe Central', villages: ['Buikwe Town'] }, { name: 'Lugazi', villages: ['Lugazi Central', 'Lugazi East'] }] },
          ]},
        ]
      },
      {
        name: 'Mpigi',
        counties: [
          { name: 'Mawokota', subcounties: [
            { name: 'Mpigi Town Council', parishes: [{ name: 'Mpigi Central', villages: ['Mpigi Town'] }] },
            { name: 'Buddu', parishes: [{ name: 'Buddu Central', villages: ['Buddu'] }] },
          ]},
        ]
      },
      {
        name: 'Masaka',
        counties: [
          { name: 'Masaka Municipality', subcounties: [
            { name: 'Masaka Central', parishes: [{ name: 'Masaka Town', villages: ['Masaka Central', 'Nyendo'] }, { name: 'Kyanamukaka', villages: ['Kyanamukaka Central'] }] },
          ]},
          { name: 'Buddu', subcounties: [
            { name: 'Bukomansimbi', parishes: [{ name: 'Bukomansimbi Central', villages: ['Bukomansimbi Town'] }] },
          ]},
        ]
      },
      {
        name: 'Kalangala',
        counties: [
          { name: 'Bujjumba', subcounties: [
            { name: 'Kalangala Town Council', parishes: [{ name: 'Kalangala Central', villages: ['Kalangala Town', 'Bugala'] }] },
          ]},
        ]
      },
      {
        name: 'Mubende',
        counties: [
          { name: 'Mubende Municipality', subcounties: [
            { name: 'Mubende Central', parishes: [{ name: 'Mubende Town', villages: ['Mubende Central'] }] },
          ]},
        ]
      },
      {
        name: 'Rakai',
        counties: [
          { name: 'Kooki', subcounties: [
            { name: 'Rakai Town Council', parishes: [{ name: 'Rakai Central', villages: ['Rakai Town'] }] },
          ]},
        ]
      },
    ]
  },
  {
    name: 'Eastern',
    districts: [
      {
        name: 'Jinja',
        counties: [
          { name: 'Jinja Municipality', subcounties: [
            { name: 'Jinja Central', parishes: [{ name: 'Jinja Town', villages: ['Jinja Central', 'Jinja Industrial'] }, { name: 'Bugembe', villages: ['Bugembe Central'] }] },
          ]},
          { name: 'Butembe', subcounties: [
            { name: 'Kagoma', parishes: [{ name: 'Kagoma Central', villages: ['Kagoma'] }] },
          ]},
        ]
      },
      {
        name: 'Mbale',
        counties: [
          { name: 'Mbale Municipality', subcounties: [
            { name: 'Mbale Central', parishes: [{ name: 'Mbale Town', villages: ['Mbale Central', 'Nkoma'] }, { name: 'Industrial', villages: ['Industrial Division'] }] },
          ]},
          { name: 'Bungokho', subcounties: [
            { name: 'Bungokho', parishes: [{ name: 'Bungokho Central', villages: ['Bungokho'] }] },
          ]},
        ]
      },
      {
        name: 'Iganga',
        counties: [
          { name: 'Iganga Municipality', subcounties: [
            { name: 'Iganga Central', parishes: [{ name: 'Iganga Town', villages: ['Iganga Central'] }] },
          ]},
          { name: 'Kigulu', subcounties: [
            { name: 'Kigulu', parishes: [{ name: 'Kigulu Central', villages: ['Kigulu'] }] },
          ]},
        ]
      },
      {
        name: 'Soroti',
        counties: [
          { name: 'Soroti Municipality', subcounties: [
            { name: 'Soroti Central', parishes: [{ name: 'Soroti Town', villages: ['Soroti Central', 'Soroti East'] }] },
          ]},
          { name: 'Asuret', subcounties: [
            { name: 'Asuret', parishes: [{ name: 'Asuret Central', villages: ['Asuret'] }] },
          ]},
        ]
      },
      {
        name: 'Tororo',
        counties: [
          { name: 'Tororo Municipality', subcounties: [
            { name: 'Tororo Central', parishes: [{ name: 'Tororo Town', villages: ['Tororo Central', 'Tororo East'] }] },
          ]},
          { name: 'West Budama', subcounties: [
            { name: 'Rubongi', parishes: [{ name: 'Rubongi Central', villages: ['Rubongi'] }] },
          ]},
        ]
      },
      {
        name: 'Kamuli',
        counties: [
          { name: 'Kamuli Municipality', subcounties: [
            { name: 'Kamuli Central', parishes: [{ name: 'Kamuli Town', villages: ['Kamuli Central'] }] },
          ]},
        ]
      },
      {
        name: 'Bugiri',
        counties: [
          { name: 'Bugiri Municipality', subcounties: [
            { name: 'Bugiri Central', parishes: [{ name: 'Bugiri Town', villages: ['Bugiri Central'] }] },
          ]},
        ]
      },
    ]
  },
  {
    name: 'Northern',
    districts: [
      {
        name: 'Gulu',
        counties: [
          { name: 'Gulu Municipality', subcounties: [
            { name: 'Gulu Central', parishes: [{ name: 'Gulu Town', villages: ['Gulu Central', 'Layibi'] }, { name: 'Bardege', villages: ['Bardege Central'] }] },
          ]},
          { name: 'Aswa', subcounties: [
            { name: 'Aswa', parishes: [{ name: 'Aswa Central', villages: ['Aswa'] }] },
          ]},
        ]
      },
      {
        name: 'Lira',
        counties: [
          { name: 'Lira Municipality', subcounties: [
            { name: 'Lira Central', parishes: [{ name: 'Lira Town', villages: ['Lira Central', 'Lira East'] }] },
          ]},
          { name: 'Lango', subcounties: [
            { name: 'Erute', parishes: [{ name: 'Erute Central', villages: ['Erute'] }] },
          ]},
        ]
      },
      {
        name: 'Arua',
        counties: [
          { name: 'Arua Municipality', subcounties: [
            { name: 'Arua Central', parishes: [{ name: 'Arua Town', villages: ['Arua Central', 'Arua Hill'] }] },
          ]},
          { name: 'Madi Okollo', subcounties: [
            { name: 'Madi Okollo', parishes: [{ name: 'Madi Okollo Central', villages: ['Madi Okollo'] }] },
          ]},
        ]
      },
      {
        name: 'Kitgum',
        counties: [
          { name: 'Kitgum Municipality', subcounties: [
            { name: 'Kitgum Central', parishes: [{ name: 'Kitgum Town', villages: ['Kitgum Central'] }] },
          ]},
        ]
      },
      {
        name: 'Pader',
        counties: [
          { name: 'Pader Town Council', subcounties: [
            { name: 'Pader Central', parishes: [{ name: 'Pader Town', villages: ['Pader Central'] }] },
          ]},
        ]
      },
      {
        name: 'Moroto',
        counties: [
          { name: 'Moroto Municipality', subcounties: [
            { name: 'Moroto Central', parishes: [{ name: 'Moroto Town', villages: ['Moroto Central'] }] },
          ]},
        ]
      },
      {
        name: 'Apac',
        counties: [
          { name: 'Apac Municipality', subcounties: [
            { name: 'Apac Central', parishes: [{ name: 'Apac Town', villages: ['Apac Central'] }] },
          ]},
        ]
      },
      {
        name: 'Kotido',
        counties: [
          { name: 'Kotido Municipality', subcounties: [
            { name: 'Kotido Central', parishes: [{ name: 'Kotido Town', villages: ['Kotido Central'] }] },
          ]},
        ]
      },
    ]
  },
  {
    name: 'Western',
    districts: [
      {
        name: 'Mbarara',
        counties: [
          { name: 'Mbarara Municipality', subcounties: [
            { name: 'Mbarara Central', parishes: [{ name: 'Mbarara Town', villages: ['Mbarara Central', 'Kakoba'] }, { name: 'Nyamitanga', villages: ['Nyamitanga Central'] }] },
          ]},
          { name: 'Kashari', subcounties: [
            { name: 'Kashari', parishes: [{ name: 'Kashari Central', villages: ['Kashari'] }] },
          ]},
        ]
      },
      {
        name: 'Kasese',
        counties: [
          { name: 'Kasese Municipality', subcounties: [
            { name: 'Kasese Central', parishes: [{ name: 'Kasese Town', villages: ['Kasese Central', 'Kasese East'] }] },
          ]},
          { name: 'Busongora', subcounties: [
            { name: 'Busongora', parishes: [{ name: 'Busongora Central', villages: ['Busongora'] }] },
          ]},
        ]
      },
      {
        name: 'Fort Portal',
        counties: [
          { name: 'Fort Portal Municipality', subcounties: [
            { name: 'Fort Portal Central', parishes: [{ name: 'Fort Portal Town', villages: ['Fort Portal Central', 'Kabundaire'] }] },
          ]},
          { name: 'Burahya', subcounties: [
            { name: 'Burahya', parishes: [{ name: 'Burahya Central', villages: ['Burahya'] }] },
          ]},
        ]
      },
      {
        name: 'Hoima',
        counties: [
          { name: 'Hoima Municipality', subcounties: [
            { name: 'Hoima Central', parishes: [{ name: 'Hoima Town', villages: ['Hoima Central', 'Hoima East'] }] },
          ]},
          { name: 'Buhaguzi', subcounties: [
            { name: 'Buhaguzi', parishes: [{ name: 'Buhaguzi Central', villages: ['Buhaguzi'] }] },
          ]},
        ]
      },
      {
        name: 'Masindi',
        counties: [
          { name: 'Masindi Municipality', subcounties: [
            { name: 'Masindi Central', parishes: [{ name: 'Masindi Town', villages: ['Masindi Central'] }] },
          ]},
          { name: 'Bujenje', subcounties: [
            { name: 'Bujenje', parishes: [{ name: 'Bujenje Central', villages: ['Bujenje'] }] },
          ]},
        ]
      },
      {
        name: 'Kabarole',
        counties: [
          { name: 'Kabarole', subcounties: [
            { name: 'Kabarole Central', parishes: [{ name: 'Kabarole Town', villages: ['Kabarole Central'] }] },
          ]},
        ]
      },
      {
        name: 'Bushenyi',
        counties: [
          { name: 'Bushenyi Municipality', subcounties: [
            { name: 'Bushenyi Central', parishes: [{ name: 'Bushenyi Town', villages: ['Bushenyi Central'] }] },
          ]},
        ]
      },
      {
        name: 'Kisoro',
        counties: [
          { name: 'Kisoro Municipality', subcounties: [
            { name: 'Kisoro Central', parishes: [{ name: 'Kisoro Town', villages: ['Kisoro Central'] }] },
          ]},
        ]
      },
    ]
  },
]

// ── Helper functions for cascading dropdowns ──

export function getRegions(): string[] {
  return UGANDA_HIERARCHY.map(r => r.name)
}

export function getDistrictsForRegion(region: string): string[] {
  const r = UGANDA_HIERARCHY.find(r => r.name === region)
  return r ? r.districts.map(d => d.name) : []
}

export function getCountiesForDistrict(district: string): string[] {
  for (const r of UGANDA_HIERARCHY) {
    const d = r.districts.find(d => d.name === district)
    if (d) return d.counties.map(c => c.name)
  }
  return []
}

export function getSubcountiesForCounty(district: string, county: string): string[] {
  for (const r of UGANDA_HIERARCHY) {
    const d = r.districts.find(d => d.name === district)
    if (d) {
      const c = d.counties.find(c => c.name === county)
      if (c) return c.subcounties.map(s => s.name)
    }
  }
  return []
}

export function getParishesForSubcounty(district: string, county: string, subcounty: string): string[] {
  for (const r of UGANDA_HIERARCHY) {
    const d = r.districts.find(d => d.name === district)
    if (d) {
      const c = d.counties.find(c => c.name === county)
      if (c) {
        const s = c.subcounties.find(s => s.name === subcounty)
        if (s) return s.parishes.map(p => p.name)
      }
    }
  }
  return []
}

export function findRegionForDistrict(district: string): string {
  for (const r of UGANDA_HIERARCHY) {
    if (r.districts.find(d => d.name === district)) return r.name
  }
  return ''
}

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
