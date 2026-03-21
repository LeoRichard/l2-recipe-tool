import { useAppStore } from '../../store/appStore'
import { exportState, importState } from '../../lib/exportImport'

export function TopBar() {
  const { exportAppState, importAppState } = useAppStore()

  return (
    <header
      className="h-14 flex items-center justify-end gap-2 px-6 flex-shrink-0 border-b border-white/[0.06]"
      style={{ background: '#080b10' }}
    >
      <button
        className="btn-ghost"
        onClick={() => importState((s) => importAppState(s))}
      >
        Import
      </button>
      <button
        className="btn-amber"
        onClick={() => exportState(exportAppState())}
      >
        Export
      </button>
    </header>
  )
}
