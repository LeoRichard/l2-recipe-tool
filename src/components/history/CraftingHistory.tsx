import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { itemsMap, recipesMap } from '../../lib/dataLoader'
import { ItemIcon } from '../shared/ItemIcon'
import { AdenaIcon } from '../shared/AdenaIcon'
import type { CraftHistoryEntry, CraftOutcome } from '../../types'

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function OutcomeToggle({
  entry,
  onSet,
}: {
  entry: CraftHistoryEntry
  onSet: (outcome: CraftOutcome) => void
}) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <button
        onClick={() => onSet('success')}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-body font-600 transition-all"
        style={{
          background: entry.outcome === 'success' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${entry.outcome === 'success' ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.08)'}`,
          color: entry.outcome === 'success' ? '#34d399' : '#4a5568',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20,6 9,17 4,12"/>
        </svg>
        Success
      </button>
      <button
        onClick={() => onSet('failed')}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-body font-600 transition-all"
        style={{
          background: entry.outcome === 'failed' ? 'rgba(251,113,133,0.2)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${entry.outcome === 'failed' ? 'rgba(251,113,133,0.4)' : 'rgba(255,255,255,0.08)'}`,
          color: entry.outcome === 'failed' ? '#fb7185' : '#4a5568',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        Failed
      </button>
    </div>
  )
}

export function CraftingHistory() {
  const { craftHistory, setCraftOutcome, clearCraftHistory } = useAppStore()
  const [confirmClear, setConfirmClear] = useState(false)

  const totalCost = craftHistory.reduce((s, e) => s + e.totalCost, 0)
  const successCount = craftHistory.filter((e) => e.outcome === 'success').length
  const failedCount = craftHistory.filter((e) => e.outcome === 'failed').length
  const pendingCount = craftHistory.filter((e) => e.outcome === 'pending').length

  if (craftHistory.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <p className="text-ink-secondary text-sm font-body mb-1">Activity</p>
          <h1 className="font-display font-700 text-3xl text-ink">Crafting History</h1>
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
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
          </div>
          <p className="font-display font-600 text-xl text-ink mb-2">No crafts yet</p>
          <p className="text-ink-secondary text-base">
            Hit <span className="font-600" style={{ color: '#34d399' }}>Craft Now!</span> on any ready recipe in My Crafts to start tracking
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-ink-secondary text-sm font-body mb-1">Activity</p>
          <h1 className="font-display font-700 text-3xl text-ink">Crafting History</h1>
        </div>
        <div className="flex items-center gap-3">
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-body text-ink-secondary">Clear all history?</span>
              <button
                onClick={() => { clearCraftHistory(); setConfirmClear(false) }}
                className="btn-primary text-sm"
                style={{ padding: '5px 12px', background: 'rgba(251,113,133,0.15)', border: '1px solid rgba(251,113,133,0.3)', color: '#fb7185' }}
              >
                Yes, clear
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="text-sm font-body text-ink-muted"
                style={{ padding: '5px 10px' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-sm font-body"
              style={{ color: '#4a5568' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fb7185')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#4a5568')}
            >
              Clear history
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total Crafts"
          value={craftHistory.length.toString()}
          color="rgba(255,255,255,0.04)"
          textColor="#e8ecf0"
        />
        <StatCard
          label="Total Invested"
          value={totalCost > 0 ? totalCost.toLocaleString() : '—'}
          adena={totalCost > 0}
          color="rgba(230,168,23,0.08)"
          textColor="#e6a817"
        />
        <StatCard
          label="Successful"
          value={successCount.toString()}
          color="rgba(52,211,153,0.08)"
          textColor="#34d399"
        />
        <StatCard
          label="Failed"
          value={failedCount.toString()}
          color="rgba(251,113,133,0.08)"
          textColor="#fb7185"
        />
      </div>

      {/* History list */}
      <div className="card overflow-hidden" style={{ padding: 0 }}>
        {craftHistory.map((entry, idx) => {
          const recipe = recipesMap.get(entry.recipeId)
          const outputItem = recipe ? itemsMap.get(recipe.outputItemId) : undefined
          const needs100 = (recipe?.successRate ?? 100) >= 100

          return (
            <div
              key={entry.id}
              className="flex items-center gap-4 px-5 py-4"
              style={{
                borderBottom: idx < craftHistory.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                opacity: entry.outcome === 'failed' ? 0.6 : 1,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Outcome indicator strip */}
              <div
                className="w-0.5 h-9 rounded-full flex-shrink-0"
                style={{
                  background:
                    entry.outcome === 'success' ? '#34d399' :
                    entry.outcome === 'failed' ? '#fb7185' :
                    'rgba(255,255,255,0.1)',
                }}
              />

              {/* Icon */}
              <ItemIcon
                iconName={outputItem?.iconName ?? ''}
                name={outputItem?.name}
                size={34}
              />

              {/* Name + date */}
              <div className="flex-1 min-w-0">
                <p className="font-body font-600 text-base text-ink truncate">
                  {outputItem?.name ?? recipe?.name.replace(/^Recipe:\s*/i, '') ?? entry.recipeId}
                </p>
                <p className="text-ink-muted text-xs font-body mt-0.5">
                  {formatDate(entry.craftedAt)}
                </p>
              </div>

              {/* Success rate badge (only for <100%) */}
              {!needs100 && (
                <span
                  className="flex-shrink-0 text-xs font-body font-600 rounded-full px-2 py-0.5"
                  style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316' }}
                >
                  {recipe?.successRate ?? '?'}%
                </span>
              )}

              {/* Cost */}
              {entry.totalCost > 0 ? (
                <div
                  className="flex items-center gap-1 flex-shrink-0 rounded-full px-2.5 py-1"
                  style={{ background: 'rgba(230,168,23,0.08)', border: '1px solid rgba(230,168,23,0.15)' }}
                >
                  <span className="text-xs font-body font-600" style={{ color: '#e6a817' }}>
                    {entry.totalCost.toLocaleString()}
                  </span>
                  <AdenaIcon size={11} />
                </div>
              ) : (
                <span className="text-xs font-body flex-shrink-0" style={{ color: '#4a5568' }}>No price data</span>
              )}

              {/* Outcome toggle (only for <100% success) */}
              {!needs100 ? (
                <OutcomeToggle entry={entry} onSet={(o) => setCraftOutcome(entry.id, o)} />
              ) : (
                <span
                  className="flex-shrink-0 flex items-center gap-1 text-xs font-body font-600"
                  style={{ color: '#34d399' }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  Success
                </span>
              )}
            </div>
          )
        })}

        {/* Footer totals */}
        {pendingCount > 0 && (
          <div
            className="px-5 py-3 flex items-center gap-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.15)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
            <span className="text-xs font-body text-ink-muted">
              {pendingCount} craft{pendingCount !== 1 ? 's' : ''} awaiting outcome — mark Success or Failed above
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label, value, color, textColor, adena,
}: {
  label: string
  value: string
  color: string
  textColor: string
  adena?: boolean
}) {
  return (
    <div
      className="rounded-xl px-4 py-4"
      style={{ background: color, border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <p className="text-ink-muted text-xs font-body uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        <p className="font-display font-700 text-2xl" style={{ color: textColor }}>{value}</p>
        {adena && <AdenaIcon size={16} />}
      </div>
    </div>
  )
}
