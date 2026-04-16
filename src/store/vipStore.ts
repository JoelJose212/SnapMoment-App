import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface VIPGuest {
  id: string
  name: string
  vector: number[]
  lastSeenAt?: number
  eventId: string
  referenceImageUrl: string
}

interface VIPState {
  vips: VIPGuest[]
  addVIP: (vip: VIPGuest) => void
  removeVIP: (id: string) => void
  updateLastSeen: (id: string, timestamp: number) => void
  getVIPsByEvent: (eventId: string) => VIPGuest[]
}

export const useVIPStore = create<VIPState>()(
  persist(
    (set, get) => ({
      vips: [],
      addVIP: (vip) => set((state) => ({ vips: [...state.vips, vip] })),
      removeVIP: (id) => set((state) => ({ vips: state.vips.filter((v) => v.id !== id) })),
      updateLastSeen: (id, timestamp) => set((state) => ({
        vips: state.vips.map((v) => v.id === id ? { ...v, lastSeenAt: timestamp } : v)
      })),
      getVIPsByEvent: (eventId) => get().vips.filter((v) => v.eventId === eventId),
    }),
    {
      name: 'snapmoment-vips',
    }
  )
)
