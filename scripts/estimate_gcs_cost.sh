#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# GCS Cost Estimator for CapeTown GIS Hub
# ─────────────────────────────────────────────────────────────────────────────
# Estimates monthly GCS cost from actual usage metrics.
# Requires: gcloud CLI authenticated, gsutil installed.
# Usage: ./scripts/estimate_gcs_cost.sh [BUCKET_NAME]
#
# Reference: docs/research/GCP_MIGRATION_PLAN.md — Section 6
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

BUCKET="${1:-capegis-rasters}"
GCS_STORAGE_RATE=0.023    # $/GB/mo Standard, africa-south1
GCS_EGRESS_RATE=0.12      # $/GB to internet
GCS_OPS_RATE=0.0004       # $/1K Class B GET requests
BUDGET=30                 # Monthly budget ceiling ($)

echo "╔═══════════════════════════════════════════╗"
echo "║  GCS Cost Estimator — CapeTown GIS Hub    ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
echo "Bucket: gs://${BUCKET}"
echo "Date:   $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# ─── Storage Volume ───────────────────────────────────────────────────────────

STORAGE_BYTES=$(gsutil du -s "gs://${BUCKET}" 2>/dev/null | awk '{print $1}' || echo "0")
STORAGE_GB=$(echo "scale=2; ${STORAGE_BYTES:-0} / 1073741824" | bc)
STORAGE_COST=$(echo "scale=2; ${STORAGE_GB} * ${GCS_STORAGE_RATE}" | bc)
echo "📦 Storage: ${STORAGE_GB} GB × \$${GCS_STORAGE_RATE}/GB = \$${STORAGE_COST}/mo"

# ─── Egress (last 30 days) ────────────────────────────────────────────────────

START_TIME=$(date -d '30 days ago' -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -v-30d -u +%Y-%m-%dT%H:%M:%SZ)
END_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)

EGRESS_BYTES=$(gcloud monitoring read \
  "metric.type=\"storage.googleapis.com/network/sent_bytes_count\" AND resource.labels.bucket_name=\"${BUCKET}\"" \
  --interval="${START_TIME}/${END_TIME}" \
  --format="value(points.value.int64Value)" 2>/dev/null | awk '{s+=$1} END {print s+0}' || echo "0")
EGRESS_GB=$(echo "scale=2; ${EGRESS_BYTES} / 1073741824" | bc)
EGRESS_COST=$(echo "scale=2; ${EGRESS_GB} * ${GCS_EGRESS_RATE}" | bc)
echo "📤 Egress:  ${EGRESS_GB} GB × \$${GCS_EGRESS_RATE}/GB = \$${EGRESS_COST}/mo"

# ─── Request Count (last 30 days) ─────────────────────────────────────────────

REQUEST_COUNT=$(gcloud monitoring read \
  "metric.type=\"storage.googleapis.com/api/request_count\" AND resource.labels.bucket_name=\"${BUCKET}\"" \
  --interval="${START_TIME}/${END_TIME}" \
  --format="value(points.value.int64Value)" 2>/dev/null | awk '{s+=$1} END {print s+0}' || echo "0")
OPS_COST=$(echo "scale=4; ${REQUEST_COUNT} / 1000 * ${GCS_OPS_RATE}" | bc)
echo "🔄 Ops:     ${REQUEST_COUNT} requests × \$${GCS_OPS_RATE}/1K = \$${OPS_COST}/mo"

# ─── Total ─────────────────────────────────────────────────────────────────────

TOTAL=$(echo "scale=2; ${STORAGE_COST} + ${EGRESS_COST} + ${OPS_COST}" | bc)
echo ""
echo "═══════════════════════════════════════════"
echo "  ESTIMATED MONTHLY TOTAL: \$${TOTAL}"
echo "═══════════════════════════════════════════"

# ─── Budget Check ──────────────────────────────────────────────────────────────

if (( $(echo "${TOTAL} > ${BUDGET}" | bc -l) )); then
  echo ""
  echo "⚠️  WARNING: Exceeds \$${BUDGET}/mo budget ceiling!"
  echo "  Recommendations:"
  echo "  → Enable Cloud CDN to reduce egress cost (60-80% savings)"
  echo "  → Check for non-COG rasters causing egress amplification"
  echo "  → Review lifecycle rules (Nearline after 90d reduces storage cost)"
  echo "  → Consider moving cold rasters to Coldline tier"
elif (( $(echo "${TOTAL} > ${BUDGET} * 0.8" | bc -l) )); then
  echo ""
  echo "⚡ NOTE: Approaching \$${BUDGET}/mo budget ceiling (>${BUDGET}×0.8)"
  echo "  → Monitor closely and consider CDN for egress reduction"
else
  echo ""
  echo "✅ Within \$${BUDGET}/mo budget ceiling."
fi
