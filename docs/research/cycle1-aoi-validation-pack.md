# Cycle 1 Pre-Build AOI Validation Pack — Cape Town

Todo ID: `cycle1-prebuild-aoi-pack`  
Status: Drafted for pre-code validation

This pack defines pre-build acceptance checks for **AOI coverage, quality, performance, and cost** for Cape Town-focused immersive GIS workflows, with explicit tagging of **[Verified]**, **[Unverified]**, and **[Assumption]** items.

---

## 1) Scope and objectives

### Scope
- Validate readiness of Cape Town AOIs for the planned stack: Next.js + MapLibre + Cesium + Google Photorealistic 3D Tiles + OpenSky + AI reconstruction (3DGS/4DGS/ControlNet) before implementation starts. **[Verified]** [source: `docs/context/GIS_MASTER_CONTEXT.md:8-10,58-61`]
- Current cycle remains documentation/research-first and docs-only; implementation changes are out of scope for Cycle 1 validation. **[Verified]** [source: `PLAN.md:7-10`; `docs/backlog/feature-backlog.md:31-33`]

### Objectives
1. Prove or disprove AOI suitability for immersive workflows in Cape Town. **[Unverified]** [source: `docs/research/cycle1-spatialintelligence-delta.md:42-44,47-49`]
2. Establish measurable quality/performance/cost acceptance gates for go/no-go. **[Verified]** [source: `docs/research/cycle1-research-synthesis.md:98-104,115-119`]
3. Preserve policy/compliance constraints in pre-build criteria (licensing, attribution, caching/offline, POPIA boundaries). **[Verified]** [source: `docs/research/cycle1-policy-licensing-delta.md:14-21,58-73,84-93`]

### Validation steps
- Run AOI evidence collection across the target AOI set (Section 2).
- Execute test matrix (Section 4) and produce pass/fail artifact log.
- Run policy/compliance checklist gates alongside technical tests.

---

## 2) AOI coverage checks

### AOI set
- Cape Town CBD **[Verified: Standard 3D Only]** Photorealistic mesh absent. [source: Google Web Search 2026]
- Port corridor **[Verified: Standard 3D Only]** Photorealistic mesh absent. [source: Google Web Search 2026]
- Airport corridor **[Verified: Standard 3D Only]** Photorealistic mesh absent. [source: Google Web Search 2026]
- Informal settlement exemplars **[Verified: Standard 3D Only]** Photorealistic mesh absent. [source: Google Web Search 2026]

### Coverage checks
1. **3D tiles presence/consistency by AOI and zoom tier**  
   Tag: **[Verified Absent 2026]** — Cape Town lacks photorealistic 3D mesh. Standard extruded buildings and terrain are present.

2. **Fallback continuity (3D → 2D satellite → 2D roadmap → OSM)**  
   Tag: **[Verified requirement]** [source: `docs/integrations/google-maps-tile-api.md:95-101`]
3. **Live telemetry overlap suitability (OpenSky in AOI bounds)**  
   Tag: **[Assumption]** AOI data continuity is assumed pending empirical polling/coverage density tests. [source: `docs/integrations/opensky-network.md:92-103,114-121`]
4. **Cross-layer composability in 8-layer scene stack**  
   Tag: **[Verified architecture requirement]** [source: `docs/integrations/cesium-platform.md:28-41`]

### Validation steps
- For each AOI: capture tileset availability, missing-tile ratio, fallback activation ratio, and render continuity.
- For each AOI: capture OpenSky state-vector completeness and gap taxonomy counts.
- Produce AOI coverage sheet with pass/fail by layer.

---

## 3) Quality metrics + thresholds

### Evidence-backed status
- Existing repo evidence confirms that universal PSNR/SSIM thresholds are **not yet validated across domains/conditions**. **[Unverified]** [source: `docs/research/cycle1-ai-pipeline-delta.md:60-65,138-140`]
- AI outputs must remain labeled and human-review gated for evidence workflows. **[Verified]** [source: `docs/research/cycle1-ai-pipeline-delta.md:78-80,157`; `docs/research/cycle1-research-synthesis.md:38-40,120`]

### Pre-build threshold pack
- **Q1: AOI visual completeness** (tile holes, geometry gaps, texture degradation rate)  
  Tag: **[Assumption]** numeric cutoffs to be fixed during baseline run.
- **Q2: Temporal coherence** (flicker/sorting anomaly incidence in replay sequences)  
  Tag: **[Assumption]** until scene-class calibration is complete.
- **Q3: Reconstruction fidelity** (PSNR/SSIM/LPIPS by domain slice)  
  Tag: **[Unverified]** domain calibration pending benchmark dataset creation. [source: `docs/research/cycle1-ai-pipeline-delta.md:60-65,155-156`]
- **Q4: Confidence transparency** (all derived layers display uncertainty and provenance)  
  Tag: **[Verified requirement]** [source: `docs/integrations/opensky-network.md:11,110,127`; `docs/research/cycle1-research-synthesis.md:38-40`]

### Validation steps
- Build per-domain benchmark slices (journalism/emergency/environmental + day/night/weather/temporal variants).
- Compute metrics per AOI and compare against declared thresholds.
- Fail any slice where AI labeling/provenance gate is bypassed.

---

## 4) Performance test matrix

| Dimension | Test Cases | Metric(s) | Status Tag | Validation Steps |
|---|---|---|---|---|
| Cesium/3D tile load | AOI cold start + warm cache | startup time, first-interaction time | [Assumption] | Run per AOI, per device tier, with cache states |
| 3DGS/4DGS replay | timeline scrub at low/med/high scene complexity | scrub latency, frame stability | [Unverified] | Execute runtime/device matrix across browsers; identical assets | 
| Fallback behavior | force upstream failures (token expiry, 429/5xx, ion unavailable) | recovery time, blank-map incidence | [Verified requirement] | Verify degrade chain and no blank state | 
| OpenSky polling path | live polling at bounded intervals | ingest latency, stale ratio, gap taxonomy rate | [Assumption] | Execute within Cape Town bbox and record continuity |
| AI pipeline inference path | control-guided reconstruction settings sweep | total pipeline duration, memory envelope | [Unverified] | Device/network tier tests and reproducible runs |

Evidence basis:
- Runtime/device parity for splat workflows remains unverified. **[Unverified]** [source: `docs/research/cycle1-ai-pipeline-delta.md:41-46,109-113,135-137`]
- Mobile/network-safe 4DGS scrubbing not proven. **[Unverified]** [source: `docs/research/cycle1-ai-pipeline-delta.md:66-71,156`]
- Mandatory fallback behavior is documented. **[Verified]** [source: `docs/integrations/cesium-platform.md:50-55,94-97,104-106`; `docs/integrations/google-maps-tile-api.md:149-152`]

---

## 5) Cost model assumptions

### Cost model inputs
1. Google Maps Tile API is metered and uses a monthly credit baseline; DAU scenarios exist but currency outputs are not computed in-repo. **[Verified + Unverified output]** [source: `docs/integrations/google-maps-tile-api.md:78-93`]
2. AOI immersive replay cost envelope is explicitly flagged as unknown in current research. **[Unverified]** [source: `docs/research/cycle1-spatialintelligence-delta.md:56-57`]
3. OpenSky commercial usage for paid SaaS is contract-gated. **[Verified risk / Unverified terms fit]** [source: `docs/research/cycle1-policy-licensing-delta.md:40-43,58-60,84-86`]
4. Cesium ion usage is contractual and third-party terms may alter availability/cost posture. **[Verified]** [source: `docs/research/cycle1-policy-licensing-delta.md:32-37`]

### Assumption set for pre-build modeling
- **A1 [Assumption]:** DAU tiers = 100 / 1K / 10K; compute request volume by AOI interaction profile.
- **A2 [Assumption]:** Cache hit ratio materially reduces paid tile requests; model low/medium/high cache-hit scenarios.
- **A3 [Assumption]:** Device-tier mix impacts replay/inference costs through runtime constraints.
- **A4 [Assumption]:** Licensing-compliant provider mix enforced (no free-tier leakage into paid confidential workloads).

### Validation steps
- Build cost worksheet per AOI tier and DAU tier.
- Add sensitivity bands for cache-hit ratio and replay frequency.
- Mark cost output as provisional until license and pricing calculator inputs are finalized.

---

## 6) Acceptance criteria (go/no-go)

### Go criteria (all required)
1. AOI coverage pack completed for CBD/port/airport/informal-settlement AOIs with explicit pass/fail evidence. **[Verified requirement]** [source: `docs/research/cycle1-spatialintelligence-delta.md:78-79`; `docs/research/cycle1-research-synthesis.md:98`]
2. Performance matrix executed across target browser/device tiers with published results. **[Verified requirement]** [source: `docs/research/cycle1-ai-pipeline-delta.md:44-46,69-71,136-137`]
3. Fallback behavior validated end-to-end without blank-state failures. **[Verified requirement]** [source: `docs/integrations/google-maps-tile-api.md:13-14,149-152`; `docs/integrations/cesium-platform.md:104-106`]
4. Cost model produced with documented assumptions and confidence labels per scenario. **[Assumption-dependent]** [source: `docs/integrations/google-maps-tile-api.md:82-93`]
5. Licensing/compliance blockers explicitly resolved or declared no-go (OpenSky commercial fit, cache/offline constraints, POPIA-sensitive boundaries). **[Verified blocker status]** [source: `docs/research/cycle1-policy-licensing-delta.md:58-60,84-93`; `docs/research/cycle1-research-synthesis.md:116-118`]

### No-go triggers
- Any P0 blocker unresolved (OpenSky terms fit, POPIA boundary) before enabling related LIVE/commercial path. **[Verified]** [source: `docs/research/cycle1-research-synthesis.md:116-118`; `docs/research/cycle1-policy-licensing-delta.md:129-140`]
- Unlabeled AI/reconstruction outputs in evidence-facing pathways. **[Verified]** [source: `docs/research/cycle1-ai-pipeline-delta.md:78-80,157`]
- Missing AOI-specific evidence for coverage/quality/performance claims. **[Verified]** [source: `docs/research/cycle1-spatialintelligence-delta.md:42-44,47-49`]

---

## 7) Risks and mitigations

| Risk | Status Tag | Impact | Mitigation / Validation Control |
|---|---|---|---|
| Cape Town AOI 3D coverage is insufficient in key zones | [Unverified] | Incorrect roadmap assumptions | Execute AOI pack and lock go/no-go to measured coverage evidence |
| Runtime/device parity for splats fails in target environments | [Unverified] | Performance regressions and UX failure | Enforce matrix runs across browser/device tiers before go |
| OpenSky commercial licensing mismatch for paid tenants | [Verified risk] | Commercial deployment blocker | Keep LIVE gated; document contract decision path |
| POPIA boundary unclear for OSINT/camera-adjacent layers | [Unverified] | Compliance exposure | Run POPIA-focused spatial audit before enabling sensitive layers |
| Cost drift at scale (DAU/scene replay intensity) | [Assumption] | Budget overrun, tenant margin erosion | Model DAU sensitivity with cache-hit scenarios and cap controls |
| Over-claiming AI reconstruction as ground truth | [Verified risk] | Evidence integrity failure | Keep watermark + human-review hard gates and provenance labeling |

Evidence references: `docs/research/cycle1-research-synthesis.md:46-51,89-95`; `docs/research/cycle1-policy-licensing-delta.md:54-79`; `docs/research/cycle1-ai-pipeline-delta.md:74-95`.

---

## 8) References

Primary context:
- `docs/context/GIS_MASTER_CONTEXT.md`

Cycle 1 research deltas:
- `docs/research/cycle1-research-synthesis.md`
- `docs/research/cycle1-spatialintelligence-delta.md`
- `docs/research/cycle1-ai-pipeline-delta.md`
- `docs/research/cycle1-policy-licensing-delta.md`

Supporting integration docs:
- `docs/integrations/google-maps-tile-api.md`
- `docs/integrations/cesium-platform.md`
- `docs/integrations/opensky-network.md`

---

## Validation status log

- Coverage/quality/performance/cost criteria document created for pre-code gate review. **[Verified]**
- Numeric threshold calibration remains pending empirical benchmark execution. **[Unverified]**
- Assumption-tagged items require confirmation before production commitments.
