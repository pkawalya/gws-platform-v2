'use client'

import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ArrowRight, GitBranch, CheckCircle2, Activity } from 'lucide-react'
import { fmt } from './constants'

interface WorkflowsPageProps {
  workflows: any[]
  openDetail: (type: string, data: any) => void
}

export function WorkflowsPage({ workflows, openDetail }: WorkflowsPageProps) {
  return (
    <div className="space-y-6">
      {workflows.map((wf: any) => (
        <Card key={wf.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center"><GitBranch className="w-5 h-5 text-violet-600" /></div>
                <div><CardTitle className="text-base">{wf.name}</CardTitle><CardDescription className="text-xs">{wf.description}</CardDescription></div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{wf.steps.length} Steps</Badge>
                {wf.instances.length > 0 && <Badge className="bg-blue-100 text-blue-800">{wf.instances.length} Active</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start overflow-x-auto pb-4 gap-1">
              {wf.steps.map((step: any, idx: number) => {
                const isCurrent = wf.instances.some((i: any) => i.current_step_id === step.id)
                const isCompleted = wf.instances.some((inst: any) => inst.transitions.some((t: any) => t.toStep?.id === step.id))
                return (
                  <div key={step.id} className="flex items-start min-w-[130px]">
                    <div className="flex flex-col items-center flex-1 cursor-pointer" onClick={() => openDetail('workflow', { ...wf, selectedStep: step })}>
                      <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors
                        ${isCurrent ? 'border-blue-500 bg-blue-50 text-blue-600' : isCompleted ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-white text-slate-400'}`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.step_order}
                      </div>
                      <p className="text-[11px] font-medium mt-1.5 text-center">{step.name}</p>
                      <Badge variant="outline" className="text-[10px] mt-0.5">{step.step_type}</Badge>
                      {step.sla_hours && <p className="text-[10px] text-slate-400 mt-0.5">{step.sla_hours}h SLA</p>}
                    </div>
                    {idx < wf.steps.length - 1 && <ArrowRight className="w-4 h-4 text-slate-200 mt-3 shrink-0 -ml-0.5" />}
                  </div>
                )
              })}
            </div>
            {wf.instances.length > 0 && (
              <><Separator className="my-4" />
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Active Instances</h4>
                  {wf.instances.map((inst: any) => (
                    <div key={inst.id} className="p-3 rounded-lg border border-blue-200 bg-blue-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800 text-[11px]"><Activity className="w-3 h-3 mr-0.5" />In Progress</Badge>
                          <span className="text-[11px] text-slate-500">Started {new Date(inst.started_at).toLocaleDateString()}</span>
                        </div>
                        {inst.metadata?.client_name && <span className="text-[11px] text-slate-600">{inst.metadata.client_name}</span>}
                      </div>
                      <Progress value={((inst.current_step_order || 0) / wf.steps.length) * 100} className="h-1.5" />
                      <div className="mt-2 space-y-1">
                        {inst.transitions.map((t: any) => (
                          <div key={t.id} className="flex items-center gap-2 text-[11px] p-1.5 rounded bg-white/60">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="font-medium">{t.fromStep?.name || 'Start'}</span>
                            <ArrowRight className="w-3 h-3 text-slate-300" />
                            <span className="font-medium">{t.toStep.name}</span>
                            <span className="text-slate-400 ml-auto text-[10px]">{new Date(t.performed_at).toLocaleString('en-UG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
