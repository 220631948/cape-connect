# EXISTING_SERVER_AUDIT.md — CapeTown GIS Hub

This document audits the existing MCP servers in `mcp/` against the `CLAUDE.md` spatial contracts and the `LIVE→CACHED→MOCK` fallback requirement.

## Summary Table

| Server      | Tool                    | Status       | Spatial Contract   | Fallback |
| ----------- | ----------------------- | ------------ | ------------------ | -------- |
| `openaware` | `get_flights`           | ⚠️ WARN      | EPSG:4326 BBOX     | No MOCK  |
| `openaware` | `get_flight_count`      | ✅ OK        | N/A                | N/A      |
| `cesium`    | `validate_tileset`      | ✅ OK        | N/A                | N/A      |
| `cesium`    | `check_camera_bounds`   | ✅ OK        | EPSG:4326 Point    | N/A      |
| `cesium`    | `check_bounding_volume` | ⚠️ WARN      | EPSG:4326 / Region | No MOCK  |
| `stitch`    | `(not checked)`         | ⚠️ UNCERTAIN | —                  | —        |
| `doc-state` | `(not checked)`         | ⚠️ UNCERTAIN | —                  | —        |

## Detailed Findings

### 1. `mcp/openaware`

- **Tool definitions consistent with upstream?** Yes, uses OpenSky Network `states/all` API correctly.
- **LIVE→CACHED→MOCK fallback?** ⚠️ **MISSING**. Only implements `LIVE` and returns error on failure. A fallback to `public/mock/flights.geojson` should be added.
- **Spatial contract conformant?** Partially. Uses `EPSG:4326` for BBOX but does not perform geometry validity checks on the response.

### 2. `mcp/cesium`

- **Tool definitions consistent with upstream?** Yes, targets 3D Tiles 1.0/1.1 spec.
- **LIVE→CACHED→MOCK fallback?** ⚠️ **MISSING** for `check_bounding_volume`. If the URL is unreachable, it fails without attempting a cached or mock tileset.
- **Spatial contract conformant?** Yes, uses the project-standard Cape Town BBOX for bounds checking.

### 3. `mcp/stitch`

- **Audit Status:** ⚠️ **PENDING**. Purpose seems to be Google Stitch API integration.
- **Next steps:** Examine `mcp/stitch/server.js` for NeRF/3DGS pipeline compatibility.

### 4. `mcp/doc-state`

- **Audit Status:** ⚠️ **PENDING**. Crucial for P0 health (multi-agent locking).
- **Next steps:** Verify lock/unlock tools and file path safety.

## Recommendations

1. **Implement Fallback:** All spatial data tools (especially `get_flights`) must implement a `MOCK` fallback path using local files in `public/mock/`.
2. **Schema Standardization:** Ensure all spatial outputs wrap geometries in standard GeoJSON FeatureCollection structures where applicable.
3. **Error Handling:** Improve error responses to include a `status: "MOCK"` or `status: "CACHED"` flag as per `CLAUDE.md` Rule 1.
