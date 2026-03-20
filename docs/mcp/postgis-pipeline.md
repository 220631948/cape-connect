# postgis-pipeline.md — MCP Server Specification

**Purpose:** Spatial pipeline for PostgreSQL/PostGIS managing geometry validity, CRS transformation, and tenant-scoped spatial analysis.

## Tools

### `analyze_area`

- **Description:** Analyze a spatial area (polygon) for parcel density, zoning distribution, and risk factors. Includes pre-RPC validation of geometry and CRS.
- **Input (TypeScript):**
  ```typescript
  {
    geometry: string; // GeoJSON string or WKT
    crs: string; // Standard: "EPSG:4326"
    tenant_id: string; // Mandatory UUID
  }
  ```
- **Return (TypeScript):**
  ```typescript
  {
    parcel_count: number;
    zoning_summary: Record<string, number>;
    risk_level: "LOW" | "MEDIUM" | "HIGH";
    status: "LIVE" | "CACHED" | "MOCK";
  }
  ```

### `get_tenant_spatial_stats`

- **Description:** Retrieve aggregate spatial statistics for a specific tenant (e.g., total property value, area covered).
- **Constraint:** Never use service role key for tenant-scoped queries. Enforce RLS via `current_setting('app.current_tenant')`.

### `ST_IsValid` (Health Check)

- **Description:** Utility tool to check validity of a geometry string.
- **Input:** `{ geometry: string }`
- **Return:** `{ is_valid: boolean, reason?: string }`

### `CRS_Collision_Detection`

- **Description:** Detect if a dataset's CRS differs from the storage standard (EPSG:4326).
- **Input:** `{ metadata: string }`
- **Return:** `{ mismatch: boolean, detected_crs: string, recommended: "EPSG:4326" }`

### `ST_MakeValid_Batch`

- **Description:** Batch repair invalid geometries in a specified table.
- **Constraint:** Requires administrative approval before execution.

## Infrastructure & Configuration

- **Upstream API:** PostGIS 3.5 on PostgreSQL 17.
- **Auth via Doppler:** `DATABASE_URL` for administrative tasks; `TENANT_ANON_KEY` for scoped queries.
- **Rate Limit Strategy:** 60 requests per minute per tenant.
- **Three-Tier Fallback:**
  - **LIVE:** Direct SQL query via PostGIS.
  - **CACHED:** Result from `api_cache` table in Supabase.
  - **MOCK:** Static aggregate data from `public/mock/stats.json`.
- **Degradation Behaviour:** If DB is unreachable, return `MOCK` status with a warning.
