<!--
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T10:39:43Z
-->

# /validate-spatial — Spatial Validation

## Trigger
`/validate-spatial` or "validate this GeoJSON" or "check spatial data"

## What It Does
Runs the `spatial_validation` skill on a provided GeoJSON feature collection or WKT string. Checks CRS compliance, geometry validity, bounding-box conformance, and feature count thresholds for the Cape Town GIS Hub.

## Invokes Skill
`spatial-agent` spatial validation logic (`.claude/agents/spatial-agent.md`)

## Procedure
1. Accept input: file path to `.geojson` / `.wkt`, or inline GeoJSON/WKT pasted after the command
2. Detect input type (GeoJSON FeatureCollection, Feature, geometry, or WKT string)
3. Run the following checks in order:
   - **CRS check** — confirm coordinates fall within Cape Town bbox `{ west: 18.0, south: -34.5, east: 19.5, north: -33.0 }` (EPSG:4326)
   - **Geometry validity** — detect self-intersections, unclosed rings, null geometries, duplicate vertices
   - **Feature count** — warn if > 10,000 features (MapLibre client-side limit; recommend Martin MVT)
   - **Coordinate precision** — flag if > 6 decimal places (unnecessary precision)
   - **Required properties** — check that `tenant_id` is present if data is tenant-scoped
4. Report results per check
5. If invalid geometries found, suggest `ST_MakeValid()` PostGIS fix

## Expected Output
```
Spatial Validation Report — [date]
=====================================
Input: [file or inline]
Features: [N]

✅ PASSED:
  - CRS: all coordinates within Cape Town bbox
  - Geometry validity: no self-intersections detected
  - Coordinate precision: ≤ 6 decimal places

⚠️ WARNINGS:
  - Feature count: 12,450 features — exceeds 10,000 client limit
    → Recommend switching to Martin MVT tile source

🚨 ERRORS:
  - Geometry #42: self-intersection at (-33.912, 18.441)
    → Fix: ST_MakeValid(geom) in PostGIS migration

Suggested fix:
  UPDATE [table] SET geom = ST_MakeValid(geom) WHERE NOT ST_IsValid(geom);
```

## When NOT to Use
- On raster data (GeoTIFF, PNG tiles) — this command is for vector data only
- On already-validated data in the PostGIS database (use `SELECT ST_IsValid(geom)` directly)
- As a substitute for PostGIS constraint enforcement — always add `CHECK (ST_IsValid(geom))` in migrations
