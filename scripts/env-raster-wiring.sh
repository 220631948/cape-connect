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

# Pattern 3: Any hardcoded raster URL not using Cesium ion Asset IDs
echo ""
echo "--- Pattern 3: Hardcoded raster URLs not using ion Asset IDs ---"
grep -rn "\.tif\b\|\.pmtiles\b\|\.cog\b" \
  --include="*.ts" --include="*.tsx" "$SRC_DIR" 2>/dev/null \
  | grep -v node_modules \
  | grep -v "CESIUM_ION_ASSET_ID" \
  | grep -v "test\|spec\|mock\|__tests__\|\.d\.ts" || echo "  (none found)"

# Pattern 4: Files using legacy raster-storage-client
echo ""
echo "--- Pattern 4: Files importing legacy raster-storage-client ---"
grep -rn "raster-storage-client\|RasterStorageClient" \
  --include="*.ts" --include="*.tsx" "$SRC_DIR" 2>/dev/null \
  | grep -v node_modules || echo "  (none found)"

echo ""
echo "═══ Automated Replacements (DISABLED - MANUAL REFACTORING RECOMMENDED) ═══"
echo "Manual refactoring is recommended to use Cesium ion Asset IDs from a central map config."
echo "Example: const imageryProvider = new IonImageryProvider({ assetId: process.env.NEXT_PUBLIC_CESIUM_ION_ASSET_ID_SENTINEL_2024 });"
echo ""

echo "═══ Verification ═══"
echo "Ensure these env vars are set in Vercel and .env.local, sourced from the .env.cesium-assets file:"
echo "  NEXT_PUBLIC_CESIUM_ION_ASSET_ID_...=your_asset_id"
echo ""
echo "Note: The frontend should now use Cesium ion Asset IDs for all raster layers."
echo "Done."
