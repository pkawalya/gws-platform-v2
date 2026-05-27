'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Brain, Cpu, FileText } from 'lucide-react'
import { fmt, statusBadge } from './constants'

interface AIPageProps {
  aiData: any
  openDetail: (type: string, data: any) => void
}

export function AIPage({ aiData, openDetail }: AIPageProps) {
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Cpu className="w-4 h-4 text-violet-600" /> AI Model Registry</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {aiData?.models.map((model: any) => (
              <div key={model.id} className="p-3 rounded-lg border cursor-pointer hover:border-violet-200 transition-colors" onClick={() => openDetail('ai-model', model)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{model.display_name}</span>
                  <Badge className={model.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}>{model.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <p className="text-xs text-slate-500">{model.provider} • {model.model_name}</p>
                {model.cost_per_1k_input && <p className="text-[11px] text-slate-400 mt-1">${Number(model.cost_per_1k_input).toFixed(4)}/1K in • ${Number(model.cost_per_1k_output).toFixed(4)}/1K out</p>}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /> Prompt Templates</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {aiData?.templates.map((t: any) => (
              <div key={t.id} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{t.name}</span>
                  <Badge variant="outline" className="text-[10px]">{t.aiModelVersion.display_name}</Badge>
                </div>
                <p className="text-xs text-slate-500">{t.description}</p>
                <Badge variant="outline" className="text-[10px] mt-1 font-mono">{t.slug}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">AI Call Log</CardTitle><CardDescription>Recent model invocations</CardDescription></CardHeader>
        <CardContent>
          {aiData?.callLogs?.length > 0 ? (
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Model</TableHead><TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">In/Out Tokens</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Cost</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Latency</TableHead>
                <TableHead className="text-xs">Time</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {aiData.callLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{log.aiModelVersion.display_name}</TableCell>
                    <TableCell>{statusBadge(log.status)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs">{log.input_tokens || '—'} / {log.output_tokens || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs">{log.cost_usd ? `$${Number(log.cost_usd).toFixed(6)}` : '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">{log.latency_ms ? `${log.latency_ms}ms` : '—'}</TableCell>
                    <TableCell className="text-[11px] text-slate-400">{new Date(log.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10"><Brain className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-sm text-slate-500">No AI calls logged yet</p></div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
