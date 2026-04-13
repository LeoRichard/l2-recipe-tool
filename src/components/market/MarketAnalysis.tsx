import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { itemsMap, recipesMap } from '../../lib/dataLoader'
import { ItemIcon } from '../shared/ItemIcon'
import { AdenaIcon } from '../shared/AdenaIcon'
import type { Recipe } from '../../types'

type SortKey = 'name' | 'matCost' | 'totalCost' | 'effectiveCost' | 'successRate'
type SortDir = 'asc' | 'desc'
type CategoryFilter = 'all' | 'weapon' | 'armor' | 'accessory' | 'other'

function calcCosts(recipe: Recipe, pricesMap: Map<string, number>) {
  const matCost = recipe.materials.reduce(
    (sum, mat) => sum + mat.quantity * (pricesMap.get(mat.itemId) ?? 0),
    0,
  )
  const totalPerAttempt = matCost + (recipe.adenaFee ?? 0)
  const effectiveCost =
    recipe.successRate > 0 && recipe.successRate < 100
      ? Math.ceil(totalPerAttempt * (100 / recipe.successRate))
      : totalPerAttempt
  return { matCost, totalPerAttempt, effectiveCost }
}

const CATEGORY_LABEL: Record<string, string> = {
  weapon: 'Weapon',
  armor: 'Armor',
  accessory: 'Accessory',
  other: 'Other',
}

const CATEGORY_COLOR: Record<string, { bg: string; text: string }> = {
  weapon:    { bg: 'rgba(239,68,68,0.15)',   text: '#f87171' },
  armor:     { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa' },
  accessory: { bg: 'rgba(168,85,247,0.15)',  text: '#c084fc' },
  other:     { bg: 'rgba(255,255,255,0.06)', text: '#8b95a3' },
}

export function MarketAnalysis() {
  const { prices, addToQueue } = useAppStore()
  const navigate = useNavigate()

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('effectiveCost')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
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
        const costs = calcCosts(recipe, pricesMap)
        return { recipe, outputItem, ...costs }
      })
      .sort((a, b) => {
        let cmp = 0
        switch (sortKey) {
          case 'name':
            cmp = (a.outputItem?.name ?? a.recipe.name).localeCompare(b.outputItem?.name ?? b.recipe.name)
            break
          case 'matCost':        cmp = a.matCost - b.matCost; break
          case 'totalCost':      cmp = a.totalPerAttempt - b.totalPerAttempt; break
          case 'effectiveCost':  cmp = a.effectiveCost - b.effectiveCost; break
          case 'successRate':    cmp = a.recipe.successRate - b.recipe.successRate; break
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

  const totalWithCost = rows.filter((r) => r.effectiveCost > 0).length
  const cheapest = rows.filter((r) => r.effectiveCost > 0).sort((a, b) => a.effectiveCost - b.effectiveCost)[0]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-ink-secondary text-sm font-body mb-1">Analysis</p>
          <h1 className="font-display font-700 text-3xl text-ink">Craft Costs</h1>
        </div>
        <div className="text-right">
          <p className="text-ink-muted text-xs font-body">
            {rows.length} recipe{rows.length !== 1 ? 's' : ''}
            {totalWithCost > 0 && ` · ${totalWithCost} priced`}
          </p>
          {cheapest && (
            <p className="text-ink-secondary text-xs font-body mt-0.5">
              Cheapest: <span style={{ color: '#e6a817' }}>{cheapest.outputItem?.name ?? cheapest.recipe.name}</span>
            </p>
          )}
        </div>
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
              Add prices in Market Prices to see real cost estimates and compare profitability.
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
        {/* Search */}
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

        {/* Category pills */}
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
      <div className="card overflow-hidden" style={{ padding: 0 }}>
        {/* Column headers */}
        <div
          className="grid items-center px-4 py-3"
          style={{
            gridTemplateColumns: '32px 1fr 90px 80px 110px 110px 120px 44px',
            gap: '10px',
            background: 'rgba(0,0,0,0.25)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <span />
          <SortHeader label="Item" sortKey="name" current={sortKey} dir={sortDir} onSort={toggleSort} />
          <span className="text-xs font-body font-500 uppercase tracking-wider" style={{ color: '#4a5568' }}>Category</span>
          <SortHeader label="Success" sortKey="successRate" current={sortKey} dir={sortDir} onSort={toggleSort} right />
          <SortHeader label="Mat Cost" sortKey="matCost" current={sortKey} dir={sortDir} onSort={toggleSort} right />
          <SortHeader label="Total / Run" sortKey="totalCost" current={sortKey} dir={sortDir} onSort={toggleSort} right />
          <SortHeader label="Effective Cost" sortKey="effectiveCost" current={sortKey} dir={sortDir} onSort={toggleSort} right />
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
            const hasEffective = row.effectiveCost > 0
            const isAdjusted = row.recipe.successRate < 100 && row.recipe.successRate > 0

            return (
              <div
                key={row.recipe.id}
                className="grid items-center px-4 py-3 transition-colors"
                style={{
                  gridTemplateColumns: '32px 1fr 90px 80px 110px 110px 120px 44px',
                  gap: '10px',
                  borderBottom: idx < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Icon */}
                <ItemIcon
                  iconName={row.outputItem?.iconName ?? ''}
                  name={row.outputItem?.name}
                  size={28}
                />

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
                    color: row.recipe.category === 'other'
                      ? '#4a5568'
                      : row.recipe.successRate >= 100
                      ? '#34d399'
                      : row.recipe.successRate >= 60
                      ? '#e6a817'
                      : '#fb7185',
                  }}
                >
                  {row.recipe.category === 'other' ? '—' : `${row.recipe.successRate}%`}
                </span>

                {/* Mat cost */}
                <span
                  className="font-body text-sm text-right"
                  style={{ color: row.matCost > 0 ? '#8b95a3' : '#2a3040' }}
                >
                  {row.matCost > 0 ? (
                    <span className="flex items-center justify-end gap-1">
                      {row.matCost.toLocaleString()} <AdenaIcon size={11} />
                    </span>
                  ) : '—'}
                </span>

                {/* Total per attempt */}
                <span
                  className="font-body text-sm text-right"
                  style={{ color: row.totalPerAttempt > 0 ? '#8b95a3' : '#2a3040' }}
                >
                  {row.totalPerAttempt > 0 ? (
                    <span className="flex items-center justify-end gap-1">
                      {row.totalPerAttempt.toLocaleString()} <AdenaIcon size={11} />
                    </span>
                  ) : '—'}
                </span>

                {/* Effective cost */}
                <div className="flex items-center justify-end gap-1.5">
                  {hasEffective ? (
                    <>
                      <span className="font-body text-sm font-600 flex items-center gap-1" style={{ color: '#e6a817' }}>
                        {row.effectiveCost.toLocaleString()} <AdenaIcon size={11} />
                      </span>
                      {isAdjusted && (
                        <span
                          className="text-2xs font-body rounded px-1"
                          style={{ background: 'rgba(251,113,133,0.12)', color: '#fb7185' }}
                          title={`Adjusted for ${row.recipe.successRate}% success rate`}
                        >
                          ×{(100 / row.recipe.successRate).toFixed(1)}
                        </span>
                      )}
                    </>
                  ) : (
                    <span style={{ color: '#2a3040' }}>—</span>
                  )}
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

      {/* Legend */}
      <p className="text-ink-muted text-xs font-body">
        <span style={{ color: '#8b95a3' }}>Effective Cost</span> — total per-attempt cost adjusted for success rate.
        For example, a recipe with 70% success costs ~1.43× per successful craft on average.
        <span style={{ color: '#fb7185' }}> ×N</span> badge shows the multiplier.
      </p>
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
