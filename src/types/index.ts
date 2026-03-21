// ── Static database (loaded from JSON files) ──────────────────────────────

export type ItemCategory = 'material' | 'recipe_output' | 'recipe_scroll' | 'other'

export interface Item {
  id: string
  slug: string
  name: string
  iconName: string
  category: ItemCategory
  recipeId: string | null
}

export interface RecipeMaterial {
  itemId: string
  quantity: number
}

export interface Recipe {
  id: string
  name: string
  outputItemId: string
  outputQuantity: number
  successRate: number
  mpCost: number
  adenaFee: number
  materials: RecipeMaterial[]
  scraperUrl: string
}

// ── User state (persisted in localStorage) ────────────────────────────────

export interface InventoryEntry {
  itemId: string
  quantity: number
}

export interface QueueEntry {
  id: string
  recipeId: string
  quantity: number
}

export interface PriceEntry {
  itemId: string
  adenaPerUnit: number
}

export interface AppState {
  inventory: InventoryEntry[]
  queue: QueueEntry[]
  prices: PriceEntry[]
  lastModified: string
}

// ── BOM Engine types ───────────────────────────────────────────────────────

export interface BomTreeNode {
  itemId: string
  quantityNeeded: number
  quantityAvailable: number
  quantityShort: number
  recipeId: string | null
  children: BomTreeNode[]
}

export interface BomFlatRow {
  itemId: string
  totalNeeded: number
  totalAvailable: number
  totalShort: number
  pricePerUnit: number
  totalCost: number
}

export interface BomResult {
  tree: BomTreeNode[]
  flat: BomFlatRow[]
  grandTotalCost: number
}

// ── Data file schemas ──────────────────────────────────────────────────────

export interface ItemsDatabase {
  version: number
  items: Item[]
}

export interface RecipesDatabase {
  version: number
  recipes: Recipe[]
}
