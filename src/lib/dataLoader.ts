import type { Item, Recipe, ItemsDatabase, RecipesDatabase } from '../types'
import itemsJson from '../data/items.json'
import recipesJson from '../data/recipes.json'

const itemsDb = itemsJson as ItemsDatabase
const recipesDb = recipesJson as RecipesDatabase

export const itemsMap: Map<string, Item> = new Map(
  itemsDb.items.map((item) => [item.id, item]),
)

export const recipesMap: Map<string, Recipe> = new Map(
  recipesDb.recipes.map((recipe) => [recipe.id, recipe]),
)

export const allItems: Item[] = itemsDb.items
export const allRecipes: Recipe[] = recipesDb.recipes

export const CDN_BASE = 'https://wikipedia1.mw2.wiki/i64/'

export function getItemIconUrl(iconName: string): string {
  if (!iconName) return ''
  return `${CDN_BASE}${iconName}.png`
}
