# gee-analysis.md — MCP Server Specification

**Purpose:** Satellite analysis pipeline using Google Earth Engine for Cape Town metro monitoring.

## Tools

### `get_satellite_composite`

- **Description:** Generates a cloud-free satellite composite (Sentinel-2) for Cape Town metro.
- **Input:** `{ year: number, month: number, max_cloud_cover?: number }`
- **Return:** `{ asset_id: string, composite_url: string, status: "LIVE" | "CACHED" }`

### `calculate_ndvi`

- **Description:** Returns a Normalized Difference Vegetation Index (NDVI) map for the given period.
- **Input:** `{ asset_id: string }`

### `calculate_ndwi`

- **Description:** Returns a Normalized Difference Water Index (NDWI) for flood risk assessment.
- **Input:** `{ asset_id: string }`

### `export_to_cog`

- **Description:** Export a satellite product to Cloud Optimized GeoTIFF (COG) in Supabase Storage.
- **Input:** `{ asset_id: string, bucket: string, path: string }`

## Infrastructure & Configuration

- **Upstream API:** Google Earth Engine (Python/Node.js client).
- **Auth via Doppler:** `GOOGLE_EE_SERVICE_ACCOUNT` and `GOOGLE_EE_PRIVATE_KEY`.
- **Rate Limit Strategy:** 10 requests per minute due to compute limits.
- **Quota Management:** Each tool response must include an `estimated_eecu_cost` to monitor against the 150–1000 EECU-hour monthly limit.
- **Three-Tier Fallback:**
  - **LIVE:** Real-time GEE computation.
  - **CACHED:** Pre-rendered COG files in Supabase Storage or Cloudflare R2.
  - **MOCK:** Static JPEG/PNG snapshots of previous years.
- **Degradation Behaviour:** Quota limit reached → switch to CACHED COG → switch to MOCK static image.
