// GWS Platform V2 — Type Definitions

export type PageId = 'dashboard' | 'clients' | 'projects' | 'workflows' | 'spatial' | 'field-sync' | 'ai' | 'finance' | 'documents' | 'communications' | 'approvals' | 'audit' | 'organizations' | 'reports' | 'settings' | 'role-permissions'

export interface ClientRecord {
  id: number
  client_ref: string
  client_type: string
  first_name: string | null
  last_name: string | null
  company_name: string | null
  email: string | null
  phone: string | null
  district: string | null
  status: string
  latitude: string | null
  longitude: string | null
  organization: { name: string; slug: string } | null
  branch: { name: string; slug: string } | null
  surveyProjects: Array<{ id: number; project_ref: string; title: string; status: string }>
  invoices: Array<{ id: number; invoice_number: string; total_amount: number; status: string }>
  _count: { surveyProjects: number; invoices: number; documents: number; communications: number }
}

export interface ProjectRecord {
  id: number
  project_ref: string
  project_type: string
  title: string
  description: string | null
  status: string
  priority: string
  district: string | null
  area_hectares: string | null
  due_date: string | null
  created_at: string
  client: { id: number; client_ref: string; first_name: string | null; last_name: string | null; company_name: string | null; client_type: string }
  approvalSteps: Array<{ id: number; step_name: string; step_order: number; status: string; approver_role: string | null }>
  fieldObservations: Array<{ id: number; title: string; observation_type: string; status: string }>
  _count: { approvalSteps: number; fieldObservations: number; progressRecords: number }
}

export interface NavItem {
  id: PageId
  label: string
  icon: any
  group: string
  badge?: number
}

export interface DetailPanelState {
  open: boolean
  type: string
  data: any
}
