#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# CapeTown GIS Hub — GCP Infrastructure Provisioning Script
# ─────────────────────────────────────────────────────────────────────────────
# Phase 4: Provision GCS bucket, IAM service accounts, and Cloud Run service.
# Budget ceiling: $200 free credit (90-day expiry), $30/mo post-credit.
# POPIA: all resources in africa-south1.
#
# Prerequisites:
#   - gcloud CLI authenticated: gcloud auth login
#   - Project created: gcloud projects create $PROJECT_ID
#   - Billing linked: gcloud billing projects link $PROJECT_ID --billing-account=$BILLING_ID
#   - APIs enabled (done in Phase 1 below)
#
# Usage: bash scripts/gcp-infra-setup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION — edit these before running
# ═══════════════════════════════════════════════════════════════════════════════
PROJECT_ID="${GCP_PROJECT_ID:?Set GCP_PROJECT_ID env var}"
REGION="africa-south1"
BUCKET_NAME="capegis-rasters"
VERCEL_PROD_ORIGIN="https://capegis.vercel.app"
VERCEL_PREVIEW_PATTERN="https://*-capegis.vercel.app"
GITHUB_REPO="${GITHUB_REPO:-<owner>/capegis}"  # for gh secret set

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 1 — GCS BUCKET SETUP
# ═══════════════════════════════════════════════════════════════════════════════
echo "═══ Phase 1: GCS Bucket Setup ═══"

# Enable required APIs
gcloud services enable \
  storage.googleapis.com \
  run.googleapis.com \
  eventarc.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com \
  billingbudgets.googleapis.com \
  --project="$PROJECT_ID"

# Create the bucket in africa-south1 (POPIA compliant)
gcloud storage buckets create "gs://$BUCKET_NAME" \
  --project="$PROJECT_ID" \
  --location="$REGION" \
  --default-storage-class=STANDARD \
  --uniform-bucket-level-access \
  --no-public-access-prevention \
  --labels="project=capegis,environment=production,popia=compliant"

# Lifecycle: Standard → Nearline after 90 days → Coldline after 365 days
cat > /tmp/capegis-lifecycle.json << 'EOF'
{
  "rule": [
    {
      "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
      "condition": {"age": 90}
    },
    {
      "action": {"type": "SetStorageClass", "storageClass": "COLDLINE"},
      "condition": {"age": 365}
    },
    {
      "action": {"type": "Delete"},
      "condition": {"numNewerVersions": 3, "isLive": false}
    }
  ]
}
EOF
gcloud storage buckets update "gs://$BUCKET_NAME" \
  --lifecycle-file=/tmp/capegis-lifecycle.json

# Enable versioning for rollback safety
gcloud storage buckets update "gs://$BUCKET_NAME" --versioning

# CORS: allow only Vercel frontend origins for COG range requests
cat > /tmp/capegis-cors.json << EOF
[
  {
    "origin": ["$VERCEL_PROD_ORIGIN", "http://localhost:3000", "http://localhost:3001"],
    "method": ["GET", "HEAD", "OPTIONS"],
    "responseHeader": [
      "Content-Type", "Content-Range", "Accept-Ranges",
      "Content-Length", "Content-Encoding", "ETag",
      "Access-Control-Allow-Origin"
    ],
    "maxAgeSeconds": 86400
  }
]
EOF
gcloud storage buckets update "gs://$BUCKET_NAME" --cors-file=/tmp/capegis-cors.json

echo "✅ GCS bucket gs://$BUCKET_NAME created in $REGION with lifecycle + CORS"

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2 — IAM & SECURITY
# ═══════════════════════════════════════════════════════════════════════════════
echo "═══ Phase 2: IAM & Security ═══"

# --- Service Account 1: Raster Reader (Next.js/Supabase proxy) ---
# Read-only access to GCS bucket for signed URL generation
SA_READER="capegis-raster-reader"
SA_READER_EMAIL="$SA_READER@$PROJECT_ID.iam.gserviceaccount.com"

gcloud iam service-accounts create "$SA_READER" \
  --project="$PROJECT_ID" \
  --display-name="CapeTown GIS - Raster Reader (proxy)" \
  --description="Read-only access to GCS raster bucket for Next.js/Supabase proxy"

gcloud storage buckets add-iam-policy-binding "gs://$BUCKET_NAME" \
  --member="serviceAccount:$SA_READER_EMAIL" \
  --role="roles/storage.objectViewer"

# Also grant signBlob for signed URL generation
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_READER_EMAIL" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --condition=None

echo "✅ Reader SA created: $SA_READER_EMAIL"

# --- Service Account 2: GEE Writer (Earth Engine export pipeline) ---
# Write-only access: can create objects but NOT read or delete
SA_GEE="capegis-gee-writer"
SA_GEE_EMAIL="$SA_GEE@$PROJECT_ID.iam.gserviceaccount.com"

gcloud iam service-accounts create "$SA_GEE" \
  --project="$PROJECT_ID" \
  --display-name="CapeTown GIS - GEE Export Writer" \
  --description="Write-only access to GCS bucket for Earth Engine exports"

gcloud storage buckets add-iam-policy-binding "gs://$BUCKET_NAME" \
  --member="serviceAccount:$SA_GEE_EMAIL" \
  --role="roles/storage.objectCreator"

echo "✅ GEE Writer SA created: $SA_GEE_EMAIL"

# --- Generate JSON keys and store in GitHub Secrets ---
KEY_DIR="/tmp/capegis-keys"
mkdir -p "$KEY_DIR"

# Reader key
gcloud iam service-accounts keys create "$KEY_DIR/reader-key.json" \
  --iam-account="$SA_READER_EMAIL" \
  --project="$PROJECT_ID"

# GEE Writer key
gcloud iam service-accounts keys create "$KEY_DIR/gee-writer-key.json" \
  --iam-account="$SA_GEE_EMAIL" \
  --project="$PROJECT_ID"

echo "✅ JSON keys generated in $KEY_DIR"

# Upload keys to GitHub Repository Secrets (requires gh CLI authenticated)
echo "Uploading keys to GitHub Secrets..."

gh secret set GCP_RASTER_READER_KEY \
  --repo="$GITHUB_REPO" \
  < "$KEY_DIR/reader-key.json"

gh secret set GCP_GEE_WRITER_KEY \
  --repo="$GITHUB_REPO" \
  < "$KEY_DIR/gee-writer-key.json"

gh secret set GCP_PROJECT_ID \
  --repo="$GITHUB_REPO" \
  --body="$PROJECT_ID"

# Securely delete local key files
shred -u "$KEY_DIR/reader-key.json" "$KEY_DIR/gee-writer-key.json"
rmdir "$KEY_DIR"

echo "✅ Keys uploaded to GitHub Secrets and securely deleted locally"

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 3 — CLOUD RUN DEPLOYMENT
# ═══════════════════════════════════════════════════════════════════════════════
echo "═══ Phase 3: Cloud Run Deploy ═══"

# Build the raster processor image
gcloud builds submit \
  --project="$PROJECT_ID" \
  --tag="gcr.io/$PROJECT_ID/capegis-raster-processor:latest" \
  --timeout=600 \
  backend/

# Deploy to Cloud Run with cost-safe limits
gcloud run deploy capegis-raster-processor \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --image="gcr.io/$PROJECT_ID/capegis-raster-processor:latest" \
  --platform=managed \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --concurrency=10 \
  --min-instances=0 \
  --max-instances=3 \
  --allow-unauthenticated \
  --service-account="$SA_READER_EMAIL" \
  --set-env-vars="\
GCS_BUCKET=$BUCKET_NAME,\
GDAL_CACHEMAX=256,\
CPL_VSIL_CURL_CACHE_SIZE=67108864,\
GDAL_HTTP_MERGE_CONSECUTIVE_RANGES=YES,\
GDAL_HTTP_MULTIPLEX=YES,\
VSI_CACHE=TRUE,\
VSI_CACHE_SIZE=67108864,\
GDAL_DISABLE_READDIR_ON_OPEN=EMPTY_DIR"

echo "✅ Cloud Run deployed: capegis-raster-processor in $REGION"

# Print the Cloud Run URL for env var configuration
CLOUD_RUN_URL=$(gcloud run services describe capegis-raster-processor \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --format="value(status.url)")

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
echo "  GCS Bucket:      gs://$BUCKET_NAME"
echo "  Public URL:      https://storage.googleapis.com/$BUCKET_NAME"
echo "  Cloud Run:       $CLOUD_RUN_URL"
echo "  Reader SA:       $SA_READER_EMAIL"
echo "  GEE Writer SA:   $SA_GEE_EMAIL"
echo ""
echo "  Set in Vercel:"
echo "    NEXT_PUBLIC_RASTER_BASE_URL=$CLOUD_RUN_URL"
echo "    GCS_BUCKET_NAME=$BUCKET_NAME"
echo "═══════════════════════════════════════════════════════════════"
