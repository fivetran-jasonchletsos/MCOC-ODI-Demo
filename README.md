# MCOC-ODI-Demo

Advanced roster analysis for Marvel Contest of Champions. Click a champion, an ability, or a condition — get counters, supercounters, immunity pairs, debuff-stack chains, and (with roster loaded) coverage-gap analysis.

Not a wiki. Not a tier list. The point is the joins between champions: which abilities counter how many top defenders, which immunity profiles complement each other, which debuff appliers set up which exploiters. Insights you can't get from a flat tier list.

## What it gives you

- **Ability supercounters** — single abilities ranked by how many top defenders they counter. Petrify covers 46 top defenders; Nullify/Stagger/Buff Duration Reduction tie at 42.
- **Per-champion counters** — for each defender, the 10 best counters from the full roster, scored by ability matching + immunity matching + class wheel.
- **Immunity complementarity pairs** — 200+ pre-computed pairs whose immunity profiles uniquely cover each other (answer to "who do I bring as my 2nd").
- **Debuff-stack chains** — applier → exploiter relationships (Shock → Heatsink, Stagger → Petrify, Armor Break → Incinerate).
- **Counter-coverage gaps (roster-aware)** — once you load your roster, surfaces top defenders no champion of yours scores against.
- **Per-roster supercounters** — your roster's offensive tool kit ranked by leverage.

## Data

- Scraped from the [MCOC Fandom wiki](https://marvel-contestofchampions.fandom.com/) via the MediaWiki `api.php` (the HTML is Cloudflare-blocked but the API is open).
- 295 champions, 347 unique abilities, 117 debuffs catalogued.
- All 294 champion portraits downloaded locally; the app works offline.
- Counter knowledge encoded as seed CSVs in `transform/seeds/`. Hand-curated MCOC archetype mappings — that's the unique IP.

## Build

```
# 1. Scrape the wiki (one-time; cached after)
python3 scripts/scrape_wiki.py

# 2. Compute the app's data layer
python3 scripts/build_app_data.py

# 3. Build the static site
cd mcoc-app && npm install && npm run build
```

Output: `mcoc-app/out/` — a fully static site, ~200KB initial JS, deployable anywhere.

## Repo shape

- `connectors/` — Fivetran-style ingest spec (placeholder for the demo's ODI story)
- `infra/` — deployment IaC
- `scripts/` — Python scrapers and builders
- `transform/` — dbt seeds and models for the live-build playback
- `mcoc-app/` — Next.js 14 static-export frontend
- `data/raw/` — gitignored scraper cache + wikitext cache

## Acknowledgments

Data from the MCOC fandom wiki community. Not affiliated with Kabam or Marvel.
