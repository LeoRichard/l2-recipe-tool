import { useState } from 'react'

const STORAGE_KEY = 'l2rt_onboarding_done'

const STEPS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e6a817" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    title: 'Browse Recipes',
    description: 'Start in the Recipes section to explore all available crafting recipes. Each card shows the output item, success rate, materials count, and cost.',
    tip: 'Use the search bar to quickly find a specific recipe by name.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e6a817" strokeWidth="1.5">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
    title: 'Add to My Crafts',
    description: 'Click "+ Add" on any recipe to add it to your My Crafts list. Each craft has its own Bill of Materials — expand it to see exactly what you need.',
    tip: 'Crafts share your inventory top-to-bottom, just like in-game. Reorder them to change priority.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e6a817" strokeWidth="1.5">
        <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    title: 'Track Your Inventory',
    description: 'Go to Inventory and add the materials you already have. The BOM engine will deduct them automatically and show you exactly what\'s still missing.',
    tip: 'The progress bar on each craft updates in real time as you update your inventory.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e6a817" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    ),
    title: 'Set Market Prices',
    description: 'In Market Prices, set the adena value per material. The BOM will then show the total cost, how much you\'ve already invested, and how much adena you still need.',
    tip: 'Prices are global — set them once and they apply across all your crafts.',
  },
]

export function useOnboarding() {
  const [show, setShow] = useState(() => localStorage.getItem(STORAGE_KEY) !== 'true')

  function dismiss(permanent: boolean) {
    if (permanent) localStorage.setItem(STORAGE_KEY, 'true')
    setShow(false)
  }

  return { show, dismiss }
}

interface Props {
  onDismiss: (permanent?: boolean) => void
  manualTrigger?: boolean
}

export function OnboardingWizard({ onDismiss, manualTrigger = false }: Props) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="relative w-full mx-4 rounded-2xl overflow-hidden animate-slide-up"
        style={{
          maxWidth: '480px',
          background: '#121826',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Amber top bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #e6a817, #f59e0b)' }} />

        <div className="p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  height: '4px',
                  flex: i === step ? 2 : 1,
                  background: i <= step ? '#e6a817' : 'rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </div>

          {/* Icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'rgba(230,168,23,0.1)' }}
          >
            {current.icon}
          </div>

          {/* Content */}
          <p className="text-ink-secondary text-xs font-body uppercase tracking-widest mb-2">
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 className="font-display font-700 text-2xl text-ink mb-3">{current.title}</h2>
          <p className="font-body text-base text-ink-secondary leading-relaxed mb-5">
            {current.description}
          </p>

          {/* Tip */}
          <div
            className="rounded-xl px-4 py-3 flex items-start gap-3 mb-8"
            style={{ background: 'rgba(230,168,23,0.06)', border: '1px solid rgba(230,168,23,0.15)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#e6a817" style={{ flexShrink: 0, marginTop: '2px' }}>
              <path d="M12 2a7 7 0 0 1 7 7c0 2.62-1.44 4.91-3.57 6.14L15 17H9l-.43-1.86A7 7 0 0 1 5 9a7 7 0 0 1 7-7zm-1 17h2v2h-2z"/>
            </svg>
            <p className="text-xs font-body leading-relaxed" style={{ color: '#e6a817cc' }}>
              {current.tip}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            {!manualTrigger ? (
              <button
                onClick={() => onDismiss(true)}
                className="text-sm font-body transition-colors"
                style={{ color: '#4a5568' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#8b95a3')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#4a5568')}
              >
                Don't show again
              </button>
            ) : <span />}

            <div className="flex items-center gap-3">
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="btn-ghost">
                  Back
                </button>
              )}
              {isLast ? (
                <button onClick={() => onDismiss(false)} className="btn-amber">
                  Get started →
                </button>
              ) : (
                <button onClick={() => setStep(step + 1)} className="btn-amber">
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
