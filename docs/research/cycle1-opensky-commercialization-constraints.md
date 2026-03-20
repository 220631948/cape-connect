# Cycle 1 — OpenSky Commercialization & Multi-Tenant Operational Constraints

> Technical compliance notes only (not legal advice). This document consolidates repository-evidenced constraints for OpenSky usage in commercialization and multi-tenant operations.

## 1) Verified constraints

- Free-tier OpenSky usage is documented in-repo as **non-commercial primary use**, and paid-tenant/commercial SaaS usage is treated as requiring a commercial agreement path before LIVE production enablement [(docs/integrations/opensky-network.md:6,14-16,216-217)].
- ROADMAP Gate B explicitly blocks paid-tenant LIVE OpenSky until a product-specific commercial path is confirmed [(ROADMAP.md:44,62-63)].
- OpenSky integration docs define a deployment gate: do not enable `LIVE` OpenSky in paid-tenant production until commercial terms are confirmed [(docs/integrations/opensky-network.md:13-16,37-38)].
- Multi-tenant handling is documented as tenant-scoped request/cache boundaries with no cross-tenant data visibility [(docs/integrations/opensky-network.md:156-162,185,192)].
- Platform-wide constraints require visible source badges and mandatory three-tier fallback (`LIVE → CACHED → MOCK`) for external data integrations [(CLAUDE.md:61-67); (docs/architecture/ADR-009-three-tier-fallback.md:34-35,79-84)].
- Fallback storage model requires tenant-scoped `api_cache` with RLS and expiry semantics in architecture docs [(docs/architecture/ADR-009-three-tier-fallback.md:61-77,111-117)].
- OpenSky attribution expectations are documented for in-product and exported/public outputs [(docs/integrations/opensky-network.md:135-146)].

## 2) Unverified / legal-review-required points

- Exact contractual threshold for when mixed free/paid tenant distribution becomes non-compliant is marked unresolved in repo docs [(docs/integrations/opensky-network.md:17,206-207)].
- Product-specific OpenSky commercial terms for this exact deployment model are not yet documented as executed/approved [(docs/research/cycle1-policy-licensing-delta.md:84-86,135)].
- Final legal interpretation of commercialization path remains a governance gate item, not an engineering-closed item [(ROADMAP.md:44,49,62)].

## 3) Product/architecture implications

- **Feature gating:** Paid-tenant LIVE OpenSky is a P0 gate item; product rollout sequencing must keep paid environments on approved non-LIVE modes until commercial path confirmation [(ROADMAP.md:44,53,62)].
- **Operational topology:** Use backend aggregation and bounded polling with explicit degradation states to avoid client fanout/rate-limit exhaustion [(docs/integrations/opensky-network.md:27,90-97,148-154)].
- **Tenant isolation model:** Enforce tenant-scoped cache keys, telemetry records, and visibility boundaries in both app logic and data layer [(docs/integrations/opensky-network.md:158-162); (CLAUDE.md:71-78,111-119)].
- **Reliability contract:** External feed failures must degrade to CACHED/MOCK without blank-map outcomes, with visible tier status [(CLAUDE.md:65-67); (docs/architecture/ADR-009-three-tier-fallback.md:3,100-106)].
- **Transparency contract:** Confidence degradation and gap taxonomy must be surfaced instead of silently smoothing missing aircraft/telemetry conflicts [(docs/integrations/opensky-network.md:19-21,110,114-120,127)].

## 4) Attribution / retention / cache obligations

- **Attribution:** Include OpenSky attribution text and visible source badge on OpenSky-derived map/replay views; include citation in public/exported artifacts [(docs/integrations/opensky-network.md:135-146,177-180)].
- **Cache/fallback:** Apply three-tier fallback with tenant-scoped `api_cache`; OpenSky-specific docs currently describe short TTL caching (~30s) for operational fallback [(docs/integrations/opensky-network.md:96,175); (docs/architecture/ADR-009-three-tier-fallback.md:34-35,61-73,117)].
- **Retention posture (repo-documented):** OpenSky task docs describe ephemeral display intent with short-lived cache and controlled historical retrieval paths [(docs/architecture/tasks/task-M7-opensky-flight-layer.md:446-450)].
- **Isolation controls:** Cache and telemetry must preserve tenant boundaries to avoid cross-tenant leakage in multi-tenant deployments [(docs/integrations/opensky-network.md:159-162,185); (CLAUDE.md:71-78,113-119)].

## 5) Recommended guardrails for docs and roadmap

- Maintain Gate B wording as a **deployment blocker** for paid-tenant LIVE OpenSky until product-specific commercial path is confirmed [(ROADMAP.md:44,62)].
- Keep OpenSky docs explicitly split between verified constraints and unresolved legal/commercial items using `[ASSUMPTION — UNVERIFIED]` labeling where applicable [(docs/integrations/opensky-network.md:9-10,17,204-211)].
- Preserve mandatory documentation of tenant-scoped caching, RLS boundaries, and fallback tier visibility in implementation-facing specs [(CLAUDE.md:61-67,71-78); (docs/architecture/ADR-009-three-tier-fallback.md:61-84)].
- Keep release-checklist language requiring attribution visibility and runbook trace of license/commercial status [(docs/integrations/opensky-network.md:143-147)].
- Keep technical compliance framing and avoid interpreting contractual/legal outcomes as resolved unless explicit signed terms are recorded in project evidence [(docs/research/cycle1-policy-licensing-delta.md:7,82-90,135-140)].

## 6) References

### Internal repository sources
- `docs/integrations/opensky-network.md`
- `docs/research/cycle1-policy-licensing-delta.md`
- `docs/architecture/tasks/task-M7-opensky-flight-layer.md`
- `docs/architecture/ADR-009-three-tier-fallback.md`
- `CLAUDE.md`
- `ROADMAP.md`

### External references already present in repo docs
- OpenSky API docs: https://openskynetwork.github.io/opensky-api/ [(docs/integrations/opensky-network.md:237); (docs/research/cycle1-policy-licensing-delta.md:152)]
- OpenSky FAQ / terms context: https://opensky-network.org/about/faq [(docs/integrations/opensky-network.md:238); (docs/research/cycle1-policy-licensing-delta.md:153-155)]
- OpenSky Network home: https://opensky-network.org/ [(docs/integrations/opensky-network.md:236)]
