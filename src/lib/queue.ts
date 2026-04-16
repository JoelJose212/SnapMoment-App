import { openDB, IDBPDatabase } from 'idb'
import { photosApi } from './api'

export interface QueueItem {
  id?: number
  file: File | Blob
  eventId: string
  vectors: number[][]
  fileName: string
  retryCount: number
  status: 'pending' | 'uploading' | 'failed'
}

let dbPromise: Promise<IDBPDatabase> | null = null

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB('snapmoment-queue', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('uploads')) {
          db.createObjectStore('uploads', { keyPath: 'id', autoIncrement: true })
        }
      },
    })
  }
  return dbPromise
}

export const addToQueue = async (item: Omit<QueueItem, 'status' | 'retryCount'>) => {
  const db = await getDB()
  return db.add('uploads', { ...item, status: 'pending', retryCount: 0 })
}

export const getQueue = async (): Promise<QueueItem[]> => {
  const db = await getDB()
  return db.getAll('uploads')
}

export const removeFromQueue = async (id: number) => {
  const db = await getDB()
  return db.delete('uploads', id)
}

export const updateQueueItem = async (item: QueueItem) => {
  const db = await getDB()
  return db.put('uploads', item)
}

/**
 * Background Sync Logic
 * Monitors connectivity and processes the queue sequentially.
 */
let isSyncing = false

export const startSync = async (onProgress?: (count: number) => void) => {
  if (isSyncing) return
  isSyncing = true

  const process = async () => {
    if (!navigator.onLine) {
      isSyncing = false
      return
    }

    const items = await getQueue()
    const pending = items.filter(i => i.status !== 'uploading')
    
    if (onProgress) onProgress(pending.length)
    if (pending.length === 0) {
      isSyncing = false
      return
    }

    const next = pending[0]
    next.status = 'uploading'
    await updateQueueItem(next)

    try {
      const formData = new FormData()
      formData.append('files', next.file, next.fileName)
      
      await photosApi.upload(next.eventId, formData, undefined, next.vectors)
      
      // Success! Remove from queue.
      await removeFromQueue(next.id!)
      
      // Auto-continue
      setTimeout(process, 500)
    } catch (err) {
      console.error(`Sync failure for ${next.fileName}:`, err)
      
      next.status = 'failed'
      next.retryCount += 1
      
      if (next.retryCount > 5) {
        // Abandon after 5 retries
        await removeFromQueue(next.id!)
      } else {
        await updateQueueItem(next)
      }
      
      // Wait longer before next attempt
      setTimeout(process, 5000) 
    }
  }

  process()
}

// Global network listener to resume sync
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => startSync())
}
