# 02 Routing (pgRouting)

> **TL;DR:** pgRouting v4.0+ enables dynamic in-database routing (Dijkstra, isochrones, TSP) but is too heavy for our MVP. Use `ST_DWithin` for proximity queries and public OSRM API for simple directions. Score: 6/10 — hold for Phase 2+ if core personas demand drive-time analysis.
>
> **Roadmap Relevance:** Deferred past M6. Not required for property intelligence MVP. Revisit if MyCiTi drive-time analysis becomes a core persona need.

## Overview & 2026 Status
[VERIFIED] In 2026, **pgRouting (v4.0+)** remains the premier choice for complex, dynamic routing inside a database. Unlike fast, in-memory routing engines (like OSRM or Valhalla) which pre-compile their graphs, pgRouting operates directly on SQL tables. This means if a road is flooded or a MyCiTi bus lane is temporarily closed, you just update a row in the database, and the next query instantly respects the new cost.

## Integration with PostGIS
pgRouting is an extension to PostgreSQL that relies heavily on PostGIS for its geometry handling. 
To use it, you must first create a routing topology. This involves breaking down multilinestrings into individual segments (edges) with source and target nodes (vertices). 
Tools like `osm2pgsql` or `PgOSM Flex` are frequently used in 2026 to import OpenStreetMap data directly into a routing-ready schema. Once the topology is built, you can run functions like `pgr_dijkstra` or `pgr_drivingDistance` directly via SQL, often wrapping these in Supabase RPC calls to expose them to the frontend.

## Pros & Cons Table
| Pro | Con |
|-----|-----|
| Infinite flexibility: costs can be dynamically calculated in SQL (e.g., based on real-time flood data). | Slower than OSRM/Valhalla for point-to-point web navigation. |
| Operates within the same PostGIS database, meaning no extra external services to host. | Building and maintaining the topology graph is computationally heavy. |
| Ideal for isochrones (driving distance) and complex Traveling Salesman Problems. | Not suited for global-scale routing due to memory/CPU constraints. |

## Recommendation Scorecard
| Criterion                  | Score (1–10) | Notes |
|----------------------------|-------------|-------|
| MVP Fit                    | 4           | We likely do NOT need complex routing for an initial property intelligence MVP. |
| Scalability                | 6           | Scales for city-level analysis, struggles at continental scale. |
| Multitenancy Support       | 8           | You can apply RLS, though it complicates graph topology. |
| Maintenance Effort         | 5           | Keeping the road network updated and topologically sound is hard work. |
| Cost / Licensing           | 10          | Open source. |
| Cape Town / WC Relevance   | 7           | Useful if we want to model drive-times to MyCiTi stations or schools. |
| **Overall Recommendation** | **6.0**     | **Hold for Phase 2.** Do not build this into the MVP unless a core persona strictly demands it. |

## Example Integration (Next.js 15 + PostGIS)
If we were to implement this (via Supabase RPC), the SQL function for finding the shortest path would look like this:

```sql
-- Assuming a topology has been built on a table 'cape_town_roads'
CREATE OR REPLACE FUNCTION get_shortest_path(start_node INT, end_node INT)
RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'type', 'FeatureCollection',
      'features', jsonb_agg(ST_AsGeoJSON(r.geom)::jsonb)
    )
    FROM pgr_dijkstra(
      'SELECT id, source, target, length AS cost FROM cape_town_roads',
      start_node, end_node, false
    ) AS path
    JOIN cape_town_roads AS r ON path.edge = r.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
*Note: In Next.js 15, you would `await` this RPC call from a Server Component just like any other data fetch.*

## Relevance to Our White-Label Cape Town GIS Project
🤔 **HMM — I'm actually not confident we need this right now.** 
Looking at our Personas (Sipho the Developer, Amina the Investor), their primary job-to-be-done involves zoning, flood risk, and valuation. None of these strictly require *routing* or *isochrones*. 

If we *do* need to show "schools within 1km", we can just use `ST_DWithin` (a spatial buffer), which is infinitely faster and simpler than building a routing topology. I strongly recommend we **exclude pgRouting from Phase 1** to reduce architectural complexity and maintenance burden. We can use OSRM's public API if we just need simple point A to B driving directions.
