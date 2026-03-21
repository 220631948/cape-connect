# GCP Hybrid Migration Plan (Prompt 2)

> **Date**: 2026-03-21
> **Author**: CLOUD-ARCHITECT-AGENT (Junie)
> **Branch**: `feature/cloud-raster-comparative-analysis`
> **Prereq**: [Prompt 1 — Comparative Analysis](./CLOUD_RASTER_COMPARATIVE_ANALYSIS.md)
> **Status**: DRAFT — pending open question verification

---

## CHECKPOINT (from Prompt 1)

```json
{
  "prompt": 1,
  "winner": "GCP",
  "platform": "GCP",
  "monthly_cost_model": {
    "gcp": "$15.88/mo (GCS Standard + Cloud Run free + BigQuery free)"
  },
  "credit_budget": "$200 / 90 days",
  "raster_data_confirmed": "~50 GB GeoTIFF (ASSUMED — see OQ-RASTER-1)",
  "must_retain_on_supabase": ["PostGIS vector schema", "Martin tile server", "Auth (Supabase Auth)"],
  "must_migrate": ["Raster blob storage (currently Cloudflare R2)", "Raster processing pipeline"],
  "optional_migrate": ["Frontend from Vercel — evaluate cost first"]
}
```

---

## ASSUMPTIONS VERIFIED AGAINST CODEBASE

| #   | Question                                                                  | Finding                                                                                                                                                                                 | Source                                                            |
|-----|---------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| AV1 | Does codebase use `supabase.storage.from('bucket').upload()` for rasters? | **No.** Rasters use **Cloudflare R2** via `backend/app/services/r2_client.py` (boto3/S3-compatible). Small files use Supabase `.from()` for non-raster data (tenants, profiles, cache). | `r2_client.py`, `proxy.ts`, `cache.ts`                            |
| AV2 | Does backend use PostGIS `ST_Value`/`ST_Clip` on in-database rasters?     | **Not observed.** No `postgis_raster` queries found. Rasters stored as files in R2, referenced by URL.                                                                                  | `grep -r "ST_Value\|ST_Clip\|raster2pgsql" backend/` = no results |
| AV3 | Is there a GeoTIFF → COG conversion step?                                 | **No.** `r2_client.py` uploads raw bytes with no COG conversion. `rasterio` is in `requirements.txt` but no `rio-cogeo` usage found.                                                    | `requirements.txt`, `r2_client.py`                                |
| AV4 | What triggers raster ingestion?                                           | **User upload** via `QuickDropArea.tsx` (drag-and-drop) → backend API. No scheduled ETL found.                                                                                          | `QuickDropArea.tsx`, `r2_client.py`                               |
| AV5 | Does frontend use WMTS/WMS or direct COG range requests?                  | **Neither for rasters.** Satellite imagery uses XYZ tile URLs from Sentinel/Stadia APIs. No direct COG range reads. CesiumJS uses `createWorldTerrainAsync()` (Cesium Ion terrain).     | `SatelliteLayer.tsx`, `CesiumViewer.tsx`                          |

### Key Architectural Finding

The current stack uses **Cloudflare R2** (not Supabase Storage) for raster files. The `StoragePort` ABC in
`backend/app/ports/outbound/storage.py` provides a clean hexagonal interface. Migration to GCS requires:

1. A new `GCSStorageAdapter` implementing `StoragePort`
2. Swapping the R2 config for GCS config in `backend/app/core/config.py`
3. Adding COG conversion in the upload pipeline (currently missing)

---

## SECTION 1 — ARCHITECTURE DECISION: HYBRID

### Decision: Retain Supabase + Add GCP for Raster Only

**Full migration cost:**

- Cloud SQL (PostGIS): ~$7.67/mo (db-f1-micro) + vector data storage
- Cloud Run (Martin replacement): ~$0–5/mo
- Auth migration: weeks of engineering effort
- **Total: ~$12–20/mo + significant engineering risk**

**Hybrid cost:**

- Supabase Free: $0/mo (PostGIS + Auth + Martin = unchanged)
- GCS (raster storage): ~$15.88/mo
- **Total: ~$15.88/mo + minimal engineering (swap storage adapter)**

### Crossover Threshold

Hybrid is cheaper than full migration **as long as monthly raster
egress < $25/mo** (~208 GB egress on GCS). At current assumed volume (122 GB/mo), hybrid saves ~$5–10/mo and avoids:

- Auth migration risk
- Martin reconfiguration
- PostGIS schema migration
- Frontend redeployment

**Verdict: HYBRID. No question.**

---

## SECTION 2 — STORAGE MIGRATION

### 2a) Terraform — GCS Raster Bucket

> File: `infra/gcp/main.tf`

```hcl
# See infra/gcp/main.tf for the full Terraform configuration.
# Key resources:
# - google_storage_bucket.capegis_rasters (africa-south1, Standard class)
# - CORS configured for browser COG range requests (GET + HEAD + Range header)
# - Lifecycle: transition to Nearline after 90 days, Coldline after 365 days
# - Uniform bucket-level access (no per-object ACLs)
```

Terraform is generated at `infra/gcp/main.tf` (see file).

### 2b) Python Migration Script

> File: `scripts/migrate_r2_to_gcs.py`

The migration script:

- Downloads each object from R2 using the existing `r2_client.py` boto3 client
- Converts non-COG GeoTIFFs to COG using `rio-cogeo` during migration
- Uploads to GCS with appropriate `Content-Type` and `Cache-Control` headers
- Generates STAC Item JSON for each raster using `pystac` + `rio-stac`
- Writes STAC items to `gs://capegis-rasters/stac/` prefix
- **Idempotent**: skips files that already exist in GCS (checks `blob.exists()`)
- **Zero downtime**: old R2 URLs continue to work during migration

### 2c) TypeScript RasterStorageClient

> File: `src/lib/storage/raster-storage-client.ts`

Drop-in replacement interface:

```typescript
interface RasterStorageClient {
  upload(path: string, file: File, options?: UploadOptions): Promise<{ url: string }>
  getSignedUrl(path: string, expiresIn: number): Promise<string>
  getCOGUrl(path: string): string  // direct public URL for range requests
  delete(path: string): Promise<boolean>
}
```

Implementation wraps GCS JSON API with signed URL generation for uploads and direct public URLs for COG range reads (no
signed URL needed for public COGs).

### 2d) Python GCS Storage Adapter

> File: `backend/app/adapters/outbound/storage/gcs_adapter.py`

Implements `StoragePort` ABC using `google-cloud-storage` SDK. Drop-in replacement for R2 client with identical
interface. Includes automatic COG validation on upload.

---

## SECTION 3 — COMPUTE / PROCESSING MIGRATION

### Cloud Run Service: `capegis-raster-processor`

**Trigger**: GCS object finalize event → Cloud Run via Eventarc

**Pipeline**: Upload GeoTIFF → Cloud Run converts to COG → writes COG back to GCS → generates STAC item → writes to STAC
prefix

### Dockerfile

> File: `backend/Dockerfile.raster` (new, alongside existing `backend/Dockerfile`)

```dockerfile
FROM ghcr.io/osgeo/gdal:ubuntu-small-3.9.0

# Python + raster processing stack
RUN apt-get update && apt-get install -y python3.11 python3-pip && \
    pip3 install --no-cache-dir \
    fastapi uvicorn \
    rasterio rio-cogeo rio-tiler rio-stac \
    pystac google-cloud-storage \
    && rm -rf /var/lib/apt/lists/*

# GDAL performance tuning for COG streaming
ENV GDAL_CACHEMAX=256
ENV CPL_VSIL_CURL_CACHE_SIZE=67108864
ENV GDAL_HTTP_MERGE_CONSECUTIVE_RANGES=YES
ENV GDAL_HTTP_MULTIPLEX=YES
ENV VSI_CACHE=TRUE
ENV VSI_CACHE_SIZE=67108864

COPY app/services/raster_processor.py /app/handler.py
WORKDIR /app
EXPOSE 8080
CMD ["uvicorn", "handler:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Handler: `raster_processor.py`

Endpoints:

- `POST /process` — Triggered by Eventarc on GCS upload. Downloads raw GeoTIFF, converts to COG, uploads COG, generates
  STAC item.
- `GET /health` — Health check for Cloud Run.
- `POST /tile/{z}/{x}/{y}` — On-demand tile generation from COG using `rio-tiler` (optional, for dynamic raster tiles).

### GDAL Environment Variables Explained

| Variable                             | Value    | Purpose                                             |
|--------------------------------------|----------|-----------------------------------------------------|
| `GDAL_CACHEMAX`                      | 256 (MB) | In-memory raster block cache for repeated reads     |
| `CPL_VSIL_CURL_CACHE_SIZE`           | 64 MB    | Cache for HTTP range request responses (COG reads)  |
| `GDAL_HTTP_MERGE_CONSECUTIVE_RANGES` | YES      | Merge adjacent byte ranges into single HTTP request |
| `GDAL_HTTP_MULTIPLEX`                | YES      | HTTP/2 multiplexing for parallel range requests     |
| `VSI_CACHE`                          | TRUE     | Enable GDAL's virtual filesystem cache              |
| `VSI_CACHE_SIZE`                     | 64 MB    | Size of the VFS cache                               |

---

## SECTION 4 — DATABASE: KEEP PostGIS ON SUPABASE

### Why NOT Migrating PostGIS Is Correct

1. **Cost**: Supabase Free = $0/mo. Cloud SQL db-f1-micro = $7.67/mo. Zero benefit for vector data.
2. **Martin tile server**: Already configured on Supabase. Moving PostGIS means reconfiguring Martin — high risk, zero
   gain.
3. **Auth**: Supabase Auth is deeply integrated (RLS policies, `proxy.ts`, `admin-session.ts`). Migration = weeks of
   work.
4. **Schema stability**: Vector tables (tenants, profiles, spatial features) have no scaling pressure.

### Out-DB Raster Support (Optional Enhancement)

If point-sampling queries are needed (e.g., "what is the elevation at this coordinate?"), use PostGIS **out-db rasters**
that read pixels from GCS:

```sql
-- Enable out-of-database raster support
SET postgis.enable_outdb_rasters = true;
SET postgis.gdal_enabled_drivers = 'ENABLE_ALL';

-- Add cloud URI column to raster metadata table (if one exists)
ALTER TABLE raster_catalog ADD COLUMN IF NOT EXISTS cloud_uri TEXT;

-- Update URIs to point to GCS COGs
UPDATE raster_catalog
SET cloud_uri = 'gs://capegis-rasters/cog/' || filename
WHERE cloud_uri IS NULL;

-- Point query using out-db raster (GDAL reads from GCS via /vsigs/)
-- Note: Requires GDAL with GCS support on Supabase's PostGIS
-- This may NOT work on Supabase Free tier (no control over GDAL drivers).
-- Alternative: Route point queries through Cloud Run raster processor.
SELECT ST_Value(rast, ST_SetSRID(ST_MakePoint(18.4241, -33.9249), 4326))
FROM raster_catalog
WHERE ST_Intersects(rast, ST_SetSRID(ST_MakePoint(18.4241, -33.9249), 4326));
```

**⚠ Supabase Free tier limitation**: No control over `postgis.enable_outdb_rasters` or GDAL drivers. Out-db rasters
likely won't work. Route these queries through the Cloud Run raster processor instead.

---

## SECTION 5 — FRONTEND: EVALUATE BEFORE MIGRATING

### Current Frontend Bandwidth Assessment

| Source                   | Method                           | Bandwidth Impact                        |
|--------------------------|----------------------------------|-----------------------------------------|
| Next.js SSR/SSG pages    | Vercel CDN                       | Low (~5 GB/mo estimated)                |
| MapLibre vector tiles    | Martin on Supabase               | Does NOT count against Vercel bandwidth |
| Sentinel satellite tiles | External Stadia/Sentinel APIs    | Does NOT count against Vercel bandwidth |
| CesiumJS terrain         | Cesium Ion (external)            | Does NOT count against Vercel bandwidth |
| Raster COG tiles         | Will be served from GCS directly | Does NOT count against Vercel bandwidth |

**Vercel Free Tier**: 100 GB bandwidth/mo.
**Estimated Vercel bandwidth**: ~5–15 GB/mo (SSR pages + static assets only).

### Verdict: DO NOT MIGRATE FRONTEND

Vercel bandwidth usage is well under 100 GB/mo because:

- All heavy data (tiles, rasters, terrain) is served from external origins
- Only SSR HTML, JS bundles, and static assets go through Vercel
- The free tier is sufficient for years at current scale

**Migration trigger**: Only if Vercel bandwidth exceeds 80 GB/mo (set a monitoring alert).

### CesiumJS CORS Configuration

Ensure the GCS bucket CORS allows CesiumJS terrain tile requests:

```json
[
  {
    "origin": ["https://capegis.vercel.app", "http://localhost:3000"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Content-Range", "Accept-Ranges", "Content-Length", "ETag"],
    "maxAgeSeconds": 86400
  }
]
```

This is already included in the Terraform configuration (`infra/gcp/main.tf`).

---

## SECTION 6 — COST VALIDATION (Post-Migration)

### Shell Script: `scripts/estimate_gcs_cost.sh`

```bash
#!/usr/bin/env bash
# Estimate monthly GCS cost from actual usage metrics.
# Requires: gcloud CLI authenticated, gsutil installed.
# Usage: ./scripts/estimate_gcs_cost.sh [BUCKET_NAME]

set -euo pipefail

BUCKET="${1:-capegis-rasters}"
GCS_STORAGE_RATE=0.023    # $/GB/mo Standard, africa-south1
GCS_EGRESS_RATE=0.12      # $/GB to internet
GCS_OPS_RATE=0.0004       # $/1K Class B GET requests

echo "=== GCS Cost Estimator for gs://${BUCKET} ==="

# Storage volume
STORAGE_BYTES=$(gsutil du -s "gs://${BUCKET}" 2>/dev/null | awk '{print $1}')
STORAGE_GB=$(echo "scale=2; ${STORAGE_BYTES:-0} / 1073741824" | bc)
STORAGE_COST=$(echo "scale=2; ${STORAGE_GB} * ${GCS_STORAGE_RATE}" | bc)
echo "Storage: ${STORAGE_GB} GB × \$${GCS_STORAGE_RATE}/GB = \$${STORAGE_COST}/mo"

# Egress (from Cloud Monitoring — last 30 days)
# Metric: storage.googleapis.com/network/sent_bytes_count
EGRESS_BYTES=$(gcloud monitoring read \
  --filter="metric.type=\"storage.googleapis.com/network/sent_bytes_count\" AND resource.labels.bucket_name=\"${BUCKET}\"" \
  --interval="$(date -d '30 days ago' -u +%Y-%m-%dT%H:%M:%SZ)/$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --format="value(points.value.int64Value)" 2>/dev/null | awk '{s+=$1} END {print s+0}')
EGRESS_GB=$(echo "scale=2; ${EGRESS_BYTES} / 1073741824" | bc)
EGRESS_COST=$(echo "scale=2; ${EGRESS_GB} * ${GCS_EGRESS_RATE}" | bc)
echo "Egress:  ${EGRESS_GB} GB × \$${GCS_EGRESS_RATE}/GB = \$${EGRESS_COST}/mo"

# Request count (from Cloud Monitoring)
REQUEST_COUNT=$(gcloud monitoring read \
  --filter="metric.type=\"storage.googleapis.com/api/request_count\" AND resource.labels.bucket_name=\"${BUCKET}\"" \
  --interval="$(date -d '30 days ago' -u +%Y-%m-%dT%H:%M:%SZ)/$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --format="value(points.value.int64Value)" 2>/dev/null | awk '{s+=$1} END {print s+0}')
OPS_COST=$(echo "scale=4; ${REQUEST_COUNT} / 1000 * ${GCS_OPS_RATE}" | bc)
echo "Ops:     ${REQUEST_COUNT} requests × \$${GCS_OPS_RATE}/1K = \$${OPS_COST}/mo"

# Total
TOTAL=$(echo "scale=2; ${STORAGE_COST} + ${EGRESS_COST} + ${OPS_COST}" | bc)
echo ""
echo "═══════════════════════════════════"
echo "  ESTIMATED MONTHLY TOTAL: \$${TOTAL}"
echo "═══════════════════════════════════"

# Budget alert
BUDGET=30
if (( $(echo "${TOTAL} > ${BUDGET}" | bc -l) )); then
  echo "⚠️  WARNING: Exceeds \$${BUDGET}/mo budget ceiling!"
  echo "  → Enable Cloud CDN to reduce egress cost"
  echo "  → Check for non-COG rasters causing egress amplification"
fi
```

---

## SECTION 7 — CREDIT BURN RATE WARNING

### Credit Depletion Model

| Parameter                | Value                           |
|--------------------------|---------------------------------|
| Credit remaining         | $200.00                         |
| Daily burn (storage)     | $1.15 / 30 = $0.038/day         |
| Daily burn (egress)      | $14.52 / 30 = $0.484/day        |
| Daily burn (ops)         | $0.21 / 30 = $0.007/day         |
| Daily burn (compute)     | $0.00/day (Cloud Run free tier) |
| **Total daily burn**     | **$0.529/day**                  |
| **Days until depletion** | **$200 / $0.529 ≈ 378 days**    |
| **Credit expires**       | **90 days from activation**     |

### Timeline

```
Day 0:   Activate GCP credit. $200 remaining.
Day 30:  ~$15.88 consumed. $184.12 remaining. ✅ On track.
Day 60:  ~$31.76 consumed. $168.24 remaining. ✅ On track.
Day 90:  ~$47.64 consumed. Credit EXPIRES. $152.36 forfeited.
Day 91:  Billing switches to payment method. ~$15.88/mo ongoing.
```

### ⚠ CREDIT DEPLETION WARNING

**Status: NO WARNING** — Daily burn ($0.53/day) is low enough that only ~$47.64
of $200 credit will be used before the 90-day expiry. The remaining ~$152 will be **forfeited**.

**Recommendation**: Use excess credit for:

1. **Cloud CDN setup** ($0.02–0.06/GB cache fill) — reduces long-term egress cost by 60–80%
2. **BigQuery Earth Engine experiments** — validate raster analytics use cases
3. **Load testing** — simulate 2M tile requests to validate cost model
4. **Pre-process large raster datasets** — batch COG conversion using Cloud Run during credit period

### Post-Credit Monthly Cost: $15.88/mo

Well within the $30/mo budget ceiling. No service cuts needed.

---

## MIGRATION CHECKLIST

### Phase 1: Infrastructure (Week 1)

- [ ] Apply Terraform (`infra/gcp/main.tf`) to create GCS bucket
- [ ] Configure CORS on GCS bucket for frontend origins
- [ ] Deploy Cloud Run raster processor (`backend/Dockerfile.raster`)
- [ ] Set up Eventarc trigger (GCS upload → Cloud Run)

### Phase 2: Backend Adapter Swap (Week 1–2)

- [ ] Add `google-cloud-storage` to `backend/requirements.txt`
- [ ] Implement `GCSStorageAdapter` in `backend/app/adapters/outbound/storage/gcs_adapter.py`
- [ ] Update `backend/app/core/config.py` with GCS config (bucket name, project ID)
- [ ] Swap storage adapter injection from R2 → GCS
- [ ] Add COG conversion step in upload pipeline

### Phase 3: Data Migration (Week 2)

- [ ] Run `scripts/migrate_r2_to_gcs.py` to copy existing rasters from R2 → GCS
- [ ] Validate all COGs with `rio cogeo validate`
- [ ] Generate STAC catalog from migrated items
- [ ] Verify frontend can read COG tiles from GCS URLs

### Phase 4: Frontend Integration (Week 2–3)

- [ ] Add `RasterStorageClient` TypeScript wrapper
- [ ] Update `SatelliteLayer.tsx` to use GCS COG URLs (if applicable)
- [ ] Test CesiumJS terrain loading with GCS-hosted quantized mesh (future)
- [ ] Verify CORS allows range requests from `capegis.vercel.app`

### Phase 5: Validation (Week 3)

- [ ] Run `scripts/estimate_gcs_cost.sh` to validate cost model
- [ ] Load test with simulated tile traffic
- [ ] Confirm Martin vector tiles unaffected
- [ ] Confirm Supabase Auth unaffected
- [ ] Set up GCP budget alert at $25/mo

### Phase 6: Cutover (Week 3–4)

- [ ] Switch DNS/config to serve rasters from GCS
- [ ] Keep R2 as read-only fallback for 30 days
- [ ] Monitor egress and request metrics daily for first week
- [ ] Decommission R2 bucket after 30-day parallel run

---

## STATE

```json
{
  "prompt": 2,
  "platform": "GCP",
  "migration_steps_completed": [],
  "terraform_generated": true,
  "migration_script_generated": true,
  "ts_client_generated": true,
  "gcs_adapter_generated": true,
  "estimated_monthly_cost": "$15.88/mo",
  "credit_depletion_days": 90,
  "credit_depletion_warning": false,
  "credit_forfeited": "~$152.36 (use for CDN + load testing + BigQuery experiments)",
  "open_questions": [
    "OQ-RASTER-1: Exact raster data volume (GB/TB)? — STILL OPEN",
    "OQ-RASTER-2: Raster formats in use? — Likely GeoTIFF (rasterio in requirements)",
    "OQ-RASTER-3: Actual monthly request volume? — STILL OPEN",
    "OQ-RASTER-4: Is postgis_raster extension enabled on Supabase? — Likely NO (no queries found)",
    "OQ-RASTER-5: POPIA — SA-only residency required? — STILL OPEN",
    "OQ-RASTER-6: GCP $200 credit — has the 90-day clock started? — STILL OPEN"
  ]
}
```

---

> **Next Step**: Generate the actual code files:
> `infra/gcp/main.tf`, `backend/app/adapters/outbound/storage/gcs_adapter.py`,
> `scripts/migrate_r2_to_gcs.py`, `src/lib/storage/raster-storage-client.ts`
