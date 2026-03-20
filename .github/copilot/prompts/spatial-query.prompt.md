---
mode: 'agent'
description: 'Generate a PostGIS spatial query scoped to Cape Town bbox with index hints'
---
# PostGIS Spatial Query Generator

## Context
Read `CLAUDE.md` Rule 9 (Geographic Scope) and any relevant table schema in `supabase/migrations/` before generating.

## Task
Generate a production-ready PostGIS spatial query based on the user's description.

### Requirements:

**1. Spatial Predicate**
Use the appropriate function:
- `ST_Within(geom, bbox)` — features fully inside a polygon
- `ST_Intersects(geom, bbox)` — features overlapping a polygon
- `ST_DWithin(geom, point, distance_metres)` — features within a radius

**2. Cape Town Bbox Enforcement**
Always scope queries to the Cape Town bounding box unless the user explicitly overrides:
```sql
ST_MakeEnvelope(18.0, -34.5, 19.5, -33.0, 4326)
```

**3. EPSG:4326 Enforcement**
- Storage geometry must be in SRID 4326
- If rendering coordinates are needed, wrap with `ST_Transform(geom, 3857)`
- Never mix SRIDs without explicit `ST_Transform`

**4. GiST Index Hint**
Include a comment noting the required index if not already present:
```sql
-- Requires: CREATE INDEX ON <table> USING GIST (geom);
```

**5. RLS Awareness**
Include `WHERE tenant_id = current_setting('app.current_tenant', TRUE)::uuid` if the table is tenant-scoped.

**6. Performance**
- Prefer `&&` bounding-box operator before the exact predicate for index efficiency
- Add `LIMIT` clause for unbounded queries
- Add `EXPLAIN ANALYZE` hint as a comment for the developer to run

### Query skeleton:
```sql
-- Requires: CREATE INDEX ON <table> USING GIST (geom);
-- Run EXPLAIN ANALYZE to verify index usage.
SELECT
  id,
  ST_AsGeoJSON(geom)::json AS geometry,
  -- other columns
FROM <table>
WHERE tenant_id = current_setting('app.current_tenant', TRUE)::uuid
  AND geom && ST_MakeEnvelope(18.0, -34.5, 19.5, -33.0, 4326)
  AND ST_<Predicate>(geom, <target>)
LIMIT 500;
```

## Output Format
Provide:
1. The complete SQL query with comments
2. The GiST index DDL if not present
3. A brief note on which spatial predicate was chosen and why
