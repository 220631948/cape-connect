# Cesium ↔ NeRF/3DGS Export Integration

## TL;DR
Export workflow transforms Nerfstudio outputs (especially Splatfacto) into Cesium-consumable assets with strict tenant namespace, labeling metadata, and lifecycle governance.

## Assumptions & Uncertainty Tags
- Canonical uncertainty label in this doc set is `[ASSUMPTION — UNVERIFIED]`.
- Use this tag for non-finalized conversion fidelity claims, quota-dependent behavior, and runtime parity assumptions.
- Any uncertain export behavior must preserve fallback routing and operator-visible provenance.

## Verified Facts vs Assumptions

### Verified Facts
- Export references include `ns-export gaussian-splat`, `ns-export pointcloud`, and Cesium ion REST asset upload.
- 3DGS/Splatfacto is the primary production route.
- Storage and billing attribution must be tenant-scoped.
- `KHR_gaussian_splatting` status is Release Candidate; fallback behavior remains mandatory.

### [ASSUMPTION — UNVERIFIED]
- Ion conversion behavior for all custom splat encodings may vary by backend updates.

---

## Nerfstudio Export Commands (Reference Only)

```bash
# Gaussian splat export
ns-export gaussian-splat --load-config outputs/.../config.yml \
  --output-dir exports/{tenantId}/{eventId}/splats/

# Point cloud fallback export
ns-export pointcloud --load-config outputs/.../config.yml \
  --output-dir exports/{tenantId}/{eventId}/pointcloud/
```

---

## Cesium ion REST Upload Workflow
1. Create asset via `POST /v1/assets` with tenant-tagged metadata.
2. Receive upload credentials + destination.
3. Upload exported payload.
4. Poll processing status until ready.
5. Persist resulting `assetId` on tenant-scoped Event/ReconstructedScene entity.

---

## Asset Type Mapping

| Source Artifact | Intermediate | Cesium Target |
|---|---|---|
| `.ply` splat export | tiling/transcode pipeline | 3D Tiles-compatible scene asset |
| Point cloud export | point cloud tileset prep | 3D Tiles point cloud |
| Mesh export | glTF/mesh tiles pipeline | 3D Tiles mesh |

> Runtime note: treat CesiumJS 1.139+ as minimum tested baseline for splat stability; full cross-runtime parity remains `[ASSUMPTION — UNVERIFIED]`.

---

## Per-Tenant Asset Namespace
- Naming convention: `{tenantId}-{eventId}-{assetType}-{timestamp}`
- Path convention: `CESIUM_TILES_OUTPUT_PATH/{tenantId}/{eventId}/...`
- Metadata minimum: `tenantId`, `eventId`, `confidenceLevel`, `humanReviewed`.

---

## Storage Quota Management
- Track per-tenant cumulative storage and processing budgets.
- Soft warning threshold (e.g., 80%), hard block threshold by plan policy.
- If ion quota is exhausted, route to self-hosted tiler fallback and record policy event.

---

## Asset Lifecycle Policy
- Draft reconstruction assets: short TTL, auto-clean after review timeout.
- Published analytical assets: extended TTL with tenant retention policy.
- Offboarding: tenant-scoped purge job + audit confirmation.

## AI Labeling + Human Review Gate
- Upload metadata includes AI labeling fields.
- Verified-evidence export requires `humanReviewed=true`.
- Watermark policy applies to all rendered exports.

## ⚖️ Ethical Use & Compliance
- AI-derived scene assets must stay visibly labeled and must not be presented as verified ground truth without human corroboration.
- Provenance and citation metadata must remain attached through lifecycle transitions.
- Cross-tenant asset exposure forbidden without explicit grant.

## Ralph Q/A
- **Q:** What if upload succeeds but conversion fails?
  **A:** Mark asset `processing_failed`, retain logs, and trigger retry/fallback path.
- **Q:** What if asset exceeds plan quota during incident response?
  **A:** Allow temporary emergency override only under audited admin approval.

## API Contract

- **Cesium ion REST:** `POST /v1/assets` (create), `GET /v1/assets/{assetId}` (status poll), upload via signed URL.
- **Auth:** Bearer token (`CESIUM_ION_ACCESS_TOKEN`); tenant-scoped or shared with attribution.
- **Rate limits:** Per Cesium ion plan tier; monitor via usage dashboard.

## Environment Variables

| Variable | Required | Source |
|---|---|---|
| `CESIUM_ION_ACCESS_TOKEN` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `CESIUM_TILES_OUTPUT_PATH` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `CESIUM_TILES_MAX_SIZE_PER_TENANT_GB` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `NERF_TRAINING_BACKEND` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `NERF_MODEL_STORAGE_PATH` | Yes | `GIS_MASTER_CONTEXT.md` §15 |

## Three-Tier Fallback

`[LIVE]` Cesium ion-hosted 3D Tiles asset → `[CACHED]` self-hosted tiles at `CESIUM_TILES_OUTPUT_PATH` → `[MOCK]` 2D fallback imagery overlay from `public/mock/`.

## Data Source Badge

`[3DGS Export · {YEAR} · LIVE|CACHED|MOCK]` — displayed on every rendered reconstruction asset.

## Error Handling

- **Ion upload succeeds but conversion fails:** mark asset `processing_failed`, retain logs, trigger retry/fallback path.
- **Ion quota exhausted:** route to self-hosted tiler fallback and record policy event.
- **Export pipeline failure:** surface error to user; never silently drop reconstruction assets.

## POPIA Implications

- Reconstructed scenes from public imagery may incidentally capture identifiable individuals.
- Apply face/plate blurring where feasible before evidence-grade export. [ASSUMPTION — UNVERIFIED]
- Tenant-scoped asset storage prevents cross-tenant exposure.

## Milestone Mapping

- **M6** (3D Visualization): CesiumJS 3D Tiles rendering pipeline.
- **M7** (AI Reconstruction): Nerfstudio → Cesium ion export workflow.
- **M10** (4D WorldView): Time-dynamic reconstruction assembly.

## Known Unknowns
- Best compression strategy balancing fidelity vs ion quotas is still being benchmarked.
- Long-term archival format for splat assets is not yet standardized.

## References
- [NeRF + 3D Gaussian Splatting Integration](./nerf-3dgs-integration.md)
- [ControlNet to Cesium Export Integration](./controlnet-cesium-export.md)
- [Cesium Platform Integration](./cesium-platform.md)
- [AI Reconstruction Pipeline](../architecture/ai-reconstruction-pipeline.md)
- [ADR-009: Three-Tier Fallback](../architecture/ADR-009-three-tier-fallback.md)
- `docs/prompts/GIS_FLEET_PLAN_PROMPT_V3.md` (Cesium export requirements)
- `docs/context/GIS_MASTER_CONTEXT.md` (§7.2, §9, §10)
