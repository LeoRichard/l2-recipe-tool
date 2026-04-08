import type { Recipe, RecipeCategory } from '../../types'
import { itemsMap } from '../../lib/dataLoader'
import { useAppStore } from '../../store/appStore'
import { ItemIcon } from '../shared/ItemIcon'
import { AdenaIcon } from '../shared/AdenaIcon'

interface Props { recipe: Recipe }

const CATEGORY_STYLE: Record<RecipeCategory, { color: string; bg: string; icon: string }> = {
  weapon:    { color: '#fb923c', bg: 'rgba(251,146,60,0.1)',   icon: '⚔' },
  armor:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   icon: '🛡' },
  accessory: { color: '#c084fc', bg: 'rgba(192,132,252,0.1)',  icon: '💍' },
  other:     { color: '#8b95a3', bg: 'rgba(139,149,163,0.08)', icon: '📦' },
}

function CategoryBadge({ category }: { category: RecipeCategory }) {
  const style = CATEGORY_STYLE[category]
  return (
    <span
      className="text-xs font-body font-500 rounded-full px-2.5 py-1 flex items-center gap-1"
      style={{ background: style.bg, color: style.color }}
    >
      <span style={{ fontSize: '10px' }}>{style.icon}</span>
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  )
}

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
          {recipe.category && (
            <CategoryBadge category={recipe.category} />
          )}
          {recipe.category !== 'other' && <RateBadge rate={recipe.successRate} />}
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
            {recipe.materials.length} mats
          </span>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
          <span className="text-ink-muted text-sm font-body">
            {recipe.adenaFee > 0 ? <>{recipe.adenaFee.toLocaleString()} <AdenaIcon size={12} /></> : null}
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
