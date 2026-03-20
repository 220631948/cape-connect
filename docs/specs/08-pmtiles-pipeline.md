# PMTiles Generation Pipeline

> **TL;DR:** Produces offline-ready, single-file PMTiles archives from PostGIS via Martin bulk export (`martin-cp`) → MBTiles → `pmtiles convert` → S3/Supabase Storage. Sanitised views exclude all PII. Total budget ~270MB for Cape Town datasets. CI validates generation and POPIA compliance.

| Field | Value |
|-------|-------|
| **Milestone** | M4c — Serwist PWA / Offline |
| **Status** | Draft |
| **Depends on** | M4b (Martin MVT Integration), M1 (PostGIS Schema) |
| **Architecture refs** | [ADR-003](../architecture/ADR-003-tile-server.md), [tile-layer-architecture](../architecture/tile-layer-architecture.md) |

## Overview
The PMTiles pipeline creates an offline-ready, single-file tile archive from PostGIS spatial data.
It flows through Martin for vector tiles, tippecanoe for optimisation, and uploads to S3 for distribution.

## Pipeline Steps

```mermaid
flowchart LR
    A["PostGIS<br/>(spatial tables)"] --> B["Martin<br/>(MVT on-the-fly)"]
    B --> C["martin-cp<br/>(bulk export)"]
    C --> D["MBTiles file"]
    D --> E["pmtiles convert"]
    E --> F["PMTiles archive"]
    F --> G["S3 / LocalStack"]
    G --> H["Browser IndexedDB<br/>or Native filesystem"]
```

### Step 1: Create Sanitised PostGIS Views
```sql
-- View excludes ALL personal data — only geometry and public attributes
CREATE VIEW tiles_izs_zones AS
SELECT zone_code, zone_description, geom
FROM izs_zones;
-- NO owner_name, NO tenant-specific data
```

### Step 2: Export via martin-cp
```bash
martin-cp \
  --source "postgres://gis_admin:gis_password@localhost:5432/gis_platform" \
  --output izs_zones.mbtiles \
  --minzoom 10 --maxzoom 18 \
  --bbox 18.3252,-34.3577,19.0186,-33.4836   # Cape Town Metro bbox
```

### Step 3: Convert to PMTiles
```bash
pmtiles convert izs_zones.mbtiles izs_zones.pmtiles
```

### Step 4: Upload to Storage
```bash
# LocalStack (local dev)
awslocal s3 cp izs_zones.pmtiles s3://map-tiles/izs_zones.pmtiles

# Production (Supabase Storage or Cloudflare R2)
aws s3 cp izs_zones.pmtiles s3://map-tiles/izs_zones.pmtiles
```

### Step 5: Client Consumption
The PWA reads PMTiles via the `pmtiles://` protocol adapter for MapLibre GL JS.
Files are cached in IndexedDB for offline access.

## Storage Budget

| Dataset | Estimated Size | Update Frequency |
|---|---|---|
| IZS Zoning polygons | ~50 MB | Weekly |
| Suburb boundaries | ~20 MB | Monthly |
| Cadastral parcels (no PII) | ~200 MB | Monthly |
| **Total** | **~270 MB** | — |

## Data Source Badge (Rule 1)
- PMTiles-served layers show: `[PMTiles · 2026 · CACHED]`
- Badge visible in the layer panel without hovering

## Three-Tier Fallback (Rule 2)
- PMTiles are the **Tier 2 (CACHED)** component of the three-tier fallback
- If PMTiles file is corrupted or missing: fall back to **Tier 3 (MOCK)** static GeoJSON

## Edge Cases
- **Corrupted PMTiles file:** SHA-256 checksum mismatch on download → re-download; never serve corrupt tiles
- **Storage quota exceeded:** IndexedDB full → warn user; evict oldest PMTiles first
- **Concurrent generation:** Two CI jobs generate PMTiles simultaneously → use file locking or sequential pipeline
- **Bbox drift:** Cape Town metro bbox changes → update `--bbox` in pipeline script; validate against `CLAUDE.md` §Rule 9
- **Zero-feature output:** Source view returns no rows → fail pipeline; do not upload empty PMTiles

## Failure Modes

| Failure | User Experience | Recovery |
|---------|----------------|----------|
| `martin-cp` connection timeout | CI pipeline fails | Retry with increased timeout; check PostGIS health |
| `pmtiles convert` OOM | Build fails on large datasets | Increase CI runner memory or reduce `--maxzoom` |
| S3 upload fails | Old PMTiles remain in production | Retry upload; alert on consecutive failures |
| IndexedDB eviction (iOS) | Offline tiles unavailable | Re-download on next Wi-Fi connection |

## Security Considerations
- PMTiles must be generated from sanitised views only — SQL verification step in CI
- S3 bucket should have public read / no write for tile consumers
- No credentials embedded in PMTiles metadata

## Performance Budget

| Metric | Target |
|--------|--------|
| Full pipeline (PostGIS → S3) | < 30 minutes |
| PMTiles file size (full Cape Town) | ≤ 300MB |
| Single tile read from PMTiles | < 50ms (local), < 200ms (S3 range request) |
| CI validation step | < 5 minutes |

## POPIA Constraint

> [!CAUTION]
> PMTiles MUST be generated from **sanitised views only**. No owner names, no personal data, no tenant-specific information. Verify with:
> ```sql
> SELECT column_name FROM information_schema.columns
> WHERE table_name = 'tiles_izs_zones' AND column_name IN ('owner_name', 'email', 'phone');
> -- Must return 0 rows
> ```

## Acceptance Criteria
- ✅ PMTiles file ≤ 300 MB for full Cape Town parcel dataset
- ✅ No personal data present in generated tiles (SQL verification)
- ✅ Tiles load in PWA offline mode within 200 ms after first cache
- ✅ CI step validates PMTiles generation
- ✅ Bbox clipped to Cape Town Metro (per `CLAUDE.md §9` (Geographic Scope))
