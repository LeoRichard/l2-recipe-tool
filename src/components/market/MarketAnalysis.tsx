import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { itemsMap, recipesMap, recipeByOutputId } from '../../lib/dataLoader'
import { ItemIcon } from '../shared/ItemIcon'
import { AdenaIcon } from '../shared/AdenaIcon'

type SortKey = 'name' | 'totalCost' | 'successRate'
type SortDir = 'asc' | 'desc'
type CategoryFilter = 'all' | 'weapon' | 'armor' | 'accessory' | 'other'

const CATEGORY_LABEL: Record<string, string> = {
  weapon: 'Weapon', armor: 'Armor', accessory: 'Accessory', other: 'Other',
}

const CATEGORY_COLOR: Record<string, { bg: string; text: string }> = {
  weapon:    { bg: 'rgba(239,68,68,0.15)',   text: '#f87171' },
  armor:     { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa' },
  accessory: { bg: 'rgba(168,85,247,0.15)',  text: '#c084fc' },
  other:     { bg: 'rgba(255,255,255,0.06)', text: '#8b95a3' },
}

/**
 * Recursively calculate the cost of `quantity` units of `itemId`.
 * - If the item has a market price → use it directly.
 * - If not, but it has a craftable recipe → recurse into its materials.
 * - If neither → add to missingNames and return 0.
 * `visited` guards against circular dependencies.
 */
function resolveItemCost(
  itemId: string,
  quantity: number,
  pricesMap: Map<string, number>,
  missingNames: Set<string>,
  visited: Set<string> = new Set(),
): number {
  const price = pricesMap.get(itemId)
  if (price) return quantity * price

  // No market price — check if it's craftable
  const subRecipe = recipeByOutputId.get(itemId)
  if (subRecipe && !visited.has(itemId)) {
    const next = new Set(visited).add(itemId)
    let subCost = subRecipe.adenaFee ?? 0
    for (const mat of subRecipe.materials) {
      subCost += resolveItemCost(mat.itemId, mat.quantity, pricesMap, missingNames, next)
    }
    // subCost is per outputQuantity units
    const runs = Math.ceil(quantity / (subRecipe.outputQuantity ?? 1))
    return subCost * runs
  }

  // Truly unknown price
  const name = itemsMap.get(itemId)?.name ?? itemId
  missingNames.add(name)
  return 0
}

export function MarketAnalysis() {
  const { prices, addToQueue } = useAppStore()
  const navigate = useNavigate()

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('totalCost')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [search, setSearch] = useState('')

  const pricesMap = useMemo(
    () => new Map(prices.map((p) => [p.itemId, p.adenaPerUnit])),
    [prices],
  )

  const hasPrices = prices.some((p) => p.adenaPerUnit > 0)

  const rows = useMemo(() => {
    return [...recipesMap.values()]
      .filter((r) => {
        if (categoryFilter !== 'all' && (r.category ?? 'other') !== categoryFilter) return false
        if (search) {
          const q = search.toLowerCase()
          const outputItem = itemsMap.get(r.outputItemId)
          const name = (outputItem?.name ?? r.name).toLowerCase()
          if (!name.includes(q) && !r.name.toLowerCase().includes(q)) return false
        }
        return true
      })
      .map((recipe) => {
        const outputItem = itemsMap.get(recipe.outputItemId)
        const missingSet = new Set<string>()

        let totalCost = recipe.adenaFee ?? 0
        for (const mat of recipe.materials) {
          totalCost += resolveItemCost(mat.itemId, mat.quantity, pricesMap, missingSet)
        }

        return { recipe, outputItem, totalCost, missingPriceMats: [...missingSet] }
      })
      .sort((a, b) => {
        let cmp = 0
        if (sortKey === 'name') {
          cmp = (a.outputItem?.name ?? a.recipe.name).localeCompare(b.outputItem?.name ?? b.recipe.name)
        } else if (sortKey === 'totalCost') {
          cmp = a.totalCost - b.totalCost
        } else if (sortKey === 'successRate') {
          cmp = a.recipe.successRate - b.recipe.successRate
        }
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [pricesMap, categoryFilter, sortKey, sortDir, search])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-ink-secondary text-sm font-body mb-1">Analysis</p>
          <h1 className="font-display font-700 text-3xl text-ink">Craft Costs</h1>
        </div>
        <span className="text-ink-muted text-sm font-body">
          {rows.length} recipe{rows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* No prices banner */}
      {!hasPrices && (
        <div
          className="rounded-xl px-5 py-4 flex items-center justify-between gap-4"
          style={{ background: 'rgba(230,168,23,0.06)', border: '1px solid rgba(230,168,23,0.2)' }}
        >
          <div>
            <p className="font-body font-600 text-sm text-ink mb-0.5">No market prices set</p>
            <p className="text-ink-muted text-xs font-body">
              Add prices in Market Prices to see real cost estimates.
            </p>
          </div>
          <button
            onClick={() => navigate('/prices')}
            className="btn-amber flex-shrink-0"
            style={{ padding: '6px 14px', fontSize: '13px' }}
          >
            Set Prices →
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1" style={{ minWidth: '180px', maxWidth: '280px' }}>
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes…"
            className="input w-full"
            style={{ paddingLeft: '32px', paddingRight: '12px', height: '36px', fontSize: '13px' }}
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'weapon', 'armor', 'accessory', 'other'] as CategoryFilter[]).map((cat) => {
            const active = categoryFilter === cat
            const color = cat !== 'all' ? CATEGORY_COLOR[cat] : null
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className="px-3 py-1.5 rounded-full text-xs font-body font-500 transition-all"
                style={
                  active && color
                    ? { background: color.bg, color: color.text, border: `1px solid ${color.text}40` }
                    : active
                    ? { background: 'rgba(230,168,23,0.15)', color: '#e6a817', border: '1px solid rgba(230,168,23,0.3)' }
                    : { background: 'rgba(255,255,255,0.05)', color: '#8b95a3', border: '1px solid transparent' }
                }
              >
                {cat === 'all' ? 'All' : CATEGORY_LABEL[cat]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'visible' }}>
        {/* Column headers */}
        <div
          className="grid items-center px-4 py-3"
          style={{
            gridTemplateColumns: '32px 1fr 96px 80px 160px 44px',
            gap: '12px',
            background: 'rgba(0,0,0,0.25)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px 12px 0 0',
          }}
        >
          <span />
          <SortHeader label="Item"     sortKey="name"        current={sortKey} dir={sortDir} onSort={toggleSort} />
          <span className="text-xs font-body font-500 uppercase tracking-wider" style={{ color: '#4a5568' }}>Category</span>
          <SortHeader label="Success"  sortKey="successRate" current={sortKey} dir={sortDir} onSort={toggleSort} right />
          <SortHeader label="Total Cost" sortKey="totalCost" current={sortKey} dir={sortDir} onSort={toggleSort} right />
          <span />
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-ink-muted text-sm font-body">No recipes match your filters.</p>
          </div>
        ) : (
          rows.map((row, idx) => {
            const cat = row.recipe.category ?? 'other'
            const catColor = CATEGORY_COLOR[cat] ?? CATEGORY_COLOR.other
            const displayName = row.outputItem?.name ?? row.recipe.name.replace(/^Recipe:\s*/i, '')
            const hasMissing = row.missingPriceMats.length > 0
            const isComplete = !hasMissing && row.totalCost > 0

            return (
              <div
                key={row.recipe.id}
                className="grid items-center px-4 py-3 transition-colors"
                style={{
                  gridTemplateColumns: '32px 1fr 96px 80px 160px 44px',
                  gap: '12px',
                  borderBottom: idx < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  borderRadius: idx === rows.length - 1 ? '0 0 12px 12px' : undefined,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Icon */}
                <ItemIcon iconName={row.outputItem?.iconName ?? ''} name={row.outputItem?.name} size={28} />

                {/* Name */}
                <div className="min-w-0">
                  <p className="font-body text-sm text-ink truncate">{displayName}</p>
                  <p className="font-body text-2xs text-ink-muted truncate">{row.recipe.name}</p>
                </div>

                {/* Category */}
                <span
                  className="text-2xs font-body font-500 px-2 py-1 rounded-full text-center"
                  style={{ background: catColor.bg, color: catColor.text }}
                >
                  {CATEGORY_LABEL[cat] ?? cat}
                </span>

                {/* Success rate */}
                <span
                  className="font-body text-sm text-right"
                  style={{
                    color:
                      row.recipe.category === 'other' ? '#4a5568' :
                      row.recipe.successRate >= 100 ? '#34d399' :
                      row.recipe.successRate >= 60  ? '#e6a817' : '#fb7185',
                  }}
                >
                  {row.recipe.category === 'other' ? '—' : `${row.recipe.successRate}%`}
                </span>

                {/* Total cost + alert */}
                <div className="flex items-center justify-end gap-2">
                  {hasMissing && (
                    <div className="relative group flex-shrink-0">
                      <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="#e6a817" strokeWidth="2" strokeLinecap="round"
                        style={{ opacity: 0.6 }}
                      >
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      {/* Tooltip */}
                      <div
                        className="absolute right-0 bottom-full mb-2 z-20 pointer-events-none"
                        style={{
                          opacity: 0,
                          transition: 'opacity 0.15s',
                        }}
                        ref={(el) => {
                          if (!el) return
                          const parent = el.parentElement!
                          parent.onmouseenter = () => { el.style.opacity = '1' }
                          parent.onmouseleave = () => { el.style.opacity = '0' }
                        }}
                      >
                        <div
                          className="rounded-lg px-3 py-2 text-xs font-body"
                          style={{
                            background: '#1a2030',
                            border: '1px solid rgba(255,255,255,0.12)',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                          }}
                        >
                          <p className="font-600 mb-1" style={{ color: '#e6a817' }}>Missing prices:</p>
                          {row.missingPriceMats.map((name) => (
                            <p key={name} style={{ color: '#8b95a3' }}>· {name}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <span
                    className="font-body text-sm font-600 flex items-center gap-1"
                    style={{ color: isComplete ? '#e6a817' : hasMissing && row.totalCost > 0 ? '#8b95a3' : '#2a3040' }}
                  >
                    {row.totalCost > 0 ? (
                      <>{row.totalCost.toLocaleString()} <AdenaIcon size={11} /></>
                    ) : '—'}
                  </span>
                </div>

                {/* Add to crafts */}
                <button
                  onClick={() => { addToQueue(row.recipe.id); navigate('/crafts') }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
                  style={{ background: 'rgba(230,168,23,0.08)', color: '#e6a817' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(230,168,23,0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(230,168,23,0.08)')}
                  title="Add to My Crafts"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function SortHeader({
  label, sortKey: key, current, dir, onSort, right,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onSort: (k: SortKey) => void
  right?: boolean
}) {
  const active = current === key
  return (
    <button
      onClick={() => onSort(key)}
      className={`flex items-center gap-1 text-xs font-body font-500 uppercase tracking-wider transition-colors ${right ? 'justify-end w-full' : ''}`}
      style={{ color: active ? '#e6a817' : '#4a5568' }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = '#8b95a3' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = '#4a5568' }}
    >
      {label}
      {active && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          {dir === 'asc'
            ? <polyline points="18,15 12,9 6,15"/>
            : <polyline points="6,9 12,15 18,9"/>}
        </svg>
      )}
    </button>
  )
}
