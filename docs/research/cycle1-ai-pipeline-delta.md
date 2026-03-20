# Cycle 1 AI Pipeline Delta (NeRF / 3DGS / 4DGS / ControlNet / Cesium)

> **TL;DR:** Delta analysis comparing project NeRF/3DGS/4DGS/ControlNet/Cesium docs against current external best practices, flagging deployment-safe improvements.


Last updated: 2026-03-05  
Scope: Compare existing project documentation with current external best-practice signals and mark deployment-safe deltas.

---

## 1) Verified technical updates

### Verified facts

1. **Nerfstudio export command naming is `gaussian-splat` (not `gaussian`)**.  
   - External signal: `ns-export` CLI lists `gaussian-splat` subcommand.  
   - Repo delta: `docs/integrations/nerf-3dgs-integration.md` and `docs/integrations/cesium-nerf-export.md` reference `ns-export gaussian` in places; command should be evidence-checked against current CLI docs.

2. **Splatfacto remains a first-class Nerfstudio method with explicit speed/quality controls**.  
   - External signal: Nerfstudio documents Splatfacto variants, memory profile (`~6GB` default, `~12GB` big), culling/regularization controls, and COLMAP/SfM initialization guidance.
   - Repo alignment: `docs/architecture/ai-reconstruction-pipeline.md` and `docs/integrations/nerf-3dgs-integration.md` already prioritize Splatfacto.

3. **`KHR_gaussian_splatting` is still Release Candidate, not ratified final**.  
   - External signal: Khronos announcement and extension README status = `Release Candidate`.
   - Repo alignment: `docs/architecture/tasks/task-M8-4DGS-temporal-scrubbing.md` flags ratification uncertainty; this remains current.

4. **The extension explicitly supports graceful fallback to sparse point interpretation**.  
   - External signal: Khronos extension overview states splats are stored as point primitives and can degrade to sparse point cloud behavior.
   - Repo alignment: LOD fallback chains in `docs/integrations/nerf-3dgs-integration.md` and `docs/integrations/cesium-platform.md` remain directionally consistent.

5. **CesiumJS 1.139 included Gaussian splat stability fixes** (flashing and race conditions for multiple splat primitives).  
   - External signal: Cesium March 2026 release notes.
   - Repo delta: docs should treat Cesium version floor as operationally important for splat stability.

6. **3D Tiles 1.1 remains the interoperability baseline for glTF-centric pipelines**.  
   - External signal: Cesium 3D Tiles spec history/changes: glTF tile content support, metadata/implicit tiling, legacy tile formats deprecated.
   - Repo alignment: Cesium + glTF integration strategy is consistent with current ecosystem direction.

### Unverified / needs validation

- **Claim:** “CesiumJS 1.139+ directly supports all KHR gaussian-splat workflows in production.”  
  - Status: **Unverified** (release notes confirm splat fixes; complete compatibility matrix is not confirmed in gathered evidence).  
  - Validation steps:
    1. Run a browser compatibility matrix on current target devices with identical splat assets.
    2. Verify each exporter flavor (PLY, glTF+KHR, compressed variants) through actual CesiumJS load tests.

---

## 2) Performance/quality tradeoff shifts

### Verified facts

1. **3DGS/Splatfacto continues to be the practical real-time default over classical NeRF for interactive web viewing** due to rasterization efficiency and established tooling.
2. **Quality tuning in Splatfacto is now better documented** (alpha cull threshold, post-densification culling behavior, scale regularization), reinforcing a controllable speed/quality/file-size triangle.
3. **4DGS evidence remains promising but benchmark context is controlled** (e.g., reported high FPS in paper settings on RTX 3090); this supports roadmap value but not automatic field-performance guarantees.
4. **ControlNet pipelines explicitly expose cost/quality knobs** in mainstream tooling (`num_inference_steps`, scheduler choice, `controlnet_conditioning_scale`, staged control guidance windows).

### Unverified / needs validation

- **Claim:** “Current PSNR/SSIM thresholds in repo are universal across domains and scene types.”  
  - Status: **Unverified** (repo already flags domain calibration unknowns).  
  - Validation steps:
    1. Build per-domain benchmark sets (journalism, emergency, environmental).
    2. Add temporal/night/weather slices and compute threshold drift.

- **Claim:** “4DGS frame generation and scrubbing is deployment-safe on mobile/network-constrained environments.”  
  - Status: **Unverified**.  
  - Validation steps:
    1. Device-tier tests (integrated GPU / mid-range mobile / desktop discrete GPU).
    2. Measure startup, memory, and scrubbing latency under realistic network constraints.

---

## 3) Risk/ethics updates (AI labeling, evidence boundaries)

### Verified facts

1. Repo policy is explicit and strong: **non-removable watermark + `humanReviewed=false` blocks verified evidence export** (`docs/architecture/ai-content-labeling.md`).
2. This aligns with deployment-safe governance posture: AI reconstruction as **analytical aid**, not default ground truth.
3. ControlNet and diffusion toolchains continue to expose configurable safety mechanisms and conditioning controls, but safety defaults vary by implementation, so project-level gates remain necessary.

### Unverified / needs validation

- **Claim:** “Current metadata schema is sufficient for all jurisdictions and evidentiary regimes.”  
  - Status: **Unverified**.  
  - Validation steps:
    1. Legal/compliance review per operating jurisdiction.
    2. Verify export bundles include immutable linkage between visual watermark and sidecar metadata.

- **Claim:** “Automated hallucination detection is reliable enough to replace human review.”  
  - Status: **Unverified**.  
  - Validation steps:
    1. Evaluate false positive/negative rates against adjudicated datasets.
    2. Keep human review as hard gate until audited performance thresholds are defined.

---

## 4) Compatibility notes (Cesium/WebGL/export formats)

### Verified facts

1. **CesiumJS is WebGL-based**; renderer capability remains tied to browser/GPU support and driver quality.
2. **3D Tiles 1.1 + glTF-centered content path is current best-practice direction**; legacy formats are deprecated in the core evolution path.
3. **KHR_gaussian_splatting requires point primitive mode** and is designed for extension/fallback behavior.
4. **Nerfstudio export evidence confirms `gaussian-splat` path** and `.ply` splat export support.

### Unverified / needs validation

- **Claim:** “All intended Cesium runtimes (JS/Unreal/Unity) have parity for gaussian splat features required by this project.”  
  - Status: **Unverified** (signals show progress but not guaranteed parity).  
  - Validation steps:
    1. Build feature parity checklist by runtime.
    2. Execute the same asset/camera/time controls across runtimes and document gaps.

- **Claim:** “Export chain PLY → tiles/glTF+KHR is loss-bounded for all scene classes.”  
  - Status: **Unverified**.  
  - Validation steps:
    1. Round-trip fidelity tests with geometric/photometric metrics.
    2. Visual QA for artifacts (streaking, flicker, sorting anomalies) on multi-splat scenes.

---

## 5) Implications for architecture docs

### Verified implications from current evidence

1. **Command/API references should be normalized to currently documented Nerfstudio CLI syntax** (`gaussian-splat`) in integration docs.
2. **Cesium minimum tested version should be explicit** in docs where gaussian splat stability matters, with issue references for known fixes.
3. **Standards status language should remain conservative**: KHR gaussian splatting = Release Candidate, with fallback path mandatory.
4. **Performance claims should stay scoped to tested hardware tiers**; avoid generic FPS/training-time claims without benchmark context.
5. **Evidence boundary language is still valid and should remain non-optional** (watermark + human review gate + provenance/citation).

### Unverified implications requiring follow-up

- **Cross-browser/device baseline for production acceptance is not yet evidenced in this refresh.**  
  - Validation step: create and publish a reproducible compatibility test matrix.

- **Domain-specific confidence calibration remains unresolved.**  
  - Validation step: add calibrated threshold tables by domain and capture condition.

---

## 6) Roadmap traceability and priority framing

**Priority scale (unambiguous):**
- **P0 = Blocker:** cannot ship affected LIVE/commercial behavior.
- **P1 = Production-readiness requirement:** required before production claim/promotion.
- **P2 = Optimization:** can proceed post-launch with explicit risk acceptance.

| Delta finding | Evidence status | Roadmap gate/action | Priority | Next verification action |
|---|---|---|---|---|
| `KHR_gaussian_splatting` remains RC with fallback requirement | **Verified** | `ROADMAP.md` Gate D + standards-conservative rollout language | **P1** | Keep fallback mandatory and publish tested asset behavior across target runtimes. |
| Cesium splat fixes exist but full parity matrix absent | **Verified update / Unverified parity** | `ROADMAP.md` Gate D | **P1** | Run browser/device/runtime matrix for representative splat assets and publish pass/fail criteria. |
| Nerfstudio command drift risk (`gaussian` vs `gaussian-splat`) | **Verified** | Roadmap implementation hygiene for Pillar 3 docs | **P1** | Normalize command references and validate against current CLI docs in integration pages. |
| Domain thresholds (PSNR/SSIM etc.) not universally calibrated | **Unverified** | Roadmap “conditional promotion” criteria for AI reconstruction | **P1** | Build per-domain benchmark sets including weather/night/temporal slices and threshold-drift tracking. |
| Mobile/network-safe 4DGS scrubbing not proven | **Unverified** | `ROADMAP.md` Gate D | **P1** | Execute constrained-network/device-tier performance tests with reproducible scripts. |
| Human-review replacement by automated hallucination checks | **Unverified and currently disallowed** | Existing evidence integrity controls (watermark + human review) | **P0** | Keep hard human-review gate until audited reliability thresholds are approved. |

## 7) References

### Project docs reviewed
- `docs/architecture/ai-reconstruction-pipeline.md`
- `docs/integrations/nerf-3dgs-integration.md`
- `docs/integrations/cesium-nerf-export.md`
- `docs/integrations/controlnet-cesium-export.md`
- `docs/architecture/ai-content-labeling.md`
- `docs/features/immersive-4d-reconstruction.md`
- `docs/integrations/cesium-platform.md`
- `docs/architecture/tasks/task-M8-4DGS-temporal-scrubbing.md`

### External sources (best-practice signals)
1. Nerfstudio Splatfacto docs: https://docs.nerf.studio/nerfology/methods/splat.html
2. Nerfstudio `ns-export` CLI docs: https://docs.nerf.studio/reference/cli/ns_export.html
3. ControlNet paper (arXiv): https://arxiv.org/abs/2302.05543
4. Diffusers ControlNet pipeline docs: https://huggingface.co/docs/diffusers/api/pipelines/controlnet
5. Khronos announcement (`KHR_gaussian_splatting` RC): https://www.khronos.org/news/permalink/khronos-announces-gltf-gaussian-splatting-extension
6. Khronos extension README/status: https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_gaussian_splatting/README.md
7. Cesium March 2026 releases (CesiumJS 1.139 notes): https://cesium.com/blog/2026/03/03/cesium-releases-in-march-2026/
8. 3D Tiles specification repository/history: https://github.com/CesiumGS/3d-tiles
9. 3D Tiles 1.1 changes: https://github.com/CesiumGS/3d-tiles/blob/main/CHANGES.md
10. 4D Gaussian Splatting paper (arXiv): https://arxiv.org/abs/2310.08528
