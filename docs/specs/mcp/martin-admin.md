# martin-admin.md — MCP Server Specification

**Purpose:** Management of dynamic PostGIS vector tile sources through Martin's REST API.

## Tools

### `get_catalog`

- **Description:** List all currently registered vector tile sources in the Martin catalog.
- **Return (TypeScript):**
  ```typescript
  {
    sources: Array<{
      id: string;
      type: "table" | "function";
      minzoom: number;
      maxzoom: number;
    }>;
  }
  ```

### `get_health`

- **Description:** Checks the health of the Martin service and its connectivity to PostGIS.

### `regenerate_cache`

- **Description:** Force cache regeneration for a specific bounding box and source.
- **Input:** `{ bbox: [number, number, number, number], source_id: string }`

### `register_table`

- **Description:** Dynamically register a new PostGIS table as a Martin source without server restart.
- **Input:** `{ table_name: string, schema: string, id?: string }`

### `wire_layer` (Compound Tool)

- **Description:** Returns the complete MapLibre source + layer configuration JSON given a table name, zoom range, and layer type.
- **Input:** `{ table_name: string, minzoom: number, maxzoom: number, type: "fill" | "line" | "circle" | "symbol" }`
- **Return:**
  ```typescript
  {
    source: MapLibreSourceConfig;
    layer: MapLibreLayerConfig;
  }
  ```

## Infrastructure & Configuration

- **Upstream API:** Martin (Rust) `/catalog` and admin REST API.
- **Auth via Doppler:** `MARTIN_ADMIN_TOKEN` for dynamic registration.
- **Rate Limit Strategy:** 30 calls per minute for administrative tasks.
- **Three-Tier Fallback:**
  - **LIVE:** Active Martin server on DigitalOcean.
  - **CACHED:** Static PMTiles archive in Supabase Storage.
  - **MOCK:** Local GeoJSON file fallback.
- **Degradation Behaviour:** Martin down → switch to PMTiles source → switch to Mock source.
