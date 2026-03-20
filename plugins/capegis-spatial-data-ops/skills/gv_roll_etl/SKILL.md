---
name: gv-roll-etl
description: ETL pipeline for ingesting the City of Cape Town General Valuation (GV) Roll 2022 CSV into PostGIS. Handles POPIA-compliant PII stripping of owner name columns before any data reaches the database, chunked pandas/TypeScript processing for the ~830K-row file, staging-table pattern for fast bulk inserts, CRS transform from Lo19 (EPSG:22279) to WGS84 (EPSG:4326), ERF number join to cadastral parcels, and materialised view refresh. Use this skill whenever the user mentions GV Roll, valuation data ingestion, ETL pipeline, bulk property data import, pandas chunking for large CSVs, staging table workflow, or importing CoCT valuation data. This skill is required for Milestone M6.
---

# GV Roll ETL — Ingestion Pipeline

## Purpose

Import ~830,000 property valuation records from the City of Cape Town General Valuation Roll 2022 CSV into the `valuation_data` PostGIS table safely, quickly, and POPIA-compliantly.

**Source:** `https://odp.capetown.gov.za` → search "General Valuation Roll"  
**Approved source only:** CoCT GV Roll 2022 (CLAUDE.md Rule 8 — no Lightstone data).  
**Milestone:** M6 — depends on M1 (schema) and M4b (Martin MVT for display).

---

## POPIA Annotation

```typescript
/**
 * POPIA ANNOTATION
 * Personal data handled: Property owner names (stripped on import, NEVER stored)
 * Purpose: Property valuation display for spatial analysis
 * Lawful basis: Legitimate interests (public municipal data)
 * Retention: Duration of valuation cycle (~4 years)
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */
```

---

## Pipeline Overview

```
Download CSV → Validate & Strip PII → Transform CRS (Lo19→WGS84) → Staging Table → Production Upsert → ERF Join → Refresh Views
```

---

## Step 1 — Download

```bash
# Manual download from CoCT Open Data Portal
open https://odp.capetown.gov.za
# Search: "General Valuation Roll"
# Format: CSV or Excel
# Expected: ~830,000 rows
```

GV Roll is bulk-download only — not a REST API. Store locally before processing.

---

## Step 2 — Validate & Strip PII (CRITICAL — POPIA)

Strip PII columns **in memory before any data reaches disk or database**. The `Full_Names` (or `owner_name`) column is the primary PII risk.

```typescript
// scripts/import-gv-roll.ts
function sanitiseRow(row: RawGVRollRow): CleanGVRollRow | null {
  // POPIA: Strip ALL PII columns — never store owner identity
  const PII_COLUMNS = ['Full_Names', 'owner_name', 'owner_email', 'id_number'];
  for (const col of PII_COLUMNS) {
    if (col in row) delete (row as Record<string, unknown>)[col];
  }

  // Validate ERF number (must be numeric)
  if (!row.erf_no || !/^\d+$/.test(String(row.erf_no).trim())) return null;

  // Validate bbox: Cape Town Metro only
  if (row.lat !== undefined && row.lng !== undefined) {
    if (row.lat < -34.3577 || row.lat > -33.4836) return null;
    if (row.lng < 18.3252 || row.lng > 19.0186) return null;
  }

  // Parse ZAR values (remove "R", spaces, commas)
  row.city_valuation_zar = parseZAR(String(row.total_value ?? '0'));
  if (row.city_valuation_zar < 0) return null; // Reject negative values

  return row;
}

function parseZAR(value: string): number {
  return parseInt(value.replace(/[R\s,]/g, ''), 10) || 0;
}
```

> **Why strip before DB?** Once PII reaches the database, it's harder to guarantee deletion (WAL logs, backups). Stripping in memory is the safest POPIA posture.

**Import error logging:** Log only ERF numbers for rejected rows — never log PII content.

---

## Step 3 — Chunked Processing

The file is too large to load into memory at once. Use 10,000-row batches:

```python
# Python alternative using pandas
import pandas as pd
from sqlalchemy import create_engine

PII_COLS = ['Full_Names', 'owner_name', 'owner_email']
CHUNK_SIZE = 10_000
DB_URL = "postgresql://user:pass@host:5432/gis_platform"

engine = create_engine(DB_URL)

with engine.connect() as con:
    con.execute("TRUNCATE TABLE gv_roll_staging;")

for chunk in pd.read_csv("GV_Roll_2022.csv", chunksize=CHUNK_SIZE):
    # Strip PII in-memory
    chunk.drop(columns=[c for c in PII_COLS if c in chunk.columns], inplace=True)

    # Validate ERF
    chunk = chunk[chunk['erf_no'].astype(str).str.match(r'^\d+$')]

    # Parse ZAR values
    chunk['market_val'] = (
        chunk['total_value'].astype(str)
        .str.replace(r'[R\s,]', '', regex=True)
        .pipe(pd.to_numeric, errors='coerce')
        .fillna(0)
        .astype(int)
    )
    chunk = chunk[chunk['market_val'] >= 0]  # Reject negatives

    chunk.to_sql('gv_roll_staging', engine, if_exists='append', index=False)
```

---

## Step 4 — Staging Table (Fast Bulk Insert)

Insert into an **unindexed** staging table first — indexes slow down bulk writes significantly.

```sql
-- Create staging table (no indexes, no RLS)
CREATE TEMP TABLE gv_roll_staging (
  erf_no        TEXT NOT NULL,
  suburb        TEXT,
  zone_code     TEXT,
  category_d    TEXT,
  market_val    INTEGER,
  x             DOUBLE PRECISION,  -- Lo19 easting (if present)
  y             DOUBLE PRECISION   -- Lo19 northing (if present)
);
```

Verify staging after load:
```sql
-- Sanity checks before production transfer
SELECT COUNT(*) FROM gv_roll_staging;                    -- expect ~830K
SELECT COUNT(*) FROM gv_roll_staging WHERE erf_no IS NULL; -- expect 0
-- Verify no PII columns exist
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'gv_roll_staging'
  AND column_name IN ('Full_Names', 'owner_name', 'owner_email');  -- expect 0 rows
```

---

## Step 5 — CRS Transform (Lo19 → WGS84)

GV Roll coordinates may be in Lo19 (EPSG:22279 — South African survey CRS). Transform to WGS84 (EPSG:4326) for storage:

```sql
-- Insert with CRS transform from Lo19 to WGS84
INSERT INTO valuation_data (tenant_id, parcel_id, suburb, zone_code, city_valuation_zar, gv_year, coordinates)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,  -- platform tenant_id for public data
  erf_no,
  suburb,
  zone_code,
  market_val,
  2022,
  ST_Transform(ST_SetSRID(ST_MakePoint(x, y), 22279), 4326)
FROM gv_roll_staging
WHERE x IS NOT NULL AND y IS NOT NULL
ON CONFLICT (parcel_id) DO UPDATE
  SET city_valuation_zar = EXCLUDED.city_valuation_zar,
      gv_year = EXCLUDED.gv_year;
```

> **CRS precision note:** Lo19 → WGS84 introduces sub-metre drift — acceptable for property-level display. No mitigation needed.

---

## Step 6 — ERF Number Join to Cadastral Parcels

For records without coordinates (5–10% of rows), join to `cadastral_parcels` via ERF number:

```sql
-- Fill in missing geometries via cadastral join
UPDATE valuation_data v
SET coordinates = c.geom
FROM cadastral_parcels c
WHERE v.parcel_id = c.erf_no
  AND v.coordinates IS NULL;

-- Log unmatched ERFs (no PII — ERF numbers only)
SELECT v.parcel_id AS unmatched_erf_no
FROM valuation_data v
WHERE v.coordinates IS NULL;
```

Target: ERF join success rate > 95%. Below this, flag for CoCT data team review.

---

## Step 7 — Refresh Materialised Views

```sql
-- Must run after every import
REFRESH MATERIALIZED VIEW CONCURRENTLY suburbs_avg_price;
REFRESH MATERIALIZED VIEW CONCURRENTLY zone_distribution;
```

Target: refresh completes in < 60 seconds for 830K records.

---

## Step 8 — Cleanup

```sql
DROP TABLE IF EXISTS gv_roll_staging;
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Full import (830K rows) | < 30 minutes |
| Batch size | 10,000 rows |
| Materialised view refresh | < 60s |
| Single property query | < 200ms |

---

## Data Source Badge (Rule 1)

All valuation displays must show:  
`[CoCT GV Roll · 2022 · LIVE|CACHED|MOCK]`

Attribution string (mandatory on all property panels):
> "Based on City of Cape Town General Valuation Roll [YEAR]. Municipal valuations for rating purposes only — not market value estimates."

---

## Three-Tier Fallback (Rule 2)

| Tier | Source |
|------|--------|
| LIVE | PostGIS `valuation_data` via Supabase RPC |
| CACHED | `api_cache` with 30-day TTL |
| MOCK | `public/mock/gv_roll.geojson` (5 seed suburbs) |

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Duplicate ERF numbers (sectional title) | Insert as multiple records per ERF |
| Missing coordinates | Join to `cadastral_parcels`; log unmatched ERFs |
| Zero-value properties (municipal exempt) | Keep — R0 is valid |
| Negative values | Reject row, log ERF number only |
| Non-numeric ERF | Reject row, log |
| GV Roll schema change (column rename) | Validate column headers before import; `FAIL FAST` if unexpected schema |
| Import script OOM | Already handled by 10K-row chunking |
| CRS transform places coord outside bbox | `ST_Within` check post-insert; reject out-of-bounds |

---

## Security Checklist

- [ ] Import script runs with `SUPABASE_SERVICE_ROLE_KEY` (server-side only — never expose to client)
- [ ] PII columns stripped before any DB write (verified by staging column check)
- [ ] Import error log contains only ERF numbers — zero PII content
- [ ] `valuation_data` has RLS with `tenant_id` isolation
- [ ] No Lightstone data used (CLAUDE.md Rule 8)

---

## Acceptance Criteria (M6)

- ✅ Import script strips `owner_name` / `Full_Names` / PII columns before insert
- ✅ All coordinates within Cape Town Metro bbox (PostGIS `ST_Within` check)
- ✅ ERF join success rate > 95% (log unmatched ERFs)
- ✅ ZAR values parse correctly (no NaN, no negatives stored)
- ✅ Attribution string present on all valuation displays
- ✅ Materialised views refresh after import in < 60s
- ✅ Data source badge `[CoCT GV Roll · 2022 · LIVE]` on all valuation displays
- ✅ Three-tier fallback implemented (PostGIS → api_cache → mock GeoJSON)
- ✅ Full import completes in < 30 minutes for 830K records
- ✅ No Lightstone data used (Rule 8 compliance)
