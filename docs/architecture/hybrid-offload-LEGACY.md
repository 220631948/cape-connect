# Hybrid Offload Plan — CapeTown GIS Hub

This document outlines the architecture, rationale, and cost-guard rails for offloading
raster tile serving to GCP Cloud Storage while retaining Supabase for vector data, auth,
and Martin tile serving.

---

## SECTION 1 — SERVICE MAP

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER / CLIENT                            │
│  MapLibre GL JS (2D)  ·  CesiumJS (3D Tiles)  ·  Next.js SSR      │
└───────┬──────────────────────┬──────────────────────┬──────────────┘
        │ vector tiles         │ raster COG/PMTiles   │ SSR / API
        ▼                      ▼                      ▼
┌───────────────┐   ┌─────────────────────┐   ┌──────────────────┐
│  STAYS:       │   │  NEW: GCP Cloud     │   │  STAYS:          │
│  Supabase     │   │  Storage            │   │  Vercel CDN      │
│  ─────────    │   │  (africa-south1)    │   │  (Next.js SSR,   │
│  • PostGIS    │   │  ─────────────────  │   │   Edge Functions) │
│    + Martin   │   │  • COG rasters      │   │                  │
│  • Auth/RLS   │   │  • PMTiles archives │   │  env:            │
│  • Realtime   │   │  • STAC catalog     │   │  NEXT_PUBLIC_    │
│  • Out-db     │   │    (static JSON)    │   │  RASTER_BASE_URL │
│    raster     │   │                     │   │  = https://      │
│    metadata   │   │  Bucket: cape-town  │   │  storage.google  │
│               │   │    -rasters         │   │  apis.com/cape-  │
│               │   │                     │   │  town-rasters    │
└───────┬───────┘   └─────────┬───────────┘   └──────────────────┘
        │                     │
        │  out-db URI ref     │  upload trigger
        ▼                     ▼
┌───────────────────────────────────────────┐
│  NEW: GCP Cloud Run (raster processor)    │
│  ─────────────────────────────────────    │
│  • GeoTIFF → COG conversion (rio-cogeo)  │
│  • STAC item generation (pystac)         │
│  • Triggered by GCS upload event         │
│  • Dockerfile: GDAL + rasterio + FastAPI │
└───────────────────────────────────────────┘

┌───────────────────────────────────────────┐
│  BRIDGE: Supabase Edge Function           │
│  supabase/functions/raster-proxy/         │
│  ─────────────────────────────────────    │
│  • JWT validation (Supabase Auth)        │
│  • GCS signed URL generation             │
│  • Cache-Control for CesiumJS tiles      │
└───────────────────────────────────────────┘
```

---

## SECTION 2 — THE BRIDGE (Raster Proxy Edge Function)

**File:** [`supabase/functions/raster-proxy/index.ts`](../../supabase/functions/raster-proxy/index.ts)

The raster proxy is a Deno-based Supabase Edge Function that:

1. **Validates Supabase JWT** — extracts `Authorization` header, calls `supabaseClient.auth.getUser()`.
2. **Generates GCS Signed URLs** — uses service account credentials (via `GCS_SA_EMAIL` / `GCS_SA_PRIVATE_KEY` env vars)
   to mint short-lived signed URLs for private bucket objects.
3. **Sets Cache-Control headers** — `public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400` optimised for
   CesiumJS terrain tile caching.

**Required env vars** (set in Supabase Dashboard → Edge Functions → Secrets):
| Variable | Description |
|---|---|
| `SUPABASE_URL` | Auto-injected by Supabase |
| `SUPABASE_ANON_KEY` | Auto-injected by Supabase |
| `GCS_BUCKET` | GCS bucket name (default: `cape-town-rasters`) |
| `GCS_SA_EMAIL` | Service account email for signing |
| `GCS_SA_PRIVATE_KEY` | PEM private key (escaped `\n`) |

**Usage from frontend:**

```typescript
const res = await fetch(
  `${SUPABASE_URL}/functions/v1/raster-proxy?path=cadastral/2024-01.tif`,
  { headers: { Authorization: `Bearer ${session.access_token}` } }
);
const { url } = await res.json(); // GCS signed URL
```

---

## SECTION 3 — COG SERVING FOR CESIUMJS + MAPLIBRE

### CesiumJS Configuration

```typescript
import { UrlTemplateImageryProvider } from 'cesium';

const rasterBaseUrl = process.env.NEXT_PUBLIC_RASTER_BASE_URL;

const cogProvider = new UrlTemplateImageryProvider({
  url: `${rasterBaseUrl}/sentinel2/{Time}/{z}/{x}/{y}.png`,
  minimumLevel: 0,
  maximumLevel: 18,
  credit: 'Copernicus Sentinel-2 / City of Cape Town',
});

viewer.imageryLayers.addImageryProvider(cogProvider);
```

### MapLibre Raster Layer

**File:** [`src/components/map/layers/CogLayer.tsx`](../../src/components/map/layers/CogLayer.tsx)

Uses the `pmtiles` protocol for efficient single-file range requests:

```typescript
map.addSource('cog-pmtiles-source', {
  type: 'raster',
  url: 'pmtiles://https://storage.googleapis.com/cape-town-rasters/cadastral/2024-01.pmtiles',
  tileSize: 256,
});
```

### PMTiles Recommendation

**We strongly recommend pre-generating PMTiles for all Cape Town raster layers.**

- **Why?** PMTiles is a single-file tile archive. Instead of millions of individual PNG tiles, a single file serves all
  zoom levels via HTTP range requests.
- **Cost savings:** Eliminates per-tile GET request
  charges ($0.0004/10K on GCS). A 50 GB raster layer generating 100K tile requests/month saves ~$0.40/mo in request fees
  alone — and scales linearly.
- **Generation:** `pmtiles convert input.mbtiles output.pmtiles` or `rio-mbtiles` + `pmtiles convert`.
- **CesiumJS compatibility:** Use via MapLibre adapter or pre-tile to 3D Tiles format for terrain.

### Temporal Scrubber

**File:** [`src/components/map/controls/TemporalScrubber.tsx`](../../src/components/map/controls/TemporalScrubber.tsx)

Queries the STAC catalog for available raster dates and provides a timeline slider for CesiumJS/MapLibre layer
switching.

---

## SECTION 4 — STAC CATALOG

**File:** [`scripts/generate_stac_catalog.py`](../../scripts/generate_stac_catalog.py)

The script uses `pystac` + `rio-stac` to generate a static STAC catalog from migrated COG rasters:

1. Scans input directory for `.tif` files
2. Extracts datetime from filename (pattern: `YYYY-MM`)
3. Creates STAC items with `COG` media type and cloud storage hrefs
4. Writes self-contained catalog JSON to output directory (uploaded to GCS)

**Run:**

```bash
CLOUD_BUCKET=cape-town-rasters python scripts/generate_stac_catalog.py
```

### STAC Item Template (Cape Town Cadastral Rasters)

```json
{
  "type": "Feature",
  "stac_version": "1.0.0",
  "id": "cct-cadastral-2024-01",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[18.3, -34.1], [18.6, -34.1], [18.6, -33.8], [18.3, -33.8], [18.3, -34.1]]]
  },
  "bbox": [18.3, -34.1, 18.6, -33.8],
  "properties": {
    "datetime": "2024-01-01T00:00:00Z",
    "title": "Cape Town Cadastral — January 2024",
    "proj:epsg": 4326,
    "eo:cloud_cover": null,
    "description": "Monthly cadastral raster snapshot for City of Cape Town"
  },
  "links": [
    { "rel": "root", "href": "./catalog.json", "type": "application/json" },
    { "rel": "parent", "href": "./catalog.json", "type": "application/json" },
    { "rel": "self", "href": "./cct-cadastral-2024-01.json", "type": "application/json" }
  ],
  "assets": {
    "data": {
      "href": "gs://cape-town-rasters/cadastral/2024-01.tif",
      "type": "image/tiff; application=geotiff; profile=cloud-optimized",
      "title": "COG Raster",
      "roles": ["data"]
    },
    "pmtiles": {
      "href": "gs://cape-town-rasters/cadastral/2024-01.pmtiles",
      "type": "application/vnd.pmtiles",
      "title": "PMTiles Archive",
      "roles": ["data"]
    },
    "thumbnail": {
      "href": "gs://cape-town-rasters/cadastral/thumbs/2024-01.png",
      "type": "image/png",
      "title": "Thumbnail",
      "roles": ["thumbnail"]
    }
  }
}
```

---

## SECTION 5 — GOOGLE EARTH ENGINE INTEGRATION

**File:** [`scripts/gee_export_cape_town.js`](../../scripts/gee_export_cape_town.js)

**Deadline:** April 27, 2026 (GEE quota tier deadline).

The GEE export script:

1. Defines Cape Town AOI polygon (18.3°E–18.6°E, 33.8°S–34.1°S)
2. Filters Sentinel-2 SR collection by date and cloud cover (<10%)
3. Computes median composite and clips to AOI
4. Exports as **Cloud Optimized GeoTIFF** (`formatOptions: { cloudOptimized: true }`)
5. Writes directly to the GCS bucket (`cape-town-rasters`)

**Usage:**

```javascript
// In GEE Code Editor or via earthengine CLI:
// 1. Authenticate: earthengine authenticate
// 2. Run: earthengine run scripts/gee_export_cape_town.js
// 3. Monitor: earthengine task list
```

**Post-export pipeline:**

```
GEE Export → GCS bucket upload event → Cloud Run (STAC item generation) → catalog.json updated
```

---

## SECTION 6 — COST GUARD RAILS

**File:** [`infra/gcp/budget_alerts.tf`](../../infra/gcp/budget_alerts.tf)

Terraform configuration that deploys GCP budget alerts:

| Trigger     | Threshold      | Action                          |
|-------------|----------------|---------------------------------|
| Daily spend | > $3 (~$90/mo) | Email + webhook notification    |
| Egress      | > 50 GB/mo     | Disable public bucket access    |
| Storage     | > 100 GB       | Notification + lifecycle review |

**Alert actions:**

1. **Disable public access** — revoke `allUsers` IAM binding on the GCS bucket
2. **Notify** — send webhook to Slack/Discord + email to ops team
3. **Log** — write alert event to Cloud Logging for audit trail

**Deploy:**

```bash
cd infra/gcp
terraform init
terraform plan -var="project_id=YOUR_PROJECT" -var="notification_email=ops@example.com"
terraform apply
```

---

## SECTION 7 — ROLLBACK PLAN

If cloud costs exceed budget or service degrades, revert in 4 steps:

### Step 1: Re-enable Supabase Storage

```sql
-- No schema changes needed. Re-enable uploads to Supabase Storage bucket:
-- Dashboard → Storage → capegis-rasters → Settings → Enable
```

### Step 2: Update Environment Variable

```bash
# Vercel Dashboard → Settings → Environment Variables
# Change:
NEXT_PUBLIC_RASTER_BASE_URL=https://<supabase-project>.supabase.co/storage/v1/object/public/rasters
# From:
# NEXT_PUBLIC_RASTER_BASE_URL=https://storage.googleapis.com/cape-town-rasters
```

### Step 3: Keep Cloud Read-Only

Do **not** delete the GCS bucket immediately. Keep it read-only so:

- Cached URLs in CDN/browser continue to resolve
- In-flight CesiumJS tile requests don't 404
- PMTiles range requests complete gracefully

Set a 30-day sunset window, then delete.

### Step 4: No Database Schema Changes

The PostGIS schema is untouched by this migration:

- Out-db raster URIs (`cloud_uri` column) are plain strings
- Martin vector tile serving is unaffected
- Supabase Auth / RLS policies unchanged
- Simply update `cloud_uri` values if pointing back to Supabase Storage:

```sql
UPDATE raster_layers
SET cloud_uri = REPLACE(cloud_uri, 'gs://cape-town-rasters/', 'https://<project>.supabase.co/storage/v1/object/public/rasters/')
WHERE cloud_uri LIKE 'gs://%';
```

**Total rollback time:** < 5 minutes (env var change + Vercel redeploy).

---

## Success Criteria

- ✅ Zero changes to Supabase schema for vector data
- ✅ CesiumJS temporal scrubber can query STAC API for raster dates
- ✅ COGs served with HTTP range requests (no full-file downloads)
- ✅ GEE export pipeline operational before April 27, 2026 deadline
- ✅ Monthly cost < $20 after $200 GCP credit depletes
- ✅ Rollback to Supabase Storage requires only env var change
- ✅ Hardcoded API key removed from codebase
