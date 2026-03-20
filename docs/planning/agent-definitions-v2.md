# Agent Definitions v2 — Canonical Fleet

> **TL;DR:** The project uses a 10-agent fleet defined in `AGENTS.md`. Each agent has a single `.agent.md` file in `.github/agents/` or `.github/copilot/agents/`. Legacy definitions in `.claude/agents/` and `.gemini/agents/` were pruned during the M0 audit. See `CLAUDE.md` for project rules.

## Fleet Overview

| # | Role | Agent File | Domain |
|---|---|---|---|
| 1 | Copilot orchestration | `.github/agents/orchestrator.agent.md` | Fleet command, task decomposition, cross-agent synthesis |
| 2 | System architecture & docs | `.github/agents/infra-agent.agent.md` | Docker, env config, backlog, risk register, architecture docs |
| 3 | GIS map infrastructure | `.github/copilot/agents/map-agent.agent.md` | MapLibre lifecycle, layer Z-order, dark UI, responsive layout |
| 4 | Data ingestion + fallback | `.github/copilot/agents/data-agent.agent.md` | LIVE→CACHED→MOCK fallback, ArcGIS integration, source badges |
| 5 | Spatial analysis core | `.github/copilot/agents/spatial-agent.agent.md` | Turf.js, PostGIS spatial ops, CRS guardrails, bbox enforcement |
| 6 | Database governance | `.github/copilot/agents/db-agent.agent.md` | PostGIS schema, RLS policies, RBAC, tenant isolation |
| 7 | 3D visualization | `.github/copilot/agents/cesium-agent.agent.md` | CesiumJS, Google 3D Tiles, 8-layer scene stack |
| 8 | Spatial AI reconstruction | `.github/copilot/agents/immersive-reconstruction-agent.agent.md` | NeRF/3DGS/4DGS pipelines, COLMAP, AI labeling |
| 9 | Research intelligence | `.github/copilot/agents/flight-tracking-agent.agent.md` | OpenSky Network, ADS-B, flight data fusion |
| 10 | Quality review (optional) | `.github/copilot/agents/test-agent.agent.md` | Vitest, Playwright, RLS test harness, QA reports |

## Agent Responsibilities by Milestone

| Milestone | Primary Agents |
|---|---|
| M0 — Foundation | orchestrator, infra-agent |
| M1 — Database Schema | db-agent, spatial-agent |
| M2 — Auth/RBAC/POPIA | db-agent |
| M3 — MapLibre Base Map | map-agent |
| M4a — Three-Tier Fallback | data-agent |
| M4b — Martin MVT | map-agent, data-agent |
| M4c — PWA/Offline | map-agent |
| M4d — RLS Test Harness | db-agent, test-agent |
| M5 — Zoning Overlay | map-agent, data-agent |
| M6 — GV Roll Import | data-agent, db-agent |
| M7 — Search + Filters | spatial-agent |
| M8 — Draw + Analysis | spatial-agent |
| M9 — Favourites/Saved | db-agent |
| M10 — Property Detail | data-agent, map-agent |
| M11 — Analytics Dashboard | data-agent |
| M12 — White-Labeling | orchestrator, db-agent |
| M13 — Share URLs | map-agent |
| M14 — QA | test-agent |
| M15 — DPIA + Deploy | orchestrator, infra-agent |

## Agent Design Principles

1. **Single responsibility** — Each agent owns one bounded domain
2. **Read CLAUDE.md first** — Every agent session loads rules before task context
3. **Escalation protocol** — Conflict with CLAUDE.md → STOP → `docs/PLAN_DEVIATIONS.md`
4. **Three-file context** — `CLAUDE.md` + `PLAN.md` + relevant spec file
5. **Tenant awareness** — All agents enforce RLS/tenant isolation (Rule 4)
6. **POPIA compliance** — Agents handling personal data include POPIA annotations (Rule 5)
7. **Canonical path parity** — Duplicate-role definitions across agent directories must pass same-name parity checks in CI before acceptance

Cycle 1 governance note: canonical-path enforcement and parity gates are now explicitly tracked as follow-up controls for routing consistency. *(Source: `docs/agents/swarm-agent-audit-cycle1.md`)*

## Skills Mapping

| Agent | Primary Skills |
|---|---|
| data-agent | `arcgis_qgis_uploader`, `mock_to_live_validation` |
| cesium-agent | `cesium_3d_tiles`, `spatialintelligence_inspiration` |
| immersive-reconstruction-agent | `nerf_3dgs_pipeline`, `4dgs_event_replay` |
| flight-tracking-agent | `opensky_flight_tracking` |
| spatial-agent | `popia_spatial_audit` |
| All agents | `assumption_verification`, `documentation_first_design`, `popia_compliance`, `cape_town_gis_research` |

## Pruned Ecosystems

| Directory | Status | Notes |
|---|---|---|
| `.claude/agents/` | **Pruned** | 24 agents removed; duplicated canonical fleet |
| `.gemini/agents/` | **Pruned** | 14 removed; 1 retained pending confirmation (`bootstrap-agent.md`) |
| `.github_backup/` | **Archive** | Historical artifacts, not active |

## Assumptions
- **[VERIFIED]** 10-agent fleet matches `AGENTS.md` as of 2026-03-05
- **[VERIFIED]** All canonical agent files exist in `.github/agents/` or `.github/copilot/agents/`
- **[ASSUMPTION — UNVERIFIED]** `.gemini/agents/bootstrap-agent.md` scope needs human confirmation

## References
- `AGENTS.md` (authoritative fleet definition)
- `CLAUDE.md` (project rules)
- `PLAN.md` (milestone sequencing)
- `docs/agents/agent-audit.md` (audit results)
- `docs/infra/skills-catalog.md` (skill activation mapping)
