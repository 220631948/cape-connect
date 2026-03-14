---
name: tile-optimization
description: PMTiles/MVT tile optimization for mobile PWA; Tippecanoe flags, zoom level guidance, layer Z-order, and offline caching strategy.
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T10:39:43Z
---

# Tile Optimization Skill

## Purpose
Generate optimally-sized PMTiles archives and Martin MVT layers for a mobile-first PWA serving the Cape Town metro area (~1,200 km²). Balances visual fidelity against offline cache budget and mobile bandwidth.

## Trigger
Invoke when:
- Generating a new PMTiles archive from GeoJSON/Shapefile source data
- Configuring a new Martin tile source in `docker-compose.yml` or martin config
- Deciding zoom levels for a new map layer
- Diagnosing slow tile load or large offline cache size

## Procedure

### Step 1 — Tippecanoe Flags by Layer Type

**Suburb boundaries (polygon, low detail):**
```bash
tippecanoe \
  --output=public/tiles/suburbs.pmtiles \
  --minimum-zoom=8 --maximum-zoom=14 \
  --simplification=4 \
  --coalesce-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --layer=suburbs \
  input/suburbs.geojson
```

**Cadastral parcels (polygon, high detail):**
```bash
tippecanoe \
  --output=public/tiles/cadastral.pmtiles \
  --minimum-zoom=14 --maximum-zoom=18 \
  --no-tile-size-limit \
  --simplification=1 \
  --layer=cadastral \
  input/cadastral.geojson
```

**Roads / linear features:**
```bash
tippecanoe \
  --output=public/tiles/roads.pmtiles \
  --minimum-zoom=10 --maximum-zoom=16 \
  --simplification=2 \
  --drop-densest-as-needed \
  --layer=roads \
  input/roads.geojson
```

**Point features (schools, health, etc.):**
```bash
tippecanoe \
  --output=public/tiles/points.pmtiles \
  --minimum-zoom=10 --maximum-zoom=18 \
  --cluster-densest-as-needed \
  --cluster-distance=10 \
  --layer=points \
  input/points.geojson
```

### Step 2 — Zoom Level Reference Table
| Layer | minzoom | maxzoom | Notes |
|-------|---------|---------|-------|
| Basemap (CartoDB) | 0 | 19 | CDN-served |
| Suburb boundaries | 8 | 14 | Show labels ≥ 10 |
| Zoning overlay | 10 | 18 | Opacity 0.3 |
| Risk overlays | 10 | 18 | Toggle only |
| Cadastral parcels | 14 | 18 | **CLAUDE.md Rule** |
| User draw layer | 0 | 22 | Always on top |

### Step 3 — Layer Z-Order (MapLibre `beforeId`)
Apply layers in this order, bottom to top:
```
1. basemap (CartoDB Raster / Dark Matter)
2. suburbs-fill
3. suburbs-line
4. zoning-fill
5. zoning-line
6. cadastral-fill       ← zoom ≥ 14 only
7. cadastral-line
8. risk-overlay-fill
9. risk-overlay-line
10. user-draw-polygon
11. user-draw-line
12. user-draw-point     ← top
```

### Step 4 — PMTiles Offline Cache Strategy (Serwist)
```typescript
// In serwist service worker config
import { PrecacheStrategy } from 'serwist';

// Pre-cache only zoom 8–12 for offline metro coverage (~15 MB)
const OFFLINE_TILE_ZOOMS = [8, 9, 10, 11, 12];
const CAPE_TOWN_BBOX = [18.0, -34.5, 19.5, -33.0];
```

Target offline cache budgets:
- Suburbs PMTiles: < 2 MB
- Zoning PMTiles: < 5 MB
- Cadastral PMTiles (z14–16 metro only): < 30 MB

### Step 5 — Martin Configuration Check
Add `?optimize=true` to all Martin source URLs per CLAUDE.md §5:
```typescript
const sourceUrl = `${process.env.MARTIN_URL}/[layer]/{z}/{x}/{y}?optimize=true`;
```

Verify Martin config includes `clip_geoms: true` and `buffer: 64`.

## Output Format
```
Tile optimization: [layer]
  Archive: [filename].pmtiles ([size] MB)
  Zoom range: [min]–[max]
  Feature count: [N]
  Estimated mobile load time (3G): [Xs]
  Offline cache impact: [MB]
```

## When NOT to Use This Skill
- Basemap tiles (served by CartoDB CDN — never self-host)
- Raster satellite tiles (toggled via `MAPBOX_TOKEN` env var — Mapbox serves these)
- Layers with > 10,000 client-side features (switch to Martin MVT, do not use PMTiles client-side)
