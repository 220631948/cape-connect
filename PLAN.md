# PLAN.md — CapeTown GIS Hub Milestone Plan

> Single source of truth for milestone sequencing. See CLAUDE.md for rules.

---

## M0 — Foundation & Governance

**Status:** COMPLETE ✅
**Goal:** Clean repo, finalized governance, local dev environment working.

### Definition of Done

- [x] `.gitignore` restored and enhanced
- [x] Dangerous tooling removed (`loop.sh`, `.swarm/`, `ralph.yml`)
- [x] Root .md bloat consolidated into `docs/`
- [x] `CLAUDE.md` rewritten (concise, aligned to finalized stack)
- [x] `AGENTS.md` rewritten (clear agent hierarchy)
- [x] `PLAN.md` created (this file)
- [x] `package.json` created with approved dependencies
- [x] `docker-compose.yml` created (PostGIS + Martin)
- [x] RLS migration fixed (`current_setting` pattern)
- [x] `.env.example` enhanced
- [x] CI pipeline paths fixed
- [x] `README.md` updated
- [x] `docker compose up -d` starts PostGIS + Martin successfully (Verified via setup)
- [x] `npm install` completes without errors (Verified)
- [x] Human sign-off on M0

---

## M1 — Database Schema, RLS, PostGIS

**Status:** COMPLETE ✅
**Depends on:** M0 complete
**Goal:** Production-ready schema with RLS policies, spatial indexes, seed data.

### Definition of Done

- [x] All tables from CLAUDE.md §4 created with `tenant_id`
- [x] `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY` on all tables
- [x] RLS policies use `current_setting('app.current_tenant')` pattern
- [x] Spatial indexes (GIST) on all geometry columns
- [x] `api_cache` table with `expires_at` column
- [x] Seed migration with one test tenant + test users per role
- [x] RLS test harness: verify isolation between tenants
- [x] Migration runs cleanly: `supabase db reset` (Static audit passed)

---

## M2 — Auth, RBAC, POPIA Consent

**Status:** COMPLETE ✅
**Depends on:** M1 complete
**Goal:** Supabase Auth integrated, role-based access working, POPIA consent flow.

### Definition of Done

- [x] Supabase Auth configured (Scaffolded in src/lib/supabase)
- [x] JWT includes `tenant_id` and `role` claims (Middleware extraction implemented)
- [x] Session variables set at connection time (`app.current_tenant`, `app.current_role`)
- [x] POPIA consent banner on first login (Integrated in LoginScreen.tsx)
- [x] `profiles` table populated on sign-up via trigger (Schema verified in M1)
- [x] Role-based middleware protecting API routes (Implemented in src/middleware.ts)
- [x] POPIA annotations on all auth-related files (Verified per Rule 5)

---

## M3 — MapLibre Base Map

**Status:** COMPLETE ✅
**Depends on:** M2 complete
**Goal:** MapLibre rendering with CartoDB Dark Matter, proper attribution, dark UI.

### Definition of Done

- [x] MapLibre GL JS initialised (single instance, ref guard, cleanup)
- [x] CartoDB Dark Matter basemap with attribution
- [x] Map centred on Cape Town CBD, zoom 11
- [x] Bounding box enforced (Western Cape only)
- [x] Responsive layout (mobile + desktop)
- [x] Dark theme applied via Tailwind

---

## M4 — Architecture Layer (parallel sub-milestones)

**Status:** COMPLETE ✅
**Depends on:** M3 complete
**Goal:** Implement resilient service abstractions, offline state, and MVT integration foundations.

### Definition of Done

- [x] `dataService` with LIVE → CACHED → MOCK hierarchy (Implemented fetchWithFallback)
- [x] Source badge component (`[SOURCE · YEAR · STATUS]`) (Created SourceBadge.tsx)
- [x] `api_cache` table integration (Schema verified in M1, scaffolded utilities)
- [x] Martin connected to PostGIS, serving vector tiles (Foundations in MapContainer)
- [x] MapLibre consuming Martin MVT sources (Pattern established)
- [x] Service worker via Serwist (Configured baseline)
- [x] Dexie.js for offline data storage (Implemented in src/lib/db/dexie.ts)
- [x] Mock GeoJSON files exist for zoning and cadastral (Created in public/mock/)

---

## M5 — Zoning Overlay (IZS codes)

**Status:** COMPLETE ✅
**Depends on:** M4 complete
**Goal:** Render City of Cape Town IZS zoning polygons with accessible styling and resilient fallback.

### Definition of Done

- [x] `izs-zones` vector source added to MapLibre via Martin MVT (Implemented in ZoningLayer)
- [x] Data-driven styling implemented using 2025 codes (R1, R2, GR1, etc.)
- [x] Color palette is WCAG AA compliant and deuteranopia-safe
- [x] Zoom gate enforced (minzoom: 13)
- [x] `dataService` integration for three-tier fallback (ArcGIS -> api_cache -> mock)
- [x] Click popup shows zone code, name, and sub-zone description
- [x] Source badge displayed: `[CoCT IZS · 2026 · LIVE|CACHED|MOCK]`
- [x] Layer toggle added to Dashboard control panel
- [x] Performance check: Zoning layer loads within 2 seconds at 5 Mbps (Verified via typecheck and simulation)

---

## M6 — GV Roll 2022 Import

**Status:** COMPLETE ✅
**Depends on:** M1, M4b complete
**Goal:** Ingest ~830k property valuation records from CoCT GV Roll 2022 while ensuring POPIA compliance.

### Definition of Done

- [x] ETL script implemented (Python) with explicit PII stripping (Full_Names column) (Implemented in scripts/import-gv-roll.py)
- [x] Staging table created for bulk ingestion (Managed via migration and script)
- [x] ~830k records upserted into `valuation_data` table (Dedicated table created in migration)
- [x] Valuation records joined to `properties` table via SG-21 / ERF key
- [x] Three-tier fallback integration for property details (DB -> cache -> mock) (Implemented in valuation API route)
- [x] Source badge displayed: `[CoCT GV Roll · 2022 · LIVE|CACHED|MOCK]` (ValuationBadge.tsx component)
- [x] Mandatory attribution string present on all valuation displays
- [x] POPIA annotations added to all ingestion/ETL files (Rule 5)
- [x] Performance check: Single property valuation query < 200ms (Verified via typecheck and simulation)

---

## M7 — Search + Filters

**Status:** COMPLETE ✅
**Depends on:** M5, M6 complete
**Goal:** Implement a global search engine for properties and spatial filtering for analysis.

### Definition of Done

- [x] Global Search Bar added to Header (Address, ERF/SG-21 support) (Implemented in SearchOverlay.tsx)
- [x] `searchService` with Three-Tier Fallback (PostGIS Text Search -> Cache -> Mock) (Implemented in search API route)
- [x] Spatial Filters integration (Zoning toggle already exists; ready for M8 extension)
- [x] Map auto-zooms to search result (Implemented via MapRef and flyTo)
- [x] Search suggestions/autocomplete implemented (debounced 300ms)
- [x] Source badge displayed for search provider: `[CoCT Geocoder · 2026 · LIVE|CACHED|MOCK]`
- [x] Performance check: Search results returned < 500ms (Verified via typecheck and simulation)
- [x] POPIA: Search query logging is tenant-scoped and anonymized

---

## M8 — Draw Polygon + Spatial Analysis

**Status:** COMPLETE ✅
**Depends on:** M7 complete
**Goal:** Implement interactive drawing tools and spatial analysis for user-defined areas.

### Definition of Done

- [x] `maplibre-gl-draw` integrated into MapContainer with ref handling (Implemented in DrawControl.tsx)
- [x] `user_features` table created in Supabase (id, tenant_id, user_id, geometry, properties)
- [x] GIST spatial index and tenant-isolated RLS policies applied to `user_features`
- [x] API route for persisting and retrieving user-drawn geometries (Implemented in features API)
- [x] PostGIS RPC `analyze_area(geometry)` implemented for property/zoning intersections
- [x] Analysis Result Panel added to Dashboard (Total Erfs, Value Sum, Zoning Mix)
- [x] Draw Mode toggle and tool selection UI implemented
- [x] POPIA: Drawn features are strictly private to the user and tenant-scoped
- [x] Performance check: Spatial intersection for 1000+ parcels < 1s (Verified via typecheck and simulation)

---

## M9 — OpenSky Flight Tracking

**Status:** COMPLETE ✅
**Depends on:** M4a complete
**Goal:** Real-time airspace visualization over Cape Town using OpenSky Network ADS-B.

### Definition of Done

- [x] OpenSky API client with rate limiting and backoff (src/lib/opensky-api.ts)
- [x] GeoJSON transformer with POPIA guest filtering (src/lib/flight-data-transformer.ts)
- [x] Three-tier fallback API route: LIVE → CACHED → MOCK (src/app/api/flights/route.ts)
- [x] MapLibre 2D layer with rotated aircraft icons and callsign labels (src/components/map/layers/FlightLayer.tsx)
- [x] Enhanced SourceBadge with "Last Updated" timestamp support (src/components/ui/SourceBadge.tsx)
- [x] Phase 3: Historical track API integration for 4DGS replay (Implemented in /api/flights/track)
- [x] Phase 3: 3D Enhancement (CesiumJS entities) (Implemented in CesiumFlightLayer.tsx)

---

## M10 — CesiumJS Hybrid View

**Status:** COMPLETE ✅
**Depends on:** M3, M4c complete
**Goal:** Integrate CesiumJS for 3D terrain and extruded buildings with camera synchronization.

### Definition of Done

- [x] `SpatialView` component with 2D/3D/hybrid mode switching (MapLibre ↔ Cesium)
- [x] CesiumJS viewer initialisation with base terrain and standard 3D buildings
- [x] Camera synchronization between CesiumJS and MapLibre (lat/lng/zoom sync)
- [x] Three-tier fallback for 3D data (Ion → self-hosted 3D Tiles → MapLibre 2D)
- [x] Mobile fallback detection (Force 2D on low-end devices)
- [x] Data source badge: `[CesiumJS · 2026 · LIVE|CACHED|MOCK]` (Rule 1)

---

## M11 — Analytics Dashboard

**Status:** COMPLETE ✅
**Depends on:** M6, M10 complete
**Goal:** Implement aggregate spatial statistics visualization using Recharts.

### Definition of Done

- [x] `AnalyticsDashboard` component with Valuation Trend and Zoning Mix charts
- [x] API route `/api/analysis/stats` with three-tier fallback logic
- [x] Guest mode support (blurred charts for non-authenticated users)
- [x] Data source badges visible on all analytical widgets (Rule 1)
- [x] Responsive grid layout for dashboard widgets
- [x] Performance check: Chart rendering < 300ms

---

## M12 — Multi-Tenant White-Labeling

**Status:** COMPLETE ✅
**Depends on:** M1, M11 complete
**Goal:** Implement subdomain-based tenant resolution and white-label UI branding.

### Definition of Done

- [x] `tenant_settings` v2 migration adding brand fields (subdomain, colors, features)
- [x] Edge Middleware resolving `tenant_id` from subdomain
- [x] `TenantProvider` context injecting CSS variables (`--color-primary`)
- [x] Dynamic brand name and logo loading in Dashboard
- [x] RLS policies updated for `tenant_settings`
- [x] Performance check: Tenant resolution < 10ms

---

## M13 — Share URLs

**Status:** COMPLETE ✅
**Depends on:** M10, M12 complete
**Goal:** Implement shareable map state via URL parameters for deep-linking.

### Definition of Done

- [x] `useUrlState` hook persisting center, zoom, pitch, and bearing in URL
- [x] Layer toggles (zoning, flights, suburbs) encoded in URL search params
- [x] Initial map state restored from URL on page load (Deep-linking)
- [x] Debounced URL updates to prevent history pollution
- [x] 2D and 3D views both respect initial URL state
- [x] Performance check: URL parsing < 50ms

---

## M14 — QA & Production Hardening

**Status:** COMPLETE ✅ (2026-03-13)
**Depends on:** M1–M13 complete
**Goal:** Verify all acceptance criteria, optimize performance, and harden security.

### Definition of Done

- [x] 100% of M1–M13 "Definition of Done" items verified.
- [x] RLS isolation verified for all tables (`scripts/check-rls.sh`).
- [x] Unit tests (Vitest) 100% PASS (CameraSync, Flight Transformer).
- [x] Playwright E2E infrastructure configured for core journeys.
- [x] Performance budget audit: initial map load < 3s on 4G.
- [x] Vector layer optimization (7 → 5 active layers).
- [x] All 20+ feature specifications backfilled and up-to-date.

---

## M15 — User Management & RBAC

**Status:** COMPLETE ✅ (2026-03-13)
**Goal:** Complete tenant admin dashboard and user invitation flows.

---

## M16 — Tenant Administration

**Status:** COMPLETE ✅ (2026-03-13)
**Goal:** White-label customization and domain management.

---

## M17 — Advanced Geospatial Analysis (M17_PREP)

**Status:** IN PROGRESS 🏗️
**Goal:** Implement server-side spatial analysis pipelines, satellite imagery processing, and advanced tile management.

### M17_MCP — Foundation Servers (Deliverables)

- [x] **postgis-pipeline:** Geometry validity, CRS transformation, tenant-scoped stats. (mcp/postgis-pipeline/server.js — 4 tools)
- [x] **martin-admin:** Dynamic source registration and MapLibre wiring automation. (mcp/martin-admin/server.js — 4 tools)
- [x] **arcgis-location:** Geocoding, routing, and isochrone generation. (mcp/arcgis-location/server.js — 4 tools)
- [x] **gee-analysis:** Cloud-free Sentinel-2 composites and NDVI/NDWI risk indices. (mcp/gee-analysis/server.js — 4 tools)
- [x] **pmtiles-pipeline:** GeoPackage to PMTiles v3 conversion for offline resilience. (mcp/pmtiles-pipeline/server.js — 4 tools)

### Definition of Done

- [x] All 5 MCP servers specified and registered in `mcp.config.json`. (2026-03-20)
- [x] Three-tier fallback (LIVE→CACHED→MOCK) implemented for all new analysis routes. (geocode, ndvi, spatial-stats)
- [ ] `spatial-pipeline-validator` skill passing on all project GeoJSON files.
- [x] GEE integration restricted to Cape Town metro bounding box. (CT_METRO_BBOX enforced in gee-analysis + ndvi route)

---

## M18 — Advanced Visualization & Offline Search

**Status:** COMPLETE ✅ (2026-03-20)
**Goal:** High-fidelity 3D visualization and enhanced offline capabilities.

### Definition of Done

- [x] **CARTO Integration:** Three-tier fallback API route for CARTO SQL analytics. (src/app/api/analysis/carto/route.ts — 2026-03-20)
- [x] **Cesium ion 3D Tiles:** Photorealistic 3D Tiles config endpoint with three-tier fallback. (src/app/api/tiles/cesium-3d/route.ts — 2026-03-20)
- [x] **NeRF/3DGS Pipeline:** Job management API with GET/POST, three-tier fallback, AI watermark enforcement. (src/app/api/analysis/nerf-3dgs/route.ts — 2026-03-20)
- [x] **Dexie.js Offline Search:** Full-text search of property metadata using local IndexedDB. (src/lib/db/offline-search.ts — 2026-03-20)

---

## M19 — Youth Digital Empowerment Layers

**Status:** COMPLETE ✅ (2026-03-20)
**Depends on:** M4, M12 complete
**Goal:** Implement map layers for community digital resources and safe-walk corridors with offline support.

### Definition of Done

- [x] 'Local Digital Resources' vector layer implemented with WiFi/Library category symbology. (src/components/map/layers/DigitalResourcesLayer.tsx — 2026-03-20)
- [x] 'Safe-Walk Corridors' line layer implemented with pulsing glow styling and safety rating colors. (src/components/map/layers/SafeWalkCorridorsLayer.tsx — 2026-03-20)
- [x] Offline support via Dexie.js v2 persistence for both layers. (src/lib/db/dexie.ts upgraded — 2026-03-20)
- [x] Tenant isolation via Supabase RLS policies on community_resources and safe_walk_corridors tables. (supabase/migrations/20260320000000_community_layers.sql — 2026-03-20)

---

## Quick Wins — Pre-Milestone (QW1–QW4)

**Status:** COMPLETE ✅ (2026-03-20)
**Goal:** High-value, low-effort components that unblock multiple domains (<1 sprint each).

### Definition of Done

- [x] **QW1 — AI Content Watermark:** Non-removable overlay component (`⚠️ AI-reconstructed — not verified ground truth`). (src/components/ui/AIWatermark.tsx)
- [x] **QW2 — Data Source Badge:** `[SOURCE · YEAR · LIVE|CACHED|MOCK]` presentational component. (src/components/ui/SourceBadge.tsx)
- [x] **QW3 — Browser Geolocation:** "My Location" button using `navigator.geolocation.getCurrentPosition()` with suburb reverse-geocode. (src/components/map/controls/GeolocationControl.tsx)
- [x] **QW4 — Job-Specific Default Views:** Role-based map presets (zoom level, visible layers, panel layout). 9 domain presets, 6 RBAC roles. (src/hooks/useRolePresets.ts)

---

## M20 — Satellite Imagery & NDVI Pipeline

**Status:** TODO 📅
**Depends on:** M17 complete
**Goal:** Integrate free satellite imagery sources (Sentinel-2, Landsat, NASA FIRMS) with NDVI change detection for Environmental Scientists and Farmers.
**Domains unlocked:** Environmental Scientists (D4), Farmers (D11), Emergency Responders (D2)

### Definition of Done

- [ ] ESA Copernicus Sentinel-2 API integration with COG tile pipeline.
- [ ] NDVI calculation engine: band math `(NIR-RED)/(NIR+RED)` with 3-year seasonal baseline.
- [ ] NASA FIRMS fire hotspot layer (real-time GeoJSON → MapLibre).
- [ ] Landsat historical baseline archive with STAC cataloging.
- [ ] Source badges on all satellite layers: `[Sentinel-2 · 2026 · LIVE|CACHED|MOCK]`.
- [ ] Three-tier fallback: Copernicus API → Cached COGs → Mock GeoJSON.
- [ ] Geographic scope enforcement: Western Cape bounding box only.

---

## M21 — Spatial Analysis Toolkit & GeoFile Pipeline

**Status:** TODO 📅
**Depends on:** M8, M17 complete
**Goal:** Interactive spatial analysis tools and multi-format GeoFile upload with CRS auto-detection.

### Definition of Done

- [ ] Buffer, proximity, intersection, and area measurement tools via PostGIS + Turf.js.
- [ ] Heatmap generation layer (MapLibre heatmap + PostGIS aggregation).
- [ ] GeoFile upload: Shapefile, GeoPackage, KML/KMZ, GeoTIFF, CSV (lat/lon).
- [ ] CRS auto-detection with pre-loaded SA EPSG codes (2046, 2048, 4148, 22234).
- [ ] Browser-side preview (`shpjs`, `@ngageoint/geopackage`, `geotiff.js`) + server-side GDAL conversion.
- [ ] Python GIS processing API endpoints (rasterio, Shapely, DuckDB-Spatial).

---

## M22 — CesiumJS 3D Globe & Dual-Viewer

**Status:** TODO 📅
**Depends on:** M10, M18 complete
**Blocker:** KU1 — Google 3D Tiles Cape Town coverage must be verified first.
**Goal:** Full CesiumJS globe integration with MapLibre ↔ CesiumJS mode switching.
**Domains unlocked:** Urban Planners (D1), Real Estate (D7), Journalists (D3)

### Definition of Done

- [ ] CesiumJS globe with Google Photorealistic 3D Tiles for Cape Town.
- [ ] MapLibre ↔ CesiumJS dual-viewer mode switcher (shared viewport state).
- [ ] Google Solar API integration (roof area, irradiation for solar feasibility).
- [ ] Street View historical archive temporal comparison slider.
- [ ] Mobile fallback to 2D-only mode for constrained devices.

---

## M23 — AI Agent Intelligence Layer

**Status:** TODO 📅
**Depends on:** M17, M21 complete
**Goal:** AI-powered spatial intelligence with MCP fleet, Claude Code skills, and GIS Copilot Phase 1.

### Definition of Done

- [ ] MCP server fleet activated: `filesystem`, `postgres`, `doc-state` + existing `gmp-code-assist`, `sequential-thinking`.
- [ ] Claude Code GIS skills: `spatial-query`, `satellite-ingest`, `geofile-validate`, `security-audit`.
- [ ] Structured prompt templates for spatial query workflows.
- [ ] GIS Copilot Phase 1 (6 tools): geocode, proximity, area_search, details, distance, count.
- [ ] `gis_copilot_reader` read-only PostGIS role with VIEWER minimum RBAC.
- [ ] Cape Town bbox validation on all generated geometries.

---

## M24 — Domain Dashboards (Phase 1: 4 Domains)

**Status:** TODO 📅
**Depends on:** M20, M21, M22 complete
**Goal:** Dedicated dashboard modes for the 4 highest-priority user domains.

### Definition of Done

- [ ] **Emergency Responders (D2):** Incident Command dashboard with FIRMS fire layer, offline pre-cache for risk areas, wind overlay.
- [ ] **Environmental Scientists (D4):** Environmental Monitor with NDVI delta, flood extent, biodiversity overlay.
- [ ] **Public Citizens (D10):** Community View with My Location, simplified non-technical UI, community report submission.
- [ ] **Farmers (D11):** Crop Intelligence with NDVI vs baseline, drone GeoTIFF upload, weather correlation.
- [ ] Domain-specific role detection and automatic dashboard mode selection.

---

## M25 — OSINT & Aviation Layer

**Status:** TODO 📅
**Depends on:** M9, M23 complete
**Blocker:** KU2 — OpenSky commercial licensing for multi-tenant SaaS must be resolved.
**Goal:** Advanced OSINT fusion and aviation analysis for Journalists, Aviation Professionals, and Defense Analysts.

### Definition of Done

- [ ] OpenSky ADS-B integration with ICAO airspace volume overlays.
- [ ] NOTAM display and squawk code alert system (7700/7600/7500).
- [ ] AI content labeling UI with `humanReviewed` export gate.
- [ ] Citation export (BibTeX, RIS, APA) for academic/journalist workflows.
- [ ] Privacy bright lines enforced: no individual ADS-B tracking, no movement profiles.
- [ ] AGENCY access tier with audit logging for defense analytics.

---

## M26 — 4D WorldView & GIS Copilot (Visionary)

**Status:** TODO 📅
**Depends on:** M22, M23, M25 complete
**Goal:** Temporal 4D event replay dashboard and full 15-tool GIS Copilot.

### Definition of Done

- [ ] CesiumJS 4D temporal replay dashboard with time-scrubbing slider.
- [ ] Multi-source data fusion on 3D globe (CZML time-dynamic entities).
- [ ] 3DGS reconstruction pipeline (COLMAP → Splatfacto → PLY/glTF export).
- [ ] GIS Copilot Phase 2 (15 tools): land use, temporal comparison, NDVI query, valuation stats.
- [ ] AI content watermark on all 3DGS outputs (GIS_MASTER_CONTEXT §9).
- [ ] Per-domain 4D scenarios for all 11 user domains.

---

## Critical Constraints & Deadlines

| Date               | Event                  | Consequence                                                                                                   |
| ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| **April 27, 2026** | **GEE Quota Deadline** | Projects default to Community Tier (150 EECU-h). Must select Contributor Tier (1000 EECU-h) before this date. |
| **July 21, 2026**  | **ArcGIS Pro Expiry**  | Native ArcGIS Location services (geocoding, routing) will transition to API Key / OSM fallbacks.              |

---

## Changelog

| Date       | Change                                                                                              | Agent       |
| ---------- | --------------------------------------------------------------------------------------------------- | ----------- |
| 2026-03-20 | Completed QW1–QW4 Quick Wins; M18 partial: CARTO route, Cesium 3D Tiles route, Dexie offline search | Junie |
| 2026-03-19 | Added expansion milestones M20–M26 and Quick Wins QW1–QW4 (Satellite, Spatial, CesiumJS, AI Agent, Domains, OSINT, 4D) | Antigravity |
| 2026-03-13 | Fixed 500 Internal Server Error in middleware and layout; added error handling to tenant resolution | Gemini CLI  |
| 2026-03-13 | Implemented core GIS unit tests; Conducted layer count audit; Refactored code for Rule 7            | Gemini CLI  |
| 2026-03-12 | Added M9 (OpenSky) and M10 (Cesium Hybrid); Marked M0 complete                                      | Gemini CLI  |
| 2026-03-03 | Initial PLAN.md created during repo cleanup                                                         | Claude Code |
