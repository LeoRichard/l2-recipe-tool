import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { allItems, itemsMap } from '../../lib/dataLoader'
import { ItemIcon } from '../shared/ItemIcon'

const CATALOG = allItems
  .filter((item) => item.category === 'material')
  .sort((a, b) => a.name.localeCompare(b.name))

export function PricesPanel() {
  const { prices, setPrice } = useAppStore()
  const [search, setSearch] = useState('')

  const pricesMap = useMemo(
    () => new Map(prices.map((p) => [p.itemId, p.adenaPerUnit])),
    [prices],
  )

  const filtered = search
    ? CATALOG.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    : CATALOG

  return (
    <div>
      <div className="mb-8">
        <p className="text-ink-secondary text-sm font-body mb-1">Global Settings</p>
        <h1 className="font-display font-700 text-3xl text-ink">Market Prices</h1>
      </div>

      {CATALOG.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-white/[0.1] p-16 text-center"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <p className="font-display font-600 text-xl text-ink mb-2">No items loaded</p>
          <p className="text-ink-secondary text-base">Run the scraper to populate the item database first.</p>
        </div>
      ) : (
        <>
          <div className="relative mb-6">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-11 pr-4 py-3"
            />
          </div>

          <div className="card overflow-hidden" style={{ padding: 0 }}>
            <div
              className="grid items-center px-5 py-3"
              style={{
                gridTemplateColumns: '36px 1fr 160px',
                gap: '12px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(0,0,0,0.2)',
              }}
            >
              <span />
              <span className="text-xs font-body font-500 uppercase tracking-wider" style={{ color: '#4a5568' }}>
                Material
              </span>
              <span className="text-xs font-body font-500 uppercase tracking-wider text-right" style={{ color: '#4a5568' }}>
                Price / unit (₳)
              </span>
            </div>

            {filtered.length === 0 ? (
              <p className="text-ink-secondary text-base text-center py-8">No results for "{search}"</p>
            ) : (
              filtered.map((item, idx) => {
                const price = pricesMap.get(item.id) ?? 0
                return (
                  <div
                    key={item.id}
                    className="grid items-center px-5 py-3 transition-colors"
                    style={{
                      gridTemplateColumns: '36px 1fr 160px',
                      gap: '12px',
                      borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <ItemIcon iconName={item.iconName} name={item.name} size={28} />
                    <span className="font-body text-base text-ink truncate">{item.name}</span>
                    <div className="flex justify-end">
                      <input
                        type="number"
                        min={0}
                        defaultValue={price || ''}
                        key={`${item.id}-${price}`}
                        onBlur={(e) => setPrice(item.id, parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="input text-right"
                        style={{ width: '150px', padding: '6px 12px', fontSize: '14px' }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <p className="text-ink-muted text-sm font-body text-center mt-4">
            {filtered.length} material{filtered.length !== 1 ? 's' : ''}
            {search ? ` matching "${search}"` : ' in database'}
          </p>
        </>
      )}
    </div>
  )
}
