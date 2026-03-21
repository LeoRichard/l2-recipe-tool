import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { itemsMap, recipesMap } from '../../lib/dataLoader'
import { computePerRecipeBom } from '../../lib/bomEngine'
import { BomTreeNode } from '../bom/BomTreeNode'
import { ItemIcon } from '../shared/ItemIcon'
import type { RecipeBomResult, BomFlatRow, PriceEntry } from '../../types'

export function CraftList() {
  const { queue, inventory, prices, setActiveSection, removeFromQueue, setQueueQty, moveQueueItem } = useAppStore()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [tabMap, setTabMap] = useState<Record<string, 'flat' | 'tree'>>({})

  const results = useMemo(
    () => computePerRecipeBom(queue, inventory, prices, recipesMap, itemsMap),
    [queue, inventory, prices],
  )

  const pricesMap = useMemo(
    () => new Map(prices.map((p) => [p.itemId, p.adenaPerUnit])),
    [prices],
  )

  const toggleExpanded = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const getTab = (id: string): 'flat' | 'tree' => tabMap[id] ?? 'flat'
  const setTab = (id: string, tab: 'flat' | 'tree') =>
    setTabMap((prev) => ({ ...prev, [id]: tab }))

  if (queue.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <p className="text-ink-secondary text-sm font-body mb-1">Crafting</p>
          <h1 className="font-display font-700 text-3xl text-ink">My Crafts</h1>
        </div>
        <div
          className="rounded-xl border border-dashed border-white/[0.1] p-16 text-center"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(230,168,23,0.1)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e6a817" strokeWidth="1.5">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <p className="font-display font-600 text-xl text-ink mb-2">No crafts yet</p>
          <p className="text-ink-secondary text-base mb-6">Browse recipes and add them to start tracking materials</p>
          <button onClick={() => setActiveSection('recipes')} className="btn-amber">
            Browse Recipes
          </button>
        </div>
      </div>
    )
  }

  const hasPrices = prices.some((p) => p.adenaPerUnit > 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-ink-secondary text-sm font-body mb-1">Crafting</p>
          <h1 className="font-display font-700 text-3xl text-ink">My Crafts</h1>
        </div>
        <span className="text-ink-muted text-sm font-body">
          {queue.length} recipe{queue.length !== 1 ? 's' : ''} · inventory shared top-to-bottom
        </span>
      </div>

      {results.map((result, idx) => {
        const entry = queue.find((e) => e.id === result.entryId)
        if (!entry) return null
        const recipe = recipesMap.get(result.recipeId)
        if (!recipe) return null
        const outputItem = itemsMap.get(result.outputItemId)
        const isExpanded = expandedIds.has(result.entryId)

        const totalUnits   = result.flat.reduce((s, r) => s + r.totalNeeded, 0)
        const coveredUnits = result.flat.reduce((s, r) => s + Math.min(r.totalAvailable, r.totalNeeded), 0)
        const pct          = totalUnits > 0 ? Math.round((coveredUnits / totalUnits) * 100) : result.flat.length === 0 ? 100 : 0
        const missingCount = result.flat.filter((r) => r.totalShort > 0).length
        const progressColor = pct >= 100 ? '#34d399' : pct >= 60 ? '#e6a817' : pct >= 30 ? '#f97316' : '#fb7185'

        return (
          <div
            key={result.entryId}
            className="card overflow-hidden"
            style={{ padding: 0 }}
          >
            {/* Progress strip at top */}
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.04)' }}>
              <div
                className="h-full transition-all duration-700"
                style={{ width: `${pct}%`, background: progressColor, boxShadow: `0 0 8px ${progressColor}66` }}
              />
            </div>

            {/* Header row */}
            <div
              className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none"
              style={{ borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.07)' : 'none' }}
              onClick={() => toggleExpanded(result.entryId)}
              onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.015)' }}
              onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent' }}
            >
              {/* Reorder arrows */}
              <div className="flex flex-col gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  disabled={idx === 0}
                  onClick={() => moveQueueItem(result.entryId, 'up')}
                  className="p-0.5 rounded transition-colors"
                  style={{ color: idx === 0 ? '#2a3040' : '#4a5568' }}
                  onMouseEnter={(e) => { if (idx > 0) e.currentTarget.style.color = '#e8ecf0' }}
                  onMouseLeave={(e) => { if (idx > 0) e.currentTarget.style.color = '#4a5568' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="18,15 12,9 6,15"/>
                  </svg>
                </button>
                <button
                  disabled={idx === queue.length - 1}
                  onClick={() => moveQueueItem(result.entryId, 'down')}
                  className="p-0.5 rounded transition-colors"
                  style={{ color: idx === queue.length - 1 ? '#2a3040' : '#4a5568' }}
                  onMouseEnter={(e) => { if (idx < queue.length - 1) e.currentTarget.style.color = '#e8ecf0' }}
                  onMouseLeave={(e) => { if (idx < queue.length - 1) e.currentTarget.style.color = '#4a5568' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6,9 12,15 18,9"/>
                  </svg>
                </button>
              </div>

              {/* Output item icon */}
              <ItemIcon iconName={outputItem?.iconName ?? ''} name={outputItem?.name} size={34} />

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-body font-600 text-base text-ink truncate">
                  {outputItem?.name ?? recipe.name.replace(/^Recipe:\s*/i, '')}
                </p>
                <p className="text-ink-muted text-xs font-body truncate">{recipe.name}</p>
              </div>

              {/* Qty stepper */}
              <div
                className="flex items-center gap-1.5 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setQueueQty(entry.id, entry.quantity - 1)}
                  className="w-6 h-6 rounded flex items-center justify-center transition-colors text-sm font-body"
                  style={{ background: 'rgba(255,255,255,0.07)', color: '#8b95a3' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#e8ecf0')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#8b95a3')}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={entry.quantity}
                  onChange={(e) => setQueueQty(entry.id, parseInt(e.target.value) || 1)}
                  className="input text-center"
                  style={{ width: '48px', padding: '3px 4px', fontSize: '14px' }}
                />
                <button
                  onClick={() => setQueueQty(entry.id, entry.quantity + 1)}
                  className="w-6 h-6 rounded flex items-center justify-center transition-colors text-sm font-body"
                  style={{ background: 'rgba(255,255,255,0.07)', color: '#8b95a3' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#e8ecf0')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#8b95a3')}
                >
                  +
                </button>
              </div>

              {/* Progress pill */}
              <div
                className="flex items-center gap-1.5 rounded-full px-3 py-1 flex-shrink-0"
                style={{ background: `${progressColor}18`, minWidth: '64px', justifyContent: 'center' }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: progressColor }} />
                <span className="text-xs font-body font-600" style={{ color: progressColor }}>
                  {pct}%
                </span>
              </div>

              {/* Missing badge */}
              {missingCount > 0 && (
                <span className="text-xs font-body flex-shrink-0" style={{ color: '#fb7185' }}>
                  {missingCount} missing
                </span>
              )}
              {missingCount === 0 && result.flat.length > 0 && (
                <span className="text-xs font-body flex-shrink-0" style={{ color: '#34d399' }}>
                  Ready!
                </span>
              )}

              {/* Remove */}
              <button
                onClick={(e) => { e.stopPropagation(); removeFromQueue(result.entryId) }}
                className="flex-shrink-0 p-1.5 rounded transition-colors"
                style={{ color: '#4a5568' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fb7185')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#4a5568')}
                title="Remove"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>

              {/* Chevron */}
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="2"
                style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
              >
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </div>

            {/* Expanded BOM */}
            {isExpanded && (
              <div className="p-5" style={{ background: 'rgba(0,0,0,0.15)' }}>
                <RecipeBomView
                  result={result}
                  pricesMap={pricesMap}
                  prices={prices}
                  tab={getTab(result.entryId)}
                  setTab={(t) => setTab(result.entryId, t)}
                  onSetPrices={() => setActiveSection('prices')}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Global no-prices hint */}
      {!hasPrices && (
        <div
          className="rounded-lg px-4 py-3 flex items-center justify-between gap-3 mt-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-ink-muted text-sm font-body">
            No prices set — add them in <span className="text-ink-secondary">Market Prices</span> to see cost estimates.
          </p>
          <button
            onClick={() => setActiveSection('prices')}
            className="btn-amber text-sm flex-shrink-0"
            style={{ padding: '5px 12px' }}
          >
            Set Prices →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Per-recipe BOM view (two columns) ────────────────────────────────────────

function RecipeBomView({
  result, pricesMap, prices, tab, setTab, onSetPrices,
}: {
  result: RecipeBomResult
  pricesMap: Map<string, number>
  prices: PriceEntry[]
  tab: 'flat' | 'tree'
  setTab: (t: 'flat' | 'tree') => void
  onSetPrices: () => void
}) {
  const missing = result.flat.filter((r) => r.totalShort > 0)
  const covered = result.flat.filter((r) => r.totalShort === 0)

  const totalRecipeCost = result.flat.reduce((s, r) => s + r.totalNeeded * (pricesMap.get(r.itemId) ?? 0), 0)
  const investedValue   = result.flat.reduce((s, r) => s + r.totalAvailable * (pricesMap.get(r.itemId) ?? 0), 0)
  const toBuy           = result.grandTotalCost

  if (result.flat.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="font-display font-600 text-lg mb-1" style={{ color: '#34d399' }}>All materials covered!</p>
        <p className="text-ink-secondary text-sm font-body">Your inventory has everything needed for this craft.</p>
      </div>
    )
  }

  return (
    <div className="flex gap-5 items-start">
      {/* Left — summary cards */}
      <div className="flex flex-col gap-4" style={{ width: '300px', flexShrink: 0 }}>
        <CostSummary totalRecipeCost={totalRecipeCost} investedValue={investedValue} toBuy={toBuy} />
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={result.flat.length} label="Total"   color="rgba(255,255,255,0.06)" textColor="#8b95a3" />
          <StatCard value={missing.length}     label="Missing" color="rgba(231,76,60,0.1)"   textColor="#fb7185" />
          <StatCard value={covered.length}     label="Covered" color="rgba(16,185,129,0.1)"  textColor="#34d399" />
        </div>
        <CompletionBar flat={result.flat} />
      </div>

      {/* Right — table / tree */}
      <div className="flex flex-col gap-3 min-w-0 flex-1">
        <div className="flex gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <BomTab active={tab === 'flat'} onClick={() => setTab('flat')}>Raw Materials</BomTab>
          <BomTab active={tab === 'tree'} onClick={() => setTab('tree')}>Recipe Tree</BomTab>
        </div>

        {tab === 'flat' && <FlatView result={result} pricesMap={pricesMap} />}

        {tab === 'tree' && (
          <div className="card" style={{ padding: '8px' }}>
            {result.tree.map((node, i) => (
              <div
                key={i}
                className={i > 0 ? 'mt-2 pt-2' : ''}
                style={i > 0 ? { borderTop: '1px solid rgba(255,255,255,0.06)' } : {}}
              >
                <BomTreeNode node={node} depth={0} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Cost Summary ─────────────────────────────────────────────────────────────

function CostSummary({
  totalRecipeCost, investedValue, toBuy,
}: { totalRecipeCost: number; investedValue: number; toBuy: number }) {
  const hasAnyPrice = totalRecipeCost > 0 || investedValue > 0 || toBuy > 0

  if (!hasAnyPrice) {
    return (
      <div
        className="rounded-xl px-4 py-4 flex items-center gap-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-ink-muted text-sm font-body">
          Set prices in <span className="text-ink-secondary">Market Prices</span> to see cost breakdown.
        </p>
      </div>
    )
  }

  const investedPct = totalRecipeCost > 0 ? (investedValue / totalRecipeCost) * 100 : 0
  const toBuyPct    = totalRecipeCost > 0 ? (toBuy / totalRecipeCost) * 100 : 0

  return (
    <div
      className="rounded-xl px-5 py-5 flex flex-col gap-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div>
        <p className="text-xs font-body uppercase tracking-wider mb-1" style={{ color: '#4a5568' }}>
          Total Recipe Cost
        </p>
        <p className="font-display font-700 text-3xl" style={{ color: '#e6a817' }}>
          {totalRecipeCost.toLocaleString()}
          <span className="text-base font-500 ml-1" style={{ color: '#e6a81799' }}>₳</span>
        </p>
      </div>

      <div className="flex rounded-full overflow-hidden" style={{ height: '6px', gap: '2px' }}>
        {investedPct > 0 && (
          <div
            className="rounded-full transition-all duration-700"
            style={{ width: `${investedPct}%`, background: 'linear-gradient(90deg, #34d399, #10b981)', boxShadow: '0 0 8px #34d39966' }}
          />
        )}
        {toBuyPct > 0 && (
          <div
            className="rounded-full transition-all duration-700"
            style={{ width: `${toBuyPct}%`, background: 'linear-gradient(90deg, #f87171, #fb7185)', boxShadow: '0 0 8px #fb718566' }}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: '#34d399' }} />
            <span className="text-sm font-body text-ink-secondary">Invested</span>
          </div>
          <span className="text-sm font-body font-500" style={{ color: investedValue > 0 ? '#34d399' : '#4a5568' }}>
            {investedValue > 0 ? investedValue.toLocaleString() + ' ₳' : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: '#fb7185' }} />
            <span className="text-sm font-body text-ink-secondary">Still to Buy</span>
          </div>
          <span className="text-sm font-body font-600" style={{ color: toBuy > 0 ? '#fb7185' : '#4a5568' }}>
            {toBuy > 0 ? toBuy.toLocaleString() + ' ₳' : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Completion Bar ────────────────────────────────────────────────────────────

function CompletionBar({ flat }: { flat: RecipeBomResult['flat'] }) {
  if (flat.length === 0) return null

  const totalUnits   = flat.reduce((s, r) => s + r.totalNeeded, 0)
  const coveredUnits = flat.reduce((s, r) => s + Math.min(r.totalAvailable, r.totalNeeded), 0)
  const pct          = totalUnits > 0 ? Math.round((coveredUnits / totalUnits) * 100) : 0

  const color =
    pct >= 100 ? '#34d399' :
    pct >= 60  ? '#e6a817' :
    pct >= 30  ? '#f97316' : '#fb7185'

  return (
    <div
      className="rounded-xl px-5 py-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-body font-500 text-ink-secondary">Preparation Progress</span>
        <span className="font-display font-700 text-lg" style={{ color }}>{pct}%</span>
      </div>
      <div
        className="relative w-full rounded-full overflow-hidden"
        style={{ height: '8px', background: 'rgba(255,255,255,0.07)' }}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: pct >= 100
              ? 'linear-gradient(90deg, #34d399, #10b981)'
              : `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: `0 0 10px ${color}66`,
          }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs font-body text-ink-muted">
          {coveredUnits.toLocaleString()} / {totalUnits.toLocaleString()} units gathered
        </span>
        {pct >= 100
          ? <span className="text-xs font-body font-500" style={{ color: '#34d399' }}>Ready to craft!</span>
          : <span className="text-xs font-body text-ink-muted">{(totalUnits - coveredUnits).toLocaleString()} remaining</span>
        }
      </div>
    </div>
  )
}

// ── Flat materials table ──────────────────────────────────────────────────────

function FlatView({
  result, pricesMap,
}: { result: RecipeBomResult; pricesMap: Map<string, number> }) {
  const missing = result.flat.filter((r) => r.totalShort > 0)
  const covered = result.flat.filter((r) => r.totalShort === 0)
  const COLS = '32px 1fr 72px 72px 72px 100px'

  const ColHeader = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
    <span className={`text-xs font-body font-500 uppercase tracking-wider ${right ? 'text-right' : ''}`} style={{ color: '#4a5568' }}>
      {children}
    </span>
  )

  const TableHeader = () => (
    <div
      className="grid items-center px-4 py-2.5"
      style={{ gridTemplateColumns: COLS, gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}
    >
      <span />
      <ColHeader>Item</ColHeader>
      <ColHeader right>Total</ColHeader>
      <ColHeader right>Have</ColHeader>
      <ColHeader right>Short</ColHeader>
      <ColHeader right>Cost</ColHeader>
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      {missing.length > 0 && (
        <div>
          <SectionLabel color="#fb7185" text={`Missing — ${missing.length} item${missing.length !== 1 ? 's' : ''}`} />
          <div className="card overflow-hidden" style={{ padding: 0 }}>
            <TableHeader />
            {missing.map((row, idx) => {
              const item = itemsMap.get(row.itemId)
              const cost = row.totalShort * (pricesMap.get(row.itemId) ?? 0)
              return (
                <div
                  key={row.itemId}
                  className="grid items-center px-4 py-3 transition-colors"
                  style={{
                    gridTemplateColumns: COLS, gap: '10px',
                    borderBottom: idx < missing.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    borderLeft: '2px solid rgba(231,76,60,0.5)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <ItemIcon iconName={item?.iconName ?? ''} name={item?.name} size={28} />
                  <span className="font-body text-sm text-ink truncate">{item?.name ?? row.itemId}</span>
                  <span className="font-body text-sm text-right text-ink-secondary">{row.totalNeeded.toLocaleString()}</span>
                  <span className="font-body text-sm text-right" style={{ color: row.totalAvailable > 0 ? '#34d399' : '#4a5568' }}>
                    {row.totalAvailable > 0 ? row.totalAvailable.toLocaleString() : '—'}
                  </span>
                  <span className="font-body font-600 text-sm text-right" style={{ color: '#fb7185' }}>
                    {row.totalShort.toLocaleString()}
                  </span>
                  <span className="font-body text-sm font-500 text-right" style={{ color: cost > 0 ? '#e6a817' : '#4a5568' }}>
                    {cost > 0 ? cost.toLocaleString() + ' ₳' : '—'}
                  </span>
                </div>
              )
            })}
            {result.grandTotalCost > 0 && (
              <div
                className="flex justify-between items-center px-4 py-3"
                style={{ borderTop: '1px solid rgba(230,168,23,0.2)', background: 'rgba(230,168,23,0.05)' }}
              >
                <span className="text-ink-secondary text-xs font-body">Subtotal to buy</span>
                <span className="font-display font-700 text-lg" style={{ color: '#e6a817' }}>
                  {result.grandTotalCost.toLocaleString()} ₳
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {covered.length > 0 && (
        <div>
          <SectionLabel color="#34d399" text={`Covered — ${covered.length} item${covered.length !== 1 ? 's' : ''}`} />
          <div className="card overflow-hidden" style={{ padding: 0, opacity: 0.7 }}>
            <TableHeader />
            {covered.map((row, idx) => {
              const item = itemsMap.get(row.itemId)
              return (
                <div
                  key={row.itemId}
                  className="grid items-center px-4 py-2.5"
                  style={{
                    gridTemplateColumns: COLS, gap: '10px',
                    borderBottom: idx < covered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    borderLeft: '2px solid rgba(16,185,129,0.4)',
                  }}
                >
                  <ItemIcon iconName={item?.iconName ?? ''} name={item?.name} size={26} />
                  <span className="font-body text-sm text-ink truncate">{item?.name ?? row.itemId}</span>
                  <span className="font-body text-sm text-right text-ink-secondary">{row.totalNeeded.toLocaleString()}</span>
                  <span className="font-body text-sm text-right" style={{ color: '#34d399' }}>{row.totalAvailable.toLocaleString()}</span>
                  <span className="font-body text-sm text-right font-500" style={{ color: '#34d399' }}>✓</span>
                  <span />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function SectionLabel({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      <p className="text-sm font-body font-500 text-ink-secondary">{text}</p>
    </div>
  )
}

function StatCard({ value, label, color, textColor }: { value: number; label: string; color: string; textColor: string }) {
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: color, border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <p className="font-display font-700 text-xl" style={{ color: textColor }}>{value}</p>
      <p className="text-ink-secondary text-xs mt-0.5">{label}</p>
    </div>
  )
}

function BomTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2.5 text-sm font-body font-500 transition-all -mb-px"
      style={{
        borderBottom: active ? '2px solid #e6a817' : '2px solid transparent',
        color: active ? '#e6a817' : '#8b95a3',
      }}
    >
      {children}
    </button>
  )
}
