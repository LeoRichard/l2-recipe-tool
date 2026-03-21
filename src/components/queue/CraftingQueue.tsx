import { useAppStore } from '../../store/appStore'
import { itemsMap, recipesMap } from '../../lib/dataLoader'
import { ItemIcon } from '../shared/ItemIcon'

export function CraftingQueue() {
  const { queue, removeFromQueue, setQueueQty, moveQueueItem, setActiveSection } = useAppStore()
  const totalCrafts = queue.reduce((s, e) => s + e.quantity, 0)

  if (queue.length === 0) {
    return (
      <div>
        <PageHeader title="Craft Queue" subtitle="Queued" />
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
          <p className="font-display font-600 text-xl text-ink mb-2">Your forge awaits</p>
          <p className="text-ink-secondary text-base mb-6">Add recipes to start planning your crafts</p>
          <button onClick={() => setActiveSection('recipes')} className="btn-amber">
            Browse Recipes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-ink-secondary text-sm font-body mb-1">Planning</p>
          <h1 className="font-display font-700 text-3xl text-ink">Craft Queue</h1>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-body rounded-full px-3 py-1"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#8b95a3' }}
          >
            {totalCrafts} craft{totalCrafts !== 1 ? 's' : ''} planned
          </span>
          <button onClick={() => setActiveSection('bom')} className="btn-amber">
            View Materials →
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {queue.map((entry, idx) => {
          const recipe = recipesMap.get(entry.recipeId)
          if (!recipe) return null
          const outputItem = itemsMap.get(recipe.outputItemId)
          const displayName = recipe.name.replace(/^Recipe:\s*/i, '')

          return (
            <div
              key={entry.id}
              className="card flex items-center gap-4 px-5 py-4"
              style={{ padding: '14px 20px' }}
            >
              {/* Reorder arrows */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={() => moveQueueItem(entry.id, 'up')}
                  disabled={idx === 0}
                  className="text-ink-muted hover:text-ink disabled:opacity-20 transition-colors flex items-center justify-center w-5 h-5"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 1l4 5H1z"/></svg>
                </button>
                <button
                  onClick={() => moveQueueItem(entry.id, 'down')}
                  disabled={idx === queue.length - 1}
                  className="text-ink-muted hover:text-ink disabled:opacity-20 transition-colors flex items-center justify-center w-5 h-5"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 9L1 4h8z"/></svg>
                </button>
              </div>

              {/* Icon */}
              <div className="rounded-lg p-1 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <ItemIcon iconName={outputItem?.iconName ?? ''} name={outputItem?.name} size={38} />
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-body font-500 text-base text-ink truncate">{displayName}</p>
                <p className="text-ink-secondary text-sm mt-0.5">
                  {recipe.successRate}% success · {recipe.materials.length} materials
                </p>
              </div>

              {/* Qty stepper */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setQueueQty(entry.id, entry.quantity - 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-secondary hover:text-ink border border-white/[0.1] hover:border-white/[0.2] transition-all text-base leading-none"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  −
                </button>
                <input
                  type="number"
                  value={entry.quantity}
                  min={1}
                  onChange={(e) => setQueueQty(entry.id, parseInt(e.target.value) || 1)}
                  className="input text-center font-500"
                  style={{ width: '52px', padding: '4px 6px' }}
                />
                <button
                  onClick={() => setQueueQty(entry.id, entry.quantity + 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-secondary hover:text-ink border border-white/[0.1] hover:border-white/[0.2] transition-all text-base leading-none"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  +
                </button>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeFromQueue(entry.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-rose-text hover:bg-rose-dim transition-all flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </div>
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
