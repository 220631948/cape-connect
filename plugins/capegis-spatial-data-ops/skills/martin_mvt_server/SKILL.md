---
name: martin-mvt-server
description: Configure, deploy, and troubleshoot the Martin (Rust) vector tile server that auto-discovers PostGIS spatial tables and serves Mapbox Vector Tiles (MVT) to MapLibre GL JS. Covers Docker Compose setup, PostGIS sanitised view creation (PII exclusion), MapLibre source/layer integration, PMTiles generation with martin-cp for offline support, three-tier fallback (Martin → PMTiles → static GeoJSON), and performance tuning. Use this skill whenever the user asks about Martin, vector tile server, MVT endpoints, tile serving from PostGIS, martin-cp, PMTiles generation, the Docker tile server, offline tile archives, or spatial table auto-discovery. Required for Milestone M4b.
---

# Martin MVT Server

## Purpose

Martin is the Rust-based vector tile server that auto-discovers PostGIS spatial tables and serves compressed Mapbox Vector Tiles (MVT) for MapLibre GL JS rendering. It requires zero configuration files — just point it at a PostGIS connection string.

**Milestone:** M4b — depends on M1 (database schema + PostGIS).  
**Architecture:** [ADR-003](../../docs/architecture/ADR-003-tile-server.md)

---

## Why Martin

- **Zero config:** Auto-discovers any table with a geometry column — no XML, no YAML per table.
- **Performance:** Rust async handles 1,000+ concurrent tile requests; sub-50ms tile generation on indexed tables.
- **PMTiles:** `martin-cp` bulk-exports to PMTiles format for offline field use.
- **Lightweight:** < 100MB RAM, < 2s cold start.

---

## Docker Compose Configuration

```yaml
# docker-compose.yml (already present in project root)
martin:
  image: ghcr.io/maplibre/martin:1.3.1
  container_name: gis_martin
  restart: unless-stopped
  ports:
    - "3001:3000"   # Martin listens on 3000, exposed on 3001
  environment:
    DATABASE_URL: postgres://gis_admin:gis_password@db:5432/gis_platform
  depends_on:
    db:
      condition: service_healthy
```

Start: `docker compose up -d martin`  
Health check: `curl http://localhost:3001/health`  
Tile catalog: `curl http://localhost:3001/catalog`

---

## Tile Endpoint Pattern

Once Martin discovers PostGIS tables, it exposes:

```
GET http://localhost:3001/{table_or_view_name}/{z}/{x}/{y}

# Examples:
GET http://localhost:3001/izs_zones/14/4563/5123         # IZS zoning polygons
GET http://localhost:3001/cadastral_tile_view/15/9127/10247  # Sanitised parcel view
GET http://localhost:3001/suburbs/12/2281/2561            # Suburb boundaries
```

> **Production URL:** Replace `localhost:3001` with your DigitalOcean droplet URL. Martin port should NOT be public — proxy via Nginx/Caddy with rate limiting.

---

## PostGIS Sanitised Views (POPIA)

Martin serves raw table data — **never expose tables containing PII columns**. Create dedicated tile views that strip personal identifiers:

```sql
-- Safe view for cadastral parcels — no owner data
CREATE OR REPLACE VIEW cadastral_tile_view AS
SELECT
  id,
  erf_no,
  suburb,
  zone_code,
  area_sqm,
  geom  -- PostGIS geometry column (EPSG:4326)
FROM cadastral_parcels;
-- Deliberately omits: owner_name, owner_id, contact_info

-- Safe view for valuation data — no PII
CREATE OR REPLACE VIEW valuation_tile_view AS
SELECT
  parcel_id,
  suburb,
  zone_code,
  city_valuation_zar,
  gv_year,
  coordinates AS geom
FROM valuation_data;
-- Deliberately omits: any owner-identifying columns
```

Martin auto-discovers these views and exposes them as tile endpoints just like tables.

---

## MapLibre GL JS Integration

```javascript
// Add Martin vector tile source
map.addSource('izs-zones', {
  type: 'vector',
  tiles: [`${process.env.NEXT_PUBLIC_MARTIN_URL}/izs_zones/{z}/{x}/{y}`],
  minzoom: 10,
  maxzoom: 18,
});

// Add layer (source-layer must match table/view name)
map.addLayer({
  id: 'izs-zones-fill',
  type: 'fill',
  source: 'izs-zones',
  'source-layer': 'izs_zones',  // Martin uses the table/view name
  minzoom: 13,
  paint: {
    'fill-color': ['match', ['get', 'zone_code'],
      'SR1', '#4CAF50',  // Single Residential
      'GR1', '#8BC34A',  // General Residential
      'MU1', '#FF9800',  // Mixed Use
      'GB1', '#2196F3',  // General Business
      '#9E9E9E'
    ],
    'fill-opacity': 0.6,
  },
});
```

**Zoom gating:** Cadastral parcels must only render at zoom ≥ 14 (CLAUDE.md §5).  
**Layer Z-order:** Martin tile layers sit below risk overlays and draw layers (see CLAUDE.md §5).

---

## Three-Tier Fallback (Rule 2)

| Tier | Source | Badge |
|------|--------|-------|
| LIVE | Martin MVT from DigitalOcean Droplet | `[Martin MVT · 2026 · LIVE]` |
| CACHED | PMTiles from Supabase Storage (HTTP Range Requests) | `[PMTiles · 2026 · CACHED]` |
| MOCK | Static GeoJSON in `public/mock/` | `[Mock · STATIC · MOCK]` |

```typescript
// Configure MapLibre source with fallback
const martinAvailable = await fetch(`${process.env.NEXT_PUBLIC_MARTIN_URL}/health`)
  .then(r => r.ok).catch(() => false);

map.addSource('cadastral', martinAvailable ? {
  type: 'vector',
  tiles: [`${MARTIN_URL}/cadastral_tile_view/{z}/{x}/{y}`],
} : {
  type: 'vector',
  url: `pmtiles://${SUPABASE_STORAGE_URL}/tiles/cadastral.pmtiles`,
});
```

---

## PMTiles Generation Pipeline (Offline Support)

PMTiles are Cloud-Optimised Archives for field workers during load-shedding. Generate with `martin-cp`:

```bash
# 1. Bulk export from PostGIS via Martin to MBTiles
martin-cp \
  --source "postgres://gis_admin:gis_password@localhost:5432/gis_platform" \
  --output izs_zones.mbtiles \
  --table izs_zones \
  --minzoom 10 --maxzoom 18 \
  --bbox 18.3,-34.2,18.9,-33.7  # Cape Town metro bounding box

# 2. Convert MBTiles → PMTiles
pmtiles convert izs_zones.mbtiles izs_zones.pmtiles

# 3. Upload to Supabase Storage (or S3)
supabase storage cp izs_zones.pmtiles ss:///tiles/izs_zones.pmtiles
```

**PMTiles safety rule:** Only generate from sanitised views — never from tables with PII columns.

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Tile generation (indexed table) | < 50ms per tile |
| Concurrent tile requests | 1,000+ |
| Memory usage | < 100MB |
| Cold start (Docker) | < 2 seconds |
| PMTiles generation (metro area) | < 30 minutes |

Optimize slow tiles with PostGIS:
```sql
-- Add GiST spatial index (required for Martin performance)
CREATE INDEX idx_izs_zones_geom ON izs_zones USING GIST (geom);

-- Simplify geometry for lower zoom levels
CREATE OR REPLACE VIEW izs_zones_simplified AS
SELECT id, zone_code, suburb,
  CASE
    WHEN ST_Area(geom) > 0.0001 THEN ST_Simplify(geom, 0.0001)
    ELSE geom
  END AS geom
FROM izs_zones;
```

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Martin container crash | `restart: unless-stopped` auto-restarts; MapLibre falls back to PMTiles |
| PostGIS connection lost | Martin returns 502 → Serwist serves stale tiles from cache |
| New table added | Martin auto-discovers on next startup; no config change needed |
| Large tile (dense area) | Apply `ST_Simplify` at lower zoom levels; target < 500KB per tile |
| PII column in source table | Use sanitised view (never expose raw table directly) |
| martin-cp during peak traffic | Schedule off-peak or use a read replica |

---

## Security Checklist

- [ ] Martin connects to PostGIS with **read-only** credentials
- [ ] Martin port (3001) is not exposed publicly — proxied via Nginx/Caddy
- [ ] All tile endpoints use sanitised views (no PII columns)
- [ ] PMTiles generated from sanitised views only
- [ ] `NEXT_PUBLIC_MARTIN_URL` configured per environment (never hardcoded)

---

## Acceptance Criteria (M4b)

- ✅ Martin auto-discovers PostGIS tables and serves MVT endpoints
- ✅ MapLibre GL JS renders Martin-served tiles at 60fps
- ✅ PMTiles generation pipeline produces offline-capable archives
- ✅ Tile generation completes in < 50ms for indexed tables
- ✅ Personal data columns excluded from tile endpoints via PostGIS views
- ✅ Data source badge `[Martin MVT · 2026 · LIVE]` displayed per layer
- ✅ Three-tier fallback: Martin MVT → PMTiles → static GeoJSON mock
- ✅ Martin container auto-restarts on crash (`restart: unless-stopped`)
- ✅ Cadastral layer only visible at zoom ≥ 14
