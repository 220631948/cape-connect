#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# CapeTown GIS Hub — Data Migration Pipeline (Cesium ion Native)
# ─────────────────────────────────────────────────────────────────────────────
# Executes the GEE export → GCS staging → Cesium ion Ingestion pipeline.
# Pivoted to premium enterprise stack to leverage automated 3D/raster tiling.
#
# Prerequisites:
#   - GCP staging bucket (scripts/gcp-infra-setup.sh)
#   - earthengine CLI authenticated: earthengine authenticate
#   - Cesium ion Access Token: Set CESIUM_ION_ACCESS_TOKEN
#   - AWS CLI installed (for ion upload)
#   - jq installed (for JSON parsing)
#
# Usage: bash scripts/data-migration-pipeline.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════
PROJECT_ID="${GCP_PROJECT_ID:?Set GCP_PROJECT_ID env var}"
BUCKET_NAME="${GCS_BUCKET_NAME:-capegis-rasters}"
ION_TOKEN="${CESIUM_ION_ACCESS_TOKEN:?Set CESIUM_ION_ACCESS_TOKEN env var}"
WORK_DIR="${WORK_DIR:-/tmp/capegis-migration}"

mkdir -p "$WORK_DIR"

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
  scripts/gee_export_cape_town.js > "$WORK_DIR/gee_export.js" 2>/dev/null || {
    echo "⚠️  scripts/gee_export_cape_town.js not found. Using inline python fallback..."
  }

# Submit the export task
echo "Submitting GEE export task..."
python3 - << 'PYEOF'
import ee
import os

# Authenticate
try:
    ee.Initialize(project=os.environ['GCP_PROJECT_ID'])
except Exception:
    # Use service account if available
    sa_key = os.environ.get('GEE_SA_KEY_PATH', '/tmp/capegis-keys/gee-writer-key.json')
    if os.path.exists(sa_key):
        credentials = ee.ServiceAccountCredentials('', sa_key)
        ee.Initialize(credentials, project=os.environ['GCP_PROJECT_ID'])
    else:
        print("❌ Could not initialize Earth Engine. Run 'earthengine authenticate'")
        exit(1)

bucket = os.environ.get('GCS_BUCKET_NAME', 'capegis-rasters')

# Cape Town AOI
aoi = ee.Geometry.Polygon([
    [[18.3, -34.1], [18.6, -34.1], [18.6, -33.8], [18.3, -33.8], [18.3, -34.1]]
])

# Sentinel-2 Surface Reflectance — latest cloud-free composite
collection = (
    ee.ImageCollection('COPERNICUS/S2_SR')
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
PYEOF

echo ""
echo "⏳ GEE export is async. Monitor progress at:"
echo "   https://code.earthengine.google.com/tasks"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2 — CESIUM ION INGESTION
# ═══════════════════════════════════════════════════════════════════════════════
echo "═══ Step 2: Cesium ion Ingestion ═══"
echo "Run after GEE export completes (check task status first)."
echo ""

LOCAL_COGS="$WORK_DIR/cogs"
mkdir -p "$LOCAL_COGS"

# List all COGs in the bucket
COG_LIST=$(gcloud storage ls "gs://$BUCKET_NAME/sentinel2/*.tif" 2>/dev/null || echo "")

if [ -z "$COG_LIST" ]; then
  echo "⚠️  No COGs found in gs://$BUCKET_NAME/sentinel2/."
  echo "    Waiting for GEE export? Re-run this script when export finishes."
  exit 0
fi

for COG_URI in $COG_LIST; do
  FILENAME=$(basename "$COG_URI")
  LOCAL_PATH="$LOCAL_COGS/$FILENAME"

  echo "Processing: $FILENAME"
  
  # Download from GCS
  echo "  Downloading from GCS..."
  gcloud storage cp "$COG_URI" "$LOCAL_PATH"

  # 1. Create asset and get upload location
  echo "  Requesting Cesium ion upload credentials..."
  ION_RESPONSE=$(curl -s -X POST "https://api.cesium.com/v1/assets" \
    -H "Authorization: Bearer $ION_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$FILENAME\",
      \"description\": \"Sentinel-2 Cape Town 2024 Export\",
      \"type\": \"IMAGERY\",
      \"options\": {
        \"sourceType\": \"RASTER\"
      }
    }")

  ASSET_ID=$(echo "$ION_RESPONSE" | jq -r '.assetMetadata.id')
  UPLOAD_ENDPOINT=$(echo "$ION_RESPONSE" | jq -r '.uploadLocation.endpoint')
  UPLOAD_BUCKET=$(echo "$ION_RESPONSE" | jq -r '.uploadLocation.bucket')
  UPLOAD_PREFIX=$(echo "$ION_RESPONSE" | jq -r '.uploadLocation.prefix')
  UPLOAD_ACCESS_KEY=$(echo "$ION_RESPONSE" | jq -r '.uploadLocation.accessKeyId')
  UPLOAD_SECRET_KEY=$(echo "$ION_RESPONSE" | jq -r '.uploadLocation.secretAccessKey')
  UPLOAD_SESSION_TOKEN=$(echo "$ION_RESPONSE" | jq -r '.uploadLocation.sessionToken')

  if [ "$ASSET_ID" == "null" ]; then
    echo "  ❌ Failed to create ion asset: $ION_RESPONSE"
    continue
  fi

  echo "  ✅ Created ion asset: $ASSET_ID"

  # 2. Upload to S3 using AWS CLI
  echo "  Uploading to ion staging bucket..."
  AWS_ACCESS_KEY_ID="$UPLOAD_ACCESS_KEY" \
  AWS_SECRET_ACCESS_KEY="$UPLOAD_SECRET_KEY" \
  AWS_SESSION_TOKEN="$UPLOAD_SESSION_TOKEN" \
  aws s3 cp "$LOCAL_PATH" "s3://$UPLOAD_BUCKET/$UPLOAD_PREFIX$FILENAME" --endpoint-url "$UPLOAD_ENDPOINT"

  # 3. Notify ion that upload is complete
  echo "  Notifying ion to start tiling..."
  curl -s -X POST "https://api.cesium.com/v1/assets/$ASSET_ID/uploadComplete" \
    -H "Authorization: Bearer $ION_TOKEN"

  echo "  ✅ Tiling triggered for Asset ID: $ASSET_ID"
  echo "CESIUM_ION_ASSET_ID_${FILENAME//-/_}=${ASSET_ID}" >> "$WORK_DIR/.env.cesium-assets"

  # Cleanup local file
  rm "$LOCAL_PATH"
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  DATA MIGRATION PIPELINE STATUS"
echo "═══════════════════════════════════════════════════════════════"
echo "  GEE Export:     SUBMITTED"
echo "  ion Ingestion:  COMPLETE (Triggered for $(wc -l < "$WORK_DIR/ion_assets.log" 2>/dev/null || echo 0) assets)"
echo "  GEE Deadline:   April 27, 2026"
echo "  Asset Log:      $WORK_DIR/ion_assets.log"
echo "═══════════════════════════════════════════════════════════════"
echo "  Next Step: Use Asset IDs in Next.js frontend with Cesium ion."
echo "═══════════════════════════════════════════════════════════════"
