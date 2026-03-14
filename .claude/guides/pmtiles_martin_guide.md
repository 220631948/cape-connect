# PMTiles & Martin Guide — Cape Town GIS Hub

<!-- __generated_by: rebootstrap_agent -->
<!-- __timestamp: 2026-03-04T10:39:43Z -->

## Overview

This guide covers vector tile serving for the Cape Town GIS Hub using two complementary systems:
- **Martin** — Rust-based MVT tile server, runs in Docker (local dev) and on DigitalOcean (production)
- **PMTiles** — Single-file portable archive format for offline/edge tile delivery via Serwist + Dexie.js

---

## Local Development Setup

### Prerequisites
- Docker + Docker Compose
- PostGIS database (provided by `docker-compose.yml`)

### Starting Martin Locally

```bash
docker compose up -d   # Starts PostGIS + Martin
```

Martin will be available at `http://localhost:3000` (or the port in `docker-compose.yml`).

### `docker-compose.yml` Martin Service (reference shape)

```yaml
martin:
  image: ghcr.io/maplibre/martin:latest
  ports:
    - "3000:3000"
  environment:
    - DATABASE_URL=postgresql://postgres:postgres@postgis:5432/capegis
  depends_on:
    - postgis
  command: ["--config", "/martin/config.yaml"]
  volumes:
    - ./martin:/martin
```

### Martin Config (`martin/config.yaml`)

```yaml
# martin/config.yaml — local dev
postgres:
  connection_string: ${DATABASE_URL}
  pool_size: 5

# Auto-publish all PostGIS geometry tables
auto_publish:
  tables: true
  functions: false

# Optional: explicit table sources
tables:
  zoning_parcels:
    schema: public
    table: zoning
    srid: 4326
    geometry_column: geom
    minzoom: 10
    maxzoom: 18
    id_column: gid
```

### Environment Variable

```bash
# .env.local
MARTIN_URL=http://localhost:3000
```

Absent behaviour: tiles fall back to Supabase PostgREST GeoJSON source.

---

## Production Setup (DigitalOcean Droplet)

### Docker on Droplet

```bash
# On the DigitalOcean droplet
docker pull ghcr.io/maplibre/martin:latest
docker run -d \
  --name martin \
  -p 3000:3000 \
  -e DATABASE_URL="$PRODUCTION_DATABASE_URL" \
  ghcr.io/maplibre/martin:latest
```

### Nginx Reverse Proxy (HTTPS)

```nginx
server {
    listen 443 ssl;
    server_name tiles.yourdomain.co.za;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=3600";
        add_header Access-Control-Allow-Origin "https://capegis.vercel.app";
    }
}
```

### Production `MARTIN_URL`

```bash
# Set in Vercel environment variables — never in source code
MARTIN_URL=https://tiles.yourdomain.co.za
```

---

## Tile Serving Patterns

### Pattern 1 — Martin MVT Source in MapLibre

Use when the dataset exceeds **10 000 features** (CLAUDE.md §5 hard limit for client GeoJSON).

```typescript
// Triggered by TILE-AGENT when threshold is crossed
map.addSource('zoning', {
  type: 'vector',
  tiles: [`${process.env.NEXT_PUBLIC_MARTIN_URL}/zoning_parcels/{z}/{x}/{y}`],
  minzoom: 10,
  maxzoom: 18,
  attribution: '© City of Cape Town',
});

map.addLayer({
  id: 'zoning-fill',
  type: 'fill',
  source: 'zoning',
  'source-layer': 'zoning_parcels',  // matches Martin table name
  minzoom: 10,
  maxzoom: 18,
  paint: { 'fill-color': '#ff6b35', 'fill-opacity': 0.4 },
});
```

### Pattern 2 — PMTiles Offline Source

Use for offline-capable layers (Serwist-cached, served from Supabase Storage or `public/tiles/`).

```typescript
import { PMTiles, Protocol } from 'pmtiles';
import maplibregl from 'maplibre-gl';

// Register PMTiles protocol once (init guard — see maplibre_patterns.md)
let protocolAdded = false;
function addPMTilesProtocol() {
  if (protocolAdded) return;
  const protocol = new Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile.bind(protocol));
  protocolAdded = true;
}

// Add offline source
addPMTilesProtocol();
map.addSource('suburbs-offline', {
  type: 'vector',
  url: 'pmtiles:///tiles/suburbs.pmtiles',  // served from public/tiles/
  minzoom: 8,
  maxzoom: 14,
});
```

### Pattern 3 — Three-Tier Fallback for Tiles

```typescript
async function addZoningSource(map: maplibregl.Map): Promise<string> {
  const martinUrl = process.env.NEXT_PUBLIC_MARTIN_URL;

  // LIVE — Martin MVT
  if (martinUrl) {
    try {
      const probe = await fetch(`${martinUrl}/zoning_parcels/0/0/0`, { method: 'HEAD' });
      if (probe.ok) {
        map.addSource('zoning', { type: 'vector', tiles: [`${martinUrl}/zoning_parcels/{z}/{x}/{y}`] });
        return 'LIVE';
      }
    } catch {}
  }

  // CACHED — Supabase Storage PMTiles
  try {
    const { data } = supabase.storage.from('tiles').getPublicUrl('zoning.pmtiles');
    map.addSource('zoning', { type: 'vector', url: `pmtiles:/${data.publicUrl}` });
    return 'CACHED';
  } catch {}

  // MOCK — local GeoJSON fallback
  map.addSource('zoning', { type: 'geojson', data: '/mock/zoning.geojson' });
  return 'MOCK';
}
```

---

## PMTiles Generation

### From PostGIS (using `ogr2ogr` + `tippecanoe`)

```bash
# Export from PostGIS
ogr2ogr -f GeoJSON /tmp/zoning.geojson \
  "postgresql://postgres:postgres@localhost:5432/capegis" \
  -sql "SELECT gid, zone_code, geom FROM zoning"

# Generate PMTiles
tippecanoe \
  --output=public/tiles/zoning.pmtiles \
  --minimum-zoom=10 \
  --maximum-zoom=18 \
  --layer=zoning_parcels \
  --drop-densest-as-needed \
  /tmp/zoning.geojson
```

### Zoom Ranges by Layer

| Layer | Min Zoom | Max Zoom | Rationale |
|-------|---------|---------|-----------|
| Suburb boundaries | 8 | 14 | City-wide overview |
| Zoning parcels | 10 | 18 | Mid-range context |
| Cadastral parcels | 14 | 18 | CLAUDE.md §5 rule |
| Risk overlays | 9 | 16 | Variable coverage |

---

## Offline Fallback (Serwist + Dexie.js)

PMTiles files are cached via Serwist service worker. Dexie.js stores metadata about available offline tile sets.

```typescript
// lib/offline/tiles.ts
import Dexie from 'dexie';

const db = new Dexie('capegis-offline');
db.version(1).stores({ tileSets: 'name, url, cachedAt, zoomRange' });

export async function markTileSetCached(name: string, url: string, zoomRange: [number, number]) {
  await db.table('tileSets').put({ name, url, cachedAt: Date.now(), zoomRange });
}
```

Serwist cache strategy for tiles: `CacheFirst` with a 7-day expiry.

---

## TILE-AGENT Checklist

- [ ] Dataset exceeds 10 000 features (verified before invoking Martin)
- [ ] Zoom range set per table above
- [ ] `MARTIN_URL` env var documented in `.env.example`
- [ ] Three-tier fallback implemented (LIVE → CACHED → MOCK)
- [ ] Data source badge shows `[SOURCE · YEAR · LIVE|CACHED|MOCK]`
- [ ] Attribution includes `© City of Cape Town` or relevant source
- [ ] CartoDB basemap attribution still visible (CLAUDE.md Rule 6)

<!-- nonce:15 -->
