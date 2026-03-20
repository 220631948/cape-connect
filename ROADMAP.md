# ROADMAP.md — CapeTown GIS Hub

This roadmap is documentation-first and evidence-aware. It reflects the current repository state, `PLAN.md`, and constraints in `docs/context/GIS_MASTER_CONTEXT.md`.

## Scope & Guardrails (Non-negotiable)

- Geographic scope: Cape Town + Western Cape only.
- Data presentation must include source badges: `[SOURCE · YEAR · LIVE|CACHED|MOCK]`.
- Data retrieval should follow three-tier fallback: LIVE → CACHED → MOCK.
- Tenant isolation requires both app-layer enforcement and database RLS.
- POPIA-sensitive workflows require explicit compliance annotations.
- GV Roll is the approved valuation reference in project docs.

## Six-Pillar Architecture Delivery Track (+ Expansion Pillars)

| Pillar | Focus | Documentation Evidence (current set) | Delivery State |
|---|---|---|---|
| 1. Tiles | Google/Cesium base map and rendering | `docs/integrations/google-maps-tile-api.md`, `docs/integrations/cesium-platform.md`, `docs/architecture/tile-layer-architecture.md` | Documented; implementation tracked in M3/M4 |
| 2. OSINT | OpenSky ingestion and entity fusion | `docs/integrations/opensky-network.md`, `docs/architecture/osint-intelligence-layer.md`, `docs/architecture/data-fusion-ontology.md` | Documented; implementation sequenced after foundations |
| 3. AI Reconstruction | NeRF/3DGS/ControlNet workflows | `docs/integrations/nerf-3dgs-integration.md`, `docs/integrations/controlnet-cesium-export.md`, `docs/architecture/ai-reconstruction-pipeline.md` | Documented; implementation depends on compute/data maturity |
| 4. Domain Extensions | User-domain workflows, accessibility, and youth empowerment | `docs/user-guides/*.md`, `docs/specs/youth-empowerment.md`, `docs/features/gis-extension-ideas.md` | M19 Youth Layers scheduled; spec baseline complete |
| 5. Infra & Steering | Docker, MCP, skills, hooks, backlog/risk | `docs/docker/*.md`, `docs/infra/*.md`, `docs/backlog/*.md` | Documented baseline available |
| 6. File Formats | ArcGIS/QGIS/Geo formats and CRS handling | `docs/integrations/arcgis-formats.md`, `docs/integrations/qgis-formats.md`, `docs/architecture/file-import-pipeline.md`, `docs/architecture/coordinate-system-detection.md` | Documented baseline available |
| **7. Satellite & Remote Sensing** ★ | Sentinel-2, Landsat, NASA FIRMS, NDVI pipelines | `docs/research/GIS_SUPERSTACK_07_SATELLITE.md`, `docs/research/spatial-intelligence/domain-extensions.md` | **NEW** — M20 scheduled |
| **8. AI Agent Intelligence** ★ | MCP fleet, GIS Copilot, Claude Code skills | `docs/research/spatial-intelligence/domain-extensions.md`, `.claude/AGENTS.md` | **NEW** — M23 scheduled |

## Milestone Sequence (from PLAN.md)

### Done
- **M0 — Foundation & Governance**
- **M1 — Database Schema, PostGIS, RLS**
- **M2 — Auth, RBAC, POPIA consent**
- **M3 — Base map implementation**
- **M4 — Architecture Layer** (Fallback, Martin, PWA)
- **M5 — Zoning Overlay** (IZS codes)
- **M6 — GV Roll 2022 Import** (830k records)
- **M7 — Search + Filters** (Geocoder + Suggestions)
- **M8 — Draw Polygon + Spatial Analysis** (Area analysis)

### Now
- **M9 — OpenSky Flight Tracking** (in progress)
  - Phase 1 & 2: Real-time 2D pipeline (Complete).
  - Phase 3: Historical track API (Complete).
  - Phase 3: 3D Enhancement (CesiumJS entities — Blocks on M10).

### Next
- **M10 — CesiumJS Hybrid View**
  - Google Photorealistic 3D Tiles integration.
  - Camera synchronization.
  - Mobile fallback.

### Later
- **M11–M15** hardening and production readiness (Analytics, White-labeling, Sharing, QA, DPIA).
- **M19 — Youth Digital Empowerment Layers** (Scheduled community feature).

### Expansion Phase (Approved 2026-03-19)
- **Quick Wins (QW1–QW4):** AI watermark, data source badge, geolocation button, job-specific views.
- **M20 — Satellite Imagery & NDVI Pipeline:** Sentinel-2, Landsat, NASA FIRMS, NDVI change detection.
- **M21 — Spatial Analysis Toolkit & GeoFile Pipeline:** PostGIS tools UI, multi-format upload, CRS auto-detect.
- **M22 — CesiumJS 3D Globe & Dual-Viewer:** Full CesiumJS with MapLibre mode switching.
- **M23 — AI Agent Intelligence Layer:** MCP fleet, Claude Code GIS skills, GIS Copilot Phase 1.
- **M24 — Domain Dashboards (Phase 1):** Emergency, Environmental, Citizens, Farmers dashboard modes.
- **M25 — OSINT & Aviation Layer:** ICAO airspace, NOTAMs, citation export, privacy enforcement.
- **M26 — 4D WorldView & GIS Copilot (Visionary):** Temporal replay, 3DGS reconstruction, 15-tool Copilot.

## Cycle 1 Evidence Gates (2026-03-05 delta)

- **Gate A — Cape Town 3D coverage evidence:** publish AOI coverage/quality/performance pack before promoting immersive 3D layers beyond controlled rollout `[SI][PL]`.
- **Gate B — OpenSky commercialization decision:** paid-tenant LIVE OpenSky usage is blocked until product-specific commercial path is confirmed `[SI][PL]`.
- **Gate C — POPIA spatial boundary audit:** complete OSINT/camera-adjacent boundary audit before enabling higher-risk enrichment layers `[SI][PL]`.
- **Gate D — Runtime compatibility matrix:** publish Cesium/browser/device splat compatibility matrix before claiming production-ready parity `[AI]`.
- **Gate E — AI routing policy controls:** require tenant-scoped model policy routing + auditable logs before enabling sensitive NL/AI workloads in production `[PL][AI]`.

> Assumption note: exact gate acceptance thresholds are still program-level decisions and remain `[ASSUMPTION — UNVERIFIED]` until approved by product/legal/architecture review.

## Cycle 1 Follow-Through Gates (Swarm synthesis)

- **Gate F — Agent governance parity:** publish canonical agent-policy document and enforce same-name parity checks across `.github/agents` vs `.github/copilot/agents` before further fleet expansion. *(Source: `docs/agents/swarm-agent-audit-cycle1.md`, `docs/architecture/swarm-architecture-insights-cycle1.md`)*
- **Gate G — Python sidecar boundary ADR:** explicitly define what remains DB-native (PostGIS SQL path) vs what is delegated to Python sidecar workloads before adopting GeoPandas/Rasterio in operational pipelines. *(Source: `docs/research/swarm-python-geospatial-tooling.md`, `docs/architecture/swarm-architecture-insights-cycle1.md`)*
- **Gate H — Frappe boundary brief:** restrict Frappe/ERP integration to API/event sidecar patterns unless tenant/RLS/fallback contract equivalence is proven. *(Source: `docs/research/swarm-frappe-spatial-integrations.md`, `docs/architecture/swarm-architecture-insights-cycle1.md`)*
- **Gate I — Runtime compatibility SLO matrix:** publish measurable mobile/desktop compatibility and performance targets for MapLibre/Cesium split before production-parity claims. *(Source: `docs/research/swarm-react-geospatial-visualization.md`, `docs/architecture/swarm-architecture-insights-cycle1.md`)*

## Priority Framework (Unambiguous)

- **P0 — Blocker:** must be resolved before enabling related LIVE/commercial feature path.
- **P1 — Production gate:** must be completed before production claim or broad rollout.
- **P2 — Hardening:** planned follow-up that can run after controlled rollout with safeguards.

## Traceability Register (Cycle 1 findings → roadmap action)

| Trace ID | Source finding (doc) | Status | Roadmap action | Priority | Required verification artifact |
|---|---|---|---|---|---|
| TR-01 | Cape Town AOI 3D readiness unknown (`cycle1-spatialintelligence-delta.md`) | Unverified | **Gate A** | P1 | AOI coverage/quality/performance/cost validation pack |
| TR-02 | OpenSky commercial path unresolved (`cycle1-spatialintelligence-delta.md`, `cycle1-policy-licensing-delta.md`) | Verified risk / Unverified resolution | **Gate B** | P0 | Product-specific OpenSky licensing decision (go/no-go) |
| TR-03 | POPIA boundary for OSINT/camera-adjacent layers unresolved (`cycle1-spatialintelligence-delta.md`, `cycle1-policy-licensing-delta.md`) | Unverified | **Gate C** | P0 | Completed POPIA spatial audit with enforceable exclusions |
| TR-04 | Cesium/runtime splat parity not proven (`cycle1-ai-pipeline-delta.md`) | Unverified | **Gate D** | P1 | Runtime/browser/device compatibility matrix with pass criteria |
| TR-05 | Tenant-safe AI provider routing controls required (`cycle1-policy-licensing-delta.md`, `litellm-proxy-research.md`) | Verified requirement | **Gate E** | P1 | Routing-policy tests + immutable audit log evidence |
| TR-06 | LiteLLM runtime artifact not evidenced (`litellm-proxy-research.md`) | Unverified | **Gate E** (readiness sub-gate) | P0 | Deployment manifest, health checks, and integration test logs |

## Seven-Agent Fleet Concept (Documentation Sprint Model)

Per `GIS_MASTER_CONTEXT.md` §12, documentation planning references a seven-agent fleet concept:

- `@orchestrator`
- `@tiles-agent`
- `@osint-agent`
- `@ai-agent`
- `@domains-agent`
- `@formats-agent`
- `@infra-agent`

> Note on terminology: this roadmap captures the seven-agent documentation sprint model from master context. The operational `AGENTS.md` may list additional runtime agents for implementation tasks.

## Assumptions & Uncertainty

- This roadmap assumes the current generated documentation set is the latest intended baseline for v3 planning.
- Source-code implementation status is taken from `PLAN.md` and may advance independently of documentation updates.
- If `GIS_MASTER_CONTEXT.md` or milestone definitions change, this roadmap should be revised in the same PR/session.
- **Expansion milestones (M20–M26)** approved 2026-03-19, dependent on WU-1 build fix resolution.

---

## Changelog

| Date | Change | Agent |
|---|---|---|
| 2026-03-19 | Added expansion milestones M20–M26 and Quick Wins QW1–QW4; Added pillars 7 (Satellite) and 8 (AI Agent) | Antigravity |
