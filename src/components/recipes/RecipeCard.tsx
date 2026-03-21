import type { Recipe } from '../../types'
import { itemsMap } from '../../lib/dataLoader'
import { useAppStore } from '../../store/appStore'
import { ItemIcon } from '../shared/ItemIcon'

interface Props { recipe: Recipe }

function RateBadge({ rate }: { rate: number }) {
  const [bg, color] =
    rate >= 80 ? ['rgba(16,185,129,0.12)', '#34d399'] :
    rate >= 50 ? ['rgba(230,168,23,0.12)', '#e6a817'] :
                 ['rgba(231,76,60,0.12)',   '#fb7185']
  return (
    <span
      className="text-xs font-body font-500 rounded-full px-2.5 py-1"
      style={{ background: bg, color }}
    >
      {rate}%
    </span>
  )
}

export function RecipeCard({ recipe }: Props) {
  const { addToQueue, setActiveSection, queue } = useAppStore()
  const outputItem = itemsMap.get(recipe.outputItemId)
  const alreadyQueued = queue.some((e) => e.recipeId === recipe.id)

  function handleAdd() {
    if (!alreadyQueued) addToQueue(recipe.id)
    setActiveSection('crafts')
  }

  const displayName = recipe.name.replace(/^Recipe:\s*/i, '')

  return (
    <div
      className="card flex flex-col gap-0 group cursor-default"
      style={{ padding: 0, overflow: 'hidden' }}
    >
      {/* Color strip at top */}
      <div
        className="h-0.5 w-full transition-all duration-300"
        style={{
          background: alreadyQueued
            ? 'linear-gradient(90deg, #e6a817, #f59e0b)'
            : 'rgba(255,255,255,0.05)',
        }}
      />

      <div className="p-5 flex flex-col gap-4">
        {/* Item row */}
        <div className="flex items-start gap-3.5">
          <div
            className="rounded-lg p-1 flex-shrink-0"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            <ItemIcon iconName={outputItem?.iconName ?? ''} name={outputItem?.name} size={40} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-600 text-base text-ink leading-tight truncate" title={displayName}>
              {displayName}
            </p>
            <p className="text-ink-secondary text-sm mt-0.5 truncate">
              {outputItem?.name ?? '—'}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2 flex-wrap">
          <RateBadge rate={recipe.successRate} />
          {recipe.mpCost > 0 && (
            <span
              className="text-xs font-body rounded-full px-2.5 py-1"
              style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8' }}
            >
              MP {recipe.mpCost}
            </span>
          )}
          <span
            className="text-xs font-body rounded-full px-2.5 py-1"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#8b95a3' }}
          >
            {recipe.materials.length} materials
          </span>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
          <span className="text-ink-muted text-sm font-body">
            {recipe.adenaFee > 0 ? `${recipe.adenaFee.toLocaleString()} ₳` : ''}
          </span>
          <button
            onClick={handleAdd}
            className={`text-sm font-body font-500 rounded-lg px-3.5 py-1.5 transition-all ${
              alreadyQueued
                ? 'btn-amber'
                : 'btn-primary'
            }`}
          >
            {alreadyQueued ? 'In Crafts →' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
