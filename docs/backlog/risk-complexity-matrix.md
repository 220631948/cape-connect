# Risk & Complexity Matrix

> **TL;DR:** Tracks risks by severity and blast radius across `PLAN.md` milestones M0-M15. Each risk has an owner (mapped to canonical agents from `AGENTS.md`), mitigation actions, and verification requirements. Re-evaluate at milestone boundaries. See `CLAUDE.md` for non-negotiable rules.

## Risk Register — Milestone Aligned

| Risk | Milestone | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| API key committed to git | M0 | Medium | Critical | Pre-commit secret scanning + rotation runbook verification drill before each release cut (Rule 3). | infra-agent |
| Tenant data cross-contamination | M1 | Medium | Critical | Enforce tenant-scoped keys in app/cache + DB RLS + isolation test harness; fail release if any cross-tenant read is observed. | db-agent |
| POPIA non-compliance | M2 | Medium | Critical | POPIA annotations + consent flow + DPIA, plus pre-build POPIA spatial audit checklist for location-inference risk. | db-agent |
| CRS mismatch in rendered data | M3/M5 | High | High | CRS validation controls + EPSG:4326 storage assertions + render-path warnings and rejection criteria for malformed geometry. | spatial-agent |
| CoCT ArcGIS endpoint outage | M4a | High | High | Enforce `LIVE → CACHED → MOCK` fallback with visible tier badge; run outage drills and capture no-blank-map evidence. | data-agent |
| Martin tile server failure | M4b | Medium | High | Keep alternate tile serving path documented and tested; define rollback to 2D baseline if MVT path is unstable. | map-agent |
| Offline sync conflicts | M4c | Medium | Medium | Conflict-resolution policy + bounded sync retries + explicit stale-state indicator in offline mode. | map-agent |
| RLS policy bypass | M4d | Low | Critical | CI isolation tests + negative tests for unauthorized tenant reads; block deploy on failing tenant-boundary tests. | test-agent |
| Zoning code rename (SR1→R1) | M5 | Low | Medium | Lock canonical zoning dictionary and add schema/version notes to ingestion docs to prevent silent remapping errors. | data-agent |
| GV Roll PII exposure | M6 | High | Critical | Strip direct identifiers at ETL, document minimization policy, and verify exported artifacts exclude sensitive fields. | data-agent |
| Large GeoFile crashes browser | M8 | High | Medium | File-size and geometry-complexity limits + chunking/simplification guidance + graceful error UX (no hard crash). | spatial-agent |
| Google Maps ToS violation | Future | Medium | Critical | Provider policy matrix with explicit allowed/prohibited usage + cache/offline constraints + audit trace in release checklist. | cesium-agent |
| OpenSky commercial license unresolved for paid SaaS | Future (Gate B) | High | Critical | Keep paid-tenant `LIVE` OpenSky blocked until product-specific commercial terms are confirmed; document attribution + fallback-only operating mode in interim. **[ASSUMPTION — UNVERIFIED]** exact contractual fit pending legal confirmation. | flight-tracking-agent |
| 3DGS runtime/device incompatibility | Future | High | High | Execute browser/device compatibility matrix with hard PASS/FAIL thresholds; force demotion chain (`3DGS→point cloud→mesh→2D`) on instability. **[ASSUMPTION — UNVERIFIED]** full parity not yet evidenced. | immersive-reconstruction-agent |
| Cape Town AOI 3D coverage insufficient in priority zones | Future | Medium | High | Run AOI validation pack (CBD/port/airport/informal-settlement) and gate rollout on measured coverage/quality evidence. **[ASSUMPTION — UNVERIFIED]** AOI readiness currently unproven. | spatial-agent |
| AI geometry used as evidence | Future | Medium | Critical | Mandatory watermark + provenance metadata + human-review gate; prohibit unlabeled derived geometry in evidence-facing workflows. | immersive-reconstruction-agent |
| GPU unavailable for training | Future | Medium | Medium | External queue + pre-baked mode + checkpoints; maintain docs-only fallback plan for no-GPU environments. | infra-agent |

## Complexity Scoring

| Workstream | Complexity | Milestone | Key Drivers |
|---|---|---|---|
| RLS + tenant isolation | High | M1/M4d | End-to-end tenant tagging consistency |
| Three-tier fallback | Medium | M4a | State transitions + UX transparency |
| Martin MVT pipeline | Medium | M4b | PostGIS → Martin → MapLibre integration |
| GV Roll ETL + PII stripping | High | M6 | 830K rows, POPIA compliance, CRS transform |
| Multi-tenant white-labeling | High | M12 | Subdomain routing, branding, JWT claims |
| DPIA + production hardening | High | M15 | Legal, security, and operational readiness |

## Verification Checklist
- [ ] Validate mitigations through drills/tests, not documentation claims
- [ ] Re-evaluate owner assignments when team structure changes
- [ ] Do not accept "low likelihood" without incident evidence

## Assumptions
- **[VERIFIED]** Risk owners map to canonical agents in `AGENTS.md`
- **[ASSUMPTION — UNVERIFIED]** Likelihood values are expert-estimate baselines
- **[ASSUMPTION — UNVERIFIED]** Human team ownership may differ at execution time

## References
- `PLAN.md` (milestone definitions)
- `CLAUDE.md` §3 (credentials), §4 (RLS), §5 (POPIA)
- `docs/backlog/feature-backlog.md` (feature priorities)
- `docs/OPEN_QUESTIONS.md` (unresolved blockers)
