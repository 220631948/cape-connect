# Phase J — PWA Artifact Integration Specification
## CapeTown GIS Research Lab → Product Pipeline

> Maps research experiment outputs to MapLibre / PMTiles / PWA product features.  
> Status: SPECIFICATION  
> Last updated: 2026-03-09

---

## 1. Experiment Output → Product Feature Mapping

| Experiment | Output Artifact | Product Feature | Layer Z-order | Badge |
|------------|-----------------|-----------------|:-------------:|-------|
| EXP-001 | `boundary_comparison.geojson` | Suburb boundary QA overlay | 4 (Suburbs) | `[CoCT Cadastral 2023 · CACHED · MOCK]` |
| EXP-002 | `predictions.tif` (raster) | Land-use change raster overlay | 2 (Risk overlays) | `[Sentinel-2 2024 · CACHED]` |
| EXP-003 | `flood_risk_suburbs.geojson` | Flood-risk choropleth overlay | 2 (Risk overlays) | `[CoCT DEM 2020 · CACHED]` |
| EXP-004 | `lisa_flagged_erfs.csv` | Valuation anomaly parcel layer | 3 (Cadastral) | `[GV Roll 2022 · CACHED]` — ANALYST+ only |

---

## 2. Vector Tile Packaging (PMTiles)

Research GeoJSON outputs are packaged as PMTiles for offline-first delivery:

```bash
# EXP-001 — boundary QA overlay
tippecanoe \
  --output research-lab/artifacts/EXP-001/boundary_qa.pmtiles \
  --layer boundary_qa \
  --minimum-zoom 8 \
  --maximum-zoom 14 \
  --simplification 4 \
  --drop-densest-as-needed \
  research-lab/experiments/EXP-001/results/boundary_comparison.geojson

# EXP-003 — flood risk (suburb polygons)
tippecanoe \
  --output research-lab/artifacts/EXP-003/flood_risk.pmtiles \
  --layer flood_risk_suburbs \
  --minimum-zoom 8 \
  --maximum-zoom 12 \
  --simplification 8 \
  research-lab/experiments/EXP-003/results/flood_risk_suburbs.geojson

# EXP-004 — valuation anomaly (parcel polygons, zoom-gated)
tippecanoe \
  --output research-lab/artifacts/EXP-004/valuation_anomaly.pmtiles \
  --layer valuation_anomaly \
  --minimum-zoom 14 \
  --maximum-zoom 18 \
  --no-feature-limit \
  research-lab/experiments/EXP-004/results/lisa_map.geojson
```

### PMTiles Upload to Supabase Storage

```typescript
// app/src/lib/research/upload-pmtiles.ts
import { createClient } from '@supabase/supabase-js'

export async function uploadResearchTiles(
  expId: string,
  filePath: string,
  bucketPath: string
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const fileBuffer = await fs.readFile(filePath)
  await supabase.storage
    .from('research-tiles')
    .upload(bucketPath, fileBuffer, {
      contentType: 'application/vnd.pmtiles',
      upsert: true,
    })
}
```

---

## 3. MapLibre Layer Integration

```typescript
// Research layer registration pattern — follows existing layer Z-order
// app/src/lib/map/research-layers.ts

export function addFloodRiskLayer(map: maplibregl.Map): void {
  map.addSource('flood-risk-research', {
    type: 'vector',
    url: 'pmtiles://https://storage.supabase.co/research-tiles/EXP-003/flood_risk.pmtiles',
  })

  map.addLayer({
    id: 'flood-risk-fill',
    type: 'fill',
    source: 'flood-risk-research',
    'source-layer': 'flood_risk_suburbs',
    minzoom: 8,
    maxzoom: 18,
    paint: {
      'fill-color': [
        'interpolate', ['linear'], ['get', 'risk_score'],
        0.0, '#1a9850',
        0.5, '#fee08b',
        1.0, '#d73027'
      ],
      'fill-opacity': 0.6,
    },
  }, 'zoning-layer')  // Insert below zoning (Z-order: risk overlays = position 2)
}
```

### Data Badge Component

Every research-sourced layer must display a badge (CLAUDE.md Rule 1):

```tsx
// app/src/components/map/ResearchDataBadge.tsx
interface ResearchBadgeProps {
  expId: string
  sourceDesc: string
  year: string
  status: 'LIVE' | 'CACHED' | 'MOCK'
}

export function ResearchDataBadge({ expId, sourceDesc, year, status }: ResearchBadgeProps) {
  return (
    <div className="absolute bottom-8 left-2 z-10 text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
      [{sourceDesc} · {year} · {status}] | {expId}
    </div>
  )
}
```

---

## 4. RBAC Gating for Research Layers

| Layer | Minimum Role | Rationale |
|-------|:------------:|-----------|
| Flood risk overlay | VIEWER | Public risk information |
| Land-use change | ANALYST | Requires data literacy |
| Valuation anomaly | ANALYST | Financial sensitivity |
| EXP-004 raw scores | POWER_USER | Valuation QA workflows |

```typescript
// app/src/lib/research/layer-permissions.ts
export const RESEARCH_LAYER_MIN_ROLES = {
  'flood-risk': 'VIEWER',
  'land-use-change': 'ANALYST',
  'valuation-anomaly': 'ANALYST',
  'valuation-anomaly-raw': 'POWER_USER',
} as const
```

---

## 5. Three-Tier Fallback for Research Layers

All research layers follow CLAUDE.md Rule 2:

```
LIVE   → PMTiles from Supabase Storage (post-experiment run)
CACHED → api_cache table (last valid experiment result)
MOCK   → public/mock/research/EXP-NNN-mock.geojson
```

```bash
# Create mock fallback files
mkdir -p app/public/mock/research
cp research-lab/experiments/EXP-001/results/boundary_comparison.geojson \
   app/public/mock/research/exp-001-boundary-qa.geojson
cp research-lab/experiments/EXP-003/results/flood_risk_suburbs.geojson \
   app/public/mock/research/exp-003-flood-risk.geojson
```

---

## 6. CI Pipeline Specification

`.github/workflows/research-integration.yml` (to be created at M4 integration):

```yaml
name: Research Artifact Integration

on:
  workflow_dispatch:
    inputs:
      exp_id:
        description: 'Experiment ID (e.g. EXP-003)'
        required: true

jobs:
  validate-and-package:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate GeoJSON geometry (Cape Town bbox)
        run: |
          python scripts/validate_bbox.py \
            research-lab/experiments/${{ github.event.inputs.exp_id }}/results/
      - name: Strip PII assertion
        run: |
          python scripts/assert_no_pii.py \
            research-lab/experiments/${{ github.event.inputs.exp_id }}/results/
      - name: Package PMTiles
        run: |
          bash research-lab/phases/J-pwa-integration/package-tiles.sh \
            ${{ github.event.inputs.exp_id }}
      - name: Upload to Supabase Storage
        env:
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
        run: |
          node scripts/upload-research-tiles.mjs \
            ${{ github.event.inputs.exp_id }}
```
