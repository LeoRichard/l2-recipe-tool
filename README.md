# L2 Recipe Tracker

A web app to plan and track crafting recipes in Lineage 2 (private server). Manage your inventory, calculate bill of materials per recipe, track adena costs, and discover full crafting chains via a wiki scraper.

![Stack](https://img.shields.io/badge/React-18-blue) ![Stack](https://img.shields.io/badge/TypeScript-5-blue) ![Stack](https://img.shields.io/badge/Vite-6-purple) ![Stack](https://img.shields.io/badge/Tailwind-3-teal)

---

## Features

- **My Crafts** — Add recipes to a personal list; each one shows its own BOM (bill of materials) with cost summary and completion progress
- **Shared inventory** — One global inventory depleted top-to-bottom across all crafts, just like in-game
- **Recursive BOM engine** — Automatically expands sub-recipes (e.g. Craftsman Mold → Artisan's Frame → Steel Mold) up to 4 levels deep
- **Adena cost tracking** — Set market prices per material; see total cost, already invested, and still to buy per recipe
- **Market Prices** — Global price catalog for all materials, independent of recipes
- **Inventory management** — Track quantities of every material you own
- **Export / Import** — Save and restore your full state as a JSON file
- **Wiki scraper + discovery agent** — Scrape recipe data from the wiki and recursively discover all sub-recipes in a crafting chain

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 3 (custom dark gaming theme) |
| State | Zustand 5 with localStorage persistence |
| Scraper | Node.js + cheerio + node-fetch |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

```bash
# Production build
npm run build
```

---

## Scraper

Recipe data is stored in `src/data/items.json` and `src/data/recipes.json`. The scraper populates these from the wiki.

### Scrape a single recipe

```bash
cd scraper
npm install
node scrape.js --url https://wikipedia1.mw2.wiki/lu4/item/4199-recipe-bow-of-peril-100
```

### Discover full recipe chain (recommended)

The discovery agent scrapes a recipe and recursively follows all sub-recipes, rate-limited at ~1200ms per request.

```bash
cd scraper
node discover.js --url https://wikipedia1.mw2.wiki/lu4/item/4199-recipe-bow-of-peril-100
```

Options:
- `--max-pages 60` — Safety cap on pages fetched (default: 60)
- `--dry-run` — Discover without saving to database

The agent is **resume-safe** — it skips recipes already in the database.

---

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── crafts/       # My Crafts list with per-recipe BOM
│   │   ├── recipes/      # Recipe browser
│   │   ├── inventory/    # Inventory management
│   │   ├── prices/       # Market prices catalog
│   │   ├── layout/       # AppShell, Sidebar, TopBar
│   │   └── shared/       # ItemIcon, AdenaIcon, Modal
│   ├── data/
│   │   ├── items.json    # Item database (scraped)
│   │   └── recipes.json  # Recipe database (scraped)
│   ├── lib/
│   │   ├── bomEngine.ts  # Recursive BOM calculator
│   │   ├── dataLoader.ts # Loads JSON databases
│   │   └── exportImport.ts
│   ├── store/
│   │   └── appStore.ts   # Zustand global store
│   └── types/index.ts
└── scraper/
    ├── discover.js       # BFS recipe discovery agent
    ├── scrape.js         # Single recipe scraper CLI
    ├── parser.js         # HTML → recipe data
    ├── fetcher.js        # Rate-limited HTTP fetcher
    └── merger.js         # Non-destructive DB merge
```

---

## Data Sources

Recipe data scraped from [wikipedia1.mw2.wiki](https://wikipedia1.mw2.wiki) — a Lineage 2 private server wiki. Scraping is rate-limited and respectful of the server.
