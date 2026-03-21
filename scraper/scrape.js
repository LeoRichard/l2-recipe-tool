/**
 * L2 Recipe Scraper
 *
 * Usage:
 *   node scrape.js --url "https://wikipedia1.mw2.wiki/lu4/item/4199-recipe-bow-of-peril-100"
 *   node scrape.js --batch urls.txt    (one URL per line)
 *   node scrape.js --depth 2 --url ... (limit recursive depth, default 3)
 */

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { readFileSync } from 'fs'
import { scrapeRecipePage } from './parser.js'
import { mergeIntoDatabase } from './merger.js'

const argv = yargs(hideBin(process.argv))
  .option('url', { type: 'string', description: 'Single recipe URL to scrape' })
  .option('batch', { type: 'string', description: 'Path to text file with one URL per line' })
  .option('depth', { type: 'number', default: 3, description: 'Max recursive depth for sub-materials' })
  .help()
  .argv

async function main() {
  let urls = []

  if (argv.batch) {
    urls = readFileSync(argv.batch, 'utf8')
      .trim()
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  } else if (argv.url) {
    urls = [argv.url]
  } else {
    console.error('Provide --url <url> or --batch <file>')
    process.exit(1)
  }

  console.log(`Scraping ${urls.length} recipe(s) with depth=${argv.depth}...\n`)

  for (const url of urls) {
    console.log(`\nProcessing: ${url}`)
    try {
      const result = await scrapeRecipePage(url, argv.depth)
      mergeIntoDatabase(result)
      console.log(`  Done: ${result.items.length} items, ${result.recipes.length} recipes discovered`)
    } catch (err) {
      console.error(`  Error: ${err.message}`)
    }
  }

  console.log('\nAll done!')
}

main()
