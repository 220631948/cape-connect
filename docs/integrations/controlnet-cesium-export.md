# ControlNet to Cesium Export Integration

## TL;DR
ControlNet-conditioned datasets feed NeRF/3DGS training, then export to Cesium with synchronized time overlays, tenant isolation, and mandatory AI disclosure controls.

## Assumptions & Uncertainty Tags
- Canonical uncertainty label in this doc set is `[ASSUMPTION — UNVERIFIED]`.
- Apply this tag where device-tier tuning, scene-density performance, or quality-threshold automation is not implementation-verified.
- Uncertain outputs remain explicitly labeled and cannot be promoted to verified evidence without review.

## Verified Facts vs Assumptions

### Verified Facts
- Canonical sequence: augmented dataset → trained model → export artifacts → Cesium asset ingestion.
- Time-dynamic overlays must sync reconstruction with OpenSky trajectory context.
- Tenant-isolated paths and sharing controls are mandatory.

### [ASSUMPTION — UNVERIFIED]
- Optimal runtime tuning values for all Cesium3DTileset properties depend on scene density and device class.

---

## ControlNet Output → Cesium Pipeline
1. Build augmented image set from geometry priors + ControlNet novel views.
2. Run COLMAP alignment and georeferencing.
3. Train primary model via Splatfacto (fallback Nerfacto when constrained).
4. Export to splat/pointcloud/mesh format.
5. Upload and process into Cesium-ready asset.
6. Bind asset to timeline overlays and AI metadata gates.

---

## Cesium3DTileset Loading Pattern (Documentation Comment Format)

```text
// Cesium3DTileset Loading Pattern
// - Source: tenant-scoped assetId from reconstruction pipeline
// - Recommended controls:
//   * maximumScreenSpaceError: tune for device tier
//   * cullWithChildrenBounds: true for traversal efficiency
//   * dynamicScreenSpaceError: enabled for dense urban scenes
//   * preloadWhenHidden: false by default (cost control)
// - Always attach AI label banner + confidence indicator in viewer UI.
// - Prevent “verified evidence” badge unless humanReviewed=true.
```

---

## Time-Dynamic Integration
- Timeline key: event timestamp index (`JulianDate`).
- At time `T`, synchronize:
  - OpenSky trajectory sample,
  - Reconstruction visibility/opacity state,
  - Annotation layer and weather context.
- Out-of-sync sources must show explicit “temporal uncertainty” marker.

---

## Asset Management Governance
- TTL policies differ by draft, reviewed, and published states.
- Quotas enforced per tenant for storage, processing, and export volume.
- Cross-tenant sharing requires explicit grant, expiration date, and audit entry.

## Multitenant Storage Isolation
- Required namespace: `/{BASE}/{tenantId}/{eventId}/...`
- ControlNet cache and exported assets must both be tenant-scoped.
- No shared writable paths across tenants.

## ⚖️ Ethical Use & Compliance
- AI-generated geometry must be treated as analytical aid, not verified evidence, unless separately corroborated and reviewed.
- Watermark non-removable for all AI-derived views.
- `humanReviewed=false` blocks verified-evidence export.
- Citation template and provenance metadata always included with share/export payloads.

## Ralph Q/A
- **Q:** What if generated views look realistic but conflict with known map features?
  **A:** Flag mismatch, reduce confidence, require manual reviewer override with justification.
- **Q:** What if a tenant asks to disable labels temporarily?
  **A:** Deny request; policy is non-negotiable platform rule.

## API Contract

- **Pipeline-internal:** No external API; ControlNet runs as a local GPU inference step.
- **Cesium ion upload:** `POST /v1/assets` with tenant-tagged metadata (see `cesium-nerf-export.md`).
- **Auth:** Cesium ion token (`CESIUM_ION_ACCESS_TOKEN`); tenant-scoped attribution.

## Environment Variables

| Variable | Required | Source |
|---|---|---|
| `CONTROLNET_ENABLED` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `CONTROLNET_MODELS` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `CONTROLNET_CACHE_PATH` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `CONTROLNET_MVCONTROL_ENABLED` | No | `GIS_MASTER_CONTEXT.md` §15 |
| `CESIUM_ION_ACCESS_TOKEN` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `NERF_TRAINING_BACKEND` | Yes | `GIS_MASTER_CONTEXT.md` §15 |

## Three-Tier Fallback

`[LIVE]` Real-time ControlNet conditioning + training pipeline → `[CACHED]` previously exported Cesium assets → `[MOCK]` placeholder 2D event marker from `public/mock/`.

## Data Source Badge

`[ControlNet+3DGS · {YEAR} · LIVE|CACHED|MOCK]` — displayed on every AI-reconstructed scene layer.

## Error Handling

- **GPU unavailable:** queue job for deferred processing; show 2D event marker as placeholder.
- **ControlNet conditioning fails:** fall back to unconditioned Splatfacto with lower confidence.
- **Cesium upload fails:** retry with backoff; persist export artifacts locally.

## POPIA Implications

- Source imagery may contain identifiable individuals or private property.
- Apply mandatory AI labeling; `humanReviewed=false` blocks verified-evidence export.
- ControlNet cache and exported assets must both be tenant-scoped.

## Milestone Mapping

- **M7** (AI Reconstruction): ControlNet conditioning pipeline.
- **M10** (4D WorldView): Time-synchronized reconstruction assembly.

## Known Unknowns
- Best automated geometric-consistency score for ControlNet outputs is still unsettled.
- Comparative drift across repeated re-training cycles needs ongoing monitoring.

## References
- [NeRF + 3D Gaussian Splatting Integration](./nerf-3dgs-integration.md)
- [Cesium ↔ NeRF/3DGS Export Integration](./cesium-nerf-export.md)
- [Cesium Platform Integration](./cesium-platform.md)
- [AI Reconstruction Pipeline](../architecture/ai-reconstruction-pipeline.md)
- [ControlNet Workflow](../architecture/controlnet-workflow.md)
- `docs/prompts/GIS_FLEET_PLAN_PROMPT_V3.md` (ControlNet-Cesium integration requirements)
- `docs/context/GIS_MASTER_CONTEXT.md` (§7.3, §9, §10)
