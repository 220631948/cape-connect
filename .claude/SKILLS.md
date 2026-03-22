# SKILLS.md — CapeTown GIS Hub Skills Registry

> Comprehensive registry of all Claude Code skills available in this workspace. Skills are reusable, parameterised playbooks invoked via the `Skill` tool. Each skill lives in `.claude/skills/<name>/SKILL.md`.

**Total skills:** 42 | **Last updated:** 2026-03-14 (ARIS self-evolution pass)

> **Note:** Run `/mcp-status` before any agent session.

---

## Skills by Category

### 🛡️ Compliance Skills (2 skills — P0, created this pass)

| Skill | Directory | Description | Primary Agent | Trigger Keywords |
|-------|-----------|-------------|--------------|-----------------|
| `source_badge_lint` | `skills/source_badge_lint/` | Scan all data-fetching components for mandatory Rule 1 `[SOURCE·YEAR·STATUS]` badge; exits non-zero in CI on FAIL | BADGE-AUDIT-AGENT, COMPLIANCE-AGENT | "badge lint", "badge audit", "rule 1 scan", "--ci badge" |
| `fallback_verify` | `skills/fallback_verify/` | Verify LIVE→CACHED→MOCK three-tier fallback in all API routes; check mock file existence; exits non-zero on FAIL | FALLBACK-VERIFY-AGENT, COMPLIANCE-AGENT | "fallback verify", "three tier check", "rule 2 audit", "--ci fallback" |

---

### 🔐 Governance & Compliance (6 skills)

| Skill | Directory | Description | Primary Agent | Trigger Keywords |
|-------|-----------|-------------|--------------|-----------------|
| `popia_compliance` | `skills/popia_compliance/` | POPIA annotation checklist for files handling personal data | AUTH-AGENT, DATA-AGENT | "popia", "privacy", "personal data", "annotation" |
| `popia_spatial_audit` | `skills/popia_spatial_audit/` | Extended POPIA audit for spatial data — location-based PII, movement tracking, address inference | DATA-AGENT, FLIGHT-AGENT | "spatial popia", "location privacy", "address inference" |
| `rls_audit` | `skills/rls_audit/` | Row-Level Security audit — verifies tenant isolation on all PostGIS tables | DB-AGENT, TEST-AGENT | "rls", "row level security", "tenant isolation", "audit" |
| `security_review` | `skills/security_review/` | Security review checklist for API routes, MCP servers, data pipelines | AUTH-AGENT, TEST-AGENT | "security", "api security", "vulnerability", "review" |
| `instinct_guard` | `skills/instinct_guard/` | Behavioral guardrails — invoke before editing any governed file | MAP-AGENT, AUTH-AGENT | "guard", "governed file", "guardrails", "check before edit" |
| `docs_traceability_gate` | `skills/docs_traceability_gate/` | Validate GIS documentation quality gates, evidence tags, cross-file consistency | RESEARCHER, PLANNER | "docs qa", "traceability", "evidence tags", "quality gate" |

---

### 🗄️ Database & Schema (1 skill)

| Skill | Directory | Description | Primary Agent | Trigger Keywords |
|-------|-----------|-------------|--------------|-----------------|
| `dataset_ingest` | `skills/dataset_ingest/` | Validate and ingest open datasets into PostGIS with three-tier fallback compliance | DATA-AGENT | "ingest", "import dataset", "load into postgis", "three-tier" |

> `rls_audit` is also used by DB-AGENT for schema validation — see Governance & Compliance table above.

---

### 🌍 Spatial & Data (5 skills)

| Skill | Directory | Description | Primary Agent | Trigger Keywords |
|-------|-----------|-------------|--------------|-----------------|
| `spatial_validation` | `skills/spatial_validation/` | Validate GeoJSON/WKT within Cape Town bbox; detect CRS mismatches (EPSG:4326 storage vs EPSG:3857 rendering) | SPATIAL-AGENT, DATA-AGENT | "validate spatial", "check geojson", "crs", "bounding box" |
| `data_source_badge` | `skills/data_source_badge/` | Generate `[SOURCE·YEAR·LIVE\|CACHED\|MOCK]` badge for data display components (Rule 1) | DATA-AGENT, MAP-AGENT | "badge", "data badge", "source badge", "rule 1" |
| `three_tier_fallback` | `skills/three_tier_fallback/` | Guide for LIVE→CACHED→MOCK fallback pattern required by CLAUDE.md Rule 2 | DATA-AGENT, MAP-AGENT | "fallback", "three tier", "live cached mock", "rule 2" |
| `mock_to_live_validation` | `skills/mock_to_live_validation/` | Validate the transition of a data layer from MOCK to LIVE status | DATA-AGENT, TEST-AGENT | "mock to live", "promote layer", "validate live source" |
| `arcgis_qgis_uploader` | `skills/arcgis_qgis_uploader/` | Handle ArcGIS .shp/.gdb and QGIS .qgz file upload, validation, reprojection, and visualization | DATA-AGENT | "arcgis", "shapefile", "qgis", "gdb", "gpkg", "upload" |

---

### 🗺️ Mapping & Tiles (2 skills)

| Skill | Directory | Description | Primary Agent | Trigger Keywords |
|-------|-----------|-------------|--------------|-----------------|
| `tile_optimization` | `skills/tile_optimization/` | PMTiles/MVT optimization — Tippecanoe flags, zoom levels, layer Z-order, offline caching strategy | TILE-AGENT, MAP-AGENT | "tippecanoe", "pmtiles", "optimize tiles", "martin", "zoom levels" |
| `spatialintelligence_inspiration` | `skills/spatialintelligence_inspiration/` | Apply spatialintelligence.ai WorldView dashboard patterns to Cape Town GIS — immersive 3D, temporal analytics | SPATIAL-AGENT | "worldview", "immersive dashboard", "temporal analytics", "3d visualization" |

---

### 🛸 Immersive 3D (3 skills)

| Skill | Directory | Description | Primary Agent | Trigger Keywords |
|-------|-----------|-------------|--------------|-----------------|
| `cesium_3d_tiles` | `skills/cesium_3d_tiles/` | CesiumJS and Google Photorealistic 3D Tiles integration for Cape Town immersive views | CESIUM-AGENT | "cesium", "3d tiles", "cesiumjs", "photorealistic", "ion" |
| `nerf_3dgs_pipeline` | `skills/nerf_3dgs_pipeline/` | Orchestrate NeRF and 3D Gaussian Splatting reconstruction pipelines for Cape Town scenes | IMMERSIVE-AGENT | "nerf", "gaussian splatting", "3dgs", "reconstruction", "colmap" |
| `4dgs_event_replay` | `skills/4dgs_event_replay/` | 4D Gaussian Splatting event replay — temporal reconstruction of Cape Town events using timestamped point clouds | IMMERSIVE-AGENT | "4dgs", "4d splatting", "temporal reconstruction", "event replay" |

---

### ✈️ Flight Tracking (1 skill)

| Skill | Directory | Description | Primary Agent | Trigger Keywords |
|-------|-----------|-------------|--------------|-----------------|
| `opensky_flight_tracking` | `skills/opensky_flight_tracking/` | OpenSky Network real-time flight data over Cape Town airspace with rate limiting and POPIA compliance | FLIGHT-AGENT | "opensky", "flight tracking", "adsb", "aircraft", "airspace" |

---

### 🔬 Research (5 skills)

| Skill | Directory | Description | Primary Agent | Trigger Keywords |
|-------|-----------|-------------|--------------|-----------------|
| `cape_town_gis_research` | `skills/cape_town_gis_research/` | Research and validate Cape Town and Western Cape GIS sources with evidence tags and traceable citations | RESEARCHER | "cape town data", "open data", "odp", "data source", "validate source" |
| `deerflow_research_loop` | `skills/deerflow_research_loop/` | Multi-agent research loop — decompose question into parallel tracks, synthesize evidence-typed findings | RESEARCHER | "research loop", "deerflow", "multi-track research", "synthesize" |
| `gis_research_swarm` | `skills/gis_research_swarm/` | Parallel swarm research cycle for GIS knowledge-base improvement | RESEARCHER | "swarm research", "parallel research", "knowledge base", "gis research" |
| `assumption_verification` | `skills/assumption_verification/` | Verify unconfirmed claims, dependencies, or data sources before proceeding | RESEARCHER, PLANNER | "verify assumption", "check claim", "validate dependency" |
| `docs_traceability_gate` | `skills/docs_traceability_gate/` | Docs QA, readiness gates, evidence tag validation, cross-file consistency | RESEARCHER, PLANNER | "docs qa", "traceability", "evidence tags", "quality gate" |

---

### 🛠️ DevOps & Workflow (4 skills)

| Skill | Directory | Description | Primary Agent | Trigger Keywords |
|-------|-----------|-------------|--------------|-----------------|
| `documentation_first` | `skills/documentation_first/` | Documentation-first delivery workflow — design quality gates before coding | PLANNER, all | "docs first", "plan before code", "documentation workflow" |
| `git_workflow` | `skills/git_workflow/` | Git branching and commit conventions for CapeTown GIS Hub milestone sequencer | All agents | "commit", "branch", "git", "pr", "milestone branch" |
| `ci_smoke_test` | `skills/ci_smoke_test/` | Minimal smoke test of a Claude Code skill to verify discoverability and output structure | TEST-AGENT | "smoke test", "test skill", "ci skill", "verify skill" |
| `instinct_guard` | `skills/instinct_guard/` | Project-level behavioral guardrails — invoke before editing any governed file | All agents | "guard", "governed file", "check before edit" |

---

### 🔧 Infrastructure & MCP (1 skill — P1, new)

| Skill | Directory | Description | Primary Agent | Trigger Keywords |
|-------|-----------|-------------|--------------|-----------------|
| `mcp_health_check` | `skills/mcp_health_check/` | Check health of all 21 MCP servers; HEALTHY/DEGRADED/UNREACHABLE; P0 ESCALATE signal | MCP-HEALTH-AGENT | "mcp health", "mcp status", "server check", "p0 server" |

---

### ⚡ Performance & Quality (3 skills — P2, new)

| Skill | Directory | Description | Primary Agent | Trigger Keywords |
|-------|-----------|-------------|--------------|-----------------|
| `cwv_monitor` | `skills/cwv_monitor/` | Playwright Lighthouse CWV measurement; LCP/INP/CLS budgets; Fast 3G; regression > 20% flags | PERFORMANCE-AGENT | "core web vitals", "lcp", "inp", "cls", "performance audit" |
| `a11y_check` | `skills/a11y_check/` | axe-core WCAG 2.1 AA check via Playwright; dark-mode contrast; MapLibre aria-label; CI fail on CRITICAL | PERFORMANCE-AGENT | "a11y", "accessibility", "wcag", "axe", "contrast", "aria" |
| `test_stub_gen` | `skills/test_stub_gen/` | Generate Vitest stubs with vi.mock for maplibre-gl and Supabase; STUB comment marker | TEST-COVERAGE-AGENT | "test stub", "generate test", "vitest stub", "zero coverage" |

---

### ♊ Gemini-Native Skills (Specialized)

| Skill | Directory | Description | Primary Agent | Trigger Keywords |
|-------|-----------|-------------|--------------|-----------------|
| `stac-catalog-sync` | `.gemini/extensions/capegis-ai/skills/stac-catalog-sync/` | Sync and validate SpatioTemporal Asset Catalog (STAC) metadata | GEO-DATA-AGENT | "stac", "catalog sync", "raster metadata" |
| `gcs-cost-audit` | `.gemini/extensions/capegis-ai/skills/gcs-cost-audit/` | Audit and optimize Google Cloud Storage (GCS) storage and egress costs | CLOUD-OPS-AGENT | "gcs cost", "finops", "egress audit" |
| `db-raster-wire-check` | `.gemini/extensions/capegis-ai/skills/db-raster-wire-check/` | Verify PostGIS out-db raster references against actual files in GCS | GEO-DATA-AGENT | "raster check", "out-db", "postgis raster" |
| `check-popia-compliance` | `.gemini/extensions/capegis-ai/skills/check-popia-compliance/` | Audit for South African POPIA compliance in geospatial data and APIs | GEO-DATA-AGENT | "popia", "privacy audit", "sanitization" |

---

### 📚 Research & Analysis Skills (Extended)

| Skill | Directory | Description | Primary Agent | Trigger Keywords |
|-------|-----------|-------------|--------------|-----------------|
| `notebooklm` | `notebooklm/` | Query Google NotebookLM for source-grounded, citation-backed answers | RESEARCHER | "notebooklm", "ask my notebook", "query documentation" |

---

### 🌍 Spatial & Data (formerly 5 skills, now 9 with new additions)

| Skill | Directory | Description | Primary Agent | Trigger Keywords |
|-------|-----------|-------------|--------------|-----------------|
| `spatial_validation` | `skills/spatial_validation/` | Validate GeoJSON/WKT within Cape Town bbox; detect CRS mismatches | SPATIAL-AGENT, DATA-AGENT | "validate spatial", "check geojson", "crs", "bounding box" |
| `data_source_badge` | `skills/data_source_badge/` | Generate `[SOURCE·YEAR·LIVE\|CACHED\|MOCK]` badge (Rule 1) | DATA-AGENT, MAP-AGENT | "badge", "data badge", "source badge", "rule 1" |
| `three_tier_fallback` | `skills/three_tier_fallback/` | Guide for LIVE→CACHED→MOCK fallback pattern (Rule 2) | DATA-AGENT, MAP-AGENT | "fallback", "three tier", "live cached mock", "rule 2" |
| `mock_to_live_validation` | `skills/mock_to_live_validation/` | Validate MOCK → LIVE layer transition | DATA-AGENT, TEST-AGENT | "mock to live", "promote layer", "validate live source" |
| `arcgis_qgis_uploader` | `skills/arcgis_qgis_uploader/` | Handle ArcGIS .shp/.gdb and QGIS .qgz upload, validation, reprojection | DATA-AGENT | "arcgis", "shapefile", "qgis", "gdb", "upload" |
| `provenance_tag` | `skills/provenance_tag/` | Record dataset provenance: source, license, CRS, features; invokes provenance.py + license_checker.py | PROVENANCE-AGENT, DATA-AGENT | "provenance", "dataset lineage", "license check", "data origin" |
| `agol_search` | `skills/agol_search/` | Search City of Cape Town AGOL org; filtered metadata; flags proprietary/out-of-scope | RESEARCHER, DATA-AGENT | "search arcgis online", "find agol dataset", "cape town open data portal" |
| `geoparquet_pack` | `skills/geoparquet_pack/` | Package PostGIS layers into GeoParquet with CRS metadata and POPIA annotation; smoke test | EXPORT-AGENT, DATA-AGENT | "geoparquet", "pack layer", "export parquet", "analytical export" |
| `schema_smells` | `skills/schema_smells/` | Detect PostGIS schema issues: missing GiST, SRID mismatch, invalid geometries, missing tenant_id | DB-AGENT, DATA-AGENT | "schema smells", "check table quality", "postgis audit" |

---

### 🗄️ Database & Schema (2 skills — spatial_index added)

| Skill | Directory | Description | Primary Agent | Trigger Keywords |
|-------|-----------|-------------|--------------|-----------------|
| `dataset_ingest` | `skills/dataset_ingest/` | Validate and ingest open datasets into PostGIS with three-tier fallback compliance | DATA-AGENT | "ingest", "import dataset", "load into postgis" |
| `spatial_index` | `skills/spatial_index/` | Recommend GiST/BRIN/SP-GiST/Clustered GiST index strategies based on query patterns | DB-AGENT | "spatial index", "optimize postgis index", "brin index" |

---

### 🔍 Audit (1 skill — P3, new)

| Skill | Directory | Description | Primary Agent | Trigger Keywords |
|-------|-----------|-------------|--------------|-----------------|
| `project_audit` | `skills/project_audit/` | 8-area codebase health audit: mock validity, badges, RLS, POPIA, secrets, file sizes, deps, Docker | PROJECT-AUDIT-AGENT | "project audit", "health check", "codebase audit", "pre-milestone audit" |

---

### spatial_validation
**Invocation:** `spatial_validation` skill
**CLAUDE.md rules enforced:** Rule 9 (geographic scope), CRS rules (§2)
**Bounding box:** `{ west: 18.0, south: -34.5, east: 19.5, north: -33.0 }`
**Checks:** bbox containment, geometry validity, CRS EPSG:4326, feature count threshold (10k), coordinate precision (≤6 dp)
**PostGIS fix suggestion:** `UPDATE [table] SET geom = ST_MakeValid(geom) WHERE NOT ST_IsValid(geom);`
**MCP Servers:** `gis-mcp`, `filesystem`
**Related command:** `/validate-spatial`

### data_source_badge
**Invocation:** `data_source_badge` skill
**CLAUDE.md rules enforced:** Rule 1 (visible badge required)
**Badge format:** `[SOURCE_NAME · YEAR · LIVE|CACHED|MOCK]`
**Badge must be:** always-visible DOM node — NOT inside `title`, `aria-label`, or hover-only tooltip
**Valid sources (examples):** `City of Cape Town`, `Martin MVT`, `GV Roll 2022`, `OpenSky Network`, `Cesium Ion`
**MCP Servers:** `filesystem`
**Related command:** `/badge-check`

### three_tier_fallback
**Invocation:** `three_tier_fallback` skill
**CLAUDE.md rules enforced:** Rule 2 (never show blank/error instead of MOCK)
**Tier order:** LIVE (external API/Martin) → CACHED (Supabase `api_cache`) → MOCK (`public/mock/*.geojson`)
**Error on missing MOCK:** Never acceptable — always create a minimal mock file
**MCP Servers:** `filesystem`, `postgres`
**Related commands:** `/validate-spatial`, `/badge-check`

### rls_audit
**Invocation:** `rls_audit` skill
**CLAUDE.md rules enforced:** Rule 4 (RLS + application layer, both required)
**Required SQL pattern** *(canonical source: CLAUDE.md Rule 4)*:
```sql
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;
ALTER TABLE [table] FORCE ROW LEVEL SECURITY;
CREATE POLICY "[table]_tenant_isolation" ON [table]
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);
```
**MCP Servers:** `postgres`, `filesystem`
**Related command:** `/new-migration`

### popia_compliance
**Invocation:** `popia_compliance` skill
**CLAUDE.md rules enforced:** Rule 5 (POPIA annotation required)
**Annotation block template** *(canonical source: CLAUDE.md Rule 5)*:
```typescript
/**
 * POPIA ANNOTATION
 * Personal data handled: [list]
 * Purpose: [specific purpose]
 * Lawful basis: [consent | contract | legal obligation | legitimate interests]
 * Retention: [period]
 * Subject rights: [access ✓ | correction ✓ | deletion ✓ | objection ✓]
 */
```
**MCP Servers:** `filesystem`
**Related command:** `/audit-popia`

---

---

### 🏗️ ARIS Skills (Repo Intelligence — 6 new skills)

Added by ARIS self-evolution pass (2026-03-14). These skills support the 6 new ARIS
general-workflow agents and are invoked by ARIS commands.

| Skill | Directory | Description | Primary Agent | Trigger Keywords |
|-------|-----------|-------------|--------------|-----------------|
| `stack_detect` | `skills/stack_detect/` | Read package.json, tsconfig.json, docker-compose.yml; output structured tech-stack report; flag unapproved libs against CLAUDE.md §2 | REPO-ARCHITECT | "detect stack", "check dependencies", "tech stack report", "unapproved library" |
| `repo_graph` | `skills/repo_graph/` | Traverse src/ and migrations/ to map exported hooks, API routes, component deps; detect circular imports and orphaned files | FEATURE-BUILDER, REPO-ARCHITECT | "repo graph", "dependency map", "circular import", "module deps", "orphaned component" |
| `debug_trace` | `skills/debug_trace/` | Resolve file:line refs from stack traces; read ±20 lines context; output root-cause hypothesis with evidence and fix recommendation | BUG-INVESTIGATOR | "debug trace", "stack trace", "root cause", "error investigation", "fix recommendation" |
| `refactor_plan` | `skills/refactor_plan/` | Read source file; identify extract candidates with line ranges; produce named proposed-module list; requires human approval before execution | REFACTOR-SPECIALIST | "refactor plan", "extract module", "split file", "rule 7 fix", "extract hook" |
| `dependency_analysis` | `skills/dependency_analysis/` | Run npm outdated + npm audit --json; produce CRITICAL/HIGH/MEDIUM/LOW risk table; flag unapproved packages; write to DEPENDENCY_REPORT.md | DEPENDENCY-AUDITOR | "dependency audit", "npm audit", "cve check", "outdated packages", "unapproved package" |
| `code_summarize` | `skills/code_summarize/` | Read file/directory; produce plain-English summary with purpose, exports, deps, CLAUDE.md rule compliance badges (BADGE/FALLBACK/POPIA/LINES) | WORKFLOW-AUTOMATOR, REPO-ARCHITECT | "summarise code", "explain module", "what does this do", "documentation summary", "pr description" |

---

## Skill Invocation Pattern

Skills are invoked via the Claude Code `Skill` tool. Example:

```
Use the spatial_validation skill to check public/mock/suburbs.geojson
```

Or trigger keywords in natural language:
```
"validate this GeoJSON against the Cape Town bounding box"
→ Claude recognizes trigger keywords → invokes spatial_validation skill
```

Skills read their full playbook from `skills/<name>/SKILL.md` which contains:
- YAML frontmatter (name, description, generated_by, timestamp)
- Purpose
- Trigger conditions
- Step-by-step procedure with code examples
- Output format
- When NOT to use

---

## Adding a New Skill

1. Create directory: `skills/<snake_case_name>/`
2. Create `skills/<snake_case_name>/SKILL.md` with YAML frontmatter:
   ```yaml
   ---
   name: skill-name
   description: One-line description
   __generated_by: [agent or human]
   __timestamp: [ISO 8601]
   ---
   ```
3. Add entries to:
   - This `SKILLS.md` in the appropriate category table
   - `AGENTS.md` under the primary agent's Skills section
   - `.claude/INDEX.md` under the skills directory map
   - `docs/CHANGELOG_AUTO.md`
4. Run `ci_smoke_test` skill to verify the new skill is discoverable
5. Commit: `docs(skills): add [skill-name] skill [agent_id]`
