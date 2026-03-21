# GIS_SUPERSTACK_05 — SPATIAL_API

Status: Draft
Author: Unit 05: GIS_SUPERSTACK_05_SPATIAL_API researcher
Date: 2026-03-15

This document describes recommended patterns and operational guidance for the SPATIAL_API domain in the CapeTown GIS Hub (capegis). It covers vector tile serving, WFS, REST vs GraphQL for spatial data, tiled endpoints, caching, Supabase api_cache patterns, and the mandatory LIVE→CACHED→MOCK fallback chain required by the project.

Important: This document implements and references RULES from /home/mr/Desktop/Geographical Informations Systems (GIS)/CLAUDE.md, including the Three-Tier Fallback (Rule 2), RLS, CRS choices, and environment variable constraints.

### 1. Overview [Tool v1.0] – https://example.com/tool-overview

This section summarises the spatial API design goals and the platform constraints.

Goals:
- Efficient delivery of vector and raster tiles for interactive web maps
- Predictable, cacheable APIs for analysis and exports
- Secure multi-tenancy (RLS + application-layer checks)
- Resilient data access (Three-Tier Fallback: LIVE → CACHED → MOCK)

Example curl to sanity-check a tile endpoint (HTTP 200 expected):

curl -I "https://tiles.example.com/tiles/v1/{z}/{x}/{y}.pbf"

Rollback note: If a new tile endpoint rollout fails, rollback by re-pointing the frontend MAP_SOURCE URL to the previous tile host and invalidate edge caches.

### 2. Vector Tiles (MVT) — serving strategy [Tool v1.1] – https://example.com/tool-tiles

Vector tiles are the primary delivery mechanism for large feature sets in capegis. Use Martin (Rust MVT) for production tile serving and PMTiles for offline or CDN-backed bundles.

Key points:
- Produce MVT with tile coordinates in Web Mercator (EPSG:3857) while storing canonical data in EPSG:4326.
- Limit client-side GeoJSON to <10k features per layer (project rule). Use MVT above that.
- Ensure minzoom/maxzoom metadata is present for each layer.

Example endpoint pattern (curl):

curl -s "${MARTIN_URL:-https://tiles.example.com}/tiles/v1/layer_name/{z}/{x}/{y}.pbf" --head

SQL snippet to populate an MVT-ready view in PostGIS:

-- Create a tile-ready view with geom_webmercator
CREATE VIEW public.vw_parcels_mvt AS
SELECT id, parcel_ref, ST_Transform(geom, 3857) AS geom_3857
FROM public.parcels
WHERE ST_Intersects(geom, ST_Transform(ST_MakeEnvelope(18.0, -34.5, 19.5, -33.0, 4326), 4326));

Rollback note: If the MVT view introduces performance regressions, revert the view definition to the previous SQL and restart the Martin service.

### 3. WFS / WMS considerations [Tool v1.0] – https://example.com/tool-wfs

WFS provides feature-level querying and is suitable for server-to-server exports and ETL. WMS remains useful for server-rendered basemaps.

Recommendations:
- Expose WFS only for authenticated, rate-limited server clients (exports, analysis workers).
- Enforce tenant isolation with RLS and application-set current_tenant for all WFS backend queries.

Example WFS request (curl):

curl -G "https://api.example.com/wfs" \
  --data-urlencode "service=WFS" \
  --data-urlencode "request=GetFeature" \
  --data-urlencode "typeName=public:parcels" \
  --data-urlencode "outputFormat=application/json"

Rollback note: Disable WFS by toggling a feature flag in tenant_settings and return HTTP 503 with a helpful message if compromised.

### 4. REST vs GraphQL for spatial APIs [Tool v2.0] – https://example.com/tool-graphql

Both styles are valid. Use REST for tile and heavy binary endpoints (MVT, raster). Use GraphQL for flexible filtered queries when the payload sizes are moderate and the client benefits from field-level selection.

Guidelines:
- REST for: /tiles/, /export/, /wfs/, /static-tiles/
- GraphQL for: tenant-scoped dashboards, analytical queries with joins, and selective field returns where caching is handled carefully.

curl example REST lookup with supabase api_cache token header:

curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "https://api.example.com/v1/analysis/urban_density?bbox=18.0,-34.5,19.5,-33.0"

GraphQL example (curl):

curl -X POST https://api.example.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query($bbox:String!){urbanStats(bbox:$bbox){count, density}}","variables":{"bbox":"18.0,-34.5,19.5,-33.0"}}'

Rollback note: If GraphQL resolver introduces high DB load, disable complex aggregations and fall back to paginated REST exports.

### 5. Tiled endpoint URL patterns and caching headers [Tool v1.2] – https://example.com/tool-cache

Design URL patterns to be truly cacheable. Include layer name, style or version in the path to allow safe cache invalidation.

Pattern examples:
- /tiles/v1/{layer}/{style}/{z}/{x}/{y}.pbf
- /tiles/pmtiles/{bundle_name}/{z}/{x}/{y}.pbf

Recommended HTTP headers (example):
- Cache-Control: public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400
- ETag: server-generated content hash

curl to inspect headers:

curl -I "https://tiles.example.com/tiles/v1/parcels/v1/14/16384/11585.pbf"

Rollback note: If an incorrect cache header propagates, invalidate CDN keys by changing the style or layer version component in the URL.

### 6. Caching strategies & Supabase api_cache patterns [Tool v3.0] – https://example.com/tool-supabase

Supabase should implement api_cache table for application-level caching of live API responses (Rule in project file). The api_cache table acts as the second tier in the Three-Tier Fallback (LIVE → CACHED → MOCK).

Suggested api_cache schema (SQL snippet):

CREATE TABLE IF NOT EXISTS public.api_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  tenant_id uuid,
  response jsonb NOT NULL,
  status_code int NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

Example insert/update usage (upsert):

INSERT INTO public.api_cache (cache_key, tenant_id, response, status_code, expires_at)
VALUES ('urban_density:18.0,-34.5,19.5,-33.0', '00000000-0000-0000-0000-000000000000', '{"count":123}', 200, now() + interval '1 hour')
ON CONFLICT (cache_key) DO UPDATE SET response = EXCLUDED.response, status_code = EXCLUDED.status_code, expires_at = EXCLUDED.expires_at, created_at = now();

Key patterns:
- Cache keys must include tenant_id, query parameters, and API version.
- TTL should be configurable per endpoint and per tenant via tenant_settings.
- Respect RLS: set current_setting('app.current_tenant', TRUE) for DB calls and include tenant_id column in api_cache.

curl example to prime cache via server-side endpoint:

curl -X POST "https://api.example.com/internal/cache/prime" -H "Authorization: Bearer $SERVICE_ROLE" -d '{"endpoint":"/v1/analysis/urban_density","params":"bbox=18.0,-34.5,19.5,-33.0"}'

Rollback note: If cache writes cause DB performance issues, reduce prime concurrency and shorten TTLs while backfilling a cold cache gradually.

### 7. Three-Tier Fallback — LIVE → CACHED → MOCK (Rule 2) [Tool v1.0] – https://example.com/tool-fallback

Rule 2 from CLAUDE.md: "Every external data component: LIVE → CACHED (Supabase api_cache) → MOCK (public/mock/*.geojson). Never show blank map or error instead of MOCK."

Implementation pattern:
- First, attempt LIVE fetch. If success and TTL, write to api_cache and return.
- If LIVE fails (timeout, error code) or the service is rate-limited, attempt to read api_cache by cache_key for the tenant.
- If api_cache hit and not expired, return cached response and mark as CACHED in the UI badge.
- If api_cache miss or expired, serve MOCK from public/mock/<dataset>.geojson and mark as MOCK in UI.

Code snippet (pseudocode curl + shell):

# Try LIVE
curl -sSf "https://external.data.provider/geojson?bbox=18.0,-34.5,19.5,-33.0" -o /tmp/live.json || \
  (echo "LIVE failed, trying cache" && psql -c "SELECT response FROM public.api_cache WHERE cache_key='urban_density:18.0,-34.5,19.5,-33.0'") || \
  (echo "CACHE miss, using MOCK" && cat ./public/mock/urban_density.geojson)

UI badge rule (example):
- [SOURCE_NAME · YEAR · LIVE|CACHED|MOCK]

Rollback note: If a new fallback orchestration causes stale MOCK data to appear widely, revert to the previous orchestration code path and trigger a cache warm-up for api_cache.

### 8. Client-side integration patterns (MapLibre + React) [Tool v1.3] – https://example.com/tool-maplibre

Client rules:
- Initialise MapLibre once per page. Import CSS in app/layout.tsx.
- Manage sources with versioned URLs so cache invalidation is explicit.
- Show data source badge in the component header (per Rule 1).

Map source example (JavaScript curl-like snippet):

fetch('/api/tilesource/metadata?layer=parcels')
  .then(r=>r.json())
  .then(meta => map.addSource('parcels', {type:'vector', tiles: [meta.url]}));

Rollback note: If a client release regresses map initialisation, deploy a hotfix that restores previous asset URLs and disable the new source flags.

### 9. Security: RLS, token handling, and no API keys in source code [Tool v2.1] – https://example.com/tool-security

Never hardcode secrets. Enforce the following:
- Server-only keys (SUPABASE_SERVICE_ROLE_KEY) live in environment and are only used in server-side functions.
- Public keys must be prefixed NEXT_PUBLIC_.
- All DB tables that are tenant-scoped must have RLS policies (see CLAUDE.md Rule 4).

Example: set session tenant before querying

SELECT set_config('app.current_tenant', '00000000-0000-0000-0000-000000000000', true);
SELECT * FROM public.api_cache WHERE tenant_id = current_setting('app.current_tenant', TRUE)::uuid;

Rollback note: If an RLS policy change causes access failures, immediately restore the previous policy SQL from git and re-deploy the migration rollback.

### 10. Monitoring, observability and SLAs [Tool v1.4] – https://example.com/tool-monitoring

Track:
- Tile request rates, P95 latency, error rates
- api_cache hit ratio per endpoint and tenant
- Fallback incidence rate (how often clients fall back to CACHED or MOCK)

Prometheus metrics to expose (example text snippet):

# HELP capegis_api_cache_hits_total Total cache hits
# TYPE capegis_api_cache_hits_total counter
capegis_api_cache_hits_total{endpoint="urban_density"} 1234

curl to fetch a health endpoint:

curl -sS "https://api.example.com/health" | jq .

Rollback note: If monitoring alerts spike after a release, use the incident runbook to roll back the release and switch traffic to the stable backend.

### 11. Operational runbooks: deploy, migrate, and rollback [Tool v1.0] – https://example.com/tool-runbook

Deploy checklist:
- Run database migration in a canary tenant
- Warm api_cache for heavy endpoints
- Deploy Martin tile server behind a health-checked load balancer
- Change frontend config to point to new endpoints in a feature-flagged manner

Migration SQL example (safely add column):

ALTER TABLE public.api_cache ADD COLUMN IF NOT EXISTS updated_by text;

Rollback note: Use migration rollback scripts in supabase/migrations. If SQL revert is non-trivial, follow documented manual rollback steps and notify platform admin.

### 12. Examples: a full request flow (LIVE → CACHED → MOCK) [Tool v2.0] – https://example.com/tool-examples

1) Client requests /v1/analysis/urban_density?bbox=...
2) API server attempts LIVE external provider fetch with 3s timeout.
3) On success: server writes response to api_cache and returns payload with header X-CAPEGIS-SOURCE: LIVE
4) On external failure: server queries api_cache; if hit, returns payload with X-CAPEGIS-SOURCE: CACHED
5) If cache miss: server returns ./public/mock/urban_density.geojson with X-CAPEGIS-SOURCE: MOCK

curl example showing header usage:

curl -i "https://api.example.com/v1/analysis/urban_density?bbox=18.0,-34.5,19.5,-33.0"

Rollback note: If this orchestration caused incorrect tenancy leakage, revert to previous code and invalidate offending cache keys.

---

Appendix: Implementation checklist
- [ ] Create Martin tile hosts with healthy probes
- [ ] Create api_cache table and ensure RLS policies are applied
- [ ] Add mock GeoJSONs under app/public/mock
- [ ] Implement server orchestration with explicit tenant context
- [ ] Add UI badges for source & year

References
- CLAUDE.md (project rules) — file rooted at /home/mr/Desktop/Geographical Informations Systems (GIS)/CLAUDE.md
- Supabase docs — https://supabase.com/docs

Document history
- Draft created 2026-03-15 by Unit 05 researcher
