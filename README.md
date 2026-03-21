# 🌍 CapeTown GIS Hub

> **Multi-tenant PWA for spatial property intelligence** — City of Cape Town & Western Cape Province.

[![CI](https://github.com/<owner>/capegis/actions/workflows/ci.yml/badge.svg)](https://github.com/<owner>/capegis/actions/workflows/ci.yml)
[![CodeQL](https://github.com/<owner>/capegis/actions/workflows/codeql.yml/badge.svg)](https://github.com/<owner>/capegis/actions/workflows/codeql.yml)
[![Deploy](https://github.com/<owner>/capegis/actions/workflows/deploy.yml/badge.svg)](https://github.com/<owner>/capegis/actions/workflows/deploy.yml)

---

## Overview

CapeTown GIS Hub (**capegis**) is a progressive web application that delivers geospatial intelligence for property
analysis, urban planning, and environmental monitoring across Cape Town and the Western Cape. The platform combines
interactive 2D/3D mapping with real-time data overlays, ML-powered analytics, and multi-tenant role-based access.

### Key Capabilities

- **Interactive Mapping** — MapLibre GL (2D) + CesiumJS (3D) with Martin vector tile server
- **Spatial Analysis** — Zoning compliance, flood risk, heat-island detection, LULC classification
- **Property Intelligence** — Valuation data, trading bay suitability, watercourse buffer analysis
- **Live Data Feeds** — OpenSky flight telemetry, Sentinel satellite imagery, ArcGIS service layers
- **Offline-First** — Service worker (Serwist), Dexie (IndexedDB), DuckDB-WASM for client-side analytics
- **Multi-Tenant Auth** — Supabase Auth with role-based presets and admin impersonation
- **Background Processing** — Celery workers for ML inference, cache warming, and raster pipelines

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel Edge (cpt1)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Next.js 16 (React 19) — SSR + App Router + PWA         │   │
│  │  MapLibre GL · CesiumJS · Recharts · Zustand · Tailwind │   │
│  └────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────┼─────────────────────────────────────┐
│                     Railway (Backend)                            │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │  FastAPI (Uvicorn) — REST + OGC (pygeoapi)               │   │
│  │  GeoAlchemy2 · Shapely · GeoPandas · Rasterio            │   │
│  └────────┬──────────────────────────────┬──────────────────┘   │
│           │                              │                      │
│  ┌────────▼────────┐           ┌─────────▼───────────┐         │
│  │  PostGIS 17     │           │  Celery + Redis 7   │         │
│  │  (kartoza)      │           │  ML tasks · caching  │         │
│  └─────────────────┘           └─────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
         │                                │
    Martin Tiles                   Cloudflare R2
    (vector MVT)                   (raster storage)
```

| Layer                                  | Directory                       | README                                |
|----------------------------------------|---------------------------------|---------------------------------------|
| **Frontend** — UI, maps, state, PWA    | [`src/`](src/README.md)         | [→ Frontend README](src/README.md)    |
| **Backend** — APIs, services, ML tasks | [`backend/`](backend/README.md) | [→ Backend README](backend/README.md) |

---

## Tech Stack

| Category                | Technology                                            |
|-------------------------|-------------------------------------------------------|
| **Frontend Framework**  | Next.js 16 · React 19 · TypeScript 5                  |
| **Styling**             | Tailwind CSS 4                                        |
| **Mapping**             | MapLibre GL 4 · CesiumJS · Martin (MVT)               |
| **State Management**    | Zustand 5                                             |
| **Offline / Client DB** | Serwist (SW) · Dexie (IndexedDB) · DuckDB-WASM        |
| **Auth**                | Supabase Auth + RLS                                   |
| **Backend Framework**   | FastAPI · Uvicorn · Pydantic v2                       |
| **GIS Libraries**       | GeoPandas · Shapely · GeoAlchemy2 · Rasterio · pyproj |
| **OGC Services**        | pygeoapi                                              |
| **Task Queue**          | Celery 5 · Redis 7                                    |
| **Database**            | PostgreSQL 17 + PostGIS 3.5 (kartoza)                 |
| **Object Storage**      | Cloudflare R2 (S3-compatible)                         |
| **Monitoring**          | Sentry (frontend + backend) · structlog               |
| **Payments**            | Stripe                                                |
| **Testing**             | Vitest · Playwright · pytest · Testing Library        |
| **CI/CD**               | GitHub Actions · Vercel · Railway                     |

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 20 and **npm**
- **Python** ≥ 3.11
- **Docker** & **Docker Compose** (for PostGIS, Martin, Redis)

### 1 — Clone & Install

```bash
git clone https://github.com/<owner>/capegis.git
cd capegis

# Frontend dependencies
npm ci

# Backend dependencies
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 2 — Infrastructure (Docker)

```bash
# Start PostGIS + Martin + LocalStack (root docker-compose)
docker compose up -d

# Start backend stack (API + Celery worker + Redis + PostGIS)
cd backend && docker compose up -d
```

### 3 — Environment Variables

Copy the example env files and fill in your credentials:

```bash
cp .env.example .env.local   # Frontend (Next.js)
cp backend/.env.example backend/.env  # Backend (FastAPI)
```

See [Environment Configuration](#environment-configuration) below for the full variable reference.

### 4 — Run Development Servers

```bash
# Terminal 1 — Frontend (http://localhost:3000)
npm run dev

# Terminal 2 — Backend (http://localhost:8000)
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## Environment Configuration

### Frontend (`.env.local`)

| Variable                        | Required | Description                                               |
|---------------------------------|----------|-----------------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅        | Supabase project URL                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅        | Supabase anonymous (public) key                           |
| `SUPABASE_SERVICE_ROLE_KEY`     | ✅        | Supabase service role key (server-side only)              |
| `SENTRY_DSN`                    |          | Sentry DSN for error tracking                             |
| `MARTIN_URL`                    |          | Martin tile server URL (default: `http://localhost:3005`) |
| `STRIPE_SECRET_KEY`             |          | Stripe secret key for payments                            |

### Backend (`backend/.env`)

| Variable                    | Required | Description                              |
|-----------------------------|----------|------------------------------------------|
| `DATABASE_URL`              | ✅        | PostgreSQL+asyncpg connection string     |
| `SUPABASE_URL`              | ✅        | Supabase project URL                     |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅        | Supabase service role key                |
| `CELERY_BROKER_URL`         | ✅        | Redis URL for Celery broker              |
| `CELERY_RESULT_BACKEND`     | ✅        | Redis URL for Celery results             |
| `R2_ACCOUNT_ID`             |          | Cloudflare R2 account ID                 |
| `R2_ACCESS_KEY_ID`          |          | R2 access key                            |
| `R2_SECRET_ACCESS_KEY`      |          | R2 secret key                            |
| `R2_BUCKET_NAME`            |          | R2 bucket (default: `capegis-rasters`)   |
| `SENTRY_DSN`                |          | Sentry DSN for backend monitoring        |
| `HUGGINGFACE_TOKEN`         |          | HuggingFace token for ML models          |
| `ANTHROPIC_API_KEY`         |          | Anthropic API key for NL spatial queries |
| `ALLOWED_ORIGINS`           |          | CORS origins (comma-separated)           |
| `LOG_LEVEL`                 |          | Logging level (default: `INFO`)          |

> ⚠️ **Never commit `.env` or `.env.local` files.** They are git-ignored. See `.gitignore`.

---

## Scripts

### Frontend

| Command              | Description                            |
|----------------------|----------------------------------------|
| `npm run dev`        | Start Next.js dev server               |
| `npm run build`      | Production build                       |
| `npm run start`      | Start production server                |
| `npm run lint`       | ESLint check                           |
| `npm run typecheck`  | TypeScript type-check (`tsc --noEmit`) |
| `npm run test`       | Run unit tests (Vitest)                |
| `npm run test:watch` | Run tests in watch mode                |
| `npm run test:e2e`   | Run E2E tests (Playwright)             |

### Backend

| Command                                                 | Description              |
|---------------------------------------------------------|--------------------------|
| `uvicorn main:app --reload`                             | Start FastAPI dev server |
| `pytest tests/ -v`                                      | Run backend tests        |
| `ruff check app/`                                       | Lint Python code         |
| `ruff format app/`                                      | Format Python code       |
| `celery -A app.tasks.celery_app worker --loglevel=info` | Start Celery worker      |

---

## CI/CD

All pipelines run on **GitHub Actions** and are defined in [`.github/workflows/`](.github/workflows/).

| Workflow                                | Trigger               | What it does                                                                            |
|-----------------------------------------|-----------------------|-----------------------------------------------------------------------------------------|
| **CI** (`ci.yml`)                       | Push/PR to `main`     | Frontend lint + typecheck + Vitest + build; Backend ruff + bandit + pytest; Secret scan |
| **Deploy** (`deploy.yml`)               | Push to `main` / PR   | Vercel preview/production (frontend); Railway deploy + health check (backend)           |
| **CodeQL** (`codeql.yml`)               | Push/PR + weekly cron | Static analysis security scanning (JS/TS + Python)                                      |
| **PR Validation** (`pr-validation.yml`) | Pull requests         | PR standards enforcement                                                                |
| **Auto Rebase** (`auto-rebase.yml`)     | Comment trigger       | Automated branch rebasing                                                               |

---

## Documentation

| Document                                                                     | Description                                 |
|------------------------------------------------------------------------------|---------------------------------------------|
| [`docs/PYTHON_BACKEND_ARCHITECTURE.md`](docs/PYTHON_BACKEND_ARCHITECTURE.md) | Full backend architecture specification     |
| [`docs/API_STATUS.md`](docs/API_STATUS.md)                                   | External API endpoint status & availability |
| [`docs/DATA_CATALOG.md`](docs/DATA_CATALOG.md)                               | Geospatial data source catalog              |
| [`docs/OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md)                           | Blocking decisions tracker                  |
| [`docs/QGIS_CONNECTION_GUIDE.md`](docs/QGIS_CONNECTION_GUIDE.md)             | QGIS integration guide                      |
| [`docs/gotchas.md`](docs/gotchas.md)                                         | Known issues and workarounds                |
| [`PLAN.md`](PLAN.md)                                                         | Project milestone plan                      |
| [`MEMORY_ANCHOR.md`](MEMORY_ANCHOR.md)                                       | Session continuity anchor                   |

---

## Security

- **Secret Scanning** — CI pipeline scans every push for hardcoded API keys, AWS credentials, GitHub PATs, Supabase
  service role JWTs, and private keys.
- **CodeQL** — Weekly static analysis for JavaScript/TypeScript and Python vulnerabilities.
- **Bandit** — Python security linter runs on every backend CI pass.
- **CORS** — Configurable `ALLOWED_ORIGINS` in backend; restricted to known domains in production.
- **Non-root Container** — Backend Dockerfile runs as `appuser`, not root.
- **Supabase RLS** — Row-level security on all database tables.
- **Environment Isolation** — All secrets loaded from environment variables; `.env` files are git-ignored.
- **Dependabot** — Automated dependency vulnerability alerts via [`.github/dependabot.yml`](.github/dependabot.yml).

---

## License

Private — All rights reserved.
