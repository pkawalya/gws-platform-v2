'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ArrowRight, GitBranch, CheckCircle2, Activity, Clock, AlertTriangle,
  ChevronDown, ChevronUp, Plus, Trash2, Edit2, Play, XCircle, SkipForward,
  GripVertical, Zap, Eye, MessageSquare, ShieldCheck, Settings, MoreHorizontal,
  Search, Copy, Pause, RotateCcw, LayoutList, Layers,
} from 'lucide-react'
import { fmt } from './constants'

// ── Types ──
interface WorkflowStep {
  id?: string
  name: string
  step_type: string
  assignee_type: string
  assignee_id: string | null
  auto_assign: boolean
  is_required: boolean
  sla_hours: number | null
  step_order: number
  config?: any
}

interface WorkflowDefinition {
  id: string
  name: string
  slug: string
  description: string | null
  version: number
  is_active: boolean
  trigger_type: string
  trigger_config: any
  steps: WorkflowStep[]
  instances: WorkflowInstance[]
  created_at: string
  updated_at: string
}

interface WorkflowTransition {
  id: string
  action: string
  performed_by: string | null
  notes: string | null
  performed_at: string
  fromStep: { id: string; name: string } | null
  toStep: { id: string; name: string }
}

interface WorkflowInstance {
  id: string
  workflow_definition_id: string
  subject_type: string
  subject_id: string
  status: string
  current_step_id: string | null
  current_step_order: number | null
  started_at: string
  completed_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  metadata: any
  transitions: WorkflowTransition[]
  workflowDefinition?: WorkflowDefinition
}

interface WorkflowsPageProps {
  workflows: any[]
  openDetail: (type: string, data: any) => void
  onToast?: (type: 'success' | 'error', message: string) => void
  onRefresh?: () => void
  projects?: any[]
  clients?: any[]
}

// ── Constants ──
const STEP_TYPES = [
  { value: 'approval', label: 'Approval', icon: ShieldCheck, color: 'violet' },
  { value: 'review', label: 'Review', icon: Eye, color: 'blue' },
  { value: 'notification', label: 'Notification', icon: MessageSquare, color: 'amber' },
  { value: 'data_entry', label: 'Data Entry', icon: Edit2, color: 'cyan' },
  { value: 'condition', label: 'Condition', icon: GitBranch, color: 'orange' },
  { value: 'auto', label: 'Automated', icon: Zap, color: 'emerald' },
]

const TRIGGER_TYPES = [
  { value: 'manual', label: 'Manual', description: 'Started by a user' },
  { value: 'on_create', label: 'On Create', description: 'When a record is created' },
  { value: 'on_status_change', label: 'On Status Change', description: 'When a status changes' },
  { value: 'scheduled', label: 'Scheduled', description: 'Runs on a schedule' },
  { value: 'webhook', label: 'Webhook', description: 'Triggered by external event' },
]

const SUBJECT_TYPES = [
  { value: 'project', label: 'Survey Project' },
  { value: 'client', label: 'Client' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'document', label: 'Document' },
  { value: 'approval', label: 'Approval' },
]

const STEP_TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  approval: { icon: ShieldCheck, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
  review: { icon: Eye, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  notification: { icon: MessageSquare, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  data_entry: { icon: Edit2, color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  condition: { icon: GitBranch, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  auto: { icon: Zap, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
}

const INSTANCE_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  in_progress: { label: 'In Progress', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
  completed: { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
}

// ── Default empty step ──
function createEmptyStep(order: number): WorkflowStep {
  return {
    name: '',
    step_type: 'approval',
    assignee_type: 'role',
    assignee_id: null,
    auto_assign: false,
    is_required: true,
    sla_hours: null,
    step_order: order,
  }
}

// ── Step Type Badge ──
function StepTypeBadge({ type }: { type: string }) {
  const cfg = STEP_TYPE_CONFIG[type] || STEP_TYPE_CONFIG.approval
  const Icon = cfg.icon
  return (
    <Badge variant="outline" className={`text-[10px] ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      <Icon className="w-2.5 h-2.5 mr-0.5" />
      {fmt(type)}
    </Badge>
  )
}

// ── Visual Step Node (for the timeline) ──
function StepNode({ step, idx, totalSteps, isCurrent, isCompleted, onClick }: {
  step: any; idx: number; totalSteps: number; isCurrent: boolean; isCompleted: boolean; onClick: () => void
}) {
  const cfg = STEP_TYPE_CONFIG[step.step_type] || STEP_TYPE_CONFIG.approval
  const statusColor = isCurrent
    ? 'border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-200'
    : isCompleted
      ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
      : 'border-slate-200 bg-white text-slate-400'

  const connectorColor = isCompleted ? 'bg-emerald-400' : 'bg-slate-200'

  return (
    <div className="flex items-start min-w-[140px]">
      <div className="flex flex-col items-center flex-1">
        <button className="focus:outline-none" onClick={onClick}>
          <div className={`relative w-11 h-11 rounded-full border-[2.5px] flex items-center justify-center text-sm font-bold transition-all duration-300 hover:scale-110 ${statusColor}`}>
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : isCurrent ? (
              <Activity className="w-5 h-5" />
            ) : (
              <span>{step.step_order}</span>
            )}
            {step.sla_hours && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                <Clock className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
        </button>
        <p className="text-xs font-medium mt-2 text-center leading-tight">{step.name}</p>
        <StepTypeBadge type={step.step_type} />
        {step.sla_hours && (
          <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-600">
            <Clock className="w-2.5 h-2.5" />
            <span>{step.sla_hours}h SLA</span>
          </div>
        )}
      </div>
      {idx < totalSteps - 1 && (
        <div className="flex items-center self-center -ml-1">
          <div className={`w-6 h-[3px] rounded-full ${connectorColor} transition-colors duration-300`} />
          <ArrowRight className={`w-4 h-4 -ml-0.5 ${isCompleted ? 'text-emerald-400' : 'text-slate-300'}`} />
        </div>
      )}
    </div>
  )
}

// ── Step Editor Row (in workflow builder) ──
function StepEditorRow({ step, index, total, onUpdate, onRemove, onMoveUp, onMoveDown }: {
  step: WorkflowStep
  index: number
  total: number
  onUpdate: (idx: number, step: WorkflowStep) => void
  onRemove: (idx: number) => void
  onMoveUp: (idx: number) => void
  onMoveDown: (idx: number) => void
}) {
  const cfg = STEP_TYPE_CONFIG[step.step_type] || STEP_TYPE_CONFIG.approval
  const Icon = cfg.icon

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${cfg.border} ${cfg.bg}/40`}>
      {/* Drag handle & order */}
      <div className="flex flex-col items-center gap-1 pt-1">
        <GripVertical className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-bold text-slate-500">{index + 1}</span>
        <div className="flex flex-col gap-0.5">
          <button onClick={() => onMoveUp(index)} disabled={index === 0} className="p-0.5 rounded hover:bg-white/80 disabled:opacity-30">
            <ChevronUp className="w-3 h-3" />
          </button>
          <button onClick={() => onMoveDown(index)} disabled={index === total - 1} className="p-0.5 rounded hover:bg-white/80 disabled:opacity-30">
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Step config */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="sm:col-span-2">
          <Input
            value={step.name}
            onChange={e => onUpdate(index, { ...step, name: e.target.value })}
            placeholder="Step name (e.g. Manager Review)"
            className="h-8 text-sm font-medium"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground mb-1">Step Type</Label>
          <Select value={step.step_type} onValueChange={v => onUpdate(index, { ...step, step_type: v })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STEP_TYPES.map(st => (
                <SelectItem key={st.value} value={st.value}>
                  <div className="flex items-center gap-1.5">
                    <st.icon className="w-3 h-3" />
                    {st.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground mb-1">Assignee Type</Label>
          <Select value={step.assignee_type} onValueChange={v => onUpdate(index, { ...step, assignee_type: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="role">Role-based</SelectItem>
              <SelectItem value="user">Specific User</SelectItem>
              <SelectItem value="auto">Auto-assigned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground mb-1">SLA (hours)</Label>
          <Input
            type="number"
            value={step.sla_hours || ''}
            onChange={e => onUpdate(index, { ...step, sla_hours: e.target.value ? Number(e.target.value) : null })}
            placeholder="e.g. 48"
            className="h-8 text-xs"
          />
        </div>
        <div className="flex items-center gap-4 pt-4">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <Switch
              checked={step.is_required}
              onCheckedChange={v => onUpdate(index, { ...step, is_required: v })}
              className="scale-75"
            />
            Required
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <Switch
              checked={step.auto_assign}
              onCheckedChange={v => onUpdate(index, { ...step, auto_assign: v })}
              className="scale-75"
            />
            Auto-assign
          </label>
        </div>
      </div>

      {/* Remove */}
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 shrink-0" onClick={() => onRemove(index)}>
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  )
}

// ── Workflow Instance Card ──
function WorkflowInstanceCard({ inst, steps, onAction, onToast }: {
  inst: WorkflowInstance
  steps: WorkflowStep[]
  onAction: (instanceId: string, action: string, data?: any) => void
  onToast: (type: 'success' | 'error', message: string) => void
}) {
  const totalSteps = steps.length
  const progress = ((inst.current_step_order || 0) / totalSteps) * 100
  const currentStep = steps.find(s => s.id === inst.current_step_id)
  const statusInfo = INSTANCE_STATUS[inst.status] || INSTANCE_STATUS.pending

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[11px] ${statusInfo.bg} ${statusInfo.color}`}>
              {(inst.status === 'in_progress' || inst.status === 'pending') && (
                <div className="w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />
              )}
              {statusInfo.label}
            </Badge>
            <span className="text-[11px] text-slate-500">
              Started {new Date(inst.started_at).toLocaleDateString('en-UG', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          {(inst.status === 'pending' || inst.status === 'in_progress') && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onAction(inst.id, 'advance')}>
                  <SkipForward className="w-3.5 h-3.5 mr-2 text-emerald-600" /> Approve & Advance
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction(inst.id, 'reject')}>
                  <XCircle className="w-3.5 h-3.5 mr-2 text-red-600" /> Reject
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onAction(inst.id, 'cancel')}>
                  <Pause className="w-3.5 h-3.5 mr-2" /> Cancel Workflow
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Subject */}
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-[10px]">{fmt(inst.subject_type)}</Badge>
          <span className="text-xs text-slate-600 font-medium">#{inst.subject_id}</span>
          {inst.metadata?.client_name && <span className="text-[11px] text-slate-500 ml-1">— {inst.metadata.client_name}</span>}
        </div>

        {/* Current step indicator */}
        {currentStep && (inst.status === 'pending' || inst.status === 'in_progress') && (
          <div className="mb-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900">
            <div className="flex items-center gap-2 text-xs">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-medium text-blue-700 dark:text-blue-400">Current: {currentStep.name}</span>
              <StepTypeBadge type={currentStep.step_type} />
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-600">Step {inst.current_step_order || 0} of {totalSteps}</span>
            <span className="font-medium" style={{ color: inst.status === 'completed' ? '#059669' : inst.status === 'cancelled' ? '#dc2626' : '#2563eb' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1 mb-3">
          {steps.map((step, idx) => {
            const stepNum = idx + 1
            const isDone = (inst.current_step_order || 0) > stepNum || inst.status === 'completed'
            const isCurrent = inst.current_step_order === stepNum
            return (
              <div
                key={step.id || idx}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all ${
                  isDone ? 'bg-emerald-500 border-emerald-500 text-white' :
                  isCurrent ? 'bg-blue-500 border-blue-500 text-white' :
                  'bg-white border-slate-200 text-slate-400'
                }`}
                title={step.name}
              >
                {isDone ? '✓' : stepNum}
              </div>
            )
          })}
        </div>

        {/* Transition History */}
        {inst.transitions && inst.transitions.length > 0 && (
          <div className="space-y-1.5">
            <h5 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">History</h5>
            {inst.transitions.map((t: any, tIdx: number) => (
              <div key={t.id || tIdx} className="flex items-center gap-2 text-[11px] p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  t.action === 'rejected' ? 'bg-red-100' : 'bg-emerald-100'
                }`}>
                  {t.action === 'rejected' ? (
                    <XCircle className="w-3 h-3 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  )}
                </div>
                <span className="font-medium text-slate-700">{t.fromStep?.name || 'Start'}</span>
                <ArrowRight className="w-3 h-3 text-slate-300" />
                <span className="font-medium text-slate-700">{t.toStep?.name}</span>
                {t.notes && <span className="text-slate-400 text-[10px]">({t.notes})</span>}
                <span className="text-slate-400 ml-auto text-[10px]">
                  {new Date(t.performed_at).toLocaleString('en-UG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Main Component ──
export function WorkflowsPage({ workflows: initialWorkflows, openDetail, onToast, onRefresh, projects = [], clients = [] }: WorkflowsPageProps) {
  const [activeTab, setActiveTab] = useState('templates')
  const [workflows, setWorkflows] = useState<any[]>(initialWorkflows || [])
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedWf, setExpandedWf] = useState<Set<string>>(new Set())

  // Builder dialog state
  const [builderOpen, setBuilderOpen] = useState(false)
  const [builderMode, setBuilderMode] = useState<'create' | 'edit'>('create')
  const [editWfId, setEditWfId] = useState<string | null>(null)
  const [wfForm, setWfForm] = useState({
    name: '',
    description: '',
    trigger_type: 'manual',
    is_active: true,
  })
  const [builderSteps, setBuilderSteps] = useState<WorkflowStep[]>([createEmptyStep(1)])

  // Launch dialog state
  const [launchOpen, setLaunchOpen] = useState(false)
  const [launchWfId, setLaunchWfId] = useState<string | null>(null)
  const [launchForm, setLaunchForm] = useState({
    subject_type: 'project',
    subject_id: '',
  })

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; instanceId: string }>({ open: false, instanceId: '' })
  const [rejectReason, setRejectReason] = useState('')

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; wfId: string; wfName: string }>({ open: false, wfId: '', wfName: '' })

  const toast = onToast || (() => {})

  // Fetch latest workflows
  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/workflows')
      if (res.ok) {
        const data = await res.json()
        setWorkflows(data)
      }
    } catch (e) {
      console.error('Fetch workflows error:', e)
    }
  }, [])

  useEffect(() => {
    if (initialWorkflows?.length > 0) {
      setWorkflows(initialWorkflows)
    } else {
      fetchWorkflows()
    }
  }, [initialWorkflows, fetchWorkflows])

  // ── Builder: Step Management ──
  const updateStep = (idx: number, step: WorkflowStep) => {
    setBuilderSteps(prev => prev.map((s, i) => i === idx ? step : s))
  }

  const removeStep = (idx: number) => {
    setBuilderSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_order: i + 1 })))
  }

  const addStep = () => {
    setBuilderSteps(prev => [...prev, createEmptyStep(prev.length + 1)])
  }

  const moveStepUp = (idx: number) => {
    if (idx === 0) return
    setBuilderSteps(prev => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next.map((s, i) => ({ ...s, step_order: i + 1 }))
    })
  }

  const moveStepDown = (idx: number) => {
    if (idx >= builderSteps.length - 1) return
    setBuilderSteps(prev => {
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next.map((s, i) => ({ ...s, step_order: i + 1 }))
    })
  }

  // ── Open Builder ──
  const openCreateBuilder = () => {
    setBuilderMode('create')
    setEditWfId(null)
    setWfForm({ name: '', description: '', trigger_type: 'manual', is_active: true })
    setBuilderSteps([createEmptyStep(1)])
    setBuilderOpen(true)
  }

  const openEditBuilder = (wf: any) => {
    setBuilderMode('edit')
    setEditWfId(wf.id)
    setWfForm({
      name: wf.name,
      description: wf.description || '',
      trigger_type: wf.trigger_type || 'manual',
      is_active: wf.is_active,
    })
    setBuilderSteps(wf.steps.length > 0 ? wf.steps : [createEmptyStep(1)])
    setBuilderOpen(true)
  }

  // ── Save Workflow ──
  const handleSaveWorkflow = async () => {
    if (!wfForm.name.trim()) {
      toast('error', 'Workflow name is required')
      return
    }
    const validSteps = builderSteps.filter(s => s.name.trim())
    if (validSteps.length === 0) {
      toast('error', 'At least one step is required')
      return
    }

    try {
      if (builderMode === 'create') {
        const res = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...wfForm,
            steps: validSteps,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          toast('error', err.error || 'Failed to create workflow')
          return
        }
        toast('success', `Workflow "${wfForm.name}" created with ${validSteps.length} steps`)
      } else if (builderMode === 'edit' && editWfId) {
        // Update definition
        await fetch(`/api/workflows/${editWfId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(wfForm),
        })
        // Replace all steps
        await fetch(`/api/workflows/${editWfId}/steps`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ steps: validSteps }),
        })
        toast('success', `Workflow "${wfForm.name}" updated`)
      }

      setBuilderOpen(false)
      fetchWorkflows()
      onRefresh?.()
    } catch (e) {
      toast('error', 'Failed to save workflow')
    }
  }

  // ── Delete Workflow ──
  const handleDeleteWorkflow = async () => {
    try {
      const res = await fetch(`/api/workflows/${deleteDialog.wfId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        toast('error', err.error || 'Failed to delete workflow')
        return
      }
      toast('success', 'Workflow deleted')
      setDeleteDialog({ open: false, wfId: '', wfName: '' })
      fetchWorkflows()
      onRefresh?.()
    } catch {
      toast('error', 'Failed to delete workflow')
    }
  }

  // ── Launch Instance ──
  const openLaunchDialog = (wfId: string) => {
    setLaunchWfId(wfId)
    setLaunchForm({ subject_type: 'project', subject_id: '' })
    setLaunchOpen(true)
  }

  const handleLaunchWorkflow = async () => {
    if (!launchWfId || !launchForm.subject_id) {
      toast('error', 'Please select a subject')
      return
    }

    const subjectLabel = launchForm.subject_type === 'project'
      ? projects.find(p => String(p.id) === launchForm.subject_id)?.title
      : clients.find(c => String(c.id) === launchForm.subject_id)
        ? `${clients.find(c => String(c.id) === launchForm.subject_id)?.first_name || ''} ${clients.find(c => String(c.id) === launchForm.subject_id)?.last_name || ''}`
      : ''

    try {
      const res = await fetch('/api/workflow-instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_definition_id: launchWfId,
          subject_type: launchForm.subject_type,
          subject_id: launchForm.subject_id,
          metadata: { client_name: subjectLabel },
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast('error', err.error || 'Failed to launch workflow')
        return
      }
      toast('success', 'Workflow instance started')
      setLaunchOpen(false)
      fetchWorkflows()
      onRefresh?.()
    } catch {
      toast('error', 'Failed to launch workflow')
    }
  }

  // ── Instance Actions ──
  const handleInstanceAction = async (instanceId: string, action: string, data?: any) => {
    try {
      if (action === 'reject') {
        setRejectDialog({ open: true, instanceId })
        return
      }

      const res = await fetch(`/api/workflow-instances/${instanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast('error', err.error || `Failed to ${action} workflow`)
        return
      }

      const result = await res.json()
      if (result.status === 'completed') {
        toast('success', 'Workflow completed!')
      } else if (result.status === 'cancelled') {
        toast('success', 'Workflow cancelled')
      } else {
        toast('success', `Step advanced to: ${result.current_step_order ? 'Step ' + result.current_step_order : 'next'}`)
      }
      fetchWorkflows()
      onRefresh?.()
    } catch {
      toast('error', 'Action failed')
    }
  }

  const handleRejectConfirm = async () => {
    await handleInstanceAction(rejectDialog.instanceId, 'reject', { notes: rejectReason })
    setRejectDialog({ open: false, instanceId: '' })
    setRejectReason('')
  }

  // ── Computed ──
  const allInstances = workflows.flatMap((wf: any) =>
    (wf.instances || []).map((inst: any) => ({ ...inst, _wfName: wf.name, _wfSteps: wf.steps }))
  )
  const activeInstances = allInstances.filter((i: any) => i.status === 'pending' || i.status === 'in_progress')
  const completedInstances = allInstances.filter((i: any) => i.status === 'completed')
  const cancelledInstances = allInstances.filter((i: any) => i.status === 'cancelled')

  const filteredWorkflows = workflows.filter((wf: any) =>
    wf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (wf.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleExpand = (id: string) => {
    setExpandedWf(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // ── Stats ──
  const stats = [
    { label: 'Templates', value: workflows.length, icon: Layers, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950' },
    { label: 'Active', value: activeInstances.length, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Completed', value: completedInstances.length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
    { label: 'Cancelled', value: cancelledInstances.length, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' },
  ]

  return (
    <div className="space-y-6">
      {/* ── Header Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <TabsList className="h-10">
            <TabsTrigger value="templates" className="gap-1.5 text-xs">
              <Layers className="w-3.5 h-3.5" /> Templates
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-1.5 text-xs">
              <Activity className="w-3.5 h-3.5" /> Active ({activeInstances.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-9 pl-8 w-48 text-sm"
              />
            </div>
            <Button size="sm" className="h-9 gap-1.5" onClick={openCreateBuilder}>
              <Plus className="w-3.5 h-3.5" /> New Workflow
            </Button>
          </div>
        </div>

        {/* ══════════════ TEMPLATES TAB ══════════════ */}
        <TabsContent value="templates" className="mt-4">
          {filteredWorkflows.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <GitBranch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600">No workflow templates yet</p>
                <p className="text-xs text-slate-400 mt-1">Create your first workflow to automate processes</p>
                <Button size="sm" className="mt-4 gap-1.5" onClick={openCreateBuilder}>
                  <Plus className="w-3.5 h-3.5" /> Create Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredWorkflows.map((wf: any) => {
                const isExpanded = expandedWf.has(wf.id)
                const hasActiveInstances = wf.instances?.some((i: any) => i.status === 'pending' || i.status === 'in_progress')
                return (
                  <Card key={wf.id} className="overflow-hidden border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                            <GitBranch className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {wf.name}
                              {!wf.is_active && <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500">Inactive</Badge>}
                              <Badge variant="outline" className="text-[10px]">v{wf.version}</Badge>
                            </CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                              {wf.description || 'No description'} • Trigger: {fmt(wf.trigger_type)}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[11px]">{wf.steps?.length || 0} Steps</Badge>
                          {hasActiveInstances && (
                            <Badge className="bg-blue-100 text-blue-800 text-[11px]">
                              <Activity className="w-3 h-3 mr-0.5" />
                              {wf.instances.filter((i: any) => i.status === 'pending' || i.status === 'in_progress').length} Active
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => openEditBuilder(wf)}>
                                <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit Workflow
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openLaunchDialog(wf.id)}>
                                <Play className="w-3.5 h-3.5 mr-2 text-emerald-600" /> Launch Instance
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleExpand(wf.id)}>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5 mr-2" /> : <ChevronDown className="w-3.5 h-3.5 mr-2" />}
                                {isExpanded ? 'Collapse' : 'Expand'} Instances
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteDialog({ open: true, wfId: wf.id, wfName: wf.name })}>
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Workflow
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Visual Step Timeline */}
                      <div className="overflow-x-auto pb-2">
                        <div className="flex items-start gap-0 min-w-max px-2 py-3">
                          {wf.steps?.map((step: any, idx: number) => {
                            const isCurrent = wf.instances?.some((i: any) => i.current_step_id === step.id)
                            const isCompleted = wf.instances?.some((inst: any) =>
                              inst.transitions?.some((t: any) => t.toStep?.id === step.id)
                            )
                            return (
                              <StepNode
                                key={step.id || idx}
                                step={step}
                                idx={idx}
                                totalSteps={wf.steps.length}
                                isCurrent={isCurrent}
                                isCompleted={isCompleted}
                                onClick={() => openDetail('workflow', { ...wf, selectedStep: step })}
                              />
                            )
                          })}
                        </div>
                      </div>

                      {/* Flow Legend */}
                      <div className="mt-2 flex items-center gap-4 px-2 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-emerald-50" /> Completed</span>
                        <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full border-2 border-blue-500 bg-blue-50" /> In Progress</span>
                        <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full border-2 border-slate-200 bg-white" /> Pending</span>
                        <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5 text-amber-500" /> Has SLA</span>
                      </div>

                      {/* Active Instances */}
                      {isExpanded && wf.instances?.length > 0 && (
                        <>
                          <Separator className="my-4" />
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                              <Activity className="w-3.5 h-3.5" />
                              Instances ({wf.instances.length})
                            </h4>
                            <div className="grid gap-3">
                              {wf.instances.map((inst: any) => (
                                <WorkflowInstanceCard
                                  key={inst.id}
                                  inst={inst}
                                  steps={wf.steps}
                                  onAction={handleInstanceAction}
                                  onToast={toast}
                                />
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ══════════════ ACTIVE INSTANCES TAB ══════════════ */}
        <TabsContent value="active" className="mt-4">
          {activeInstances.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600">No active workflow instances</p>
                <p className="text-xs text-slate-400 mt-1">Launch a workflow template to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeInstances.map((inst: any) => (
                <WorkflowInstanceCard
                  key={inst.id}
                  inst={inst}
                  steps={inst._wfSteps || []}
                  onAction={handleInstanceAction}
                  onToast={toast}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ══════════════ COMPLETED INSTANCES TAB ══════════════ */}
        <TabsContent value="completed" className="mt-4">
          {completedInstances.length === 0 && cancelledInstances.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600">No completed or cancelled workflows</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {completedInstances.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Completed ({completedInstances.length})
                  </h3>
                  <div className="grid gap-3">
                    {completedInstances.map((inst: any) => (
                      <WorkflowInstanceCard key={inst.id} inst={inst} steps={inst._wfSteps || []} onAction={handleInstanceAction} onToast={toast} />
                    ))}
                  </div>
                </div>
              )}
              {cancelledInstances.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Cancelled ({cancelledInstances.length})
                  </h3>
                  <div className="grid gap-3">
                    {cancelledInstances.map((inst: any) => (
                      <WorkflowInstanceCard key={inst.id} inst={inst} steps={inst._wfSteps || []} onAction={handleInstanceAction} onToast={toast} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ══════════════ WORKFLOW BUILDER DIALOG ══════════════ */}
      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-violet-600" />
              {builderMode === 'create' ? 'Create New Workflow' : 'Edit Workflow'}
            </DialogTitle>
            <DialogDescription>
              {builderMode === 'create'
                ? 'Design your workflow template by adding steps, setting types and assignees.'
                : 'Modify the workflow steps and configuration. Changes apply to new instances.'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="grid gap-5 py-2">
              {/* Basic Info */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" /> Configuration
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Workflow Name *</Label>
                    <Input value={wfForm.name} onChange={e => setWfForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Land Title Transfer" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Trigger Type</Label>
                    <Select value={wfForm.trigger_type} onValueChange={v => setWfForm(p => ({ ...p, trigger_type: v }))}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TRIGGER_TYPES.map(tt => (
                          <SelectItem key={tt.value} value={tt.value}>
                            <div>
                              <span className="font-medium">{tt.label}</span>
                              <span className="text-[10px] text-muted-foreground ml-1">— {tt.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Textarea value={wfForm.description} onChange={e => setWfForm(p => ({ ...p, description: e.target.value }))} placeholder="What does this workflow do?" rows={2} className="text-sm" />
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={wfForm.is_active} onCheckedChange={v => setWfForm(p => ({ ...p, is_active: v }))} />
                  Active (can be launched)
                </label>
              </div>

              {/* Steps Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                    <LayoutList className="w-3.5 h-3.5" /> Workflow Steps ({builderSteps.length})
                  </h4>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addStep}>
                    <Plus className="w-3 h-3" /> Add Step
                  </Button>
                </div>

                <div className="space-y-3">
                  {builderSteps.map((step, idx) => (
                    <StepEditorRow
                      key={idx}
                      step={step}
                      index={idx}
                      total={builderSteps.length}
                      onUpdate={updateStep}
                      onRemove={removeStep}
                      onMoveUp={moveStepUp}
                      onMoveDown={moveStepDown}
                    />
                  ))}
                </div>

                {/* Quick add step */}
                <button
                  onClick={addStep}
                  className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Another Step
                </button>
              </div>

              {/* Live Preview */}
              {builderSteps.filter(s => s.name.trim()).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </h4>
                  <div className="flex items-start gap-0 overflow-x-auto p-3 rounded-xl bg-white dark:bg-slate-950 border">
                    {builderSteps.filter(s => s.name.trim()).map((step, idx) => {
                      const cfg = STEP_TYPE_CONFIG[step.step_type] || STEP_TYPE_CONFIG.approval
                      return (
                        <div key={idx} className="flex items-start min-w-[120px]">
                          <div className="flex flex-col items-center flex-1">
                            <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                              {idx + 1}
                            </div>
                            <p className="text-[10px] font-medium mt-1 text-center leading-tight max-w-[100px]">{step.name}</p>
                            <StepTypeBadge type={step.step_type} />
                          </div>
                          {idx < builderSteps.filter(s => s.name.trim()).length - 1 && (
                            <div className="flex items-center self-center -ml-1">
                              <div className="w-4 h-[2px] bg-slate-200" />
                              <ArrowRight className="w-3 h-3 text-slate-300" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBuilderOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveWorkflow} disabled={!wfForm.name.trim()}>
              {builderMode === 'create' ? 'Create Workflow' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════ LAUNCH INSTANCE DIALOG ══════════════ */}
      <Dialog open={launchOpen} onOpenChange={setLaunchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-600" />
              Launch Workflow
            </DialogTitle>
            <DialogDescription>
              Start a new workflow instance by selecting what it applies to.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Apply To *</Label>
              <Select value={launchForm.subject_type} onValueChange={v => setLaunchForm(p => ({ ...p, subject_type: v, subject_id: '' }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBJECT_TYPES.map(st => (
                    <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Select {fmt(launchForm.subject_type)} *</Label>
              <Select value={launchForm.subject_id} onValueChange={v => setLaunchForm(p => ({ ...p, subject_id: v }))}>
                <SelectTrigger className="h-9"><SelectValue placeholder={`Choose a ${fmt(launchForm.subject_type)}...`} /></SelectTrigger>
                <SelectContent>
                  {launchForm.subject_type === 'project' && projects.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400">{p.project_ref}</span>
                        <span>{p.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {launchForm.subject_type === 'client' && clients.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400">{c.client_ref}</span>
                        <span>{c.first_name} {c.last_name}{c.company_name ? ` (${c.company_name})` : ''}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {launchForm.subject_type !== 'project' && launchForm.subject_type !== 'client' && (
                    <SelectItem value="1">Item #1</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setLaunchOpen(false)}>Cancel</Button>
            <Button size="sm" className="gap-1.5" onClick={handleLaunchWorkflow} disabled={!launchForm.subject_id}>
              <Play className="w-3.5 h-3.5" /> Launch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════ REJECT DIALOG ══════════════ */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" /> Reject Workflow
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this workflow step. The workflow will be cancelled.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-xs">Reason</Label>
            <Textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Why are you rejecting this?"
              rows={3}
              className="text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRejectDialog({ open: false, instanceId: '' })}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleRejectConfirm}>Reject & Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════ DELETE DIALOG ══════════════ */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Delete Workflow
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteDialog.wfName}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteDialog({ open: false, wfId: '', wfName: '' })}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteWorkflow}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
