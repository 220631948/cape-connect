---
name: spatial-validation
description: Validate GeoJSON/WKT geometries stay within Cape Town bounding box; detect CRS mismatches between storage (EPSG:4326) and rendering (EPSG:3857).
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T10:39:43Z
---

# Spatial Validation Skill

## Purpose
Ensure all geometry data is geographically constrained to the approved City of Cape Town / Western Cape scope and that Coordinate Reference Systems are never silently mixed between storage and rendering layers.

## Trigger
Invoke when:
- Importing or ingesting GeoJSON, WKT, or Shapefile data
- Writing PostGIS migration columns that define geometry types
- Rendering map data client-side with MapLibre GL JS
- Receiving geometry from an external API before persisting

## Procedure

### Step 1 — Bounding Box Check
All features must fall within:
```
west:  18.0
south: -34.5
east:  19.5
north: -33.0
```

**Client-side (Turf.js):**
```typescript
import booleanWithin from '@turf/boolean-within';
import { polygon } from '@turf/helpers';

const CAPE_TOWN_BBOX = polygon([[
  [18.0, -34.5], [19.5, -34.5], [19.5, -33.0], [18.0, -33.0], [18.0, -34.5]
]]);

function isWithinScope(feature: GeoJSON.Feature): boolean {
  return booleanWithin(feature, CAPE_TOWN_BBOX);
}
```

**PostGIS (server-side):**
```sql
-- Reject rows outside bounding box
ALTER TABLE [table] ADD CONSTRAINT chk_within_cape_town
  CHECK (ST_Within(
    geom,
    ST_MakeEnvelope(18.0, -34.5, 19.5, -33.0, 4326)
  ));
```

### Step 2 — CRS Enforcement
| Layer | CRS | Notes |
|-------|-----|-------|
| Database storage | EPSG:4326 (WGS84) | All `geometry` columns |
| MapLibre rendering | EPSG:3857 (Web Mercator) | Applied by MapLibre automatically |
| PMTiles / Martin MVT | EPSG:3857 | Tile server reprojects |

**Never** store EPSG:3857 in the database. **Never** pass raw EPSG:4326 coordinates to MapLibre as pixel coordinates.

Detect mismatches in PostGIS:
```sql
SELECT ST_SRID(geom), COUNT(*) FROM [table] GROUP BY 1;
-- Must return only 4326
```

### Step 3 — Reprojection When Required
```sql
-- Reproject EPSG:3857 → EPSG:4326 before storing
INSERT INTO [table] (geom) VALUES (
  ST_Transform(ST_GeomFromText('POINT(...)', 3857), 4326)
);
```

### Step 4 — Out-of-Scope Feature Handling
- Log rejected features with coordinates to `docs/IMPORT_WARNINGS.md`
- Do **not** silently drop features — warn and count
- Fail hard on CRS mismatch (never coerce silently)

## Output Format
```
Spatial validation: [N] features checked
  ✓ Within bbox: [N]
  ✗ Outside bbox: [N] → logged to docs/IMPORT_WARNINGS.md
  CRS: EPSG:4326 confirmed ✓ / MISMATCH DETECTED ✗
```

## When NOT to Use This Skill
- Mock GeoJSON fixtures in `public/mock/` (pre-validated at creation time)
- Lookup tables with no geometry columns
- Tile serving (Martin handles reprojection internally)
