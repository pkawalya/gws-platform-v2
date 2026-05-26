'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Brain,
  FileText,
  DollarSign,
  Clock,
  Zap,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface AiModelVersion {
  id: string
  provider: string
  model_name: string
  display_name: string
  is_active: boolean
  cost_per_1k_input: number | null
  cost_per_1k_output: number | null
  max_tokens: number | null
  _count?: { callLogs: number; promptTemplates: number }
}

interface AiPromptTemplate {
  id: string
  slug: string
  name: string
  description: string | null
  model_id: string
  temperature: number | null
  max_tokens: number | null
  is_active: boolean
  aiModelVersion: { display_name: string; provider: string }
}

interface AiCallLog {
  id: string
  model_id: string
  input_tokens: number | null
  output_tokens: number | null
  cost_usd: number | null
  latency_ms: number | null
  status: string
  error_message: string | null
  created_at: string
  aiModelVersion: { display_name: string; provider: string }
}

interface AiData {
  aiModelVersions: AiModelVersion[]
  aiPromptTemplates: AiPromptTemplate[]
  aiCallLogs: AiCallLog[]
}

export function AiTab() {
  const { data, isLoading } = useQuery<AiData>({
    queryKey: ['ai'],
    queryFn: () => fetch('/api/ai').then((r) => r.json()),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded w-48 mb-4" />
              <div className="h-48 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return null

  const { aiModelVersions, aiPromptTemplates, aiCallLogs } = data

  const totalCost = aiCallLogs.reduce((sum, l) => sum + (l.cost_usd || 0), 0)
  const totalInputTokens = aiCallLogs.reduce((sum, l) => sum + (l.input_tokens || 0), 0)
  const totalOutputTokens = aiCallLogs.reduce((sum, l) => sum + (l.output_tokens || 0), 0)
  const avgLatency = aiCallLogs.length > 0
    ? Math.round(aiCallLogs.reduce((sum, l) => sum + (l.latency_ms || 0), 0) / aiCallLogs.length)
    : 0
  const successRate = aiCallLogs.length > 0
    ? Math.round((aiCallLogs.filter((l) => l.status === 'completed').length / aiCallLogs.length) * 100)
    : 0

  // Token usage by model
  const tokenByModel = aiModelVersions.map((model) => {
    const modelLogs = aiCallLogs.filter((l) => l.model_id === model.id)
    return {
      name: model.display_name,
      inputTokens: modelLogs.reduce((s, l) => s + (l.input_tokens || 0), 0),
      outputTokens: modelLogs.reduce((s, l) => s + (l.output_tokens || 0), 0),
      cost: modelLogs.reduce((s, l) => s + (l.cost_usd || 0), 0),
    }
  })

  // Call logs timeline data (simulated from the call logs)
  const callLogTimeline = aiCallLogs.map((log) => ({
    time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    latency: log.latency_ms || 0,
    cost: Number((log.cost_usd || 0).toFixed(4)),
    model: log.aiModelVersion?.display_name || 'Unknown',
    status: log.status,
  }))

  // Cost breakdown by model
  const costByModel = aiModelVersions.map((model) => {
    const modelCost = aiCallLogs
      .filter((l) => l.model_id === model.id)
      .reduce((s, l) => s + (l.cost_usd || 0), 0)
    return {
      name: model.display_name,
      value: Number(modelCost.toFixed(4)),
    }
  }).filter((m) => m.value > 0)

  const COST_COLORS = ['#059669', '#d97706', '#7c3aed', '#dc2626']

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-violet-100 p-2">
              <Brain className="h-4 w-4 text-violet-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Models</p>
              <p className="text-xl font-bold">{aiModelVersions.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 p-2">
              <DollarSign className="h-4 w-4 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Cost</p>
              <p className="text-xl font-bold">${totalCost.toFixed(4)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-2">
              <BarChart3 className="h-4 w-4 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Tokens</p>
              <p className="text-xl font-bold">{(totalInputTokens + totalOutputTokens).toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-100 p-2">
              <Clock className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Latency</p>
              <p className="text-xl font-bold">{avgLatency}ms</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-green-100 p-2">
              <TrendingUp className="h-4 w-4 text-green-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Success Rate</p>
              <p className="text-xl font-bold">{successRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Token Usage by Model */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Token Usage by Model</CardTitle>
            <CardDescription>Input and output token consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {tokenByModel.some((m) => m.inputTokens > 0 || m.outputTokens > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tokenByModel}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="inputTokens" fill="#059669" radius={[4, 4, 0, 0]} name="Input Tokens" />
                    <Bar dataKey="outputTokens" fill="#d97706" radius={[4, 4, 0, 0]} name="Output Tokens" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No token usage data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cost Distribution</CardTitle>
            <CardDescription>Cost breakdown by AI model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {costByModel.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costByModel}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `$${value}`}
                    >
                      {costByModel.map((_, index) => (
                        <Cell key={index} fill={COST_COLORS[index % COST_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toFixed(4)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No cost data available
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {costByModel.map((entry, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COST_COLORS[i % COST_COLORS.length] }}
                  />
                  <span className="text-muted-foreground">{entry.name}: ${entry.value.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latency Timeline */}
      {callLogTimeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Call Latency Timeline</CardTitle>
            <CardDescription>Response time and cost per API call</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={callLogTimeline}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="latency"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Latency (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Model Versions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Model Versions
          </CardTitle>
          <CardDescription>Registered AI models and their pricing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Input Cost/1K</TableHead>
                  <TableHead>Output Cost/1K</TableHead>
                  <TableHead>Max Tokens</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aiModelVersions.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">{model.display_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {model.provider}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      ${model.cost_per_1k_input?.toFixed(6) || 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      ${model.cost_per_1k_output?.toFixed(6) || 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {model.max_tokens?.toLocaleString() || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {model.is_active ? (
                        <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Prompt Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Prompt Templates
          </CardTitle>
          <CardDescription>Configured AI prompt templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiPromptTemplates.map((template) => (
              <div key={template.id} className="p-4 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{template.name}</span>
                  {template.is_active ? (
                    <Badge className="bg-emerald-100 text-emerald-800 text-xs">Active</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Inactive</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {template.description || 'No description'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    {template.aiModelVersion?.display_name || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  {template.temperature !== null && (
                    <span>Temp: {template.temperature}</span>
                  )}
                  {template.max_tokens && (
                    <span>Max: {template.max_tokens.toLocaleString()}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  slug: {template.slug}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Call Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent AI Call Logs</CardTitle>
          <CardDescription>Latest AI API calls with performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {aiCallLogs.length > 0 ? (
              aiCallLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                  <div className={`rounded-full p-1.5 ${
                    log.status === 'completed' ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    {log.status === 'completed' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-red-700" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{log.aiModelVersion?.display_name || 'Unknown'}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          log.status === 'completed'
                            ? 'border-emerald-400 text-emerald-700'
                            : 'border-red-400 text-red-700'
                        }`}
                      >
                        {log.status}
                      </Badge>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      {log.input_tokens && <span>In: {log.input_tokens.toLocaleString()}</span>}
                      {log.output_tokens && <span>Out: {log.output_tokens.toLocaleString()}</span>}
                      {log.cost_usd && <span>Cost: ${log.cost_usd.toFixed(6)}</span>}
                      {log.latency_ms && <span>Latency: {log.latency_ms}ms</span>}
                    </div>
                    {log.error_message && (
                      <p className="text-xs text-red-600 mt-1">{log.error_message}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No AI call logs recorded yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
