// GWS Platform V2 — Offline-aware Fetch Wrapper

import { getOfflineDB } from './offline-db'

const DEFAULT_CACHE_MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours

export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

// Offline-aware fetch wrapper
export async function offlineFetch(
  url: string,
  options?: RequestInit & { cacheMaxAge?: number }
): Promise<Response> {
  const { cacheMaxAge = DEFAULT_CACHE_MAX_AGE, ...fetchOptions } = options || {}
  const method = (fetchOptions.method || 'GET').toUpperCase()
  const db = getOfflineDB()

  // For read operations (GET), try network first, fall back to cache
  if (method === 'GET') {
    try {
      const response = await fetch(url, fetchOptions)
      if (response.ok) {
        // Cache the successful response
        try {
          const cloned = response.clone()
          const data = await cloned.json()
          await db.put(url, data, Date.now())
        } catch {
          // Ignore cache errors for non-JSON responses
        }
        return response
      }
      throw new Error(`HTTP ${response.status}`)
    } catch (networkError) {
      // Network failed, try cache
      const cached = await db.get(url, cacheMaxAge)
      if (cached) {
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-From-Cache': 'true' },
        })
      }
      throw networkError
    }
  }

  // For write operations (POST, PATCH, DELETE), try network first
  try {
    const response = await fetch(url, fetchOptions)
    if (response.ok) {
      return response
    }
    throw new Error(`HTTP ${response.status}`)
  } catch (networkError) {
    // If offline, queue the operation for later sync
    if (!isOnline()) {
      let body: any = null
      if (fetchOptions.body) {
        try {
          body = JSON.parse(fetchOptions.body as string)
        } catch {
          body = fetchOptions.body
        }
      }

      await db.addToSyncQueue({
        endpoint: url,
        method,
        body,
      })

      // Return a mock success response
      return new Response(JSON.stringify({ 
        success: true, 
        offline: true, 
        message: 'Operation queued for sync' 
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    throw networkError
  }
}

// Get the count of pending sync operations
export async function getSyncQueueCount(): Promise<number> {
  const db = getOfflineDB()
  const stats = await db.getCacheStats()
  return stats.queueCount
}

// Process all queued sync operations
export async function processSyncQueue(): Promise<{
  processed: number
  failed: number
  errors: string[]
}> {
  const db = getOfflineDB()
  const queue = await db.getSyncQueue()
  const results = { processed: 0, failed: 0, errors: [] as string[] }

  for (const item of queue) {
    try {
      const response = await fetch(item.endpoint, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: item.body,
      })

      if (response.ok) {
        await db.removeFromSyncQueue(item.id)
        results.processed++
      } else {
        await db.incrementRetry(item.id)
        results.failed++
        results.errors.push(`${item.operation}: HTTP ${response.status}`)
      }
    } catch (error: any) {
      await db.incrementRetry(item.id)
      results.failed++
      results.errors.push(`${item.operation}: ${error.message}`)
    }
  }

  return results
}
