# 3D Scene Composition

> **TL;DR:** Defines the 8-layer 3D scene stack, render order, z-depth strategy, and LOD cascade for 60 FPS targets in CesiumJS-based Cape Town views.


## Scope
This document defines the operational 8-layer scene stack, render order, z-depth strategy, and performance budget for 60 FPS targets, including LOD cascade behavior.

> **Ralph Q:** *If we add every layer at once, do we still hit 60 FPS?*  
> **A:** Only with strict per-layer budgets, culling, and LOD demotion under load; otherwise frame-time overruns are expected.

## Canonical 8-Layer Stack (with GeoFile insertion point)
| Order | Layer | Role | Notes |
|---|---|---|---|
| 0 | Cesium World Terrain | Elevation / measurement authority | Baseline for distance/height calculations. |
| 1 | Google 2D Satellite | Fallback imagery | Active when 3D mesh unavailable or demoted. |
| 2 | Google Photorealistic 3D | Visual authority city mesh | High visual detail; not measurement authority. |
| 3 | 3DGS event reconstruction | Incident reconstruction geometry | Cross-reference: `nerf-3dgs-integration.md` (as referenced by plan). |
| 4 | OpenSky aircraft entities | Dynamic tracks and models | Uses time-dynamic properties. |
| 4.5 | Uploaded GeoFile overlay | Tenant uploaded context layers | **Required placement: between Layer 4 and Layer 5.** |
| 5 | ControlNet confidence map | AI confidence heatmap | Must stay labeled as AI-derived. |
| 6 | OSINT event markers | Event labels/markers | Provenance + confidence display. |
| 7 | UI / annotation layer | InfoBox/timeline/measurements | User-facing interaction controls. |

> **Ralph Q:** *Why is GeoFile not a top-level layer index?*  
> **A:** It is an insertion band by design to preserve readability of aircraft tracks (below) and confidence overlays (above).

## Layer Rendering Order + Z-Depth Management
```mermaid
flowchart TB
    L0[Layer 0 Terrain\n(z-base, measurement authority)] --> L1[Layer 1 2D Satellite\nfallback imagery]
    L1 --> L2[Layer 2 Photorealistic 3D\nvisual authority]
    L2 --> L3[Layer 3 3DGS Reconstruction\nAI-generated geometry]
    L3 --> L4[Layer 4 OpenSky Aircraft\ntime-dynamic entities]
    L4 --> G45[GeoFile Overlay\n(render between 4 and 5)]
    G45 --> L5[Layer 5 ControlNet Confidence\nAI heatmap + labels]
    L5 --> L6[Layer 6 OSINT Markers\nalerts + provenance]
    L6 --> L7[Layer 7 UI/Annotations\ninteractive overlays]
```

## Performance Budget (Target: 60 FPS)
At 60 FPS, frame budget is ~16.67 ms/frame.

| Layer | Budget (ms/frame) | Budget (%) | Notes |
|---|---:|---:|---|
| Layer 0 Terrain | 1.0 | 6% | Stable baseline; minimize terrain LOD thrash. |
| Layer 1 2D Satellite | 1.5 | 9% | Texture streaming and cache hit-rate sensitive. |
| Layer 2 Photorealistic 3D | 4.0 | 24% | Primary heavy visual cost center. |
| Layer 3 3DGS reconstruction | 4.0 | 24% | GPU-heavy; first candidate for LOD demotion. |
| Layer 4 OpenSky entities | 1.5 | 9% | Depends on active track count and path history length. |
| Layer 4.5 GeoFile overlay | 1.0 | 6% | Varies by geometry complexity and styling. |
| Layer 5 Confidence map | 1.5 | 9% | Keep legend/label always visible. |
| Layer 6 OSINT markers | 1.0 | 6% | Cluster aggressively at low zoom. |
| Layer 7 UI/annotations | 1.2 | 7% | Interaction overhead + labels/timeline. |
| **Total** | **16.7** | **100%** | Meets 60 FPS target if budgets are enforced. |

> **Ralph Q:** *Are these budgets measured from production telemetry?*  
> **A:** [ASSUMPTION — UNVERIFIED] They are engineering target budgets derived from 60 FPS constraints; production profiling is still required.

## LOD Cascade (Required)
Degrade in this order under GPU/CPU pressure:
1. **3DGS (WebGL2)** -> full fidelity when headroom exists.
2. **Point cloud** -> reduce shader complexity while preserving event shape.
3. **3D Tiles mesh** -> lower-detail geometric representation.
4. **2D fallback** -> imagery/screenshot/report mode for low-end devices.

Trigger signals:
- Sustained frame time > 16.67 ms.
- GPU memory pressure events.
- Thermal throttling or low-power mode on client device.

> **Ralph Q:** *Should we wait for users to complain before cascading down?*  
> **A:** No; cascade should be proactive on sustained frame-time violations to preserve usability.

## Multitenant Isolation, Billing Attribution, and Safety
- All scene assets, including GeoFiles and reconstructions, are tenant-scoped.
- Asset paths follow `{BASE_PATH}/{tenantId}/{resourceId}/`.
- Every render-relevant API request and asset fetch is attributable to `tenantId`.
- Cross-tenant layer composition is prohibited unless explicit sharing grants exist.
- AI-derived layers must remain labeled and must not be represented as verified ground truth.
- Verified-evidence export from AI layers requires `humanReviewed=true`, retained watermark, and provenance metadata sidecar.
- Platform-admin cross-tenant diagnostics are break-glass only and must be explicitly audited.

> **Ralph Q:** *Can we compose layers from two tenants in one analyst view for convenience?*  
> **A:** Not by default. Only explicit, audited sharing grants may allow cross-tenant composition.

## Assumptions Register
- [ASSUMPTION — UNVERIFIED] Exact per-device hardware class thresholds for each LOD transition are not finalized in repo docs.
- [ASSUMPTION — UNVERIFIED] Final renderer batching strategy (entity batching vs layer-local batching) is not explicitly documented.
