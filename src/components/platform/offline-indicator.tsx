'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react'

interface OfflineIndicatorProps {
  isOnline: boolean
  isSyncing: boolean
  syncQueueCount: number
  lastSyncTime: number | null
  onSyncNow: () => void
}

export function OfflineIndicator({
  isOnline,
  isSyncing,
  syncQueueCount,
  lastSyncTime,
  onSyncNow,
}: OfflineIndicatorProps) {
  const formatLastSync = (time: number | null) => {
    if (!time) return 'Never'
    const diff = Date.now() - time
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  if (isSyncing) {
    return (
      <Badge
        variant="outline"
        className="text-amber-700 border-amber-200 bg-amber-50 text-[10px] hidden sm:flex items-center gap-1 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950 cursor-pointer"
        onClick={onSyncNow}
      >
        <RefreshCw className="w-3 h-3 animate-spin" />
        Syncing...
      </Badge>
    )
  }

  if (isOnline) {
    return (
      <Badge
        variant="outline"
        className="text-emerald-700 border-emerald-200 bg-emerald-50 text-[10px] hidden sm:flex items-center gap-1 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950 cursor-pointer"
        onClick={onSyncNow}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Online
        {lastSyncTime && (
          <span className="text-[9px] text-slate-400 ml-0.5">
            <Clock className="w-2.5 h-2.5 inline mr-0.5" />
            {formatLastSync(lastSyncTime)}
          </span>
        )}
      </Badge>
    )
  }

  return (
    <div className="hidden sm:flex items-center gap-1">
      <Badge
        variant="outline"
        className="text-amber-700 border-amber-200 bg-amber-50 text-[10px] flex items-center gap-1 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950"
      >
        <WifiOff className="w-3 h-3" />
        Offline
        {syncQueueCount > 0 && (
          <span className="ml-1 bg-amber-200 text-amber-800 rounded-full px-1.5 py-0 text-[9px] font-bold dark:bg-amber-800 dark:text-amber-200">
            {syncQueueCount}
          </span>
        )}
      </Badge>
      {syncQueueCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={onSyncNow}
          disabled
          title="Sync will happen when back online"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          {syncQueueCount} pending
        </Button>
      )}
    </div>
  )
}
