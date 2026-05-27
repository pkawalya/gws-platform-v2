'use client'

import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ArrowRight, GitBranch, CheckCircle2, Activity, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { fmt } from './constants'
import { useState } from 'react'

interface WorkflowsPageProps {
  workflows: any[]
  openDetail: (type: string, data: any) => void
}

// ── Visual Step Node ──
function StepNode({ step, idx, totalSteps, isCurrent, isCompleted, onClick }: {
  step: any; idx: number; totalSteps: number; isCurrent: boolean; isCompleted: boolean; onClick: () => void
}) {
  const statusColor = isCurrent
    ? 'border-blue-500 bg-blue-50 text-blue-600'
    : isCompleted
      ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
      : 'border-slate-200 bg-white text-slate-400'

  const connectorColor = isCompleted ? 'bg-emerald-400' : 'bg-slate-200'
  const pulseClass = isCurrent ? 'animate-pulse' : ''

  return (
    <div className="flex items-start min-w-[140px]">
      <div className="flex flex-col items-center flex-1">
        <button className="focus:outline-none" onClick={onClick}>
          <div className={`relative w-11 h-11 rounded-full border-[2.5px] flex items-center justify-center text-sm font-bold transition-all duration-300 hover:scale-110 ${statusColor} ${pulseClass}`}>
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <span>{step.step_order}</span>
            )}
            {isCurrent && (
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
            )}
            {step.sla_hours && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                <Clock className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
        </button>
        <p className="text-xs font-medium mt-2 text-center leading-tight">{step.name}</p>
        <Badge variant="outline" className={`text-[10px] mt-1 ${
          step.step_type === 'approval' ? 'bg-violet-50 text-violet-700 border-violet-200' :
          step.step_type === 'review' ? 'bg-blue-50 text-blue-700 border-blue-200' :
          step.step_type === 'notification' ? 'bg-amber-50 text-amber-700 border-amber-200' :
          'bg-slate-50 text-slate-600'
        }`}>{fmt(step.step_type)}</Badge>
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

// ── Workflow Instance with Progress ──
function WorkflowInstance({ inst, totalSteps }: { inst: any; totalSteps: number }) {
  const progress = ((inst.current_step_order || 0) / totalSteps) * 100
  const startDate = new Date(inst.started_at)

  return (
    <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800 text-[11px]"><Activity className="w-3 h-3 mr-0.5" />In Progress</Badge>
          <span className="text-[11px] text-slate-500">Started {startDate.toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        {inst.metadata?.client_name && <span className="text-[11px] text-slate-600 font-medium">{inst.metadata.client_name}</span>}
      </div>
      <div className="space-y-1 mb-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-600">Progress</span>
          <span className="font-medium text-blue-700">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      {inst.transitions && inst.transitions.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <h5 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Transition History</h5>
          {inst.transitions.map((t: any, tIdx: number) => (
            <div key={t.id} className="flex items-center gap-2 text-[11px] p-2 rounded-lg bg-white/70 hover:bg-white transition-colors">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              </div>
              <span className="font-medium text-slate-700">{t.fromStep?.name || 'Start'}</span>
              <ArrowRight className="w-3 h-3 text-slate-300" />
              <span className="font-medium text-slate-700">{t.toStep?.name}</span>
              <span className="text-slate-400 ml-auto text-[10px]">
                {new Date(t.performed_at).toLocaleString('en-UG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function WorkflowsPage({ workflows, openDetail }: WorkflowsPageProps) {
  const [expandedWf, setExpandedWf] = useState<Set<number>>(new Set())

  const toggleExpand = (id: number) => {
    setExpandedWf(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {workflows.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <GitBranch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No workflows defined yet</p>
          </CardContent>
        </Card>
      )}
      {workflows.map((wf: any) => {
        const isExpanded = expandedWf.has(wf.id) || wf.instances.length > 0
        return (
          <Card key={wf.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <GitBranch className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{wf.name}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{wf.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px]">{wf.steps.length} Steps</Badge>
                  {wf.instances.length > 0 && (
                    <Badge className="bg-blue-100 text-blue-800 text-[11px]">
                      <Activity className="w-3 h-3 mr-0.5" />
                      {wf.instances.length} Active
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleExpand(wf.id)}>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Visual Step Timeline */}
              <div className="overflow-x-auto pb-2">
                <div className="flex items-start gap-0 min-w-max px-2 py-3">
                  {wf.steps.map((step: any, idx: number) => {
                    const isCurrent = wf.instances.some((i: any) => i.current_step_id === step.id)
                    const isCompleted = wf.instances.some((inst: any) =>
                      inst.transitions.some((t: any) => t.toStep?.id === step.id)
                    )
                    return (
                      <StepNode
                        key={step.id}
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

              {/* Flow Diagram Summary */}
              <div className="mt-2 flex items-center gap-4 px-2 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-emerald-50" /> Approved</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full border-2 border-blue-500 bg-blue-50" /> In Progress</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full border-2 border-slate-200 bg-white" /> Pending</span>
              </div>

              {/* Active Instances */}
              {isExpanded && wf.instances.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5" />
                      Active Instances ({wf.instances.length})
                    </h4>
                    {wf.instances.map((inst: any) => (
                      <WorkflowInstance key={inst.id} inst={inst} totalSteps={wf.steps.length} />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
