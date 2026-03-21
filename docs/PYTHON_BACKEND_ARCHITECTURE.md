# PYTHON_BACKEND_ARCHITECTURE.md
## Cape Town GIS Platform — Python FastAPI Backend
## Generated from Q-group answers · 2026-03-21

---

## 1. Architecture Overview

### Decision Register (locked)

| Decision | Value |
|----------|-------|
| Integration model | B — Supabase = DB + Auth only. Python FastAPI = ALL API logic |
| Frontend | Next.js 15 App Router, calls Supabase JS + Python FastAPI |
| Deployment | Railway.app (Python) + Vercel (Next.js) + Supabase (DB/Auth) |
| Task queue | Railway Redis add-on + Celery (all jobs, fast and slow) |
| Storage | Hybrid: Supabase Storage <50MB / Cloudflare R2 for rasters + models |
| Containers | Docker Compose everywhere (local dev + Railway production) |
| First build | Spatial analysis API — trading bay suitability, advanced PostGIS |
| WFS/WMS | MVP scope (pygeoapi) |
| 3D/Temporal | Phase 3 only |

---

### System Component Map

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER (Next.js 15 App Router — Vercel CDN)                   │
│                                                                   │
│  Server Components → fetch from Python FastAPI (server-side)     │
│  Client Components → Supabase JS client (auth, realtime)         │
│  Map Components    → dynamic(ssr:false) → Leaflet.js             │
│  File uploads      → multipart POST → Python FastAPI             │
└──────────┬──────────────────────────┬────────────────────────────┘
           │                          │
           ▼                          ▼
┌──────────────────┐      ┌───────────────────────────────────────┐
│  SUPABASE        │      │  PYTHON FASTAPI — Railway.app          │
│  PostgreSQL 15   │      │                                        │
│  + PostGIS 3.3   │◄─────│  All business logic, GIS processing,  │
│  + GoTrue Auth   │      │  ML inference, OGC services, file I/O  │
│  + RLS policies  │      │                                        │
│                  │      │  ┌──────────────────────────────────┐  │
│  Auth JWT →      │      │  │  Celery Workers (Railway)        │  │
│  Python validates│      │  │  - LULC classification           │  │
│  with JWKS       │      │  │  - SAM inference                 │  │
└──────────────────┘      │  │  - GV Roll import pipeline       │  │
                          │  │  - Cache warming                 │  │
┌──────────────────┐      │  │  - Raster processing             │  │
│  STORAGE         │      │  └──────────────────────────────────┘  │
│                  │      │                                        │
│  Supabase:       │◄─────│  ┌──────────────────────────────────┐  │
│  GeoJSON, SHP,   │      │  │  Railway Redis                   │  │
│  PDFs <50MB      │      │  │  Celery broker + result backend  │  │
│                  │      │  └──────────────────────────────────┘  │
│  Cloudflare R2:  │◄─────│                                        │
│  GeoTIFF, COG,   │      └───────────────────────────────────────┘
│  ML models,      │
│  LAS/LAZ, .gdb   │
└──────────────────┘
```

### Data Flow: Authenticated Request

```
Next.js (browser)
  → reads Supabase JWT from cookie
  → sends Authorization: Bearer {jwt} header to Python FastAPI
  → Python validates JWT signature against Supabase JWKS endpoint
  → Python sets app.current_tenant from JWT claims
  → Python calls PostGIS with tenant_id injected into query
  → RLS enforces isolation at DB level (second safety layer)
  → response → Next.js → render
```

---

## 2. Python FastAPI Project Structure

```
backend/
├── main.py                        ← FastAPI app, lifespan, router registration
├── Dockerfile                     ← Railway production image
├── docker-compose.yml             ← Local dev (api + celery + redis)
├── requirements.txt               ← Production packages
├── requirements-dev.txt           ← Dev + test packages
├── requirements-ml.txt            ← Heavy ML packages (separate install)
│
├── app/
│   ├── core/
│   │   ├── config.py              ← Pydantic Settings (reads .env)
│   │   ├── auth.py                ← Supabase JWT validation middleware
│   │   ├── database.py            ← Async PostGIS (GeoAlchemy2 + asyncpg)
│   │   ├── database_sync.py       ← Sync engine for GeoPandas operations
│   │   └── storage.py             ← Supabase Storage + R2 (boto3) client
│   │
│   ├── api/routes/
│   │   ├── health.py              ← GET /health (Railway health check)
│   │   ├── spatial.py             ← Spatial analysis endpoints (FIRST BUILD)
│   │   ├── files.py               ← GIS file upload/export endpoints
│   │   ├── ogc.py                 ← WFS/WMS via pygeoapi (MVP)
│   │   ├── arcgis.py              ← ArcGIS REST proxy + cache warmer
│   │   ├── ml.py                  ← ML inference endpoints
│   │   └── jobs.py                ← Celery job status polling
│   │
│   ├── services/
│   │   ├── spatial_analysis.py    ← Trading bay suitability, PostGIS ops
│   │   ├── gis_processor.py       ← GDAL/Fiona/GeoPandas format handling
│   │   ├── format_validators.py   ← Per-format validation rules
│   │   ├── arcgis_client.py       ← esriJSON → GeoJSON conversion
│   │   ├── r2_client.py           ← Cloudflare R2 operations
│   │   └── ocr_pipeline.py        ← GLM-OCR (conditional — if GV Roll is PDF)
│   │
│   └── tasks/                     ← Celery task definitions
│       ├── celery_app.py          ← Celery instance + Railway Redis config
│       ├── lulc_classification.py ← Prithvi/Clay fine-tuning + inference
│       ├── sam_inference.py       ← SAM informal settlement detection
│       ├── flood_risk.py          ← DEM + CHIRPS → susceptibility raster
│       ├── heat_island.py         ← Landsat LST algorithm
│       ├── anomaly_detection.py   ← GV Roll Isolation Forest
│       ├── nl_spatial_query.py    ← Claude API → PostGIS query
│       └── cache_warmer.py        ← ArcGIS endpoint cache population
│
└── tests/
    ├── test_spatial.py
    ├── test_files.py
    ├── test_auth.py
    └── test_rls_isolation.py
```

---

## 3. Milestone Build Order

### MP0 — Python Backend Bootstrap
**Agent:** PYTHON-BACKEND-AGENT
**Produces:** Project structure, Dockerfile, docker-compose.yml, core/ modules, health endpoint
**Gate:** `GET /health` returns 200 from Railway. Supabase JWT validates correctly.

### MP1 (FIRST BUILD) — Spatial Analysis API
**Agent:** GIS-ANALYSIS-AGENT
**Produces:** `routes/spatial.py` + `services/spatial_analysis.py`

Endpoints:

| Method | Path | Purpose |
|--------|------|---------|
| POST | /spatial/trading-bay-suitability | Multi-criteria overlay score for a candidate bay polygon |
| POST | /spatial/intersection | Features within a drawn polygon |
| POST | /spatial/buffer | Features within N metres of a point/polygon |
| POST | /spatial/proximity-score | Weighted scoring of proximity to services/hazards |
| GET | /spatial/suburb/{name}/stats | Aggregate stats for a suburb |

**Trading bay suitability score** — criteria per request:

```
Input:  GeoJSON polygon (candidate bay location)
Output: {
  score: 0-100,
  criteria: {
    watercourse_distance_m: float,     # must be > 10m (NWA buffer)
    slope_pct: float,                  # must be < 2% for accessibility
    flood_risk_class: str,             # Low/Medium/High/Very High
    heritage_overlap: bool,            # true = disqualifying constraint
    existing_bay_proximity_m: float,   # spacing requirement
    gradient_accessible: bool          # slope < 2%
  },
  verdict: "SUITABLE" | "CONDITIONAL" | "UNSUITABLE",
  blocking_constraints: [str]          # human-readable list of failures
}
```

**[RALPH FLAG:** "The 10m watercourse buffer is from the National Water Act.
I am not inventing it. Verify the exact buffer distance with the drainage
planner persona before hardcoding 10m. It may differ by watercourse class."]

### MP2 — GIS File Pipeline
**Agent:** FILE-PIPELINE-AGENT
**Produces:** `routes/files.py` + `services/gis_processor.py` + `services/format_validators.py`

### MP3 — ArcGIS Proxy + Cache Warmer
**Agent:** DATA-AGENT (existing)
**Produces:** `routes/arcgis.py` + `services/arcgis_client.py` + `tasks/cache_warmer.py`
**Resolves:** OQ-001 (ArcGIS auth status — proxy tests auth and handles 401 gracefully)

### MP4 — WFS/WMS via pygeoapi (MVP)
**Agent:** OGC-SERVICES-AGENT
**Produces:** pygeoapi config + `routes/ogc.py`
**Integration:** pygeoapi mounts as a sub-application inside FastAPI

### MP5 — Celery + ML Pipelines
**Agent:** ML-PIPELINE-AGENT
**Produces:** `tasks/` directory, Celery worker Dockerfile, Railway Redis config

### MPA — GV Roll OCR (conditional)
**Trigger:** Only if GV Roll is confirmed as PDF-only from odp.capetown.gov.za
**[RALPH FLAG:** "Has anyone actually downloaded the GV Roll to check if it is
CSV or PDF? This milestone may never be needed. Check OQ-004 before building."]

---

## 4. Verified Python Package List

### requirements.txt (production)

```
# API framework
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
python-multipart>=0.0.9        # file upload
pydantic>=2.7.0
pydantic-settings>=2.3.0
httpx>=0.27.0                  # async HTTP client (ArcGIS proxy calls)

# Database — async path
sqlalchemy[asyncio]>=2.0.30
geoalchemy2>=0.15.0
asyncpg>=0.29.0

# Database — sync path (GeoPandas only)
psycopg2-binary>=2.9.9

# GIS core — NOTE: install GDAL via conda-forge or Docker base image first
geopandas>=0.14.4
fiona>=1.9.6
shapely>=2.0.4
pyproj>=3.6.1
pyogrio>=0.9.0                 # 10x faster than Fiona for large files
rasterio>=1.3.10
rio-cogeo>=5.3.0               # Cloud-Optimized GeoTIFF creation

# GIS format-specific
laspy>=2.5.4                   # LAS/LAZ LiDAR
ezdxf>=1.3.4                   # DXF read/write
arcgis>=2.3.0                  # ArcGIS REST + FileGDB via GDAL

# Raster / satellite
rioxarray>=0.17.0
xarray>=2024.6.0
earthengine-api>=0.1.400       # GEE training sample export
sentinelsat>=1.2.1             # Copernicus Sentinel-2 download

# OGC services
pygeoapi>=0.18.0               # WFS/WMS/OGC API Features

# Celery + Redis
celery[redis]>=5.4.0
redis>=5.0.7
flower>=2.0.1                  # Celery monitoring

# Storage
boto3>=1.34.0                  # Cloudflare R2 (S3-compatible)
python-magic>=0.4.27           # MIME type detection

# Auth
python-jose[cryptography]>=3.3.0  # Supabase JWT validation

# Observability
sentry-sdk[fastapi]>=2.7.0
structlog>=24.2.0
```

### requirements-ml.txt (separate install — heavy)

```
# Foundation models
huggingface-hub>=0.24.0
transformers>=4.43.0
torch>=2.3.0
torchvision>=0.18.0

# Prithvi (NASA/IBM geospatial foundation model)
# Install from: pip install git+https://github.com/NASA-IMPACT/hls-foundation-os

# SAM — Meta Segment Anything Model
segment-anything>=1.0

# Classical ML
scikit-learn>=1.5.0
numpy>=1.26.4

# Model management
mlflow>=2.14.0
onnx>=1.16.0
onnxruntime>=1.18.0            # CPU inference for deployed models

# GLM-OCR (conditional — GV Roll PDF only)
# Deploy via Ollama: ollama pull glm-ocr
# Python client: ollama>=0.3.0
```

**GDAL installation note (mandatory — add to ONBOARDING.md):**
```
# Docker (recommended — Railway uses this)
FROM ghcr.io/osgeo/gdal:ubuntu-small-3.9.0

# Conda (local dev)
conda install -c conda-forge gdal geopandas fiona rasterio

# NEVER: pip install gdal  ← this will fail
```

---

## 5. GIS File Format Matrix

### Import Pipeline (inbound)

| Format | Library | Validator | CRS handling | Size limit | Notes |
|--------|---------|-----------|-------------|-----------|-------|
| GeoJSON | GeoPandas/Fiona | geojson-validation | Auto-detect; default WGS84 if absent | 50MB Supabase | Most common |
| Shapefile | Fiona (as .zip) | Check .shp+.dbf+.prj+.shx all present | Read from .prj; reject if missing | 100MB → R2 | Must upload as ZIP |
| GeoPackage | GeoPandas/Fiona | Layer list validation | Read from GPKG metadata | 500MB → R2 | Single file, multiple layers |
| KML/KMZ | Fiona | Schema check | WGS84 by specification | 50MB | KMZ = zipped KML |
| CSV+lat/lon | pandas | lat/lon column detection | Assume WGS84; warn user | 50MB | col names: lat/lon/latitude/longitude/x/y |
| GeoTIFF | Rasterio | Band count, no-data check | Read from TIFF tags | R2 always | Reproject to EPSG:4326 |
| DXF | ezdxf | Layer enumeration | Assume Cape Town local grid; prompt user | 100MB → R2 | [FLAG: CRS almost never in DXF — must ask user] |
| FileGDB | Fiona + GDAL | Layer list | Read from GDB metadata | R2 always | Requires GDAL with OpenFileGDB driver |
| LAS/LAZ | laspy | Point density check | Read from LAS header | R2 always | Extract to DEM via pdal before PostGIS |
| ArcGIS REST | httpx (proxy) | esriJSON schema | ESRI:102100 → EPSG:4326 | N/A (streamed) | Convert via arcgis2geojson |

**[RALPH FLAG:** "DXF files almost never have CRS metadata. Every DXF import
must prompt the user to confirm the coordinate system before processing.
If we assume Cape Town Lo19 and the file is actually WGS84, the geometry
will land somewhere in the ocean. I have seen this happen."]

### Export Pipeline (outbound)

| Format | Library | Notes |
|--------|---------|-------|
| GeoJSON | GeoPandas | Always EPSG:4326. Attribution metadata in FeatureCollection properties. |
| Shapefile | GeoPandas (as .zip) | Bundle .shp+.dbf+.prj+.shx+.cpg. Include LICENSE.txt with data attribution. |
| GeoPackage | GeoPandas | Include data vintage and source as GPKG metadata. |
| KML | GeoPandas/Fiona | WGS84 only. Include description field with source attribution. |
| CSV | pandas | Include EPSG:4326 lat/lon columns. Add metadata row at top. |
| GeoTIFF/COG | rasterio + rio-cogeo | EPSG:4326 stored. Include TIFF tags: source, vintage, processing date. |
| DXF | ezdxf | EPSG:32734 (Lo19) for engineering outputs. Include title block metadata. |
| WFS/WMS | pygeoapi | OGC-compliant. Attribution in capabilities document. |
| PMTiles | pmtiles-python | For offline distribution. Generate from COG via rio-mbtiles then convert. |

---

## 6. Authentication Architecture

Next.js calls Python FastAPI with the Supabase JWT in the Authorization header.
Python validates the JWT against Supabase's JWKS endpoint — no shared secret needed.

```
Validation flow:
  1. Extract Bearer token from Authorization header
  2. Fetch JWKS from: https://{SUPABASE_PROJECT_REF}.supabase.co/auth/v1/.well-known/jwks.json
  3. Verify token signature + expiry using python-jose
  4. Extract claims: sub (user_id), tenant_id (custom claim), app_role
  5. Set request.state.user_id, request.state.tenant_id, request.state.role
  6. All downstream PostGIS queries include tenant_id from request.state
  7. RLS at DB level provides second enforcement layer

Middleware applied to: ALL routes except /health and /ogc (OGC services are public)
```

**Custom JWT claim setup required in Supabase:**
Add a Postgres function that adds `tenant_id` and `app_role` to the JWT claims.
This runs via the Supabase `auth.jwt()` hook — documented in AUTH-AGENT M2.

---

## 7. Celery Task Architecture

### Job lifecycle

```
Next.js POST /spatial/lulc-classify  →  FastAPI creates Celery task
  → returns: { job_id: "uuid", status: "queued", poll_url: "/jobs/{job_id}" }

Celery worker picks up task from Railway Redis
  → updates job status: queued → running → complete/failed
  → on complete: writes result to R2 (raster) + PostGIS (metadata row)
  → updates analysis_jobs table: status = "complete", result_url = "r2://..."

Next.js polls GET /jobs/{job_id} every 3s
  → returns: { status: "complete", result_url: "...", preview_url: "..." }
  → OR: { status: "failed", error: "..." }
```

### Task categories and routing

| Queue | Tasks | Max runtime | Workers |
|-------|-------|------------|---------|
| `spatial` | Intersection, buffer, suitability, proximity | 30s | 2 |
| `raster` | Flood risk, heat island, LULC, SAM | 10 min | 1 |
| `import` | GV Roll CSV import, large file ingestion | 30 min | 1 |
| `cache` | ArcGIS cache warming, tile pre-generation | 5 min | 1 |

### analysis_jobs table (add to SCHEMA_DESIGN.md)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK → tenants | RLS enforced |
| profile_id | UUID FK → profiles | Who submitted |
| task_type | text | lulc_classify / flood_risk / etc. |
| celery_task_id | text | For Celery result backend lookup |
| status | enum | queued / running / complete / failed |
| input_params | jsonb | Input polygon, layer selection etc. |
| result_url | text nullable | R2 path for raster outputs |
| result_geojson | jsonb nullable | For vector outputs <10MB |
| error_message | text nullable | |
| created_at | timestamptz | |
| completed_at | timestamptz nullable | |

RLS: Users see only own tenant's jobs. TENANT_ADMIN sees all in tenant.

---

## 8. ML Pipeline Specifications

### LULC Classification (Prithvi/Clay via Hugging Face)

```
Training path:
  1. GEE Code Editor → select training pixels interactively on Sentinel-2 mosaic
  2. Export CSV: {band values B2-B12, NDVI, NDWI, EVI, class_label}
  3. Load CSV in Python → GeoPandas → train Prithvi fine-tuning head
  4. Log run in MLflow (Railway-hosted or HF Experiments)
  5. Export inference head as ONNX → upload to R2

Inference path (Celery raster queue):
  1. Task receives: {polygon_geojson, date_range, class_schema}
  2. Download Sentinel-2 tiles intersecting polygon from Copernicus Data Space
  3. Stack bands → ONNX inference → classified raster
  4. Vectorise class boundaries → PostGIS storage
  5. Create COG → R2 storage
  6. Update analysis_jobs: status=complete, result_url=r2://lulc/{job_id}.tif

Cape Town class schema (6 classes):
  0: Water
  1: Bare soil / hardstanding
  2: Low vegetation / grassland
  3: Dense vegetation / trees
  4: Built-up low density (suburban)
  5: Built-up high density (CBD/commercial)
  6: Informal settlement (fine-tuned from Cape Flats imagery)
```

**[RALPH FLAG:** "Prithvi is trained on HLS (Harmonized Landsat-Sentinel) data.
Verify Prithvi's input band requirements before building the preprocessing pipeline.
HLS uses specific band combinations — do not assume standard Sentinel-2 L2A bands."]

### Flood Risk Prediction (algorithm-based, no ML)

```
Input data:
  - Copernicus DEM 30m (via Open Topography API or GEE)
  - CHIRPS daily rainfall (GEE dataset: UCSB-CHG/CHIRPS/DAILY)
  - FAO soil hydraulic conductivity layer

Algorithm:
  1. Terrain analysis: slope, aspect, TWI (Topographic Wetness Index)
     TWI = ln(upslope_area / tan(slope))
  2. Rainfall intensity: 10-year return period event from CHIRPS
  3. Soil permeability class from FAO
  4. Weighted overlay:
     susceptibility = (TWI × 0.4) + (rainfall × 0.35) + (soil_perm × 0.25)
  5. Classify: Low / Medium / High / Very High

Output: COG GeoTIFF clipped to Cape Town Metro bbox → R2
```

### Property Valuation Anomaly Detection

```
Model: scikit-learn Isolation Forest
Features per parcel:
  - assessed_value_rands (GV Roll 2022)
  - area_sqm
  - zone_type (IZS code — encoded)
  - suburb_median_value (computed from neighbours)
  - distance_to_cbd_m
  - flood_risk_score (from flood risk layer above)

Training: Fit on full GV Roll dataset (~500k parcels)
          Contamination parameter: 0.05 (5% expected anomalies)
Output per parcel: anomaly_score (-1 = outlier, 1 = normal)
Serve: inline FastAPI (model loaded at startup, <50ms inference)
Storage: model.pkl → R2, parcel scores → valuation_data table
```

### Natural Language Spatial Query

```
Input:  "Show me all undeveloped erven within 500m of a train station in Woodstock"
Output: GeoJSON FeatureCollection

Pipeline:
  1. POST /ml/nl-query {query: str, tenant_id: str}
  2. System prompt + query → Claude API (claude-sonnet-4-6)
  3. Claude returns structured JSON:
     {
       "spatial_op": "ST_DWithin",
       "target_table": "parcels",
       "filters": {"zone_type": "SR-1"},
       "reference_layer": "osm_train_stations",
       "distance_m": 500,
       "suburb_filter": "Woodstock"
     }
  4. Python validates the JSON (no raw SQL passed to DB — parameterised only)
  5. PostGIS query built from validated JSON → GeoJSON response

Cost estimate: ~1,000–2,000 tokens per query at claude-sonnet-4-6 pricing
              ≈ $0.003–0.006 per query
Rate limit:   50 NL queries/hour per tenant (gated by Analyst+ role)
```

---

## 9. OGC Services (pygeoapi — MVP)

pygeoapi mounts as a sub-application inside FastAPI at `/ogc`:

```
GET  /ogc                           → OGC API landing page
GET  /ogc/collections               → list published collections
GET  /ogc/collections/{id}/items    → WFS-style feature access
GET  /ogc/collections/{id}/items/{fid} → single feature
GET  /ogc/wms?SERVICE=WMS&...       → WMS GetMap / GetCapabilities
GET  /ogc/wfs?SERVICE=WFS&...       → WFS GetFeature
```

Published collections (Phase 1):
- `cape_town_zoning` — IZS zoning polygons
- `cape_town_parcels` — land parcels
- `cape_town_suburbs` — suburb boundaries
- `cape_town_flood_risk` — flood susceptibility raster
- `tenant_{slug}_uploads` — tenant-uploaded layers (auth required)

**Authentication for OGC:** Public collections unauthenticated. Tenant collections require API key in query param `?api_key={key}` (WFS/WMS clients cannot send headers easily).

---

## 10. Railway.app Deployment Configuration

### Services on Railway

| Service | Type | Config |
|---------|------|--------|
| `capegis-api` | Dockerfile | FastAPI + uvicorn workers |
| `capegis-worker` | Dockerfile (worker variant) | Celery worker, same image |
| `capegis-redis` | Railway Redis add-on | Broker + result backend |
| `capegis-flower` | Dockerfile (flower) | Celery monitoring (internal) |

### Environment variables required on Railway

```
# Supabase
SUPABASE_URL=https://{ref}.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...         # server-side only — never in Next.js
SUPABASE_JWT_SECRET=...              # or use JWKS URL instead

# Database (direct connection — bypass Supabase pooler for Python)
DATABASE_URL=postgresql+asyncpg://postgres:{pw}@db.{ref}.supabase.co:5432/postgres

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=capegis-rasters

# Celery
CELERY_BROKER_URL=redis://...         # Railway Redis internal URL
CELERY_RESULT_BACKEND=redis://...

# ML
HUGGINGFACE_TOKEN=...                 # for private model access if needed

# Claude API (NL spatial query)
ANTHROPIC_API_KEY=...

# Google Earth Engine (training sample export)
GEE_SERVICE_ACCOUNT=...
GEE_PRIVATE_KEY=...

# Sentry
SENTRY_DSN=...

# Security
ALLOWED_ORIGINS=https://capegis.vercel.app,https://{custom_domain}
```

---

## 11. Open Questions Raised by This Architecture

| ID | Question | Blocks | Verify by |
|----|----------|--------|-----------|
| OQ-NEW-A | Is GV Roll CSV or PDF? If CSV, MPA (OCR) is never needed | MPA | Download from odp.capetown.gov.za |
| OQ-NEW-B | Exact watercourse buffer distance in Trading Bay By-law — is it 10m? | MP1 trading bay suitability | Read CoCT Informal Trading By-law or ask drainage planner |
| OQ-NEW-C | Does Railway Redis add-on support Celery result backend natively? | MP5 | Test with Railway Redis URL in local Celery config |
| OQ-NEW-D | Prithvi model input band specification — HLS vs standard Sentinel-2 bands? | MP5 LULC | Read NASA-IMPACT/hls-foundation-os README |
| OQ-NEW-E | Does OpenCities Africa / HOT OSM have Cape Flats informal settlement polygons? | SAM pipeline decision | Check data.humdata.org + opencitiesafrica.org |
| OQ-NEW-F | SAM inference on Railway CPU tier — acceptable latency or GPU needed? | SAM milestone timing | Run SAM on a Cape Town test image on Railway CPU |

---

## 12. First Session Deliverable — MP0 Checklist

Before MP1 (Spatial Analysis API) can begin, MP0 must produce:

```
□ backend/ directory structure created (matches Section 2)
□ main.py: FastAPI app with lifespan, CORS for Vercel domain
□ core/config.py: Pydantic Settings loading all Railway env vars
□ core/auth.py: Supabase JWT validation via JWKS
□ core/database.py: async PostGIS engine (GeoAlchemy2 + asyncpg)
□ GET /health returns: { status: "ok", db: "connected", version: "0.1.0" }
□ Dockerfile builds without error (GDAL via OSGEO base image)
□ docker-compose.yml: api + celery-worker + redis services
□ requirements.txt: all production packages from Section 4
□ Railway: service created, env vars set, Dockerfile deploying
□ CORS: configured for https://capegis.vercel.app (no wildcard in production)
□ Supabase JWT: validated successfully with a real test token
□ MEMORY_ANCHOR.md: updated with Python backend locked decisions
□ docs/SESSION_LOG.md: MP0 entry written
```

---

*"I made a very detailed plan. My teacher said a plan this detailed means I understand
the problem. I think I also understand the problem. I am going to go eat now."*
*— Ralph Wiggum, Backend Architect*

---

**Document status:** DRAFT — Reader testing required (doc-coauthoring Stage 3)
**Next agent:** PYTHON-BACKEND-AGENT → MP0
**Next document:** GIS_FILE_PIPELINE_DESIGN.md (MP2)
