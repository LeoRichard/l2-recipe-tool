import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { RecipeList } from '../recipes/RecipeList'
import { CraftList } from '../crafts/CraftList'
import { InventoryPanel } from '../inventory/InventoryPanel'
import { PricesPanel } from '../prices/PricesPanel'
import { OnboardingWizard, useOnboarding } from './OnboardingWizard'

export function AppShell() {
  const activeSection = useAppStore((s) => s.activeSection)
  const { show, dismiss } = useOnboarding()
  const handleDismiss = (permanent?: boolean) => dismiss(permanent ?? false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#080b10' }}>
      <TopBar onMenuToggle={() => setMobileMenuOpen((o) => !o)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8" style={{ background: '#0c1018' }}>
          <div className={`mx-auto animate-slide-up ${activeSection === 'crafts' ? 'max-w-7xl' : 'max-w-5xl'}`}>
            {activeSection === 'recipes'   && <RecipeList />}
            {activeSection === 'crafts'    && <CraftList />}
            {activeSection === 'inventory' && <InventoryPanel />}
            {activeSection === 'prices'    && <PricesPanel />}
          </div>
        </main>
      </div>
      {show && <OnboardingWizard onDismiss={handleDismiss} />}
    </div>
  )
}
