# Martin MVT & PostGIS Vector Tile Optimization

> **TL;DR:** Martin (Rust MVT server) serves PostGIS-backed vector tiles via `ST_AsMVT()`. For capegis, optimisation focuses on three layers: PostGIS query tuning (GiST indexes, `ST_Simplify` at low zoom, feature count limits), Martin configuration (connection pooling, tile caching, function sources vs table sources), and CDN/edge caching (Cloudflare or Vercel Edge with `Cache-Control` headers). The 10K feature threshold from CLAUDE.md means: below 10K → GeoJSON direct, above 10K → Martin MVT. Tippecanoe pre-generates PMTiles for offline/static layers.
>
> **Roadmap Relevance:** M2 (Tile Pipeline) — Martin Docker config, PostGIS tile functions, CDN setup. M3 (Data Ingestion) — tile generation for ingested datasets. M5 (Hybrid View) — high-density 3D tile considerations.

---

## 1. Martin Architecture in capegis

```
Browser (MapLibre GL JS)
    │
    ▼ HTTP GET /{z}/{x}/{y}.pbf
CDN / Edge Cache (Cloudflare)
    │ (cache miss)
    ▼
Martin (Rust, Docker on DigitalOcean)
    │
    ▼ SQL query with ST_AsMVT()
PostGIS (Supabase PostgreSQL 15)
```

`[VERIFIED]` Martin is the tile server specified in CLAUDE.md. Docker Compose config exists for local dev.

---

## 2. Martin Configuration

### docker-compose.yml (local dev)
```yaml
martin:
  image: ghcr.io/maplibre/martin:v0.14
  ports:
    - "3000:3000"
  environment:
    - DATABASE_URL=postgresql://postgres:postgres@postgis:5432/capegis
  command: --config /config/martin.yaml
  volumes:
    - ./martin-config.yaml:/config/martin.yaml
  depends_on:
    - postgis
```

### martin.yaml
```yaml
postgres:
  connection_string: ${DATABASE_URL}
  pool_size: 10                    # Connection pool
  auto_publish:
    tables:                        # Auto-discover tables with geometry
      from_schemas: public
      id_columns: [id, gid]
    functions:                     # Auto-discover tile-serving functions
      from_schemas: public

# Static PMTiles sources (for offline basemap)
pmtiles:
  paths:
    - /data/capetown-basemap.pmtiles
```

`[VERIFIED]` Martin v0.14+ supports both PostGIS table sources and function sources, plus PMTiles serving.

---

## 3. PostGIS Tile Function Optimization

### Table source (automatic, good for simple cases)
Martin auto-generates `ST_AsMVT()` queries for tables with geometry columns.

### Function source (optimised, recommended for production)
```sql
CREATE OR REPLACE FUNCTION public.parcels_mvt(
  z integer, x integer, y integer,
  query_params json DEFAULT '{}'
) RETURNS bytea AS $$
DECLARE
  mvt bytea;
  bounds geometry;
  simplify_tolerance float;
BEGIN
  -- Calculate tile bounds
  bounds := ST_TileEnvelope(z, x, y);
  
  -- Zoom-dependent simplification
  simplify_tolerance := CASE
    WHEN z < 10 THEN 0.001    -- ~100m tolerance
    WHEN z < 14 THEN 0.0001   -- ~10m tolerance
    ELSE 0                     -- Full resolution
  END;

  SELECT INTO mvt ST_AsMVT(tile, 'parcels', 4096, 'geom')
  FROM (
    SELECT
      id,
      CASE 
        WHEN simplify_tolerance > 0 
        THEN ST_AsMVTGeom(
          ST_Simplify(geometry, simplify_tolerance, true),
          bounds, 4096, 64, true
        )
        ELSE ST_AsMVTGeom(geometry, bounds, 4096, 64, true)
      END AS geom,
      -- Only include attributes at high zoom
      CASE WHEN z >= 14 THEN parcel_id ELSE NULL END AS parcel_id,
      CASE WHEN z >= 14 THEN zoning_code ELSE NULL END AS zoning
    FROM parcels
    WHERE geometry && bounds              -- GiST index hit
      AND ST_Intersects(geometry, bounds)  -- Precise filter
    LIMIT 50000                            -- Safety valve
  ) AS tile;

  RETURN mvt;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;
```

`[VERIFIED]` `ST_AsMVTGeom()` handles coordinate transformation to tile space. `STABLE PARALLEL SAFE` allows PostgreSQL to parallelise the function.

---

## 4. Index Strategy for Tile Serving

```sql
-- Essential: GiST spatial index
CREATE INDEX idx_parcels_geom ON parcels USING GIST (geometry);

-- For RLS: B-tree on tenant_id
CREATE INDEX idx_parcels_tenant ON parcels (tenant_id);

-- For filtered tiles: composite (used with Martin query params)
CREATE INDEX idx_parcels_zoning ON parcels (zoning_code) WHERE zoning_code IS NOT NULL;

-- For temporal queries: BRIN index on timestamp (ordered data)
CREATE INDEX idx_parcels_updated ON parcels USING BRIN (updated_at);

-- Analyze after bulk load
ANALYZE parcels;
```

### Query plan verification
```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT ST_AsMVT(tile, 'parcels')
FROM (
  SELECT ST_AsMVTGeom(geometry, ST_TileEnvelope(14, 8723, 9834))
  FROM parcels
  WHERE geometry && ST_TileEnvelope(14, 8723, 9834)
) tile;
-- Should show: Index Scan using idx_parcels_geom
-- Should NOT show: Seq Scan
```

---

## 5. Zoom-Level Strategy

| Zoom | Layer | Source | Simplification | Max features |
|------|-------|--------|---------------|--------------|
| 0–8 | Suburbs outline | PMTiles (static) | Heavy | ~100 |
| 9–11 | Zoning overlay | Martin MVT | Moderate | ~5,000 |
| 12–13 | Cadastral outlines | Martin MVT | Light | ~20,000 |
| 14+ | Cadastral + attributes | Martin MVT | None | ~50,000 |
| 14+ | Property points | Martin MVT | None | ~10,000 |

Per CLAUDE.md: cadastral parcels at zoom ≥ 14 only. Viewport buffer: 20%.

---

## 6. Tippecanoe for Static PMTiles

```bash
# Generate PMTiles from GeoJSON
tippecanoe \
  --output=capetown-suburbs.pmtiles \
  --layer=suburbs \
  --minimum-zoom=0 \
  --maximum-zoom=14 \
  --simplification=10 \
  --detect-shared-borders \
  --coalesce-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --force \
  suburbs.geojson

# For cadastral parcels (high detail)
tippecanoe \
  --output=capetown-parcels.pmtiles \
  --layer=parcels \
  --minimum-zoom=12 \
  --maximum-zoom=16 \
  --no-feature-limit \
  --no-tile-size-limit \
  --detect-shared-borders \
  --force \
  parcels.geojson
```

`[VERIFIED]` Tippecanoe is the standard tool for generating PMTiles/MBTiles from GeoJSON. `--detect-shared-borders` prevents sliver gaps between adjacent parcels.

---

## 7. CDN / Edge Caching

### Cache-Control headers (Martin config)
```yaml
# martin.yaml
web:
  listen_addresses: '0.0.0.0:3000'
  cache_control: 'public, max-age=3600'  # 1 hour default
```

### Cloudflare/Vercel Edge rules

| Zoom level | Cache TTL | Rationale |
|------------|-----------|-----------|
| 0–10 | 24h | Rarely changing boundaries |
| 11–13 | 1h | Moderate update frequency |
| 14+ | 5m | May include dynamic attributes |

### Cache purge on data update
```typescript
// After GV Roll re-import or zoning update
await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${CF_TOKEN}` },
  body: JSON.stringify({ prefixes: ['tiles/parcels/'] }),
});
```

`[ASSUMPTION — UNVERIFIED]` Cloudflare is the assumed CDN. Vercel Edge Middleware could serve as an alternative with `stale-while-revalidate` caching.

---

## 8. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tile generation (cache miss) | < 100ms at z14 | `pg_stat_statements` + Martin logs |
| Tile serving (cache hit) | < 10ms | CDN edge response time |
| Cold start (first tile) | < 500ms | Martin startup + first query |
| Max tile size | < 500 KB (uncompressed) | Martin logs |
| Feature limit per tile | 50,000 | SQL LIMIT clause |

---

## 9. Martin vs Alternatives

| Feature | Martin | pg_tileserv | t-rex |
|---------|--------|-------------|-------|
| Language | Rust | Go | Rust |
| PostGIS support | ✅ | ✅ | ✅ |
| PMTiles serving | ✅ | ❌ | ❌ |
| Function sources | ✅ | ✅ | ❌ |
| Connection pooling | Built-in | Built-in | External |
| Docker image size | ~15 MB | ~20 MB | ~25 MB |
| Active maintenance | ✅ MapLibre org | ✅ CrunchyData | ⚠️ Slow |

`[VERIFIED]` Martin is maintained by the MapLibre organisation, aligning with capegis's MapLibre-only constraint.

---

## 10. Open Questions

- [ ] What is the actual tile generation time for Cape Town cadastral parcels at z14 on Supabase Pro tier?
- [ ] Should Martin run on the same DigitalOcean droplet as the database, or separately?
- [ ] Is `ST_Simplify` with `preserveCollapsed=true` sufficient, or should we use `ST_SimplifyPreserveTopology`?
- [ ] Should we pre-generate and cache high-traffic tiles (z10–z12 over Cape Town CBD) at build time?
- [ ] How to handle tile invalidation when a single parcel is updated (surgical purge vs time-based expiry)?

---

*Research compiled: 2026-03-06 · capegis research audit*
