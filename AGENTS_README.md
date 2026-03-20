# AGENTS_README.md — Agent Fleet Map

> Auto-generated from `AGENTS.md`. Updated 2026-03-13 by master agent (chkpt-0001).

## Canonical Agent Fleet (11 agents)

| Role | File | Responsibilities |
|---|---|---|
| **Copilot orchestration** | `.github/agents/orchestrator.agent.md` | Plan/delegate/review across all agents |
| **Infra / architecture** | `.github/agents/infra-agent.agent.md` | System docs, Docker, Vercel deployment |
| **GIS map** | `.github/agents/map-agent.agent.md` | MapLibre layers, Martin MVT, vector tiles |
| **Data ingestion** | `.github/agents/data-agent.agent.md` | LIVE→CACHED→MOCK fallback, ETL, format support |
| **Spatial analysis** | `.github/agents/spatial-agent.agent.md` | PostGIS RPCs, polygon analysis, intersections |
| **Database** | `.github/agents/db-agent.agent.md` | Schema migrations, RLS, RBAC, PostGIS |
| **3D visualization** | `.github/agents/cesium-agent.agent.md` | CesiumJS, 3D Tiles, Ion asset management |
| **Spatial AI** | `.github/agents/immersive-reconstruction-agent.agent.md` | NeRF, 3DGS, 4DGS replay, Stitch |
| **Flight tracking** | `.github/agents/flight-tracking-agent.agent.md` | OpenSky ADS-B, historical tracks, airspace |
| **Testing** | `.github/agents/test-agent.agent.md` | QA, Playwright E2E, Vitest unit tests |
| **File formats** | `.github/agents/formats-agent.agent.md` | GeoJSON, GeoTIFF, Shapefile, KML import |

## MCP Gateway

| Endpoint | Description | Status |
|---|---|---|
| `GET http://localhost:3001/sse?serverId={name}` | SSE stream | ✅ RUNNING |
| `POST http://localhost:3001/message?sessionId={id}` | Message relay | ✅ RUNNING |
| `GET http://localhost:3001/health` | Health + catalog | ✅ RUNNING |

## MCP Tool Assignment

| Agent | MCP Tools | Status |
|---|---|---|
| `cesium-agent` | `cesium`, `cesium-ion` | ✅ ENABLED |
| `data-agent` | `formats`, `postgres` | ✅ ENABLED |
| `flight-tracking-agent` | `openaware`, `opensky` | ✅ ENABLED |
| `immersive-reconstruction` | `stitch`, `nerfstudio` | ✅ ENABLED |
| `infra-agent` | `doc-state`, `docker`, `vercel` | ⚠️ PARTIAL (docker blocked) |
| `generalist`/`tester` | `computerUse`, `playwright`, `localstack` | ✅ ENABLED |
| `researcher` | `exa`, `context7`, `gemini-deep-research` | ✅ ENABLED |
| `planner` | `sequentialthinking` | ⚠️ BLOCKED (docker.sock) |

## Task Delegation Matrix

| Task Type | Primary Agent | Tools |
|---|---|---|
| UI/component fixes | Antigravity (this) + orchestrator review | File edit + browser |
| Schema changes | `db-agent` | `postgres` MCP |
| 3D asset work | `cesium-agent` | `cesium` + `cesium-ion` |
| Data pipeline | `data-agent` | `formats` + `postgres` |
| E2E testing | `test-agent` | `playwright` |
| Research / docs | `researcher` | `exa` + `context7` |
