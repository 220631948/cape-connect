# 01 PostGIS Core Ecosystem

> **TL;DR:** PostGIS 3.x on PostgreSQL 15+ is the non-negotiable spatial backbone. Combined with pgvector for hybrid spatial/semantic queries and Supabase-managed RLS, it scores 9.5/10 for our MVP. Store in EPSG:4326, transform Lo19 on import via `ST_Transform`. GiST indexes make spatial queries fast at scale.
>
> **Roadmap Relevance:** M1 (Database Schema) — foundational to every milestone. All spatial queries, RLS policies, and Martin MVT serving depend on PostGIS.

## Overview & 2026 Status
PostGIS remains the undisputed king of open-source spatial databases. [VERIFIED] In 2026, running PostGIS 3.x on PostgreSQL 15+ is the industry standard. The ecosystem relies on a trinity of underlying C libraries:
*   **GEOS:** Handles topological operations (intersections, buffers).
*   **PROJ:** Handles coordinate reference system (CRS) transformations.
*   **GDAL:** Translates raster and vector formats.

[VERIFIED] The biggest shift in the 2025/2026 era is the seamless integration of **pgvector** alongside PostGIS, allowing hybrid queries (e.g., finding features geographically close *and* semantically similar). Supabase supports both out of the box in their managed PostgreSQL instances.

## Integration with PostGIS (GEOS · PROJ · GDAL · postgis_raster)
*   **PROJ and South African CRS:** The Western Cape uses the Hartebeesthoek94 datum (often projected to the Lo coordinate system, e.g., Lo19 for Cape Town, EPSG:22279). While the raw City data might be in Lo19, modern web mapping exclusively uses WGS84 (EPSG:4326) for transport and Web Mercator (EPSG:3857) for rendering. PROJ handles these transformations on-the-fly in PostGIS using `ST_Transform(geom, 4326)`.
*   **GEOS:** Powers `ST_Intersects` and `ST_DWithin` which are critical for the app's buffer and zoning overlap queries.
*   **postgis_raster:** Historically heavy and complex, it is now strictly opt-in. Since our platform relies primarily on vector data (GeoJSON/MVT), we should avoid enabling `postgis_raster` unless we explicitly need to process the Western Cape Government's Hazard Raster Services natively.

## Pros & Cons Table
| Pro | Con |
|-----|-----|
| Unmatched spatial query performance with GiST indexes. | High learning curve for optimizing complex spatial joins. |
| Supabase natively supports it, including RLS (Row-Level Security) integration. | `ST_Transform` on massive datasets on-the-fly is CPU-heavy. |
| Direct Mapbox Vector Tile (MVT) generation via `ST_AsMVT`. | Upgrading major PROJ/GDAL versions can sometimes break edge-case geometries. |

## Recommendation Scorecard
| Criterion                  | Score (1–10) | Notes |
|----------------------------|-------------|-------|
| MVP Fit                    | 10          | Absolutely essential for spatial bounds & intersection. |
| Scalability                | 9           | GiST indexing scales incredibly well if clustered. |
| Multitenancy Support       | 10          | Flawless synergy with Supabase RLS `auth.uid()`. |
| Maintenance Effort         | 8           | Supabase manages the DB; mostly just query tuning. |
| Cost / Licensing           | 10          | Open source (GPLv2) / Included in Supabase tiers. |
| Cape Town / WC Relevance   | 10          | Required for handling City of Cape Town open data. |
| **Overall Recommendation** | **9.5**     | The non-negotiable backbone of the platform. |

## Example Integration (Next.js 15 + PostGIS)
Here is how we query PostGIS via Supabase RPC from a Next.js 15 Server Component (using the new async request patterns):

```typescript
import { createClient } from '@supabase/supabase-js';

// Next.js 15 Server Component
export async function getParcelsInBbox(minLng: number, minLat: number, maxLng: number, maxLat: number) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Calling a PostGIS function defined in the database via RPC
  const { data, error } = await supabase.rpc('get_parcels_in_bbox', {
    min_lng: minLng,
    min_lat: minLat,
    max_lng: maxLng,
    max_lat: maxLat
  });

  if (error) throw new Error(error.message);
  return data; // Returns GeoJSON FeatureCollection
}
```

*Database RPC definition (SQL):*
```sql
CREATE OR REPLACE FUNCTION get_parcels_in_bbox(min_lng float, min_lat float, max_lng float, max_lat float)
RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'type', 'FeatureCollection',
      'features', jsonb_agg(ST_AsGeoJSON(t.*)::jsonb)
    )
    FROM (
      SELECT id, erf_number, geom
      FROM parcels
      WHERE geom && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
      -- RLS automatically applies here if called with user JWT
    ) as t
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Relevance to Our White-Label Cape Town GIS Project
PostGIS is what allows us to say, "Find me all General Business 1 (GB1) zoned properties within 500m of this informal trading bay." It processes the Western Cape's complex geometry at the database layer so we don't have to send megabytes of polygon data to the client's browser. Furthermore, it completely integrates with our Row-Level Security strategy to ensure a property developer in Tenant A cannot see the saved analyses of Tenant B.
