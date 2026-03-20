# Feature Backlog

> **TL;DR:** Backlog tracks features aligned to `PLAN.md` milestones M0-M15. RICE scores are planning aids — rescore at phase boundaries. Infrastructure work (M0-M4) unlocks safe feature delivery (M5-M15). See `CLAUDE.md` for rules and `docs/backlog/risk-complexity-matrix.md` for risk context.

## RICE Backlog — Milestone Aligned

| Feature | Milestone | R | I | C | E | RICE | Agent | Status |
|---|---|---:|---:|---:|---:|---:|---|---|
| Repo cleanup + governance | M0 | 10 | 10 | 10 | 1 | 1000 | orchestrator | ✅ Near-complete |
| Database schema + RLS | M1 | 10 | 10 | 10 | 3 | 333 | db-agent | 📋 Planned |
| Auth + RBAC + POPIA consent | M2 | 10 | 10 | 9 | 3 | 300 | db-agent | 📋 Planned |
| MapLibre base map + dark UI | M3 | 10 | 9 | 10 | 2 | 450 | map-agent | 📋 Planned |
| Three-tier fallback (LIVE→CACHED→MOCK) | M4a | 10 | 10 | 10 | 2 | 500 | data-agent | 📋 Planned |
| Martin MVT integration | M4b | 9 | 9 | 9 | 3 | 243 | map-agent | 📋 Planned |
| Serwist PWA + offline | M4c | 8 | 8 | 8 | 3 | 171 | map-agent | 📋 Planned |
| RLS test harness | M4d | 9 | 9 | 10 | 2 | 405 | test-agent | 📋 Planned |
| Zoning overlay (IZS codes) | M5 | 9 | 8 | 9 | 3 | 216 | map-agent | 📋 Planned |
| GV Roll 2022 import | M6 | 9 | 9 | 8 | 4 | 162 | data-agent | 📋 Planned |
| Search + filters | M7 | 8 | 8 | 8 | 3 | 171 | spatial-agent | 📋 Planned |
| Draw polygon + spatial analysis | M8 | 8 | 9 | 7 | 4 | 126 | spatial-agent | 📋 Planned |
| Favourites + saved searches | M9 | 7 | 7 | 8 | 3 | 131 | db-agent | 📋 Planned |
| Property detail panel | M10 | 8 | 8 | 7 | 3 | 149 | data-agent | 📋 Planned |
| Analytics dashboard | M11 | 7 | 8 | 7 | 4 | 98 | data-agent | 📋 Planned |
| Multi-tenant white-labeling | M12 | 8 | 9 | 6 | 5 | 86 | orchestrator | 📋 Planned |
| Share URLs | M13 | 7 | 6 | 8 | 2 | 168 | map-agent | 📋 Planned |
| QA — all acceptance criteria | M14 | 10 | 10 | 8 | 5 | 160 | test-agent | 📋 Planned |
| DPIA + production deploy | M15 | 10 | 10 | 7 | 6 | 117 | orchestrator | 📋 Planned |

## Cycle 1 Pre-Build Sync (Docs-Only Priority Queue)

> **Scope lock:** Items below are documentation/research/planning deliverables only.  
> **Constraint:** No implementation, build, or deployment work is in scope until explicit build-phase approval.

| Priority | Backlog Item | Acceptance Criteria | Dependencies | Evidence Confidence | Status |
|---|---|---|---|---|---|
| P0 | OpenSky commercialization decision gate for paid tenants | 1) Gate decision recorded as **GO/NO-GO** for paid-tenant `LIVE` OpenSky. 2) Allowed operational modes per tenant type documented (`LIVE/CACHED/MOCK`). 3) Attribution and cache obligations explicitly listed in release checklist. | `docs/research/cycle1-opensky-commercialization-constraints.md`; `ROADMAP.md` Gate B; `docs/integrations/opensky-network.md` | **[ASSUMPTION — UNVERIFIED]** Final legal/commercial terms are not yet confirmed for this deployment model. | 📋 Planned |
| P0 | AOI validation pack execution spec (Cape Town CBD/port/airport/informal-settlement) | 1) AOI checklist defines pass/fail evidence fields for coverage, quality, performance, and cost. 2) Required artifacts and metrics are enumerated per AOI. 3) No-go triggers documented for missing evidence. | `docs/research/cycle1-aoi-validation-pack.md`; `docs/research/cycle1-research-synthesis.md` | **[ASSUMPTION — UNVERIFIED]** AOI production readiness remains unproven until empirical runs are completed. | 📋 Planned |
| P0 | 3DGS runtime compatibility test protocol (browser/device matrix) | 1) Matrix rows for runtime mode (`2d/3d/hybrid`) and device/browser classes are finalized. 2) PASS/FAIL thresholds for load, FPS, fallback integrity, and badge visibility are documented. 3) Fallback drills (LIVE→CACHED→MOCK) are defined with expected outcomes. | `docs/research/cycle1-3dgs-runtime-compatibility-matrix.md`; `docs/PERFORMANCE_BUDGET.md`; `docs/architecture/ADR-009-three-tier-fallback.md` | **[ASSUMPTION — UNVERIFIED]** Cross-runtime parity and low-end/mobile behavior are not yet demonstrated. | 📋 Planned |
| P1 | Pre-build provider policy matrix hardening (Google/Cesium/OpenSky/AI) | 1) Provider matrix lists permitted usage, prohibited usage, and cache/offline constraints by environment. 2) Each policy row maps to product guardrails and owner. 3) Unverified legal interpretations are explicitly tagged. | `docs/research/cycle1-policy-licensing-delta.md`; `docs/research/cycle1-docs-only-retro.md` | Mixed: verified policy constraints + unresolved contract/legal interpretation items. | 📋 Planned |
| P1 | POPIA spatial audit checklist for sensitive layers | 1) Checklist covers location-based PII inference risks (movement, residence, camera-adjacent enrichment). 2) Required mitigations and review gates are listed before enabling sensitive layers. 3) Audit output format supports GO/NO-GO recommendation. | `docs/research/cycle1-docs-only-retro.md`; POPIA docs and compliance references | **[ASSUMPTION — UNVERIFIED]** Scope is proposed; audit findings are pending execution. | 📋 Planned |
| P2 | Docs parity quality gate before build-phase handoff | 1) Research claims are tagged `[VERIFIED]` vs `[ASSUMPTION — UNVERIFIED]`. 2) Backlog, risk matrix, and roadmap gate language are synchronized. 3) No `TBD/TODO` remains in build-entry criteria sections. | `docs/research/cycle1-docs-only-retro.md`; `docs/research/verification_report.md`; backlog/risk docs | **[VERIFIED]** Need validated by retro and verification report outcomes. | 🔄 In progress |

## Infrastructure Follow-On Queue

| Item | Why It Matters | Dependency | Checkpoint |
|---|---|---|---|
| MCP server config | Enables agent tool access | M0 complete | ✅ Done |
| Skills catalog | Enables skill-guided workflows | M0 complete | ✅ Done |
| Docker environment docs | Local dev reproducibility | M0 complete | ✅ Done |
| Hooks reference | Commit safety + CI gates | M0 complete | ✅ Done |
| Hook simulation test suite | Prevents false confidence | hooks-reference | Before M4d |
| MCP health heartbeat | Detects server degradation | mcp-servers | Before tenant pilots |
| Secret rotation runbook | Reduces key-leak recovery time | env config | Quarterly |
| Tenant quota alerting | Prevents noisy-neighbor | multitenant policy | Before >100 DAU |

## Large GeoJSON & Offline Performance

Priority: HIGH | Owner: map-agent | Milestone: M4c (Serwist PWA + offline)

| Item | Priority | Owner | Status | Notes |
|---|---|---|---|---|
| Hard 5,000-feature client cutoff + PMTiles queue | HIGH | map-agent | 📋 Planned | Prevents browser OOM on large datasets |
| AbortController + viewport pruning pattern | HIGH | map-agent | 📋 Planned | 60-80% feature reduction via bbox filter |
| Offline warning toast + badge transition | MEDIUM | map-agent | 📋 Planned | Network state detection via `navigator.onLine` |
| PMTiles generation queue (server-side) | HIGH | data-agent | 📋 Planned | Triggered when features > 5,000 |
| Dexie.js cache for large GeoJSON (>5MB) | MEDIUM | map-agent | 📋 Planned | IndexedDB storage for offline tiles |

Architecture reference: `docs/architecture/tasks/task-large-geojson-offline-handling.md`

## Verification
- **[VERIFIED]** All M0-M15 milestones from `PLAN.md` are represented
- **[ASSUMPTION — UNVERIFIED]** RICE scores are planning estimates, not telemetry-derived

## References
- `PLAN.md` (milestone definitions M0-M15)
- `CLAUDE.md` §10 (milestone sequencing rules)
- `docs/backlog/risk-complexity-matrix.md` (risk register)
