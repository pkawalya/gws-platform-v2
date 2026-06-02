// GWS Platform V2 — Offline Status Hook

'use client'

import { useState, useEffect, useCallback } from 'react'
import { getOfflineDB } from '@/lib/offline-db'
import { processSyncQueue, isOnline, getSyncQueueCount } from '@/lib/offline-fetch'

interface OfflineStatus {
  isOnline: boolean
  isOffline: boolean
  lastSyncTime: number | null
  syncQueueCount: number
  isSyncing: boolean
  syncNow: () => Promise<void>
}

export function useOffline(): OfflineStatus {
  const [online, setOnline] = useState(true)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  const [syncQueueCount, setSyncQueueCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  // Check initial online status
  useEffect(() => {
    setOnline(isOnline())
  }, [])

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      // Auto-process sync queue when coming back online
      handleSyncNow()
    }
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load cache stats on mount
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const db = getOfflineDB()
      const stats = await db.getCacheStats()
      setLastSyncTime(stats.lastSyncTime)
      setSyncQueueCount(stats.queueCount)
    } catch (e) {
      console.error('Failed to load offline stats:', e)
    }
  }

  const handleSyncNow = useCallback(async () => {
    setIsSyncing(true)
    try {
      const result = await processSyncQueue()
      await loadStats()
      if (result.failed > 0) {
        console.warn(`Sync completed with ${result.failed} failures:`, result.errors)
      }
    } catch (e) {
      console.error('Sync failed:', e)
    } finally {
      setIsSyncing(false)
    }
  }, [])

  return {
    isOnline: online,
    isOffline: !online,
    lastSyncTime,
    syncQueueCount,
    isSyncing,
    syncNow: handleSyncNow,
  }
}
