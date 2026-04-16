import { openDB, IDBPDatabase } from 'idb'
import { photosApi } from './api'
import { calculateSimilarity } from './ai'
import { useVIPStore } from '../store/vipStore'
import { LocalNotifications } from '@capacitor/local-notifications'

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
 * VIP Matching Logic: Compares new frame vectors against registered VIP guests.
 */
const processVIPMatching = async (item: QueueItem) => {
  const vips = useVIPStore.getState().getVIPsByEvent(item.eventId)
  if (vips.length === 0 || item.vectors.length === 0) return

  for (const guest of vips) {
    for (const faceVec of item.vectors) {
      const score = calculateSimilarity(faceVec, guest.vector)
      
      // If match > 85%, update last seen
      if (score >= 0.85) {
        useVIPStore.getState().updateLastSeen(guest.id, Date.now())
        break 
      }
    }
  }
}

/**
 * Background Monitoring Logic: Proactively checks for missing VIPs.
 */
const startVIPAlertMonitor = () => {
  setInterval(async () => {
    const vips = useVIPStore.getState().vips
    const now = Date.now()
    const thirtyMinutes = 30 * 60 * 1000

    for (const v of vips) {
      const lastSeen = v.lastSeenAt || 0
      if (now - lastSeen > thirtyMinutes) {
        try {
          await LocalNotifications.schedule({
            notifications: [{
              title: 'VIP Coverage Alert! 🚨',
              body: `VIP "${v.name}" hasn't been captured in over 30 minutes.`,
              id: Math.floor(Math.random() * 10000),
              schedule: { at: new Date(Date.now() + 1000) }
            }]
          })
        } catch (e) {
          console.warn('Notifications permission denied or unavailable.')
        }
      }
    }
  }, 10 * 60 * 1000) // Check every 10 minutes
}

if (typeof window !== 'undefined') {
  startVIPAlertMonitor()
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
      
      // Perform VIP matching before/during upload
      await processVIPMatching(next)

      await photosApi.upload(next.eventId, formData, undefined, next.vectors)
      
      // Success! Remove from queue.
      await removeFromQueue(next.id!)
      
      // Auto-continue
      setTimeout(process, 500)
    } catch (err) {
      console.error(`Sync failure for ${next.fileName}:`, err)
      
      next.status = 'failed'
      next.retryCount += 1
      
      if (next.retryCount > 3) {
        // Abandon after 3 retries
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
