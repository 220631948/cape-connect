# Backend — CapeTown GIS Hub

> FastAPI geospatial service handling pygeoapi OGC integrations, Celery worker orchestration, PostGIS interactions, and background analytical queries.

For the project overview and architecture diagram, see the [Root README](../README.md).

---

## Technical Stack

- **API Framework**: FastAPI, Uvicorn, Pydantic v2
- **Database & ORM**: PostgreSQL 17, PostGIS 3.5, GeoAlchemy2, asyncpg, SQLAlchemy (async path)
- **Geoprocessing**: GeoPandas, Shapely, pyproj, Rasterio
- **Task Queue**: Celery 5 + Redis 7
- **Authentication**: python-jose (Supabase JWT Validation)
- **OGC Interoperability**: pygeoapi

---

## Environment Configuration

Store secrets inside `backend/.env`.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | YES | Format: `postgresql+asyncpg://user:pass@host:5432/capegis` |
| `SUPABASE_URL` | YES | Host Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY`| YES | Role key to orchestrate JWT overrides |
| `CELERY_BROKER_URL` | YES | Redis connection for queues |
| `CELERY_RESULT_BACKEND` | YES | Redis connection for queue payloads |
| `ALLOWED_ORIGINS` | NO | CORS allowed list (comma separated) |

---

## Setup & Execution

### Prerequisites

- **Python 3.11+**
- **Docker Compose** (for providing Redis and PostGIS)

### Installation

```bash
# Move into the backend
cd backend

# Setup Local Virtual Environment
python -m venv .venv
source .venv/bin/activate

# Install requirements (DO NOT PIP INSTALL GDAL GLOBALLY)
pip install -r requirements.txt
```
> **Gotcha**: The production OSGEO GDAL instances derive from the Dockerfile, not native pip builds due to C-extension conflicts. Read `docs/gotchas.md` for local OS installation overrides.

### Running Infrastructures

```bash
# Starts necessary PostGIS and Redis stores
docker compose up -d

# Spin up FastAPI application (localhost:8000)
uvicorn main:app --reload
```

---

## Services & APIs Documentation

- **Interactive API Playgrounds**:
  - Swagger: `http://localhost:8000/docs`
  - ReDoc: `http://localhost:8000/redoc`

### Key Domains
- `/api/spatial`: Performs buffer intersections, area checks, and bounding computations.
- `/api/arcgis`: Mapped proxy to fetch spatial items directly from Western Cape GIS systems.
- `/api/jobs`: Interface for enqueuing and checking task run states.
- `/api/ogc`: Compliant pygeoapi map layers.

---

## Background Orchestration (Celery)

The backend utilizes Celery workers managed via Redis queues for computationally expensive ML algorithms (HuggingFace integrations), heatmap processing, and large spatial queries.

**To boot a celery worker manually:**
```bash
celery -A app.tasks.celery_app worker --loglevel=info --concurrency=2
```

Common task scripts located in `app/tasks/`:
- `cache_warmer.py` — pregenerates tiles and populates Redis bounds.
- `flood_risk.py` / `heat_island.py` — Analytical ML endpoints.

---

## Database Integrations

Migrations for PostgreSQL tables are natively defined under the Supabase schemas, and synchronized async via SQLAlchemy ORMs. Raw geometric data is directly mapped using `GeoAlchemy2` to PostGIS columns.

## Security Considerations

- API Routes are protected via Supabase `python-jose` integrations that expect Bearer JWTs matching explicit roles.
- SQL injections are guarded via async SQLAlchemy parameterized bindings.
- Security and linter policies are strictly enforced locally via `ruff` and `bandit`:

```bash
# Run Security checks
bandit -r app/ -ll

# Run Lint checks
ruff check app/
```
