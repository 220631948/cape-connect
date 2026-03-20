# GIS Research Swarm — Autopilot Final Report (Cycle 2026-03-05)

> **TL;DR:** The swarm completed a full autopilot-style cycle across research, documentation, agent-governance, and architecture lanes, then cross-validated outputs against repository truth and GitHub Copilot CLI references. This cycle produced two concrete doc-fidelity fixes (workflow path corrections and skill-count correction), a validated priority-domain findings set, and a staged improvement backlog for GIS pipelines, spatial AI, Python geospatial services, React geospatial UX, and Frappe ERP spatial integration.  
> **Status tags:** `[VERIFIED]` = backed by repository file(s) and/or official docs; `[ASSUMPTION — UNVERIFIED]` = requires follow-up evidence.

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Validated Research Findings (Priority Domains)](#validated-research-findings-priority-domains)
3. [Agent Ecosystem Cleanup](#agent-ecosystem-cleanup)
4. [Architecture Insights & Recommendations](#architecture-insights--recommendations)
5. [Documentation Updates](#documentation-updates)
6. [Measurable Impact](#measurable-impact)
7. [Next-Cycle Priorities](#next-cycle-priorities)
8. [Sources](#sources)

---

## Executive Summary

- `[VERIFIED]` Core GIS direction remains consistent and mature: Next.js + MapLibre + Supabase/PostGIS + Martin + PMTiles, with mandatory `LIVE -> CACHED -> MOCK`, strict RLS/app-layer tenant enforcement, and CRS contract (`4326` storage, `3857` rendering).  
  Citations: `CLAUDE.md`, `docs/architecture/SYSTEM_DESIGN.md`, `docs/specs/04-spatial-data-architecture.md`.
- `[VERIFIED]` Agent ecosystem is functionally strong but has governance drift risks due to duplicated agent directories and legacy references in selected docs.  
  Citations: `AGENTS.md`, `.github/agents/`, `.github/copilot/agents/`, `docs/agents/agent-audit.md`.
- `[VERIFIED]` This cycle executed and applied immediate doc cleanup on two high-signal issues:
  1) corrected workflow paths in `docs/infra/hooks-reference.md`;  
  2) corrected skill-count assertion in `docs/infra/skills-catalog.md`.  
  Citations: `docs/infra/hooks-reference.md`, `docs/infra/skills-catalog.md`.

---

## Validated Research Findings (Priority Domains)

### 1) GIS pipelines

- `[VERIFIED]` The platform pipeline and resilience posture are explicitly codified and consistent across constitution + architecture + specs.  
  Citations: `CLAUDE.md` (Rules 1/2/4/9), `docs/architecture/SYSTEM_DESIGN.md`, `docs/specs/13-arcgis-fallback.md`, `docs/specs/08-pmtiles-pipeline.md`.
- `[VERIFIED]` ETL direction for regulated data is present (Python-first ingestion with validation and cleanup gates).  
  Citations: `docs/ETL_PIPELINE.md`, `docs/specs/12-gv-roll-ingestion.md`.
- `[ASSUMPTION — UNVERIFIED]` A single canonical `api_cache` schema/contract is still not uniformly represented across every fallback-related document.

### 2) Spatial AI

- `[VERIFIED]` Spatial AI vision is well-established in context and architecture docs (3DGS/NeRF/4DGS + ControlNet trajectory).  
  Citations: `docs/context/GIS_MASTER_CONTEXT.md`, `docs/architecture/ai-reconstruction-pipeline.md`, `docs/research/3dgs-nerf-research.md`.
- `[VERIFIED]` Integration rails for Cesium/OpenSky/reconstruction are documented, including known unknowns.  
  Citations: `docs/integrations/cesium-platform.md`, `docs/integrations/opensky-network.md`, `docs/integrations/nerf-3dgs-integration.md`.
- `[ASSUMPTION — UNVERIFIED]` End-to-end runtime SLO/SLA and quality acceptance thresholds for reconstruction outputs remain fragmented.

### 3) Python geospatial tooling

- `[VERIFIED]` Python geospatial stack is intentionally positioned as an analysis/service extension layer, not a replacement for core web runtime.  
  Citations: `docs/research/05_Python_Geo_Stack.md`, `docs/architecture/SYSTEM_DESIGN.md`.
- `[VERIFIED]` Recommended components (GeoPandas, Rasterio, TorchGeo patterns) are documented with use-cases.  
  Citations: `docs/research/05_Python_Geo_Stack.md`.
- `[ASSUMPTION — UNVERIFIED]` A canonical repository-level Python service contract (versioning, SLOs, ownership boundaries) is still missing as a single decision artifact.

### 4) React / geospatial visualization

- `[VERIFIED]` MapLibre integration conventions are explicit: dynamic SSR-safe loading, layer ordering, zoom gates, attribution, and scope constraints.  
  Citations: `docs/research/10_MapLibre_NextJS_Integration.md`, `docs/specs/01-base-map.md`, `CLAUDE.md`.
- `[VERIFIED]` UX + offline + accessibility details exist with testable acceptance-style guidance.  
  Citations: `docs/ux/mobile-patterns.md`, `docs/ux/accessibility-guidelines.md`, `docs/specs/14-background-sync.md`.
- `[ASSUMPTION — UNVERIFIED]` A single decision matrix for MapLibre-vs-Cesium runtime routing is not yet formalized in one ADR.

### 5) Frappe ERP spatial integrations

- `[VERIFIED]` Frappe is not currently part of the declared primary runtime stack.  
  Citations: `CLAUDE.md`, `README.md`, `docs/architecture/TECH_STACK.md`.
- `[VERIFIED]` A repo-scoped research note exists with sidecar-first integration options and clear “unverified” boundaries.  
  Citations: `docs/research/swarm-frappe-spatial-integrations.md`.
- `[ASSUMPTION — UNVERIFIED]` Frappe can meet current tenant/RLS/fallback contracts without bridge-specific control logic; this requires proof implementation and tests.

---

## Agent Ecosystem Cleanup

### Cleanup actions performed in this cycle

1. `[VERIFIED]` Corrected workflow references in hooks documentation to actual workflow paths:
   - `.github/workflows/spatial-validation.yml`
   - `.github/workflows/immersive-spatial-validation.yml`  
   Citation: `docs/infra/hooks-reference.md`.
2. `[VERIFIED]` Corrected skills-catalog assumption from “12 skills” to “17 skills.”  
   Citation: `docs/infra/skills-catalog.md`.

### Cleanup actions recommended (next pass)

1. `[VERIFIED]` Decide one canonical source-of-truth for agent definitions (`.github/agents` vs `.github/copilot/agents`) or introduce automated parity checks to prevent drift.  
   Citations: `AGENTS.md`, `.github/agents/`, `.github/copilot/agents/`.
2. `[VERIFIED]` Remove/update stale references in retained legacy files (e.g., `.gemini/agents/bootstrap-agent.md` required docs that are no longer present).  
   Citation: `.gemini/agents/bootstrap-agent.md`.
3. `[VERIFIED]` Normalize legacy agent naming in selected docs to canonical fleet names for reliable routing.  
   Citations: `docs/agents/agent-audit.md`, `.github/agents/orchestrator.agent.md`.

---

## Architecture Insights & Recommendations

| Priority | Recommendation | Impact | Effort | Validation |
|---|---|---|---|---|
| P0 | Canonicalize fallback contract (`api_cache` fields, TTL, mock path, badge metadata) in one authority doc + cross-links | High | Low-Med | `[VERIFIED]` drift risk seen across fallback docs |
| P0 | Normalize one approved RLS expression contract + approved variants for special cases | High | Low | `[VERIFIED]` multi-pattern usage across docs |
| P1 | Add explicit CRS boundary matrix for dual rendering (2D MapLibre vs 3D Cesium) | High | Med | `[VERIFIED]` both rules exist but boundary text can be tighter |
| P1 | Introduce Python geospatial microservice ADR (ownership, API surface, tenancy propagation) | Med-High | Med | `[ASSUMPTION — UNVERIFIED]` not yet centralized |
| P1 | Promote Frappe from exploratory note to bounded integration ADR/spec with “go/no-go” gates | Medium | Med | `[VERIFIED]` currently exploratory only |

Key architecture sources: `docs/architecture/SYSTEM_DESIGN.md`, `docs/architecture/ADR-009-three-tier-fallback.md`, `docs/specs/11-multitenant-architecture.md`, `docs/architecture/coordinate-system-detection.md`, `docs/research/05_Python_Geo_Stack.md`, `docs/research/swarm-frappe-spatial-integrations.md`.

---

## Documentation Updates

## Applied updates (completed)

```diff
--- a/docs/infra/hooks-reference.md
+++ b/docs/infra/hooks-reference.md
@@
-| Spatial validation | `.github/copilot/skills/spatial-validation.yml` | Validates GeoJSON/WKT within Cape Town bbox |
-| Immersive spatial validation | `.github/copilot/skills/immersive-spatial-validation.yml` | Validates 3DGS/NeRF spatial outputs |
+| Spatial validation | `.github/workflows/spatial-validation.yml` | Validates GeoJSON/WKT within Cape Town bbox |
+| Immersive spatial validation | `.github/workflows/immersive-spatial-validation.yml` | Validates 3DGS/NeRF spatial outputs |
```

```diff
--- a/docs/infra/skills-catalog.md
+++ b/docs/infra/skills-catalog.md
@@
-**[VERIFIED]** All 12 skills exist in `.github/copilot/skills/`
+**[VERIFIED]** All 17 skills exist in `.github/copilot/skills/`
```

## Ready-to-apply updates (recommended next)

```diff
*** Begin Patch
*** Add File: docs/research/frappe-erp-spatial-integrations.md
+# Frappe / ERPNext Spatial Integration (CapeGIS)
+> **TL;DR:** Define Frappe as ERP system-of-record and capegis as spatial-intelligence plane using tenant-safe webhook ingestion and mandatory LIVE→CACHED→MOCK behavior.
+...
*** End Patch
```

```diff
*** Begin Patch
*** Update File: docs/research/10_MapLibre_NextJS_Integration.md
@@
+## capegis Governance Overlay (Required)
+- Rule 1 badge: `[SOURCE · YEAR · LIVE|CACHED|MOCK]`
+- Rule 2 fallback: `LIVE -> CACHED -> MOCK`
+- CRS contract: store EPSG:4326, render EPSG:3857
+- Scope gate: Cape Town/WC bbox only
*** End Patch
```

---

## Measurable Impact

- `[VERIFIED]` **2 immediate doc-governance defects fixed** (workflow path correctness + skill count accuracy).  
  Citations: `docs/infra/hooks-reference.md`, `docs/infra/skills-catalog.md`.
- `[VERIFIED]` **5 priority domains cross-validated** against repository + official Copilot docs, with uncertainty explicitly tagged instead of inferred.  
  Citations: domain sections above + official docs below.
- `[VERIFIED]` **Agent cleanup backlog made actionable** with concrete P0/P1 items and source traceability.  
  Citations: `AGENTS.md`, `docs/agents/agent-audit.md`, `.gemini/agents/bootstrap-agent.md`.
- `[ASSUMPTION — UNVERIFIED]` If P0/P1 items are applied, onboarding friction and routing ambiguity should reduce measurably in the next cycle (track via doc lint checks and agent-reference mismatch count).

---

## Next-Cycle Priorities

1. **P0 — Agent canonicalization:** finalize one source-of-truth for agent definitions or add parity CI check.
2. **P0 — Fallback contract consolidation:** one canonical fallback schema/contract page linked from specs and integrations.
3. **P1 — Python service ADR:** define interface, tenancy propagation, deployment boundary, and POPIA/RLS controls.
4. **P1 — Frappe decision gate:** promote exploratory note into bounded ADR/spec with explicit validation gates.
5. **P1 — Copilot operational runbook:** document autopilot guardrails (`--max-autopilot-continues`, permissions mode, hook deny behavior).

---

## Sources

## Internal repository sources
- `CLAUDE.md`
- `AGENTS.md`
- `docs/context/GIS_MASTER_CONTEXT.md`
- `docs/architecture/SYSTEM_DESIGN.md`
- `docs/architecture/ADR-009-three-tier-fallback.md`
- `docs/specs/04-spatial-data-architecture.md`
- `docs/specs/11-multitenant-architecture.md`
- `docs/research/05_Python_Geo_Stack.md`
- `docs/research/10_MapLibre_NextJS_Integration.md`
- `docs/research/swarm-frappe-spatial-integrations.md`
- `docs/agents/agent-audit.md`
- `docs/infra/hooks-reference.md`
- `docs/infra/skills-catalog.md`
- `.github/agents/`
- `.github/copilot/agents/`
- `.gemini/agents/bootstrap-agent.md`

## Official Copilot references
- https://docs.github.com/en/copilot/concepts/agents/copilot-cli/autopilot
- https://docs.github.com/en/copilot/reference/hooks-configuration
- https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-custom-agents-for-cli
- https://docs.github.com/en/copilot/concepts/agents/copilot-memory
- https://docs.github.com/en/copilot/concepts/agents/about-agent-skills
