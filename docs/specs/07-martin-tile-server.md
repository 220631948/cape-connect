# 07 — Martin Vector Tile Server

> **TL;DR:** Martin (Rust-based MVT server) auto-discovers PostGIS spatial tables and serves compressed vector tiles to MapLibre GL JS at sub-50ms per tile. Runs in Docker on DigitalOcean, generates PMTiles for offline via `martin-cp` + `pmtiles convert`. Personal data columns excluded via sanitised PostGIS views.

| Field | Value |
|-------|-------|
| **Milestone** | M4b — Martin MVT Integration |
| **Status** | Draft |
| **Depends on** | M1 (Database Schema + PostGIS) |
| **Architecture refs** | [ADR-003](../architecture/ADR-003-tile-server.md), [tile-layer-architecture](../architecture/tile-layer-architecture.md) |

## Topic

Martin is the Rust-based vector tile server that converts PostGIS spatial tables into compressed Mapbox Vector Tiles (MVT) for MapLibre GL JS rendering.

## Component Hierarchy

```mermaid
graph TD
    A["PostGIS<br/>(spatial tables)"] --> B["Sanitised Views<br/>(no PII columns)"]
    B --> C["Martin<br/>(auto-discover)"]
    C --> D["MVT Tiles<br/>/{table}/{z}/{x}/{y}"]
    C --> E["martin-cp<br/>(bulk export)"]
    E --> F["MBTiles → PMTiles"]
    D --> G["MapLibre GL JS"]
    F --> H["S3 / IndexedDB"]
```

## Data Source Badge (Rule 1)
- Martin-served tiles: `[Martin MVT · 2026 · LIVE]`
- PMTiles from S3: `[PMTiles · 2026 · CACHED]`
- Badge on each vector tile layer in the layer panel

## Three-Tier Fallback (Rule 2)
- **LIVE:** Martin MVT tiles from DigitalOcean Droplet
- **CACHED:** PMTiles from S3/Supabase Storage (HTTP Range Requests)
- **MOCK:** Static GeoJSON fallback in `public/mock/` — never blank map

## Edge Cases
- **Martin container crash:** Docker `restart: unless-stopped` auto-restarts; MapLibre falls back to PMTiles
- **PostGIS connection lost:** Martin returns 502 — Serwist serves stale tiles from cache
- **New table added:** Martin auto-discovers on next startup; no config change needed
- **Large tile (dense area):** Tiles exceeding 500KB → apply `ST_Simplify` at lower zoom levels
- **Concurrent bulk export:** `martin-cp` running during peak traffic — use read replicas or schedule off-peak

## Security Considerations
- Martin connects to PostGIS with read-only credentials [ASSUMPTION — UNVERIFIED]
- Sanitised views exclude PII columns (owner names, emails, phone numbers)
- Martin port (3001) should not be exposed publicly — proxy via Nginx/Caddy with rate limiting
- No authentication on Martin endpoints — rely on network-level access control

## Why Martin (2026 Gold Standard)

### Performance

- **Asynchronous Rust architecture** handles thousands of concurrent requests with minimal CPU and RAM overhead
- Vastly outperforms heavier Java-based alternatives (GeoServer, MapServer) for vector tile generation
- Sub-millisecond tile generation for well-indexed PostGIS tables

### Zero-Configuration

- Point Martin at a Supabase PostGIS connection string → it **auto-discovers** all spatial tables and functions
- No XML configuration files, no manual endpoint definitions
- New tables with geometry columns are immediately available as tile endpoints

### Versatility

- **Dynamic tiles:** Generate tiles on-the-fly from live PostGIS data (always up-to-date)
- **Static PMTiles:** Serve pre-built Cloud-Optimised Archives for offline/cached scenarios
- **PostGIS functions:** Expose custom SQL functions as tile endpoints (e.g., filtered views, aggregations)

## Docker Configuration

```yaml
# From docker-compose.yml
martin:
  image: ghcr.io/maplibre/martin:1.3.1
  container_name: gis_martin
  restart: unless-stopped
  ports:
    - "3001:3000"                # Martin listens on 3000 → exposed on 3001
  environment:
    DATABASE_URL: postgres://gis_admin:gis_password@db:5432/gis_platform
  depends_on:
    db:
      condition: service_healthy
```

## Endpoint Pattern

Once Martin discovers PostGIS tables, it exposes tile endpoints:

```
GET http://localhost:3001/{table_name}/{z}/{x}/{y}

# Examples:
GET http://localhost:3001/izs_zones/14/4563/5123        # IZS zoning polygons
GET http://localhost:3001/property_boundaries/15/9127/10247  # Property boundaries
GET http://localhost:3001/suburbs/12/2281/2561           # Suburb boundaries
```

## MapLibre GL JS Integration

```javascript
// [SPATIAL_ARCH] MapLibre + Martin vector tiles
map.addSource('izs-zones', {
  type: 'vector',
  tiles: ['http://localhost:3001/izs_zones/{z}/{x}/{y}'],
  minzoom: 13,
  maxzoom: 18,
});

map.addLayer({
  id: 'izs-zones-fill',
  type: 'fill',
  source: 'izs-zones',
  'source-layer': 'izs_zones',  // Martin uses table name as source-layer
  paint: {
    'fill-color': ['match', ['get', 'zone_code'],
      'SR1', '#4CAF50',  // Single Residential
      'GR1', '#8BC34A',  // General Residential
      'MU1', '#FF9800',  // Mixed Use
      'GB1', '#2196F3',  // General Business
      '#9E9E9E'          // Default
    ],
    'fill-opacity': 0.6,
  },
});
```

## PMTiles Generation Pipeline

For offline support, generate PMTiles from Martin-served tiles:

```bash
# 1. Generate MBTiles from Martin
martin-cp \
  --source "postgres://gis_admin:gis_password@localhost:5432/gis_platform" \
  --output izs_zones.mbtiles \
  --minzoom 10 --maxzoom 18 \
  --bbox 18.3,-34.2,18.9,-33.7  # Cape Town metro bounds

# 2. Convert to PMTiles
pmtiles convert izs_zones.mbtiles izs_zones.pmtiles

# 3. Upload to cloud storage
aws s3 cp izs_zones.pmtiles s3://gis-tiles/izs_zones.pmtiles
```

## Performance Considerations

| Metric | Target | Notes |
|---|---|---|
| Tile generation | <50ms per tile | For well-indexed PostGIS tables |
| Concurrent requests | 1,000+ | Rust async handles this natively |
| Memory usage | <100MB | Martin is extremely lightweight |
| Cold start | <2 seconds | Docker container ready to serve |

## Data Sources

- Supabase PostGIS (live spatial data)
- PMTiles archives on S3/Cloud Storage (offline)

## POPIA Implications

- Martin serves raw PostGIS data — ensure views/functions exclude personal data columns
- Create dedicated tile views that omit owner names and personal identifiers
- PMTiles for offline use must be generated from sanitised views only

## Acceptance Criteria

- [ ] Martin auto-discovers PostGIS tables and serves MVT endpoints
- [ ] MapLibre GL JS renders Martin-served tiles at 60fps
- [ ] PMTiles generation pipeline produces offline-capable archives
- [ ] Tile generation completes in <50ms for indexed tables
- [ ] Personal data columns are excluded from tile endpoints via PostGIS views
- [ ] Data source badge `[Martin MVT · 2026 · LIVE]` displayed per layer
- [ ] Three-tier fallback: Martin MVT → PMTiles → static GeoJSON mock
- [ ] Martin container auto-restarts on crash (`restart: unless-stopped`)
