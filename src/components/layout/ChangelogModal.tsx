import { Modal } from '../shared/Modal'
import changelogData from '../../data/changelog.json'

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  feat:        { label: 'New',  color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
  fix:         { label: 'Fix',  color: '#fb7185', bg: 'rgba(251,113,133,0.1)' },
  improvement: { label: 'Impr', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  data:        { label: 'Data', color: '#e6a817', bg: 'rgba(230,168,23,0.1)'  },
}

interface Props {
  onClose: () => void
}

export function ChangelogModal({ onClose }: Props) {
  return (
    <Modal title="Changelog" onClose={onClose}>
      <div className="flex flex-col gap-6 px-6 py-5">
        {changelogData.entries.map((entry) => (
          <div key={entry.version}>
            {/* Version header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="font-display font-700 text-base" style={{ color: '#e6a817' }}>
                v{entry.version}
              </span>
              {entry.label && (
                <span
                  className="text-xs font-body px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(230,168,23,0.1)', color: '#e6a817' }}
                >
                  {entry.label}
                </span>
              )}
              <span className="text-xs font-body ml-auto" style={{ color: '#4a5568' }}>
                {entry.date}
              </span>
            </div>

            {/* Changes */}
            <div className="flex flex-col gap-2">
              {entry.changes.map((change, i) => {
                const cfg = TYPE_CONFIG[change.type] ?? TYPE_CONFIG.feat
                return (
                  <div key={i} className="flex items-start gap-3">
                    <span
                      className="text-xs font-body font-600 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                      style={{ background: cfg.bg, color: cfg.color, minWidth: '34px', textAlign: 'center' }}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-sm font-body text-ink-secondary leading-relaxed">
                      {change.text}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="mt-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }} />
          </div>
        ))}
      </div>
    </Modal>
  )
}
