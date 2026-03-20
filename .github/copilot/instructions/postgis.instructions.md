---
applyTo: '**/*.{sql,ts,tsx}'
---
# PostGIS Instructions

> TL;DR: Always store in EPSG:4326, render in EPSG:3857, index every geometry column with GiST, scope all spatial queries to the Cape Town bbox, and wrap tenant tables with RLS.

## Spatial Reference Systems
- **Storage:** EPSG:4326 (WGS 84) — all geometry columns must declare `SRID=4326`
- **Rendering:** EPSG:3857 (Web Mercator) — apply `ST_Transform(geom, 3857)` only at render time
- Never mix SRIDs in the same expression; always use explicit `ST_Transform`
- Geometry column declaration: `geom geometry(Geometry, 4326)`

## Cape Town Bbox Enforcement
```sql
-- Always scope spatial queries to Cape Town bbox
ST_MakeEnvelope(18.0, -34.5, 19.5, -33.0, 4326)
```
- Apply as a first filter using `&&` (bbox overlap) before exact predicates
- Never return unbounded spatial datasets to the client

## GiST Indexes
```sql
-- Required on every geometry column
CREATE INDEX ON <table> USING GIST (geom);
-- For 3D or geography types
CREATE INDEX ON <table> USING GIST (geom gist_geometry_ops_nd);
```
- Add index in the same migration that creates the geometry column
- Verify index usage with `EXPLAIN ANALYZE`

## Common Spatial Predicates
```sql
-- Features inside a polygon
WHERE geom && bbox AND ST_Within(geom, bbox)

-- Features overlapping a polygon
WHERE geom && bbox AND ST_Intersects(geom, bbox)

-- Features within N metres of a point (geography for metre-accurate distance)
WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, metres)
```
- Always use `&&` before the exact predicate — it activates the GiST index
- Use `::geography` cast when distance must be in metres, not degrees

## GeoJSON Output
```sql
-- Return as GeoJSON for API responses
SELECT ST_AsGeoJSON(geom)::json AS geometry FROM <table>;

-- Or build a FeatureCollection
SELECT json_build_object(
  'type', 'FeatureCollection',
  'features', json_agg(ST_AsGeoJSON(t)::json)
) FROM <table> t;
```

## RLS with Spatial Queries
```sql
-- Combine tenant isolation with spatial filter
SELECT id, ST_AsGeoJSON(geom)::json AS geometry
FROM parcels
WHERE tenant_id = current_setting('app.current_tenant', TRUE)::uuid
  AND geom && ST_MakeEnvelope(18.0, -34.5, 19.5, -33.0, 4326)
  AND ST_Intersects(geom, ST_MakeEnvelope(18.0, -34.5, 19.5, -33.0, 4326))
LIMIT 500;
```

## Common Pitfalls
- **Do not** use `ST_Distance` without `::geography` — result is in degrees, not metres
- **Do not** skip `&&` bbox pre-filter — exact predicates alone skip the GiST index
- **Do not** store geometries in EPSG:3857 — transforms at query time are acceptable overhead
- **Do not** return >10,000 features to a MapLibre client — switch to Martin MVT tiles above this threshold
- **Do not** use `ST_Buffer` in degrees — cast to geography first for accurate buffers

## Geometry Validation
```sql
-- Check validity before inserting
WHERE ST_IsValid(geom)
-- Fix invalid geometries
UPDATE <table> SET geom = ST_MakeValid(geom) WHERE NOT ST_IsValid(geom);
```

## Migration Pattern
```sql
-- Complete spatial table migration
CREATE TABLE spatial_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  geom geometry(Geometry, 4326) NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE spatial_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE spatial_features FORCE ROW LEVEL SECURITY;
CREATE INDEX ON spatial_features USING GIST (geom);
CREATE INDEX ON spatial_features (tenant_id);
```
