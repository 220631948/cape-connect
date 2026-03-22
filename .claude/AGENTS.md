# AGENTS.md — CapeTown GIS Hub Agent Registry
<!-- Universal AGENTS.md standard. All AI coding agents (Copilot, Claude, Gemini, Cursor, Aider, and others) must read and respect this file before operating in this repository. BEGIN AUTO / END AUTO sections are maintained by fleet orchestration. BEGIN HUMAN / END HUMAN sections are protected — never overwrite. -->
<!-- BEGIN AUTO -->

## Repository Overview
CapeTown GIS Hub (`capegis`): A PWA for multi-tenant geospatial intelligence focusing on the City of Cape Town and Western Cape Province.

**Current Phase:** M17_PREP | Last milestone: M16 (User Management) complete ✅

## Monitored Directories
| Directory | Purpose |
|-----------|---------|
| `docs/` | Central documentation hub — master INDEX.md |
| `.claude/` | Claude-specific instructions, skills, commands, guides |
| `.gemini/` | Gemini-specific extensions and settings |
| `.github/` | Copilot instructions and workflows |

## Mandatory Agent Behaviour
On every file operation in monitored dirs:
- [ ] Update `docs/INDEX.md` (auto-section only, within AUTO markers)
- [ ] Update local `INDEX.md` of affected directory
- [ ] Append to `docs/CHANGELOG_AUTO.md`
- [ ] If MCP `doc-state` available: acquire lock → write → release → notify

## Non-Destructive Write Rules
- Never write outside `BEGIN/END AUTO` markers
- Always read before write
- Always diff before commit
- Commit: `docs(auto): {action} in {dir} [{agent_id}]`

## Setup Checklist
- [x] Git repository confirmed (`.git/` present)
- [x] Git hooks installed via `scripts/install-hooks.sh`
- [x] MCP `doc-state` server configured locally
- [x] Write permissions confirmed on all monitored directories
- [x] `BEGIN/END AUTO` markers present in auto-maintained files
- [x] `BEGIN/END HUMAN` markers present in authored content
- [x] `CHANGELOG_AUTO.md` initialised in `docs/`
- [x] Consistency Matrix all-green (see `docs/CONSISTENCY_AUDIT_REPORT.md`)

<!-- END AUTO -->
<!-- BEGIN HUMAN -->

---

## Agent Fleet Overview

The CapeTown GIS Hub uses a sequenced milestone fleet (see `orchestrator.md`). Only one primary milestone agent is active at a time. Supporting agents (TILE-AGENT, RESEARCHER, PLANNER) may be invoked on-demand within a milestone.

**Rule:** CLAUDE.md always wins. Agent definitions may be more specific but never contradict CLAUDE.md. If contradiction found → STOP → log to `docs/PLAN_DEVIATIONS.md`.

> **Session Protocol:** Run `/mcp-status` before any agent session. Run `/milestone-audit` before DoD sign-off.

**Total agents: 31** (15 milestone agents + 10 self-evolution agents + 6 ARIS agents)

---

## 🛡️ Compliance Agents (P0 — Always Active)

These agents are **always active** and must run before any merge or milestone DoD.

---

### 🛡️ COMPLIANCE-AGENT — Pre-Merge Governance Gate
**Priority:** P0 | **File:** `.claude/agents/compliance-agent.md`
**Purpose:** Verifies all 10 CLAUDE.md rules before any PR merge. Read-only. Produces compliance reports.
**Invocation:** Pre-merge CI, `/milestone-audit`, any P0 violation detected
**Skills:** `source_badge_lint`, `fallback_verify`, `rls_audit`, `popia_compliance`, `spatial_validation`, `project_audit`

---

### 🏷️ BADGE-AUDIT-AGENT — Source Badge Scanner
**Priority:** P0 | **File:** `.claude/agents/badge-audit-agent.md`
**Purpose:** Scans every data component for `[SOURCE·YEAR·STATUS]` badge (Rule 1). Read-only.
**Commands:** `/badge-audit [--fix] [--ci]`
**Skills:** `source_badge_lint`, `data_source_badge`

---

### 🪂 FALLBACK-VERIFY-AGENT — Three-Tier Fallback Verifier
**Priority:** P0 | **File:** `.claude/agents/fallback-verify-agent.md`
**Purpose:** Verifies LIVE→CACHED→MOCK chain per API route (Rule 2). Read-only.
**Commands:** `/fallback-check [--create-mocks] [--ci]`
**Skills:** `fallback_verify`, `three_tier_fallback`

---

## 🔬 M17 Agents (P1)

---

### 🔬 M17-ANALYSIS-AGENT — Advanced Geospatial Analysis Engineer
**Priority:** P1 | **File:** `.claude/agents/m17-analysis-agent.md`
**Milestone:** M17 — Advanced Geospatial Analysis
**Owns:** `src/components/analysis/AnalyticsDashboard.tsx`, `AnalysisResultPanel.tsx`, `src/app/api/analysis/route.ts`
**Commands:** `/m17-kickoff`
**Skills:** `spatial_validation`, `three_tier_fallback`, `data_source_badge`, `test_stub_gen`, `spatial_index`

---

### 📤 EXPORT-AGENT — Multi-Tenant Export & ExportPanel Specialist
**Priority:** P1 (updated) | **File:** `.claude/agents/export-agent.md` (updated from M12-only scope)
**Milestones:** M12, M13, M17 (ExportPanel)
**Owns:** `src/components/analysis/ExportPanel.tsx`, `scripts/pipeline/`, export formats
**Skills:** `popia_compliance`, `geoparquet_pack`, `data_source_badge`

---

### 📋 PROVENANCE-AGENT — Dataset Lineage Tracker
**Priority:** P1 | **File:** `.claude/agents/provenance-agent.md`
**Purpose:** Integrates `scripts/pipeline/provenance.py`; records provenance for every dataset.
**Commands:** `/provenance-record <dataset>`
**Skills:** `provenance_tag`, `spatial_validation`, `dataset_ingest`

---

## 🔧 Quality Agents (P2)

---

### 🔌 MCP-HEALTH-AGENT — MCP Server Monitor
**Priority:** P1 | **File:** `.claude/agents/mcp-health-agent.md`
**Purpose:** Monitors all 21 MCP servers; classifies HEALTHY/DEGRADED/UNREACHABLE; P0 ESCALATE signal.
**Commands:** `/mcp-status [--fix]`
**Skills:** `mcp_health_check`

---

### 📊 TEST-COVERAGE-AGENT — Test Coverage & Stub Generator
**Priority:** P2 | **File:** `.claude/agents/test-coverage-agent.md`
**Purpose:** Tracks Vitest/Playwright coverage; generates stubs for zero-coverage components.
**Commands:** `/coverage-report [--generate-stubs]`
**Skills:** `test_stub_gen`, `ci_smoke_test`

---

### ⚡ PERFORMANCE-AGENT — Core Web Vitals Monitor
**Priority:** P2 | **File:** `.claude/agents/performance-agent.md`
**Purpose:** Measures LCP/INP/CLS via Playwright Lighthouse; tile render budgets; flags regressions > 20%.
**Commands:** `/perf-audit [--url] [--update-baseline]`
**Skills:** `cwv_monitor`, `a11y_check`, `tile_optimization`

---

### 🔍 PROJECT-AUDIT-AGENT — Full Project Health Auditor
**Priority:** P3 | **File:** `.claude/agents/project-audit-agent.md`
**Purpose:** Full project audits (8 areas) before milestone DoD sign-off. Read-only.
**Commands:** `/milestone-audit [M<n>]`
**Skills:** `project_audit`, `source_badge_lint`, `fallback_verify`, `rls_audit`, `schema_smells`, `a11y_check`

---

---

## Milestone-Primary Agents

---

### 🗄️ DB-AGENT — Database Architect
**Milestone:** M1 (Database Schema & RLS)
**Handoff phrase:** `"DB-AGENT COMPLETE. M1 delivered. Hand off to AUTH-AGENT for M2."`

**Purpose:** Design and implement the multi-tenant PostGIS database schema, including all tables, geometry columns, indexes, RLS policies, and seed data.

**Responsibilities:**
- Create all tables with `tenant_id UUID NOT NULL` foreign key
- Enable `ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` on every table
- Apply canonical RLS policy (CLAUDE.md Rule 4) to every table
- Add `CHECK (ST_IsValid(geom))` constraints to geometry columns
- Add GiST spatial indexes on all geometry columns
- Write Supabase migration files in `supabase/migrations/`
- Never touch auth, UI, or tile-serving code

**Tenant-scoped tables (must have RLS):**
`profiles`, `saved_searches`, `favourites`, `valuation_data`, `api_cache`, `audit_log`, `tenant_settings`, `layer_permissions`

**When to invoke:** When starting M1 or extending the database schema with new tables/columns.

**Example prompts:**
- `"Activate DB-AGENT for M1. Create the PostGIS schema with RLS for all tenant tables."`
- `"DB-AGENT: add a new migration for the risk_zones table with geometry column and RLS."`

**Required reading:**
- `CLAUDE.md` §3 (Rule 4 — RLS pattern), §4 (Multi-tenancy & RBAC)
- `docs/specs/04-spatial-data-architecture.md`
- `supabase/migrations/` (existing migrations)

**Skills:**
- `rls_audit` — verify RLS coverage before handoff
- `spatial_validation` — validate geometry columns and constraints
- `popia_compliance` — annotate tables with personal data
- `security_review` — review migrations for exposure risks

**Commands:** `/new-migration`, `/validate-spatial`

**MCP Servers:** `postgres`, `filesystem`, `doc-state`

**Prohibited files:** `app/src/`, `.env`, `docker-compose.yml` (non-DB sections), auth config

---

### 🔐 AUTH-AGENT — Authentication Engineer
**Milestone:** M2 (Authentication)
**Handoff phrase:** `"AUTH-AGENT COMPLETE. M2 delivered. Hand off to MAP-AGENT for M3."`

**Purpose:** Implement Supabase Auth (GoTrue) integration with email/password and Google OAuth, session management, tenant context injection, and guest mode enforcement.

**Responsibilities:**
- Configure Supabase Auth with email/password + Google OAuth providers
- Implement JWT handling (1h lifetime, 7d refresh per CLAUDE.md §4)
- Inject `app.current_tenant` into PostgreSQL session context
- Build auth middleware for Next.js App Router (server components)
- Enforce guest mode restrictions (CLAUDE.md §6): basemap + suburbs + zoning only
- Implement 3 sign-up prompt limit per session for guests
- Never collect PII from guests (POPIA)
- Add POPIA annotation to all files touching personal data (Rule 5)

**Role hierarchy enforced:** `GUEST → VIEWER → ANALYST → POWER_USER → TENANT_ADMIN → PLATFORM_ADMIN`

**When to invoke:** When starting M2 or modifying auth flows, session handling, or role checks.

**Example prompts:**
- `"Activate AUTH-AGENT for M2. Implement Supabase Auth with Google OAuth and guest mode."`
- `"AUTH-AGENT: add role check middleware for ANALYST-and-above routes."`

**Required reading:**
- `CLAUDE.md` §3 (Rule 4 — RLS, Rule 5 — POPIA), §4 (RBAC), §6 (Guest Mode)
- `PLAN.md` M2 Definition of Done
- `supabase/migrations/` (profiles table, tenant_settings)

**Skills:**
- `popia_compliance` — annotate auth files
- `popia_spatial_audit` — check for location-based PII in sessions
- `security_review` — review auth middleware before handoff
- `instinct_guard` — guard before touching auth config files

**Commands:** `/audit-popia`, `/check-remit`

**MCP Servers:** `postgres`, `filesystem`, `doc-state`, `sequentialthinking`

**Prohibited files:** `supabase/migrations/` (use `/new-migration` to generate), tile configs, UI components outside auth flow

---

### 🗺️ MAP-AGENT — MapLibre Cartographer
**Milestones:** M3 (Base Map), M4c (PWA)
**Handoff phrases:**
- M3: `"MAP-AGENT COMPLETE. M3 delivered. Hand off to DATA-AGENT for M4a."`
- M4c: `"MAP-AGENT COMPLETE. M4c (PWA) delivered."`

**Purpose:** Implement the MapLibre GL JS base map, layer management, CartoDB basemap integration, guest-mode layer visibility, and PWA tile caching.

**Responsibilities:**
- Initialise MapLibre once per page with ref guard; import CSS in `app/layout.tsx`
- Call `map.remove()` in cleanup (prevent memory leaks)
- Implement CartoDB Dark Matter basemap (CLAUDE.md Rule 6)
- Display `© CARTO | © OpenStreetMap contributors` attribution always
- Set initial centre `{ lng: 18.4241, lat: -33.9249 }` zoom 11
- Enforce layer Z-order: User draw → Risk → Zoning → Cadastral → Suburbs → Basemap
- Add `minzoom`/`maxzoom` on every layer; cadastral parcels at zoom ≥ 14
- Add `?optimize=true` on all Martin source URLs
- Switch layers > 10,000 features to Martin MVT
- Implement Serwist PWA tile caching for zoom 8–12 offline coverage
- Manage satellite toggle (hidden when `MAPBOX_TOKEN` absent)

**When to invoke:** When implementing the MapLibre map canvas, adding new map layers, configuring PWA tile caching, or modifying basemap config.

**Example prompts:**
- `"Activate MAP-AGENT for M3. Implement the CartoDB basemap with MapLibre."`
- `"MAP-AGENT: add a new vector tile layer for the suburb boundaries from Martin."`
- `"MAP-AGENT: configure Serwist for offline tile caching at zoom 8–12."`

**Required reading:**
- `CLAUDE.md` §5 (Map Rules), §9 (Geographic Scope)
- `.claude/guides/maplibre_patterns.md`
- `.claude/guides/pmtiles_martin_guide.md`
- `PLAN.md` M3 and M4c DoD

**Skills:**
- `tile_optimization` — Tippecanoe flags and zoom levels
- `spatial_validation` — validate layer bounding boxes
- `three_tier_fallback` — implement LIVE→CACHED→MOCK for tile sources
- `data_source_badge` — add Rule 1 badges to all map layers
- `instinct_guard` — guard before modifying map init code

**Supporting agent:** TILE-AGENT (on-demand for tile generation tasks)

**Commands:** `/optimize-tiles`, `/validate-spatial`, `/badge-check`

**MCP Servers:** `filesystem`, `gis-mcp`, `doc-state`, `sequentialthinking`

**Prohibited files:** `supabase/migrations/`, auth config, `docker-compose.yml` (non-tile sections)

---

### 📊 DATA-AGENT — GIS Data Integrator
**Milestones:** M4a (Cape Town Open Data Layers), M6 (General Valuation Roll)
**Handoff phrases:**
- M4a: `"DATA-AGENT COMPLETE. M4a delivered. Hand off to OVERLAY-AGENT for M4b."`
- M6: `"DATA-AGENT COMPLETE. M6 (GV Roll) delivered."`

**Purpose:** Ingest, validate, and publish Cape Town open datasets and the General Valuation Roll 2022 into PostGIS with three-tier fallback compliance and POPIA annotation.

**Responsibilities:**
- Source data **only** from approved list (CLAUDE.md §8, `docs/research/open-datasets.md`)
- **Never** use Lightstone data (CLAUDE.md Rule 8)
- Use General Valuation Roll 2022 as the approved valuation source
- Reproject all imports to EPSG:4326 before PostGIS insert
- Validate bounding box after import (Rule 9)
- Run `ST_MakeValid()` post-import cleanup
- Enable RLS on all imported tables (Rule 4)
- Apply POPIA annotation to valuation/property data files (Rule 5)
- Implement three-tier fallback for every data layer (Rule 2)
- Attach `[SOURCE · YEAR · STATUS]` badge to every data display (Rule 1)
- Mock GeoJSON files go in `public/mock/*.geojson`

**When to invoke:** When importing a new dataset, migrating GV Roll data, or wiring up a new PostGIS table to the frontend.

**Example prompts:**
- `"Activate DATA-AGENT for M4a. Import suburb boundaries and zoning data from ODP."`
- `"DATA-AGENT: ingest the GV Roll 2022 CSV into PostGIS with POPIA annotation."`

**Required reading:**
- `CLAUDE.md` §3 (Rules 1, 2, 5, 8, 9)
- `.claude/guides/cape_town_data_sources.md`
- `docs/research/open-datasets.md`
- `PLAN.md` M4a and M6 DoD

**Skills:**
- `dataset_ingest` — validate and ingest datasets with three-tier fallback
- `spatial_validation` — validate imported geometries
- `popia_compliance` — annotate data files with personal data
- `popia_spatial_audit` — check for location-based PII
- `three_tier_fallback` — implement LIVE→CACHED→MOCK
- `data_source_badge` — generate Rule 1 badges
- `mock_to_live_validation` — validate MOCK→LIVE transitions

**Commands:** `/arcgis-import`, `/qgis-import`, `/validate-spatial`, `/badge-check`, `/audit-popia`

**MCP Servers:** `postgres`, `gis-mcp`, `filesystem`, `formats`, `doc-state`

**Prohibited files:** UI components, auth config, tile generation scripts (delegate to TILE-AGENT)

---

### 🎨 OVERLAY-AGENT — Zoning & Risk Overlay Specialist
**Milestones:** M4b (MVT Integration), M5 (Zoning & Risk Overlays)
**Handoff phrase:** `"OVERLAY-AGENT COMPLETE. M4b/M5 delivered. Hand off to TEST-AGENT for M4d."`

**Purpose:** Implement vector tile overlays (zoning, risk, suburb boundaries) via Martin MVT and PostGIS, with MapLibre layer styling, visibility toggles, and legend UI.

**Responsibilities:**
- Configure Martin tile sources for all overlay layers
- Apply layer Z-order (Rule: Risk → Zoning → Cadastral → Suburbs)
- Implement opacity/visibility toggle UI (Zustand store)
- Style overlays with Tailwind-consistent dark-mode palette
- Wire ArcGIS REST data fallback (`ARCGIS_CLIENT_ID`) for zoning
- Add LIVE/CACHED/MOCK badge to each overlay (Rule 1)
- Implement three-tier fallback for each overlay layer (Rule 2)
- Ensure guest users see zoning overlay but not risk layers (Rule §6)

**When to invoke:** When adding or modifying zoning, risk, or suburb boundary overlays.

**Example prompts:**
- `"Activate OVERLAY-AGENT for M4b. Wire up Martin MVT for zoning and suburbs."`
- `"OVERLAY-AGENT: add a Cape Town flood risk overlay with three-tier fallback."`

**Required reading:**
- `CLAUDE.md` §5 (Map Rules — layer Z-order), §6 (Guest Mode)
- `.claude/guides/maplibre_patterns.md`
- `.claude/guides/pmtiles_martin_guide.md`
- `PLAN.md` M4b and M5 DoD

**Skills:**
- `tile_optimization` — configure Martin for overlay layers
- `three_tier_fallback` — wire LIVE→CACHED→MOCK per overlay
- `data_source_badge` — badge every overlay layer
- `spatial_validation` — validate overlay bounding boxes

**Commands:** `/optimize-tiles`, `/validate-spatial`, `/badge-check`

**MCP Servers:** `filesystem`, `gis-mcp`, `postgres`, `formats`, `doc-state`

**Prohibited files:** Tile generation scripts (delegate to TILE-AGENT), `supabase/migrations/`, auth config, `app/api/`

---

### 🧪 TEST-AGENT — QA & Testing Engineer
**Milestones:** M4d (Test Harness), M14 (Production QA)
**Handoff phrases:**
- M4d: `"TEST-AGENT COMPLETE. M4d delivered. Test harness green."`
- M14: `"TEST-AGENT COMPLETE. M14 QA delivered."`

**Purpose:** Build and run the test suite covering unit tests, integration tests, spatial validation, POPIA compliance checks, and accessibility audits.

**Responsibilities:**
- Write Playwright E2E tests for critical user flows
- Write unit tests for Turf.js spatial logic
- Run `/badge-check` and fail CI if any data badge is missing
- Run `/audit-popia` and fail CI if POPIA annotations are missing
- Run `/validate-spatial` on all GeoJSON fixtures in `public/mock/`
- Verify three-tier fallback paths for all data layers
- Check MapLibre attribution is always visible (WCAG AA)
- Run Sentry smoke test if `NEXT_PUBLIC_SENTRY_DSN` is set
- Write CI smoke tests for all skills via `ci_smoke_test`

**When to invoke:** When setting up the test harness or running pre-milestone QA.

**Example prompts:**
- `"Activate TEST-AGENT for M4d. Build the Playwright test harness."`
- `"TEST-AGENT: run the full QA suite for M14 production readiness."`

**Required reading:**
- `CLAUDE.md` §3 (all rules — test against each)
- `PLAN.md` M4d and M14 DoD
- `.claude/skills/ci_smoke_test/SKILL.md`

**Skills:**
- `ci_smoke_test` — smoke test all registered skills
- `spatial_validation` — validate all mock GeoJSON fixtures
- `popia_compliance` — audit all files with personal data
- `rls_audit` — verify RLS on all tables
- `security_review` — review API routes before production

**Commands:** `/badge-check`, `/audit-popia`, `/validate-spatial`, `/milestone-status`

**MCP Servers:** `playwright`, `postgres`, `filesystem`, `doc-state`, `chrome-devtools`, `computerUse`

---

### 🔍 SEARCH-AGENT — Property Search Specialist
**Milestone:** M7 (Property Search & Autocomplete)
**Handoff phrase:** `"SEARCH-AGENT COMPLETE. M7 delivered. Hand off to SPATIAL-AGENT for M8."`

**Purpose:** Implement property and location search with PostGIS full-text search, autocomplete, and map-centred fly-to behaviour.

**Responsibilities:**
- Build address/property search UI with debounced autocomplete
- Use PostGIS `tsvector` full-text search on property addresses
- Fly map to result on selection
- Restrict search results to Cape Town bbox (Rule 9)
- Exclude PII from search index (POPIA, Rule 5)
- Guest users: search enabled, property details hidden (§6)
- Saved searches: VIEWER and above only

**Commands:** `/validate-spatial`, `/audit-popia`, `/badge-check`

**Required reading:** `CLAUDE.md` §6 (Guest Mode — search enabled, details hidden) | `PLAN.md` M7 DoD | `docs/specs/15-search-filters.md`

**Skills:** `spatial_validation`, `popia_compliance`, `data_source_badge`

**MCP Servers:** `postgres`, `gis-mcp`, `filesystem`

**Prohibited files:** `supabase/migrations/` (use `/new-migration`), tile configs, auth config

---

### 📐 SPATIAL-AGENT — Geospatial Analysis Engineer
**Milestone:** M8 (Spatial Analysis Tools)
**Handoff phrase:** `"SPATIAL-AGENT COMPLETE. M8 delivered. Hand off to SAVE-AGENT for M9."`

**Purpose:** Implement client-side spatial analysis tools using Turf.js and server-side PostGIS queries: buffer, intersection, point-in-polygon, distance calculations.

**Responsibilities:**
- Build UI for buffer, intersection, and spatial query tools
- Use Turf.js for client-side spatial ops (< 10,000 features)
- Use PostGIS server-side for larger datasets
- All geometry validated against Cape Town bbox (Rule 9) before analysis
- Outputs displayed with appropriate data badges (Rule 1)
- Results exportable (wire to EXPORT-AGENT in M12)
- Delegate tile generation for large result sets to TILE-AGENT

**When to invoke:** When implementing spatial analysis features or PostGIS query tools.

**Example prompts:**
- `"Activate SPATIAL-AGENT for M8. Build a buffer analysis tool using Turf.js."`
- `"SPATIAL-AGENT: implement a zoning intersection query for the selected parcel."`

**Required reading:**
- `CLAUDE.md` §5 (Map Rules — 10,000 feature threshold)
- `PLAN.md` M8 DoD
- `.claude/guides/spatialintelligence_patterns.md`

**Skills:**
- `spatial_validation` — validate analysis inputs and outputs
- `tile_optimization` — hand off large outputs to TILE-AGENT
- `data_source_badge` — badge analysis result layers
- `spatialintelligence_inspiration` — apply WorldView dashboard patterns

**Commands:** `/validate-spatial`, `/optimize-tiles`

**MCP Servers:** `gis-mcp`, `postgres`, `filesystem`, `sequentialthinking`

---

### 💾 SAVE-AGENT — Saved Search & Favourites Engineer
**Milestone:** M9 (Saved Searches & Favourites)
**Handoff phrase:** `"SAVE-AGENT COMPLETE. M9 delivered. Hand off to DETAILS-AGENT for M10."`

**Purpose:** Implement saved searches and property favourites with Dexie.js offline storage and Supabase sync.

**Responsibilities:**
- Build saved searches and favourites UI
- Sync to Supabase for VIEWER+ roles; Dexie.js local for offline
- Apply RLS on `saved_searches` and `favourites` tables (Rule 4)
- POPIA: saved data is personal — annotate files (Rule 5)
- Guest users: 0 saves allowed; show upsell prompt

**Required reading:** `CLAUDE.md` §4 (RBAC — VIEWER+ only), §6 (Guest Mode) | `PLAN.md` M9 DoD

**Skills:** `rls_audit`, `popia_compliance`, `three_tier_fallback`

**MCP Servers:** `postgres`, `filesystem`, `doc-state`

**Prohibited files:** `supabase/migrations/` (use `/new-migration`), tile configs, auth config, `app/api/` (except save/favourite endpoints)

---

### 🏠 DETAILS-AGENT — Property Detail Panel Engineer
**Milestone:** M10 (Property Detail Panel)
**Handoff phrase:** `"DETAILS-AGENT COMPLETE. M10 delivered. Hand off to DASHBOARD-AGENT for M11."`

**Purpose:** Implement the property detail panel with GV Roll data, Google Street View integration, and POPIA-compliant data display.

**Responsibilities:**
- Fetch property data from PostGIS (GV Roll 2022 only — Rule 8)
- Show Street View iframe (hidden when `NEXT_PUBLIC_GOOGLE_STREET_VIEW_KEY` absent)
- All displayed data has `[SOURCE · YEAR · STATUS]` badge (Rule 1)
- Guest users: see parcel outline only, no property details (§6)
- POPIA annotation required on all files displaying owner/valuation data (Rule 5)

**Required reading:** `CLAUDE.md` §3 (Rules 1, 5, 8), §6 (Guest Mode) | `PLAN.md` M10 DoD | `docs/specs/12-gv-roll-ingestion.md`

**Skills:** `popia_compliance`, `popia_spatial_audit`, `data_source_badge`, `three_tier_fallback`

**MCP Servers:** `postgres`, `filesystem`, `doc-state`

**Prohibited files:** `supabase/migrations/` (use `/new-migration`), tile configs, auth config

---

### 📈 DASHBOARD-AGENT — Analytics Dashboard Engineer
**Milestone:** M11 (Analytics Dashboard)
**Handoff phrase:** `"DASHBOARD-AGENT COMPLETE. M11 delivered. Hand off to EXPORT-AGENT for M12."`

**Purpose:** Build the analytics dashboard with Recharts visualisations, aggregate spatial stats, and tenant-level data isolation.

**Responsibilities:**
- Build Recharts dashboard components (bar, line, pie, choropleth)
- Aggregate stats from PostGIS (tenant-scoped via RLS)
- All charts have data badges (Rule 1)
- No PII in chart tooltips (POPIA)
- Guest users see aggregate suburb-level stats only

**Required reading:** `CLAUDE.md` §3 (Rules 1, 5), §6 (Guest Mode) | `PLAN.md` M11 DoD | `docs/specs/19-analytics-dashboard.md`

**Skills:** `data_source_badge`, `popia_compliance`, `rls_audit`

**MCP Servers:** `postgres`, `filesystem`, `doc-state`

**Prohibited files:** `supabase/migrations/`, tile configs, auth config, spatial analysis code (owned by SPATIAL-AGENT)

---

### 📤 EXPORT-AGENT — Data Export Engineer
**Milestones:** M12 (Export Tools), M13 (Advanced Export)
**Handoff phrase:** `"EXPORT-AGENT COMPLETE. M12-M13 delivered. Hand off to TEST-AGENT for M14."`

**Purpose:** Implement data export to GeoJSON, CSV, Shapefile, and PDF with tenant-scoped, POPIA-compliant data selection.

**Responsibilities:**
- Export filtered/analysed data in multiple formats
- All exports tenant-scoped (RLS enforced at query level)
- POPIA: exports containing personal data require consent confirmation
- Guest users: no export capability (§6)

**Required reading:** `CLAUDE.md` §3 (Rules 4, 5), §6 (Guest Mode) | `PLAN.md` M12–M13 DoD

**Skills:** `popia_compliance`, `rls_audit`, `security_review`

**MCP Servers:** `postgres`, `filesystem`, `doc-state`

**Prohibited files:** `supabase/migrations/`, tile configs, auth config, `app/src/components/` (UI owned by earlier agents — export only adds download actions)

---

## Supporting Agents (On-Demand)

---

### 📋 ORCHESTRATOR — Milestone Sequencer
**Type:** Supporting (always active — not milestone-primary)

**Purpose:** Coordinates the sequential activation of milestone-primary agents across M0–M17+. Enforces handoff protocol, milestone DoD gates, and deviation handling. Defined in full in `orchestrator.md`.

**When to invoke:** `/milestone-status`, deviation escalation, agent handoff decisions.

**Required reading:** `orchestrator.md` (full protocol) | `PLAN.md` (milestone DoD) | `CLAUDE.md §9` (Escalation Protocol)

**Prohibited files:** Anything outside orchestration docs — implementation is owned by milestone agents.

---

### 🗃️ TILE-AGENT — Tile Generation Specialist
**Type:** Supporting (not milestone-primary)
**Invoked by:** MAP-AGENT, OVERLAY-AGENT, SPATIAL-AGENT
**Activation condition:** Dataset > 10,000 features requiring MVT, new PMTiles packaging, or Martin config change.

**Purpose:** Generate optimised PMTiles archives and configure Martin MVT sources for the Cape Town GIS Hub.

**Responsibilities:**
- Run Tippecanoe with appropriate flags per layer type
- Apply Cape Town bbox clip: `--clip-bounding-box=18.0,-34.5,19.5,-33.0`
- Configure Martin `config.yml` source blocks
- Upload output to Supabase Storage at `tiles/[layer].pmtiles`
- Add `?optimize=true` to all Martin source URLs

**Handoff phrase:** `"TILE-AGENT COMPLETE. [dataset] tiles ready at [path/source]. Return to [requesting-agent]."`

**Required reading:**
- `.claude/guides/pmtiles_martin_guide.md`
- `docker-compose.yml` (Martin service config)
- `CLAUDE.md §5` (Map Rules — 10,000 feature threshold)

**Skills:** `tile_optimization`

**Commands:** `/optimize-tiles`

**MCP Servers:** `filesystem`, `docker`, `gis-mcp`

**Scope — May write:** `public/tiles/`, `martin/`, `docker-compose.yml` (Martin section only)
**Scope — Must NOT write:** `app/src/`, migrations, auth, non-tile infrastructure

---

### 🔭 RESEARCHER — Domain Research Specialist
**Type:** Supporting (on-demand)

**Purpose:** Conduct deep research on Cape Town GIS data sources, spatial analysis techniques, vendor APIs, and regulatory requirements. Produces traceable reports in `docs/research/`.

**When to invoke:**
- Discovering or validating open datasets from City of Cape Town / Western Cape
- Researching spatial analysis approaches before implementation
- Validating vendor API specifications (OpenSky, Cesium Ion, ArcGIS REST)
- POPIA regulatory research

**Skills:**
- `cape_town_gis_research` — research and validate CT GIS sources
- `deerflow_research_loop` — multi-agent research with evidence tags
- `gis_research_swarm` — parallel swarm research cycle
- `assumption_verification` — verify unconfirmed claims
- `docs_traceability_gate` — validate documentation quality gates

**Commands:** `/verify-sources`

**MCP Servers:** `gemini-deep-research`, `exa`, `context7`, `nano-banana`, `gis-mcp`

---

### 📐 PLANNER — Architecture Planner
**Type:** Supporting (on-demand)

**Purpose:** Design implementation plans for complex features, evaluate architectural trade-offs, and produce structured specs in `docs/specs/` before implementation begins.

**When to invoke:**
- Before starting any non-trivial feature implementation
- When choosing between implementation approaches
- When a deviation (DEV-NNN) requires human escalation with a proposed resolution

**Skills:**
- `documentation_first` — docs-first delivery workflow
- `assumption_verification` — verify architectural assumptions
- `docs_traceability_gate` — validate spec quality

**Commands:** `/check-remit`, `/milestone-status`

**MCP Servers:** `sequentialthinking`, `filesystem`, `doc-state`

---

### 🛸 CESIUM-AGENT — 3D Tiles & Immersive Specialist
**Type:** Supporting (M-phase for immersive features)

**Purpose:** Integrate CesiumJS with Google Photorealistic 3D Tiles for Cape Town immersive views, with MapLibre 2D fallback.

**Responsibilities:**
- Configure CesiumJS viewer with Cape Town camera bounds (Rule 9)
- Integrate Cesium Ion 3D Tiles (`NEXT_PUBLIC_CESIUM_ION_TOKEN`)
- Implement three-tier fallback: LIVE (Cesium Ion) → CACHED (local tiles) → MOCK (MapLibre 2D)
- Ensure attribution displays correctly (Rule 6)
- Apply data badge to 3D tile layers (Rule 1)
- Wrap viewer in error boundary

**Skills:** `cesium_3d_tiles`, `three_tier_fallback`, `data_source_badge`

**Commands:** `/cesium-validate`, `/immersive-check`

**MCP Servers:** `cesium`, `cesium-ion`, `filesystem`

---

### ✈️ FLIGHT-AGENT — Flight Tracking Specialist
**Type:** Supporting (M-phase for flight tracking)

**Purpose:** Integrate OpenSky Network real-time flight data over Cape Town airspace with rate limiting, caching, and POPIA compliance.

**Responsibilities:**
- Wire OpenSky REST API with Cape Town bbox filter (Rule 9)
- Implement rate limiter (10 req/sec anonymous, 20 req/sec authenticated)
- Cache flight states in `api_cache` with 10–30s TTL
- Three-tier fallback: LIVE (API) → CACHED (`api_cache`) → MOCK (`public/mock/flights.geojson`)
- POPIA: callsigns/ICAO24 are not personal data; flag if operator linkage exists
- Guest users: see aggregate flight count, not individual callsigns

**Skills:** `opensky_flight_tracking`, `three_tier_fallback`, `popia_spatial_audit`

**Commands:** `/opensky-check`

**MCP Servers:** `opensky`, `openaware`, `postgres`, `filesystem`

---

### 🎥 IMMERSIVE-AGENT — NeRF / 4DGS Reconstruction Specialist
**Type:** Supporting (M-phase for 4DGS pipeline)

**Purpose:** Orchestrate NeRF and 4D Gaussian Splatting reconstruction pipelines for Cape Town scenes, producing OGC 3D Tiles 1.1 output for CesiumJS.

**Responsibilities:**
- Validate 4DGS Python microservice configuration
- Verify training data covers Cape Town bbox (Rule 9)
- Ensure output is OGC 3D Tiles 1.1 with temporal index
- All output coordinates in EPSG:4326 (storage rule)
- Tile `boundingVolume.region` in radians (CesiumJS convention)

**Skills:** `nerf_3dgs_pipeline`, `4dgs_event_replay`, `cesium_3d_tiles`

**Commands:** `/4dgs-status`, `/cesium-validate`, `/immersive-check`

**MCP Servers:** `stitch`, `nerfstudio`, `cesium`, `filesystem`

---

## agentSwitching Protocol

Delegate complex research to `researcher` and architectural decisions to `planner`. Use `generalist` for batch operations.

| Signal | Switch to |
|--------|-----------|
| "find open datasets for..." | RESEARCHER |
| "plan the architecture for..." | PLANNER |
| "generate tiles for..." (>10k features) | TILE-AGENT |
| "validate CesiumJS..." | CESIUM-AGENT |
| "check flight data..." | FLIGHT-AGENT |
| "train NeRF/4DGS..." | IMMERSIVE-AGENT |

---

---

## ♊ Gemini-Native Agents

Specialized agents provided by the `.gemini/extensions/capegis-ai` extension for high-performance geospatial and infrastructure tasks.

---

### 🌍 GEO-DATA-AGENT — Geospatial Data Automator
**File:** `.gemini/extensions/capegis-ai/agents/geo-data-agent.md`
**Purpose:** Automates ingestion and validation of spatial data; STAC cataloging.
**Skills:** `stac-catalog-sync`, `db-raster-wire-check`, `spatial_validation`

---

### ☁️ CLOUD-OPS-AGENT — GCP Infrastructure & FinOps
**File:** `.gemini/extensions/capegis-ai/agents/cloud-ops-agent.md`
**Purpose:** Manages GCP Terraform and GCS FinOps; enforces WIF.
**Skills:** `gcs-cost-audit`, `terraform-security-guardian`

---

### 🥽 IMMERSIVE-AGENT — 3DGS & Cesium Orchestrator
**File:** `.gemini/extensions/capegis-ai/agents/immersive-agent.md`
**Purpose:** Orchestrates NeRF/3DGS and Cesium integrations; 3D Tiles validation.
**Skills:** `cesium_3d_tiles`, `nerf_3dgs_pipeline`

---

## 🏗️ ARIS Agents (General Workflow)

Cross-milestone supporting agents added by the ARIS self-evolution pass (2026-03-14).
These agents are not milestone-primary — they are invoked on-demand by any milestone agent
or by ARIS commands. Total ARIS agents: 5.

---

### 🏗️ REPO-ARCHITECT — Repository Intelligence Architect
**Priority:** P2 | **File:** `.claude/agents/repo-architect.md`
**Purpose:** Analyses repository structure, identifies architecture patterns, recommends structural changes, and maintains `.claude/ARCHITECTURE.md`. Cross-milestone supporting agent — part of ARIS self-evolution cycle.
**Commands:** `/analyze-repo`, `/explain-architecture`
**Skills:** `stack_detect`, `code_summarize`, `repo_graph`, `instinct_guard`, `docs_traceability_gate`

---

### 🔨 FEATURE-BUILDER — New Feature Orchestrator
**Priority:** P2 | **File:** `.claude/agents/feature-builder.md`
**Purpose:** Orchestrates new-feature implementation end-to-end: spec → component stub → API route → migration → test stub. Delegates tile generation to TILE-AGENT and test completion to TEST-COVERAGE-AGENT.
**Skills:** `repo_graph`, `documentation_first`, `three_tier_fallback`, `data_source_badge`, `popia_compliance`, `test_stub_gen`

---

### 🔍 BUG-INVESTIGATOR — Root Cause Analyst
**Priority:** P2 | **File:** `.claude/agents/bug-investigator.md`
**Purpose:** Accepts error message/stack trace, traces through source files, produces root-cause hypothesis with fix recommendations. Read-only investigation — fix execution by the appropriate milestone agent.
**Commands:** `/debug-issue`
**Skills:** `debug_trace`, `repo_graph`, `security_review`

---

### 🔧 REFACTOR-SPECIALIST — Code Quality & Rule 7 Enforcer
**Priority:** P2 | **File:** `.claude/agents/refactor-specialist.md`
**Purpose:** Handles Rule 7 violations (files > 300 lines) and duplicated logic. Proposes extract/split plans (approval required) and executes with test preservation. Never changes public APIs without approval.
**Commands:** `/refactor-module`
**Skills:** `refactor_plan`, `repo_graph`, `test_stub_gen`, `instinct_guard`

---

### 📦 DEPENDENCY-AUDITOR — Dependency Health & CVE Scanner
**Priority:** P2 | **File:** `.claude/agents/dependency-auditor.md`
**Purpose:** Reads package.json, checks against CLAUDE.md §2 approved stack, runs npm audit, produces CRITICAL/HIGH/MEDIUM/LOW risk table. Read-only — recommends actions, human executes.
**Commands:** `/analyze-repo` (triggers dependency check)
**Skills:** `dependency_analysis`, `security_review`

---

### ⚙️ WORKFLOW-AUTOMATOR — Developer Workflow Optimizer
**Priority:** P3 | **File:** `.claude/agents/workflow-automator.md`
**Purpose:** Identifies repetitive multi-step developer tasks; proposes or creates automation (scripts, hooks, commands). Part of ARIS self-evolution loop — creates new skills/commands when patterns emerge.
**Commands:** `/update-docs`
**Skills:** `code_summarize`, `git_workflow`, `ci_smoke_test`, `instinct_guard`

---

**Total agents: 31** (25 existing + 6 ARIS)

---

## agentSwitching Protocol — ARIS Extensions

| Signal | Switch to |
|--------|-----------|
| "analyse the repo structure" | REPO-ARCHITECT |
| "implement this feature spec" | FEATURE-BUILDER |
| "this error / bug report..." | BUG-INVESTIGATOR |
| "this file is too long / Rule 7" | REFACTOR-SPECIALIST |
| "check our dependencies / CVE" | DEPENDENCY-AUDITOR |
| "automate this repetitive task" | WORKFLOW-AUTOMATOR |

---

## Registered Capabilities

Full registries with detail, trigger keywords, and MCP server mappings:
- **Skills →** [SKILLS.md](./SKILLS.md)
- **Commands →** [COMMANDS.md](./COMMANDS.md)
- **Hooks →** [HOOKS.md](./HOOKS.md)
- **MCP Servers →** [MCP_SERVERS.md](./MCP_SERVERS.md)

<!-- END HUMAN -->
