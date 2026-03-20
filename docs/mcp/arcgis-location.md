# arcgis-location.md — MCP Server Specification

**Purpose:** ArcGIS Location Platform integration for South African addressing and routing.

## Tools

### `geocode_address`

- **Description:** Geocodes a South African address.
- **Input:** `{ address: string, outFields?: string[] }`
- **Return (TypeScript):**
  ```typescript
  {
    location: { x: number, y: number },
    address: string,
    score: number,
    status: "LIVE" | "MOCK"
  }
  ```

### `reverse_geocode`

- **Description:** Returns the nearest address for a given point.
- **Input:** `{ location: { x: number, y: number } }`

### `generate_isochrone`

- **Description:** Returns a travel-time polygon from a starting point.
- **Input:** `{ location: { x: number, y: number }, minutes: number }`

### `calculate_route`

- **Description:** Returns routing directions between two or more points.
- **Input:** `{ stops: Array<{ x: number, y: number }> }`

### `query_feature_layer`

- **Description:** Query an ArcGIS Online feature layer by bounding box.
- **Input:** `{ url: string, bbox: [number, number, number, number] }`

## Infrastructure & Configuration

- **Upstream API:** ArcGIS REST API (Location Services).
- **Auth via Doppler:** `ARCGIS_CLIENT_ID` and `ARCGIS_CLIENT_SECRET`.
- **Rate Limit Strategy:** 50 calls per minute.
- **Three-Tier Fallback (Post-July 2026):**
  - **LIVE (ArcGIS):** Primary service until license expiry.
  - **LIVE (OSM):** Geocoding → Nominatim, Routing → OSRM/Valhalla (post-expiry).
  - **MOCK:** Cached GeoJSON in Supabase Storage.
- **Degradation Behaviour:** ArcGIS Pro expiry reached → transparently switch to OSM-based fallbacks.
