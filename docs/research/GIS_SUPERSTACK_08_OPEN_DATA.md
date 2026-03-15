# GIS_SUPERSTACK_08_OPEN_DATA

This document collects recommended open data sources, licensing guidance, ingestion recipes, provenance tracking, and UI badge examples for the Cape Town GIS Hub (capegis). It is intended for the research & infra teams preparing M17_PREP analyses and production pipelines.

NOTE: This document is scoped to the project geographic limits: west: 18.0, south: -34.5, east: 19.5, north: -33.0. All Cape Town recommendations below must be filtered/validated to that bounding box at ingestion.

---

### 1. Executive summary

[Tool v1.0] – https://odp.capetown.gov.za

Cape Town and South African national open data provide a reliable foundation for base layers, cadastral references, and thematic datasets. Primary sources recommended:
- City of Cape Town Open Data Portal (ODP)
- data.gov.za (national datasets)
- OpenStreetMap (OSM)
- National geospatial datasets (e.g., SANSw, NGI, municipal registers)

One-line ingestion recipe (curl):

curl -L "https://odp.capetown.gov.za/datasets/suburbs.geojson" -o suburbs.geojson

Rollback note: If ingestion fails or new schema breaks, remove the staged dataset and restore from last valid snapshot in object storage (e.g., S3/Supabase storage) and re-run schema migration.

---

### 2. City of Cape Town Open Data Portal (ODP)

[Tool v1.1] – https://odp.capetown.gov.za

Why: authoritative local datasets (suburbs, zones, amenities, council datasets). Always preferred for municipal-specific attributes and local update cadence.

Ingestion example (ogr2ogr) to PostGIS (WGS84 storage EPSG:4326):

ogr2ogr -f Postgres PG:"host=localhost user=postgres dbname=capegis" \
  "/tmp/suburbs.geojson" -nln capetown_suburbs -t_srs EPSG:4326 -lco GEOMETRY_NAME=geom

Rollback note: Keep previous DB dump snapshot before applying new ingest. If properties or tenant fields are missing, revert DB to pre-ingest dump and re-apply after adjusting mapping.

---

### 3. data.gov.za (national datasets)

[Tool v2.0] – https://data.gov.za

Why: national statistics, administrative boundaries, and thematic layers (e.g., census, socio-economic, roads). Use as canonical national reference; intersect to project bbox.

Download example (curl) for a dataset:

curl -L "https://data.gov.za/dataset/transport_roads.geojson" -o transport_roads.geojson

Rollback note: Maintain a stable staging area for data.gov.za pulls. If schema changes, roll back by replacing the staging files with the prior snapshot from object storage and marking the dataset as CACHED until reconciled.

---

### 4. OpenStreetMap (OSM)

[Tool v0.9] – https://www.openstreetmap.org

Why: community-maintained features, footpaths, POIs, and up-to-date street network. Best for pedestrian routing, non-authoritative POIs.

Download snippet using osmconvert/osmfilter or Overpass API (curl):

curl -G "https://overpass-api.de/api/interpreter" --data-urlencode \
  "data=[out:json];(node( -34.5,18.0,-33.0,19.5 );<;);out body;" -o ct_osm.json

Rollback note: OSM extracts are incremental but ephemeral. If an OSM load breaks the pipeline, delete the temporary tables and restore prior materialised layer from cached MVT tiles.

---

### 5. National spatial datasets (e.g., NGI, SANSw)

[Tool v1.2] – https://www.sans.org.za

Why: surveying controls, national cadastre references, elevation models. Often subject to licensing restrictions — verify before publishing.

Example download via wget (HTTPS):

wget "https://ngi.example.gov.za/datasets/dsm_ct.tif" -O ngi_dsm_ct.tif

Rollback note: Hold a legal review flag for any dataset from national agencies. If licensing forbids reuse, remove derived layers and notify legal/compliance.

---

### 6. Licensing and reuse rules

[Tool v1.3] – https://data.gov.za/licence

Key patterns:
- Prefer ODbL, CC-BY 4.0, or explicit municipal open licences. Avoid datasets with restrictive proprietary licences.
- Track licence and attribution at ingestion and display per Rule 1: every map display must show a badge with [SOURCE_NAME · YEAR · STATUS].

License capture example (curl to fetch metadata JSON):

curl -s "https://odp.capetown.gov.za/api/3/action/package_show?id=suburbs" | jq .result.license

Rollback note: If upstream licence changes to a more restrictive form, immediately remove public-facing derivatives and mark layer as CACHED until compliant.

---

### 7. Ingestion patterns and ETL best practices

[Tool v1.4] – https://developers.google.com/earth-engine

Patterns:
- LIVE → CACHED → MOCK. Always attempt LIVE ingest; on failure fallback to cached snapshot and finally to public mock files in public/mock/*.geojson.
- Normalize geometries to storage CRS EPSG:4326. Reproject to EPSG:3857 only at rendering.
- Validate feature counts (max 10k client-side limit), attribute schema, and RLS tenant fields.

Example ogr2ogr normalization and simplification (command):

ogr2ogr -f GeoJSON /tmp/suburbs_normalized.geojson /tmp/suburbs.geojson -t_srs EPSG:4326 -simplify 0.0001

Rollback note: If new ingest corrupts attribute mapping, restore previous staging snapshot, and run a dry ETL locally for validation before promoting.

---

### 8. Provenance metadata and audit trails

[Tool v2.1] – https://github.com/opengeospatial

Principles:
- Record: source_url, fetch_timestamp, source_version (if provided), spatial_extent, licence, fetch_method, and checksums.
- Store provenance in the `api_cache` table with tenant_id and an audit_log entry.

Example curl + sha256sum pipeline to capture provenance:

curl -L "https://odp.capetown.gov.za/datasets/suburbs.geojson" -o /tmp/suburbs.geojson && sha256sum /tmp/suburbs.geojson > /tmp/suburbs.sha256

Rollback note: If provenance shows mismatched checksum, mark dataset as suspect and revert to last known-good blob. Do not publish suspect data.

---

### 9. Caching strategy (Supabase api_cache)

[Tool v1.5] – https://supabase.com

Design:
- Cache LIVE responses in `api_cache` with TTL (e.g., 24h) and staleness policy per dataset.
- On cache miss, fetch LIVE; on error, serve cached; if no cache, serve MOCK from public/mock.
- Cache entries include: source_badge, fetched_at, expire_at, etag/sha256, and schema snapshot.

Example SQL-ish ingest using curl pipeline:

curl -s "https://odp.capetown.gov.za/datasets/suburbs.geojson" -o /tmp/suburbs.geojson && \
psql capegis -c "\COPY api_cache(source_name, tenant_id, fetched_at, blob) FROM '/tmp/suburbs.geojson' WITH (FORMAT 'text')"

Rollback note: If a cache write corrupts the database, revert the `api_cache` table from nightly DB backup and mark the dataset as CACHED until revalidated.

---

### 10. UI badge specification (Rule 1 compliance)

[Tool v2.2] – https://developers.google.com/style

Badge format (mandatory): [SOURCE_NAME · YEAR · [LIVE|CACHED|MOCK]] visible without hover. Examples:

- [City of Cape Town ODP · 2026 · LIVE]
- [data.gov.za · 2024 · CACHED]
- [OpenStreetMap · 2026 · MOCK]

Badge generation snippet (server-side, curl to check freshness):

curl -I "https://odp.capetown.gov.za/datasets/suburbs.geojson" | grep -i "etag\|last-modified"

Rollback note: If badge metadata endpoint fails, display fallback badge: [SOURCE_NAME · YEAR · CACHED] and log the incident in audit_log.

---

### 11. Geospatial constraints and reprojection rules

[Tool v1.6] – https://epsg.io

Rules:
- Storage: EPSG:4326 only. Rendering: EPSG:3857 via MapLibre.
- Clip any ingest to project bbox { west: 18.0, south: -34.5, east: 19.5, north: -33.0 } to avoid scope creep.

ogr2ogr clip example (bbox) and reproject to 4326:

ogr2ogr -f GeoJSON /tmp/suburbs_ct_bbox.geojson /tmp/suburbs.geojson -spat 18.0 -34.5 19.5 -33.0 -t_srs EPSG:4326

Rollback note: If reprojection or clipping removes required attributes, restore original file and re-run with attribute-preserving flags; keep backups of raw downloads.

---

### 12. Quality checks and validation

[Tool v1.7] – https://turfjs.org

Checks:
- Geometry validity, topology (no self-intersections), feature counts, attribute presence (tenant_id if applicable), and bounding box containment.

Validation example using ogrinfo and jq:

ogrinfo -al /tmp/suburbs.geojson && jq '.features | length' /tmp/suburbs.geojson

Rollback note: If validation fails in CI, block promotion to production and revert to previous stable dataset. Notify data owner.

---

### 13. Handling personally identifiable information (POPIA)

[Tool v2.3] – https://www.justice.gov.za

Guidance:
- Do not ingest PII for guests. Any dataset containing PII must include POPIA annotation in the processing scripts and be subject to retention and rights operations.
- If an ingest accidentally includes PII, remove fields, run a purge job, and document the incident in docs/PLAN_DEVIATIONS.md and docs/OPEN_QUESTIONS.md.

Example ogr2ogr to drop sensitive fields (SQL passthrough):

ogr2ogr -f GeoJSON /tmp/stripped.geojson /tmp/source.geojson -sql "SELECT id, geom FROM source"

Rollback note: If PII was published, immediately take the layer offline, purge from caches and tiles, and follow escalation protocol in CLAUDE.md Section 9.

---

### 14. Multi-tenant & RLS considerations

[Tool v1.8] – https://supabase.com/docs

Always apply tenant scoping at ingestion and in RLS policies. Add tenant_id column if missing and set `app.current_tenant` for DB session.

Set current_tenant example (psql env):

psql capegis -c "SET LOCAL app.current_tenant TO '00000000-0000-0000-0000-000000000000';"

Rollback note: If tenant mapping is incorrect, disable public access to the dataset and revert DB changes from a pre-ingest backup. Record incident in audit_log.

---

### 15. Mock dataset policy

[Tool v0.8] – https://github.com/capegis/mock-data

Mocks live in: app/src/public/mock/*.geojson and must be usable offline. Mocks must follow the same schema as live datasets and include a source badge labelled MOCK.

Create mock curl example (save to public/mock):

curl -L "https://odp.capetown.gov.za/datasets/suburbs.geojson" -o app/src/public/mock/suburbs.mock.geojson

Rollback note: If a mock is accidentally promoted to LIVE, immediately remove promotion and replace with cached snapshot. Add test to prevent automated promotion from mock paths.

---

### 16. Example badge templates and UI snippets

[Tool v2.4] – https://developers.google.com/style

HTML snippet (server-side rendered) example for badge:

<div class="source-badge">[City of Cape Town ODP · 2026 · LIVE]</div>

Badge generation curl check (ETag):

curl -sI "https://odp.capetown.gov.za/datasets/suburbs.geojson" | grep -i etag

Rollback note: If live badge shows incorrect status, default to CACHED and schedule a re-fetch. Log the status change in audit log.

---

### 17. Recommendations for Cape Town (actionable)

[Tool v1.9] – https://odp.capetown.gov.za/catalog

1. Prioritise ODP for municipal boundary, zoning, and land use layers.
2. Use data.gov.za for demographic and national administrative layers; intersect to CT bbox.
3. Use OSM for street-level updates but label as community-sourced.
4. Cache all LIVE pulls in `api_cache` with a 24h TTL.

Quick curl example to fetch and clip for CT bbox:

curl -L "https://odp.capetown.gov.za/datasets/suburbs.geojson" -o /tmp/suburbs.geojson && \
ogr2ogr -f GeoJSON /tmp/suburbs_ct.geojson /tmp/suburbs.geojson -spat 18.0 -34.5 19.5 -33.0 -t_srs EPSG:4326

Rollback note: If a recommended source becomes unavailable, switch to cached snapshot and open issue with data owner. Document in docs/PLAN_DEVIATIONS.md.

---

### 18. Operational runbook snippet

[Tool v2.5] – https://docs.capegis.example/runbooks

Daily pipeline steps:
- Nightly fetch LIVE for critical layers
- Validate checksums and schema
- Push to `api_cache` and generate MVT tiles
- Update badge statuses

Example cron fetch curl command:

0 2 * * * curl -sL "https://odp.capetown.gov.za/datasets/suburbs.geojson" -o /tmp/suburbs.$(date +%F).geojson

Rollback note: If nightly job fails repeatedly, flip to manual mode and escalate to on-call infra. Record all actions in audit_log.

---

### 19. Tests and CI validations

[Tool v1.10] – https://github.com/actions

Add CI checks:
- Schema compatibility tests
- Checksum changes detection
- Bounding box containment
- Licence presence

Example test command (CI step):

jq -e '.features | length > 0' /tmp/suburbs.geojson

Rollback note: If CI fails after ingest, block merge and revert to previous commit. Open PR with investigation notes.

---

### 20. Closing notes & next steps

[Tool v2.6] – https://docs.capegis.example/next-steps

- Implement nightly fetch + api_cache TTL enforcement.
- Add provenance capture to all ETL jobs.
- Ensure UI badges are present on all map displays (Rule 1).
- Add dataset owners and update docs/OPEN_QUESTIONS.md with any licensing open issues.

Rollback note: Any change to ingestion that affects production must include DB snapshot and rollback procedure documented in docs/PLAN_DEVIATIONS.md before deployment.




<!-- EOF -->
