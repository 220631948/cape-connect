# MCP_SERVERS.md — CapeTown GIS Hub MCP Fleet Reference

> Agent-facing reference for all 22 MCP servers configured in `.claude/settings.json`. Cross-reference: `docs/infra/mcp-servers.md`.

**Total MCP servers:** 22 | **Last updated:** 2026-03-14

---

## Health Check Protocol

Run `/mcp-status` before starting any agent session. This invokes the `mcp_health_check` skill
which classifies every server as **HEALTHY**, **DEGRADED**, or **UNREACHABLE**.

```
/mcp-status          # full fleet health table
/mcp-status --fix    # attempt restart suggestions for degraded servers
/mcp-status --server doc-state   # check a single server
```

Health results are written to `docs/MCP_HEALTH_LOG.md` after each run.

### Classification

| Status | Meaning | Action |
|--------|---------|--------|
| HEALTHY | Responds within 5s, tools enumerable | Proceed |
| DEGRADED | Responds slowly or with errors | Use with caution; flag in session notes |
| UNREACHABLE | No response within 5s | Do not use; see escalation below |

---

## P0 Servers — Halt If UNREACHABLE

These three servers are required for core agent operation. If any are **UNREACHABLE**, agents must
**halt and escalate** before proceeding. Do not attempt workarounds — output `MCP ESCALATE` signal.

| Server | Command | Why P0 |
|--------|---------|--------|
| `filesystem` | `npx @modelcontextprotocol/server-filesystem ...` | All agents need file read/write |
| `postgres` | `npx @modelcontextprotocol/server-postgres ...` | DB-AGENT, AUTH-AGENT, DATA-AGENT cannot function without DB access |
| `doc-state` | `node mcp/doc-state/server.js` | Multi-agent doc locking; prevents INDEX.md race conditions |

Hook D3 (`mcp-health-precheck.js`) performs a fast proxy health check on P0 servers before every
Task invocation. It uses `fs.existsSync` on `mcp/doc-state/server.js` as a lightweight signal.

---

## Custom MCP Servers (6 local Node.js servers in `mcp/`)

These six servers are built and maintained within this repository. They run as local Node.js
processes launched by Claude Code's MCP configuration.

| Server | Path | Launch Command | Purpose |
|--------|------|---------------|---------|
| `openaware` | `mcp/openaware/server.js` | `node mcp/openaware/server.js` | Real-time flight tracking bbox filter |
| `cesium` | `mcp/cesium/server.js` | `node mcp/cesium/server.js` | 3D tile validation and camera bounds |
| `formats` | `mcp/formats/server.js` | `node mcp/formats/server.js` | GIS format validation (Shapefile, GeoPackage, GeoJSON) |
| `computerUse` | `mcp/computerUse/server.js` | `node mcp/computerUse/server.js` | Desktop UI automation for visual testing |
| `stitch` | `mcp/stitch/server.js` | `node mcp/stitch/server.js` | NeRF/3DGS pipeline orchestration |
| `doc-state` | `mcp/doc-state/server.js` | `node mcp/doc-state/server.js` | Distributed doc locking (P0) |

**Health check:** The `mcp_health_check` skill verifies that each `server.js` file exists on disk
and attempts a 5-second tool ping. All 6 are included in `/mcp-status` output.

**To restart a custom server** if it becomes UNREACHABLE:
```bash
node mcp/<server-name>/server.js &   # restart in background
```

---

## MCP Server Fleet by Domain

---

### 🌍 Geospatial

---

#### `gis-mcp`
**Command:** `uvx gis-mcp`
**Purpose:** Core GIS operations — geometry validation, CRS detection and reprojection, bounding box checks, spatial statistics. The primary spatial computation server for agents that don't have direct PostGIS access.
**Agents:** DATA-AGENT, SPATIAL-AGENT, TILE-AGENT, MAP-AGENT
**Status:** ✅ Active
**Example tool calls:**
```
mcp__gis-mcp__validate_geometry(geojson_path="public/mock/suburbs.geojson")
mcp__gis-mcp__detect_crs(shapefile_path="data/cadastral.shp")
mcp__gis-mcp__bbox_check(features=[...], bbox=[18.0, -34.5, 19.5, -33.0])
```
**Related commands:** `/validate-spatial`, `/arcgis-import`, `/qgis-import`
**Related skills:** `spatial_validation`, `arcgis_qgis_uploader`

---

#### `formats`
**Command:** `node mcp/formats/server.js`
**Purpose:** GIS data format validation and conversion — Shapefile integrity checks, GeoPackage table listing, GeoJSON schema validation, CRS parsing from `.prj` files.
**Agents:** DATA-AGENT, IMMERSIVE-AGENT
**Status:** ✅ Active (local Node.js server)
**Example tool calls:**
```
mcp__formats__validate_shapefile(path="data/cadastral.shp")
mcp__formats__list_gpkg_layers(path="data/planning.gpkg")
mcp__formats__parse_prj(path="data/cadastral.prj")
```
**Related commands:** `/arcgis-import`, `/qgis-import`

---

### 🗄️ Database

---

#### `postgres`
**Command:** `npx @modelcontextprotocol/server-postgres postgresql://postgres:postgres@localhost:5432/capegis`
**Purpose:** Direct PostGIS/PostgreSQL query execution. Used for schema inspection, running spatial queries, verifying RLS policies, and testing migrations.
**Agents:** DB-AGENT, AUTH-AGENT, DATA-AGENT, TEST-AGENT
**Status:** ✅ Active (requires local PostGIS container running)
**Connection:** `postgresql://postgres:postgres@localhost:5432/capegis`
**Example tool calls:**
```
mcp__postgres__query("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'")
mcp__postgres__query("SELECT ST_SRID(geom), COUNT(*) FROM suburbs GROUP BY 1")
mcp__postgres__query("EXPLAIN ANALYZE SELECT * FROM cadastral_parcels WHERE ST_Intersects(geom, ST_MakeEnvelope(18.4, -34.0, 18.5, -33.9, 4326))")
```
**Security:** Uses local dev credentials — never use production connection string in this config
**Related skills:** `rls_audit`, `spatial_validation`, `schema_smells` (recommended)

---

### 🔧 Infrastructure / DevOps

---

#### `filesystem`
**Command:** `npx @modelcontextprotocol/server-filesystem "/home/mr/Desktop/Geographical Informations Systems (GIS)"`
**Purpose:** Scoped filesystem access for reading and writing project files. Root path is the project directory.
**Agents:** All agents
**Status:** ✅ Active
**Root path:** `/home/mr/Desktop/Geographical Informations Systems (GIS)`
**Example tool calls:**
```
mcp__filesystem__read_file(".claude/AGENTS.md")
mcp__filesystem__write_file("public/mock/suburbs.geojson", content)
mcp__filesystem__list_directory("supabase/migrations")
```
**Security:** Scoped to project root — cannot read/write outside this directory

---

#### `doc-state`
**Command:** `node mcp/doc-state/server.js`
**Purpose:** Distributed document locking for multi-agent index synchronization. Prevents concurrent write conflicts on `INDEX.md` and `CHANGELOG_AUTO.md`.
**Agents:** All agents (especially docs-indexer)
**Status:** ✅ Active (local Node.js server)
**Protocol:** Acquire write lock → check hash → skip if current → write → release → notify
**Example tool calls:**
```
mcp__doc-state__acquire_lock(path="docs/INDEX.md")
mcp__doc-state__check_hash(path="docs/INDEX.md")
mcp__doc-state__release_lock(path="docs/INDEX.md")
```
**Related:** CLAUDE.md Auto Documentation Maintenance Rules

---

#### `docker`
**Command:** `npx docker-mcp`
**Purpose:** Docker container management — check container status, start/stop services, inspect logs. Used for verifying local dev stack (PostGIS, Martin, 4DGS service).
**Agents:** TILE-AGENT, IMMERSIVE-AGENT, TEST-AGENT
**Status:** ✅ Active (requires Docker daemon)
**Example tool calls:**
```
mcp__docker__list_containers()
mcp__docker__container_status("martin")
mcp__docker__container_logs("postgis", tail=50)
mcp__docker__compose_ps()
```
**Related commands:** `/immersive-check` (Docker container checks)

---

#### `vercel`
**Command:** `npx --package @vercel/sdk -- mcp start`
**Auth:** `VERCEL_TOKEN` environment variable
**Purpose:** Vercel deployment management — list deployments, check build status, manage environment variables, inspect edge function logs.
**Agents:** TEST-AGENT (M14 production QA)
**Status:** ✅ Active (requires `VERCEL_TOKEN`)
**Example tool calls:**
```
mcp__vercel__list_deployments(project="capegis")
mcp__vercel__get_deployment_status(deployment_id="...")
mcp__vercel__list_env_vars(project="capegis", target="production")
```
**Security:** `VERCEL_TOKEN` grants full project access — never log or expose

---

#### `localstack`
**Command:** `npx @localstack/localstack-mcp-server`
**Purpose:** Local AWS service emulation — S3 bucket simulation for testing Supabase Storage fallbacks offline.
**Agents:** TEST-AGENT
**Status:** ✅ Active (requires LocalStack container)
**Example tool calls:**
```
mcp__localstack__list_buckets()
mcp__localstack__put_object(bucket="tiles", key="suburbs.pmtiles", body=...)
```

---

#### `computerUse`
**Command:** `node mcp/computerUse/server.js`
**Purpose:** Computer use automation — screenshot capture, UI interaction automation for visual testing of the map interface. Prefer `chrome-devtools` for most testing tasks; use `computerUse` only for full desktop automation not covered by Chrome DevTools.
**Agents:** TEST-AGENT
**Status:** ✅ Active (local Node.js server)

---

### 🧠 AI Research

---

#### `nano-banana`
**URL:** `https://nano-banana.googleapis.com/mcp`
**Auth:** `GOOGLE_API_KEY` (Bearer token)
**Timeout:** 20000ms | **Retry:** 3 attempts
**Purpose:** Google Gemini AI via MCP — deep reasoning, multi-modal analysis, research synthesis.
**Agents:** RESEARCHER
**Status:** ✅ Active (requires `GOOGLE_API_KEY`)
**Example tool calls:**
```
mcp__nano-banana__generate("Analyse the POPIA implications of storing cadastral addresses")
mcp__nano-banana__analyze_image(url="...", prompt="Describe the GIS layer structure")
```

---

#### `gemini-deep-research`
**Command:** `node .gemini/extensions/gemini-deep-research/scripts/start.cjs`
**Auth:** `GEMINI_API_KEY` environment variable
**Purpose:** Gemini Deep Research — multi-step research with web search grounding, document analysis, and structured report generation. Powers the `deerflow_research_loop` and `gis_research_swarm` skills.
**Agents:** RESEARCHER
**Status:** ✅ Active (requires `GEMINI_API_KEY`)
**Example tool calls:**
```
mcp__gemini-deep-research__research_start(input="What GIS datasets does City of Cape Town publish for flood risk?")
mcp__gemini-deep-research__research_status(id="...")
mcp__gemini-deep-research__research_save_report(id="...", filePath="docs/research/flood-risk-sources.md")
```
**Related skills:** `deerflow_research_loop`, `gis_research_swarm`, `cape_town_gis_research`

---

#### `exa`
**Command:** `npx exa-mcp-server`
**Purpose:** Exa semantic web search — high-quality search results for academic papers, official documentation, and open data portals. Better than standard web search for GIS research.
**Agents:** RESEARCHER
**Status:** ✅ Active (requires Exa API key in env)
**Example tool calls:**
```
mcp__exa__search("City of Cape Town open data zoning 2024 GeoJSON download")
mcp__exa__search("POPIA compliance spatial data South Africa regulations")
```
**Allowed domains (RESEARCHER uses):** `odp.capetown.gov.za`, `data.gov.za`, `github.com`

---

#### `context7`
**Command:** `npx @upstash/context7-mcp --api-key ${CONTEXT7_API_KEY}`
**Auth:** `CONTEXT7_API_KEY`
**Purpose:** Fetch current library documentation — MapLibre GL JS, Supabase, Next.js 15, Serwist, Turf.js. Prevents using outdated API patterns.
**Agents:** MAP-AGENT, DB-AGENT, AUTH-AGENT
**Status:** ✅ Active (requires `CONTEXT7_API_KEY`)
**Example tool calls:**
```
mcp__context7__fetch_docs(library="maplibre-gl", version="latest")
mcp__context7__fetch_docs(library="supabase-js", query="Row Level Security")
mcp__context7__fetch_docs(library="next", query="App Router server components")
```

---

#### `sequentialthinking`
**Command:** `docker run -i --rm danielapatin/sequentialthinking:latest -transport stdio`
**Purpose:** Chain-of-thought reasoning Docker container — step-by-step planning for complex architectural decisions, deviation analysis, and multi-step problem solving.
**Agents:** PLANNER, SPATIAL-AGENT, AUTH-AGENT
**Status:** ✅ Active (requires Docker) | Image confirmed up to date `sha256:8725541b2ea5` (2026-03-14)
**Example tool calls:**
```
mcp__sequentialthinking__think(problem="How should I structure the RLS policy for the valuation_data table given multi-tenant requirements?")
mcp__sequentialthinking__think(problem="What's the optimal approach for implementing three-tier fallback for the flight tracking layer?")
```

---

### 🎥 Immersive 3D

---

#### `cesium`
**Command:** `node mcp/cesium/server.js`
**Purpose:** CesiumJS 3D tile management — tileset validation, camera bounds configuration, bounding volume checking, 3D Tiles 1.1 schema validation.
**Agents:** CESIUM-AGENT, IMMERSIVE-AGENT
**Status:** ✅ Active (local Node.js server)
**Example tool calls:**
```
mcp__cesium__validate_tileset(path="public/tiles/cape_town_3d/tileset.json")
mcp__cesium__check_camera_bounds(lng=18.4241, lat=-33.9249, zoom=11)
mcp__cesium__check_bounding_volume(tileset_url="...")
```
**Related commands:** `/cesium-validate`, `/4dgs-status`, `/immersive-check`

---

#### `cesium-ion`
**Type:** SSE (Server-Sent Events)
**URL:** `https://mcp.cesium.com/sse`
**Auth:** `COPILOT_MCP_CESIUM_ION_TOKEN` (Bearer token)
**Purpose:** Cesium Ion cloud service — upload assets, stream 3D Tiles, manage Ion assets for Cape Town photorealistic tiles.
**Agents:** CESIUM-AGENT
**Status:** ✅ Active (requires `COPILOT_MCP_CESIUM_ION_TOKEN`)
**Example tool calls:**
```
mcp__cesium-ion__list_assets()
mcp__cesium-ion__get_asset_status(asset_id=12345)
mcp__cesium-ion__stream_tileset(asset_id=12345)
```
**Security:** Ion token grants access to paid Cesium Ion assets — never log or expose

---

#### `stitch`
**Command:** `node mcp/stitch/server.js`
**Env:** `NERFSTUDIO_PATH=/usr/local/bin/ns-train`
**Purpose:** NeRF and Gaussian Splatting pipeline orchestration — scene reconstruction, training job management, output format validation (OGC 3D Tiles 1.1).
**Agents:** IMMERSIVE-AGENT
**Status:** ✅ Active (requires `nerfstudio` installed at `NERFSTUDIO_PATH`)
**Example tool calls:**
```
mcp__stitch__start_training(scene_path="data/scenes/bo_kaap", method="3dgs")
mcp__stitch__training_status(job_id="...")
mcp__stitch__validate_output(tileset_path="output/bo_kaap/tileset.json")
```
**Related commands:** `/4dgs-status`, `/immersive-check`

---

#### `nerfstudio`
**Command:** `python -m nerfstudio.mcp_server`
**Purpose:** Direct Nerfstudio Python interface — training configuration, model export, COLMAP SfM integration, GPU utilization monitoring.
**Agents:** IMMERSIVE-AGENT
**Status:** ✅ Active (requires `nerfstudio` Python package and GPU)
**Example tool calls:**
```
mcp__nerfstudio__list_methods()
mcp__nerfstudio__prepare_data(image_dir="data/images/bo_kaap")
mcp__nerfstudio__export_tiles(model_path="outputs/bo_kaap", format="3dtiles")
```
**Related commands:** `/4dgs-status`

---

### ✈️ Flight Tracking

---

#### `openaware`
**Command:** `node mcp/openaware/server.js`
**Purpose:** Real-time flight tracking awareness layer — aggregates OpenSky state vectors, applies Cape Town bbox filter, manages update intervals.
**Agents:** FLIGHT-AGENT
**Status:** ✅ Active (local Node.js server)
**Example tool calls:**
```
mcp__openaware__get_flights(bbox=[18.0, -34.5, 19.5, -33.0])
mcp__openaware__get_flight_count()
mcp__openaware__set_update_interval(seconds=15)
```

---

#### `opensky`
**Command:** `node scripts/opensky-mcp-wrapper.js`
**Purpose:** OpenSky Network REST API wrapper — direct API access with rate limiting middleware, authentication handling (anonymous and credentialed), and cache integration.
**Agents:** FLIGHT-AGENT
**Status:** ✅ Active (requires running script)
**Example tool calls:**
```
mcp__opensky__get_states(lamin=-34.5, lomin=18.0, lamax=-33.0, lomax=19.5)
mcp__opensky__get_rate_limit_status()
mcp__opensky__check_api_health()
```
**Rate limits:** Anonymous: 10 req/sec, 400 req/day | Authenticated: 20 req/sec, 4000 req/day
**Related commands:** `/opensky-check`, `/immersive-check`

---

### 🧪 Browser / Testing

---

#### `playwright`
**Command:** `npx playwright-mcp-server`
**Purpose:** Playwright browser automation for E2E testing — page navigation, element interaction, screenshot capture, assertion running.
**Agents:** TEST-AGENT
**Status:** ✅ Active
**Example tool calls:**
```
mcp__playwright__navigate(url="http://localhost:3000")
mcp__playwright__screenshot(path="test-results/map-load.png")
mcp__playwright__assert_visible(selector="[data-badge]")
```
**Related commands:** N/A (used directly in test scripts)

---

#### `chrome-devtools`
**Command:** `npx chrome-devtools-mcp`
**Purpose:** Chrome DevTools Protocol access — inspect DOM, run Lighthouse audits, monitor network requests, capture performance traces, check accessibility.
**Agents:** TEST-AGENT, MAP-AGENT (visual verification)
**Status:** ✅ Active
**Example tool calls:**
```
mcp__chrome-devtools__take_snapshot()
mcp__chrome-devtools__lighthouse_audit(mode="snapshot")
mcp__chrome-devtools__list_console_messages(types=["error", "warn"])
mcp__chrome-devtools__navigate_page(url="http://localhost:3000", type="url")
```
**Related commands:** `/badge-check` (visual badge verification)

---

### 📓 Knowledge / Research Assistant

---

#### `notebooklm-connector`
**Command:** Plugin (enabled via `enabledPlugins.notebooklm-connector@claude-code-zero`)
**Purpose:** NotebookLM notebook management and querying — add, list, search, enable/disable, and query notebooks. Used for research synthesis, GIS document search, and POPIA compliance lookups.
**Agents:** RESEARCHER
**Status:** ✅ Active (plugin, requires Google auth)
**Example tool calls:**
```
mcp__notebooklm__ask_question(question="What POPIA obligations apply to location data?")
mcp__notebooklm__list_notebooks()
mcp__notebooklm__search_notebooks(query="flood risk Cape Town")
```
**Related skills:** `cape_town_gis_research`, `deerflow_research_loop`

---

## Server Status Legend

| Status | Meaning |
|--------|---------|
| ✅ Active | Configured and should be functional |
| ⚠️ Requires running service | Server needs local Docker/process to be running |
| 🔑 Requires auth | Needs API key / token in environment |
| ❌ Blocked | Network-blocked in current sandbox |

---

## Quick Server → Agent Map

Reverse lookup: which agents use each server? (Complement to agent definitions in `AGENTS.md`)

| MCP Server | Used by agents |
|-----------|---------------|
| `postgres` | DB-AGENT, AUTH-AGENT, DATA-AGENT, OVERLAY-AGENT, TEST-AGENT, SEARCH-AGENT, SAVE-AGENT, DETAILS-AGENT, DASHBOARD-AGENT, EXPORT-AGENT, FLIGHT-AGENT, M17-ANALYSIS-AGENT, COMPLIANCE-AGENT |
| `gis-mcp` | DATA-AGENT, SPATIAL-AGENT, TILE-AGENT, MAP-AGENT, OVERLAY-AGENT, SEARCH-AGENT, RESEARCHER, M17-ANALYSIS-AGENT, PROVENANCE-AGENT |
| `filesystem` | All agents |
| `doc-state` | DB-AGENT, AUTH-AGENT, MAP-AGENT, DATA-AGENT, OVERLAY-AGENT, TEST-AGENT, SAVE-AGENT, DETAILS-AGENT, DASHBOARD-AGENT, EXPORT-AGENT, PLANNER, ORCHESTRATOR, PROJECT-AUDIT-AGENT |
| `sequentialthinking` | AUTH-AGENT, MAP-AGENT, SPATIAL-AGENT, PLANNER, M17-ANALYSIS-AGENT |
| `formats` | DATA-AGENT, OVERLAY-AGENT, PROVENANCE-AGENT |
| `docker` | TILE-AGENT, IMMERSIVE-AGENT, TEST-AGENT, PROJECT-AUDIT-AGENT |
| `playwright` | TEST-AGENT, PERFORMANCE-AGENT |
| `chrome-devtools` | TEST-AGENT, PERFORMANCE-AGENT |
| `computerUse` | TEST-AGENT |
| `vercel` | TEST-AGENT |
| `localstack` | TEST-AGENT |
| `cesium` | CESIUM-AGENT, IMMERSIVE-AGENT |
| `cesium-ion` | CESIUM-AGENT |
| `stitch` | IMMERSIVE-AGENT |
| `nerfstudio` | IMMERSIVE-AGENT |
| `opensky` | FLIGHT-AGENT |
| `openaware` | FLIGHT-AGENT |
| `gemini-deep-research` | RESEARCHER |
| `exa` | RESEARCHER |
| `context7` | RESEARCHER, MAP-AGENT, DB-AGENT, AUTH-AGENT, M17-ANALYSIS-AGENT |
| `nano-banana` | RESEARCHER |
| `notebooklm-connector` | RESEARCHER |

---

## Cross-References

- Full configuration: `.claude/settings.json`
- Hook configuration: `.claude/settings.local.json`
- Infrastructure docs: `docs/infra/mcp-servers.md`
- Settings rationale: `.claude/SETTINGS.md`
- MCP health log: `docs/MCP_HEALTH_LOG.md` (written by `mcp_health_check` skill)
- Health check skill: `.claude/skills/mcp_health_check/SKILL.md`
- Health check command: `/mcp-status` (see `.claude/commands/mcp-status.md`)
- MCP-HEALTH-AGENT: `.claude/agents/mcp-health-agent.md`
