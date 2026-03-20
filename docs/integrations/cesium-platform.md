# Cesium Platform Integration

## TL;DR · CesiumJS vs Cesium ion
- **CesiumJS** is the open-source rendering engine (Apache 2.0) used in-client for 3D globe and time-dynamic visualization.
- **Cesium ion** is SaaS infrastructure for hosted assets/tiling workflows and access-token managed asset delivery.
- Repository guidance requires explicit multitenant isolation, quota control, and billing attribution regardless of whether ion is shared or per-tenant.

## Assumptions & Uncertainty Tags
- Canonical uncertainty label in this doc set is `[ASSUMPTION — UNVERIFIED]`.
- Apply this tag where implementation evidence is incomplete (for example shared-vs-per-tenant token topology, hardware-specific splat performance floors, or XR delivery readiness).
- Do not present uncertain capabilities as production guarantees; keep fallback behavior and confidence disclosure explicit.

> **Ralph Q:** *If ion is unavailable, is the whole scene unavailable?*  
> **A:** It should not be; architecture calls out self-hosted 3D Tiles fallback paths and lower-fidelity LOD degradation.

## Environment Variables
| Variable | Purpose | Security / Tenant Note |
|---|---|---|
| `CESIUM_ION_ACCESS_TOKEN` | Token for ion-hosted assets | Secret; [ASSUMPTION — UNVERIFIED] deployment may use shared or per-tenant token depending on trade-off doc. |
| `CESIUM_ION_ASSET_TERRAIN` | Terrain asset ID | Keep tenant attribution for any non-default asset access. |
| `CESIUM_ION_ASSET_IMAGERY` | Imagery asset ID | Must be auditable to tenant usage context when billed. |
| `CESIUM_TILES_OUTPUT_PATH` | Self-hosted 3D tiles output root | Enforce `{path}/{tenantId}/{eventId}/` namespacing. |
| `CESIUM_TILES_MAX_SIZE_PER_TENANT_GB` | Per-tenant quota guardrail | Prevent noisy-neighbor storage exhaustion. |

> **Ralph Q:** *Can we put real token values in docs for easier setup?*  
> **A:** No; docs must never include secrets. Only variable names and security behavior are allowed.

## The 8-Layer Scene Composition Stack
**This stack is reproduced exactly from Pillar 1 requirements.**

- Layer 0: Cesium World Terrain         (elevation — measurement authority)
- Layer 1: Google 2D Satellite          (fallback imagery)
- Layer 2: Google Photorealistic 3D     (city mesh — visual authority)
- Layer 3: 3DGS event reconstruction    (Cesium3DTileset from Cesium ion)
- Layer 4: OpenSky aircraft entities    (ModelGraphics + PathGraphics)
- Layer 5: ControlNet confidence map    (AI content heatmap — always labeled)
- Layer 6: OSINT event markers          (BillboardGraphics + LabelGraphics)
- Layer 7: UI / annotation layer        (InfoBox, timeline, measurements)

**GeoFile overlay position:** Uploaded GeoFiles render **between Layer 4 and Layer 5**.

> **Ralph Q:** *Why place GeoFiles between aircraft and confidence heatmap?*  
> **A:** That position preserves aircraft track legibility while keeping AI confidence overlays visually dominant over user-uploaded contextual geometry.

## 3DGS Native Support
- Documented capability: CesiumJS `KHR_gaussian_splatting` path in v1.139+ context.
- **Minimum tested floor:** CesiumJS **1.139** for known Gaussian splat stability fixes.
- **Standards posture:** `KHR_gaussian_splatting` remains **Release Candidate**; treat as conditionally deployable with mandatory fallback chain.
- Layer 3 uses event reconstructions (ion-hosted or self-hosted tileset equivalent).
- Required LOD cascade:
  1. 3DGS (WebGL2, GPU path)
  2. point cloud
  3. 3D Tiles mesh
  4. 2D fallback
- Always preserve AI labeling/watermark policies for reconstructed scenes.

> **Ralph Q:** *Can 3DGS be treated as verified photographic evidence?*  
> **A:** No. AI-generated geometry must remain labeled and governed by confidence + human review gates.

## Time-Dynamic Visualization
- Use `JulianDate` for simulation clock control.
- Use `SampledPositionProperty` for flight/event trajectories.
- Use `TimeIntervalCollection` for interval-based visibility and layer state.
- Maintain deterministic replay windows for incident review.

> **Ralph Q:** *If sources disagree on event timing, should we hide disagreement?*  
> **A:** No; represent provenance and confidence explicitly rather than silently collapsing conflicting timelines.

## XR Bridge Overview (Phase 4 Concept)
- Cesium for Unity/Unreal is described as a future bridge for immersive workflows.
- Current status in repository docs is conceptual, not implementation-complete.
- Mark as planning-only unless validated by implementation artifacts.

> **Ralph Q:** *Can we promise headset-ready workflows now?*  
> **A:** Not from current repo evidence; treat XR as roadmap capability, not committed production behavior.

## Multitenant Asset Isolation
- Keys/tokens: isolate by tenant where feasible; if shared, enforce strict per-tenant accounting.
- Asset storage/output: `{BASE_PATH}/{tenantId}/{resourceId}/`.
- Quota policy: enforce per-tenant storage and processing caps.
- Access control: deny cross-tenant asset reads without explicit grant.
- Billing attribution: every asset request/transform traceable to `tenantId`.

> **Ralph Q:** *Can one tenant's 3DGS asset be accidentally visible to another tenant?*  
> **A:** It must not be; tenant scope is a hard rule, not a soft preference.

## API Contract

- **CesiumJS:** client-side JS library (Apache 2.0), no API key required for core rendering.
- **Cesium ion:** REST API at `https://api.cesium.com/v1/` — requires `CESIUM_ION_ACCESS_TOKEN`.
- **Auth:** Bearer token per request; [ASSUMPTION — UNVERIFIED] shared vs per-tenant token.
- **Rate limits:** Per Cesium ion subscription plan.

## Three-Tier Fallback

`[LIVE]` Cesium ion-hosted assets → `[CACHED]` self-hosted 3D Tiles at `CESIUM_TILES_OUTPUT_PATH` → `[MOCK]` lower-fidelity LOD degradation (point cloud → mesh → 2D fallback).

## Data Source Badge

`[CesiumJS · {YEAR} · LIVE|CACHED|MOCK]` — displayed on 3D scene layers with source provenance.

## Error Handling

- **Ion unavailable:** degrade to self-hosted 3D Tiles fallback; never blank scene.
- **3DGS rendering fails (GPU/WebGL2):** LOD cascade: 3DGS → point cloud → mesh → 2D.
- **Asset not found:** display placeholder with reconstruction status indicator.

## POPIA Implications

- 3D scene assets may contain incidental personal data from public imagery sources.
- AI-reconstructed scenes require visible labeling; cross-tenant asset exposure forbidden.
- No persistent individual tracking through scene replay workflows.

## Milestone Mapping

- **M6** (3D Visualization): CesiumJS globe + 8-layer scene composition.
- **M7** (AI Reconstruction): 3DGS native support via `KHR_gaussian_splatting`.
- **M10** (4D WorldView): Time-dynamic visualization with `JulianDate` + `SampledPositionProperty`.
- **M14** (XR Bridge): Cesium for Unity/Unreal — roadmap only.

## Ralph/edge-case Q&A
- **Q:** What if Cesium ion is unavailable during tenant demos? **A:** Fall back to self-hosted tiles and keep provenance badge/state visible.
- **Q:** What if users misread AI reconstructions as measured truth? **A:** Enforce AI labeling watermark and block evidence-grade export unless human-reviewed.

## Known Unknowns
- Whether production will use shared ion token vs per-tenant token is unresolved in current docs.
- Concrete performance thresholds per hardware tier for 3DGS in this stack are not fully specified.
- Exact failure-mode switching logic between ion-hosted and self-hosted tiles requires runtime validation.
- XR bridge prerequisites and acceptance criteria remain roadmap-level.

## ⚖️ Ethical Use & Compliance
### Terms and licensing
- CesiumJS is open source (Apache 2.0); Cesium ion usage is governed by commercial SaaS terms.
- Google and other upstream layer terms still apply when composited in Cesium.
- Cesium third-party terms can change or suspend specific datasets; architecture must preserve provider-aware degradation paths.
- [ASSUMPTION — UNVERIFIED] exact contract entitlements for tenant-packaged resale/sub-licensing depend on final ion plan and legal review.

### AI and truthfulness constraints
- AI reconstruction layers must stay visibly labeled and metadata-tagged (`isAiGenerated: true`).
- Do not present inferred 3D reconstructions as verified ground truth.

### Multitenant and privacy constraints
- Tenant isolation is mandatory across assets, logs, and derived analytics.
- Cross-tenant sharing requires explicit policy grants and audit records.

## References
- [Google Maps Tile API Integration](./google-maps-tile-api.md)
- [OpenSky Network Integration](./opensky-network.md)
- [NeRF + 3DGS Integration](./nerf-3dgs-integration.md)
- [3D Scene Composition](../architecture/3d-scene-composition.md)
- [AI Content Labeling](../architecture/ai-content-labeling.md)
- [ADR-009: Three-Tier Fallback](../architecture/ADR-009-three-tier-fallback.md)
- `docs/prompts/GIS_FLEET_PLAN_PROMPT_V3.md`
- `docs/context/GIS_MASTER_CONTEXT.md`
- CesiumJS docs: https://cesium.com/docs/
- Cesium ion platform docs: https://cesium.com/platform/cesium-ion/
- Cesium legal: https://cesium.com/legal/
- 3D Tiles spec: https://github.com/CesiumGS/3d-tiles
