'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from 'sonner'
import type { PageId, ClientRecord, ProjectRecord, DetailPanelState } from '@/components/platform/types'

// ── Helper ──
async function fetchEndpoint(endpoint: string) {
  const res = await fetch(endpoint)
  if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`)
  return res.json()
}

// ── CSV Helpers (used by bulk actions) ──
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return ''
  const keys = Object.keys(data[0]).filter(k => !k.startsWith('_') && typeof data[0][k] !== 'object')
  const header = keys.join(',')
  const rows = data.map(row =>
    keys.map(k => {
      const val = row[k]
      if (val === null || val === undefined) return ''
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }).join(',')
  )
  return [header, ...rows].join('\n')
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// ── Store Types ──
interface GWSState {
  // Navigation
  page: PageId
  detailPanel: DetailPanelState
  detailReturnPage: PageId

  // Data
  dashData: any
  clients: ClientRecord[]
  projects: ProjectRecord[]
  workflows: any[]
  spatial: any
  fieldSync: any
  aiData: any
  financeData: any
  documentsData: any
  commsData: any
  approvalsData: any
  eventsData: any
  orgsData: any
  reportsData: any

  // UI
  search: string
  selectedIds: Set<number>
  commandOpen: boolean
  loading: boolean
  darkMode: boolean

  // Navigation actions
  setPage: (page: PageId) => void
  openDetail: (type: string, data: any) => void
  closeDetail: () => void

  // Data setters
  setDashData: (data: any) => void
  setClients: (data: ClientRecord[]) => void
  setProjects: (data: ProjectRecord[]) => void
  setWorkflows: (data: any[]) => void
  setSpatial: (data: any) => void
  setFieldSync: (data: any) => void
  setAiData: (data: any) => void
  setFinanceData: (data: any) => void
  setDocumentsData: (data: any) => void
  setCommsData: (data: any) => void
  setApprovalsData: (data: any) => void
  setEventsData: (data: any) => void
  setOrgsData: (data: any) => void
  setReportsData: (data: any) => void

  // UI actions
  setSearch: (search: string) => void
  setCommandOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
  toggleDarkMode: () => void

  // Selection actions
  toggleSelect: (id: number) => void
  toggleAll: (ids: number[]) => void
  clearSelection: () => void

  // Toast
  showToast: (type: 'success' | 'error', message: string) => void

  // Data refresh
  refreshData: (endpoints?: string[]) => Promise<void>
  refreshWithDashboard: (endpoints: string[]) => Promise<void>
  fetchAllData: () => Promise<void>

  // Bulk actions
  handleBulkAction: (action: string) => Promise<void>
}

export const useGWSStore = create<GWSState>()(
  persist(
    (set, get) => ({
      // ── Navigation ──
      page: 'dashboard' as PageId,
      detailPanel: { open: false, type: '', data: null } as DetailPanelState,
      detailReturnPage: 'dashboard' as PageId,

      // ── Data ──
      dashData: null,
      clients: [] as ClientRecord[],
      projects: [] as ProjectRecord[],
      workflows: [] as any[],
      spatial: null,
      fieldSync: null,
      aiData: null,
      financeData: null,
      documentsData: null,
      commsData: null,
      approvalsData: null,
      eventsData: null,
      orgsData: null,
      reportsData: null,

      // ── UI ──
      search: '',
      selectedIds: new Set<number>(),
      commandOpen: false,
      loading: true,
      darkMode: false,

      // ── Navigation Actions ──
      setPage: (page) => set({ page, search: '', selectedIds: new Set() }),

      openDetail: (type, data) => {
        const { page } = get()
        set({
          detailReturnPage: page,
          detailPanel: { open: true, type, data },
        })
      },

      closeDetail: () => set({ detailPanel: { open: false, type: '', data: null } }),

      // ── Data Setters ──
      setDashData: (data) => set({ dashData: data }),
      setClients: (data) => set({ clients: data }),
      setProjects: (data) => set({ projects: data }),
      setWorkflows: (data) => set({ workflows: data }),
      setSpatial: (data) => set({ spatial: data }),
      setFieldSync: (data) => set({ fieldSync: data }),
      setAiData: (data) => set({ aiData: data }),
      setFinanceData: (data) => set({ financeData: data }),
      setDocumentsData: (data) => set({ documentsData: data }),
      setCommsData: (data) => set({ commsData: data }),
      setApprovalsData: (data) => set({ approvalsData: data }),
      setEventsData: (data) => set({ eventsData: data }),
      setOrgsData: (data) => set({ orgsData: data }),
      setReportsData: (data) => set({ reportsData: data }),

      // ── UI Actions ──
      setSearch: (search) => set({ search }),
      setCommandOpen: (open) => set({ commandOpen: open }),
      setLoading: (loading) => set({ loading }),

      toggleDarkMode: () => {
        const next = !get().darkMode
        if (next) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('gws-dark-mode', String(next))
        set({ darkMode: next })
      },

      // ── Selection Actions ──
      toggleSelect: (id) => {
        const prev = get().selectedIds
        const next = new Set(prev)
        if (next.has(id)) { next.delete(id) } else { next.add(id) }
        set({ selectedIds: next })
      },

      toggleAll: (ids) => {
        const prev = get().selectedIds
        const allSelected = ids.length > 0 && ids.every(id => prev.has(id))
        const next = new Set(prev)
        if (allSelected) { ids.forEach(id => next.delete(id)) } else { ids.forEach(id => next.add(id)) }
        set({ selectedIds: next })
      },

      clearSelection: () => set({ selectedIds: new Set() }),

      // ── Toast ──
      showToast: (type, message) => {
        if (type === 'success') {
          toast.success(message, { duration: 3000 })
        } else {
          toast.error(message, { duration: 4000 })
        }
      },

      // ── Data Refresh ──
      refreshData: async (endpoints) => {
        const allEndpoints: Record<string, () => Promise<void>> = {
          '/api/dashboard': async () => { const d = await fetchEndpoint('/api/dashboard'); set({ dashData: d }) },
          '/api/clients': async () => { const c = await fetchEndpoint('/api/clients'); set({ clients: c }) },
          '/api/projects': async () => { const p = await fetchEndpoint('/api/projects'); set({ projects: p }) },
          '/api/workflows': async () => { const w = await fetchEndpoint('/api/workflows'); set({ workflows: w }) },
          '/api/spatial': async () => { const s = await fetchEndpoint('/api/spatial'); set({ spatial: s }) },
          '/api/field-sync': async () => { const f = await fetchEndpoint('/api/field-sync'); set({ fieldSync: f }) },
          '/api/ai': async () => { const a = await fetchEndpoint('/api/ai'); set({ aiData: a }) },
          '/api/finance': async () => { const fin = await fetchEndpoint('/api/finance'); set({ financeData: fin }) },
          '/api/documents': async () => { const docs = await fetchEndpoint('/api/documents'); set({ documentsData: docs }) },
          '/api/communications': async () => { const comms = await fetchEndpoint('/api/communications'); set({ commsData: comms }) },
          '/api/approvals': async () => { const approvals = await fetchEndpoint('/api/approvals'); set({ approvalsData: approvals }) },
          '/api/events': async () => { const events = await fetchEndpoint('/api/events'); set({ eventsData: events }) },
          '/api/organizations': async () => { const orgs = await fetchEndpoint('/api/organizations'); set({ orgsData: orgs }) },
          '/api/reports': async () => { const reps = await fetchEndpoint('/api/reports'); set({ reportsData: reps }) },
        }

        const toRefresh = endpoints || Object.keys(allEndpoints)
        try {
          await Promise.all(toRefresh.map(ep => allEndpoints[ep]?.()))
        } catch (e) {
          console.error('Refresh error:', e)
        }
      },

      refreshWithDashboard: async (endpoints) => {
        const eps = new Set([...endpoints, '/api/dashboard'])
        await get().refreshData(Array.from(eps))
      },

      fetchAllData: async () => {
        const endpointList = [
          { key: 'clients', url: '/api/clients' },
          { key: 'projects', url: '/api/projects' },
          { key: 'workflows', url: '/api/workflows' },
          { key: 'spatial', url: '/api/spatial' },
          { key: 'field-sync', url: '/api/field-sync' },
          { key: 'ai', url: '/api/ai' },
          { key: 'finance', url: '/api/finance' },
          { key: 'documents', url: '/api/documents' },
          { key: 'communications', url: '/api/communications' },
          { key: 'approvals', url: '/api/approvals' },
          { key: 'events', url: '/api/events' },
          { key: 'organizations', url: '/api/organizations' },
          { key: 'reports', url: '/api/reports' },
        ]

        try {
          const dashRes = await fetchEndpoint('/api/dashboard')
          set({ dashData: dashRes, loading: false })
        } catch (e) {
          console.error('Dashboard fetch failed:', e)
          set({ loading: false })
        }

        const results = await Promise.allSettled(
          endpointList.map(async (ep) => {
            try {
              const data = await fetchEndpoint(ep.url)
              return { key: ep.key, data }
            } catch (e) {
              console.error(`Failed to fetch ${ep.url}:`, e)
              return { key: ep.key, data: null }
            }
          })
        )

        for (const result of results) {
          if (result.status === 'fulfilled' && result.value?.data) {
            const { key, data } = result.value
            switch (key) {
              case 'clients': set({ clients: data }); break
              case 'projects': set({ projects: data }); break
              case 'workflows': set({ workflows: data }); break
              case 'spatial': set({ spatial: data }); break
              case 'field-sync': set({ fieldSync: data }); break
              case 'ai': set({ aiData: data }); break
              case 'finance': set({ financeData: data }); break
              case 'documents': set({ documentsData: data }); break
              case 'communications': set({ commsData: data }); break
              case 'approvals': set({ approvalsData: data }); break
              case 'events': set({ eventsData: data }); break
              case 'organizations': set({ orgsData: data }); break
              case 'reports': set({ reportsData: data }); break
            }
          }
        }
      },

      // ── Bulk Actions ──
      handleBulkAction: async (action) => {
        const { selectedIds, page, refreshWithDashboard, showToast } = get()
        const idsArray = Array.from(selectedIds)
        if (idsArray.length === 0) return

        try {
          if (page === 'clients') {
            if (action.startsWith('status-')) {
              const status = action.replace('status-', '')
              await fetch('/api/clients/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'status-change', ids: idsArray, status }),
              })
              showToast('success', `${idsArray.length} clients updated to ${status}`)
            } else if (action === 'delete') {
              await fetch('/api/clients/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', ids: idsArray }),
              })
              showToast('success', `${idsArray.length} clients deleted`)
            } else if (action === 'export') {
              const res = await fetch('/api/clients/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'export', ids: idsArray }),
              })
              if (res.ok) {
                const data = await res.json()
                const csv = convertToCSV(data.data)
                downloadCSV(csv, 'clients-export.csv')
                showToast('success', 'Export downloaded')
              }
            }
            await refreshWithDashboard(['/api/clients'])
          } else if (page === 'projects') {
            if (action.startsWith('status-')) {
              const status = action.replace('status-', '')
              await fetch('/api/projects/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'status-change', ids: idsArray, status }),
              })
              showToast('success', `${idsArray.length} projects updated to ${status}`)
            } else if (action === 'delete') {
              await fetch('/api/projects/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', ids: idsArray }),
              })
              showToast('success', `${idsArray.length} projects deleted`)
            } else if (action === 'export') {
              const res = await fetch('/api/projects/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'export', ids: idsArray }),
              })
              if (res.ok) {
                const data = await res.json()
                const csv = convertToCSV(data.data)
                downloadCSV(csv, 'projects-export.csv')
                showToast('success', 'Export downloaded')
              }
            }
            await refreshWithDashboard(['/api/projects'])
          } else if (page === 'finance') {
            if (action.startsWith('status-')) {
              const status = action.replace('status-', '')
              await Promise.all(idsArray.map(id =>
                fetch(`/api/invoices/${id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status }),
                })
              ))
              showToast('success', `${idsArray.length} invoices updated`)
            }
            await refreshWithDashboard(['/api/finance'])
          } else if (page === 'approvals') {
            if (action.startsWith('status-')) {
              const status = action.replace('status-', '')
              await Promise.all(idsArray.map(id =>
                fetch(`/api/approvals/${id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status }),
                })
              ))
              showToast('success', `${idsArray.length} approvals updated`)
            }
            await refreshWithDashboard(['/api/approvals'])
          } else if (page === 'documents') {
            if (action.startsWith('status-') && action === 'status-active') {
              await Promise.all(idsArray.map(id =>
                fetch(`/api/documents/${id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ is_verified: true }),
                })
              ))
              showToast('success', `${idsArray.length} documents verified`)
            } else if (action === 'delete') {
              await Promise.all(idsArray.map(id =>
                fetch(`/api/documents/${id}`, { method: 'DELETE' })
              ))
              showToast('success', `${idsArray.length} documents deleted`)
            }
            await refreshWithDashboard(['/api/documents'])
          } else if (page === 'communications') {
            if (action.startsWith('status-')) {
              const status = action.replace('status-', '') === 'active' ? 'delivered' : action.replace('status-', '')
              await Promise.all(idsArray.map(id =>
                fetch(`/api/communications/${id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: status || 'delivered' }),
                })
              ))
              showToast('success', `${idsArray.length} communications updated`)
            }
            await refreshWithDashboard(['/api/communications'])
          }
        } catch (e) {
          console.error('Bulk action error:', e)
          showToast('error', 'Bulk action failed')
        }

        set({ selectedIds: new Set() })
      },
    }),
    {
      name: 'gws-platform-store',
      // Only persist navigation and dark mode preferences
      partialize: (state) => ({
        page: state.page,
        darkMode: state.darkMode,
      }),
      // Rehydrate dark mode class on document
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) {
          document.documentElement.classList.add('dark')
        }
      },
    }
  )
)
