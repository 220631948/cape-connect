# pmtiles-pipeline.md — MCP Server Specification

**Purpose:** PMTiles v3 conversion and management for offline geospatial data.

## Tools

### `convert_geopackage`

- **Description:** Converts a GeoPackage (.gpkg) file to PMTiles v3.
- **Input:** `{ input_path: string, output_path: string, minzoom?: number, maxzoom?: number }`
- **Verification:** Includes GeoPackage integrity check (via SQLite) before conversion.

### `upload_to_storage`

- **Description:** Uploads a PMTiles file to Supabase Storage or Cloudflare R2.
- **Input:** `{ local_path: string, destination_bucket: string, destination_path: string }`

### `generate_source_config`

- **Description:** Generates MapLibre `addProtocol` source configuration for a PMTiles URL.
- **Input:** `{ url: string }`
- **Return:** `{ protocol: string, url: string, source_config: object }`

### `register_offline_manifest`

- **Description:** Registers a PMTiles source in the Serwist service worker cache manifest.
- **Input:** `{ pmtiles_url: string, priority: "HIGH" | "LOW" }`

## Infrastructure & Configuration

- **Upstream Tooling:** `pmtiles` CLI, `sqlite3`, `tippecanoe` (optional for conversion).
- **Auth via Doppler:** `SUPABASE_SECRET_KEY` or `CLOUDFLARE_R2_TOKEN`.
- **Rate Limit Strategy:** 5 conversions per hour (compute intensive).
- **Three-Tier Fallback:**
  - **LIVE:** Martin Vector Tiles.
  - **CACHED:** PMTiles from Supabase Storage (offline-compatible).
  - **MOCK:** Local GeoJSON files.
- **Degradation Behaviour:** Martin down → fetch PMTiles via Serwist cache.
