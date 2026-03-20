# GIS Research Swarm Synthesis (Recurring Autopilot Template)

> **TL;DR:** This report synthesizes parallel research, documentation, agent-audit, and architecture-analysis lanes for capegis. It delivers validated findings across the requested priority domains, concrete agent cleanup actions, architecture decisions, and a repeatable swarm runbook for continuous knowledge-base improvement.

**Goal:** Continuously improve the GIS knowledge base and Copilot agent ecosystem for this repository.  
**Mode:** Autopilot-style parallel lanes with cross-validation and single-report synthesis.  
**Output confidence tags:** `[VERIFIED]` and `[ASSUMPTION — UNVERIFIED]`.

---

## 1) Scope and Method

### Context used
- `docs/context/GIS_MASTER_CONTEXT.md`
- `docs/research/README.md` + `docs/research/*.md`
- `AGENTS.md`, `CLAUDE.md`
- `.github/agents/*.agent.md`, `.github/copilot/agents/*.agent.md`
- `docs/agents/agent-audit.md`

### Lane routing used
- `@research-agent` -> canonical research equivalents (`@data-agent`, `@spatial-agent`, `@flight-tracking-agent`) + stronger equivalent (`awesome-copilot/task-researcher`)
- `@documentation-agent` -> canonical (`@infra-agent`, `@orchestrator`) + stronger equivalent (`awesome-copilot/gem-documentation-writer`)
- `@agent-auditor` -> canonical (`agent-audit baseline`, `@test-agent`) + stronger equivalent (`awesome-copilot/agent-governance-reviewer`)
- `@architecture-analyst` -> canonical (`@infra-agent`, `@orchestrator`) + stronger equivalent (`awesome-copilot/se-system-architecture-reviewer`)

### Validation rules
1. A finding is `[VERIFIED]` only if supported by repository files and/or authoritative docs.
2. A finding requiring external confirmation or not directly present in repo is `[ASSUMPTION — UNVERIFIED]`.
3. Contradictions between lanes are resolved by direct repository checks.

---

## 2) Validated Research by Priority

## 2.1 GIS pipelines
- [VERIFIED] Core stack is converged around **Next.js + MapLibre + Supabase/PostGIS + Martin**, with strict governance for fallback and tenancy.  
  Sources: `README.md`, `CLAUDE.md`, `docs/research/08_Executive_Summary_Recommendations.md`.
- [VERIFIED] Three-tier data resilience (`LIVE -> CACHED -> MOCK`) is non-negotiable in project rules.  
  Sources: `CLAUDE.md`, `README.md`, `AGENTS.md`.
- [VERIFIED] Research corpus already contains pipeline-depth docs for PostGIS, MVT serving, ArcGIS/QGIS formats, and offline patterns.  
  Sources: `docs/research/README.md`, `01_PostGIS_Core_Ecosystem.md`, `03_MapServer.md`, `arcgis-qgis-formats-research.md`, `serwist-pwa-offline-patterns.md`.

## 2.2 Spatial AI
- [VERIFIED] `GIS_MASTER_CONTEXT` defines production-weight spatial AI direction with 3DGS emphasis, ControlNet conditioning, and reconstruction pipeline sequencing.  
  Source: `docs/context/GIS_MASTER_CONTEXT.md` (Sections 7.2, 7.3).
- [VERIFIED] Spatial AI findings already exist in multiple docs (`3dgs-nerf*`, `controlnet*`, `autonomous-gis-research.md`) but are fragmented.  
  Source: `docs/research/README.md`.
- [ASSUMPTION — UNVERIFIED] Operational SLO/SLA and acceptance thresholds for reconstruction quality are not yet formalized in a single implementation-standard doc.

## 2.3 Python geospatial tooling
- [VERIFIED] Python tooling is documented as a complementary analysis layer (not primary web runtime) for heavier geospatial/ML workflows.  
  Source: `docs/research/05_Python_Geo_Stack.md`.
- [VERIFIED] Recommended ecosystem coverage exists (GeoPandas/Rasterio/TorchGeo patterns).  
  Source: `docs/research/05_Python_Geo_Stack.md`.
- [ASSUMPTION — UNVERIFIED] A concrete repository-level Python service contract (API schema, ownership, deployment mode) is not yet fully specified.

## 2.4 React / geospatial visualization
- [VERIFIED] MapLibre + Next.js integration guidance is already detailed (SSR-safe loading, map lifecycle patterns).  
  Source: `docs/research/10_MapLibre_NextJS_Integration.md`.
- [VERIFIED] Project-level constraints enforce MapLibre-only and Cape Town/WC scoping.  
  Source: `CLAUDE.md`.
- [ASSUMPTION — UNVERIFIED] A codified runtime decision matrix for MapLibre-vs-Cesium routing (by feature/device/tier) still needs formal ADR treatment.

## 2.5 Frappe ERP spatial integrations (implementation-ready blueprint)
- [VERIFIED] There is currently **no explicit Frappe/ERPNext integration documentation** in the audited corpus.  
  Evidence: no matches for `frappe|erpnext` across `docs/`, including `GIS_MASTER_CONTEXT` and `docs/research`.
- [ASSUMPTION — UNVERIFIED] Recommended blueprint for implementation:
  1. **System roles:** Frappe as ERP system-of-record; capegis as spatial intelligence plane.
  2. **Sync model:** Frappe webhook events -> integration service -> PostGIS upserts -> tile/cache refresh.
  3. **Entity mapping (initial):** Asset, Project/Site, Work Order, Inspection -> tenant-scoped GIS entities with `external_ref`.
  4. **Security:** verify webhook signatures, enforce per-tenant mapping, and apply RLS end-to-end.
  5. **CRS normalization:** ingest in EPSG:4326, render in EPSG:3857 (project rule alignment).
  6. **First implementation batch:** read-mostly sync + map deep-linking to Frappe records before bi-directional updates.

---

## 3) Agent Ecosystem Audit and Cleanup

### 3.1 Current-state findings
- [VERIFIED] Canonical fleet in `AGENTS.md` points domain agents to `.github/copilot/agents`, while `.github/agents` currently also contains mirrored domain-agent files (duplicate role definitions).  
  Sources: `AGENTS.md`, filesystem under `.github/agents/` and `.github/copilot/agents/`.
- [VERIFIED] Legacy-agent naming still appears in key docs/instructions (for example `@tiles-agent`, `@osint-agent`, `@ai-agent`, `@domains-agent`, `@formats-agent`).  
  Sources: `README.md`, `ROADMAP.md`, `.github/agents/orchestrator.agent.md`, `.github/agents/infra-agent.agent.md`.
- [VERIFIED] `@spatial-upload-agent` is referenced in instructions but not present in active canonical directories.  
  Source: `.github/copilot/copilot-instructions.md` and agent directory listings.

### 3.2 Prioritized cleanup actions
**P0 (immediate)**
1. Pick one canonical location for domain agent definitions and align all references.
2. Remove/replace legacy role references in root docs and orchestrator guidance.
3. Replace references to non-existent agents (`@spatial-upload-agent`) with current canonical routing.

**P1 (near-term)**
1. Add a lightweight agent consistency check (directory reality vs `AGENTS.md`).
2. Normalize handoff target naming (`@orchestrator` vs `@copilot-orchestrator`) across agent files.

**P2 (stability)**
1. Add a recurring “agent governance review” section to research cycles.
2. Maintain a small deprecation register for retired agent names.

---

## 4) Architecture Insights

- [VERIFIED] Governance posture is strong (explicit non-negotiables, compliance rules, and tenancy controls).  
  Sources: `CLAUDE.md`, `GIS_MASTER_CONTEXT.md`.
- [VERIFIED] Research-first workflow is explicit and actionable (`/research` before `/fleet`).  
  Source: `GIS_MASTER_CONTEXT.md` Section 6.
- [VERIFIED] Architecture documentation is rich but partly split across legacy and canonical narratives; consolidation improves reliability.  
  Sources: `README.md`, `ROADMAP.md`, `AGENTS.md`, `docs/research/README.md`.
- [ASSUMPTION — UNVERIFIED] Real-time caching topology for high-frequency external feeds could benefit from a clearer canonical infra decision record.

---

## 5) Copilot CLI Steering Improvements (Validated External Guidance)

- [VERIFIED] Autopilot is best for well-defined tasks and supports autonomous continuation with permission controls and continuation limits.  
  Source: GitHub Docs — Copilot CLI autopilot.
- [VERIFIED] Delegation flow exists for handing off work (`/delegate` / `&` prefix) and autopilot can be used programmatically with explicit options.  
  Source: GitHub Docs — delegate tasks to CCA.
- [VERIFIED] Agent skills are an open standard and can be project-scoped (`.github/skills` / `.claude/skills`) or personal-scoped.  
  Source: GitHub Docs — about agent skills.
- [VERIFIED] Copilot Memory is repository-scoped, citation-validated, and auto-retained with expiry behavior; useful for recurring cycles.  
  Source: GitHub Docs — copilot memory.
- [VERIFIED] CLI best-practice hierarchy reinforces repository instructions and plan-first execution for complex tasks.  
  Source: GitHub Docs — CLI best practices.

---

## 6) Recurring Swarm Runbook (Template)

1. **Bootstrap:** load `CLAUDE.md`, `AGENTS.md`, `GIS_MASTER_CONTEXT.md`, `docs/research/README.md`.
2. **Parallel lanes:** run Research, Documentation, Agent Audit, Architecture lanes in parallel.
3. **Cross-validation:** resolve contradictions by direct repo evidence.
4. **Synthesis:** produce one report with verified/assumption tags and prioritized actions.
5. **Cleanup pass:** apply agreed doc/agent-reference fixes.
6. **Archive:** store report in `docs/research/` and update research index.

---

## 7) Documentation Updates in This Cycle

- Added: `docs/research/gis-research-swarm-synthesis.md` (this file).
- Recommended next edits:
  1. Update `README.md`/`ROADMAP.md` legacy agent names to canonical fleet.
  2. Align `.github/copilot/copilot-instructions.md` with existing active agents.
  3. Create dedicated `docs/research/frappe-erp-spatial-integrations.md`.

---

## 8) Known Unknowns

1. [ASSUMPTION — UNVERIFIED] Final canonical location strategy for duplicated domain agent files in `.github/agents` vs `.github/copilot/agents`.
2. [ASSUMPTION — UNVERIFIED] Frappe ERP integration constraints (data ownership boundaries, webhook guarantees, tenancy mapping edge-cases) need dedicated validation.
3. [ASSUMPTION — UNVERIFIED] Canonical real-time cache topology and scale thresholds for continuous OSINT ingestion should be formalized in architecture decisions.

---

## 9) References

### Internal
- `CLAUDE.md`
- `AGENTS.md`
- `README.md`
- `ROADMAP.md`
- `docs/context/GIS_MASTER_CONTEXT.md`
- `docs/agents/agent-audit.md`
- `docs/research/README.md`
- `docs/research/05_Python_Geo_Stack.md`
- `docs/research/10_MapLibre_NextJS_Integration.md`
- `docs/research/3dgs-nerf-research.md`
- `docs/research/controlnet-research.md`
- `docs/research/gis-platform-synthesis.md`
- `docs/research/technical_architecture_extensions.md`

### External
- https://docs.github.com/en/copilot/how-tos/copilot-cli/cli-best-practices
- https://docs.github.com/en/copilot/concepts/agents/about-agent-skills
- https://docs.github.com/en/copilot/concepts/agents/copilot-memory
- https://docs.github.com/en/copilot/concepts/agents/copilot-cli/autopilot
- https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli-agents/delegate-tasks-to-cca
- https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli-agents/steer-agents
