import { useMemo, useState } from 'react'
import type { BomResult, PriceEntry } from '../../types'
import { useAppStore } from '../../store/appStore'
import { itemsMap, recipesMap } from '../../lib/dataLoader'
import { computeBom } from '../../lib/bomEngine'
import { BomTreeNode } from './BomTreeNode'
import { ItemIcon } from '../shared/ItemIcon'

export function BomPanel() {
  const { queue, inventory, prices, setActiveSection } = useAppStore()
  const [tab, setTab] = useState<'flat' | 'tree'>('flat')

  const result = useMemo(
    () => computeBom(queue, inventory, prices, recipesMap, itemsMap),
    [queue, inventory, prices],
  )

  if (queue.length === 0) {
    return (
      <div>
        <PageHeader title="Materials" subtitle="Bill of Materials" />
        <div
          className="rounded-xl border border-dashed border-white/[0.1] p-16 text-center"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(230,168,23,0.1)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e6a817" strokeWidth="1.5">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <p className="font-display font-600 text-xl text-ink mb-2">No active queue</p>
          <p className="text-ink-secondary text-base mb-6">Add recipes to the queue to see material requirements</p>
          <button onClick={() => setActiveSection('recipes')} className="btn-amber">Browse Recipes</button>
        </div>
      </div>
    )
  }

  const missing = result.flat.filter((r) => r.totalShort > 0)
  const covered = result.flat.filter((r) => r.totalShort === 0)

  // Adena totals
  const pricesMap = new Map(prices.map((p) => [p.itemId, p.adenaPerUnit]))
  const totalRecipeCost  = result.flat.reduce((s, r) => s + r.totalNeeded  * (pricesMap.get(r.itemId) ?? 0), 0)
  const investedValue    = result.flat.reduce((s, r) => s + r.totalAvailable * (pricesMap.get(r.itemId) ?? 0), 0)
  const toBuy            = result.grandTotalCost // sum of short * price

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-ink-secondary text-sm font-body mb-1">Bill of Materials</p>
          <h1 className="font-display font-700 text-3xl text-ink">Materials</h1>
        </div>
      </div>

      {/* ── Cost Summary ─────────────────────────────────────────────────── */}
      <CostSummary
        totalRecipeCost={totalRecipeCost}
        investedValue={investedValue}
        toBuy={toBuy}
      />

      {/* ── Item counts ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard value={result.flat.length} label="Total Materials"  color="rgba(255,255,255,0.06)" textColor="#8b95a3" />
        <StatCard value={missing.length}     label="Still Needed"     color="rgba(231,76,60,0.1)"   textColor="#fb7185" />
        <StatCard value={covered.length}     label="Covered"          color="rgba(16,185,129,0.1)"  textColor="#34d399" />
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Tab active={tab === 'flat'} onClick={() => setTab('flat')}>Raw Materials</Tab>
        <Tab active={tab === 'tree'} onClick={() => setTab('tree')}>Recipe Tree</Tab>
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

      {/* Prices live in the Market Prices section (nav) */}
      {result.flat.length > 0 && !prices.some((p) => p.adenaPerUnit > 0) && (
        <div
          className="rounded-lg px-4 py-3 flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-ink-muted text-sm font-body">
            No prices set yet — cost columns will show — until you add them.
          </p>
          <button
            onClick={() => setActiveSection('prices')}
            className="btn-amber text-sm flex-shrink-0 ml-4"
            style={{ padding: '5px 12px' }}
          >
            Set Prices →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Cost Summary ────────────────────────────────────────────────────────────

function CostSummary({
  totalRecipeCost, investedValue, toBuy,
}: { totalRecipeCost: number; investedValue: number; toBuy: number }) {
  const hasAnyPrice = totalRecipeCost > 0 || investedValue > 0 || toBuy > 0

  if (!hasAnyPrice) {
    return (
      <div
        className="rounded-xl px-5 py-4 flex items-center gap-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-ink-muted text-sm font-body">
          Set prices in the <span className="text-ink-secondary">Market Prices</span> section below to see cost estimates.
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(230,168,23,0.2)', background: 'rgba(230,168,23,0.04)' }}
    >
      <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'rgba(230,168,23,0.15)' }}>
        <CostCard
          label="Total Recipe Cost"
          value={totalRecipeCost}
          sublabel="All materials at market price"
          accent="#e6a817"
        />
        <CostCard
          label="Already Invested"
          value={investedValue}
          sublabel="Value of stock on hand"
          accent="#34d399"
        />
        <CostCard
          label="Still to Buy"
          value={toBuy}
          sublabel="Adena needed to complete"
          accent="#fb7185"
          highlight
        />
      </div>
    </div>
  )
}

function CostCard({
  label, value, sublabel, accent, highlight = false,
}: { label: string; value: number; sublabel: string; accent: string; highlight?: boolean }) {
  return (
    <div
      className="px-6 py-5"
      style={highlight && value > 0 ? { background: 'rgba(251,113,133,0.05)' } : {}}
    >
      <p className="text-ink-secondary text-xs font-body uppercase tracking-wider mb-2">{label}</p>
      <p
        className="font-display font-700 text-2xl mb-1"
        style={{ color: value > 0 ? accent : '#4a5568' }}
      >
        {value > 0 ? value.toLocaleString() + ' ₳' : '—'}
      </p>
      <p className="text-ink-muted text-xs font-body">{sublabel}</p>
    </div>
  )
}

// ── Materials Table ─────────────────────────────────────────────────────────

function FlatView({
  result, pricesMap,
}: { result: BomResult; pricesMap: Map<string, number> }) {
  const missing = result.flat.filter((r) => r.totalShort > 0)
  const covered = result.flat.filter((r) => r.totalShort === 0)

  if (result.flat.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-display font-600 text-xl mb-1" style={{ color: '#34d399' }}>
          All materials covered!
        </p>
        <p className="text-ink-secondary text-base">Your inventory has everything needed.</p>
      </div>
    )
  }

  const COLS = '36px 1fr 80px 80px 80px 110px'

  const ColHeader = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
    <span
      className={`text-xs font-body font-500 uppercase tracking-wider ${right ? 'text-right' : ''}`}
      style={{ color: '#4a5568' }}
    >
      {children}
    </span>
  )

  const TableHeader = () => (
    <div
      className="grid items-center px-5 py-3"
      style={{
        gridTemplateColumns: COLS,
        gap: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.2)',
      }}
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
    <div className="flex flex-col gap-6">
      {/* Missing */}
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
                  className="grid items-center px-5 py-3.5 transition-colors"
                  style={{
                    gridTemplateColumns: COLS,
                    gap: '12px',
                    borderBottom: idx < missing.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    borderLeft: '2px solid rgba(231,76,60,0.5)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <ItemIcon iconName={item?.iconName ?? ''} name={item?.name} size={30} />
                  <span className="font-body text-base text-ink truncate">{item?.name ?? row.itemId}</span>
                  <span className="font-body text-base text-right text-ink-secondary">
                    {row.totalNeeded.toLocaleString()}
                  </span>
                  <span className="font-body text-base text-right" style={{ color: row.totalAvailable > 0 ? '#34d399' : '#4a5568' }}>
                    {row.totalAvailable > 0 ? row.totalAvailable.toLocaleString() : '—'}
                  </span>
                  <span className="font-body font-600 text-base text-right" style={{ color: '#fb7185' }}>
                    {row.totalShort.toLocaleString()}
                  </span>
                  <span className="font-body text-base font-500 text-right" style={{ color: cost > 0 ? '#e6a817' : '#4a5568' }}>
                    {cost > 0 ? cost.toLocaleString() + ' ₳' : '—'}
                  </span>
                </div>
              )
            })}

            {result.grandTotalCost > 0 && (
              <div
                className="flex justify-between items-center px-5 py-4"
                style={{ borderTop: '1px solid rgba(230,168,23,0.2)', background: 'rgba(230,168,23,0.05)' }}
              >
                <span className="text-ink-secondary text-sm font-body">Subtotal to buy</span>
                <span className="font-display font-700 text-xl" style={{ color: '#e6a817' }}>
                  {result.grandTotalCost.toLocaleString()} ₳
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Covered */}
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
                  className="grid items-center px-5 py-3"
                  style={{
                    gridTemplateColumns: COLS,
                    gap: '12px',
                    borderBottom: idx < covered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    borderLeft: '2px solid rgba(16,185,129,0.4)',
                  }}
                >
                  <ItemIcon iconName={item?.iconName ?? ''} name={item?.name} size={26} />
                  <span className="font-body text-base text-ink truncate">{item?.name ?? row.itemId}</span>
                  <span className="font-body text-sm text-right text-ink-secondary">
                    {row.totalNeeded.toLocaleString()}
                  </span>
                  <span className="font-body text-sm text-right" style={{ color: '#34d399' }}>
                    {row.totalAvailable.toLocaleString()}
                  </span>
                  <span className="font-body text-sm text-right font-500" style={{ color: '#34d399' }}>
                    ✓
                  </span>
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

// ── Market Prices ────────────────────────────────────────────────────────────

function MarketPrices({
  rows, prices, setPrice,
}: { rows: BomResult['flat']; prices: PriceEntry[]; setPrice: (id: string, v: number) => void }) {
  const pricesMap = useMemo(
    () => new Map(prices.map((p) => [p.itemId, p.adenaPerUnit])),
    [prices],
  )

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="font-display font-600 text-lg text-ink">Market Prices</p>
          <p className="text-ink-secondary text-sm font-body mt-0.5">
            Set the adena value per unit for each material. These are global and apply across all recipes.
          </p>
        </div>
      </div>

      <div className="card overflow-hidden" style={{ padding: 0 }}>
        {/* Header */}
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
            Item
          </span>
          <span className="text-xs font-body font-500 uppercase tracking-wider text-right" style={{ color: '#4a5568' }}>
            Price per unit (₳)
          </span>
        </div>

        {rows.map((row, idx) => {
          const item = itemsMap.get(row.itemId)
          const currentPrice = pricesMap.get(row.itemId) ?? 0
          return (
            <div
              key={row.itemId}
              className="grid items-center px-5 py-3 transition-colors"
              style={{
                gridTemplateColumns: '36px 1fr 160px',
                gap: '12px',
                borderBottom: idx < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <ItemIcon iconName={item?.iconName ?? ''} name={item?.name} size={26} />
              <div>
                <span className="font-body text-base text-ink">{item?.name ?? row.itemId}</span>
                {currentPrice > 0 && (
                  <span className="ml-2 text-xs font-body" style={{ color: '#4a5568' }}>
                    ×{row.totalNeeded.toLocaleString()} = {(currentPrice * row.totalNeeded).toLocaleString()} ₳
                  </span>
                )}
              </div>
              <div className="flex justify-end">
                <input
                  type="number"
                  min={0}
                  defaultValue={currentPrice}
                  key={`${row.itemId}-${currentPrice}`}
                  onBlur={(e) => setPrice(row.itemId, parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="input text-right"
                  style={{ width: '150px', padding: '6px 12px', fontSize: '14px' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Shared helpers ───────────────────────────────────────────────────────────

function SectionLabel({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      <p className="text-sm font-body font-500 text-ink-secondary">{text}</p>
    </div>
  )
}

function StatCard({
  value, label, color, textColor,
}: { value: number; label: string; color: string; textColor: string }) {
  return (
    <div
      className="rounded-xl px-5 py-4"
      style={{ background: color, border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <p className="font-display font-700 text-2xl" style={{ color: textColor }}>{value}</p>
      <p className="text-ink-secondary text-sm mt-0.5">{label}</p>
    </div>
  )
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-3 text-base font-body font-500 transition-all -mb-px"
      style={{
        borderBottom: active ? '2px solid #e6a817' : '2px solid transparent',
        color: active ? '#e6a817' : '#8b95a3',
      }}
    >
      {children}
    </button>
  )
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <p className="text-ink-secondary text-sm font-body mb-1">{subtitle}</p>
      <h1 className="font-display font-700 text-3xl text-ink">{title}</h1>
    </div>
  )
}
