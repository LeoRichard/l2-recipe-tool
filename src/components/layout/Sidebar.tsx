import { useAppStore, type Section } from '../../store/appStore'

const NAV: { section: Section; label: string; icon: React.ReactNode }[] = [
  {
    section: 'recipes',
    label: 'Recipes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
    ),
  },
  {
    section: 'queue',
    label: 'Craft Queue',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
  {
    section: 'inventory',
    label: 'Inventory',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
  {
    section: 'bom',
    label: 'Materials',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
  },
  {
    section: 'prices',
    label: 'Market Prices',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
        <line x1="12" y1="6" x2="12" y2="8"/>
        <line x1="12" y1="16" x2="12" y2="18"/>
      </svg>
    ),
  },
]

export function Sidebar() {
  const { activeSection, setActiveSection, queue } = useAppStore()

  return (
    <aside
      style={{ background: 'linear-gradient(180deg, #0c1018 0%, #080b10 100%)' }}
      className="w-56 flex-shrink-0 flex flex-col border-r border-white/[0.06]"
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #e6a817 0%, #f59e0b 100%)' }}
          >
            <img
              src="https://wikipedia1.mw2.wiki/i64/etc_recipe_red_i00.png"
              alt="L2"
              width={20}
              height={20}
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div>
            <p className="font-display font-700 text-sm text-ink leading-none tracking-wide">
              L2 Tracker
            </p>
            <p className="text-ink-muted text-2xs mt-0.5">Recipe Manager</p>
          </div>
        </div>
      </div>

      <div className="sep mx-4 mb-4" />

      {/* Nav */}
      <nav className="flex-1 px-3 flex flex-col gap-1">
        <p className="text-ink-muted text-2xs font-600 uppercase tracking-widest px-2 mb-2">
          Navigation
        </p>
        {NAV.map(({ section, label, icon }) => {
          const active = activeSection === section
          return (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
              style={
                active
                  ? {
                      background: 'rgba(230,168,23,0.1)',
                      color: '#e6a817',
                    }
                  : {
                      color: '#8b95a3',
                    }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = '#e8ecf0'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#8b95a3'
                }
              }}
            >
              {/* Active indicator */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                  style={{ background: '#e6a817' }}
                />
              )}
              <span className="flex-shrink-0">{icon}</span>
              <span className="font-body text-sm font-500">{label}</span>
              {section === 'queue' && queue.length > 0 && (
                <span
                  className="ml-auto text-2xs font-600 rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
                  style={{ background: 'rgba(230,168,23,0.2)', color: '#e6a817' }}
                >
                  {queue.length}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="sep mx-4 mb-3" />
      <div className="px-5 pb-5">
        <p className="text-ink-muted text-2xs text-center leading-relaxed">
          Lineage 2 · MasterWork
        </p>
      </div>
    </aside>
  )
}
