# 3DGS vs NeRF Research (Normalized)

> **TL;DR:** Repo strategy favors 3DGS/Splatfacto as the primary production path for interactive web visualization. NeRF remains a fallback for specific workflows. All performance claims (FPS, training times) are provisional until benchmarked in-project. Cesium integration audited in verification docs.
>
> **Roadmap Relevance:** M8+ (Phase 3) — 3DGS rendering pipeline. Depends on CesiumJS introduction (Phase 2 gate).

## Scope
Synthesis of repository findings on NeRF-family methods vs 3D Gaussian Splatting (3DGS) for browser GIS.

## Findings (evidence-tagged)
- **[Verified-Repo]** Repo guidance prefers **3DGS/Splatfacto** as primary production path for interactive web visualization (`3dgs-nerf-gis-research.md`, `GIS_MASTER_CONTEXT.md` §7.2).
- **[Verified-Repo]** NeRF-family approaches are still useful for specific workflows, but repo strategy favors rasterized splats for higher runtime performance (`3dgs-nerf-gis-research.md`, `spatialintelligence-deep-dive-2026-03-05.md`).
- **[Verified-Repo]** Cesium integration is explicitly part of the architecture narrative; version/feature claims were previously audited and corrected in verification docs (`verification_report.md`).
- **[Verified-Repo]** PLY fallback is repeatedly documented when standardization status is uncertain (`spatial-intelligence/README.md`, `domain-extensions.md`).

## Skeptical Notes
- **[Unverified]** Precise FPS/training numbers are context-dependent and not validated by in-repo benchmark scripts.
  - **Verification needed:** reproducible benchmark suite on target GPU tiers.
- **[Unverified]** Ratification timeline details for `KHR_gaussian_splatting` can drift.
  - **Verification needed:** latest Khronos spec status check and Cesium release validation.

## Practical Implication for This Repo
Adopt 3DGS-first for interactive rendering, keep NeRF paths as fallback/experimental, and treat all performance claims as provisional until benchmarked in-project.

## References
- `docs/research/3dgs-nerf-gis-research.md`
- `docs/context/GIS_MASTER_CONTEXT.md`
- `docs/research/spatialintelligence-deep-dive-2026-03-05.md`
- `docs/research/spatial-intelligence/README.md`
- `docs/research/verification_report.md`
