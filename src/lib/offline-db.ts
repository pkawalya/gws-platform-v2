// GWS Platform V2 — IndexedDB Offline Database Wrapper

const DB_NAME = 'gws-offline-db'
const DB_VERSION = 1

interface CachedData {
  endpoint: string
  data: any
  timestamp: number
}

interface SyncQueueItem {
  id: string
  operation: string
  endpoint: string
  method: string
  body: string
  timestamp: number
  retries: number
}

interface CacheStats {
  cacheSize: number
  lastSyncTime: number | null
  queueCount: number
}

class OfflineDB {
  private db: IDBDatabase | null = null

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Cached data store
        if (!db.objectStoreNames.contains('cached-data')) {
          db.createObjectStore('cached-data', { keyPath: 'endpoint' })
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('sync-queue')) {
          const syncStore = db.createObjectStore('sync-queue', { keyPath: 'id' })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Offline settings store
        if (!db.objectStoreNames.contains('offline-settings')) {
          db.createObjectStore('offline-settings', { keyPath: 'key' })
        }
      }
    })
  }

  // Cache API response data
  async put(endpoint: string, data: any, timestamp?: number): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cached-data', 'readwrite')
      const store = tx.objectStore('cached-data')
      const request = store.put({
        endpoint,
        data,
        timestamp: timestamp || Date.now(),
      })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Get cached data with optional staleness check (in milliseconds)
  async get(endpoint: string, maxAge?: number): Promise<any | null> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cached-data', 'readonly')
      const store = tx.objectStore('cached-data')
      const request = store.get(endpoint)

      request.onsuccess = () => {
        const result = request.result as CachedData | undefined
        if (!result) {
          resolve(null)
          return
        }

        // Check staleness
        if (maxAge && Date.now() - result.timestamp > maxAge) {
          resolve(null) // Data is stale
          return
        }

        resolve(result.data)
      }

      request.onerror = () => reject(request.error)
    })
  }

  // Add a write operation to the sync queue
  async addToSyncQueue(operation: {
    endpoint: string
    method: string
    body: any
  }): Promise<string> {
    const db = await this.getDB()
    const id = `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const item: SyncQueueItem = {
      id,
      operation: `${operation.method} ${operation.endpoint}`,
      endpoint: operation.endpoint,
      method: operation.method,
      body: JSON.stringify(operation.body),
      timestamp: Date.now(),
      retries: 0,
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync-queue', 'readwrite')
      const store = tx.objectStore('sync-queue')
      const request = store.put(item)
      request.onsuccess = () => resolve(id)
      request.onerror = () => reject(request.error)
    })
  }

  // Get all pending sync operations
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync-queue', 'readonly')
      const store = tx.objectStore('sync-queue')
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  // Remove a synced operation from the queue
  async removeFromSyncQueue(id: string): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync-queue', 'readwrite')
      const store = tx.objectStore('sync-queue')
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Increment retry count for a sync queue item
  async incrementRetry(id: string): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync-queue', 'readwrite')
      const store = tx.objectStore('sync-queue')
      const getReq = store.get(id)

      getReq.onsuccess = () => {
        const item = getReq.result as SyncQueueItem | undefined
        if (item) {
          item.retries += 1
          store.put(item)
        }
        resolve()
      }
      getReq.onerror = () => reject(getReq.error)
    })
  }

  // Clear all cached data
  async clearAll(): Promise<void> {
    const db = await this.getDB()
    const storeNames = ['cached-data', 'sync-queue', 'offline-settings']
    for (const name of storeNames) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(name, 'readwrite')
        const store = tx.objectStore(name)
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  }

  // Get cache statistics
  async getCacheStats(): Promise<CacheStats> {
    const db = await this.getDB()

    // Get cache size
    const cacheSize = await new Promise<number>((resolve, reject) => {
      const tx = db.transaction('cached-data', 'readonly')
      const store = tx.objectStore('cached-data')
      const request = store.count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    // Get last sync time
    const lastSyncTime = await new Promise<number | null>((resolve, reject) => {
      const tx = db.transaction('cached-data', 'readonly')
      const store = tx.objectStore('cached-data')
      const request = store.getAll()
      request.onsuccess = () => {
        const items = request.result as CachedData[]
        if (items.length === 0) {
          resolve(null)
          return
        }
        const latest = Math.max(...items.map(i => i.timestamp))
        resolve(latest)
      }
      request.onerror = () => reject(request.error)
    })

    // Get queue count
    const queueCount = await new Promise<number>((resolve, reject) => {
      const tx = db.transaction('sync-queue', 'readonly')
      const store = tx.objectStore('sync-queue')
      const request = store.count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    return { cacheSize, lastSyncTime, queueCount }
  }

  // Save offline setting
  async setSetting(key: string, value: any): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offline-settings', 'readwrite')
      const store = tx.objectStore('offline-settings')
      const request = store.put({ key, value })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Get offline setting
  async getSetting(key: string): Promise<any> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offline-settings', 'readonly')
      const store = tx.objectStore('offline-settings')
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result?.value ?? null)
      request.onerror = () => reject(request.error)
    })
  }
}

// Singleton instance
let offlineDBInstance: OfflineDB | null = null

export function getOfflineDB(): OfflineDB {
  if (!offlineDBInstance) {
    offlineDBInstance = new OfflineDB()
  }
  return offlineDBInstance
}

export type { CachedData, SyncQueueItem, CacheStats }
