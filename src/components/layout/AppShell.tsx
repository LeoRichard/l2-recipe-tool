import { useAppStore } from '../../store/appStore'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { RecipeList } from '../recipes/RecipeList'
import { CraftingQueue } from '../queue/CraftingQueue'
import { InventoryPanel } from '../inventory/InventoryPanel'
import { BomPanel } from '../bom/BomPanel'
import { PricesPanel } from '../prices/PricesPanel'

export function AppShell() {
  const activeSection = useAppStore((s) => s.activeSection)

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#080b10' }}>
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8" style={{ background: '#0c1018' }}>
          <div className="max-w-5xl mx-auto animate-slide-up">
            {activeSection === 'recipes'   && <RecipeList />}
            {activeSection === 'queue'     && <CraftingQueue />}
            {activeSection === 'inventory' && <InventoryPanel />}
            {activeSection === 'bom'       && <BomPanel />}
            {activeSection === 'prices'    && <PricesPanel />}
          </div>
        </main>
      </div>
    </div>
  )
}
