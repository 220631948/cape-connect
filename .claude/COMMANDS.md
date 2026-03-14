# COMMANDS.md — CapeTown GIS Hub Slash Command Catalogue

> Central registry for all `.claude/commands/` playbooks. Commands are slash-style prompts that trigger structured agent workflows. Each command has a dedicated playbook file with trigger phrase, procedure, expected output, and success criteria.

**Total commands:** 29 | **Last updated:** 2026-03-14 (ARIS self-evolution pass)

> **Session Protocol:** Run `/mcp-status` before any agent session. Run `/milestone-audit` before DoD sign-off.

---

## Command Index by Category

### 🛡️ Compliance (P0 — run before merge)

| Command | File | Purpose | Primary Agent | Related Skills |
|---------|------|---------|--------------|---------------|
| `/badge-audit [--fix] [--ci]` | `commands/badge-audit.md` | Scan all components for Rule 1 source badges; `--fix` inserts placeholders; `--ci` exits non-zero | BADGE-AUDIT-AGENT | `source_badge_lint`, `data_source_badge` |
| `/fallback-check [--create-mocks] [--ci]` | `commands/fallback-check.md` | Verify LIVE→CACHED→MOCK per API route; `--create-mocks` scaffolds missing stubs | FALLBACK-VERIFY-AGENT | `fallback_verify`, `three_tier_fallback` |

### 🏛️ Governance

| Command | File | Purpose | Primary Agent | Related Skills |
|---------|------|---------|--------------|---------------|
| `/check-remit` | `commands/check-remit.md` | Verify agent is within its allowed file scope | All agents | `instinct_guard` |
| `/audit-popia` | `commands/audit-popia.md` | Scan codebase for POPIA annotation compliance | AUTH-AGENT, DATA-AGENT | `popia_compliance`, `popia_spatial_audit` |
| `/milestone-status` | `commands/milestone-status.md` | Report current milestone progress and DoD checklist | ORCHESTRATOR | `docs_traceability_gate` |
| `/verify-sources` | `commands/verify-sources.md` | Verify all data sources are from approved Cape Town list | DATA-AGENT, RESEARCHER | `cape_town_gis_research`, `assumption_verification` |
| `/badge-check` | `commands/badge-check.md` | Audit all React components for Rule 1 data source badges | TEST-AGENT, DATA-AGENT | `data_source_badge`, `mock_to_live_validation` |

### 🚀 Milestone Management

| Command | File | Purpose | Primary Agent | Related Skills |
|---------|------|---------|--------------|---------------|
| `/m17-kickoff` | `commands/m17-kickoff.md` | Official M17 kickoff: confirm M16 DoD, create branch, generate stubs, baseline index | M17-ANALYSIS-AGENT | `project_audit`, `mcp_health_check`, `test_stub_gen`, `spatial_index` |
| `/milestone-audit [M<n>]` | `commands/milestone-audit.md` | Pre-DoD audit: 8 health areas; RULES_PASS%; READY FOR DOD or BLOCKERS | PROJECT-AUDIT-AGENT | `project_audit`, `source_badge_lint`, `fallback_verify`, `schema_smells`, `a11y_check` |

### 🔌 Infrastructure

| Command | File | Purpose | Primary Agent | Related Skills |
|---------|------|---------|--------------|---------------|
| `/mcp-status [--fix]` | `commands/mcp-status.md` | Health check all 21 MCP servers; P0 ESCALATE signal; safe-to-invoke guidance | MCP-HEALTH-AGENT | `mcp_health_check` |

### 📋 Provenance & Data

| Command | File | Purpose | Primary Agent | Related Skills |
|---------|------|---------|--------------|---------------|
| `/provenance-record <dataset>` | `commands/provenance-record.md` | Record dataset provenance: license check, provenance.py, CRS verify, DATA_REGISTRY.md | PROVENANCE-AGENT | `provenance_tag`, `spatial_validation` |

### ⚡ Quality & Performance

| Command | File | Purpose | Primary Agent | Related Skills |
|---------|------|---------|--------------|---------------|
| `/coverage-report [--generate-stubs]` | `commands/coverage-report.md` | Vitest coverage report; zero-coverage components; optional stub generation | TEST-COVERAGE-AGENT | `test_stub_gen`, `ci_smoke_test` |
| `/perf-audit [--url] [--update-baseline]` | `commands/perf-audit.md` | Lighthouse CWV + axe-core a11y; Fast 3G; compare vs baseline; flag regressions | PERFORMANCE-AGENT | `cwv_monitor`, `a11y_check` |

### 🌍 Spatial & Data

| Command | File | Purpose | Primary Agent | Related Skills |
|---------|------|---------|--------------|---------------|
| `/validate-spatial` | `commands/validate-spatial.md` | Validate GeoJSON/WKT against Cape Town bbox and CRS rules | SPATIAL-AGENT, DATA-AGENT | `spatial_validation` |
| `/arcgis-import` | `commands/arcgis-import.md` | Validate and plan import of ArcGIS `.shp`/`.gdb` files | DATA-AGENT | `arcgis_qgis_uploader`, `spatial_validation`, `popia_compliance` |
| `/qgis-import` | `commands/qgis-import.md` | Validate and plan import of QGIS `.qgz`/`.gpkg` files | DATA-AGENT | `arcgis_qgis_uploader`, `spatial_validation`, `popia_compliance` |

### 🗺️ Infrastructure & Tiles

| Command | File | Purpose | Primary Agent | Related Skills |
|---------|------|---------|--------------|---------------|
| `/optimize-tiles` | `commands/optimize-tiles.md` | Generate Tippecanoe command and Martin config for a layer | TILE-AGENT, MAP-AGENT | `tile_optimization` |
| `/new-component` | `commands/new-component.md` | Scaffold a new React component with badge, fallback, and POPIA stubs | All frontend agents | `documentation_first`, `three_tier_fallback`, `data_source_badge` |
| `/new-migration` | `commands/new-migration.md` | Scaffold a new Supabase SQL migration with RLS and POPIA stubs | DB-AGENT | `rls_audit`, `popia_compliance`, `security_review` |

### 🛸 Immersive Stack

| Command | File | Purpose | Primary Agent | Related Skills |
|---------|------|---------|--------------|---------------|
| `/cesium-validate` | `commands/cesium-validate.md` | Validate CesiumJS config, camera bounds, 3D Tiles, and attribution | CESIUM-AGENT | `cesium_3d_tiles`, `three_tier_fallback`, `data_source_badge` |
| `/opensky-check` | `commands/opensky-check.md` | Health-check OpenSky Network integration (rate limits, cache, POPIA) | FLIGHT-AGENT | `opensky_flight_tracking`, `popia_spatial_audit` |
| `/4dgs-status` | `commands/4dgs-status.md` | Status report for 4D Gaussian Splatting reconstruction pipeline | IMMERSIVE-AGENT | `nerf_3dgs_pipeline`, `4dgs_event_replay`, `cesium_3d_tiles` |
| `/immersive-check` | `commands/immersive-check.md` | Full health check across entire immersive spatial stack | IMMERSIVE-AGENT, CESIUM-AGENT | `cesium_3d_tiles`, `opensky_flight_tracking`, `nerf_3dgs_pipeline` |

---

## Command Details

### `/badge-check`
**Trigger:** `/badge-check` · "check data source badges" · "find components missing badges"
**File:** `./commands/badge-check.md`
**Purpose:** Enforces CLAUDE.md Rule 1. Scans all React components for visible `[SOURCE · YEAR · LIVE|CACHED|MOCK]` badges on data-displaying components.
**MCP Servers used:** `filesystem`, `chrome-devtools` (for visual verification)
**Success criteria:** All data-displaying components have a visible, correctly-tiered badge. Zero 🚨 errors.
**Usage example:**
```
/badge-check
→ Scans app/src/ for data components
→ Reports compliant, hidden, missing, and mismatched badges
→ Required before any milestone sign-off
```

---

### `/audit-popia`
**Trigger:** `/audit-popia` · "run POPIA scan" · "check privacy compliance"
**File:** `./commands/audit-popia.md`
**Purpose:** Enforces CLAUDE.md Rule 5. Scans all source files for POPIA annotation blocks on files handling personal data.
**MCP Servers used:** `filesystem`
**Success criteria:** All files with PII have a POPIA annotation block. No unannotated personal data handlers.
**Usage example:**
```
/audit-popia
→ Scans for files with personal data indicators (email, name, address, etc.)
→ Checks for POPIA annotation block presence
→ Reports missing annotations with suggested text
```

---

### `/check-remit`
**Trigger:** `/check-remit` · "am I within my allowed files?"
**File:** `./commands/check-remit.md`
**Purpose:** Reads the active agent definition and compares modified files against the agent's ALLOWED TOOLS AND FILES section. Prevents scope creep.
**MCP Servers used:** `filesystem`
**Success criteria:** All modified files are within the active agent's allowed scope.
**Usage example:**
```
/check-remit
→ Identifies current agent from context
→ Reads agent definition's allowed/prohibited files
→ Compares against git diff --name-only
→ Flags violations or grey areas
```

---

### `/milestone-status`
**Trigger:** `/milestone-status` · "what milestone are we on?" · "show DoD progress"
**File:** `./commands/milestone-status.md`
**Purpose:** Reports current milestone, completed DoD items, outstanding items, and blocking questions.
**MCP Servers used:** `filesystem`, `doc-state`
**Success criteria:** Produces a complete milestone report with green/amber/red status per DoD item.
**Usage example:**
```
/milestone-status
→ Reads CLAUDE.md CURRENT_PHASE
→ Reads PLAN.md DoD for current milestone
→ Reads docs/OPEN_QUESTIONS.md for blockers
→ Produces structured progress report
```

---

### `/verify-sources`
**Trigger:** `/verify-sources` · "verify data sources" · "check if this dataset is approved"
**File:** `./commands/verify-sources.md`
**Purpose:** Validates that all data sources in use are from the approved City of Cape Town / Western Cape open data catalogue.
**MCP Servers used:** `gis-mcp`, `exa`, `filesystem`
**Success criteria:** All data sources are traceable to `docs/research/open-datasets.md`. No unapproved or Lightstone sources.
**Usage example:**
```
/verify-sources
→ Scans code for data source URLs and dataset references
→ Checks against approved list in docs/research/open-datasets.md
→ Flags any Lightstone references (Rule 8 violation)
```

---

### `/validate-spatial`
**Trigger:** `/validate-spatial <path>` · "validate this GeoJSON" · "check spatial data"
**File:** `./commands/validate-spatial.md`
**Purpose:** Runs the `spatial_validation` skill on GeoJSON/WKT input. Checks bounding box, geometry validity, CRS, feature count, and coordinate precision.
**Skills invoked:** `spatial_validation`
**MCP Servers used:** `gis-mcp`, `filesystem`
**Success criteria:** All features within Cape Town bbox, no geometry errors, CRS = EPSG:4326.
**Usage example:**
```
/validate-spatial public/mock/suburbs.geojson
→ Checks all features within { west: 18.0, south: -34.5, east: 19.5, north: -33.0 }
→ Detects self-intersections, null geometries
→ Warns if > 10,000 features (recommend Martin MVT)
```

---

### `/arcgis-import`
**Trigger:** `/arcgis-import <path>` · "import shapefile" · "load .gdb"
**File:** `./commands/arcgis-import.md`
**Purpose:** Validates ArcGIS `.shp`/`.gdb` files for PostGIS import. Checks integrity, CRS, plans reprojection, scans for POPIA-sensitive fields, generates migration SQL.
**Skills invoked:** `arcgis_qgis_uploader`, `spatial_validation`, `popia_compliance`
**MCP Servers used:** `gis-mcp`, `formats`, `filesystem`
**Success criteria:** Integrity verified, CRS identified, POPIA scan complete, migration template generated.
**Usage example:**
```
/arcgis-import data/cadastral_parcels.shp
→ Validates .shp + .dbf + .shx + .prj present
→ Detects CRS (e.g., EPSG:2048 Lo19)
→ Plans ogr2ogr reprojection to EPSG:4326
→ Scans attributes for PII
→ Generates migration SQL template
```

---

### `/qgis-import`
**Trigger:** `/qgis-import <path>` · "import QGIS project" · "load .gpkg"
**File:** `./commands/qgis-import.md`
**Purpose:** Validates QGIS `.qgz`/`.gpkg` files for PostGIS import. Extracts project structure, inventories layers, detects CRS per layer, plans reprojection, scans for POPIA.
**Skills invoked:** `arcgis_qgis_uploader`, `spatial_validation`, `popia_compliance`
**MCP Servers used:** `gis-mcp`, `formats`, `filesystem`
**Success criteria:** All vector layers inventoried, CRS detected per layer, POPIA scan complete.
**Usage example:**
```
/qgis-import data/planning_data.qgz
→ Extracts .qgz (zip), reads .qgs XML
→ Lists all layers with geometry type, feature count, CRS
→ Plans per-layer ogr2ogr reprojection
→ Scans each layer's attributes for PII
```

---

### `/optimize-tiles`
**Trigger:** `/optimize-tiles` · "generate tile optimisation command" · "create Tippecanoe command"
**File:** `./commands/optimize-tiles.md`
**Purpose:** Generates a ready-to-run Tippecanoe command and Martin config snippet for a GeoJSON source or PostGIS table.
**Skills invoked:** `tile_optimization`
**MCP Servers used:** `gis-mcp`, `filesystem`, `docker`
**Success criteria:** Valid Tippecanoe command with Cape Town bbox clip, Martin config snippet, estimated file size.
**Usage example:**
```
/optimize-tiles public/mock/suburbs.geojson
→ Detects layer type (polygon, low detail)
→ Recommends zoom 8–14
→ Outputs Tippecanoe command with --clip-bounding-box=18.0,-34.5,19.5,-33.0
→ Outputs Martin config.yml source block
```

---

### `/new-component`
**Trigger:** `/new-component <name>` · "scaffold a new React component"
**File:** `./commands/new-component.md`
**Purpose:** Scaffolds a new React component file in `app/src/components/` with: TypeScript types, POPIA annotation stub (if data-handling), three-tier fallback pattern, data source badge placeholder, and CLAUDE.md Rule compliance comments.
**Skills invoked:** `documentation_first`, `three_tier_fallback`, `data_source_badge`
**MCP Servers used:** `filesystem`
**Success criteria:** Component file created at correct path, all stubs present, file ≤ 300 lines (Rule 7).
**Usage example:**
```
/new-component SuburbBoundaryLayer
→ Creates app/src/components/SuburbBoundaryLayer.tsx
→ Includes data badge placeholder [SOURCE · YEAR · LIVE|CACHED|MOCK]
→ Includes three-tier fallback import stubs
→ Includes POPIA annotation if data-handling component
```

---

### `/new-migration`
**Trigger:** `/new-migration <table>` · "create a new Supabase migration"
**File:** `./commands/new-migration.md`
**Purpose:** Scaffolds a new SQL migration file with timestamped filename, RLS enable/force, canonical tenant isolation policy, GiST index (for geometry tables), and POPIA annotation stub.
**Skills invoked:** `rls_audit`, `popia_compliance`
**MCP Servers used:** `filesystem`, `postgres`
**Success criteria:** Migration file created at `supabase/migrations/YYYYMMDDHHMMSS_[table].sql` with all required stubs.
**Usage example:**
```
/new-migration risk_zones
→ Creates supabase/migrations/20260314120000_risk_zones.sql
→ Includes CREATE TABLE with tenant_id UUID NOT NULL
→ Includes RLS ENABLE + FORCE + canonical isolation policy
→ Includes GiST spatial index if geometry column detected
→ Includes POPIA annotation stub
```

---

### `/cesium-validate`
**Trigger:** `/cesium-validate` · "check CesiumJS setup" · "validate 3D tiles"
**File:** `./commands/cesium-validate.md`
**Purpose:** Validates the CesiumJS integration: API keys, camera bounds (Cape Town bbox), 3D Tiles endpoint, MapLibre fallback, and attribution compliance.
**Skills invoked:** `cesium_3d_tiles`, `three_tier_fallback`, `data_source_badge`
**MCP Servers used:** `cesium`, `cesium-ion`, `filesystem`
**Success criteria:** All checks pass — token present, camera within bbox, 3D Tiles respond, attribution visible, fallback implemented.
**Usage example:**
```
/cesium-validate
→ Checks NEXT_PUBLIC_CESIUM_ION_TOKEN in .env
→ Verifies camera home: (18.4241, -33.9249)
→ Tests 3D Tiles endpoint responsiveness
→ Confirms MapLibre error boundary exists
→ Verifies attribution display
```

---

### `/opensky-check`
**Trigger:** `/opensky-check` · "check flight data" · "verify OpenSky"
**File:** `./commands/opensky-check.md`
**Purpose:** Health-checks the OpenSky Network integration: API connectivity, rate limiter, Cape Town bbox filter, cache TTL, and POPIA compliance for flight data.
**Skills invoked:** `opensky_flight_tracking`, `popia_spatial_audit`
**MCP Servers used:** `opensky`, `openaware`, `postgres`, `filesystem`
**Success criteria:** API reachable, rate limiter active, bbox filter applied, cache healthy, no PII linkage.
**Usage example:**
```
/opensky-check
→ Tests /states/all with Cape Town bbox lamin=-34.5&lomin=18.0&lamax=-33.0&lomax=19.5
→ Verifies rate limiter middleware on fetchFlightStates()
→ Checks api_cache for recent flight states
→ Confirms three-tier fallback to public/mock/flights.geojson
```

---

### `/4dgs-status`
**Trigger:** `/4dgs-status` · "check 4DGS pipeline" · "splatting status"
**File:** `./commands/4dgs-status.md`
**Purpose:** Status report for the 4D Gaussian Splatting pipeline: Python microservice, training data, output format (OGC 3D Tiles 1.1), temporal index, and EPSG:4326 georeferencing.
**Skills invoked:** `nerf_3dgs_pipeline`, `4dgs_event_replay`, `cesium_3d_tiles`
**MCP Servers used:** `stitch`, `nerfstudio`, `filesystem`, `docker`
**Success criteria:** Microservice running, training data within bbox, tileset.json valid, temporal index present, CRS correct.
**Usage example:**
```
/4dgs-status
→ Checks 4dgs-service Docker container
→ Verifies COLMAP SfM output exists
→ Validates tileset.json schema
→ Checks timestamp metadata in .b3dm tiles
→ Confirms output EPSG:4326 georeferencing
```

---

### `/immersive-check`
**Trigger:** `/immersive-check` · "check immersive stack" · "verify spatial services"
**File:** `./commands/immersive-check.md`
**Purpose:** Full health check across the entire immersive spatial stack. Runs `/cesium-validate`, `/opensky-check`, `/4dgs-status` and checks Docker containers and Martin tile server.
**Skills invoked:** `cesium_3d_tiles`, `opensky_flight_tracking`, `nerf_3dgs_pipeline`
**MCP Servers used:** `cesium`, `cesium-ion`, `opensky`, `openaware`, `stitch`, `nerfstudio`, `docker`, `filesystem`
**Success criteria:** All configured components healthy or appropriately marked NOT_CONFIGURED.
**Usage example:**
```
/immersive-check
→ Runs sub-checks for CesiumJS, OpenSky, 4DGS pipeline
→ Checks all immersive env vars
→ Verifies Docker containers (postgis, martin, 4dgs-service)
→ Tests Martin tile catalog endpoint
→ Produces tabular health summary
```

---

### 🏗️ ARIS Commands (6 new commands)

Added by ARIS self-evolution pass (2026-03-14). These commands expose the 6 new ARIS
general-workflow agents via slash-style invocation.

| Command | File | Purpose | Primary Agent | Related Skills |
|---------|------|---------|--------------|---------------|
| `/analyze-repo [--full] [--deps] [--architecture]` | `commands/analyze-repo.md` | Full repo intelligence scan: stack detect, module graph, dependency audit, Rule 7 check, optional ARCHITECTURE.md update | REPO-ARCHITECT | `stack_detect`, `repo_graph`, `dependency_analysis` |
| `/generate-tests [<path>] [--coverage-only] [--e2e]` | `commands/generate-tests.md` | Generate Vitest unit stubs and Playwright E2E skeletons for zero-coverage components and API routes | TEST-COVERAGE-AGENT | `test_stub_gen`, `ci_smoke_test` |
| `/debug-issue "<error>" [--file <path>] [--trace <stack>]` | `commands/debug-issue.md` | Investigate error/bug: trace stack frames, identify root cause, produce fix recommendation and regression test hint | BUG-INVESTIGATOR | `debug_trace`, `repo_graph`, `security_review` |
| `/refactor-module <file> [--extract <name>] [--dry-run]` | `commands/refactor-module.md` | Plan and execute module refactoring for Rule 7 violations; plan presented for human approval before any changes | REFACTOR-SPECIALIST | `refactor_plan`, `repo_graph`, `test_stub_gen` |
| `/update-docs [<path>] [--all] [--architecture] [--changelog]` | `commands/update-docs.md` | Update ARCHITECTURE.md, docs/INDEX.md auto-section, and CHANGELOG_AUTO.md to reflect current codebase state | WORKFLOW-AUTOMATOR | `code_summarize`, `docs_traceability_gate` |
| `/explain-architecture [<component>] [--agents] [--flows] [--rules]` | `commands/explain-architecture.md` | Plain-English architecture explanation for onboarding; covers agents, data flows, and all 10 CLAUDE.md rules | REPO-ARCHITECT | `code_summarize`, `stack_detect` |

---

## Adding a New Command

1. Create `./commands/<kebab-name>.md` using the template sections: `## Trigger`, `## What It Does`, `## Procedure`, `## Expected Output`, `## When NOT to Use`
2. Add entry to this `COMMANDS.md` catalogue in the appropriate category table
3. Update `.claude/INDEX.md` with the new command file entry
4. Append to `docs/CHANGELOG_AUTO.md`
5. Test with `/check-remit` to ensure the command stays within agent scope
