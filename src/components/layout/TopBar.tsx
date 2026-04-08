import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { exportState, importState } from '../../lib/exportImport'
import { ChangelogModal } from './ChangelogModal'
import { OnboardingWizard } from './OnboardingWizard'
import changelogData from '../../data/changelog.json'

export function TopBar() {
  const { exportAppState, importAppState } = useAppStore()
  const [showChangelog, setShowChangelog] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  return (
    <>
      <header
        className="h-14 flex items-center justify-between gap-2 px-6 flex-shrink-0 border-b border-white/[0.06]"
        style={{ background: '#080b10' }}
      >
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
          <span className="text-xs font-body" style={{ color: '#4a5568' }}>changelog</span>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={() => setShowOnboarding(true)}>
            How to
          </button>
          <button className="btn-ghost" onClick={() => importState((s) => importAppState(s))}>
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
