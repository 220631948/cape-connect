## Current Status: M17_PREP (March 2026)

**CRITICAL BLOCKER:** **WU-1** — source consolidation from `.claude/worktrees/` to repo root `src/` is incomplete. `npm run build` is currently failing in the root. Consolidation plan is available in `docs/migration/WU1_CONSOLIDATION_PLAN.md`.

---

# CapeTown GIS Hub (capegis)

CapeTown GIS Hub is a multi-tenant, white-label Progressive Web App (PWA) for geospatial intelligence, focusing on the City of Cape Town and the Western Cape Province.

## Features

- **Multi-tenant Isolation**: Strict data segregation using PostgreSQL Row Level Security (RLS) and application-layer tenant enforcement via subdomain routing.
- **2D/3D Hybrid Mapping**: High-performance vector rendering using MapLibre GL JS (2D) and photorealistic 3D visualization using CesiumJS with camera synchronization.
- **Resilient Data Architecture**: Mandatory three-tier fallback: `LIVE` (external API) → `CACHED` (Supabase `api_cache`) → `MOCK` (local GeoJSON).
- **Offline-First PWA**: Reliable offline capabilities using Serwist (Service Workers), Dexie.js (IndexedDB), and PMTiles for offline vector tile storage.
- **MCP-First Architecture**: Extensive use of the Model Context Protocol (MCP) for complex spatial analysis, tile management, and GEE satellite processing.
- **Geospatial Intelligence**: Integrated City of Cape Town zoning overlays, property valuations (~830k records), and real-time flight tracking via OpenSky Network.

## Requirements

- **Node.js**: v20 or later
- **npm**: v10 or later
- **Docker & Docker Compose**: For local PostGIS (PostgreSQL 17), Martin tile server, and LocalStack
- **Supabase Account**: For database, authentication, and RLS management

## Setup & Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd capegis
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy the example environment file and fill in the required values:

   ```bash
   cp .env.example .env.local
   ```

   _Note: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are provided._

4. **Initialize Git Hooks**
   ```bash
   ./scripts/install-hooks.sh
   ```

## Running the Project

1. **Start local infrastructure**
   Spin up PostGIS (with PostGIS 3.5), the Martin tile server, and LocalStack:

   ```bash
   docker compose up -d
   ```

2. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser.

3. **Production Build**
   ```bash
   npm run build
   npm run start
   ```

## Environment Variables

Key variables required for the application. See `.env.example` for the full list.

| Variable                        | Description                                                      | Required |
| :------------------------------ | :--------------------------------------------------------------- | :------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL                                        | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key                                           | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key (server-side only)                     | Yes      |
| `MARTIN_URL`                    | URL of the Martin tile server (default: `http://localhost:3005`) | Yes      |
| `DATABASE_URL`                  | PostgreSQL connection string                                     | Yes      |
| `MAPBOX_TOKEN`                  | Mapbox token for satellite imagery                               | Optional |
| `CESIUM_ION_TOKEN`              | Cesium Ion token for 3D tiles and terrain                        | Optional |
| `OPENSKY_USERNAME/PASSWORD`     | Credentials for OpenSky Network API                              | Optional |

## Project Structure

```text
capegis/
├── src/
│   ├── app/           # Next.js App Router (pages, layouts, and PWA worker)
│   ├── components/    # React components (UI, Map, Dashboard, Auth)
│   ├── hooks/         # Custom React hooks (Map, Tenant, Auth)
│   ├── lib/           # Core logic (Supabase client, Flight/GIS transformers)
│   ├── types/         # TypeScript type definitions (Spatial, Tenant, RBAC)
│   └── __tests__/     # Unit and integration tests
├── public/            # Static assets and local GeoJSON mock data
├── supabase/          # Database migrations, seed data, and RLS policies
├── docs/              # Master documentation (ADRs, Specs, Index)
├── scripts/           # DevOps, ETL (Python), and data processing scripts
├── docker-compose.yml # Local PostGIS, Martin, and LocalStack definition
└── CLAUDE.md          # Project rules, tech stack, and constraints
```

## Scripts/Commands

| Script      | Command             | Description                                  |
| :---------- | :------------------ | :------------------------------------------- |
| `dev`       | `npm run dev`       | Starts the Next.js development server        |
| `build`     | `npm run build`     | Builds the application for production        |
| `start`     | `npm run start`     | Starts the production server                 |
| `lint`      | `npm run lint`      | Runs ESLint for code quality checks          |
| `test`      | `npm run test`      | Runs unit and integration tests using Vitest |
| `test:e2e`  | `npm run test:e2e`  | Runs end-to-end tests using Playwright       |
| `typecheck` | `npm run typecheck` | Runs TypeScript compiler checks              |

### Domain-Specific Scripts

- `scripts/check-rls.sh`: Verifies RLS policies on Supabase tables.
- `scripts/validate-crs.sh`: Validates Coordinate Reference Systems (EPSG:4326/3857).
- `scripts/import-gv-roll.py`: Python ETL script for importing property valuation data.

## Testing

The project maintains a strict quality gate via Vitest and Playwright.

- **Unit/Integration (Vitest)**:
  ```bash
  npm test
  ```
- **End-to-End (Playwright)**:
  ```bash
  npm run test:e2e
  ```
- **Coverage**:
  Coverage reports are generated during CI and can be viewed locally after running tests.

## Troubleshooting

- **Docker Health Checks**: If Martin fails to start, ensure PostGIS is healthy (`docker ps`). Martin depends on PostGIS being fully ready.
- **Supabase Connectivity**: Ensure `.env.local` contains correct keys. Local development often uses `http://localhost:54321`.
- **CRS Mismatch**: If map features appear in the middle of the ocean, verify the data is in `EPSG:4326` (WGS 84).
- **Z-Index/Layering**: MapLibre layers follow a strict ordering defined in `CLAUDE.md`. Check `src/components/map` for implementation.

## Contributing

Please read `CLAUDE.md` and `docs/INDEX.md` before submitting PRs. All changes must follow the defined architectural patterns (e.g., Three-Tier Fallback).

## License

Proprietary / TBD. (Refer to `package.json` for private repository status).

---

**Note**: This project follows strict geographic scoping (City of Cape Town and Western Cape Province only) and POPIA (Protection of Personal Information Act) compliance rules.
