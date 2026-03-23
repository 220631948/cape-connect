# Tech Stack

## Frontend

| Concern | Library | Notes |
|---------|---------|-------|
| Framework | Next.js 16 (App Router, RSC) | Vercel-hosted |
| UI | React 19 | Server + Client Components |
| Mapping | MapLibre GL JS 5 | NOT Leaflet, NOT Mapbox GL JS |
| 3D | CesiumJS 1.139 | 3D Tiles, terrain |
| State | Zustand 5 | Client stores only |
| Styling | Tailwind CSS 4 | Dark mode default, near-black backgrounds, crayon accents |
| Charts | Recharts 3 | Dashboard widgets |
| PWA | Serwist 9 | Tile caching zoom 8–12 |
| Offline storage | Dexie.js 4 | IndexedDB |
| Offline tiles | PMTiles 4 | Vector tiles from Supabase Storage |
| Spatial (client) | Turf.js 7 | Use for < 10k features; PostGIS above that |
| PDF export | jsPDF 4 + jsPDF-autotable 5 | |
| Analytics | DuckDB WASM + Apache Arrow | In-browser raster/tabular analysis |

## Backend & Data

| Concern | Technology |
|---------|-----------|
| Database | Supabase (PostgreSQL 15 + PostGIS 3.5) |
| Auth | Supabase Auth (GoTrue) — email/password + Google OAuth |
| Tile server | Martin (Rust MVT, Docker on DigitalOcean Droplet) |
| Object storage | Supabase Storage |
| Error tracking | Sentry (optional — gracefully absent if DSN missing) |

## Languages

- TypeScript (frontend, API routes)
- SQL (migrations, RLS policies)
- Python 3.11+ (backend analysis services — hexagonal architecture)

## Package Manager

`npm` — use `npm ci` for reproducible installs.

## Common Commands

```bash
# Development
npm run dev          # Next.js dev server (localhost:3000)
npm run build        # Production build
npm start            # Start production server

# Quality
npm run lint         # ESLint (eslint-config-next)
npm run typecheck    # tsc --noEmit

# Testing
npm test             # Vitest unit tests (single run)
npm run test:watch   # Vitest watch mode
npm run test:e2e     # Playwright E2E tests

# Local services
docker compose up -d   # PostGIS, Martin, LocalStack
```

## Testing

- Unit: Vitest 4 with jsdom, Testing Library
- E2E: Playwright 1 (Lighthouse, axe-core)
- Mock data: `public/mock/*.geojson` — always present for three-tier fallback
- MapLibre: stub with `vi.mock` in unit tests

## CI/CD

GitHub Actions — `ci.yml`, `spatial-validation.yml`. Migrations verified against PostGIS container in CI.

## Key Config Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Sentry + Serwist wrappers, CSP + security headers |
| `tsconfig.json` | Strict off, `@/*` → `src/*` path alias |
| `vitest.config.ts` | jsdom environment, setup file |
| `docker-compose.yml` | Local PostGIS, Martin, LocalStack |
| `.env.example` | All required/optional env vars documented |

## Environment Variables

| Variable | Required | Absent behaviour |
|----------|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | YES | App fails to start |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | YES | App fails to start |
| `SUPABASE_SERVICE_ROLE_KEY` | YES (server) | Server actions fail |
| `NEXT_PUBLIC_GOOGLE_STREET_VIEW_KEY` | NO | Street View hidden |
| `MAPBOX_TOKEN` | NO | Satellite toggle hidden |
| `NEXT_PUBLIC_SENTRY_DSN` | NO | Error tracking disabled |
| `MARTIN_URL` | NO | Tiles fall back to Supabase |
