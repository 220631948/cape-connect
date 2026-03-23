#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# CapeTown GIS Hub — GCP Infrastructure Provisioning Script
# ─────────────────────────────────────────────────────────────────────────────
# Phase 4: Provision GCS staging bucket and IAM service accounts.
# Pivoted to Cesium ion for raster serving; GCP used only for staging.
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

# --- Service Account: GEE Writer (Earth Engine export pipeline) ---
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

# GEE Writer key
gcloud iam service-accounts keys create "$KEY_DIR/gee-writer-key.json" \
  --iam-account="$SA_GEE_EMAIL" \
  --project="$PROJECT_ID"

echo "✅ JSON keys generated in $KEY_DIR"

# Upload keys to GitHub Repository Secrets (requires gh CLI authenticated)
echo "Uploading keys to GitHub Secrets..."

gh secret set GCP_GEE_WRITER_KEY \
  --repo="$GITHUB_REPO" \
  < "$KEY_DIR/gee-writer-key.json"

gh secret set GCP_PROJECT_ID \
  --repo="$GITHUB_REPO" \
  --body="$PROJECT_ID"

# Securely delete local key files
shred -u "$KEY_DIR/gee-writer-key.json"
rmdir "$KEY_DIR"

echo "✅ Keys uploaded to GitHub Secrets and securely deleted locally"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  INFRASTRUCTURE SETUP COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
echo "  GCS Staging Bucket:  gs://$BUCKET_NAME"
echo "  GEE Writer SA:       $SA_GEE_EMAIL"
echo ""
echo "  Next Steps:"
echo "    1. Set CESIUM_ION_ACCESS_TOKEN in Vercel/GitHub secrets."
echo "    2. Run scripts/data-migration-pipeline.sh to push to ion."
echo "═══════════════════════════════════════════════════════════════"
