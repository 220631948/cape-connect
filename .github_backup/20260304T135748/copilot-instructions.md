# Copilot Instructions — CapeTown GIS Hub (`capegis`)

## Read-first sources (authoritative)
- `CLAUDE.md` (project rules and constraints)
- `AGENTS.md` (agent boundaries, build/validation commands)
- `.github/copilot/instructions/*.instructions.md` (Next.js, MapLibre, Supabase, TypeScript, POPIA specifics)
- `docs/architecture/SYSTEM_DESIGN.md` + ADRs (`ADR-002`, `ADR-003`, `ADR-005`)

## Build, test, lint, and validation commands
```bash
# Install deps
npm install

# Local infra (PostGIS + Martin)
docker compose up -d

# App lifecycle
npm run dev
npm run build
npm run start

# Quality gates
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

### Single-test execution
```bash
# Run one Vitest file
npx vitest run path/to/file.test.ts

# Run one Vitest test case by name
npx vitest run path/to/file.test.ts -t "test name"

# Run one Playwright spec
npx playwright test path/to/file.spec.ts
```

## High-level architecture
- **Frontend:** Next.js 15 App Router + React 19 + TypeScript + Tailwind, hosted on Vercel.
- **Map stack:** MapLibre GL JS only (via client-side dynamic loading), with strict layer ordering and zoom gating.
- **State/offline:** Zustand for UI/map state, Serwist service worker + Dexie for offline behavior.
- **Data platform:** Supabase (PostgreSQL 15 + PostGIS + Auth + RLS) with tenant isolation.
- **Tiles:** Martin (Rust MVT server) runs in Docker on a DigitalOcean droplet and serves PostGIS-backed vector tiles.
- **Fallback flow (mandatory):** external/live APIs -> Supabase `api_cache` -> local mock GeoJSON (never blank/error-only map).
- **Tenant routing:** subdomain-based (`[tenant-slug].capegis.com`) resolved via Next.js middleware to tenant context.

## Key repository conventions
- **Scope lock:** Geographic scope is City of Cape Town + Western Cape only.
- **Map library lock:** Do not introduce Leaflet, OpenLayers, or Mapbox GL JS.
- **Data badge is mandatory:** every data display shows `[SOURCE_NAME · YEAR · LIVE|CACHED|MOCK]` visibly.
- **Three-tier fallback is mandatory:** `LIVE -> CACHED -> MOCK` for all external-data components.
- **Tenant isolation is dual-layer:** RLS on every tenant table plus app-layer tenant enforcement.
- **Canonical RLS pattern:** use `current_setting('app.current_tenant', TRUE)` (and role checks where required).
- **RBAC roles (exact hierarchy):** `GUEST -> VIEWER -> ANALYST -> POWER_USER -> TENANT_ADMIN -> PLATFORM_ADMIN`.
- **CRS rules:** store spatial data in `EPSG:4326`, render in `EPSG:3857`; no implicit CRS mixing.
- **Attribution rule:** map UI must display `© CARTO | © OpenStreetMap contributors`.
- **POPIA rule:** any file handling personal information includes the required POPIA annotation block.
- **Data source rule:** do not use Lightstone; approved valuation source is CoCT GV Roll 2022.
- **File size rule:** source files should stay <= 300 lines (planning docs/migrations excluded).
- **Secrets rule:** no hardcoded credentials; use environment variables only.
- **Deviation protocol:** if a change conflicts with `CLAUDE.md`, log it in `docs/PLAN_DEVIATIONS.md` before proceeding.

## Database and migration conventions
- Supabase migrations live in `supabase/migrations/`.
- New tables must enable and force RLS.
- Spatial columns use PostGIS geometries in SRID 4326 with GiST indexes.
- Migration naming convention: `YYYYMMDDHHMMSS_description.sql`.
