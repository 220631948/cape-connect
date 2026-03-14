---
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
---

# ArcGIS & QGIS Data Integration Guide

## Supported Formats

| Format | Extension(s) | Notes |
|--------|-------------|-------|
| Shapefile | `.shp`, `.dbf`, `.shx`, `.prj` | All 4 files required; `.cpg` for encoding |
| File Geodatabase | `.gdb` (directory) | ESRI proprietary; use `ogr2ogr` to read |
| QGIS Project | `.qgz` | Contains styles + layer refs, not geometry |
| GeoPackage | `.gpkg` | Preferred open format; single-file SQLite |
| GeoJSON | `.geojson`, `.json` | Native web format; always EPSG:4326 |
| KML/KMZ | `.kml`, `.kmz` | Google Earth; always WGS84 |

## Upload Pipeline

```
validate → detect CRS → reproject to EPSG:4326 → import to PostGIS → validate geometry
```

### Step 1 — Validate Input
```bash
# Check shapefile completeness
ls cadastral.{shp,dbf,shx,prj}

# Inspect with ogrinfo
ogrinfo -so cadastral.shp cadastral
```

### Step 2 — Detect CRS
```bash
# Read .prj or embedded CRS
ogrinfo -so cadastral.shp cadastral | grep "Layer SRS"
# Expected for Cape Town: EPSG:22279 (Lo19) or EPSG:4326
```

### Step 3 — Reproject to EPSG:4326
```bash
ogr2ogr -t_srs EPSG:4326 output.shp input.shp
```

### Step 4 — Import to PostGIS
```bash
# Option A: ogr2ogr (preferred)
ogr2ogr -f "PostgreSQL" \
  PG:"host=localhost dbname=capegis user=postgres" \
  cadastral.shp \
  -nln cadastral_parcels \
  -t_srs EPSG:4326 \
  -lco GEOMETRY_NAME=geom \
  -lco FID=id \
  -lco PRECISION=NO \
  -progress

# Option B: shp2pgsql
shp2pgsql -s 22279:4326 -I cadastral.shp cadastral_parcels | psql -d capegis
```

### Step 5 — Validate Geometry
```sql
-- Check SRID
SELECT DISTINCT ST_SRID(geom) FROM cadastral_parcels;
-- Must return 4326

-- Check for invalid geometries
SELECT id, ST_IsValidReason(geom)
FROM cadastral_parcels
WHERE NOT ST_IsValid(geom);

-- Fix invalid geometries
UPDATE cadastral_parcels
SET geom = ST_MakeValid(geom)
WHERE NOT ST_IsValid(geom);

-- Verify bounding box within Cape Town
SELECT id FROM cadastral_parcels
WHERE NOT ST_Within(geom, ST_MakeEnvelope(18.0, -34.5, 19.5, -33.0, 4326));
```

## CRS Handling Rules

> **CLAUDE.md §2:** Storage EPSG:4326, rendering EPSG:3857. Never mix without explicit reprojection.

| Source CRS | Description | Action |
|-----------|-------------|--------|
| EPSG:4326 | WGS 84 | Direct import |
| EPSG:22279 | Lo19 (Cape Town) | Reproject via `ogr2ogr -t_srs EPSG:4326` |
| EPSG:22277 | Lo17 | Reproject — check for Western Cape data |
| EPSG:3857 | Web Mercator | Reproject — never store in 3857 |
| Unknown | Missing `.prj` | STOP — request CRS from data provider |

## Feature Count Thresholds

| Count | Strategy |
|-------|----------|
| < 1,000 | GeoJSON via Supabase REST |
| 1,000 – 10,000 | GeoJSON with viewport clipping |
| > 10,000 | Martin MVT tiles (CLAUDE.md §5) |
| > 100,000 | Martin MVT + zoom-gated loading |

## POPIA Considerations for Parcel Data

```typescript
/**
 * POPIA ANNOTATION
 * Personal data handled: [property owner names, ID numbers, addresses]
 * Purpose: [property valuation display, spatial analysis]
 * Lawful basis: [legitimate interests — public GV Roll data]
 * Retention: [duration of GV Roll validity period]
 * Subject rights: [access ✓ | correction ✓ | deletion ✓ | objection ✓]
 */
```

- Strip owner PII before client-side display for GUEST/VIEWER roles
- Retain owner data server-side only; expose via RLS-gated API
- GV Roll 2022 is public data but owner details are personal information

## Example: Importing Cape Town Cadastral from City GV Roll

```bash
# 1. Download GV Roll shapefile from CoCT Open Data Portal
# 2. Inspect
ogrinfo -so gv_roll_2022.shp gv_roll_2022

# 3. Import with CRS transformation
ogr2ogr -f "PostgreSQL" \
  PG:"host=localhost dbname=capegis user=postgres" \
  gv_roll_2022.shp \
  -nln valuation_data \
  -t_srs EPSG:4326 \
  -lco GEOMETRY_NAME=geom \
  -progress

# 4. Add tenant_id and RLS
ALTER TABLE valuation_data ADD COLUMN tenant_id uuid;
ALTER TABLE valuation_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE valuation_data FORCE ROW LEVEL SECURITY;
CREATE POLICY "valuation_data_tenant_isolation" ON valuation_data
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);

# 5. Add spatial index
CREATE INDEX idx_valuation_data_geom ON valuation_data USING GIST (geom);
```

## Common Pitfalls

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| Missing `.prj` file | `Unknown SRS` error | Request from data provider; do NOT guess |
| Wrong CRS (e.g. Lo19 imported as WGS84) | Features appear in Gulf of Guinea | Re-import with correct `-s_srs` |
| Encoding issues (`.cpg` missing) | Garbled Afrikaans/isiXhosa text | Add `.cpg` file with `UTF-8` or `WINDOWS-1252` |
| Mixed geometry types | Import fails | Use `-nlt PROMOTE_TO_MULTI` with ogr2ogr |
| Massive shapefile (>500MB) | Memory exhaustion | Chunk with `ogr2ogr -where "OGC_FID < 50000"` |
| No spatial index | Slow viewport queries | Always `CREATE INDEX ... USING GIST (geom)` |
| Storing in EPSG:3857 | Distorted area calculations | Always reproject to EPSG:4326 for storage |

## GeoPackage Import (Preferred Open Format)

```bash
# GeoPackage is a single-file SQLite database — no .prj/.dbf issues
ogr2ogr -f "PostgreSQL" \
  PG:"host=localhost dbname=capegis" \
  data.gpkg \
  -nln layer_name \
  -t_srs EPSG:4326 \
  -progress
```
