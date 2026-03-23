# 🌍 CapeTown GIS Hub

> **Multi-tenant PWA for spatial property intelligence** — City of Cape Town & Western Cape Province.

[![CI](https://github.com/<owner>/capegis/actions/workflows/ci.yml/badge.svg)](https://github.com/<owner>/capegis/actions/workflows/ci.yml)
[![Deploy](https://github.com/<owner>/capegis/actions/workflows/deploy.yml/badge.svg)](https://github.com/<owner>/capegis/actions/workflows/deploy.yml)

## Overview

CapeTown GIS Hub (**capegis**) is a progressive web application delivering geospatial intelligence for property
analysis, urban planning, and environmental monitoring. The platform combines interactive 2D/3D mapping with real-time
data overlays, ML-powered analytics, and multi-tenant role-based access.

This repository is structured as a mono-repo. The core frontend framework (Next.js) resides in the root directory and
`src/`, while the Python-based geospatial backend services reside in the `backend/` directory.

### Project Navigation

- [**Root Repository**](#) — High-level architecture and quickstart setups.
- [**Frontend Documentation**](./frontend/README.md) — UI stack, Next.js setups, components, and state management.
- [**Backend Documentation**](./backend/README.md) — FastAPI, PostGIS, ML pipelines, and Celery jobs.

---

## System Architecture

**Hybrid Cloud Architecture:** Vercel + Supabase + GCP

The platform uses a hybrid approach to balance cost, performance, and POPIA compliance:

- **Vector data** (parcels, zoning, overlays) stays in **Supabase PostGIS** — served as MVT via Martin
- **Raster COGs** (satellite imagery, DEMs, NDVI) live in **GCS africa-south1** — served via HTTP 206 range requests
- **Auth + Realtime** remain on **Supabase** — JWT validation, RLS, tenant isolation
- **Frontend** stays on **Vercel Free** — CDN-delivered Next.js with edge functions

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL CDN (Edge)                         │
│  Next.js SSR · MapLibre GL · CesiumJS · Zustand             │
│  NEXT_PUBLIC_RASTER_BASE_URL → Cloud Run proxy              │
└──────────┬──────────────────────┬───────────────────────────┘
           │                      │
           ▼                      ▼
┌─────────────────────┐  ┌──────────────────────────────────┐
│   SUPABASE (Free)   │  │   GCP africa-south1 (POPIA)      │
│ ┌─────────────────┐ │  │ ┌──────────────────────────────┐ │
│ │ PostGIS 17      │ │  │ │ GCS: capegis-rasters         │ │
│ │ Vector tiles    │ │  │ │ COG + STAC catalog           │ │
│ │ OUT-DB raster   │◄├──┤►│ HTTP 206 range requests      │ │
│ │ metadata        │ │  │ │ Standard → Nearline (90d)    │ │
│ ├─────────────────┤ │  │ ├──────────────────────────────┤ │
│ │ Martin MVT      │ │  │ │ Cloud Run (raster processor) │ │
│ │ Supabase Auth   │ │  │ │ 512MB · max 3 instances      │ │
│ │ Realtime        │ │  │ │ Scale-to-zero (free tier)    │ │
│ └─────────────────┘ │  │ ├──────────────────────────────┤ │
│                     │  │ │ Earth Engine → GCS export     │ │
│                     │  │ │ Deadline: Apr 27, 2026        │ │
└─────────────────────┘  └──────────────────────────────────┘
```

```mermaid
graph TD
    subgraph Frontend [Next.js Vercel Edge]
        UI[React 19 / Tailwind 4]
        Map[MapLibre GL / CesiumJS]
        State[Zustand / IndexedDB]
    end

    subgraph Backend [FastAPI Railway Backend]
        API[FastAPI / Uvicorn]
        Auth[Supabase Auth]
        Tasks[Celery / Redis]
        GIS[GeoPandas / Rasterio]
    end

    subgraph Data [Data Layer]
        DB[(PostGIS 17 — vectors + OUT-DB raster metadata)]
        GCS[(GCS africa-south1 — COG rasters)]
        Martin[Martin Vector Tiles]
    end

    subgraph GCP [GCP Raster Offload]
        CloudRun[Cloud Run Processor]
        GEE[Earth Engine Export]
    end

    UI <--> API
    Map <--> Martin
    Map -- HTTP 206 --> GCS
    API <--> DB
    API <--> GCS
    Tasks <--> DB
    CloudRun --> GCS
    GEE --> GCS
```

---

## Tech Stack Detection

- **Frontend Core**: Next.js 16 (App Router), React 19, TypeScript
- **UI & Styling**: Tailwind CSS 4, Zustand 5
- **Mapping Stack**: MapLibre GL 4, CesiumJS, Martin MVT
- **Backend Core**: FastAPI, Uvicorn, Python 3.11+, Celery
- **Geospatial Processing**: GeoPandas, Shapely, GeoAlchemy2, Rasterio
- **Database / Infrastructure**: PostgreSQL 17 + PostGIS 3.5, Redis 7, LocalStack, Supabase Auth
- **CI/CD**: GitHub Actions, Vercel (Frontend), Railway (Backend)
- **Testing**: Vitest, Playwright, Pytest

---

## Quick Start

### 1. Prerequisites

- **Node.js** ≥ 20 and **npm**
- **Python** ≥ 3.11
- **Docker** & **Docker Compose**

### 2. Base Setup

```bash
# Clone the repository
git clone https://github.com/<owner>/capegis.git
cd capegis

# Run Docker dependencies (Postgres, Martin, LocalStack)
docker compose up -d
```

### 3. Frontend / UI Setup

```bash
# Install NPM dependencies
npm ci

# Configure environment
cp .env.example .env.local

# Start the frontend application (http://localhost:3000)
npm run dev
```

👉 *[See Frontend README](./frontend/README.md) for full details.*

### 4. Backend Setup

```bash
cd backend

# Setup Python environment
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Start Backend APIs (http://localhost:8000)
uvicorn main:app --reload
```

👉 *[See Backend README](./backend/README.md) for full details.*

---

## Common Scripts

| Domain   | Command                     | Description                             |
|----------|-----------------------------|-----------------------------------------|
| Frontend | `npm run dev`               | Next.js Dev Server (localhost:3000)     |
| Frontend | `npm run test:e2e`          | Run Playwright End-to-End tests         |
| Backend  | `uvicorn main:app --reload` | FastAPI Dev Server (localhost:8000)     |
| Backend  | `pytest tests/`             | Run Pytest unit and integration tests   |
| Docker   | `docker compose up -d`      | Boot up local database and dev services |

---

## Security & Workflow Checks

- **Dependabot**: Automatically enabled for NPM and Pip dependencies.
- **Pre-commit**: Linters (Prettier, ESLint, Ruff) enforce syntax and formatting.
- **CI Pipelines**: Found under `.github/workflows/` handling PR validations, type checking, security static scans (
  CodeQL, Bandit), and deployments.
- **Secrets Management**: Relies heavily on Supabase RLS and environment variable isolation (`.env` files are
  `.gitignore`d).

## Contributing

1. Check the [OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) for blocking items.
2. Read the [architecture rules](docs/PYTHON_BACKEND_ARCHITECTURE.md).
3. Ensure CI completes successfully before creating pull requests.
