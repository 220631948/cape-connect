# ControlNet Research (Normalized)

> **TL;DR:** ControlNet is useful for sparse-view enhancement and scene completion in geospatial workflows, but survey-grade metric accuracy is unresolved. Position as experimental augmentation, not source-of-truth geometry. End-to-end "ControlNet → reliable 3D Tiles at scale" remains low-confidence.
>
> **Roadmap Relevance:** M8+ (Phase 3 Visionary) — experimental. Requires quantitative geodetic error evaluation before any production use.

## Scope
Synthesis of repository research on ControlNet-family methods in geospatial reconstruction workflows.

## Findings (evidence-tagged)
- **[Verified-Repo]** Repo documents an 8-step ControlNet-conditioned reconstruction concept feeding into 3DGS/Cesium workflows (`GIS_MASTER_CONTEXT.md` §7.3).
- **[Verified-Repo]** Conditioning signals emphasized in local docs: depth, normal, edges, segmentation, and pose (`GIS_MASTER_CONTEXT.md`, `spatial-intelligence/spatial-ai-innovations.md`).
- **[Verified-Repo]** Existing research notes frame ControlNet as useful for sparse-view enhancement and scene completion, but with caution on geometric truth (`controlnet-gis-reconstruction.md`, `spatialintelligence-deep-dive-2026-03-05.md`).
- **[Verified-Repo]** Repo repeatedly distinguishes research viability from production certainty (`spatial-intelligence/domain-extensions.md`).

## Skeptical Notes
- **[Unverified]** Survey-grade metric accuracy of ControlNet-enhanced geometry is explicitly unresolved in local research.
  - **Verification needed:** quantitative geodetic error evaluation against trusted ground truth.
- **[Unverified]** End-to-end “ControlNet → reliable 3D Tiles at scale” remains low-confidence in repo assessments.
  - **Verification needed:** large-scene pilot with QA gates (PSNR/SSIM + spatial error + human review).

## Practical Implication for This Repo
Position ControlNet as an experimental augmentation layer, not a source-of-truth geometry pipeline.

## References
- `docs/research/controlnet-gis-reconstruction.md`
- `docs/context/GIS_MASTER_CONTEXT.md`
- `docs/research/spatial-intelligence/spatial-ai-innovations.md`
- `docs/research/spatialintelligence-deep-dive-2026-03-05.md`
- `docs/research/spatial-intelligence/domain-extensions.md`
