# PROJECT_ANALYSIS.generated.md

<!-- CONTEXT_RECONSTRUCTION_MODE: Auto-generated from codebase scan -->
<!-- Generated: 2026-03-17 | Agent: Junie | Source: README.md, CLAUDE.md, PLAN.md, package.json, src/ tree -->
<!-- This file replaces the missing docs/research/PROJECT_ANALYSIS.md -->

---

## 1. Project Identity

| Field                   | Value                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Name**                | CapeTown GIS Hub (`capegis`)                                                                                  |
| **Type**                | Progressive Web App (PWA) — Multi-Tenant, White-Label                                                         |
| **Geographic Scope**    | City of Cape Town + Western Cape Province ONLY                                                                |
| **Bounding Box**        | `{ west: 18.0, south: -34.5, east: 19.5, north: -33.0 }`                                                      |
| **Center**              | `{ lng: 18.4241, lat: -33.9249 }` / Zoom: 11                                                                  |
| **Visual Style**        | Dark dashboard, near-black backgrounds, crayon accents                                                        |
| **Current Phase**       | M17_PREP (Advanced Geospatial Analysis)                                                                       |
| **Milestones Complete** | M0–M16 (16/19 milestones done)                                                                                |
| **Critical Blocker**    | WU-1 — source consolidation from `.claude/worktrees/` to repo root `src/` incomplete; `npm run build` failing |

---

## 2. Technology Stack (Verified from package.json + CLAUDE.md)

### Frontend

| Technology        | Version (package.json) | Role                                                 |
| ----------------- | ---------------------- | ---------------------------------------------------- |
| Next.js           | ^15.0.0                | Framework, App Router, React Server Components       |
| React             | ^19.0.0                | UI library                                           |
| MapLibre GL JS    | ^4.0.0                 | Primary 2D map renderer (NOT Leaflet, NOT Mapbox)    |
| CesiumJS          | ^1.139.1               | 3D terrain, extruded buildings, flight visualization |
| Zustand           | ^5.0.0                 | Client state management                              |
| Tailwind CSS      | ^4.0.0                 | Styling (dark mode default)                          |
| Recharts          | ^2.0.0                 | Analytics charts                                     |
| Serwist           | ^9.0.0                 | PWA service worker                                   |
| Dexie.js          | ^4.0.0                 | IndexedDB offline storage                            |
| PMTiles           | ^3.0.0                 | Offline vector tile format                           |
| Turf.js           | ^7.0.0                 | Client-side spatial operations                       |
| maplibre-gl-draw  | ^1.6.9                 | Interactive polygon drawing                          |
| jsPDF + autotable | ^4.2.0 / ^5.0.7        | PDF export                                           |

### Backend & Data

| Technology                             | Version       | Role                                           |
| -------------------------------------- | ------------- | ---------------------------------------------- |
| Supabase (PostgreSQL 15 + PostGIS 3.x) | Managed       | Primary database, auth, RLS, storage           |
| DuckDB-WASM                            | ^1.28.0       | Client-side analytics (GeoParquet, FlatGeobuf) |
| Apache Arrow                           | ^18.0.0       | Columnar data interchange for DuckDB           |
| Martin                                 | Docker (Rust) | MVT tile server                                |
| Supabase Auth (GoTrue)                 | Managed       | Email/password + Google OAuth                  |

### Infrastructure

| Technology           | Role                                        |
| -------------------- | ------------------------------------------- |
| Vercel               | Frontend hosting + API routes               |
| DigitalOcean Droplet | Martin tile server (Docker)                 |
| Docker Compose       | Local dev (PostGIS + Martin)                |
| GitHub Actions       | CI/CD                                       |
| Sentry               | Error tracking (optional, graceful absence) |

### Testing

| Technology      | Version         | Role                   |
| --------------- | --------------- | ---------------------- |
| Vitest          | ^3.0.0          | Unit/integration tests |
| Playwright      | ^1.0.0          | E2E tests              |
| Testing Library | ^16.3.2 (React) | Component testing      |

### Spatial Reference System

- **Storage:** EPSG:4326 (WGS 84)
- **Rendering:** EPSG:3857 (Web Mercator) via MapLibre
- **Rule:** Never mix CRS without explicit reprojection

---

## 3. Domain Goals (What This Application Achieves Spatially)

1. **Multi-Tenant Geospatial Intelligence** — White-label PWA serving multiple tenants (municipalities, departments) with strict data isolation via RLS + application-layer tenant enforcement
2. **Property Intelligence** — ~830k City of Cape Town property valuations (GV Roll 2022) with spatial search, filtering, and analytics
3. **Zoning Visualization** — IZS zoning code overlays with data-driven WCAG-compliant styling
4. **Real-Time Flight Tracking** — OpenSky Network ADS-B data rendered on 2D (MapLibre) and 3D (CesiumJS) with historical track replay
5. **2D/3D Hybrid Mapping** — Synchronized MapLibre (2D) and CesiumJS (3D) with mode switching
6. **Offline-First PWA** — Three-tier fallback (LIVE → CACHED → MOCK) with Serwist service workers, Dexie.js IndexedDB, PMTiles offline tiles
7. **Spatial Analysis** — User-drawn polygon intersections with PostGIS RPCs, area analysis (property count, total value, zoning mix)
8. **Youth Digital Empowerment** — Planned community resource layers (WiFi hotspots, libraries, safe-walk corridors)
9. **Advanced Geospatial AI** — Planned satellite imagery processing (NDVI/NDWI), MCP-based spatial analysis pipelines

---

## 4. Current Gaps (What the Stack Cannot Do Yet)

| Gap                                 | Impact                                                                                        | Planned Milestone          |
| ----------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------- |
| **MCP server pipeline not built**   | No PostGIS pipeline, Martin admin, ArcGIS location, GEE analysis, or PMTiles pipeline servers | M17                        |
| **Build is broken (WU-1)**          | `npm run build` fails due to incomplete source consolidation                                  | Blocker for all milestones |
| **No satellite imagery pipeline**   | Cannot process Sentinel-2, generate NDVI/NDWI composites                                      | M17 (GEE analysis)         |
| **No advanced 3D (NeRF/3DGS)**      | No photorealistic urban inspection                                                            | M18                        |
| **No offline full-text search**     | Dexie.js search not implemented for property metadata                                         | M18                        |
| **No CARTO integration**            | Advanced geospatial analytics pending grant approval                                          | M18                        |
| **No community resource layers**    | Youth digital empowerment features not started                                                | M19                        |
| **No automated COG/PMTiles CI**     | Tile generation not in CI/CD pipeline                                                         | Infrastructure gap         |
| **No spatial observability**        | No PostGIS query instrumentation or spatial metrics                                           | Infrastructure gap         |
| **DuckDB-WASM analytics not wired** | Package installed but no analysis routes use it yet                                           | M17+                       |

---

## 5. Data Workflows (How Spatial Data Flows Today)

```
┌─────────────────┐    ┌──────────────┐    ┌────────────────┐
│ External APIs    │───→│ Next.js API  │───→│ Supabase       │
│ (OpenSky, ArcGIS│    │ Routes       │    │ (PostGIS + RLS)│
│  CoCT services) │    │ /api/*       │    │ api_cache table│
└─────────────────┘    └──────┬───────┘    └───────┬────────┘
                              │                     │
                              ▼                     ▼
                       ┌──────────────┐    ┌────────────────┐
                       │ Three-Tier   │    │ Martin MVT     │
                       │ Fallback     │    │ Tile Server    │
                       │ LIVE→CACHE→  │    │ (PostGIS→MVT)  │
                       │ MOCK         │    └───────┬────────┘
                       └──────┬───────┘            │
                              │                     │
                              ▼                     ▼
                       ┌──────────────────────────────────┐
                       │ Client (MapLibre + CesiumJS)     │
                       │ Serwist SW │ Dexie.js │ PMTiles  │
                       │ Zustand state │ Turf.js spatial  │
                       └──────────────────────────────────┘
```

### ETL Pipelines

- **GV Roll 2022**: Python ETL (`scripts/import-gv-roll.py`) → PII stripping → Supabase `valuation_data` table
- **Zoning (IZS)**: ArcGIS REST → api_cache → mock GeoJSON fallback
- **Flight Data**: OpenSky API → rate-limited client → GeoJSON transform → MapLibre/Cesium layers
- **Suburbs**: PostGIS → Martin MVT → MapLibre vector tiles

---

## 6. User Interactions (Spatial Operations Users Perform)

| Operation                         | Implementation                      | Auth Level    |
| --------------------------------- | ----------------------------------- | ------------- |
| Pan/zoom 2D map                   | MapLibre GL JS                      | GUEST+        |
| View zoning overlays              | ZoningLayer + Martin MVT            | GUEST+        |
| View suburb boundaries            | SuburbLayer + Martin MVT            | GUEST+        |
| Switch 2D/3D view                 | SpatialView component               | GUEST+        |
| Search properties (address, ERF)  | SearchOverlay + PostGIS text search | VIEWER+       |
| View property valuations          | ValuationBadge + API route          | VIEWER+       |
| Draw polygon for analysis         | DrawControl + maplibre-gl-draw      | ANALYST+      |
| Run spatial intersection analysis | PostGIS RPC `analyze_area()`        | ANALYST+      |
| Export analysis to PDF            | ExportPanel + jsPDF                 | POWER_USER+   |
| View real-time flights            | FlightLayer + OpenSky API           | VIEWER+       |
| View 3D flights                   | CesiumFlightLayer                   | VIEWER+       |
| Manage users/roles                | UserManagementPanel                 | TENANT_ADMIN+ |
| White-label branding              | TenantContext + tenant_settings     | TENANT_ADMIN+ |
| Share map state via URL           | useUrlState hook                    | GUEST+        |

---

## 7. Known Constraints

| Constraint                   | Details                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| **POPIA Compliance**         | South African data protection law; PII annotation mandatory on all files handling personal data; no PII for guests |
| **Geographic Lock**          | Bounding box enforced: `[18.0, -34.5] → [19.5, -33.0]`; Western Cape only                                          |
| **No Lightstone Data**       | GV Roll 2022 is the sole approved valuation source                                                                 |
| **300-Line File Limit**      | Source files ≤ 300 lines (planning docs/migrations exempt)                                                         |
| **CartoDB Attribution**      | Must display `© CARTO                                                                                              | © OpenStreetMap contributors` |
| **Library Approval**         | Cannot introduce unlisted libraries without human approval                                                         |
| **Sequential Milestones**    | M0–M15 sequential; human confirms each DoD                                                                         |
| **Budget**                   | Implied budget constraints (grant-dependent for CARTO); DigitalOcean Droplet for Martin                            |
| **Performance Ceilings**     | Map load < 3s on 4G; search < 500ms; spatial intersection < 1s for 1000+ parcels; chart render < 300ms             |
| **Max Features Client-Side** | 10,000 GeoJSON features per layer → must use Martin MVT above that                                                 |
| **JWT Lifetime**             | Access: 1h; Refresh: 7d                                                                                            |

---

## 8. Immediate Findings

⚠️ FINDING: **Build is broken** — WU-1 source consolidation blocker means `npm run build` fails. All M17+ work is blocked until resolved.

⚠️ FINDING: **DuckDB-WASM installed but unused** — `@duckdb/duckdb-wasm` ^1.28.0 and `apache-arrow` ^18.0.0 are in dependencies but no API routes or components use them yet. This is a planned M17 integration.

⚠️ FINDING: **Existing research is partially complete** — 10 GIS_SUPERSTACK domain files exist but 4 are skeletal stubs (62-88 lines), needing significant expansion for domains: Spatial Databases, Tile Pipelines, Geospatial AI, and DevOps Infrastructure.

⚠️ FINDING: **GEE quota deadline approaching** — Google Earth Engine tier quotas take effect April 27, 2026 (41 days from now). GEE integration is planned for M17 but budget for commercial tier is uncertain.

⚠️ FINDING: **Claude Agent SDK in production deps** — `@anthropic-ai/claude-agent-sdk` ^0.2.77 is listed as a production dependency, suggesting MCP-first architecture is deeply embedded in the runtime, not just dev tooling.

---

## 9. Codebase Metrics

| Metric                 | Value                                                                      |
| ---------------------- | -------------------------------------------------------------------------- |
| Total TS/TSX files     | 105                                                                        |
| API routes             | 25                                                                         |
| Map layers             | 5 (Zoning, Flights, CesiumFlight, Suburb, Buffer)                          |
| Components directories | map/, analysis/, admin/, auth/, dashboard/, home/, property/, search/, ui/ |
| Hooks                  | useLiveData, useUrlState                                                   |
| Supabase migrations    | Multiple (M1-M16 schema)                                                   |
| Test files             | Vitest unit + Playwright E2E                                               |
| Docker services        | PostGIS 17 + PostGIS 3.5, Martin                                           |

---

_Reconstructed from codebase analysis. No files were modified — this document was generated as a new file per CONTEXT_RECONSTRUCTION_MODE protocol._
