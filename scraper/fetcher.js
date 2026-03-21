import fetch from 'node-fetch'

const DELAY_MS = 800
const visited = new Set()
let lastFetch = 0

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchPage(url) {
  if (visited.has(url)) return null
  visited.add(url)

  const now = Date.now()
  const wait = DELAY_MS - (now - lastFetch)
  if (wait > 0) await sleep(wait)
  lastFetch = Date.now()

  console.log(`  Fetching: ${url}`)
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'L2RecipeTracker/1.0 (personal crafting tool)',
      Accept: 'text/html',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

export function parseIdAndSlugFromUrl(url) {
  // "https://wikipedia1.mw2.wiki/lu4/item/1234-some-item-name"
  const match = url.match(/\/item\/(\d+)-(.+?)(?:\?|$)/)
  if (!match) throw new Error(`Cannot parse item URL: ${url}`)
  return { id: match[1], slug: match[2] }
}

export function buildItemUrl(id, slug) {
  return `https://wikipedia1.mw2.wiki/lu4/item/${id}-${slug}`
}
