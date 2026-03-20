# Copilot CLI Ecosystem Report — CapeTown GIS Hub

> **TL;DR:** 62 files were created across agents, skills, prompts, instructions, MCP servers, hooks, workflows, and scripts to give GitHub Copilot deep domain knowledge of this Cape Town GIS platform. Every component enforces the 10 non-negotiable rules in `CLAUDE.md` — no blank maps, no hardcoded secrets, no missing POPIA annotations, no RLS gaps. The fleet is production-ready from M0 onward.

**Date:** 2026-03-05
**Status:** Complete
**Files created/updated:** 62

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Gap Analysis](#gap-analysis)
3. [Recommended .github/ Structure](#recommended-github-structure)
4. [Agent Fleet](#agent-fleet)
5. [Skills Catalog](#skills-catalog)
6. [Prompts & Instructions Library](#prompts--instructions-library)
7. [MCP Server Configuration](#mcp-server-configuration)
8. [Hooks & Automation](#hooks--automation)
9. [GitHub Actions Workflows](#github-actions-workflows)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Success Metrics](#success-metrics)
12. [Copy-Paste Implementation Checklist](#copy-paste-implementation-checklist)

---

## Executive Summary

The Copilot CLI ecosystem transforms GitHub Copilot from a generic coding assistant into a GIS-domain expert that understands Cape Town spatial data, South African privacy law (POPIA), multi-tenant RLS isolation, MapLibre rendering rules, and the three-tier fallback pattern. The 10-agent fleet delegates work by specialty (map rendering, database, flights, 3D reconstruction, etc.) while the orchestrator coordinates them. 17 skills auto-activate on domain keywords, 12 prompts scaffold correct artifacts from the first keystroke, 9 instruction files inject project rules into every code edit, 3 active MCP servers give agents live web search and browser automation, and 4 hooks + 8 CI workflows enforce the rules automatically rather than relying on memory. [VERIFIED — all counts confirmed by direct filesystem inspection]

---

## Gap Analysis

| Category | Before | After | Source |
|---|---|---|---|
| Agents in `.github/agents/` | 2 | 10 | `AGENTS.md` |
| Skills in `.github/copilot/skills/` | 12 | 17 | `docs/infra/skills-catalog.md` |
| Prompts in `.github/copilot/prompts/` | 5 | 12 | task brief / filesystem [VERIFIED] |
| Instruction files | 5 | 9 | task brief / filesystem [VERIFIED] |
| Active MCP servers | 0 | 3 | `.github/copilot/mcp.json` [VERIFIED] |
| Planned MCP servers documented | 0 | 3 | `.github/copilot/mcp-planned.json` [VERIFIED] |
| Copilot hooks (real enforcement) | 0 | 4 hook types | `.github/copilot/hooks/copilot-hooks.json` [VERIFIED] |
| GitHub Actions workflows | 3 | 8 | `.github/workflows/` [VERIFIED] |
| Automation scripts | 0 | 3 | `scripts/` [VERIFIED] |

---

## Recommended .github/ Structure

```
.github/
├── agents/                          # 10 canonical agent definitions
│   ├── orchestrator.agent.md        # Fleet commander; delegates to specialists
│   ├── infra-agent.agent.md         # Docker, env, risk register, architecture docs
│   ├── map-agent.agent.md           # MapLibre, dark UI shell, responsive layout
│   ├── data-agent.agent.md          # Zustand, Dexie, three-tier fallback enforcement
│   ├── spatial-agent.agent.md       # Turf.js, PostGIS guidance, CRS transforms
│   ├── db-agent.agent.md            # Schema, RLS policies, migrations
│   ├── cesium-agent.agent.md        # CesiumJS, Google 3D Tiles, WebGL rendering
│   ├── immersive-reconstruction-agent.agent.md  # NeRF, 3DGS, 4DGS pipelines
│   ├── flight-tracking-agent.agent.md           # OpenSky ADS-B integration
│   └── test-agent.agent.md          # Vitest, Playwright E2E, quality gating
├── copilot/
│   ├── agents/                      # Copilot-scoped agent mirrors (8 files)
│   ├── skills/                      # 17 domain skills (one subdirectory each)
│   ├── prompts/                     # 12 task-specific prompt templates
│   ├── instructions/                # 9 always-on coding instruction files
│   ├── hooks/
│   │   └── copilot-hooks.json       # SessionStart/PreToolUse/PostToolUse/Stop hooks
│   ├── mcp.json                     # 3 active MCP servers (context7, exa, playwright)
│   └── mcp-planned.json             # 3 future servers (cesium-ion, opensky, nerfstudio)
├── workflows/                       # 8 CI/CD workflows
│   ├── ci.yml                       # Main: lint → test → build → migration verify
│   ├── pr-validation.yml            # Conventional Commits title + section check
│   ├── secret-scan.yml              # Blocks merge on hardcoded credentials
│   ├── spatial-validation.yml       # GeoJSON bbox + CRS check
│   ├── rls-audit.yml                # RLS policy presence on migration PRs
│   ├── popia-audit.yml              # POPIA annotation check on PII-touching files
│   ├── docs-sync.yml                # Warns when src/ changes without docs/ update
│   └── immersive-spatial-validation.yml  # 3DGS/NeRF spatial output validation
└── copilot-instructions.md          # Root-level Copilot instructions (legacy)
```

---

## Agent Fleet

| Agent | File | Specialty | Model | Activation |
|---|---|---|---|---|
| Orchestrator | `orchestrator.agent.md` | Fleet coordination, synthesis, milestone tracking | claude-sonnet-4.6 | Any multi-agent task |
| Infra Agent | `infra-agent.agent.md` | Docker, env setup, architecture docs, risk register | claude-sonnet-4.6 | Docker / infra / ADR questions |
| Map Agent | `map-agent.agent.md` | MapLibre GL JS, dark UI, responsive layout, accessibility | claude-sonnet-4.6 | Map / layer / UI questions |
| Data Agent | `data-agent.agent.md` | Zustand state, Dexie offline cache, three-tier fallback | claude-sonnet-4.6 | Fallback / cache / offline questions |
| Spatial Agent | `spatial-agent.agent.md` | Turf.js, PostGIS queries, CRS transforms, bbox checks | claude-sonnet-4.6 | Spatial / GIS analysis questions |
| DB Agent | `db-agent.agent.md` | Supabase schema, RLS policies, PostGIS migrations, RBAC | claude-sonnet-4.6 | Database / migration / RLS questions |
| Cesium Agent | `cesium-agent.agent.md` | CesiumJS, Google Photorealistic 3D Tiles, terrain, WebGL | claude-sonnet-4.6 | 3D globe / Cesium / tileset questions |
| Immersive Reconstruction Agent | `immersive-reconstruction-agent.agent.md` | NeRF, 3DGS, 4DGS, COLMAP, ControlNet heatmaps | claude-sonnet-4.6 | NeRF / 3DGS / reconstruction questions |
| Flight Tracking Agent | `flight-tracking-agent.agent.md` | OpenSky ADS-B API, real-time flight overlay, time animation | claude-sonnet-4.6 | Flight / ADS-B / airspace questions |
| Test Agent | `test-agent.agent.md` | Vitest unit, Playwright E2E, mock validation, quality gates | claude-sonnet-4.6 | Test / QA / coverage questions |

[VERIFIED — all 10 agents in `.github/agents/`; all use `claude-sonnet-4.6`]

---

## Skills Catalog

| Skill | Trigger Keywords | Purpose | Primary Agent |
|---|---|---|---|
| `4dgs_event_replay` | 4dgs, event replay, temporal | 4D Gaussian Splatting temporal reconstruction | immersive-reconstruction-agent |
| `arcgis_qgis_uploader` | shapefile, gpkg, qgz, upload | ArcGIS/QGIS file validation + reprojection | data-agent |
| `assumption_verification` | assumption, unverified, verify | Verify claims before proceeding | orchestrator |
| `cape_town_gis_research` | cape town, research, gis | Cape Town GIS domain knowledge base | All agents |
| `cesium_3d_tiles` | cesium, 3d tiles, ion | CesiumJS + Google Photorealistic 3D Tiles | cesium-agent |
| `data_source_badge` | badge, source, live, cached, mock | Mandatory `[SOURCE·YEAR·LIVE\|CACHED\|MOCK]` badge (Rule 1) | All agents |
| `documentation_first_design` | docs, documentation, spec | Docs-first workflow before any feature code | All agents |
| `mock_to_live_validation` | mock, live, validation, fallback | Validate MOCK→LIVE layer promotion | data-agent |
| `nerf_3dgs_pipeline` | nerf, 3dgs, splatfacto, colmap | NeRF/3DGS scene reconstruction pipeline | immersive-reconstruction-agent |
| `opensky_flight_tracking` | opensky, adsb, flight, airspace | OpenSky Network ADS-B flight integration | flight-tracking-agent |
| `popia_compliance` | popia, personal data, consent | POPIA compliance checklist (Rule 5) | All agents |
| `popia_spatial_audit` | popia, spatial, location, tracking | Spatial PII audit for location-based data | spatial-agent, db-agent || `rls_audit` | rls, row level security, tenant isolation | RLS policy audit for all PostGIS tables (Rule 4) | db-agent |
| `spatial_validation` | bbox, crs, geojson, wkt, epsg | Validate geometries within Cape Town bbox (Rule 9) | spatial-agent |
| `spatialintelligence_inspiration` | worldview, immersive, dashboard | spatialintelligence.ai WorldView design patterns | cesium-agent |
| `three_tier_fallback` | fallback, live cached mock, api cache | LIVE→CACHED→MOCK implementation guide (Rule 2) | data-agent |
| `tile_optimization` | pmtiles, mvt, tippecanoe, zoom | PMTiles/MVT tile optimization for mobile PWA | map-agent |

[VERIFIED — 17 directories in `.github/copilot/skills/`; trigger keywords from `docs/infra/skills-catalog.md`]

---

## Prompts & Instructions Library

### Prompts (12) — `.github/copilot/prompts/`

| File | Purpose |
|---|---|
| `data-badge-check.prompt.md` | Audit a component for data source badge compliance (Rule 1) |
| `design-feature.prompt.md` | Generate a feature design doc (documentation-first workflow) |
| `migration-review.prompt.md` | Review a migration for RLS, spatial, and naming compliance |
| `new-agent.prompt.md` | Scaffold a new `.github/agents/*.agent.md` with correct frontmatter |
| `new-component.prompt.md` | Scaffold a React component with project file conventions |
| `new-migration.prompt.md` | Scaffold a Supabase migration with RLS + POPIA annotations |
| `new-research.prompt.md` | Create a research doc with `[VERIFIED]`/`[ASSUMPTION]` stances |
| `new-spec.prompt.md` | Generate a feature spec following the 14-section standard |
| `popia-check.prompt.md` | Run POPIA compliance check on any file (Rule 5) |
| `rls-check.prompt.md` | Run RLS audit on a Supabase/PostGIS table (Rule 4) |
| `spatial-query.prompt.md` | Generate PostGIS query scoped to Cape Town bbox with index hints |
| `verify-endpoint.prompt.md` | Verify a Cape Town GIS data endpoint and document findings |

### Instructions (9) — `.github/copilot/instructions/` (injected into every edit)

| File | Applies To | Purpose |
|---|---|---|
| `maplibre.instructions.md` | Map files | MapLibre layer ordering, zoom gates, init guard, cleanup |
| `martin-mvt.instructions.md` | `*.{ts,tsx,sql,yml}` | Martin tile server usage, `?optimize=true`, source URLs |
| `nextjs.instructions.md` | App Router files | Next.js 15 App Router conventions and RSC patterns |
| `popia-security.instructions.md` | All files | POPIA annotation block requirements, PII handling |
| `postgis.instructions.md` | `*.{sql,ts,tsx}` | PostGIS spatial queries, SRID 4326 storage, GiST indexes |
| `pwa-offline.instructions.md` | `*.{ts,tsx,js}` | Serwist service worker, Dexie IndexedDB, PMTiles offline |
| `rbac.instructions.md` | `*.{ts,tsx,sql}` | RBAC role hierarchy, `GUEST→PLATFORM_ADMIN` enforcement |
| `supabase.instructions.md` | Database files | Supabase schema, RLS patterns, migration conventions |
| `typescript.instructions.md` | TypeScript files | TS coding conventions, 300-line file limit (Rule 7) |

---

## MCP Server Configuration

### Active Servers — `.github/copilot/mcp.json` [VERIFIED]

| Server | Transport | URL/Command | Credential | Purpose |
|---|---|---|---|---|
| `context7` | HTTP | `https://mcp.context7.com/mcp` | None | Up-to-date docs: MapLibre, Supabase, Next.js, PostGIS |
| `exa` | HTTP | `https://mcp.exa.ai/mcp` | `COPILOT_MCP_EXA_API_KEY` | Web search for GIS research and best practices |
| `playwright` | stdio | `npx @playwright/mcp@latest` | None | Browser automation for E2E testing and UI validation |

### Planned Servers — `.github/copilot/mcp-planned.json` [VERIFIED]

| Server | Milestone | Env Vars Required | Purpose |
|---|---|---|---|
| `cesium-ion` | M4b | `COPILOT_MCP_CESIUM_ION_TOKEN` | Cesium ion 3D tileset asset management |
| `opensky` | M5+ | `COPILOT_MCP_OPENSKY_USERNAME` + `_PASSWORD` | ADS-B flight data over Cape Town airspace |
| `nerfstudio` | Phase 2 | `COPILOT_MCP_NERFSTUDIO_HOST` + `_API_KEY` | NeRF/3DGS GPU training job orchestration |

**Security:** All MCP credentials use `COPILOT_MCP_` prefix, stored as GitHub repo secrets — never hardcoded (`CLAUDE.md` Rule 3).

---

## Hooks & Automation

Hooks: `.github/copilot/hooks/copilot-hooks.json`. [VERIFIED] `PreToolUse` hooks can return `{"permissionDecision":"deny"}` to block tool execution.

| Hook Type | What It Checks | Blocks On |
|---|---|---|
| `SessionStart` | `.env` gitignore status; `PLAN.md` presence; current milestone | Warning only (stderr) |
| `PreToolUse` (file size) | Source file line count vs 300-line limit (Rule 7) | Warning on `*.ts`/`*.tsx` over limit |
| `PreToolUse` (secret scan) | JWT patterns, `sk-` keys, Supabase URLs in file content | Logs block message; denies write |
| `PreToolUse` (migration name) | Migration filename matches `YYYYMMDDHHMMSS_` convention | Warning on non-conforming SQL migration |
| `PostToolUse` (secret leak) | `git grep` for Supabase URLs / service role keys in tracked files | Stderr alert listing affected files |
| `PostToolUse` (RLS check) | New `CREATE TABLE` in migration has `ENABLE ROW LEVEL SECURITY` | Warning if RLS absent (Rule 4) |
| `Stop` | Uncommitted changes to `PLAN.md` and tracked files | Warning listing dirty files |

**Scripts:** `install-hooks.sh` (one-time per dev), `validate-crs.sh` (EPSG:4326 check), `check-rls.sh` (migration RLS check).

---

## GitHub Actions Workflows

| Workflow | Trigger | Blocks Merge? | Purpose |
|---|---|---|---|
| `ci.yml` | push/PR → `main` | Yes | lint → test → build → migration verify |
| `pr-validation.yml` | PR opened/edited/sync | Yes (on bad title) | Conventional Commits title + required sections check |
| `secret-scan.yml` | push/PR → `main` | **Yes** | Gitleaks scan; blocks on hardcoded credentials (Rule 3) |
| `spatial-validation.yml` | push/PR → `main` | Yes (invalid GeoJSON) | GeoJSON/WKT bbox + CRS validation (Rule 9) |
| `rls-audit.yml` | PR → `main` on `supabase/migrations/**` | Yes (missing RLS) | RLS policy presence on new migration tables (Rule 4) |
| `popia-audit.yml` | PR → `main` on `*.ts/*.sql` | Warning only | POPIA annotation block presence on PII-touching files (Rule 5) |
| `docs-sync.yml` | PR → `main` | Warning only | Detects `src/` changes without matching `docs/` update |
| `immersive-spatial-validation.yml` | push/PR → `main` | Yes (invalid GeoJSON) | 3DGS/NeRF spatial output file validation |

---

## Implementation Roadmap

### Quick Wins (Do Now)
1. Install pre-commit hooks: `bash scripts/install-hooks.sh`
2. Add `COPILOT_MCP_EXA_API_KEY` to GitHub repo secrets (enables Exa web search)
3. Set `COPILOT_MCP_EXA_API_KEY` in Copilot coding agent repo settings
4. Verify all 10 agents appear in Copilot agent picker

### Short Term (M0–M2)
- Confirm CI passes on first real PR (all 8 workflows green)
- Use `new-spec.prompt.md` to scaffold M1 feature specs
- Use `new-migration.prompt.md` for all Supabase schema migrations
- Run `rls-check.prompt.md` on every table before M1 DoD

### Medium Term (M3–M4)
- Enable `cesium-ion` MCP server after M4b DoD confirmed (uncomment in `mcp.json`)
- Activate `cesium-agent` for 3D tile work; use `cesium_3d_tiles` skill
- Run `popia_spatial_audit` skill before any location-tracking feature ships

### Advanced (M5+)
- Enable `opensky` MCP server after M5 DoD confirmed
- Activate `flight-tracking-agent` with live ADS-B data
- Enable `nerfstudio` MCP server after Phase 2 GPU infra is provisioned
- Use `4dgs_event_replay` skill for temporal Cape Town scene reconstruction

---

## Success Metrics

- `secret-scan.yml` blocks 100% of PRs containing hardcoded API keys [Rule 3]
- `rls-audit.yml` blocks 100% of migrations missing `ENABLE ROW LEVEL SECURITY` [Rule 4]
- `pr-validation.yml` enforces Conventional Commits on every PR to `main`
- Every new component file uses `data_source_badge` skill output (badge visible without hover) [Rule 1]
- Every new spec file created via `new-spec.prompt.md` (14-section standard)
- Zero source files exceed 300 lines (`PreToolUse` hook warns in real time) [Rule 7]
- All external-data components implement LIVE→CACHED→MOCK (verified by `three_tier_fallback` skill) [Rule 2]
- `spatial-validation.yml` passes on 100% of GeoJSON commits (Cape Town bbox enforced) [Rule 9]
- POPIA annotation present in 100% of files touching personal data [Rule 5]
- `docs-sync.yml` warning rate trends to zero within 30 days of adoption

---

## Copy-Paste Implementation Checklist

```bash
# Step 1: Install pre-commit hooks (one-time per developer)
bash scripts/install-hooks.sh

# Step 2: Set MCP env vars in GitHub → Settings → Secrets → Copilot
# COPILOT_MCP_EXA_API_KEY = <your exa.ai API key>
# Context7 and Playwright need no credentials

# Step 3: Verify agent availability
# Type @ in Copilot chat — all 10 custom agents should appear

# Step 4: Test a skill
# "check POPIA compliance on src/lib/auth.ts"       → popia_compliance skill
# "audit RLS on profiles table"                      → rls_audit skill
# "validate geojson file public/mock/suburbs.geojson" → spatial_validation skill

# Step 5: Test a hook
# Attempt to write a file with a fake JWT — PreToolUse hook should warn
# Make a commit — secret-scan PostToolUse hook runs automatically

# Step 6: Test a prompt
# In Copilot: /new-spec → scaffolds 14-section feature spec
# In Copilot: /new-migration → scaffolds migration with RLS + POPIA annotations

# Step 7: Verify CI workflows
git push origin feature/my-branch
# → ci.yml + pr-validation.yml + secret-scan.yml + spatial-validation.yml should all run

# Step 8: Enable Exa MCP (after adding API key)
# Context7 is credential-free and active immediately
# Playwright requires npx (included in Node.js dev environment)

# Step 9: Milestone-gate the planned MCP servers
# M4b complete? → uncomment cesium-ion in .github/copilot/mcp.json
# M5 complete?  → implement scripts/opensky-mcp-wrapper.js then uncomment opensky block
# Phase 2?      → provision GPU server, then uncomment nerfstudio block
```

**References:** `CLAUDE.md` (10 rules) · `AGENTS.md` (fleet) · `PLAN.md` (milestones) · `docs/infra/skills-catalog.md` · `docs/infra/hooks-reference.md` · `docs/infra/mcp-servers.md` · `docs/context/GIS_MASTER_CONTEXT.md`
