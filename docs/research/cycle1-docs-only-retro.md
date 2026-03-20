# Cycle 1 Docs-Only Retro

Date: 2026-03-05  
Todo ID: `cycle1-learnings-retro`

> This retro captures **documentation/research cycle** outcomes only.  
> **Code/build sprint is explicitly deferred and will not start until user approval is provided.**

## 1) What changed this cycle

- Produced Cycle 1 research deltas and synthesis artifacts:
  - `docs/research/cycle1-spatialintelligence-delta.md`
  - `docs/research/cycle1-ai-pipeline-delta.md`
  - `docs/research/cycle1-policy-licensing-delta.md`
  - `docs/research/cycle1-research-synthesis.md`
- Consolidated evidence-weighted findings around:
  - immersive 3D/AI feasibility and runtime maturity,
  - licensing/compliance constraints (Google/Cesium/OpenSky/AI-provider policies),
  - governance-first rollout gates (POPIA, tenant isolation, attribution/caching controls).
- Maintained docs-first posture: architecture and compliance implications were documented before any implementation sprint.

## 2) What verification caught

- Verification work (`docs/research/verification_report.md`) identified claim-quality issues that required correction or downgrade:
  - Version/date precision gaps (e.g., PostgreSQL and GEOS release timing statements).
  - Overstated maintenance assertions (e.g., phrasing around `pg_tileserv` maintenance status).
  - Unverified claims that need runtime or source confirmation (e.g., benchmark assertions, some service endpoint specifics).
- Outcome: evidence confidence improved by separating **verified facts** from **unverified assumptions** and by promoting explicit traceability and gating.

## 3) Assumptions that remain

- `[ASSUMPTION — UNVERIFIED]` Cape Town AOI quality/coverage is sufficient for production-grade photorealistic 3D usage.
- `[ASSUMPTION — UNVERIFIED]` End-to-end Cesium/runtime/device parity for Gaussian splat workflows will meet target UX/performance.
- `[ASSUMPTION — UNVERIFIED]` PLY ↔ glTF/KHR export workflows maintain acceptable fidelity across representative scenes.
- `[ASSUMPTION — UNVERIFIED]` OpenSky licensing path will support the intended commercial SaaS model without blocking conditions.
- `[ASSUMPTION — UNVERIFIED]` Current metadata/evidence schema is sufficient for all jurisdictional evidentiary requirements.

## 4) Risks deferred to vibecode phase

- Runtime compatibility and performance regressions across browser/device matrix for 3DGS workflows.
- Data-policy enforcement drift during implementation (attribution visibility, cache legality, offline behavior).
- Cross-tenant leakage risk if provider routing, telemetry partitioning, or audit controls are implemented inconsistently.
- Compliance failure risk if POPIA-sensitive spatial/OSINT enrichment boundaries are not enforced in code and operations.
- Integration/contract risk if OpenSky commercial terms are unresolved at build/deploy decision points.

## 5) Entry criteria for enabling build phase

Build phase should remain disabled until all of the following are met:

1. User provides explicit approval to begin code/build sprint.
2. Gate decisions are documented for OpenSky commercial viability (go/no-go + fallback path).
3. Provider policy matrix is finalized for Google/Cesium/OpenSky/AI routing, including cache/offline/attribution constraints.
4. POPIA spatial audit scope and enforcement requirements are documented and accepted.
5. Runtime validation plan exists for target devices/browsers and includes pass/fail thresholds.
6. Required docs are synchronized with roadmap gates and no unresolved blockers remain in research-critical sections.

## 6) Next-cycle backlog proposals

- Create a Cape Town AOI validation pack (coverage, quality, performance, cost) with reproducible acceptance criteria.
- Define and execute a runtime compatibility matrix for 3DGS assets across browsers/devices.
- Run export-chain fidelity tests (PLY → glTF/KHR variants) with quantitative and visual scoring.
- Complete OpenSky commercialization review and write product-specific integration constraints.
- Specify tenant-level AI provider routing controls and immutable policy/audit requirements.
- Add provider-specific cache legality and attribution checks into QA acceptance criteria.
- Produce POPIA-focused spatial audit checklist for OSINT/camera-adjacent layers.

## 7) References

- `docs/research/cycle1-research-synthesis.md`
- `docs/research/cycle1-policy-licensing-delta.md`
- `docs/research/cycle1-ai-pipeline-delta.md`
- `docs/research/cycle1-spatialintelligence-delta.md`
- `docs/research/verification_report.md`
