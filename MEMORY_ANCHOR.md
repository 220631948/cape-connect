# MEMORY_ANCHOR.md — CapeTown GIS Hub

## Persistent Session Memory & Locked Decisions

> **Purpose:** This file persists critical decisions, session state, and locked architecture choices across AI agent
> sessions. Read this file at the start of every session.

---

## Current Session State

| Field                | Value                             |
|----------------------|-----------------------------------|
| **Last Updated**     | 2026-03-21                        |
| **Active Milestone** | MP2 — GIS File Pipeline           |
| **Active Agent**     | FILE-PIPELINE-AGENT               |
| **Phase**            | GIS_FILE_PIPELINE → IMPORT_EXPORT |

---

## Locked Decisions (Do Not Change Without Human Approval)

### Backend Architecture

| Decision          | Value                                            | Rationale                                                       |
|-------------------|--------------------------------------------------|-----------------------------------------------------------------|
| Framework         | FastAPI 0.115+ on Railway.app                    | Async support, auto-docs, Railway-native                        |
| GDAL Installation | OSGEO Docker base image ONLY                     | `pip install gdal` fails without system deps [GOTCHA-PY-001]    |
| Auth Validation   | Supabase JWT via JWKS (python-jose)              | No shared secret needed; validates against Supabase public keys |
| CORS              | Vercel domain only — no wildcard in production   | Security: prevent cross-origin attacks                          |
| Supabase Role     | DB + Auth only — Python handles ALL API logic    | Clear separation of concerns                                    |
| Database          | Async GeoAlchemy2 + asyncpg                      | Performance: non-blocking DB calls                              |
| Task Queue        | Celery + Railway Redis add-on                    | All background jobs (LULC, SAM, imports, cache)                 |
| Storage           | Hybrid: Supabase <50MB + Cloudflare R2 for large | Cost optimization; R2 for rasters/models                        |

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

| Decision         | Value                                  | Rationale                      |
|------------------|----------------------------------------|--------------------------------|
| Frontend Hosting | Vercel                                 | Next.js native, edge functions |
| Backend Hosting  | Railway.app                            | Docker-native, Redis add-on    |
| Tile Server      | Martin (Rust MVT)                      | High-performance vector tiles  |
| Database         | Supabase (PostgreSQL 15 + PostGIS 3.3) | Managed, RLS, Auth built-in    |
| Object Storage   | Supabase Storage + Cloudflare R2       | Hybrid for cost/performance    |

---

## Critical Gotchas (Must Read Before Coding)

| ID            | Category           | Description                                                | Prevention                                             |
|---------------|--------------------|------------------------------------------------------------|--------------------------------------------------------|
| GOTCHA-PY-001 | GDAL               | `pip install gdal` fails without system GDAL libraries     | Use `ghcr.io/osgeo/gdal:ubuntu-small-3.9.0` base image |
| GOTCHA-PY-002 | DXF CRS            | DXF files almost never have CRS metadata                   | Always prompt user to confirm coordinate system        |
| GOTCHA-PY-003 | Watercourse Buffer | 10m buffer from National Water Act — verify exact distance | Check CoCT Informal Trading By-law before hardcoding   |

---

## Open Questions (Blocking Decisions)

| ID       | Question                                                                       | Blocks                      | Status                                    |
|----------|--------------------------------------------------------------------------------|-----------------------------|-------------------------------------------|
| OQ-NEW-A | Is GV Roll CSV or PDF?                                                         | MPA (OCR milestone)         | Pending download from odp.capetown.gov.za |
| OQ-NEW-B | Exact watercourse buffer distance in Trading Bay By-law                        | MP1 trading bay suitability | Pending CoCT by-law review                |
| OQ-NEW-C | Does Railway Redis support Celery result backend natively?                     | MP5                         | Pending test                              |
| OQ-NEW-D | Prithvi model input band specification — HLS vs standard Sentinel-2?           | MP5 LULC                    | Pending NASA-IMPACT README review         |
| OQ-NEW-E | Does OpenCities Africa / HOT OSM have Cape Flats informal settlement polygons? | SAM pipeline                | Pending data.humdata.org check            |
| OQ-NEW-F | SAM inference on Railway CPU tier — acceptable latency or GPU needed?          | SAM milestone timing        | Pending benchmark                         |

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

---

## Session Handoff Protocol

**When handing off to next agent:**

1. Update this file with completed decisions
2. Write entry in `docs/SESSION_LOG.md`
3. Ensure all verification checks pass
4. Document any deviations in `docs/PLAN_DEVIATIONS.md`

**Next Agent:** FILE-PIPELINE-AGENT → MP2 complete. Next: DATA-AGENT → MP3 (ArcGIS Proxy + Cache Warmer)
**Next Document:** `docs/SESSION_LOG.md` entry required

---

<!-- AUTO-MARKER: Agent sessions append below -->
<!-- BEGIN AUTO: Session History -->

<!-- END AUTO: Session History -->
