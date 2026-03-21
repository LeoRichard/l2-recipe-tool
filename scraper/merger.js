import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ITEMS_PATH = resolve(__dirname, '../src/data/items.json')
const RECIPES_PATH = resolve(__dirname, '../src/data/recipes.json')

export function mergeIntoDatabase(scraped) {
  // ── Merge items ───────────────────────────────────────────────────────
  const itemsDb = JSON.parse(readFileSync(ITEMS_PATH, 'utf8'))
  let newItemCount = 0

  for (const newItem of scraped.items) {
    const existing = itemsDb.items.find((i) => i.id === newItem.id)
    if (!existing) {
      itemsDb.items.push(newItem)
      newItemCount++
    } else {
      if (!existing.iconName && newItem.iconName) existing.iconName = newItem.iconName
      if (!existing.recipeId && newItem.recipeId) existing.recipeId = newItem.recipeId
      if (newItem.category !== 'material') existing.category = newItem.category
    }
  }

  writeFileSync(ITEMS_PATH, JSON.stringify(itemsDb, null, 2))

  // ── Merge recipes ─────────────────────────────────────────────────────
  const recipesDb = JSON.parse(readFileSync(RECIPES_PATH, 'utf8'))
  let newRecipeCount = 0

  for (const newRecipe of scraped.recipes) {
    const existing = recipesDb.recipes.find((r) => r.id === newRecipe.id)
    if (!existing) {
      recipesDb.recipes.push(newRecipe)
      newRecipeCount++
    } else {
      Object.assign(existing, newRecipe)
    }
  }

  writeFileSync(RECIPES_PATH, JSON.stringify(recipesDb, null, 2))

  console.log(`\n  Saved:`)
  console.log(`    items.json   → ${itemsDb.items.length} total items (+${newItemCount} new)`)
  console.log(`    recipes.json → ${recipesDb.recipes.length} total recipes (+${newRecipeCount} new)`)
}
