# Backend — CapeTown GIS Hub

> FastAPI geospatial API with Celery task queue, PostGIS, OGC services (pygeoapi), and ML inference pipelines.

For project overview, architecture diagram, and frontend docs see the [root README](../README.md).

---

## Directory Structure

```
backend/
├── main.py                        # FastAPI app factory + router registration
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── health.py          # Health check endpoint
│   │       ├── spatial.py         # Spatial analysis endpoints
│   │       ├── arcgis.py          # ArcGIS proxy + cache layer
│   │       ├── ogc.py             # OGC-compliant endpoints (pygeoapi)
│   │       ├── files.py           # File upload/download (R2 storage)
│   │       ├── jobs.py            # Background job management
│   │       └── ml.py              # ML inference endpoints
│   ├── core/
│   │   ├── config.py              # Pydantic Settings (env var loading)
│   │   ├── database.py            # SQLAlchemy async engine + session factory
│   │   └── auth.py                # Supabase JWT validation via JWKS
│   ├── services/
│   │   ├── spatial_analysis.py    # Geospatial computations (buffers, overlays, suitability)
│   │   ├── arcgis_client.py       # ArcGIS REST service client
│   │   ├── gis_processor.py       # Vector/raster format processing (GeoPandas, Rasterio)
│   │   ├── format_validators.py   # File format validation (Shapefile, GeoJSON, DXF, LAS)
│   │   └── r2_client.py           # Cloudflare R2 (S3-compatible) storage client
│   └── tasks/
│       ├── celery_app.py          # Celery application configuration
│       ├── cache_warmer.py        # Proactive tile/data cache warming
│       ├── flood_risk.py          # Flood risk assessment pipeline
│       ├── heat_island.py         # Urban heat island detection
│       ├── lulc_classification.py # Land-use/land-cover classification
│       ├── anomaly_detection.py   # Spatial anomaly detection
│       └── nl_spatial_query.py    # Natural language → spatial query (LLM-powered)
├── migrations/                    # Database migration scripts
├── tests/
│   ├── test_spatial.py            # Spatial analysis tests
│   ├── test_arcgis.py             # ArcGIS proxy tests
│   ├── test_ogc.py                # OGC endpoint tests
│   ├── test_files.py              # File upload/download tests
│   ├── test_mp5_celery.py         # Celery task tests
│   └── test_qa_mp8.py             # QA integration tests
├── Dockerfile                     # Production image (OSGEO/GDAL base)
├── docker-compose.yml             # Local dev stack (API + Celery + Redis + PostGIS)
├── requirements.txt               # Python dependencies
└── pygeoapi.config.yml            # pygeoapi OGC services configuration
```

---

## API Routes

All routes are registered in `main.py` and served under the FastAPI application.

| Route Module | Prefix         | Description                                                      |
|--------------|----------------|------------------------------------------------------------------|
| `health`     | `/health`      | Liveness/readiness probe                                         |
| `spatial`    | `/api/spatial` | Spatial analysis — buffers, overlays, zoning checks, suitability |
| `arcgis`     | `/api/arcgis`  | ArcGIS REST service proxy with response caching                  |
| `ogc`        | `/api/ogc`     | OGC-compliant feature/map services via pygeoapi                  |
| `files`      | `/api/files`   | File upload (Shapefile, GeoJSON, DXF, LAS) → R2 storage          |
| `jobs`       | `/api/jobs`    | Celery job submission, status polling, result retrieval          |
| `ml`         | `/api/ml`      | ML model inference (flood risk, LULC, anomaly detection)         |

Interactive API docs are available at:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## Services

| Service               | File                   | Purpose                                                                                           |
|-----------------------|------------------------|---------------------------------------------------------------------------------------------------|
| **Spatial Analysis**  | `spatial_analysis.py`  | Core GIS computations — watercourse buffers, zoning overlays, trading bay suitability scoring     |
| **ArcGIS Client**     | `arcgis_client.py`     | Fetches and caches data from Western Cape GIS services; mock fallback for unavailable CoCT layers |
| **GIS Processor**     | `gis_processor.py`     | Format conversion and processing (GeoPandas, Rasterio, COG generation)                            |
| **Format Validators** | `format_validators.py` | Validates uploaded geospatial files (Shapefile completeness, GeoJSON schema, DXF/LAS structure)   |
| **R2 Client**         | `r2_client.py`         | Cloudflare R2 object storage for raster tiles and processed datasets                              |

---

## Background Tasks (Celery)

Tasks are executed by Celery workers backed by **Redis 7** as both broker and result backend.

| Task                    | File                     | Description                                                                        |
|-------------------------|--------------------------|------------------------------------------------------------------------------------|
| **Cache Warmer**        | `cache_warmer.py`        | Pre-fetches ArcGIS layers and Martin tiles to warm the cache                       |
| **Flood Risk**          | `flood_risk.py`          | Computes flood risk scores from DEM + watercourse proximity                        |
| **Heat Island**         | `heat_island.py`         | Detects urban heat islands from Sentinel thermal bands                             |
| **LULC Classification** | `lulc_classification.py` | Land-use/land-cover classification from satellite imagery                          |
| **Anomaly Detection**   | `anomaly_detection.py`   | Identifies spatial anomalies in property/environmental datasets                    |
| **NL Spatial Query**    | `nl_spatial_query.py`    | Translates natural language questions into PostGIS spatial queries (Anthropic API) |

### Running the Worker

```bash
# Standalone
celery -A app.tasks.celery_app worker --loglevel=info --concurrency=2

# Via Docker Compose (starts worker + Redis + PostGIS)
docker compose up -d celery-worker
```

### Monitoring with Flower

```bash
celery -A app.tasks.celery_app flower --port=5555
# Dashboard: http://localhost:5555
```

---

## Development

### Prerequisites

- **Python** ≥ 3.11
- **Docker** & **Docker Compose** (for PostGIS + Redis)
- GDAL system libraries (provided automatically by the Docker image; for local dev see [gotchas](../docs/gotchas.md))

### Local Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start infrastructure
docker compose up -d postgis redis

# Run the API server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Docker Compose (Full Stack)

```bash
cd backend
docker compose up -d
```

This starts all four services:

| Service         | Container               | Port   | Description                             |
|-----------------|-------------------------|--------|-----------------------------------------|
| `api`           | `capegis-api`           | `8000` | FastAPI application (4 Uvicorn workers) |
| `celery-worker` | `capegis-celery-worker` | —      | Background task processor               |
| `redis`         | `capegis-redis`         | `6379` | Celery broker + result backend          |
| `postgis`       | `capegis-postgis`       | `5432` | PostgreSQL 17 + PostGIS 3.5             |

---

## Configuration

All configuration is loaded from environment variables via **Pydantic Settings** (`app/core/config.py`).

| Variable                    | Required | Default                                                         | Description                                |
|-----------------------------|----------|-----------------------------------------------------------------|--------------------------------------------|
| `DATABASE_URL`              | ✅        | `postgresql+asyncpg://postgres:postgres@localhost:5432/capegis` | Async database connection string           |
| `SUPABASE_URL`              | ✅        | —                                                               | Supabase project URL                       |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅        | —                                                               | Supabase service role key (JWT validation) |
| `CELERY_BROKER_URL`         | ✅        | `redis://localhost:6379/0`                                      | Redis broker URL                           |
| `CELERY_RESULT_BACKEND`     | ✅        | `redis://localhost:6379/0`                                      | Redis result backend URL                   |
| `R2_ACCOUNT_ID`             |          | —                                                               | Cloudflare R2 account ID                   |
| `R2_ACCESS_KEY_ID`          |          | —                                                               | R2 access key                              |
| `R2_SECRET_ACCESS_KEY`      |          | —                                                               | R2 secret key                              |
| `R2_BUCKET_NAME`            |          | `capegis-rasters`                                               | R2 bucket name                             |
| `SENTRY_DSN`                |          | —                                                               | Sentry DSN for error tracking              |
| `HUGGINGFACE_TOKEN`         |          | —                                                               | HuggingFace token for ML models            |
| `ANTHROPIC_API_KEY`         |          | —                                                               | Anthropic API key (NL spatial query)       |
| `ALLOWED_ORIGINS`           |          | —                                                               | CORS allowed origins (comma-separated)     |
| `LOG_LEVEL`                 |          | `INFO`                                                          | Logging verbosity                          |
| `DEBUG`                     |          | `false`                                                         | Debug mode                                 |

---

## Testing

```bash
# Run all tests
PYTHONPATH=. python -m pytest tests/ -v

# Run a specific test file
PYTHONPATH=. python -m pytest tests/test_spatial.py -v
```

Tests require the following environment variables (use placeholders for CI):

```bash
export SUPABASE_URL=https://placeholder.supabase.co
export SUPABASE_ANON_KEY=placeholder
export SUPABASE_SERVICE_ROLE_KEY=placeholder
export DATABASE_URL=postgresql+asyncpg://test:test@localhost:5432/test
export REDIS_URL=redis://localhost:6379/0
```

### Linting & Security

```bash
# Lint
ruff check app/ --output-format=github

# Format check
ruff format --check app/

# Security scan
bandit -r app/ -ll
```

---

## Deployment

The backend deploys to **Railway** via GitHub Actions ([`deploy.yml`](../.github/workflows/deploy.yml)).

### Production Docker Image

The [`Dockerfile`](Dockerfile) is based on `ghcr.io/osgeo/gdal:ubuntu-small-3.9.0` which provides:

- GDAL, GEOS, and PROJ system libraries (no pip install needed)
- Python 3.11 runtime
- Non-root `appuser` for security

```bash
# Build locally
docker build -t capegis-api .

# Run locally
docker run -p 8000:8000 --env-file .env capegis-api
```

### Production Configuration

- **Workers**: 4 Uvicorn workers (`CMD` in Dockerfile)
- **Health check**: `GET /health` — checked every 30 seconds
- **CORS**: Restricted to `ALLOWED_ORIGINS` (localhost + `capegis.vercel.app` by default)
- **Structured logging**: via `structlog` with JSON output

---

## Further Reading

| Document                                                                        | Description                                       |
|---------------------------------------------------------------------------------|---------------------------------------------------|
| [`docs/PYTHON_BACKEND_ARCHITECTURE.md`](../docs/PYTHON_BACKEND_ARCHITECTURE.md) | Full architecture specification (all 10 sections) |
| [`docs/API_STATUS.md`](../docs/API_STATUS.md)                                   | External API endpoint availability status         |
| [`docs/DATA_CATALOG.md`](../docs/DATA_CATALOG.md)                               | Geospatial data source catalog                    |
| [`docs/gotchas.md`](../docs/gotchas.md)                                         | Known issues (includes GDAL pip gotcha)           |
| [`docs/OPEN_QUESTIONS.md`](../docs/OPEN_QUESTIONS.md)                           | Blocking decisions requiring verification         |
