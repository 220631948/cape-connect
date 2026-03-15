# GIS_SUPERSTACK_03_TILE_PIPELINE

Author: Unit 03: GIS_SUPERSTACK_03_TILE_PIPELINE researcher
Date: 2026-03-15
Project: CapeTown GIS Hub (capegis)

This research document describes recommended tile pipeline components, settings, and deployment guidance for the capegis platform. It focuses on vector tile production and serving using Tippecanoe, Martin (Rust MVT tile server), TileServer GL, and PMTiles. It contains CLI snippets, Martin Docker deployment notes for DigitalOcean (per CLAUDE.md), URL patterns including the required `?optimize=true` query, and rollback guidance.

---

### 1. Overview [Tool v1.0] – https://example.com/overview

Summary:
- Purpose: document an operational tile pipeline for vector tiles (GeoJSON → MVT → serving)
- Audience: platform engineers, SRE, data engineers
- Scope: Tippecanoe ingestion, tile storage (PMTiles), tile server (Martin/TileServer GL), CI generation, DO Docker deployment

CLI snippet:

```bash
# list tile production files
ls -1 /data/tiles/*.geojson
```

Rollback note:
- If a pipeline release causes broken tiles, revert the tile generation job to the previous pipeline tag and restore the last known-good PMTiles artifact from object storage.

### 2. Tippecanoe: generation of vector tiles [Tool v2.1] – https://github.com/mapbox/tippecanoe

Tippecanoe is the de-facto CLI for generating Mapbox Vector Tiles (MVT) from GeoJSON/NDJSON. It is fast, tunable, and produces single-file mbtiles outputs (sqlite). Use Tippecanoe for batch production from authoritative datasets.

CLI snippet:

```bash
# Generate mbtiles using recommended settings
tippecanoe -o /tmp/capegis_parcels.mbtiles \
  -zg --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --no-tile-compression \
  --coalesce-smallest-as-needed \
  -l parcels -f /data/geojson/parcels.ndjson
```

Recommended Tippecanoe flags briefly explained:
- -zg : automatic zoom range suited to data
- --drop-densest-as-needed : prevent overly dense tiles
- --extend-zooms-if-still-dropping : keep more geometry when possible
- --no-tile-compression : leave compression for later (zstd/gzip in storage or PMTiles)

Rollback note:
- Keep last successful mbtiles artifact in object storage (Supabase Storage). If a new mbtiles corrupts the pipeline, remove it and redeploy previous artifact to the tile server.

### 3. Tippecanoe settings for capegis [Tool v2.1] – https://github.com/mapbox/tippecanoe#options

Prescriptive settings tuned for Cape Town datasets (respect map rules and max features per client layer):

CLI snippet:

```bash
# capegis recommended command for suburb boundaries
tippecanoe -o suburbs.mbtiles \
  -zg --drop-densest-as-needed --coalesce-smallest-as-needed \
  --minimum-zoom=6 --maximum-zoom=14 \
  --maximum-tile-bytes=100000 \
  --simplification=2.5 \
  -l suburbs suburbs.geojson
```

Notes:
- Enforce maximum zooms consistent with Map rules (parcel layers only zoom >= 14)
- Keep per-tile byte cap to avoid excessively large vector tiles
- Where feature counts can exceed 10,000 client-side, prefer serving as MVT from tile server instead of raw GeoJSON

Rollback note:
- Keep a versioned manifest of tippecanoe parameters (CI config). Re-run previous job with the stored parameters to regenerate a stable mbtiles.

### 4. Martin (Rust MVT tile server) – serving vector tiles [Tool v1.4] – https://github.com/gisman/martin

Martin is a performant Rust tile server for MVT that can serve mbtiles or PMTiles directly. It integrates well with Docker and fits the project's infra choice (DigitalOcean Droplet running Docker per CLAUDE.md).

Docker snippet (run locally):

```bash
# Run Martin with a mounted mbtiles and config
docker run -p 9000:9000 \
  -v /data/tiles:/tiles \
  -e MARTIN_CONFIG=/tiles/martin-config.yml \
  quay.io/gisman/martin:latest
```

Minimal martin-config.yml example:

```yaml
server:
  bind: 0.0.0.0:9000
sources:
  parcels:
    type: mbtiles
    url: "/tiles/parcels.mbtiles"
    max_zoom: 16
    min_zoom: 12
```

Deployment note (DigitalOcean):
- Per CLAUDE.md, deploy Martin in Docker on a DigitalOcean Droplet. Attach a secure volume for tile artifacts (PMTiles or mbtiles) and restrict access via firewall to the tile API port.

Rollback note:
- Use container image tags. If an update causes regressions, roll back by restarting the Droplet with the previous Martin image tag and restore the previous mbtiles/PMTiles files from object storage.

### 5. TileServer GL (browser + server) [Tool v3.3] – https://github.com/maptiler/tileserver-gl

TileServer GL is useful when you need both a development/preview server and rasterized styled tiles (GL styles). It can serve mbtiles and render raster tiles via Maplibre-compatible styles.

Docker snippet:

```bash
docker run -it --rm -p 8080:80 -v /data/tiles:/data quay.io/klokantech/tileserver-gl:latest
# Visit http://localhost:8080 to preview styles
```

Rollback note:
- Keep previous style files and mbtiles. If a style change breaks rendering, revert to the prior style.json and restart the tileserver container.

### 6. PMTiles for single-file object storage [Tool v1.2] – https://github.com/protomaps/pmtiles

PMTiles is a single-file, seekable format optimized for object stores (S3, Supabase Storage) and works well with tile servers that support it (or via proxy). It avoids sqlite locking issues and is ideal for CDN-backed storage.

CLI snippet (create pmtiles from mbtiles using pmtiles-tools):

```bash
pmtiles convert --input parcels.mbtiles --output parcels.pmtiles
# or use pmtiles-cli from npm
pm run pmtiles -- convert parcels.mbtiles parcels.pmtiles
```

Serving pattern:
- Upload parcels.pmtiles to Supabase Storage and let Martin or a CDN proxy serve ranges via HTTP

Rollback note:
- Keep two versions: active and staging pmtiles objects. On failure, switch object path in Martin config to the previous pmtiles file and reload Martin.

### 7. Compression and transfer (zstd, gzip) [Tool v1.0] – https://facebook.github.io/zstd/

Compression reduces storage and transfer size. Use zstd for artifacts in object storage (pmtiles) and gzip for HTTP transfer where required by a CDN or older clients.

CLI snippet:

```bash
# Compress mbtiles artifact with zstd for storage
zstd -19 --long=31 parcels.mbtiles -o parcels.mbtiles.zst

# Decompress before use
unzstd parcels.mbtiles.zst -o parcels.mbtiles
```

Rollback note:
- Always retain an uncompressed copy in your backup bucket for emergency restores. If decompression errors occur, fallback to the backup copy and re-run integrity checks.

### 8. Vector vs Raster — tradeoffs [Tool v1.0] – https://docs.mapbox.com/vector-tiles/

Summary:
- Vector tiles (MVT): smaller, client-side styling, interactive, better for multi-zoom features
- Raster tiles (PNG/WebP): pre-rendered, consistent styles, simpler CDN caching

CLI snippet (rasterize with tilelive or tileserver tools):

```bash
# Example: use TileServer GL to export raster tiles (high level)
tileserver-gl-light --mbtiles parcels.mbtiles --minzoom 10 --maxzoom 14 --format webp
```

Rollback note:
- If moving from vector to raster for performance, retain both tile sets and the routing config so you can switch back without losing styling or attribution metadata.

### 9. CI: generation pipeline for reproducible tiles [Tool v1.0] – https://docs.github.com/actions

Design a CI job that:
- Checks out authoritative data from protected storage
- Runs Tippecanoe with pinned version and stored flags
- Runs integrity checks (mbtiles sqlite PRAGMA integrity_check)
- Converts to PMTiles and uploads to Supabase Storage with immutable object versioning
- Updates Martin config (or a manifest) and triggers a deployment

GitHub Actions snippet:

```yaml
name: tiles:build
on:
  workflow_dispatch: {}
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Tippecanoe
        run: sudo apt-get install -y tippecanoe
      - name: Generate tiles
        run: |
          tippecanoe -o parcels.mbtiles -zg --drop-densest-as-needed --maximum-tile-bytes=100000 -l parcels parcels.ndjson
      - name: Upload to Supabase Storage
        run: supabase storage upload --bucket tiles parcels.pmtiles
```

Rollback note:
- CI should tag artifacts with semantic versioning. If a build fails in production, re-deploy the previous artifact by updating the manifest file to point to the previous artifact version and re-run the deployment step.

### 10. Deployment on DigitalOcean (Martin + Docker) [Tool v1.0] – https://www.digitalocean.com/products/droplets/

Per CLAUDE.md, Martin must run in Docker on a DO Droplet. Recommended pattern:
- Small droplet classed for CPU: 4 vCPU / 8GB for production tile serving
- Attach a block volume for tile storage (e.g., 250GB)
- Use docker-compose for process management or systemd unit that runs docker container
- Use DO firewall to expose only the tile port to load balancer or specific IPs

docker-compose snippet:

```yaml
version: '3.8'
services:
  martin:
    image: quay.io/gisman/martin:1.4.0
    restart: unless-stopped
    ports:
      - "9000:9000"
    volumes:
      - /mnt/tiles:/tiles:ro
    environment:
      - MARTIN_CONFIG=/tiles/martin-config.yml
```

DO-specific rollback note:
- Before updating Martin or the underlying Droplet image, create a snapshot of the Droplet and backup /mnt/tiles to object storage. If the deployment breaks, revert to the snapshot and restore tiles from storage.

### 11. Tile URL patterns and the ?optimize=true query [Tool v1.0] – https://example.com/tile-urls

For capegis, enforce tiled source URLs to include the optimization query parameter to enable client-side or server-side optimizations (cache hints, simplified responses). Example patterns:

- Martin vector tile URL:
  - https://tiles.capegis.city/parcels/{z}/{x}/{y}.pbf?optimize=true
- PMTiles access via HTTP range proxy:
  - https://objects.capegis.city/tiles/parcels.pmtiles?tile={z}/{x}/{y}&optimize=true

CLI snippet (curl test):

```bash
curl -I "https://tiles.capegis.city/parcels/14/2620/1671.pbf?optimize=true"
```

Rollback note:
- If `?optimize=true` causes unexpected behavior due to middleware changes, support both optimized and non-optimized endpoints and revert clients to the non-optimized endpoint while fixing middleware.

### 12. Cache invalidation and CDN strategy [Tool v1.0] – https://docs.fastly.com/

Strategy:
- Use immutable, versioned PMTiles objects for long-term storage
- Serve tiles via a CDN (Fastly/Cloudflare) with long TTLs for versioned objects
- When publishing a new tile set, update the manifest file and purge only the paths that changed

CLI snippet (Cloudflare purge example):

```bash
# purge specific path
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://tiles.capegis.city/parcels/*"]}'
```

Rollback note:
- Keep a CDN purge playbook. If a wrong purge removes cached tiles, re-point requests to the previous PMTiles object (manifest rollback) and warm the CDN.

### 13. Monitoring, health checks, and metrics [Tool v1.0] – https://prometheus.io/

Recommendations:
- Expose a /health endpoint on Martin and probe it with the DO load balancer
- Collect tile request metrics (requests per endpoint, latency, 4xx/5xx) and export to Prometheus
- Alert on error rate spikes and high latency

CLI snippet (Prometheus scrape config):

```yaml
scrape_configs:
  - job_name: 'martin'
    static_configs:
      - targets: ['tiles.capegis.city:9000']
```

Rollback note:
- If a new monitoring change floods alerts, temporarily silence alert rules for the affected job and investigate the root cause. Maintain a runbook with thresholds and mitigation steps.

### 14. Security, RLS, and data governance notes [Tool v1.0] – https://www.postgresql.org/

- Ensure tile generation jobs only include data permitted by RLS rules and tenant isolation (set app.current_tenant when generating tenant-scoped tiles).
- Data exposure control: for sensitive layers, restrict minzoom and avoid embedding PII in attributes.

CLI snippet (set tenant when exporting):

```bash
# Export using a session where app.current_tenant is set in the environment for Postgres -> GeoJSON export
PGOPTIONS="-c app.current_tenant=00000000-0000-0000-0000-000000000000" \
  psql -c "COPY (SELECT * FROM parcels WHERE tenant_id = current_setting('app.current_tenant', TRUE)::uuid) TO STDOUT WITH (FORMAT geojson)" > parcels.geojson
```

Rollback note:
- If a tile generation accidentally includes cross-tenant data, immediately revoke public access, rotate affected artifacts, and re-generate tiles after correcting the export command and re-scoping the tenant.

---

Open questions / next work:
- Define exact CI artifact retention policy and lifecycle (how many versions to keep)
- Define SLA for tile-serving and capacity planning for peak loads

References & further reading:
- Tippecanoe docs: https://github.com/mapbox/tippecanoe
- Martin repo: https://github.com/gisman/martin
- PMTiles: https://github.com/protomaps/pmtiles


POPIA & project notes:
- This document does not contain personal data. When pipelines touch PII-bearing attributes ensure files include a POPIA ANNOTATION and follow CLAUDE.md rules.


Generated by: Unit 03 researcher (Claude Code)
