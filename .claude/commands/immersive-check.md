<!--
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
-->

# /immersive-check — Immersive Spatial Stack Health Check

## Trigger
`/immersive-check` or "check immersive stack" or "verify spatial services"

## What It Does
Runs a comprehensive health check across the entire immersive spatial stack: CesiumJS 3D viewer, 4D Gaussian Splatting pipeline, OpenSky Network flight tracking, spatial data upload pipeline, and supporting infrastructure.

## Procedure
1. **Run cesium-validate**
   - Execute `/cesium-validate` checks (API keys, camera bounds, 3D Tiles, fallback, attribution)
   - Collect pass/fail results
   - If CesiumJS is not yet configured, report as ⚠️ NOT_CONFIGURED (not error)
2. **Run opensky-check**
   - Execute `/opensky-check` checks (API connectivity, rate limiter, bbox, cache, POPIA)
   - Collect pass/fail results
   - If OpenSky is not yet integrated, report as ⚠️ NOT_CONFIGURED
3. **Run 4dgs-status**
   - Execute `/4dgs-status` checks (microservice, training data, output, temporal, CRS)
   - Collect pass/fail results
   - If 4DGS pipeline is not yet set up, report as ⚠️ NOT_CONFIGURED
4. **Check all env vars**
   - Verify all immersive stack env vars are present:
     - `NEXT_PUBLIC_CESIUM_ION_TOKEN` — CesiumJS
     - `CESIUM_ION_ASSET_ID` — 3D Tiles
     - `OPENSKY_API_URL` — Flight data
     - `OPENSKY_USERNAME` / `OPENSKY_PASSWORD` — Optional auth
     - `MARTIN_URL` — Tile server
     - `NEXT_PUBLIC_SUPABASE_URL` — Database
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Database auth
   - Cross-reference with `.env.example` — warn if new vars are not documented
5. **Verify Docker containers**
   - Check `docker compose ps` for running containers:
     - `postgis` — PostGIS database
     - `martin` — Martin tile server
     - `4dgs-service` — 4DGS pipeline (if configured)
   - Report container health status and uptime
   - Check for port conflicts on 5432 (PostGIS), 3000 (Martin), 8080 (4DGS)
6. **Check Martin connection**
   - Verify Martin tile server is reachable at `MARTIN_URL`
   - Test catalog endpoint (`/catalog`) for available tile sources
   - Verify Martin is connected to PostGIS and serving spatial tables
   - Check that `?optimize=true` query param is supported
   - Confirm Martin serves tiles within Cape Town bbox

## Expected Output
```
Immersive Spatial Stack Health Report — [date]
================================================

┌─────────────────┬────────────┬─────────────────────────────────┐
│ Component       │ Status     │ Details                         │
├─────────────────┼────────────┼─────────────────────────────────┤
│ CesiumJS        │ ✅ HEALTHY │ Ion token valid, 3D Tiles OK    │
│ OpenSky Network │ ⚠️ DEGRADED│ API reachable, cache stale >60s │
│ 4DGS Pipeline   │ ⏭️ NOT_CFG │ Docker service not configured   │
│ PostGIS         │ ✅ HEALTHY │ Container up 3h, port 5432      │
│ Martin          │ ✅ HEALTHY │ 12 tile sources, port 3000      │
│ Env Vars        │ ⚠️ PARTIAL │ 5/7 present, 2 optional missing │
└─────────────────┴────────────┴─────────────────────────────────┘

Sub-Check Results:
  /cesium-validate   → 5/5 passed
  /opensky-check     → 4/5 passed (cache TTL warning)
  /4dgs-status       → skipped (not configured)

Environment Variables:
  ✅ NEXT_PUBLIC_CESIUM_ION_TOKEN
  ✅ NEXT_PUBLIC_SUPABASE_URL
  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
  ✅ MARTIN_URL
  ✅ OPENSKY_API_URL
  ⚠️ CESIUM_ION_ASSET_ID — not set (optional)
  ⚠️ OPENSKY_PASSWORD — not set (anonymous mode)

Docker Containers:
  ✅ postgis      — Up 3 hours (healthy)
  ✅ martin        — Up 3 hours (healthy)
  ⏭️ 4dgs-service — not in docker-compose.yml

Martin Tile Server:
  ✅ Catalog: 12 sources available
  ✅ PostGIS connection: OK
  ✅ Cape Town bbox coverage: confirmed

Overall: OPERATIONAL (2 warnings, 1 not configured)
```

## When NOT to Use
- For individual component debugging (use the specific sub-commands)
- When only working on 2D MapLibre layers (use `/validate-spatial` + `/optimize-tiles`)
- In CI/CD — this command requires running Docker containers
