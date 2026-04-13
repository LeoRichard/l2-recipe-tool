import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { RecipeList } from '../recipes/RecipeList'
import { CraftList } from '../crafts/CraftList'
import { InventoryPanel } from '../inventory/InventoryPanel'
import { PricesPanel } from '../prices/PricesPanel'
import { MarketAnalysis } from '../market/MarketAnalysis'
import { OnboardingWizard, useOnboarding } from './OnboardingWizard'

export function AppShell() {
  const { show, dismiss } = useOnboarding()
  const handleDismiss = (permanent?: boolean) => dismiss(permanent ?? false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#080b10' }}>
      <TopBar onMenuToggle={() => setMobileMenuOpen((o) => !o)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8" style={{ background: '#0c1018' }}>
          <div
            key={location.pathname}
            className={`mx-auto animate-slide-up ${['/crafts', '/analysis'].includes(location.pathname) ? 'max-w-7xl' : 'max-w-5xl'}`}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/recipes" replace />} />
              <Route path="/recipes" element={<RecipeList />} />
              <Route path="/crafts" element={<CraftList />} />
              <Route path="/inventory" element={<InventoryPanel />} />
              <Route path="/prices" element={<PricesPanel />} />
              <Route path="/analysis" element={<MarketAnalysis />} />
              <Route path="*" element={<Navigate to="/recipes" replace />} />
            </Routes>
          </div>
        </main>
      </div>
      {show && <OnboardingWizard onDismiss={handleDismiss} />}
    </div>
  )
}
