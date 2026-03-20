# NeRF + 3D Gaussian Splatting Integration

## TL;DR
- **Primary production path:** Nerfstudio **Splatfacto (3DGS)** exported to Cesium-compatible assets for real-time rendering.
- **Rapid prototyping path:** **Instant-NGP-style hash-grid workflows** for fast iteration, then promote to 3DGS for operational delivery.
- **Non-negotiable:** AI-generated geometry is always labeled and gated by human review before evidence-grade export.

## Assumptions & Uncertainty Tags
- Canonical uncertainty label in this doc set is `[ASSUMPTION — UNVERIFIED]`.
- Use the tag when export fidelity, low-end hardware behavior, or cross-runtime parity is not validated by implementation evidence.
- Uncertain outputs must remain labeled and cannot bypass `humanReviewed` evidence gates.

## Verified Facts vs Assumptions

### Verified Facts (from `GIS_MASTER_CONTEXT.md` / prompt v3)
1. Instant-NGP architecture: 5D input `(x,y,z,θ,φ)` → multiresolution hash grid → compact MLP → `(RGB,σ)` → volume rendering with L2 loss.
2. 3DGS/Splatfacto is the **2026 primary production recommendation** for browser performance.
3. CesiumJS 1.139+ is the minimum tested baseline for current Gaussian splat stability expectations; `KHR_gaussian_splatting` remains Release Candidate status.
4. Pipeline requires mandatory AI labeling metadata and visible watermark for reconstructed outputs.
5. Storage and asset paths must be tenant-scoped using `{basePath}/{tenantId}/{eventId}/`.

### [ASSUMPTION — UNVERIFIED]
- Exact Cesium ion conversion fidelity for every splat variant may vary by exporter version and account tier.
- Performance on low-end field hardware depends on GPU/WebGL2 capability and driver quality.

---

## Instant-NGP Architecture (Full 5-Step Hash Grid Encoding)

1. **Voxel Hashing per Level**
   - 3D sample points are projected into `L` resolution levels.
   - Each level hashes voxel vertices into compact trainable tables.
2. **Feature Lookup**
   - Each hashed vertex retrieves `F`-dimensional feature vectors.
3. **Trilinear Interpolation**
   - Features are interpolated within local voxel cells for smooth spatial encoding.
4. **Feature Concatenation + Direction Encoding**
   - Concatenate all level features and viewing direction encoding `ξ`.
5. **Compact MLP + Volume Rendering Loop**
   - Small MLP `F_Θ` outputs `(RGB, σ)` per sample.
   - Ray marching + alpha compositing accumulate color.
   - L2 rendering loss updates both MLP and hash-grid parameters.

---

## NeRF vs 3DGS Comparison (8 Frameworks)

| Framework | Typical Training Time | Browser FPS | Browser Ready | Scale | Cesium Export Path | Recommendation |
|---|---:|---:|---|---|---|---|
| Classic NeRF | Days | ~1 | Limited | Object/scene | Mesh conversion | Legacy reference only |
| Instant-NGP | Seconds–minutes | ~8 | Partial | Single scene | Via Nerfstudio/mesh path | Fast prototype |
| Nerfacto | ~20 min | ~3 | Moderate | Outdoor scenes | `ns-export mesh` | Quality fallback |
| Block-NeRF | Hours | ~1 | Limited | City scale | 3D Tiles pipeline | Future large-area extension |
| NeRF-W | Hours | ~1 | Limited | Uncontrolled photos | Mesh path | Niche historical scenes |
| 3DGS (original) | ~30 min | 100+ | High | Single scene | Native `.ply`/tiles conversion | Strong, lower-level control |
| **Splatfacto** | **10–30 min** | **100+** | **High** | **Outdoor/event scale** | **`ns-export gaussian-splat`** | **Primary production** |
| GaussCtrl | Minutes + edit stage | 100+ | High | Event editing | 3DGS-native + Cesium path | Post-reconstruction editing |

---

## 3DGS as the 2026 Production Standard
- Explicit Gaussian primitives reduce rendering overhead compared with dense volume integration.
- Supports high-FPS interactivity needed by 4D dashboards and time scrubbing.
- Aligns with Cesium-centered scene composition strategy.
- Keeps Instant-NGP valuable for **fast experimentation** and constrained environments.

---

## Synergies with the Six Pillars
- **Pillar 1 (Tiles):** Google 3D tiles and terrain provide geometric priors and visual context.
- **Pillar 2 (OSINT):** Event triggers (e.g., trajectory intersections) initiate reconstruction jobs.
- **Pillar 3 (AI):** ControlNet + COLMAP + Splatfacto produce immersive event assets.
- **Pillar 4 (Domains):** Domain presets choose confidence/LOD defaults.
- **Pillar 5 (Infra):** GPU scheduling, queueing, and storage governance enforce reliability.
- **Pillar 6 (Formats):** Uploaded geofiles become overlays against reconstructed geometry.

---

## Multitenant Asset Isolation
- Required path pattern: `/{BASE_PATH}/{tenantId}/{eventId}/...`
- Required tags on every asset: `tenantId`, `eventId`, `generationFramework`, `confidenceLevel`.
- Cross-tenant reads are blocked unless explicit sharing grant exists.
- Per-tenant billing attribution required for Cesium ion usage and GPU minutes.

---

## ⚖️ Ethical Use & Compliance
- AI reconstruction is **assistive visual intelligence**, not default ground truth.
- Watermark is mandatory and non-removable.
- `humanReviewed=false` blocks verified-evidence exports.
- Public-data provenance and citation metadata must be retained for each scene.

---

## Ralph Q/A
1. **Q:** What if only 3 blurry photos exist from similar angles?
   **A:** Downgrade confidence to `low`, require additional capture, allow only non-evidence exploratory mode.
2. **Q:** What if a moving object is baked into static geometry?
   **A:** Apply dynamic-object masking and flag residual artifacts in scene metadata.
3. **Q:** What if old laptops cannot render splats?
   **A:** Fall back LOD chain: splats → point cloud → mesh tiles → annotated 2D export.

## API Contract

- **Pipeline-internal:** No external API for NeRF/3DGS training; runs as local Nerfstudio GPU jobs.
- **Export endpoints:** `ns-export gaussian-splat` (primary), `ns-export pointcloud` (fallback), `ns-export mesh`.
- **Cesium ion upload:** `POST /v1/assets` with tenant-tagged metadata.
- **Auth:** Cesium ion token (`CESIUM_ION_ACCESS_TOKEN`) for asset upload.

## Environment Variables

| Variable | Required | Source |
|---|---|---|
| `NERF_GPU_ENABLED` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `NERF_TRAINING_BACKEND` | Yes | `GIS_MASTER_CONTEXT.md` §15 (default: `splatfacto`) |
| `NERF_MODEL_STORAGE_PATH` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `NERFSTUDIO_VERSION` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `CESIUM_ION_ACCESS_TOKEN` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `CESIUM_TILES_OUTPUT_PATH` | Yes | `GIS_MASTER_CONTEXT.md` §15 |

## Three-Tier Fallback

`[LIVE]` Real-time Splatfacto training + Cesium ion export → `[CACHED]` previously exported 3D Tiles assets → `[MOCK]` annotated 2D event marker from `public/mock/`.

## Data Source Badge

`[3DGS/NeRF · {YEAR} · LIVE|CACHED|MOCK]` — displayed on every AI-reconstructed scene layer.

## Error Handling

- **GPU unavailable:** queue training job; show 2D event marker as placeholder.
- **Training fails (low PSNR):** downgrade confidence to `low`; require additional capture.
- **Old hardware (no WebGL2):** LOD fallback: splats → point cloud → mesh → annotated 2D.

## POPIA Implications

- Source imagery for reconstruction may contain identifiable individuals or private property.
- Mandatory AI labeling (`isAiGenerated: true`) and visible watermark on all outputs.
- `humanReviewed=false` blocks verified-evidence export mode (POPIA-relevant for legal workflows).
- Tenant-scoped storage and billing attribution required.

## Milestone Mapping

- **M7** (AI Reconstruction): Nerfstudio Splatfacto training pipeline.
- **M10** (4D WorldView): Time-dynamic reconstruction with event replay.
- **M12** (Advanced AI): GaussCtrl post-reconstruction editing.

## Known Unknowns
- Best universal threshold for “acceptable” reconstruction quality across all domains remains unproven.
- Optimal blending strategy at Block-NeRF seam boundaries needs empirical validation.
- Cross-browser consistency for splat rendering on integrated GPUs requires dedicated benchmark matrix.
- Full parity across Cesium runtimes/devices for all splat export variants remains `[ASSUMPTION — UNVERIFIED]` pending published compatibility matrix.

## References
- [Cesium Platform Integration](./cesium-platform.md)
- [Cesium ↔ NeRF/3DGS Export Integration](./cesium-nerf-export.md)
- [ControlNet to Cesium Export Integration](./controlnet-cesium-export.md)
- [AI Reconstruction Pipeline](../architecture/ai-reconstruction-pipeline.md)
- [ControlNet Workflow](../architecture/controlnet-workflow.md)
- `docs/prompts/GIS_FLEET_PLAN_PROMPT_V3.md` (Pillar 3 requirements)
- `docs/context/GIS_MASTER_CONTEXT.md` (§7.1, §7.2, §9, §10)
