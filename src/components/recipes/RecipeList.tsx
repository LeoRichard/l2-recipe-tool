import { useState } from 'react'
import { allRecipes } from '../../lib/dataLoader'
import { RecipeCard } from './RecipeCard'

export function RecipeList() {
  const [search, setSearch] = useState('')

  const filtered = allRecipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-ink-secondary text-sm font-body mb-1">Database</p>
          <h1 className="font-display font-700 text-3xl text-ink">Recipes</h1>
        </div>
        <span
          className="text-sm font-body rounded-full px-3 py-1"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#8b95a3' }}
        >
          {allRecipes.length} loaded
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full pl-11 pr-4 py-3"
        />
      </div>

      {allRecipes.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-ink-secondary text-base">No results for "{search}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="rounded-xl border border-dashed border-white/[0.1] p-12 text-center"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: 'rgba(230,168,23,0.1)' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e6a817" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
        </svg>
      </div>
      <p className="font-display font-600 text-xl text-ink mb-2">No recipes loaded</p>
      <p className="text-ink-secondary text-base mb-5">
        Run the scraper to import recipes from the wiki
      </p>
      <code
        className="text-sm rounded-lg px-4 py-2.5 block max-w-sm mx-auto text-left"
        style={{ background: 'rgba(0,0,0,0.4)', color: '#e6a817', fontFamily: 'monospace' }}
      >
        cd scraper && node scrape.js --url &lt;url&gt;
      </code>
    </div>
  )
}
