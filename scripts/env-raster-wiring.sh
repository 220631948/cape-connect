#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# CapeTown GIS Hub — Frontend Env Wiring for GCP Raster Offload
# ─────────────────────────────────────────────────────────────────────────────
# Scans the Next.js frontend for any hardcoded Supabase Storage references
# used for raster data and swaps them to NEXT_PUBLIC_RASTER_BASE_URL.
#
# Usage: bash scripts/env-raster-wiring.sh [--dry-run]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

REPO_ROOT="$(git rev-parse --show-toplevel)"
SRC_DIR="$REPO_ROOT/src"

echo "═══ Raster Env Wiring — Frontend Scan ═══"
echo "Scanning $SRC_DIR for Supabase Storage raster references..."
echo ""

# Pattern 1: Direct Supabase Storage bucket references for rasters/tifs
echo "--- Pattern 1: Supabase .from('rasters') or .from('bucket') with .tif ---"
grep -rn "\.from(['\"].*raster\|\.from(['\"].*tif\|\.from(['\"].*cog\|getPublicUrl.*\.tif" \
  --include="*.ts" --include="*.tsx" "$SRC_DIR" 2>/dev/null | grep -v node_modules || echo "  (none found)"

# Pattern 2: Hardcoded Supabase Storage URLs with raster paths
echo ""
echo "--- Pattern 2: Hardcoded Supabase Storage URLs ---"
grep -rn "supabase\.co/storage.*raster\|supabase\.co/storage.*\.tif\|supabase\.co/storage.*cog" \
  --include="*.ts" --include="*.tsx" "$SRC_DIR" 2>/dev/null | grep -v node_modules || echo "  (none found)"

# Pattern 3: Any .tif URL construction not using NEXT_PUBLIC_RASTER_BASE_URL
echo ""
echo "--- Pattern 3: .tif URL construction without RASTER_BASE_URL ---"
grep -rn "\.tif\b\|\.pmtiles\b\|\.cog\b" \
  --include="*.ts" --include="*.tsx" "$SRC_DIR" 2>/dev/null \
  | grep -v node_modules \
  | grep -v NEXT_PUBLIC_RASTER_BASE_URL \
  | grep -v "test\|spec\|mock\|__tests__\|\.d\.ts" || echo "  (none found)"

# Pattern 4: Files using raster-storage-client
echo ""
echo "--- Pattern 4: Files importing raster-storage-client ---"
grep -rn "raster-storage-client\|RasterStorageClient" \
  --include="*.ts" --include="*.tsx" "$SRC_DIR" 2>/dev/null \
  | grep -v node_modules || echo "  (none found)"

echo ""
echo "═══ Automated Replacements ═══"

# Replace any remaining hardcoded Supabase storage raster URLs
# with the NEXT_PUBLIC_RASTER_BASE_URL env var
if [ "$DRY_RUN" = true ]; then
  echo "[DRY RUN] Would apply the following sed replacements:"
  echo ""
fi

# Replacement: Supabase storage public URLs → env var
SUPABASE_STORAGE_PATTERN='https://[a-zA-Z0-9]*\.supabase\.co/storage/v1/object/public/rasters'
REPLACEMENT='${process.env.NEXT_PUBLIC_RASTER_BASE_URL}'

MATCHES=$(grep -rl "$SUPABASE_STORAGE_PATTERN" --include="*.ts" --include="*.tsx" "$SRC_DIR" 2>/dev/null | grep -v node_modules || true)

if [ -n "$MATCHES" ]; then
  for f in $MATCHES; do
    echo "  Replacing in: $f"
    if [ "$DRY_RUN" = false ]; then
      sed -i "s|$SUPABASE_STORAGE_PATTERN|process.env.NEXT_PUBLIC_RASTER_BASE_URL|g" "$f"
    fi
  done
else
  echo "  ✅ No hardcoded Supabase Storage raster URLs found."
  echo "     Frontend already uses NEXT_PUBLIC_RASTER_BASE_URL or raster-storage-client."
fi

echo ""
echo "═══ Verification ═══"
echo "Ensure these env vars are set in Vercel and .env.local:"
echo "  NEXT_PUBLIC_RASTER_BASE_URL=https://capegis-raster-processor-xxxxx.a.run.app"
echo "  NEXT_PUBLIC_GCS_PUBLIC_URL=https://storage.googleapis.com/capegis-rasters"
echo ""
echo "Done."
