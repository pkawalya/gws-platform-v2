'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  RefreshCw,
  Smartphone,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Wifi,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface FieldObservation {
  id: string
  observation_type: string
  title: string
  description: string | null
  latitude: number
  longitude: number
  accuracy_meters: number | null
  altitude_meters: number | null
  media_paths: Record<string, unknown> | null
  form_data: Record<string, unknown> | null
  status: string
  sync_id: string | null
  synced_at: string
  created_at: string
  surveyProject: {
    title: string
    project_ref: string
  } | null
}

interface SyncEvent {
  id: string
  device_id: string
  user_id: string
  sync_type: string
  status: string
  records_pushed: number
  records_pulled: number
  conflicts_count: number
  started_at: string
  completed_at: string | null
  error_message: string | null
}

interface FieldSyncData {
  fieldObservations: FieldObservation[]
  syncEvents: SyncEvent[]
}

const SYNC_STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: CheckCircle2 },
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', icon: Clock },
  failed: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', icon: RefreshCw },
}

export function FieldSyncTab() {
  const { data, isLoading } = useQuery<FieldSyncData>({
    queryKey: ['field-sync'],
    queryFn: () => fetch('/api/field-sync').then((r) => r.json()),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded w-48 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-muted rounded" />
                <div className="h-20 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return null

  const { fieldObservations, syncEvents } = data

  const totalPushed = syncEvents.reduce((sum, e) => sum + e.records_pushed, 0)
  const totalPulled = syncEvents.reduce((sum, e) => sum + e.records_pulled, 0)
  const totalConflicts = syncEvents.reduce((sum, e) => sum + e.conflicts_count, 0)
  const syncedCount = fieldObservations.filter((o) => o.status === 'synced').length
  const pendingCount = fieldObservations.filter((o) => o.status === 'pending').length

  // Chart data from sync events
  const chartData = syncEvents.map((event) => ({
    name: event.sync_type === 'push' ? 'Push' : 'Pull',
    pushed: event.records_pushed,
    pulled: event.records_pulled,
    conflicts: event.conflicts_count,
    device: event.device_id.slice(0, 8),
    time: new Date(event.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }))

  // Group unique devices
  const uniqueDevices = [...new Set(syncEvents.map((e) => e.device_id))]

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 p-2">
              <Upload className="h-4 w-4 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Records Pushed</p>
              <p className="text-xl font-bold">{totalPushed}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-2">
              <Download className="h-4 w-4 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Records Pulled</p>
              <p className="text-xl font-bold">{totalPulled}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-red-100 p-2">
              <AlertTriangle className="h-4 w-4 text-red-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Conflicts</p>
              <p className="text-xl font-bold">{totalConflicts}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-100 p-2">
              <Smartphone className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Devices</p>
              <p className="text-xl font-bold">{uniqueDevices.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sync Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Push/Pull Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sync Statistics</CardTitle>
            <CardDescription>Push/Pull records and conflicts per sync event</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pushed" fill="#059669" radius={[4, 4, 0, 0]} name="Pushed" />
                    <Bar dataKey="pulled" fill="#2563eb" radius={[4, 4, 0, 0]} name="Pulled" />
                    <Bar dataKey="conflicts" fill="#dc2626" radius={[4, 4, 0, 0]} name="Conflicts" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No sync event data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device Sync Status</CardTitle>
            <CardDescription>Current status of field devices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uniqueDevices.map((deviceId) => {
                const deviceEvents = syncEvents.filter((e) => e.device_id === deviceId)
                const lastEvent = deviceEvents[0]
                const style = SYNC_STATUS_STYLES[lastEvent?.status] || SYNC_STATUS_STYLES.pending
                const StatusIcon = style.icon

                return (
                  <div key={deviceId} className="p-4 rounded-lg border bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{deviceId}</span>
                      </div>
                      <Badge className={`${style.bg} ${style.text} text-xs`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {lastEvent?.status || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Wifi className="h-3 w-3" />
                        <span>{deviceEvents.length} syncs</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Upload className="h-3 w-3" />
                        <span>{deviceEvents.reduce((s, e) => s + e.records_pushed, 0)} pushed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        <span>{deviceEvents.reduce((s, e) => s + e.records_pulled, 0)} pulled</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Event Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync Event Log</CardTitle>
          <CardDescription>Detailed history of field synchronization events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {syncEvents.map((event) => {
              const style = SYNC_STATUS_STYLES[event.status] || SYNC_STATUS_STYLES.pending
              const StatusIcon = style.icon

              return (
                <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20">
                  <div className={`rounded-full p-2 ${style.bg}`}>
                    <StatusIcon className={`h-4 w-4 ${style.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm capitalize">{event.sync_type} Sync</span>
                      <Badge className={`${style.bg} ${style.text} text-xs`}>{event.status}</Badge>
                      <Badge variant="outline" className="text-xs">
                        <Smartphone className="h-3 w-3 mr-1" />
                        {event.device_id.slice(0, 8)}
                      </Badge>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Pushed: {event.records_pushed}</span>
                      <span>Pulled: {event.records_pulled}</span>
                      {event.conflicts_count > 0 && (
                        <span className="text-red-600 font-medium">
                          Conflicts: {event.conflicts_count}
                        </span>
                      )}
                    </div>
                    {event.error_message && (
                      <p className="text-xs text-red-600 mt-1">{event.error_message}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <p>{new Date(event.started_at).toLocaleDateString()}</p>
                    <p>{new Date(event.started_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Field Observations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Field Observations</CardTitle>
              <CardDescription>GPS-tagged observations from field teams</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {syncedCount} Synced
              </Badge>
              {pendingCount > 0 && (
                <Badge className="bg-amber-100 text-amber-800 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {pendingCount} Pending
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fieldObservations.map((obs) => (
              <div key={obs.id} className="p-4 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm truncate">{obs.title}</span>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ml-2 ${
                      obs.status === 'synced'
                        ? 'border-emerald-400 text-emerald-700'
                        : 'border-amber-400 text-amber-700'
                    }`}
                  >
                    {obs.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2 capitalize">
                  {obs.observation_type.replace(/_/g, ' ')}
                </p>
                {obs.surveyProject && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Project: {obs.surveyProject.title}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {obs.latitude.toFixed(6)}, {obs.longitude.toFixed(6)}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {obs.accuracy_meters && <span>Accuracy: ±{obs.accuracy_meters}m</span>}
                  {obs.altitude_meters && <span>Alt: {obs.altitude_meters}m</span>}
                </div>
                {obs.form_data && Object.keys(obs.form_data).length > 0 && (
                  <div className="mt-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                    <span className="font-medium">Form data:</span>{' '}
                    {Object.entries(obs.form_data).slice(0, 3).map(([k, v]) => (
                      <span key={k}>{k}: {String(v)}; </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
