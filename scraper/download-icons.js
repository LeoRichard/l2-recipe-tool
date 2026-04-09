/**
 * Downloads all item icons from the wiki CDN into public/icons/
 * Run from the scraper directory: node download-icons.js
 */

import fetch from 'node-fetch'
import { createWriteStream, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
import { pipeline } from 'stream/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ITEMS_PATH = resolve(__dirname, '../src/data/items.json')
const OUT_DIR    = resolve(__dirname, '../public/icons')
const CDN_BASE   = 'https://wikipedia1.mw2.wiki/i64/'
const DELAY_MS   = 300

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function downloadIcon(iconName) {
  const url      = `${CDN_BASE}${iconName}.png`
  const outPath  = resolve(OUT_DIR, `${iconName}.png`)

  if (existsSync(outPath)) {
    console.log(`  ✓ skip  ${iconName}`)
    return
  }

  const res = await fetch(url, {
    headers: { 'User-Agent': 'L2RecipeTracker/1.0 (personal crafting tool)' },
  })

  if (!res.ok) {
    console.warn(`  ✗ fail  ${iconName} (HTTP ${res.status})`)
    return
  }

  await pipeline(res.body, createWriteStream(outPath))
  console.log(`  ↓ saved ${iconName}`)
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  const items = JSON.parse(readFileSync(ITEMS_PATH, 'utf8'))
  const icons = [...new Set(items.items.map((i) => i.iconName).filter(Boolean))]

  console.log(`Downloading ${icons.length} icons to public/icons/\n`)

  for (const icon of icons) {
    await downloadIcon(icon)
    await sleep(DELAY_MS)
  }

  console.log('\nDone.')
}

main().catch(console.error)
