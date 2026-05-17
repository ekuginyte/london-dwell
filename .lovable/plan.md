
# London House-Hunting Map — POC Plan

A web app that overlays London with light, layered desirability data so you can visually narrow down where to live. Starts as map + overlays + local pins; AI extraction and PDF export come in a later phase.

## What you'll see first

A clean light-themed map of London. A left sidebar of filters: set a work postcode and max commute, pick minimum Ofsted rating, toggle parks proximity, drop a custom radius pin (e.g. around family), draw "avoid" polygons. Each LSOA (small statistical area, ~1500 people, ~4800 across London) is shaded:

- **Filter mode**: only LSOAs passing ALL active filters stay lit, everything else fades to pale grey.
- **Heatmap mode**: every LSOA gets a 0–100 desirability score blended from your weighted sliders, drawn as a soft green→amber gradient.

You can then click any lit area to drop a property pin, label it, and save it (browser storage).

## Tech stack

- **Map**: MapLibre GL JS + free light tiles (Stadia "alidade smooth" or Maptiler basic). No vendor lock-in.
- **Frontend**: existing TanStack Start + React 19 + Tailwind v4 stack.
- **Geospatial**: turf.js for client-side polygon ops (point-in-polygon, buffer, intersect).
- **State**: Zustand for filter state; localStorage for saved pins.
- **Server**: TanStack `createServerFn` to proxy TfL Journey Planner (hides token, caches responses). No DB yet — POC is fully client + edge functions.

## Data sources (all free & legal)

| Layer | Source | License | Notes |
|---|---|---|---|
| LSOA boundaries | ONS Open Geography Portal | OGL | Download once, ship as compressed GeoJSON (~2MB gzipped for London) |
| Commute | TfL Unified API / Journey Planner | Free with API key | Public transport only, perfect for London |
| Schools | GOV.UK "Get Information About Schools" + Ofsted ratings | OGL | CSV → preprocess to per-LSOA aggregate |
| Parks | OpenStreetMap (`leisure=park`, `leisure=garden`) | ODbL | One-off Overpass query, ship as GeoJSON |
| Crime (later) | data.police.uk | Open | Per-LSOA monthly counts |

All static data is preprocessed once at build time into `public/data/` so the runtime makes zero scraping calls.

## Architecture

```text
┌─────────────────────────────────────────────┐
│  Browser                                    │
│  ┌────────────┐  ┌──────────────────────┐   │
│  │ Filter UI  │→ │ Zustand filter store │   │
│  └────────────┘  └──────────┬───────────┘   │
│                             ↓                │
│  ┌──────────────────────────────────────┐   │
│  │  Desirability engine (turf.js)       │   │
│  │  - per-LSOA score 0..100             │   │
│  │  - or boolean pass/fail              │   │
│  └──────────────┬───────────────────────┘   │
│                 ↓                            │
│  ┌──────────────────────────────────────┐   │
│  │  MapLibre GL                         │   │
│  │  - LSOA fill layer (data-driven)     │   │
│  │  - Parks layer  - Avoid polygons     │   │
│  │  - Radius circle - Property pins     │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Static GeoJSON: LSOAs, schools, parks      │
│  localStorage: pins, saved filter presets   │
└────────────────┬────────────────────────────┘
                 │ only when commute filter changes
                 ↓
┌─────────────────────────────────────────────┐
│  Server fn: getCommuteIsochrone(postcode,   │
│  maxMinutes) — proxies TfL, caches result   │
└─────────────────────────────────────────────┘
```

## Build phases

### Phase 1 — Data prep (one-off scripts in `scripts/`)
1. Download LSOA 2021 boundaries (London only) → simplify with mapshaper to ~50% → write `public/data/lsoa-london.geojson`.
2. Download GIAS schools CSV + Ofsted ratings → join → bucket each school into its LSOA → write `public/data/schools-by-lsoa.json` (LSOA code → `{count, avgRating, nearestOutstanding}`).
3. Overpass query for London parks → `public/data/parks.geojson`.

### Phase 2 — Map shell
- New route `src/routes/index.tsx` becomes the map app.
- `MapView` component mounts MapLibre, loads LSOA + parks GeoJSON as sources.
- Light tile style, custom palette using existing oklch tokens.

### Phase 3 — Filter sidebar + desirability engine
- Sidebar with: commute postcode + max minutes slider; min Ofsted rating; parks-within-X-metres toggle; custom radius pin (drop on map, adjust km); draw-avoid-polygon tool; mode toggle (Filter / Heatmap); weight sliders (heatmap mode only).
- Pure function `computeDesirability(lsoas, filters, datasets) → Map<lsoaCode, {score, passes, reasons}>`.
- MapLibre `setPaintProperty` with `case` / `interpolate` expressions to colour fills from the score.

### Phase 4 — Commute integration
- Server fn `getCommuteMinutesFromPostcode(targetPostcode)` returns a `Map<lsoaCode, minutes>`.
- Strategy: pick LSOA centroid → batch-query TfL Journey Planner for each → cache aggressively (response keyed by target postcode; results are stable enough to cache for days). For POC, cache in-memory per server instance plus a localStorage layer; production would use Redis/KV.
- Show progress bar; degrade gracefully if rate-limited.

### Phase 5 — Property pins
- Click on map (in pin-drop mode) → modal: label, optional URL, notes → save to localStorage.
- Pins render as custom markers; clicking opens a side panel.
- Export/import pins as JSON for backup.

## File structure

```text
src/
  routes/index.tsx                   → map app
  components/map/
    MapView.tsx                      → MapLibre setup
    FilterSidebar.tsx
    DesirabilityLegend.tsx
    PinPanel.tsx
    DrawAvoidTool.tsx
  lib/
    desirability.ts                  → pure scoring engine
    filters.store.ts                 → Zustand
    pins.store.ts                    → Zustand + localStorage
    tfl.functions.ts                 → createServerFn for commute
    tfl.server.ts                    → TfL API helpers (server-only)
public/data/
  lsoa-london.geojson
  schools-by-lsoa.json
  parks.geojson
scripts/
  build-lsoa.ts
  build-schools.ts
  build-parks.ts
```

## Secrets

- `TFL_APP_KEY` — free key from api.tfl.gov.uk. Added via Lovable Cloud secrets after Phase 4 is wired (not needed for Phases 1–3).

## What's deliberately out of scope for this POC

- AI URL extraction, PDF export, crime heatmap, user accounts, sync, mobile/SwiftUI. The full blueprint document covering monetisation, marketing, roadmap and SwiftUI architecture can be produced as a separate deliverable once you've validated the core map feels right.

## Open question I'll resolve as I build

LSOA-level commute querying means ~4800 TfL calls if you change postcode — too many. Plan: query a coarser ~500m grid of representative centroids (~600 points), then map each LSOA to its nearest grid cell. Same visual result, 8× fewer API calls, easily fits in TfL's free tier with caching.
