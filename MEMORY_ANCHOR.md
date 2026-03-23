# MEMORY_ANCHOR.md — CapeTown GIS Hub

## Persistent Session Memory & Locked Decisions

> **Purpose:** This file persists critical decisions, session state, and locked architecture choices across AI agent
> sessions. Read this file at the start of every session.

---

## Current Session State

| Field                | Value                                                      |
|----------------------|------------------------------------------------------------|
| **Last Updated**     | 2026-03-21                                                 |
| **Active Milestone** | Phase 4 — GCP Infrastructure Provisioning + Data Migration |
| **Active Agent**     | CLOUD-INFRA-AGENT                                          |
| **Phase**            | GEE→GCS migration pipeline ACTIVE. Deadline: Apr 27, 2026  |

---

## Locked Decisions (Do Not Change Without Human Approval)

### Backend Architecture

| Decision          | Value                                                      | Rationale                                                       |
|-------------------|------------------------------------------------------------|-----------------------------------------------------------------|
| Framework         | FastAPI 0.115+ on Railway.app                              | Async support, auto-docs, Railway-native                        |
| GDAL Installation | OSGEO Docker base image ONLY                               | `pip install gdal` fails without system deps [GOTCHA-PY-001]    |
| Auth Validation   | Supabase JWT via JWKS (python-jose)                        | No shared secret needed; validates against Supabase public keys |
| CORS              | Vercel domain only — no wildcard in production             | Security: prevent cross-origin attacks                          |
| Supabase Role     | DB + Auth only — Python handles ALL API logic              | Clear separation of concerns                                    |
| Database          | Async GeoAlchemy2 + asyncpg                                | Performance: non-blocking DB calls                              |
| Task Queue        | Celery + Railway Redis add-on                              | All background jobs (LULC, SAM, imports, cache)                 |
| Storage           | Hybrid: Supabase <50MB + **GCS africa-south1** for rasters | POPIA compliant; COG + HTTP 206 range requests; R2 deprecated   |
| Raster Offload    | GCS bucket `capegis-rasters` in africa-south1              | COGs served via range requests; STAC catalog; OUT-DB in PostGIS |

### Frontend Architecture

| Decision      | Value                            | Rationale                        |
|---------------|----------------------------------|----------------------------------|
| Framework     | Next.js 15 App Router            | Server Components, streaming     |
| Mapping       | MapLibre GL JS                   | Open-source, no vendor lock-in   |
| State         | Zustand                          | Minimal, TypeScript-first        |
| Styling       | Tailwind CSS (dark mode default) | Consistent design system         |
| PWA           | Serwist                          | Offline-first capability         |
| Offline Tiles | PMTiles                          | Vector tiles from object storage |
| Spatial       | Turf.js (client-side)            | Lightweight geospatial ops       |

### Infrastructure

| Decision          | Value                                                      | Rationale                                        |
|-------------------|------------------------------------------------------------|--------------------------------------------------|
| Frontend Hosting  | Vercel                                                     | Next.js native, edge functions                   |
| Backend Hosting   | Railway.app                                                | Docker-native, Redis add-on                      |
| Tile Server       | Martin (Rust MVT)                                          | High-performance vector tiles                    |
| Database          | Supabase (PostgreSQL 15 + PostGIS 3.3)                     | Managed, RLS, Auth built-in                      |
| Object Storage    | **GCS africa-south1** (rasters) + Supabase Storage (small) | POPIA; COG range requests; $15.88/mo post-credit |
| Raster Processing | Cloud Run (capegis-raster-processor)                       | Scale-to-zero; 512MB; max 3 instances            |

---

## Critical Gotchas (Must Read Before Coding)

| ID            | Category           | Description                                                | Prevention                                             |
|---------------|--------------------|------------------------------------------------------------|--------------------------------------------------------|
| GOTCHA-PY-001 | GDAL               | `pip install gdal` fails without system GDAL libraries     | Use `ghcr.io/osgeo/gdal:ubuntu-small-3.9.0` base image |
| GOTCHA-PY-002 | DXF CRS            | DXF files almost never have CRS metadata                   | Always prompt user to confirm coordinate system        |
| GOTCHA-PY-003 | Watercourse Buffer | 10m buffer from National Water Act — verify exact distance | Check CoCT Informal Trading By-law before hardcoding   |

---

## Open Questions (Blocking Decisions)

| ID       | Question                                                                       | Blocks                      | Status                                  |
|----------|--------------------------------------------------------------------------------|-----------------------------|-----------------------------------------|
| OQ-NEW-A | Is GV Roll CSV or PDF?                                                         | MPA (OCR milestone)         | UNRESOLVABLE — data not found on portal |
| OQ-NEW-B | Exact watercourse buffer distance in Trading Bay By-law                        | MP1 trading bay suitability | Pending CoCT by-law review              |
| OQ-NEW-C | Does Railway Redis support Celery result backend natively?                     | MP5                         | Pending test                            |
| OQ-NEW-D | Prithvi model input band specification — HLS vs standard Sentinel-2?           | MP5 LULC                    | Pending NASA-IMPACT README review       |
| OQ-NEW-E | Does OpenCities Africa / HOT OSM have Cape Flats informal settlement polygons? | SAM pipeline                | RESOLVED ✓ — No data, SAM deferred      |
| OQ-NEW-F | SAM inference on Railway CPU tier — acceptable latency or GPU needed?          | SAM milestone timing        | Pending benchmark                       |

---

## Active Milestones

### MP0 — Python Backend Bootstrap (COMPLETE ✓)

**Agent:** PYTHON-BACKEND-AGENT
**Deliverables:**

- [x] `backend/` directory structure created
- [x] `main.py`: FastAPI app with lifespan, CORS for Vercel domain
- [x] `core/config.py`: Pydantic Settings loading all Railway env vars
- [x] `core/auth.py`: Supabase JWT validation via JWKS
- [x] `core/database.py`: async PostGIS engine (GeoAlchemy2 + asyncpg)
- [x] `GET /health` returns: `{ status: "ok", db: "connected", version: "0.1.0" }`
- [x] Dockerfile builds without error (GDAL via OSGEO base image)
- [x] `docker-compose.yml`: api + celery-worker + redis services
- [x] `requirements.txt`: all production packages
- [x] CORS configured for `https://capegis.vercel.app`
- [ ] Supabase JWT validates successfully with real test token (pending deployment)

### MP1 — Spatial Analysis API (COMPLETE ✓)

**Agent:** GIS-ANALYSIS-AGENT
**Deliverables:**

- [x] `services/spatial_analysis.py`: trading_bay_suitability, intersection, buffer, proximity, suburb_stats
- [x] `api/routes/spatial.py`: 5 endpoints with JWT auth, bbox validation
- [x] `migrations/001_analysis_jobs.sql`: analysis_jobs table with RLS
- [x] `tests/test_spatial.py`: 25 tests — all passing
- [x] GOTCHA-DB-003 added to gotchas.md (ST_DWithin geography cast)
- [x] OQ-NEW-B documented in docs/OPEN_QUESTIONS.md (10m NWA default, pending verification)
- [x] All PostGIS queries use geography cast for metre-based distances
- [x] Cape Town bbox enforced on all queries
- [x] Cross-tenant isolation verified in tests

### MP2 — GIS File Pipeline (COMPLETE ✓)

**Agent:** FILE-PIPELINE-AGENT
**Deliverables:**

- [x] `services/format_validators.py`: detect_format, validate_shapefile_zip, validate_crs,
  validate_within_cape_town_bbox, prompt_dxf_crs, get_storage_destination
- [x] `services/gis_processor.py`: 10 ingest functions (geojson, shapefile, gpkg, kml, csv, geotiff, dxf, gdb, las/laz,
  arcgis_rest) + 8 export functions (geojson, shapefile_zip, gpkg, kml, csv, cog, dxf, pmtiles)
- [x] `services/r2_client.py`: Cloudflare R2 boto3 client (upload, download, presigned URL, delete)
- [x] `api/routes/files.py`: POST /files/upload, POST /files/upload/arcgis-rest, GET /files/export/{layer_id}/{format}
- [x] `tests/test_files.py`: 55 tests — all passing
- [x] GOTCHA-PY-003 (Shapefile bundle), GOTCHA-PY-004 (DXF CRS), GOTCHA-PY-005 (async blocking) added to gotchas.md
- [x] All GeoPandas operations wrapped in asyncio.run_in_executor (GOTCHA-PY-005)
- [x] DXF upload returns 422 asking for CRS (GOTCHA-PY-004)
- [x] Shapefile .zip missing .prj rejected with 422 (GOTCHA-PY-003)
- [x] Storage routing: <50MB → Supabase, rasters/large → R2
- [x] Files router registered in main.py

### MP3 — ArcGIS Proxy + Cache Warmer (COMPLETE ✓)

**Agent:** DATA-AGENT
**Deliverables:**

- [x] OQ-001 RESOLVED: CoCT ArcGIS REST returns HTTP 404 (service gone), WC GIS returns 200
- [x] `services/arcgis_client.py`: enumerate_services, query_layer, query_with_fallback (LIVE→CACHED→MOCK)
- [x] `api/routes/arcgis.py`: GET /arcgis/layers, GET /arcgis/layer/{key}/features, POST /arcgis/cache/warm, GET
  /arcgis/services/{source}, DELETE /arcgis/cache
- [x] `tasks/cache_warmer.py`: warm_all_layers, warm_specific_layers (daily 02:00 SAST schedule)
- [x] `tests/test_arcgis.py`: 38 tests — all passing
- [x] `docs/API_STATUS.md`: verified HTTP codes for CoCT (404), WC GIS (200), CoCT ODP (200)
- [x] GOTCHA-DATA-002 added to gotchas.md (esriJSON ≠ GeoJSON)
- [x] OQ-001 marked RESOLVED in docs/OPEN_QUESTIONS.md with evidence
- [x] Mock GeoJSON for all 4 known layers (zoning, suburbs, parcels, watercourses)
- [x] All features within Cape Town bbox
- [x] Three-tier fallback verified: LIVE → CACHED → MOCK
- [x] ArcGIS router registered in main.py

### MP4 — WFS/WMS OGC Services (COMPLETE ✓)

**Agent:** OGC-SERVICES-AGENT
**Deliverables:**

- [x] `pygeoapi.config.yml`: Phase 1 collections (zoning, parcels, suburbs, flood_risk) with PostGIS providers
- [x] `api/routes/ogc.py`: OGC landing page, conformance, collections, items, WFS/WMS GetCapabilities
- [x] API key auth for tenant collections via query param (OGC clients cannot send headers)
- [x] OSM ODbL + CARTO attribution on every capabilities response
- [x] Cape Town bbox [18.28, -34.36, 19.02, -33.48] on all collections
- [x] `docs/QGIS_CONNECTION_GUIDE.md`: WFS URL format for QGIS and ArcGIS Pro
- [x] `tests/test_ogc.py`: 54 tests — all passing
- [x] PyYAML added to requirements.txt for config loading
- [x] OGC router registered in main.py
- [x] Public collections unauthenticated; tenant collections require api_key

### MP5 — Celery Workers + ML Pipelines (COMPLETE ✓)

**Agent:** ML-PIPELINE-AGENT
**Deliverables:**

- [x] `tasks/celery_app.py`: Celery instance with Railway Redis, 4 queues (spatial/raster/import/cache), beat schedule
- [x] `tasks/flood_risk.py`: TWI weighted overlay (DEM + CHIRPS + soil permeability), COG output
- [x] `tasks/heat_island.py`: Mono-window LST from Landsat 8/9 Band 10, heat island classification
- [x] `tasks/anomaly_detection.py`: Isolation Forest (6 features, contamination=0.05), inline <50ms inference
- [x] `tasks/nl_spatial_query.py`: Claude API NL→PostGIS, JSON validation, SQL injection prevention, 50/hr rate limit
- [x] `tasks/lulc_classification.py`: Prithvi-100M with HLS bands (NOT standard S2 L2A), 7-class Cape Town schema
- [x] `api/routes/jobs.py`: GET/POST/DELETE /jobs with pagination, tenant isolation, Celery dispatch
- [x] `api/routes/ml.py`: 7 ML endpoints (anomaly predict/batch/train, NL query, flood/heat/LULC triggers)
- [x] OQ-NEW-E RESOLVED: No Cape Flats informal settlement polygons on HDX — SAM deferred to Phase 2
- [x] `tests/test_mp5_celery.py`: 70 tests — all passing (242 total)
- [x] Jobs and ML routers registered in main.py

### MPA — GV Roll OCR Pipeline (SKIPPED)

**Agent:** ML-PIPELINE-AGENT
**Status:** SKIPPED — precondition not met
**Reason:** OQ-NEW-A could not be resolved as "GV Roll is PDF only". odp.capetown.gov.za unreachable
(HTTP 000) and odp-cctegis.opendata.arcgis.com has no CoCT GV Roll dataset.

### DevSecOps CI/CD Hardening (COMPLETE ✓)

**Deliverables:**

- [x] `.github/workflows/ci.yml`: Build, test, lint (frontend+backend) + secret scan with SHA-pinned actions
- [x] `.github/workflows/security.yml`: CodeQL SAST (JS/TS + Python), npm/pip audit, license compliance
- [x] `.github/workflows/pr-validation.yml`: Conventional commits, rebase check, .env block, large file check
- [x] `.github/workflows/deploy.yml`: CI gate → Vercel + Railway with health checks
- [x] `.github/workflows/auto-rebase.yml`: /rebase command for PR branches
- [x] `.github/workflows/codeql.yml`: Updated with Python language + SHA-pinned checkout
- [x] `.github/dependabot.yml`: 3 ecosystems (actions/npm/pip), weekly schedule, grouped updates
- [x] All actions SHA-pinned, all jobs use least-privilege permissions

### MP-QA — Python Backend QA (COMPLETE ✓)

**Agent:** TEST-AGENT
**Deliverables:**

- [x] Doc-coauthoring reader test: 5/5 questions answered from PYTHON_BACKEND_ARCHITECTURE.md
- [x] QA checklist: 13 PASS, 1 FAIL (BUG-PY-001), 1 SKIP (COG validation)
- [x] `tests/test_qa_mp8.py`: 19 passed, 1 skipped, 1 xfailed (261 total)
- [x] `docs/MP-QA_REPORT.md`: Full QA report with deploy verdict
- [x] `docs/bugs/BUG-PY-001.md`: CRITICAL — invalid JWT returns 503 instead of 401
- [x] Deploy verdict: **NO-GO** — BUG-PY-001 must be fixed before Railway production deploy

**CRITICAL Bug:** BUG-PY-001 — ~~OPEN~~ **FIXED** ✓. `auth.py` now validates token structure
(3-part JWT, decodable header/claims) BEFORE any JWKS network call. Malformed tokens always
get 401, never 503. Deploy verdict updated: **GO** (pending integration testing).

### Architecture Restructure (COMPLETE ✓)

**Agent:** Junie (Architecture Refactor)
**Deliverables:**

- [x] **Hexagonal Architecture** — `backend/app/domain/`, `ports/`, `adapters/`, `infrastructure/`
- [x] **Domain Layer** — 3 value objects (BoundingBox, SuitabilityScore, GeoJSONGeometry),
  3 entities (AnalysisJob, GISLayer, TenantContext), 7 domain exceptions
- [x] **Port Interfaces** — 4 outbound ports (SpatialRepositoryPort, StoragePort, ArcGISPort,
  FileProcessorPort) with Big O annotations and GOTCHA references
- [x] **BUG-PY-001 FIXED** — auth.py validates token structure before JWKS fetch (262 tests pass)
- [x] **shared/** — Cross-cutting constants (bbox.ts, roles.ts, formats.ts) mirroring backend domain
- [x] **infra/** — Deployment documentation and CI/CD reference
- [x] **.env.example** — All frontend + backend environment variables documented
- [x] **AI Instruction Files** — .junie/guidelines.md, .claude/ARCHITECTURE.md Section 9,
  .github/copilot/instructions.md — all mandate pattern-driven, Big O-aware, secure coding
- [x] **CONTRIBUTING.md** — Developer onboarding with architecture rules, security checklist
- [x] **CLAUDE.md Section 8** — Updated file structure reflecting hexagonal architecture

**Design Patterns Applied:**

- Value Object (DDD) — BoundingBox, SuitabilityScore, GeoJSONGeometry
- Entity (DDD) — AnalysisJob (state machine), GISLayer, TenantContext
- Repository (DDD + Hexagonal) — SpatialRepositoryPort abstract interface
- Strategy (GoF) — FileProcessorPort for format-specific dispatch
- Factory — `@classmethod` constructors with validation on all domain objects
- Port/Adapter (Hexagonal) — All external deps behind abstract interfaces

**Next:** Production deploy readiness (integration testing on Railway).

---

<!-- AUTO-MARKER: Agent sessions append below -->
<!-- BEGIN AUTO: Session History -->

<!-- END AUTO: Session History -->
