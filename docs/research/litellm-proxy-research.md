# LiteLLM Proxy Research (Normalized)

> **TL;DR:** LiteLLM proxy is documented as architecture intent (Copilot CLI → LiteLLM → Claude) but has no running deployment artifact in the repo. Treat as unvalidated until runtime evidence exists. Security posture, cost/latency benchmarks, and integration tests are all needed.
>
> **Roadmap Relevance:** M10+ (Phase 3 NL→Spatial) — LiteLLM proxy is a dependency for the NL-to-PostGIS agent pipeline.

## Scope
Synthesis of repository claims about using LiteLLM as a routing layer in the Copilot/Claude-oriented workflow.

## Findings (evidence-tagged)
- **[Verified-Repo]** Repo architecture explicitly documents a route pattern: Copilot CLI → LiteLLM proxy → Claude endpoint (`GIS_MASTER_CONTEXT.md` §5.2).
- **[Verified-Repo]** Environment variable placeholders and model routing intent are documented in constitution-level docs (`GIS_MASTER_CONTEXT.md` §5.2, §15).
- **[Verified-Repo]** LiteLLM appears as an enabling component for NL→Spatial tooling plans in multiple research summaries (`spatial-intelligence/README.md`, `domain-extensions.md`).

## Skeptical Notes
- **[Unverified]** No local executable deployment artifact confirms this proxy is currently running in this repository state.
  - **Verification needed:** deployment manifest, runtime logs, and integration test evidence.
- **[Unverified]** Cost, latency, and reliability outcomes for this routing topology are not benchmarked in repo.
  - **Verification needed:** load/perf test traces and failure-mode drills.
- **[Unverified]** Security posture (token scoping, audit trails, abuse controls) is not proven by operational docs alone.
  - **Verification needed:** threat model and security test report.

## Practical Implication for This Repo
Treat LiteLLM proxy details as architecture intent until validated by runtime evidence.

## Cycle 1 Policy Control Addendum

To move from architecture intent to deployable control plane, document tenant-scoped model routing policies:

| Control | Minimum Requirement | Evidence Tag |
|---|---|---|
| Provider allowlist by tenant | Enforce explicit per-tenant provider/tier policy (e.g., block Gemini free for sensitive workloads) | `[PL]` |
| Retention-aware routing | Route based on tenant retention/data-class policy and provider retention behavior | `[PL]` |
| Immutable routing audit log | Store tenant, provider, model, policy decision, and timestamp for every routed request | `[PL][AI]` |

> Assumption note: no runtime artifact currently proves these controls are active in this repository state (`[ASSUMPTION — UNVERIFIED]`).

## Verification-to-roadmap linkage

**Priority scale:**
- **P0:** blocker for sensitive production NL/AI workloads.
- **P1:** required before broad production rollout.
- **P2:** hardening improvement after controlled launch.

| LiteLLM finding | Status label | Roadmap linkage | Priority | Next verification action |
|---|---|---|---|---|
| Architecture intent is documented in repo | **Verified-Repo** | Pillar 3 + `ROADMAP.md` Gate E prerequisites | **P1** | Keep docs in parity with actual deployed route topology and config ownership. |
| Running proxy deployment artifact is absent in repo | **Unverified** | `ROADMAP.md` Gate E | **P0** | Provide deployment manifest, health checks, and runtime logs proving active proxy path. |
| Cost/latency/reliability profile is unknown | **Unverified** | `ROADMAP.md` Gate E rollout criteria | **P1** | Run benchmark/load tests and publish SLO-aligned pass/fail thresholds. |
| Security posture (token scope, audit, abuse controls) not demonstrated | **Unverified** | `ROADMAP.md` Gate E + governance controls | **P0** | Produce threat model, control tests, and auditable routing log evidence. |
| Tenant policy routing (provider/tier restrictions) is required | **Verified requirement** | `ROADMAP.md` Gate E | **P1** | Implement policy-enforced provider allowlists and retention-aware routing tests. |

## References
- `docs/context/GIS_MASTER_CONTEXT.md`
- `docs/research/spatial-intelligence/README.md`
- `docs/research/spatial-intelligence/domain-extensions.md`
- `docs/prompts/GIS_FLEET_PLAN_PROMPT_V3.md`
