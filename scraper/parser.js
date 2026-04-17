import * as cheerio from 'cheerio'
import { fetchPage, parseIdAndSlugFromUrl } from './fetcher.js'

const CATEGORY_MAP = {
  weapon:    ['weapon'],
  armor:     ['armor'],
  accessory: ['accessory', 'jewel', 'jewelry'],
}

function parseItemType(rawType) {
  // e.g. "Weapon / Dagger / One-handed"  → { category: 'weapon', subcategory: 'Dagger' }
  // e.g. "Armor / Light Armor"            → { category: 'armor',  subcategory: 'Light Armor' }
  // e.g. "Other / Material"               → { category: 'other',  subcategory: 'Material' }
  if (!rawType) return { category: 'other', subcategory: '' }

  const parts = rawType.split('/').map((p) => p.trim()).filter(Boolean)
  const first = parts[0]?.toLowerCase() ?? ''

  let category = 'other'
  for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some((k) => first.startsWith(k))) { category = cat; break }
  }

  const subcategory = parts[1] ?? ''
  return { category, subcategory }
}

function makeAccumulator() {
  return { items: [], recipes: [], seenIds: new Set() }
}

export async function scrapeRecipePage(url, maxDepth = 3) {
  const acc = makeAccumulator()
  await scrapeUrl(url, maxDepth, 0, acc)
  return acc
}

async function scrapeUrl(url, maxDepth, currentDepth, acc) {
  const html = await fetchPage(url)
  if (!html) return

  let id, slug
  try {
    ;({ id, slug } = parseIdAndSlugFromUrl(url))
  } catch {
    console.warn(`  Skipping unparseable URL: ${url}`)
    return
  }

  if (acc.seenIds.has(id)) return
  acc.seenIds.add(id)

  const $ = cheerio.load(html)

  // Recipe pages have .recipe_result container
  const isRecipePage = $('.recipe_result').length > 0

  if (isRecipePage) {
    await parseRecipePage($, id, slug, url, maxDepth, currentDepth, acc)
  } else {
    parseItemPage($, id, slug, url, acc)
  }
}

async function parseRecipePage($, id, slug, url, maxDepth, currentDepth, acc) {
  // ── Item name ─────────────────────────────────────────────────────────
  // .item_title .item-name__content contains the name + grade span inside
  // We clone and remove child spans to get just the text
  const titleEl = $('.item_title .item-name__content').first().clone()
  titleEl.find('span').remove()
  const recipeName = titleEl.text().trim() || slug.replace(/-/g, ' ')

  // ── Icon ──────────────────────────────────────────────────────────────
  const iconSrc = $('.item-icon img').first().attr('src') || ''
  const iconName = extractIconName(iconSrc)

  pushItem(acc, {
    id,
    slug,
    name: recipeName,
    iconName,
    category: 'recipe_scroll',
    recipeId: null,
  })

  // ── Recipe metadata ───────────────────────────────────────────────────
  let successRate = 0
  let mpCost = 0
  let adenaFee = 0

  $('.recipe_result .stat_line').each((_, line) => {
    const label = $(line).find('.stat_name').text().trim()
    const value = $(line).find('.stat_value').text().trim()

    if (label === 'Success Rate') {
      successRate = parseFloat(value.replace('%', '')) || 0
    } else if (label === 'MP Consume') {
      mpCost = parseInt(value.replace(/\D/g, '')) || 0
    } else if (label.includes('Adena') || label.includes('Fee')) {
      adenaFee = parseInt(value.replace(/\D/g, '')) || 0
    }
  })

  // ── Output item (first "Result" link) ────────────────────────────────
  let outputItemId = ''
  let outputSlug = ''
  let outputName = ''
  let outputIconName = ''

  $('.recipe_result .stat_line').each((_, line) => {
    const label = $(line).find('.stat_name').text().trim()
    if (label !== 'Result') return

    const firstLink = $(line).find('.stat_describe .item-name').first()
    const href = firstLink.attr('href') || ''
    const fullUrl = href.startsWith('http') ? href : `https://wikipedia1.mw2.wiki${href}`

    try {
      const { id: oid, slug: oslug } = parseIdAndSlugFromUrl(fullUrl)
      outputItemId = oid
      outputSlug = oslug
    } catch {
      return
    }

    // Name: .item-name__class-1 or .item-name__class-2
    outputName =
      firstLink.find('.item-name__class-1').text().trim() ||
      firstLink.find('.item-name__class-2').text().trim()

    outputIconName = extractIconName(firstLink.find('.item-icon img').attr('src') || '')
  })

  // ── Fetch output item page to get category ───────────────────────────
  let recipeCategory = null  // null = unknown, will not overwrite existing value in merger
  let recipeSubcategory = ''

  if (outputItemId && outputSlug) {
    try {
      const outputUrl = `https://wikipedia1.mw2.wiki/lu4/item/${outputItemId}-${outputSlug}`
      const outputHtml = await fetchPage(outputUrl)
      if (outputHtml) {
        const $out = cheerio.load(outputHtml)
        const rawType = $out('.item-name__type').first().text().trim()
        ;({ category: recipeCategory, subcategory: recipeSubcategory } = parseItemType(rawType))
      }
    } catch {
      // non-fatal — keep null so merger preserves existing category
    }
  }

  if (outputItemId) {
    pushItem(acc, {
      id: outputItemId,
      slug: outputSlug,
      name: outputName,
      iconName: outputIconName,
      category: 'recipe_output',
      recipeId: id,
    })
  }

  // ── Materials list ────────────────────────────────────────────────────
  // Top-level accordion buttons only (exclude nested .accordion-body ones)
  // Exclude Adena (id=57). For weapon/armor/accessory, include the recipe scroll as first material.
  // Always exclude the scroll itself from the accordion (we add it manually below for non-other)
  const EXCLUDED_IDS = new Set([id, '57'])
  const materials = []

  // For weapon/armor/accessory, add the recipe scroll as first material (qty 1)
  if (recipeCategory !== 'other') {
    materials.push({ itemId: id, quantity: 1, _url: null })
  }

  $('.accordion-button').not('.accordion-body .accordion-button').each((_, btn) => {
    const link = $(btn).find('a.item-name').first()
    const href = link.attr('href') || ''
    if (!href) return

    const fullUrl = href.startsWith('http') ? href : `https://wikipedia1.mw2.wiki${href}`

    let matId, matSlug
    try {
      ;({ id: matId, slug: matSlug } = parseIdAndSlugFromUrl(fullUrl))
    } catch {
      return
    }

    if (EXCLUDED_IDS.has(matId)) return

    // Quantity: prefer data-initial-amount attribute, fall back to text
    const amountEl = $(btn).find('.material-amount')
    const qty =
      parseInt(amountEl.attr('data-initial-amount') || '') ||
      parseInt(amountEl.text().trim()) ||
      1

    const matName =
      link.find('.item-name__class-1').text().trim() ||
      link.find('.item-name__class-2').text().trim() ||
      matSlug.replace(/-/g, ' ')

    const matIconSrc = link.find('.item-icon img').attr('src') || ''

    materials.push({
      itemId: matId,
      quantity: qty,
      _url: fullUrl,
    })

    pushItem(acc, {
      id: matId,
      slug: matSlug,
      name: matName,
      iconName: extractIconName(matIconSrc),
      category: 'material',
      recipeId: null,
    })
  })

  // ── Build recipe object ───────────────────────────────────────────────
  const recipe = {
    id,
    name: recipeName,
    outputItemId: outputItemId || id,
    outputQuantity: 1,
    successRate,
    mpCost,
    adenaFee,
    ...(recipeCategory != null && { category: recipeCategory, subcategory: recipeSubcategory }),
    materials: materials.map((m) => ({ itemId: m.itemId, quantity: m.quantity })),
    scraperUrl: url,
  }

  if (!acc.recipes.find((r) => r.id === id)) {
    acc.recipes.push(recipe)
  }

  console.log(
    `  Recipe: "${recipeName}" | ${materials.length} mats | ${successRate}% success | MP:${mpCost}`,
  )

  // ── Recurse into material pages ───────────────────────────────────────
  if (currentDepth < maxDepth) {
    for (const mat of materials) {
      if (!mat._url) continue
      await scrapeUrl(mat._url, maxDepth, currentDepth + 1, acc)
    }
  }
}

function parseItemPage($, id, slug, _url, acc) {
  const titleEl = $('.item_title .item-name__content').first().clone()
  titleEl.find('span').remove()
  const name = titleEl.text().trim() || slug.replace(/-/g, ' ')

  const iconSrc = $('.item-icon img').first().attr('src') || ''

  pushItem(acc, {
    id,
    slug,
    name,
    iconName: extractIconName(iconSrc),
    category: 'material',
    recipeId: null,
  })

  console.log(`  Item: "${name}"`)
}

function extractIconName(src) {
  if (!src) return ''
  // "/i64/weapon_hazard_bow_i00.png" → "weapon_hazard_bow_i00"
  const match = src.match(/\/i64\/(.+?)\.png/)
  return match ? match[1] : ''
}

function pushItem(acc, item) {
  const existing = acc.items.find((i) => i.id === item.id)
  if (!existing) {
    acc.items.push(item)
  } else {
    if (!existing.iconName && item.iconName) existing.iconName = item.iconName
    if (item.recipeId) existing.recipeId = item.recipeId
    if (item.category !== 'material') existing.category = item.category
  }
}
