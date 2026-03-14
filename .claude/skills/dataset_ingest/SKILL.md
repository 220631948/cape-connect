---
name: dataset-ingest
description: Validate and ingest an open public dataset into PostGIS with three-tier fallback compliance. Use when adding a new data source from the approved dataset catalog at docs/research/open-datasets.md.
---

# Dataset Ingest

## Purpose
Standardize the pipeline from raw open-data download to PostGIS table with mock fallback,
ensuring every ingest meets CLAUDE.md Rule 1 (source badge), Rule 2 (three-tier fallback),
Rule 4 (RLS), and Rule 9 (geographic scope).

## Required Inputs
- Dataset name and download URL (must be from `docs/research/open-datasets.md`)
- Target PostGIS table name
- Source badge string and year (see `data_source_badge` skill)
- License confirmation (ODbL, CC-BY, or Public Domain only)

## Workflow

### Step 1 — Validate Source
- Confirm URL is accessible (HTTP 200): `curl -sI <URL> | head -1`
- Confirm license is open (ODbL, CC-BY, or Public Domain)
- Confirm CRS is EPSG:4326 or known (for reprojection)
- Confirm coverage intersects Cape Town bbox: west 18.0 / south -34.5 / east 19.5 / north -33.0

### Step 2 — Download & Stage
```bash
# Download to tmp — do not commit raw data to git
# Raw datasets listed in .gitignore: *.pbf *.osm *.shp *.zip (in tmp_datasets/)
curl -L "<DATASET_URL>" -o /tmp/dataset_raw.<ext>
```

### Step 3 — Reproject if Needed
```bash
# For shapefiles not in EPSG:4326:
ogr2ogr -t_srs EPSG:4326 /tmp/dataset_4326.geojson /tmp/dataset_raw.shp

# Verify CRS after reprojection:
ogrinfo -al -so /tmp/dataset_4326.geojson | grep "Geometry:"
```

### Step 4 — Clip to Cape Town Bbox
```bash
# Clip before loading to keep only Cape Town data (Rule 9)
ogr2ogr -spat 18.0 -34.5 19.5 -33.0 /tmp/dataset_clipped.geojson /tmp/dataset_4326.geojson
```

### Step 5 — Load to PostGIS
```bash
# Via shp2pgsql for shapefiles:
shp2pgsql -s 4326 /tmp/dataset_clipped.shp public.<table_name> | psql $DATABASE_URL

# Via ogr2ogr for GeoJSON:
ogr2ogr -f PostgreSQL "PG:$DATABASE_URL" /tmp/dataset_clipped.geojson \
  -nln <table_name> -overwrite
```

### Step 6 — Write Migration
Create `supabase/migrations/<timestamp>_<table_name>_ingest.sql` with:
```sql
-- Enable RLS (CLAUDE.md Rule 4)
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.<table_name> FORCE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY "<table_name>_tenant_isolation" ON public.<table_name>
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);

-- Spatial index
CREATE INDEX <table_name>_geom_idx
  ON public.<table_name> USING GIST (geom);
```

### Step 7 — Write Mock Fallback (Rule 2)
- Clip 50–100 representative features: `public/mock/<table_name>.geojson`
- Verify all features within Cape Town bbox (Rule 9)
- Verify mock file is valid GeoJSON: `python3 -c "import json; json.load(open('public/mock/<table>.geojson'))"`

### Step 8 — Update Catalog
Add row to `docs/research/open-datasets.md`:
```
| N | Dataset Name | URL | License | Format | CRS | `<table_name>` | `public/mock/<table>.geojson` | INGESTED |
```

## Output
```
Dataset Ingest — <dataset_name>
  Source validation:    ✓ HTTP 200 | ✓ License: ODbL | ✓ CRS: EPSG:4326 | ✓ Bbox intersects
  Download & stage:     ✓ /tmp/dataset_raw.geojson (42 MB)
  Reproject:            N/A (already EPSG:4326)
  Clip to bbox:         ✓ 1,204 features → 387 within Cape Town bbox
  Load to PostGIS:      ✓ public.<table_name> (387 rows)
  Migration written:    ✓ supabase/migrations/20260311000000_<table_name>_ingest.sql
  Mock fallback:        ✓ public/mock/<table_name>.geojson (50 features)
  Catalog updated:      ✓ docs/research/open-datasets.md row N status → INGESTED

Source badge: [<SOURCE_NAME>·<YEAR>·LIVE]
RESULT: PASS
```
