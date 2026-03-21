import type { Item, Recipe, QueueEntry, InventoryEntry, PriceEntry, BomTreeNode, BomFlatRow, BomResult } from '../types'

const MAX_DEPTH = 4

export function computeBom(
  queue: QueueEntry[],
  inventory: InventoryEntry[],
  prices: PriceEntry[],
  recipesMap: Map<string, Recipe>,
  itemsMap: Map<string, Item>,
): BomResult {
  if (queue.length === 0) {
    return { tree: [], flat: [], grandTotalCost: 0 }
  }

  // Mutable inventory ledger — depleted top-down as we allocate
  const ledger = new Map<string, number>(
    inventory.map((e) => [e.itemId, e.quantity]),
  )

  const pricesMap = new Map<string, number>(
    prices.map((e) => [e.itemId, e.adenaPerUnit]),
  )

  // Build tree: one root node per queue entry
  const tree: BomTreeNode[] = []

  for (const entry of queue) {
    if (entry.quantity <= 0) continue

    const recipe = recipesMap.get(entry.recipeId)
    if (!recipe) continue

    const rootNode = buildTreeNode(
      recipe.outputItemId,
      entry.quantity,
      ledger,
      recipesMap,
      itemsMap,
      0,
      new Set<string>(),
    )
    tree.push(rootNode)
  }

  // Flatten to raw materials (leaf nodes)
  const flatAccum = new Map<string, { needed: number; available: number }>()
  collectRawMaterials(tree, flatAccum)

  // Build flat rows with prices
  const flat: BomFlatRow[] = []
  for (const [itemId, { needed, available }] of flatAccum.entries()) {
    const short = Math.max(0, needed - available)
    const pricePerUnit = pricesMap.get(itemId) ?? 0
    flat.push({
      itemId,
      totalNeeded: needed,
      totalAvailable: available,
      totalShort: short,
      pricePerUnit,
      totalCost: short * pricePerUnit,
    })
  }

  // Sort flat: shortage first, then by name via itemId
  flat.sort((a, b) => b.totalShort - a.totalShort || a.itemId.localeCompare(b.itemId))

  const grandTotalCost = flat.reduce((sum, r) => sum + r.totalCost, 0)

  return { tree, flat, grandTotalCost }
}

function buildTreeNode(
  itemId: string,
  qtyNeeded: number,
  ledger: Map<string, number>,
  recipesMap: Map<string, Recipe>,
  itemsMap: Map<string, Item>,
  depth: number,
  visited: Set<string>,
): BomTreeNode {
  // Consume from ledger
  const available = ledger.get(itemId) ?? 0
  const consumed = Math.min(available, qtyNeeded)
  ledger.set(itemId, available - consumed)
  const short = qtyNeeded - consumed

  const item = itemsMap.get(itemId)
  const recipeId = item?.recipeId ?? null
  const recipe = recipeId ? recipesMap.get(recipeId) : null

  const children: BomTreeNode[] = []

  // Recurse into sub-materials if:
  // - a recipe exists for this item
  // - there's a shortage
  // - we haven't exceeded max depth
  // - no circular dependency
  if (recipe && short > 0 && depth < MAX_DEPTH && !visited.has(itemId)) {
    const craftRuns = Math.ceil(short / recipe.outputQuantity)
    const childVisited = new Set(visited)
    childVisited.add(itemId)

    for (const mat of recipe.materials) {
      const childQty = mat.quantity * craftRuns
      const childNode = buildTreeNode(
        mat.itemId,
        childQty,
        ledger,
        recipesMap,
        itemsMap,
        depth + 1,
        childVisited,
      )
      children.push(childNode)
    }
  }

  return {
    itemId,
    quantityNeeded: qtyNeeded,
    quantityAvailable: consumed,
    quantityShort: short,
    recipeId,
    children,
  }
}

function collectRawMaterials(
  nodes: BomTreeNode[],
  accum: Map<string, { needed: number; available: number }>,
): void {
  for (const node of nodes) {
    if (node.children.length === 0) {
      // Leaf = raw material
      const existing = accum.get(node.itemId) ?? { needed: 0, available: 0 }
      accum.set(node.itemId, {
        needed: existing.needed + node.quantityNeeded,
        available: existing.available + node.quantityAvailable,
      })
    } else {
      // Intermediate — recurse into children
      collectRawMaterials(node.children, accum)
    }
  }
}
