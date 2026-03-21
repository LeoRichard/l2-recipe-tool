/**
 * L2 Recipe Discovery Agent
 *
 * Starting from a single recipe URL, recursively discovers ALL sub-recipes
 * needed for nested materials — automatically follows the full crafting chain.
 *
 * Usage:
 *   node discover.js --url "https://wikipedia1.mw2.wiki/lu4/item/4199-recipe-bow-of-peril-100"
 *   node discover.js --url "..." --dry-run      (show what would be scraped, don't save)
 *   node discover.js --url "..." --delay 1500   (ms between requests, default 1200)
 *   node discover.js --url "..." --max-pages 30 (safety limit, default 60)
 */

import * as cheerio from 'cheerio'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { readFileSync } from 'fs'
import { fetchPage, parseIdAndSlugFromUrl } from './fetcher.js'
import { scrapeRecipePage } from './parser.js'
import { mergeIntoDatabase } from './merger.js'

// ── CLI args ───────────────────────────────────────────────────────────────

const argv = yargs(hideBin(process.argv))
  .option('url',       { type: 'string',  required: true,  description: 'Starting recipe URL' })
  .option('dry-run',   { type: 'boolean', default: false,  description: 'Discover only, do not save' })
  .option('delay',     { type: 'number',  default: 1200,   description: 'Minimum ms between requests' })
  .option('max-pages', { type: 'number',  default: 60,     description: 'Safety limit on total pages fetched' })
  .help()
  .argv

// ── State ──────────────────────────────────────────────────────────────────

const knownRecipeIds  = loadKnownRecipeIds()   // from existing recipes.json — skip these
const visitedItemIds  = new Set()              // item pages we've already inspected
const recipeQueue     = []                     // recipe URLs yet to process
const discoveredUrls  = []                     // all recipe URLs found in this run

let totalRequests = 0
let totalRecipesScraped = 0

// ── Helpers ────────────────────────────────────────────────────────────────

function loadKnownRecipeIds() {
  try {
    const db = JSON.parse(readFileSync('../src/data/recipes.json', 'utf8'))
    return new Set(db.recipes.map(r => r.id))
  } catch {
    return new Set()
  }
}

function randomDelay() {
  // Jitter ±20% so requests don't look perfectly periodic
  const base = argv.delay
  return base + Math.floor((Math.random() - 0.5) * base * 0.4)
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Track last request time for rate-limiting
let lastRequestAt = 0

async function rateLimitedFetch(url) {
  const now = Date.now()
  const wait = argv.delay - (now - lastRequestAt)
  if (wait > 0) await sleep(wait + Math.floor(Math.random() * 300))
  lastRequestAt = Date.now()
  totalRequests++
  return fetchPage(url)
}

// ── Core: find recipe links on an item page ────────────────────────────────

async function findRecipesOnItemPage(itemId, itemSlug) {
  if (visitedItemIds.has(itemId)) return []
  visitedItemIds.add(itemId)

  const url = `https://wikipedia1.mw2.wiki/lu4/item/${itemId}-${itemSlug}`
  let html

  try {
    html = await rateLimitedFetch(url)
  } catch (err) {
    console.warn(`  ⚠  Failed to fetch item page: ${url} — ${err.message}`)
    return []
  }

  if (!html) return [] // already visited in this run by fetcher's dedup

  const $ = cheerio.load(html)
  const recipeUrls = []

  // Strategy: find the "Recipes" section heading, then collect all item links
  // within the following content block. A recipe link has href matching /item/
  // and typically the slug starts with "recipe-"
  let inRecipesSection = false

  $('h2, h3, h4, div.section-title, div.tab-title').each((_, el) => {
    const text = $(el).text().trim().toLowerCase()
    if (text === 'recipes' || text === 'recipe') {
      // Grab all /item/ links in the next sibling content until the next heading
      let sibling = $(el).next()
      while (sibling.length && !sibling.is('h2,h3,h4')) {
        sibling.find('a[href*="/item/"]').each((_, a) => {
          const href = $(a).attr('href') || ''
          if (href.match(/\/item\/\d+-recipe-/)) {
            const full = href.startsWith('http')
              ? href
              : `https://wikipedia1.mw2.wiki${href}`
            recipeUrls.push(full)
          }
        })
        sibling = sibling.next()
      }
      inRecipesSection = true
    }
  })

  // Fallback: scan the whole page for any recipe-scroll links not caught above
  // (covers cases where the section structure differs)
  if (!inRecipesSection || recipeUrls.length === 0) {
    $('a[href*="/item/"]').each((_, a) => {
      const href = $(a).attr('href') || ''
      const imgAlt = $(a).find('img').attr('alt') || ''
      const linkText = $(a).text().trim()

      // A link is a "recipe that produces this item" if:
      // - href slug starts with "recipe-"
      // - AND the link text or img alt starts with "Recipe:"
      if (
        href.match(/\/item\/\d+-recipe-/) &&
        (linkText.startsWith('Recipe:') || imgAlt.startsWith('Recipe:'))
      ) {
        const full = href.startsWith('http')
          ? href
          : `https://wikipedia1.mw2.wiki${href}`
        if (!recipeUrls.includes(full)) recipeUrls.push(full)
      }
    })
  }

  return recipeUrls
}

// ── Core: process a single recipe URL ─────────────────────────────────────

async function processRecipe(recipeUrl) {
  let recipeId
  try {
    ;({ id: recipeId } = parseIdAndSlugFromUrl(recipeUrl))
  } catch {
    console.warn(`  ⚠  Cannot parse recipe URL: ${recipeUrl}`)
    return
  }

  const alreadyKnown = knownRecipeIds.has(recipeId)
  const label = alreadyKnown ? ' (already in DB — refreshing materials)' : ' (new)'
  console.log(`\n📜 Recipe ${recipeId}${label}`)
  console.log(`   ${recipeUrl}`)

  // Scrape the recipe page (depth=0 — we handle recursion ourselves)
  let scraped
  try {
    scraped = await scrapeRecipePage(recipeUrl, 0)
    totalRequests++ // scrapeRecipePage fetches one page
  } catch (err) {
    console.error(`  ✗ Error scraping recipe: ${err.message}`)
    return
  }

  if (scraped.recipes.length === 0) {
    console.warn(`  ⚠  No recipe data extracted — the page may not be a recipe`)
    return
  }

  const recipe = scraped.recipes[0]
  console.log(
    `   → "${recipe.name}" | ${recipe.materials.length} materials | ${recipe.successRate}% success`,
  )

  if (!argv['dry-run']) {
    mergeIntoDatabase(scraped)
  }

  totalRecipesScraped++
  knownRecipeIds.add(recipeId) // mark as known so we don't re-queue it

  // ── Discover sub-recipes from each material ──────────────────────────────
  console.log(`   🔍 Checking ${recipe.materials.length} materials for sub-recipes...`)
  let newSubRecipes = 0

  for (const mat of recipe.materials) {
    // Find the item's slug from what we just scraped
    const matItem = scraped.items.find(i => i.id === mat.itemId)
    if (!matItem) continue

    // Skip Adena and obvious non-craftables
    if (mat.itemId === '57') continue

    if (totalRequests >= argv['max-pages']) {
      console.warn(`\n  ⛔ Safety limit of ${argv['max-pages']} pages reached. Use --max-pages to increase.`)
      return
    }

    const subRecipeUrls = await findRecipesOnItemPage(matItem.id, matItem.slug)

    for (const subUrl of subRecipeUrls) {
      let subId
      try { ({ id: subId } = parseIdAndSlugFromUrl(subUrl)) } catch { continue }

      if (!knownRecipeIds.has(subId) && !recipeQueue.includes(subUrl)) {
        recipeQueue.push(subUrl)
        discoveredUrls.push(subUrl)
        newSubRecipes++
        console.log(`     ✦ Found sub-recipe: ${subUrl}`)
      }
    }
  }

  if (newSubRecipes === 0) {
    console.log(`     (no new sub-recipes found)`)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║       L2 Recipe Discovery Agent                ║')
  console.log('╚════════════════════════════════════════════════╝')
  console.log()
  console.log(`  Starting URL : ${argv.url}`)
  console.log(`  Request delay: ~${argv.delay}ms (±20% jitter)`)
  console.log(`  Max pages    : ${argv['max-pages']}`)
  console.log(`  Dry run      : ${argv['dry-run']}`)
  console.log(`  Known recipes: ${knownRecipeIds.size} already in DB (will be skipped unless refreshing)`)
  console.log()

  if (argv['dry-run']) {
    console.log('  ⚠  DRY RUN — no data will be saved\n')
  }

  // Seed the queue with the starting recipe
  recipeQueue.push(argv.url)
  discoveredUrls.push(argv.url)

  // BFS: process queue until empty or safety limit hit
  while (recipeQueue.length > 0) {
    if (totalRequests >= argv['max-pages']) {
      console.warn(`\n⛔ Safety limit of ${argv['max-pages']} pages reached. Stopping.`)
      console.warn(`   Re-run with --max-pages ${argv['max-pages'] * 2} to continue.`)
      break
    }

    const url = recipeQueue.shift()
    await processRecipe(url)

    // Brief status update between recipes
    if (recipeQueue.length > 0) {
      console.log(`\n  ⏳ ${recipeQueue.length} recipe(s) still in queue. Next in ~${Math.round(argv.delay / 1000)}s...`)
      await sleep(randomDelay())
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log()
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║                   Summary                      ║')
  console.log('╚════════════════════════════════════════════════╝')
  console.log(`  Recipes discovered : ${discoveredUrls.length}`)
  console.log(`  Recipes scraped    : ${totalRecipesScraped}`)
  console.log(`  Total pages fetched: ${totalRequests}`)
  console.log(`  Data saved         : ${argv['dry-run'] ? 'NO (dry run)' : 'YES'}`)
  console.log()

  if (discoveredUrls.length > 0) {
    console.log('  Recipe URLs found in this run:')
    discoveredUrls.forEach((u, i) => console.log(`    ${i + 1}. ${u}`))
  }

  console.log()
  console.log('  Done.')
}

main().catch(err => {
  console.error('\n✗ Fatal error:', err.message)
  process.exit(1)
})
