# Tech Stack — CapeTown GIS Hub

> **TL;DR:** Next.js 15 (App Router) + MapLibre GL JS + Supabase (PostgreSQL 15 + PostGIS 3.x) + Martin MVT. Zustand for state, Tailwind for styling, Serwist for PWA, Dexie for offline. Hosted on Vercel + DigitalOcean. No Leaflet, no Mapbox GL JS, no Lightstone.

**Date:** 2026-03-05
**Status:** ACCEPTED — Aligned with CLAUDE.md §2
**Source of truth:** CLAUDE.md §2 (authoritative)

---

## 1. Frontend [VERIFIED]

| Technology | Purpose | Justification |
|------------|---------|---------------|
| **Next.js 15** (App Router) | Framework, SSR, RSC | Server Components for performance, Vercel deployment |
| **React 19** | UI library | Server Components support |
| **TypeScript 5.x** | Type safety | End-to-end type safety across stack |
| **MapLibre GL JS** | WebGL map rendering | Open-source, no fees, MVT support. **NOT Leaflet, NOT Mapbox GL JS** |
| **Zustand** | State management | Lightweight, fast for map + UI state |
| **Tailwind CSS** | Utility-first styling | Dark mode default |
| **Recharts** | Charts & visualization | React-native charting |
| **Serwist** | PWA / service worker | Best-in-class Next.js 15 SW management |
| **Dexie.js** | Offline storage (IndexedDB) | Offline data persistence |
| **PMTiles** | Offline vector tiles | Vector tiles from object storage |
| **Turf.js** | Client-side spatial ops | Geometry calculations in browser |

---

## 2. Backend & Data [VERIFIED]

| Technology | Purpose | Justification |
|------------|---------|---------------|
| **Supabase** (PostgreSQL 15 + PostGIS 3.x) | Database + spatial | Industry-standard spatial storage + analysis |
| **Supabase Auth** (GoTrue) | Authentication | Email/password + Google OAuth, RLS integration |
| **Martin** (Rust MVT) | Tile server | Fast, lightweight MVT from PostGIS. Docker on DO Droplet |
| **Supabase Storage** | Object storage | PMTiles, uploaded assets |

---

## 3. Infrastructure [VERIFIED]

| Technology | Purpose | Justification |
|------------|---------|---------------|
| **Vercel** | Frontend hosting | Edge functions, API routes, edge middleware |
| **DigitalOcean Droplet** | Martin tile server | Docker container hosting |
| **Docker Compose** | Local dev | PostGIS + Martin for local development |
| **GitHub Actions** | CI/CD | Automated build, test, deploy |
| **Sentry** | Error tracking | Optional — gracefully absent if DSN not set |

---

## 3a. Python Geospatial Tooling Status [VERIFIED]

Python geospatial libraries are currently **research/ETL-path only** and are **not required** for core local bootstrap or runtime delivery.

| Tooling | Repository status | Current stance |
|---|---|---|
| GeoPandas / Rasterio / Shapely / pyproj / Fiona-GDAL | Documented in research and ETL notes; no first-party runtime module adoption in this repo baseline | Optional sidecar path only; defer operational adoption until boundary ADR is approved |

Citation: this status aligns with the swarm Python tooling audit and architecture synthesis findings. *(Source: `docs/research/swarm-python-geospatial-tooling.md`, `docs/architecture/swarm-architecture-insights-cycle1.md`)*

---

## 4. Spatial Reference System [VERIFIED]

- **Storage:** EPSG:4326 (WGS 84)
- **Rendering:** EPSG:3857 (Web Mercator) via MapLibre
- Never mix CRS without explicit reprojection

---

## 5. Performance Constraints

- Target 3–5 Mbps bandwidth (SA mobile networks)
- Zoom-gating for dense parcel layers (z14+)
- Max 10,000 GeoJSON features per client layer → switch to Martin MVT
- Three-tier fallback (`LIVE → CACHED → MOCK`) mandatory for all data services [VERIFIED]

---

## 6. Prohibited Technologies

| Technology | Reason | Reference |
|------------|--------|-----------|
| Leaflet / esri-leaflet | DOM-based rendering, poor large dataset support | CLAUDE.md §2 |
| Mapbox GL JS / @mapbox/mapbox-gl-draw | Proprietary, per-load fees; draw plugin peer-depends on it | CLAUDE.md §2 |
| OpenLayers | Not approved | CLAUDE.md §2 |
| Lightstone data | Not approved valuation source | CLAUDE.md Rule 8 |
| LocalStack | Not in infrastructure plan; Supabase Storage serves S3-compatible ops | CLAUDE.md §2 |

---

## 7. ArcGIS & QGIS Integration [VERIFIED — approved libraries only]

| Technology | Purpose | Notes |
|---|---|---|
| **`@esri/arcgis-rest-js`** | ArcGIS REST Feature Service client | Framework-agnostic REST client. Queries CoCT ArcGIS services without any Leaflet/Mapbox dependency. **esri-leaflet is BANNED**. |
| **`arcgis-python-api`** | ETL / backend analysis only | Python sidecar path for spatial processing; never imported in browser bundle |
| **`qgis-js`** | QGIS WASM module for browser | Enables reading QGIS project files (.qgz) and running processing algorithms client-side; no mapping library conflict |

---

## 8. Drawing & Measurement Tools [VERIFIED]

| Technology | Purpose | Notes |
|---|---|---|
| **`maplibre-gl-draw`** | Interactive drawing (polygons, lines, points) | MapLibre-native community port of mapbox-gl-draw. **@mapbox/mapbox-gl-draw is BANNED** (peer-depends on Mapbox GL JS). |

---

## 9. MCP Servers [VERIFIED — in omg-config.json / .github/copilot/]

| MCP Server | Purpose | Auth |
|---|---|---|
| **context7** | Up-to-date library documentation context for agents | None required |
| **exa** | Semantic web search for GIS research and urban data | API key (env var) |
| **playwright** | Headless browser testing and UI validation | None |

*Planned MCPs (not yet configured):* `cesium-ion`, `opensky`, `nerfstudio`

---

## 10. Copilot Custom Skills [VERIFIED — in .github/copilot/skills/]

17 domain-specific workflow skills:

| Skill | Purpose |
|---|---|
| `spatial_validation` | Validates geometries within Cape Town BBox and CRS |
| `arcgis_qgis_uploader` | Reprojection and parsing of .shp / .gpkg / .qgz |
| `three_tier_fallback` | Enforces LIVE→CACHED→MOCK pattern |
| `popia_spatial_audit` | PII/location data handling audit |
| `cesium_3d_tiles` | CesiumJS 3D tile integration workflow |
| `opensky_flight_tracking` | OpenSky Network ADS-B data integration |
| `nerf_3dgs_pipeline` | NeRF and 3D Gaussian Splatting pipeline |
| `4dgs_event_replay` | Temporal 4DGS point cloud replay |
| `data_source_badge` | Mandatory `[SOURCE · YEAR · LIVE\|CACHED\|MOCK]` badge |
| `mock_to_live_validation` | MOCK → LIVE data layer promotion checklist |
| `rls_audit` | Row-Level Security audit for PostGIS tables |
| `assumption_verification` | Pre-milestone dependency and assumption verification |
| `tile_optimization` | PMTiles/MVT optimization for mobile PWA |
| `sql_optimization` | PostGIS query tuning and index guidance |
| `documentation_first` | Documentation-first development workflow |
| `spatialintelligence_inspiration` | spatialintelligence.ai WorldView dashboard patterns |
| `popia_compliance` | POPIA compliance checklist for South African data |

---

## 11. Phase 2 Additions [ASSUMPTION — UNVERIFIED]

These technologies are planned for Phase 2 (M5+) and require `docs/PLAN_DEVIATIONS.md` entries before implementation:

| Technology | Purpose | Milestone |
|------------|---------|-----------|
| CesiumJS | 3D tile rendering, globe view (DEV-002 filed) | M5 |
| Google Photorealistic 3D Tiles | Immersive city visualization | M5 |
| OpenSky Network API | Real-time flight tracking (ADS-B) | M7 |
| AIS Maritime API | Vessel position tracking | M8 |
| NeRF / 3DGS / 4DGS | Spatial AI scene reconstruction + temporal replay | M8 |

---

## 12. Agent Fleet [VERIFIED — AGENTS.md is authoritative]

The canonical fleet has **10 agents** (not 15 — older drafts referenced 15 but were superseded by the March 2026 audit):

| Agent | Location |
|---|---|
| `orchestrator` | `.github/agents/` |
| `infra-agent` | `.github/agents/` |
| `map-agent` | `.github/copilot/agents/` |
| `data-agent` | `.github/copilot/agents/` |
| `spatial-agent` | `.github/copilot/agents/` |
| `db-agent` | `.github/copilot/agents/` |
| `cesium-agent` | `.github/copilot/agents/` |
| `immersive-reconstruction-agent` | `.github/copilot/agents/` |
| `flight-tracking-agent` | `.github/copilot/agents/` |
| `test-agent` | `.github/copilot/agents/` |

---

*v4.0 · 2026-03-06 · Added ArcGIS/QGIS integration, drawing tools, MCP servers, Copilot skills, Phase 2 AI stack, agent fleet summary. Documented esri-leaflet and mapbox-gl-draw rejections (DEV-003, DEV-004).*
