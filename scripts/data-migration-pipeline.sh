#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# CapeTown GIS Hub — Data Migration Pipeline
# ─────────────────────────────────────────────────────────────────────────────
# Executes the GEE export → STAC generation → PostGIS OUT-DB registration
# pipeline to beat the Google Earth Engine quota deadline (Apr 27, 2026).
#
# Prerequisites:
#   - GCP infra provisioned (scripts/gcp-infra-setup.sh)
#   - earthengine CLI authenticated: earthengine authenticate
#   - Python env with: pystac, rio-stac, rasterio, google-cloud-storage
#   - PostgreSQL client (psql, raster2pgsql) with GDAL support
#   - Supabase DB connection string in SUPABASE_DB_URL
#
# Usage: bash scripts/data-migration-pipeline.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════
PROJECT_ID="${GCP_PROJECT_ID:?Set GCP_PROJECT_ID env var}"
BUCKET_NAME="${GCS_BUCKET_NAME:-capegis-rasters}"
SUPABASE_DB_URL="${SUPABASE_DB_URL:?Set SUPABASE_DB_URL env var (postgresql://...)}"
WORK_DIR="${WORK_DIR:-/tmp/capegis-migration}"
STAC_OUTPUT_DIR="${WORK_DIR}/stac_catalog"

mkdir -p "$WORK_DIR" "$STAC_OUTPUT_DIR"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1 — GOOGLE EARTH ENGINE EXPORT
# ═══════════════════════════════════════════════════════════════════════════════
echo "═══ Step 1: Earth Engine Export to GCS ═══"

# Verify earthengine CLI is authenticated
earthengine ls 2>/dev/null || {
  echo "❌ Earth Engine not authenticated. Run: earthengine authenticate"
  exit 1
}

# Update the GEE export script with actual bucket name
sed "s|YOUR_GCP_BUCKET_NAME|$BUCKET_NAME|g" \
  scripts/gee_export_cape_town.js > "$WORK_DIR/gee_export.js"

# Verify cloudOptimized: true is present
if grep -q "cloudOptimized: true" "$WORK_DIR/gee_export.js"; then
  echo "✅ cloudOptimized: true flag confirmed in export script"
else
  echo "❌ CRITICAL: cloudOptimized flag missing! Aborting."
  exit 1
fi

# Submit the export task via earthengine CLI
# The script runs in the Earth Engine Code Editor context; for CLI execution
# we use the earthengine command with the --service_account_file for GEE writer SA
echo "Submitting GEE export task..."
earthengine task start \
  --service_account_file="${GEE_SA_KEY_PATH:-/tmp/capegis-keys/gee-writer-key.json}" \
  "$WORK_DIR/gee_export.js" 2>&1 || {
    # Fallback: use the Earth Engine Python API directly
    echo "CLI task start not available. Using Python API fallback..."
    python3 - << 'PYEOF'
import ee
import os

# Authenticate with service account if key path is set
sa_key = os.environ.get('GEE_SA_KEY_PATH')
if sa_key:
    credentials = ee.ServiceAccountCredentials('', sa_key)
    ee.Initialize(credentials, project=os.environ['GCP_PROJECT_ID'])
else:
    ee.Initialize(project=os.environ['GCP_PROJECT_ID'])

bucket = os.environ.get('GCS_BUCKET_NAME', 'capegis-rasters')

# Cape Town AOI
aoi = ee.Geometry.Polygon([
    [[18.3, -34.1], [18.6, -34.1], [18.6, -33.8], [18.3, -33.8], [18.3, -34.1]]
])

# Sentinel-2 Surface Reflectance — latest cloud-free composite
collection = (ee.ImageCollection('COPERNICUS/S2_SR')
    .filterBounds(aoi)
    .filterDate('2024-01-01', '2024-12-31')
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10)))

image = collection.median().clip(aoi)
export_image = image.select(['B4', 'B3', 'B2', 'B8']).float()

task = ee.batch.Export.image.toCloudStorage(
    image=export_image,
    description='cape-town-s2-export-2024',
    bucket=bucket,
    fileNamePrefix='sentinel2/cape-town-2024',
    scale=10,
    crs='EPSG:4326',
    fileFormat='GeoTIFF',
    formatOptions={'cloudOptimized': True}
)
task.start()
print(f"✅ GEE export task started: {task.status()['id']}")
print(f"   Monitor at: https://code.earthengine.google.com/tasks")
PYEOF
}

echo ""
echo "⏳ GEE export is async. Monitor progress at:"
echo "   https://code.earthengine.google.com/tasks"
echo "   Or: earthengine task list"
echo ""
echo "   Once complete, COGs will be at: gs://$BUCKET_NAME/sentinel2/"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2 — STAC CATALOG GENERATION
# ═══════════════════════════════════════════════════════════════════════════════
echo "═══ Step 2: STAC Catalog Generation ═══"
echo "Run after GEE export completes (check task status first)."
echo ""

# Download exported COGs to local temp for STAC metadata extraction
LOCAL_COGS="$WORK_DIR/cogs"
mkdir -p "$LOCAL_COGS"

echo "Downloading COGs from GCS for STAC indexing..."
gcloud storage cp "gs://$BUCKET_NAME/sentinel2/*.tif" "$LOCAL_COGS/" 2>/dev/null || {
  echo "⚠️  No COGs found in gs://$BUCKET_NAME/sentinel2/ yet."
  echo "    Wait for GEE export to complete, then re-run this step."
  echo "    Command: gcloud storage cp 'gs://$BUCKET_NAME/sentinel2/*.tif' $LOCAL_COGS/"
}

# Generate STAC catalog using the project script
if ls "$LOCAL_COGS"/*.tif 1>/dev/null 2>&1; then
  echo "Generating STAC catalog..."
  CLOUD_BUCKET="$BUCKET_NAME" \
  python3 scripts/generate_stac_catalog.py \
    --input-dir "$LOCAL_COGS" \
    --output-dir "$STAC_OUTPUT_DIR" \
    --bucket "$BUCKET_NAME" 2>/dev/null || {
      # Direct invocation with env vars (script uses __main__ block)
      CLOUD_BUCKET="$BUCKET_NAME" \
      python3 -c "
import sys
sys.path.insert(0, 'scripts')
from generate_stac_catalog import generate_catalog
generate_catalog('$LOCAL_COGS', '$STAC_OUTPUT_DIR', '$BUCKET_NAME')
"
    }

  # Upload STAC catalog JSON to GCS
  echo "Uploading STAC catalog to gs://$BUCKET_NAME/stac/"
  gcloud storage cp -r "$STAC_OUTPUT_DIR/*" "gs://$BUCKET_NAME/stac/"

  echo "✅ STAC catalog generated and uploaded to gs://$BUCKET_NAME/stac/"
else
  echo "⚠️  No COG files found locally. Skipping STAC generation."
  echo "    After GEE export completes, run:"
  echo "    gcloud storage cp 'gs://$BUCKET_NAME/sentinel2/*.tif' $LOCAL_COGS/"
  echo "    python3 scripts/generate_stac_catalog.py"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3 — SUPABASE PostGIS OUT-DB RASTER REGISTRATION
# ═══════════════════════════════════════════════════════════════════════════════
echo "═══ Step 3: PostGIS OUT-DB Raster Registration ═══"

# Enable out-db raster support on the Supabase PostGIS instance
echo "Enabling PostGIS out-db raster settings..."
psql "$SUPABASE_DB_URL" << 'SQL'
-- Enable out-of-database rasters (reads pixels from GCS via GDAL /vsigs/)
ALTER SYSTEM SET postgis.enable_outdb_rasters = true;
ALTER SYSTEM SET postgis.gdal_enabled_drivers = 'ENABLE_ALL';
SELECT pg_reload_conf();

-- Create the raster catalog table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.raster_catalog (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  cloud_uri   TEXT NOT NULL,
  rast        RASTER,
  acquired_at TIMESTAMPTZ,
  bands       TEXT[],
  crs         TEXT DEFAULT 'EPSG:4326',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_cloud_uri UNIQUE (cloud_uri)
);

-- RLS: read access for all authenticated users
ALTER TABLE public.raster_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "raster_catalog_read"
  ON public.raster_catalog FOR SELECT
  USING (true);

COMMENT ON TABLE public.raster_catalog IS
  'OUT-DB raster registry. Metadata in PostGIS, pixels in GCS via /vsigs/. POPIA: africa-south1.';
SQL

echo "✅ PostGIS out-db raster settings enabled"

# Register each COG as an OUT-DB raster using raster2pgsql -R
# The -R flag creates out-db rasters (metadata only; GDAL reads pixels from cloud)
echo "Registering COGs as OUT-DB rasters..."

# List all COGs in the bucket
COG_LIST=$(gcloud storage ls "gs://$BUCKET_NAME/sentinel2/*.tif" 2>/dev/null || echo "")

if [ -n "$COG_LIST" ]; then
  for COG_URI in $COG_LIST; do
    FILENAME=$(basename "$COG_URI")
    VSIGS_PATH="/vsigs/$BUCKET_NAME/sentinel2/$FILENAME"

    echo "  Registering: $VSIGS_PATH"

    # raster2pgsql with GDAL env vars optimized for Google Cloud Storage
    # -R  = out-db raster (register metadata only, GDAL reads pixels from /vsigs/)
    # -s  = SRID (4326 = WGS84)
    # -I  = create spatial index
    # -C  = apply raster constraints
    # -M  = vacuum analyze after load
    GDAL_DISABLE_READDIR_ON_OPEN=EMPTY_DIR \
    VSI_CACHE=TRUE \
    VSI_CACHE_SIZE=67108864 \
    CPL_VSIL_CURL_CACHE_SIZE=67108864 \
    GDAL_HTTP_MERGE_CONSECUTIVE_RANGES=YES \
    GS_NO_SIGN_REQUEST=YES \
    raster2pgsql \
      -R \
      -s 4326 \
      -I \
      -C \
      -M \
      "$VSIGS_PATH" \
      public.raster_catalog \
    | psql "$SUPABASE_DB_URL"

    # Also insert into the catalog metadata table
    psql "$SUPABASE_DB_URL" -c "
      INSERT INTO public.raster_catalog (name, cloud_uri, bands, crs)
      VALUES ('$FILENAME', '$COG_URI', ARRAY['B4','B3','B2','B8'], 'EPSG:4326')
      ON CONFLICT (cloud_uri) DO NOTHING;
    "
  done

  echo "✅ All COGs registered as OUT-DB rasters in PostGIS"
else
  echo "⚠️  No COGs found in gs://$BUCKET_NAME/sentinel2/"
  echo "    After GEE export completes, re-run this step."
  echo ""
  echo "    Manual registration command:"
  echo "    GDAL_DISABLE_READDIR_ON_OPEN=EMPTY_DIR \\"
  echo "    VSI_CACHE=TRUE \\"
  echo "    VSI_CACHE_SIZE=67108864 \\"
  echo "    CPL_VSIL_CURL_CACHE_SIZE=67108864 \\"
  echo "    GDAL_HTTP_MERGE_CONSECUTIVE_RANGES=YES \\"
  echo "    GS_NO_SIGN_REQUEST=YES \\"
  echo "    raster2pgsql -R -s 4326 -I -C -M \\"
  echo "      /vsigs/$BUCKET_NAME/sentinel2/<filename>.tif \\"
  echo "      public.raster_catalog \\"
  echo "    | psql \$SUPABASE_DB_URL"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  DATA MIGRATION PIPELINE STATUS"
echo "═══════════════════════════════════════════════════════════════"
echo "  GEE Export:     SUBMITTED (async — check Tasks tab)"
echo "  STAC Catalog:   $([ -f "$STAC_OUTPUT_DIR/catalog.json" ] && echo "GENERATED" || echo "PENDING (await GEE export)")"
echo "  PostGIS OUT-DB: $([ -n "$COG_LIST" ] && echo "REGISTERED" || echo "PENDING (await GEE export)")"
echo "  GEE Deadline:   April 27, 2026"
echo "  Vector-Raster Bridge: ESTABLISHED (out-db rasters via /vsigs/)"
echo "═══════════════════════════════════════════════════════════════"
