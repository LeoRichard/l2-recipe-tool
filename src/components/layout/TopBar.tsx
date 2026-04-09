import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { exportState, importState } from '../../lib/exportImport'
import { ChangelogModal } from './ChangelogModal'
import { OnboardingWizard } from './OnboardingWizard'
import changelogData from '../../data/changelog.json'

interface Props {
  onMenuToggle: () => void
}

export function TopBar({ onMenuToggle }: Props) {
  const { exportAppState, importAppState } = useAppStore()
  const [showChangelog, setShowChangelog] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  return (
    <>
      <header
        className="h-14 flex items-center justify-between gap-2 px-4 md:px-6 flex-shrink-0 border-b border-white/[0.06]"
        style={{ background: '#080b10' }}
      >
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            onClick={onMenuToggle}
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 rounded-lg transition-colors"
            style={{ color: '#8b95a3' }}
            aria-label="Open menu"
          >
            <span className="w-5 h-px rounded-full" style={{ background: 'currentColor' }} />
            <span className="w-5 h-px rounded-full" style={{ background: 'currentColor' }} />
            <span className="w-5 h-px rounded-full" style={{ background: 'currentColor' }} />
          </button>

          {/* Version badge */}
          <button
            onClick={() => setShowChangelog(true)}
            className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
          >
            <span
              className="text-xs font-body px-2 py-1 rounded-full"
              style={{
                background: 'rgba(230,168,23,0.1)',
                color: '#e6a817',
                border: '1px solid rgba(230,168,23,0.2)',
              }}
            >
              v{changelogData.current}
            </span>
            <span className="text-xs font-body hidden sm:inline" style={{ color: '#4a5568' }}>changelog</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="btn-ghost hidden sm:inline-flex" onClick={() => setShowOnboarding(true)}>
            How to
          </button>
          <button className="btn-ghost hidden sm:inline-flex" onClick={() => importState((s) => importAppState(s))}>
            Import
          </button>
          <button className="btn-amber" onClick={() => exportState(exportAppState())}>
            Export
          </button>
        </div>
      </header>

      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
      {showOnboarding && <OnboardingWizard onDismiss={() => setShowOnboarding(false)} manualTrigger />}
    </>
  )
}
