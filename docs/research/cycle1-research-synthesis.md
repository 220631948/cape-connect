# Cycle 1 Research Synthesis (Evidence-Weighted)

> **TL;DR:** Evidence-weighted synthesis of all Cycle 1 research deltas, consolidating findings from AI pipeline, policy/licensing, and spatialintelligence streams.


Date: 2026-03-05  
Todo ID: `cycle1-research-synthesis`  
Scope inputs:
- `docs/research/cycle1-spatialintelligence-delta.md` (`[SI]`)
- `docs/research/cycle1-ai-pipeline-delta.md` (`[AI]`)
- `docs/research/cycle1-policy-licensing-delta.md` (`[PL]`)

> Technical synthesis only. **Not legal advice**. Policy/compliance notes are engineering controls pending legal review.

## 1) Executive synthesis

Cycle 1 evidence supports a cautious “immersive intelligence” direction with strong upside, but only under explicit gating for licensing, compliance, and runtime validation. Cross-source alignment is strongest on three points: (a) 3D/AI stack maturity is improving but still has standards/runtime uncertainty (`KHR_gaussian_splatting` RC, Cesium/runtime parity unknown) `[AI]`; (b) policy constraints are non-trivial and operationally binding (Google/Cesium attribution + cache limits, OpenSky commercial gate, provider-specific AI data handling) `[PL]`; and (c) WorldView-like interaction patterns are strategically useful as inspiration, not as a dependency or proof of production readiness `[SI]`.

Confidence is **moderate** for architecture direction, **low-to-moderate** for immediate production commitments without additional verification.

## 2) Verified findings (cross-source)

1. **Gate-first strategy is required, not optional.**  
   - Spatial-intelligence research flags unresolved local readiness, licensing, and POPIA boundaries `[SI]`.  
   - AI pipeline research confirms unresolved compatibility/performance claims requiring device/runtime test matrices `[AI]`.  
   - Policy/licensing research identifies hard contractual constraints that directly affect rollout patterns `[PL]`.

2. **Fallback and conservative standards posture is justified.**  
   - AI stack evidence confirms RC status for `KHR_gaussian_splatting` and explicit fallback behavior expectations `[AI]`.  
   - Policy evidence confirms third-party terms may change/suspend availability; architecture needs degradations and provider abstraction `[PL]`.  
   - Spatial-intelligence evidence already recommends pattern transfer over hard coupling to external narrative/project evolution `[SI]`.

3. **Commercialization constraints directly shape technical design.**  
   - OpenSky commercialization is contract-gated `[SI][PL]`.  
   - Google/Cesium caching/offline and attribution constraints affect mobile/offline architecture and UI composition `[PL]`.  
   - AI provider routing/retention differences require environment-level controls for tenant-safe model usage `[PL]`, consistent with AI governance hard gates `[AI]`.

4. **Evidence integrity controls remain a core differentiator.**  
   - AI docs confirm existing watermark + human-review gates are aligned with “analysis aid, not ground truth” framing `[AI]`.  
   - Spatial-intelligence and policy deltas both indicate evidentiary/ethics exposure if replay outputs are over-claimed or insufficiently labeled `[SI][PL]`.

## 3) Unverified/contested items

| Item | Current status | Why contested/uncertain | Evidence tags |
|---|---|---|---|
| Cape Town AOI quality/coverage for Photorealistic 3D Tiles | Unverified | Capability is documented generally; local production fitness not evidenced | `[SI][PL]` |
| End-to-end Cesium parity for splat workflows across runtimes/devices | Unverified | Stability fixes exist, but full compatibility matrix is missing | `[AI]` |
| PLY → glTF/KHR export chain loss bounds across scene classes | Unverified | Claimed feasible; no reproducible fidelity matrix yet | `[AI]` |
| OpenSky commercial suitability for this exact SaaS model | Unverified (potential blocker) | Non-commercial/research posture is clear; product-specific license terms not confirmed | `[SI][PL]` |
| Sufficiency of current metadata schema for evidentiary/jurisdictional needs | Unverified | Governance intent exists; jurisdiction-specific sufficiency not validated | `[AI][PL]` |
| POPIA-safe boundary for OSINT/camera-adjacent enrichment | Unverified | Risk recognized; implementation boundary not fully tested/audited | `[SI][PL]` |

## 4) Decision-impact matrix (doc/roadmap/ops impact)

| Decision area | Evidence weight | Documentation impact | Roadmap impact | Ops impact |
|---|---|---|---|---|
| 3D immersive baseline (Cesium + tiles + splats) | Medium | Tighten versioning, standards-status language, and fallback requirements | Keep as conditional milestone with verification gates | Add compatibility/perf test harness and release criteria |
| OpenSky integration in paid product | High (risk) | Elevate to explicit commercialization gate in integration docs | Block “LIVE” commercial rollout until license path verified | Add provider disable toggle and fallback data layer |
| Google/Cesium cache/offline strategy | High (risk) | Add provider-specific cache legality matrix and attribution UX rules | Re-scope offline feature promises to compliant subset | Enforce cache TTL/header controls + attribution monitoring |
| AI reconstruction evidence usage | Medium-High | Preserve non-removable label/watermark + human-review gate language | Keep “analysis aid” positioning; delay evidentiary claims | Add audit logs and export-policy enforcement |
| WorldView-inspired UX adoption | Medium | Document as pattern reference only (no product dependency) | Continue selective adoption tied to municipal outcomes | Maintain source provenance + uncertainty labels in UI |

## 5) Recommended doc deltas with file paths

1. `ROADMAP.md`  
   - Add/refresh gates for: (a) Cape Town tile coverage evidence, (b) OpenSky commercial decision, (c) POPIA boundary audit, (d) runtime compatibility matrix publication.

2. `docs/integrations/nerf-3dgs-integration.md` and `docs/integrations/cesium-nerf-export.md`  
   - Normalize Nerfstudio command references to `ns-export gaussian-splat`; preserve RC-status and fallback wording.

3. `docs/integrations/cesium-platform.md`  
   - Set minimum tested CesiumJS version for splat stability; clarify CesiumJS (Apache) vs ion contractual obligations and third-party term inheritance.

4. `docs/integrations/google-maps-tile-api.md`  
   - Strengthen attribution non-obscuring requirements and cache/offline constraints; include EEA term split operational note.

5. `docs/integrations/opensky-network.md`  
   - Convert current caution into explicit commercialization gate + required attribution/citation checklist.

6. `docs/specs/06-mobile-offline-architecture.md` and `docs/DATA_LIFECYCLE.md`  
   - Add provider-specific cache/offline legality matrix and prohibited scenarios for Google-restricted content.

7. `docs/specs/10-popia-compliance.md` and `docs/specs/11-multitenant-architecture.md`  
   - Add vendor-policy mapping for location/privacy obligations and tenant-isolated telemetry retention.

8. `docs/architecture/ai-content-labeling.md` and AI ops docs (`docs/research/litellm-proxy-research.md` + future AI ops spec)  
   - Add model-policy routing matrix (Anthropic commercial/API, Gemini free vs paid, retention/abuse-monitoring behavior), with per-tenant enforcement/audit requirements.

## 6) Risk notes (policy/compliance/ethics)

- **Policy/contract risk:** Third-party terms (Google/Cesium/OpenSky/provider policies) are operational constraints, not background context; non-compliant caching, attribution suppression, or unlicensed commercial use is a deployment risk `[PL][SI]`.
- **Compliance risk:** Cross-tenant leakage and location telemetry mishandling remain high-severity risks; controls must be enforced in routing, storage, and observability planes `[PL]`.
- **Ethics/evidence risk:** 4D/AI reconstructions can overstate certainty; maintain explicit uncertainty markers and mandatory human review for externally consumed outputs `[AI][SI]`.
- **Program risk:** Narrative pull toward advanced “world model” UX can outpace verification and municipal-use constraints; roadmap should stay evidence-gated `[SI][AI][PL]`.

## 7) Next verification actions

1. Build and publish a **Cape Town AOI validation pack** (coverage/quality/performance/cost) for key scenes and zoom tiers.  
2. Execute a **runtime compatibility matrix** for splat assets across target browsers/devices and Cesium runtimes.  
3. Run **round-trip fidelity tests** for export chains (PLY ↔ glTF/KHR variants) with quantitative + visual artifact scoring.  
4. Complete **OpenSky commercialization review** with product-specific terms and explicit go/no-go criteria.  
5. Add and test **provider-aware policy enforcement** in AI routing (tenant-level allowed providers/tiers + audit logs).  
6. Perform **POPIA-focused spatial audit** for OSINT/camera-adjacent layers, with documented exclusion/redaction rules.  
7. Validate **evidence export bundle integrity** (watermark + metadata linkage + human-review state) under incident workflows.

## 8) Traceability register (findings → roadmap actions)

**Priority scale used across Cycle 1 docs:**
- **P0 Blocker:** must be resolved before enabling relevant LIVE/commercial path.
- **P1 Production gate:** required before production claim or broad rollout.
- **P2 Hardening:** scheduled improvement after controlled rollout.

| Trace ID | Finding summary | Evidence status | Roadmap target | Priority | Immediate next verification action |
|---|---|---|---|---|---|
| TR-01 | Cape Town AOI 3D readiness is not yet evidenced | **Unverified** | `ROADMAP.md` Gate A | **P1** | Publish AOI validation pack with quality/performance/cost evidence and acceptance thresholds. |
| TR-02 | OpenSky commercial suitability for this SaaS model unresolved | **Verified risk / Unverified terms fit** | `ROADMAP.md` Gate B | **P0** | Complete product-specific licensing review and document go/no-go decision. |
| TR-03 | POPIA boundary for OSINT/camera-adjacent enrichment unresolved | **Unverified** | `ROADMAP.md` Gate C | **P0** | Complete spatial POPIA audit and define enforceable exclusions/redactions. |
| TR-04 | Runtime/device parity for splat workflows not proven | **Unverified** | `ROADMAP.md` Gate D | **P1** | Execute compatibility matrix across browsers/devices/runtimes using identical assets. |
| TR-05 | Tenant-safe AI provider routing controls are required | **Verified requirement** | `ROADMAP.md` Gate E | **P1** | Implement and test tenant policy routing + immutable audit log controls. |
| TR-06 | Evidence output over-claim risk remains if human review is bypassed | **Verified governance risk** | Roadmap evidence-governance controls | **P0** | Preserve mandatory watermark + human-review gate for external/verified exports. |

## 9) References

### Source deltas synthesized
- `[SI]` `docs/research/cycle1-spatialintelligence-delta.md`
- `[AI]` `docs/research/cycle1-ai-pipeline-delta.md`
- `[PL]` `docs/research/cycle1-policy-licensing-delta.md`

### Method note
- Evidence weighting in this synthesis is constrained to the three Cycle 1 delta documents above. Uncertainty remains explicit where those sources report unresolved validation.
