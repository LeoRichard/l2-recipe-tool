import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { AppState, QueueEntry, InventoryEntry, PriceEntry, CraftHistoryEntry, CraftOutcome } from '../types'

interface AppStore extends AppState {
  addToQueue: (recipeId: string, qty?: number) => void
  removeFromQueue: (id: string) => void
  setQueueQty: (id: string, qty: number) => void
  moveQueueItem: (id: string, direction: 'up' | 'down') => void
  setInventory: (itemId: string, qty: number) => void
  removeInventory: (itemId: string) => void
  setPrice: (itemId: string, adenaPerUnit: number) => void
  craftNow: (entryId: string, deductions: { itemId: string; qty: number }[], totalCost: number, successRate: number) => void
  setCraftOutcome: (historyId: string, outcome: CraftOutcome) => void
  clearCraftHistory: () => void
  importAppState: (state: AppState) => void
  exportAppState: () => AppState
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      inventory: [],
      queue: [],
      prices: [],
      craftHistory: [],
      lastModified: new Date().toISOString(),

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
          const isNew = !s.inventory.find((e) => e.itemId === itemId)
          const others = s.inventory.filter((e) => e.itemId !== itemId)
          // New items go to the top; existing items keep their position
          const next: InventoryEntry[] = qty > 0
            ? (isNew ? [{ itemId, quantity: qty }, ...others] : [...others, { itemId, quantity: qty }])
            : others
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

      craftNow: (entryId, deductions, totalCost, successRate) =>
        set((s) => {
          const queueEntry = s.queue.find((e) => e.id === entryId)
          if (!queueEntry) return s

          const invMap = new Map(s.inventory.map((e) => [e.itemId, e.quantity]))
          for (const { itemId, qty } of deductions) {
            invMap.set(itemId, Math.max(0, (invMap.get(itemId) ?? 0) - qty))
          }
          const inventory: InventoryEntry[] = s.inventory
            .map((e) => ({ ...e, quantity: invMap.get(e.itemId) ?? 0 }))
            .filter((e) => e.quantity > 0)

          const newQty = queueEntry.quantity - 1
          const queue: QueueEntry[] = newQty > 0
            ? s.queue.map((e) => e.id === entryId ? { ...e, quantity: newQty } : e)
            : s.queue.filter((e) => e.id !== entryId)

          const entry: CraftHistoryEntry = {
            id: uuid(),
            recipeId: queueEntry.recipeId,
            craftedAt: new Date().toISOString(),
            totalCost,
            outcome: successRate >= 100 ? 'success' : 'pending',
          }

          return {
            inventory,
            queue,
            craftHistory: [entry, ...s.craftHistory],
            lastModified: new Date().toISOString(),
          }
        }),

      setCraftOutcome: (historyId, outcome) =>
        set((s) => ({
          craftHistory: s.craftHistory.map((e) =>
            e.id === historyId ? { ...e, outcome } : e,
          ),
          lastModified: new Date().toISOString(),
        })),

      clearCraftHistory: () =>
        set({ craftHistory: [], lastModified: new Date().toISOString() }),

      importAppState: (state) =>
        set({
          inventory: state.inventory ?? [],
          queue: state.queue ?? [],
          prices: state.prices ?? [],
          craftHistory: state.craftHistory ?? [],
          lastModified: state.lastModified ?? new Date().toISOString(),
        }),

      exportAppState: () => {
        const { inventory, queue, prices, craftHistory, lastModified } = get()
        return { inventory, queue, prices, craftHistory, lastModified }
      },
    }),
    {
      name: 'l2rt_state',
      partialize: (s) => ({
        inventory: s.inventory,
        queue: s.queue,
        prices: s.prices,
        craftHistory: s.craftHistory,
        lastModified: s.lastModified,
      }),
    },
  ),
)
