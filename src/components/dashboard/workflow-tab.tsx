'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'
import {
  GitBranch,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Play,
  AlertCircle,
  Zap,
} from 'lucide-react'

interface WorkflowStep {
  id: string
  name: string
  slug: string
  step_order: number
  step_type: string
  sla_hours: number | null
  config: Record<string, unknown> | null
}

interface WorkflowTransition {
  id: string
  action: string
  performed_by: string | null
  performed_at: string
  notes: string | null
  fromStep: { id: string; name: string; step_order: number } | null
  toStep: { id: string; name: string; step_order: number }
}

interface WorkflowInstance {
  id: string
  status: string
  current_step_id: string | null
  current_step_order: number | null
  started_at: string
  completed_at: string | null
  subject_type: string
  subject_id: string
  metadata: Record<string, unknown> | null
  transitions: WorkflowTransition[]
}

interface WorkflowDefinition {
  id: string
  name: string
  slug: string
  description: string | null
  version: number
  is_active: boolean
  trigger_type: string
  steps: WorkflowStep[]
  instances: WorkflowInstance[]
}

interface WorkflowsData {
  workflowDefinitions: WorkflowDefinition[]
}

const STEP_TYPE_ICONS: Record<string, React.ElementType> = {
  approval: CheckCircle2,
  action: Zap,
  notification: AlertCircle,
  review: Clock,
}

function getStepStatus(
  step: WorkflowStep,
  instance: WorkflowInstance | null
): 'completed' | 'current' | 'upcoming' {
  if (!instance) return 'upcoming'
  if (instance.current_step_order === null) return 'upcoming'
  if (step.step_order < instance.current_step_order) return 'completed'
  if (step.step_order === instance.current_step_order) return 'current'
  return 'upcoming'
}

function getSlaProgress(step: WorkflowStep, instance: WorkflowInstance | null): number {
  if (!instance || !step.sla_hours) return 0
  if (getStepStatus(step, instance) === 'completed') return 100
  if (getStepStatus(step, instance) === 'upcoming') return 0
  const startedAt = new Date(instance.started_at)
  const now = new Date()
  const elapsedHours = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60)
  return Math.min(100, Math.round((elapsedHours / step.sla_hours) * 100))
}

export function WorkflowTab() {
  const { data, isLoading } = useQuery<WorkflowsData>({
    queryKey: ['workflows'],
    queryFn: () => fetch('/api/workflows').then((r) => r.json()),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded w-48 mb-4" />
              <div className="flex gap-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-20 bg-muted rounded w-32" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return null

  const { workflowDefinitions } = data

  return (
    <div className="space-y-6">
      {/* Workflow Definition Cards */}
      {workflowDefinitions.map((wf) => {
        const activeInstance = wf.instances.find(
          (i) => i.status !== 'completed' && i.status !== 'cancelled'
        )

        return (
          <Card key={wf.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    {wf.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {wf.description || `Version ${wf.version} · ${wf.steps.length} steps · Trigger: ${wf.trigger_type}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">v{wf.version}</Badge>
                  {wf.is_active ? (
                    <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Visual Stepper */}
              <div className="mb-8">
                <div className="flex items-center gap-0 overflow-x-auto pb-4">
                  {wf.steps.map((step, idx) => {
                    const status = getStepStatus(step, activeInstance)
                    const Icon = STEP_TYPE_ICONS[step.step_type] || Circle
                    const slaProgress = getSlaProgress(step, activeInstance)

                    return (
                      <div key={step.id} className="flex items-center shrink-0">
                        <div className="flex flex-col items-center w-32">
                          <div
                            className={`
                              w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                              ${status === 'completed'
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : status === 'current'
                                  ? 'bg-amber-50 border-amber-500 text-amber-600 ring-4 ring-amber-100'
                                  : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                              }
                            `}
                          >
                            {status === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : status === 'current' ? (
                              <Play className="h-5 w-5" />
                            ) : (
                              <Icon className="h-5 w-5" />
                            )}
                          </div>
                          <div className="mt-2 text-center">
                            <p className={`text-xs font-medium ${status === 'current' ? 'text-amber-700' : ''}`}>
                              {step.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Step {step.step_order} · {step.step_type}
                            </p>
                            {step.sla_hours && (
                              <p className="text-[10px] text-muted-foreground">
                                SLA: {step.sla_hours}h
                              </p>
                            )}
                            {status === 'current' && step.sla_hours && (
                              <div className="mt-1 w-20 mx-auto">
                                <Progress value={slaProgress} className="h-1.5" />
                                <p className="text-[10px] text-amber-600 mt-0.5">
                                  {slaProgress}% of SLA
                                </p>
                              </div>
                            )}
                          </div>
                          {status === 'current' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 h-7 text-xs"
                              onClick={() => {
                                toast({
                                  title: 'Workflow Advanced',
                                  description: `Moved from "${step.name}" to next step`,
                                })
                              }}
                            >
                              Advance
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                        {idx < wf.steps.length - 1 && (
                          <div
                            className={`
                              w-8 h-0.5 mx-1 mt-[-2rem]
                              ${getStepStatus(wf.steps[idx + 1], activeInstance) !== 'upcoming'
                                ? 'bg-emerald-400'
                                : 'bg-muted-foreground/20'
                              }
                            `}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Active Instance Details */}
              {activeInstance && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Circle className="h-3 w-3 text-amber-500 fill-amber-500" />
                    Active Instance
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge className="mt-1 bg-amber-100 text-amber-800">{activeInstance.status}</Badge>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Subject</p>
                      <p className="text-sm font-medium mt-1">
                        {activeInstance.subject_type} #{activeInstance.subject_id.slice(0, 8)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Started</p>
                      <p className="text-sm font-medium mt-1">
                        {new Date(activeInstance.started_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Transition History */}
                  {activeInstance.transitions.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2">Transition History</h5>
                      <div className="space-y-2">
                        {activeInstance.transitions.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20"
                          >
                            <ArrowRight className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground">
                                  {t.fromStep?.name || 'Start'}
                                </span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs font-medium">{t.toStep.name}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  Action: <b>{t.action}</b>
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(t.performed_at).toLocaleString()}
                                </span>
                              </div>
                              {t.notes && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  &ldquo;{t.notes}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step Cards */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold mb-3">All Steps Detail</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {wf.steps.map((step) => {
                    const status = getStepStatus(step, activeInstance)
                    return (
                      <div
                        key={step.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          status === 'current'
                            ? 'border-amber-300 bg-amber-50/50'
                            : status === 'completed'
                              ? 'border-emerald-200 bg-emerald-50/30'
                              : 'bg-muted/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{step.name}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              status === 'current'
                                ? 'border-amber-400 text-amber-700'
                                : status === 'completed'
                                  ? 'border-emerald-400 text-emerald-700'
                                  : ''
                            }`}
                          >
                            {status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>Order: {step.step_order} · Type: {step.step_type}</p>
                          {step.sla_hours && <p>SLA: {step.sla_hours} hours</p>}
                          <p>Required: {step.config && typeof step.config === 'object' && 'is_required' in step.config ? 'Yes' : 'Yes'}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
