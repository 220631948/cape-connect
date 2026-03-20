---
name: postgres-patterns
description: PostgreSQL and PostGIS optimization patterns for the CapeTown GIS Hub. Covers spatial indexes, query planning, VACUUM, RLS performance, and tenant-scoped aggregation.
---

<!--
origin: affaan-m/everything-claude-code/skills/postgres-patterns/
adaptation-summary: Extended with PostGIS GiST index patterns, ST_* function optimization,
  Martin MVT query tuning, and Supabase-specific considerations.
-->

# PostgreSQL + PostGIS Patterns — CapeTown GIS Hub

## Spatial Index Patterns

### GiST Index (required on all geometry columns)

```sql
-- Always add after creating geometry column
CREATE INDEX CONCURRENTLY idx_<table>_geom ON <table> USING GIST(geom);

-- For frequently filtered + spatial queries — combined index
CREATE INDEX CONCURRENTLY idx_<table>_tenant_geom
  ON <table>(tenant_id) INCLUDE (geom);
```

### BRIN for Time-Series (e.g. api_cache)

```sql
CREATE INDEX CONCURRENTLY idx_api_cache_created
  ON api_cache USING BRIN(created_at);
```

## Spatial Query Optimization

### Bounding Box Pre-Filter (Always First)

```sql
-- Use && (bbox overlap) before precise ST_* functions
-- This uses the GiST index; ST_Intersects alone does not
WHERE geom && ST_MakeEnvelope(18.0, -34.5, 19.5, -33.0, 4326)
  AND ST_Intersects(geom, ST_MakeEnvelope(18.0, -34.5, 19.5, -33.0, 4326))
```

### ST_Simplify for Display Queries

```sql
-- Simplify for zoom < 12 (less detail needed)
SELECT ST_AsGeoJSON(ST_Simplify(geom, 0.001)) as geom FROM suburbs
WHERE tenant_id = current_setting('app.current_tenant', TRUE)::uuid;
```

### Geometry Validity Gate

```sql
-- Always run after import
UPDATE <table> SET geom = ST_MakeValid(geom) WHERE NOT ST_IsValid(geom);
```

## RLS Performance (Multi-Tenant)

```sql
-- current_setting() is fast when set per-connection
SET app.current_tenant = '<uuid>';

-- Index tenant_id on every RLS-protected table
CREATE INDEX CONCURRENTLY idx_<table>_tenant ON <table>(tenant_id);
```

## Martin MVT Query Tuning

```sql
-- Martin source query — use ST_AsMVTGeom for proper clipping
SELECT id, name, category,
  ST_AsMVTGeom(geom, ST_TileEnvelope($1, $2, $3), 4096, 64, true) AS geom
FROM suburbs
WHERE geom && ST_TileEnvelope($1, $2, $3)
  AND tenant_id = current_setting('app.current_tenant', TRUE)::uuid;
```

## VACUUM / Maintenance

- Set `autovacuum_analyze_threshold = 50` for small, frequently-updated tables (`api_cache`)
- Run `ANALYZE` after bulk imports (GV Roll, suburb boundaries)
- Monitor bloat: `pgstattuple` extension

## Query Performance Checklist

- [ ] `EXPLAIN ANALYZE` before committing any new query
- [ ] Index exists on all join columns
- [ ] Bbox pre-filter before precise spatial function
- [ ] `ST_MakeValid` run post-import
- [ ] RLS policy index confirmed
- [ ] Martin source uses `ST_AsMVTGeom`, not raw WKT
