import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { allItems, itemsMap } from '../../lib/dataLoader'
import { ItemIcon } from '../shared/ItemIcon'
import { Modal } from '../shared/Modal'

export function InventoryPanel() {
  const { inventory, setInventory, removeInventory } = useAppStore()
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [modalSearch, setModalSearch] = useState('')

  const inventoryItems = inventory
    .filter((e) => {
      const item = itemsMap.get(e.itemId)
      return item?.name.toLowerCase().includes(search.toLowerCase())
    })
    .map((e) => ({ entry: e, item: itemsMap.get(e.itemId) }))
    .filter((x) => x.item)

  const modalItems = allItems
    .filter((item) => item.name.toLowerCase().includes(modalSearch.toLowerCase()))
    .filter((item) => item.category !== 'recipe_scroll')
    .slice(0, 60)

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-ink-secondary text-sm font-body mb-1">Stock</p>
          <h1 className="font-display font-700 text-3xl text-ink">Inventory</h1>
        </div>
        <div className="flex items-center gap-3">
          {inventory.length > 0 && (
            <span
              className="text-sm font-body rounded-full px-3 py-1"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#8b95a3' }}
            >
              {inventory.length} item{inventory.length !== 1 ? 's' : ''}
            </span>
          )}
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Add Item
          </button>
        </div>
      </div>

      {inventory.length > 0 && (
        <div className="relative mb-5">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Filter inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full pl-11 pr-4 py-3"
          />
        </div>
      )}

      {inventory.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-white/[0.1] p-16 text-center"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(230,168,23,0.1)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e6a817" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <p className="font-display font-600 text-xl text-ink mb-2">Inventory empty</p>
          <p className="text-ink-secondary text-base mb-6">Add the materials you currently have stocked</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Add Item
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden" style={{ padding: 0 }}>
          {inventoryItems.map(({ entry, item }, idx) => (
            <div
              key={entry.itemId}
              className="flex items-center gap-4 px-5 py-3.5 transition-colors"
              style={{
                borderBottom: idx < inventoryItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <ItemIcon iconName={item!.iconName} name={item!.name} size={32} />
              <span className="flex-1 font-body text-base text-ink truncate">{item!.name}</span>

              {/* Qty stepper */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInventory(entry.itemId, Math.max(0, entry.quantity - 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-secondary hover:text-ink border border-white/[0.1] transition-all text-base leading-none"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  −
                </button>
                <input
                  type="number"
                  value={entry.quantity}
                  min={0}
                  onChange={(e) => {
                    const v = parseInt(e.target.value)
                    if (!isNaN(v)) setInventory(entry.itemId, v)
                  }}
                  className="input text-center font-500"
                  style={{ width: '72px', padding: '5px 8px' }}
                />
                <button
                  onClick={() => setInventory(entry.itemId, entry.quantity + 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-secondary hover:text-ink border border-white/[0.1] transition-all text-base leading-none"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  +
                </button>
              </div>

              <button
                onClick={() => removeInventory(entry.itemId)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-rose-text hover:bg-rose-dim transition-all ml-1"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Add Item to Inventory" onClose={() => { setShowModal(false); setModalSearch('') }}>
          <div className="p-5">
            <input
              type="text"
              placeholder="Search items..."
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              autoFocus
              className="input w-full px-4 py-3 mb-4"
            />
            <div className="flex flex-col gap-0.5">
              {modalItems.map((item) => {
                const existing = inventory.find((e) => e.itemId === item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (!existing) setInventory(item.id, 1)
                      setShowModal(false)
                      setModalSearch('')
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <ItemIcon iconName={item.iconName} name={item.name} size={28} />
                    <span className="flex-1 font-body text-base text-ink truncate">{item.name}</span>
                    {existing && (
                      <span className="text-sm font-body" style={{ color: '#e6a817' }}>
                        ×{existing.quantity}
                      </span>
                    )}
                  </button>
                )
              })}
              {modalItems.length === 0 && (
                <p className="text-ink-secondary text-base text-center py-6">No items found</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
