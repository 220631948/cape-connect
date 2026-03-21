# 🧠 ARCHITECTURE.md — CapeTown GIS Hub AI Brain Map

> Navigation map for all AI agents. Read before touching any file.
> **Cross-refs:
** [AGENTS.md](./AGENTS.md) · [SKILLS.md](./SKILLS.md) · [COMMANDS.md](./COMMANDS.md) · [HOOKS.md](./HOOKS.md) · [MCP_SERVERS.md](./MCP_SERVERS.md) · [PLAN.md](../PLAN.md) · [CLAUDE.md](../CLAUDE.md)
> `__generated_by: aris-unit-1 | __timestamp: 2026-03-14`

---

## 1 · 🗂️ Stack Overview

| Layer            | Technology                         | Version  | Notes                          |
|------------------|------------------------------------|----------|--------------------------------|
| Framework        | Next.js (App Router, RSC)          | 15       | Vercel-hosted                  |
| UI Runtime       | React                              | 19       | Server + Client Components     |
| Mapping          | MapLibre GL JS                     | 4        | NOT Leaflet / NOT Mapbox GL JS |
| State            | Zustand                            | latest   | Client stores only             |
| Styling          | Tailwind CSS                       | latest   | Dark mode default              |
| Charts           | Recharts                           | latest   | Dashboard widgets              |
| PWA              | Serwist                            | latest   | Tile caching zoom 8–12         |
| Offline storage  | Dexie.js                           | latest   | IndexedDB                      |
| Offline tiles    | PMTiles                            | latest   | Vector tiles, Supabase Storage |
| Spatial (client) | Turf.js                            | latest   | < 10 k features; PostGIS above |
| Database         | Supabase (PostgreSQL 15 + PostGIS) | 3.x      | EPSG:4326 storage              |
| Auth             | Supabase Auth (GoTrue)             | latest   | Email/pw + Google OAuth        |
| Tile server      | Martin (Rust MVT)                  | latest   | Docker, DigitalOcean Droplet   |
| Testing (unit)   | Vitest                             | 3        | vi.mock stubs for MapLibre     |
| Testing (e2e)    | Playwright                         | 1        | Lighthouse, axe-core           |
| CI/CD            | GitHub Actions                     | —        | ci.yml, spatial-validation.yml |
| Errors           | Sentry                             | optional | Gracefully absent              |

---

## 2 · 📁 Source Module Graph

```
src/
├── app/                    Next.js App Router — pages, layouts, API routes
│   └── api/                Server-side API routes (tile proxy, analysis, export)
├── components/
│   ├── map/                MapLibre canvas, layer controls, satellite toggle
│   ├── analysis/           AnalyticsDashboard, AnalysisResultPanel, ExportPanel
│   ├── search/             Property search, autocomplete
│   ├── dashboard/          Recharts widgets (bar, line, pie, choropleth)
│   └── shared/             DataBadge, FallbackWrapper, AuthGuard
├── lib/
│   ├── supabase/           Client + server Supabase instances
│   ├── auth/               Session, tenant context injection, role checks
│   ├── tiles/              Martin source helpers, PMTiles loader
│   └── spatial/            Turf.js wrappers, bbox helpers
├── hooks/                  useMap, useAuth, useTenant, useSearch, useSpatial
├── types/                  Shared TypeScript interfaces and enums
└── public/mock/            Fallback GeoJSON (suburbs, zoning, parcels, flights)
```

**Key constraints:** Files ≤ 300 lines (Rule 7). MapLibre init once per page with ref guard.

---

## 3 · 🔄 Data Flows

### 3a · Client → API → PostGIS → Martin pipeline

```
Browser → Next.js API Route → Supabase (PostGIS query, RLS applied)
                           → Martin MVT (tile requests > 10 k features)
                           → Supabase Storage (PMTiles fetch)
```

### 3b · Three-Tier Fallback (Rule 2)

```
LIVE   → External API / Martin tile server
CACHED → Supabase api_cache table (TTL varies by layer)
MOCK   → public/mock/*.geojson  ← NEVER omit; always present
```

Every data component renders `[SOURCE · YEAR · LIVE|CACHED|MOCK]` badge (Rule 1).

### 3c · Auth Flow

```
User → Supabase GoTrue (email/pw | Google OAuth)
     → JWT (1 h lifetime, 7 d refresh)
     → Next.js middleware injects app.current_tenant into PG session
     → RLS policies enforce tenant isolation on every query
```

Role hierarchy: `GUEST → VIEWER → ANALYST → POWER_USER → TENANT_ADMIN → PLATFORM_ADMIN`

---

## 4 · 🤖 Agent Ecosystem Map (30 agents)

### 🛡️ Compliance (P0 — always active)

| Agent                 | Domain                                             |
|-----------------------|----------------------------------------------------|
| COMPLIANCE-AGENT      | Pre-merge governance gate — all 10 CLAUDE.md rules |
| BADGE-AUDIT-AGENT     | Rule 1 badge scanner                               |
| FALLBACK-VERIFY-AGENT | Rule 2 three-tier fallback verifier                |

### 🔬 M17 Agents (P1)

| Agent              | Domain                                       |
|--------------------|----------------------------------------------|
| M17-ANALYSIS-AGENT | Advanced geospatial analysis (M17)           |
| EXPORT-AGENT       | Multi-format export, ExportPanel (M12/13/17) |
| PROVENANCE-AGENT   | Dataset lineage tracking                     |

### 🔧 Quality Agents (P2/P3)

| Agent               | Domain                                  |
|---------------------|-----------------------------------------|
| MCP-HEALTH-AGENT    | 21 MCP server health monitor            |
| TEST-COVERAGE-AGENT | Vitest/Playwright coverage + stub gen   |
| PERFORMANCE-AGENT   | CWV (LCP/INP/CLS) + tile render budgets |
| PROJECT-AUDIT-AGENT | Full 8-area pre-DoD health audit        |

### 🏁 Milestone Agents (M1–M14)

| Agent           | Milestone(s) | Domain                             |
|-----------------|--------------|------------------------------------|
| DB-AGENT        | M1           | PostGIS schema, RLS, migrations    |
| AUTH-AGENT      | M2           | Supabase Auth, JWT, guest mode     |
| MAP-AGENT       | M3, M4c      | MapLibre canvas, PWA tile caching  |
| DATA-AGENT      | M4a, M6      | CT open data ingest, GV Roll 2022  |
| OVERLAY-AGENT   | M4b, M5      | MVT overlays, zoning/risk layers   |
| TEST-AGENT      | M4d, M14     | Test harness, Playwright E2E       |
| SEARCH-AGENT    | M7           | Property search, PostGIS FTS       |
| SPATIAL-AGENT   | M8           | Turf.js + PostGIS spatial analysis |
| SAVE-AGENT      | M9           | Saved searches, Dexie.js offline   |
| DETAILS-AGENT   | M10          | Property detail panel, Street View |
| DASHBOARD-AGENT | M11          | Recharts analytics dashboard       |
| EXPORT-AGENT    | M12, M13     | GeoJSON/CSV/SHP/PDF export         |

### 🛠️ Supporting Agents (on-demand)

| Agent           | Domain                                |
|-----------------|---------------------------------------|
| ORCHESTRATOR    | Milestone sequencer, handoff protocol |
| TILE-AGENT      | PMTiles / Tippecanoe / Martin config  |
| RESEARCHER      | CT GIS data research, deerflow loop   |
| PLANNER         | Architecture, spec writing            |
| CESIUM-AGENT    | CesiumJS + 3D Tiles                   |
| FLIGHT-AGENT    | OpenSky Network, Cape Town airspace   |
| IMMERSIVE-AGENT | NeRF / 4DGS reconstruction            |

### 🔄 ARIS Agents (new — self-evolution)

| Agent             | Domain                                      |
|-------------------|---------------------------------------------|
| ARIS-ORCHESTRATOR | ARIS 9-phase cycle coordinator              |
| ARIS-AUDITOR      | Detects skill/agent gaps vs milestone needs |
| ARIS-WRITER       | Generates new SKILL.md and agent stubs      |
| ARIS-VALIDATOR    | Smoke-tests new artefacts before commit     |
| ARIS-INDEXER      | Regenerates SKILLS.md, AGENTS.md, INDEX.md  |

---

## 5 · 🎯 Skill Taxonomy (42 skills)

| Category            | Count | Key Skills                                                                                                                                                                               |
|---------------------|-------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 🛡️ Compliance (P0) | 2     | `source_badge_lint`, `fallback_verify`                                                                                                                                                   |
| 🔐 Governance       | 6     | `popia_compliance`, `popia_spatial_audit`, `rls_audit`, `security_review`, `instinct_guard`, `docs_traceability_gate`                                                                    |
| 🌍 Spatial & Data   | 9     | `spatial_validation`, `data_source_badge`, `three_tier_fallback`, `mock_to_live_validation`, `arcgis_qgis_uploader`, `provenance_tag`, `agol_search`, `geoparquet_pack`, `schema_smells` |
| 🗄️ Database        | 2     | `dataset_ingest`, `spatial_index`                                                                                                                                                        |
| 🗺️ Mapping & Tiles | 2     | `tile_optimization`, `spatialintelligence_inspiration`                                                                                                                                   |
| 🛸 Immersive 3D     | 3     | `cesium_3d_tiles`, `nerf_3dgs_pipeline`, `4dgs_event_replay`                                                                                                                             |
| ✈️ Flight Tracking  | 1     | `opensky_flight_tracking`                                                                                                                                                                |
| 🔬 Research         | 5     | `cape_town_gis_research`, `deerflow_research_loop`, `gis_research_swarm`, `assumption_verification`, `docs_traceability_gate`                                                            |
| 🛠️ DevOps          | 4     | `documentation_first`, `git_workflow`, `ci_smoke_test`, `instinct_guard`                                                                                                                 |
| 🔌 Infrastructure   | 1     | `mcp_health_check`                                                                                                                                                                       |
| ⚡ Performance       | 3     | `cwv_monitor`, `a11y_check`, `test_stub_gen`                                                                                                                                             |
| 🔍 Audit            | 1     | `project_audit`                                                                                                                                                                          |
| 🔄 ARIS (new)       | 6     | `aris_gap_scan`, `aris_skill_gen`, `aris_agent_gen`, `aris_smoke_test`, `aris_index_sync`, `aris_cycle_report`                                                                           |

---

## 6 · 🔄 ARIS Self-Evolution Cycle (9 phases)

```
Phase 1 · Snapshot     → Read AGENTS.md, SKILLS.md, PLAN.md → build capability map
Phase 2 · Gap Analysis → Compare capabilities vs M17+ requirements → emit GAP list
Phase 3 · Prioritise   → Score gaps by P0/P1/P2 · milestone criticality
Phase 4 · Design       → Draft new SKILL.md / agent stubs for top-N gaps
Phase 5 · Review Gate  → Human approves designs (blocking)
Phase 6 · Generate     → Write artefacts: skills/, agents/, commands/
Phase 7 · Validate     → ci_smoke_test on every new skill; COMPLIANCE-AGENT gate
Phase 8 · Index        → Regenerate SKILLS.md, AGENTS.md, INDEX.md, CHANGELOG_AUTO.md
Phase 9 · Report       → Emit ARIS cycle report → docs/research/aris-cycle-NNN.md
```

Trigger: `/aris-cycle` command (ARIS-ORCHESTRATOR). Frequency: once per milestone.

---

## 7 · 🏁 Milestone Sequencing (M0–M17+)

| #    | Milestone                                            | Status    |
|------|------------------------------------------------------|-----------|
| M0   | Project Bootstrap — repo, CI, Docker, env            | ✅         |
| M1   | Database Schema & RLS — PostGIS + tenant tables      | ✅         |
| M2   | Authentication — Supabase Auth, JWT, guest mode      | ✅         |
| M3   | Base Map — MapLibre, CartoDB basemap, attribution    | ✅         |
| M4a  | Cape Town Open Data — suburb/zoning/cadastral ingest | ✅         |
| M4b  | MVT Integration — Martin tile server live            | ✅         |
| M4c  | PWA — Serwist offline tile caching                   | ✅         |
| M4d  | Test Harness — Playwright + Vitest baseline          | ✅         |
| M5   | Zoning & Risk Overlays — flood/fire/noise layers     | ✅         |
| M6   | General Valuation Roll 2022 — ingest + display       | ✅         |
| M7   | Property Search & Autocomplete — PostGIS FTS         | ✅         |
| M8   | Spatial Analysis Tools — buffer, intersection, PIP   | ✅         |
| M9   | Saved Searches & Favourites — Dexie + Supabase sync  | ✅         |
| M10  | Property Detail Panel — GV Roll data + Street View   | ✅         |
| M11  | Analytics Dashboard — Recharts, aggregate stats      | ✅         |
| M12  | Export Tools — GeoJSON, CSV, Shapefile               | ✅         |
| M13  | Advanced Export — PDF, GeoParquet, provenance        | ✅         |
| M14  | Production QA — full Playwright suite, CWV           | ✅         |
| M15  | Production Hardening — Sentry, perf budgets, CDN     | ✅         |
| M16  | User Management — Tenant Admin, RBAC UI              | ✅         |
| M17  | Advanced Geospatial Analysis — spatial ML, heatmaps  | 🔄 ACTIVE |
| M17+ | Immersive Stack — CesiumJS 3D, OpenSky, 4DGS         | 🔜        |

---

## 8 · 🗺️ Cape Town Geographic Scope

```
Bounding box:  { west: 18.0, south: -34.5, east: 19.5, north: -33.0 }
Centre:        { lng: 18.4241, lat: -33.9249 }
Initial zoom:  11
```

| Rule              | Detail                                          |
|-------------------|-------------------------------------------------|
| Storage CRS       | **EPSG:4326** (WGS 84) — all PostGIS inserts    |
| Rendering CRS     | **EPSG:3857** (Web Mercator) — MapLibre display |
| Reprojection      | Always explicit — never mix CRS silently        |
| Tippecanoe clip   | `--clip-bounding-box=18.0,-34.5,19.5,-33.0`     |
| Cadastral parcels | Zoom ≥ 14 only; viewport buffer 20%             |
| Valuation source  | GV Roll 2022 only — **NO Lightstone** (Rule 8)  |

---

## 9 · 🏗️ Backend Hexagonal Architecture (Ports & Adapters)

The Python backend (`backend/`) follows **hexagonal architecture** with strict layer boundaries.

### Layer Rules

| Layer             | May Import                      | Must NOT Import                   |
|-------------------|---------------------------------|-----------------------------------|
| `domain/`         | Python stdlib only              | FastAPI, SQLAlchemy, httpx, boto3 |
| `ports/`          | `domain/`                       | Any concrete adapter              |
| `adapters/`       | `domain/`, `ports/`, frameworks | Other adapters directly           |
| `infrastructure/` | All layers                      | —                                 |
| `services/` (app) | `domain/`, `ports/`             | Concrete adapters                 |
| `api/routes/`     | `services/`, `domain/`          | Direct DB access                  |

### Design Patterns in Use

| Pattern      | Location                               | Justification                                         |
|--------------|----------------------------------------|-------------------------------------------------------|
| Value Object | `domain/value_objects/`                | Immutable bbox, scores, geometry — equality by value  |
| Entity       | `domain/entities/`                     | AnalysisJob, GISLayer, TenantContext — identity by ID |
| Repository   | `ports/outbound/spatial_repository.py` | Abstract PostGIS access, testable with mocks          |
| Strategy     | `ports/outbound/file_processor.py`     | Format-specific GIS processing dispatch               |
| Factory      | Entity `@classmethod` constructors     | Validated domain object creation                      |
| Port/Adapter | `ports/` + `adapters/`                 | Decouple domain from infrastructure                   |

### Big O Requirements

All non-trivial functions MUST document complexity:

- Spatial queries: O(log n + k) with PostGIS GiST index
- Coordinate flattening: O(n) iterative, not recursive
- Format detection: O(1) magic bytes + extension
- Role checks: O(1) hash map lookup
- Cache operations: O(1) key-based

### Secure Coding Mandates

- All SQL via parameterized SQLAlchemy — never raw strings
- Tenant isolation at every data boundary
- POPIA annotations on personal data handlers
- DXF: never assume CRS (GOTCHA-PY-004)
- Shapefile: reject without .prj (GOTCHA-PY-003)

---

## 10 · 🔗 Cross-References

| Document           | Path                                | Purpose                                 |
|--------------------|-------------------------------------|-----------------------------------------|
| CLAUDE.md          | `../CLAUDE.md`                      | 10 non-negotiable rules — always wins   |
| PLAN.md            | `../PLAN.md`                        | Authoritative milestone DoD definitions |
| AGENTS.md          | `./AGENTS.md`                       | Full agent definitions (25 + 5 ARIS)    |
| SKILLS.md          | `./SKILLS.md`                       | Full skill registry (36 + 6 ARIS)       |
| COMMANDS.md        | `./COMMANDS.md`                     | 23 slash commands                       |
| HOOKS.md           | `./HOOKS.md`                        | PostToolUse hooks, auto-doc triggers    |
| MCP_SERVERS.md     | `./MCP_SERVERS.md`                  | 21 MCP server configs                   |
| orchestrator.md    | `./orchestrator.md`                 | Milestone handoff protocol              |
| PLAN_DEVIATIONS.md | `../docs/PLAN_DEVIATIONS.md`        | DEV-NNN deviation log                   |
| OPEN_QUESTIONS.md  | `../docs/OPEN_QUESTIONS.md`         | Blocking questions                      |
| DATA_REGISTRY.md   | `../docs/research/DATA_REGISTRY.md` | Approved CT data sources                |
