---
applyTo: '**/*.{ts,tsx,sql,yml,yaml}'
---
# Martin MVT Tile Server Instructions

> TL;DR: Martin serves PostGIS vector tiles via Docker. Define sources as SQL functions returning `bytea`, configure MapLibre to consume them, apply zoom gating (cadastral ≥14), and set proper cache headers.

## Docker Compose Configuration
```yaml
# docker-compose.yml
services:
  martin:
    image: ghcr.io/maplibre/martin:latest
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/capegis
    volumes:
      - ./martin.yaml:/config.yaml
    command: ["--config", "/config.yaml"]
    depends_on:
      - db
```

## Martin Config (martin.yaml)
```yaml
# martin.yaml
postgres:
  connection_string: ${DATABASE_URL}
  pool_size: 20

sources:
  # Table source (auto-detected from geometry column)
  suburb_boundaries:
    schema: public
    table: suburb_boundaries
    srid: 4326
    geometry_column: geom
    id_column: id

  # Function source (custom SQL for complex queries)
  parcels_mvt:
    schema: public
    function: get_parcels_mvt

martin:
  listen_addresses: "0.0.0.0:3000"
  worker_processes: 2
```

## PostGIS Function Source
```sql
-- Function-based tile source — returns MVT bytea
CREATE OR REPLACE FUNCTION get_parcels_mvt(z integer, x integer, y integer)
RETURNS bytea AS $$
DECLARE
  bounds geometry;
  mvt bytea;
BEGIN
  -- Only serve at zoom >= 14 for cadastral data
  IF z < 14 THEN RETURN NULL; END IF;

  bounds := ST_TileEnvelope(z, x, y);

  SELECT ST_AsMVT(tile, 'parcels', 4096, 'geom')
  INTO mvt
  FROM (
    SELECT
      id,
      erf_number,
      zoning_code,
      ST_AsMVTGeom(
        ST_Transform(geom, 3857),
        bounds,
        4096, 256, true
      ) AS geom
    FROM cadastral_parcels
    WHERE geom && ST_Transform(bounds, 4326)
      AND tenant_id = current_setting('app.current_tenant', TRUE)::uuid
  ) tile;

  RETURN mvt;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;
```

## MapLibre Source & Layer Config
```typescript
// Add Martin tile source
map.addSource('parcels', {
  type: 'vector',
  tiles: [`${process.env.NEXT_PUBLIC_MARTIN_URL}/parcels_mvt/{z}/{x}/{y}`],
  minzoom: 14,         // cadastral data: zoom ≥ 14 only
  maxzoom: 22,
  bounds: [18.0, -34.5, 19.5, -33.0],  // Cape Town bbox
})

// Add layer with zoom gate
map.addLayer({
  id: 'parcels-fill',
  type: 'fill',
  source: 'parcels',
  'source-layer': 'parcels',
  minzoom: 14,
  paint: {
    'fill-color': '#4a90d9',
    'fill-opacity': 0.3,
  },
})
```

## Zoom Gating Rules
| Layer | Min Zoom | Reason |
|-------|----------|--------|
| Cadastral parcels | 14 | Performance + data sensitivity |
| Suburb boundaries | 9 | Visible at city scale |
| Risk overlays | 11 | Meaningful at district scale |
| Street-level data | 15 | Detail only when close |

## Cache Headers
Martin serves tiles with `Cache-Control: max-age=3600` by default. Override in DigitalOcean Droplet nginx:
```nginx
location /tiles/ {
    proxy_pass http://localhost:3001;
    proxy_cache_valid 200 1h;
    add_header Cache-Control "public, max-age=3600, stale-while-revalidate=86400";
    add_header Access-Control-Allow-Origin "*";
}
```

## MARTIN_URL Fallback
```typescript
// lib/tile-url.ts
const MARTIN_URL = process.env.NEXT_PUBLIC_MARTIN_URL ?? null

export function tileUrl(source: string): string {
  if (MARTIN_URL) {
    return `${MARTIN_URL}/${source}/{z}/{x}/{y}`
  }
  // Fallback to Supabase Storage hosted PMTiles
  return `pmtiles://${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tiles/${source}.pmtiles`
}
```

## Layer Z-Order (top → bottom)
1. User draw annotations
2. Risk overlays
3. Zoning
4. Cadastral parcels
5. Suburb boundaries
6. Basemap (CARTO)

Always call `map.addLayer(layer, beforeId)` to insert at the correct Z position.

## Common Pitfalls
- **Do not** serve cadastral tiles below zoom 14 — geometry density causes client freezes
- **Do not** skip `bounds` on the MapLibre source — it prevents tile requests outside Cape Town
- **Do not** use `ST_AsMVTGeom` without `ST_Transform(..., 3857)` — Martin expects Web Mercator tile envelopes
- **Do not** expose Martin directly without nginx — set proper CORS and cache headers
- **Do not** hardcode `MARTIN_URL` — use `NEXT_PUBLIC_MARTIN_URL` env var with PMTiles fallback
- **Do not** omit `PARALLEL SAFE` on tile functions — it blocks parallel query plans
