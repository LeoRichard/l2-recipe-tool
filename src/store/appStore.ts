import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { AppState, QueueEntry, InventoryEntry, PriceEntry } from '../types'

export type Section = 'recipes' | 'queue' | 'inventory' | 'bom' | 'prices'

interface AppStore extends AppState {
  activeSection: Section

  setActiveSection: (s: Section) => void
  addToQueue: (recipeId: string, qty?: number) => void
  removeFromQueue: (id: string) => void
  setQueueQty: (id: string, qty: number) => void
  moveQueueItem: (id: string, direction: 'up' | 'down') => void
  setInventory: (itemId: string, qty: number) => void
  removeInventory: (itemId: string) => void
  setPrice: (itemId: string, adenaPerUnit: number) => void
  importAppState: (state: AppState) => void
  exportAppState: () => AppState
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      activeSection: 'recipes',
      inventory: [],
      queue: [],
      prices: [],
      lastModified: new Date().toISOString(),

      setActiveSection: (activeSection) => set({ activeSection }),

      addToQueue: (recipeId, qty = 1) =>
        set((s) => ({
          queue: [...s.queue, { id: uuid(), recipeId, quantity: qty }],
          lastModified: new Date().toISOString(),
        })),

      removeFromQueue: (id) =>
        set((s) => ({
          queue: s.queue.filter((e) => e.id !== id),
          lastModified: new Date().toISOString(),
        })),

      setQueueQty: (id, qty) =>
        set((s) => ({
          queue: s.queue.map((e) => (e.id === id ? { ...e, quantity: Math.max(1, qty) } : e)),
          lastModified: new Date().toISOString(),
        })),

      moveQueueItem: (id, direction) =>
        set((s) => {
          const idx = s.queue.findIndex((e) => e.id === id)
          if (idx < 0) return s
          const newQueue = [...s.queue]
          const swapIdx = direction === 'up' ? idx - 1 : idx + 1
          if (swapIdx < 0 || swapIdx >= newQueue.length) return s
          ;[newQueue[idx], newQueue[swapIdx]] = [newQueue[swapIdx], newQueue[idx]]
          return { queue: newQueue }
        }),

      setInventory: (itemId, qty) =>
        set((s) => {
          const others = s.inventory.filter((e) => e.itemId !== itemId)
          const next: InventoryEntry[] = qty > 0 ? [...others, { itemId, quantity: qty }] : others
          return { inventory: next, lastModified: new Date().toISOString() }
        }),

      removeInventory: (itemId) =>
        set((s) => ({
          inventory: s.inventory.filter((e) => e.itemId !== itemId),
          lastModified: new Date().toISOString(),
        })),

      setPrice: (itemId, adenaPerUnit) =>
        set((s) => {
          const others = s.prices.filter((e) => e.itemId !== itemId)
          const next: PriceEntry[] =
            adenaPerUnit > 0 ? [...others, { itemId, adenaPerUnit }] : others
          return { prices: next, lastModified: new Date().toISOString() }
        }),

      importAppState: (state) =>
        set({
          inventory: state.inventory ?? [],
          queue: state.queue ?? [],
          prices: state.prices ?? [],
          lastModified: state.lastModified ?? new Date().toISOString(),
        }),

      exportAppState: () => {
        const { inventory, queue, prices, lastModified } = get()
        return { inventory, queue, prices, lastModified }
      },
    }),
    {
      name: 'l2rt_state',
      partialize: (s) => ({
        inventory: s.inventory,
        queue: s.queue,
        prices: s.prices,
        lastModified: s.lastModified,
      }),
    },
  ),
)
