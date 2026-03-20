---
name: nerf-3dgs-pipeline
description: Orchestrate NeRF and 3D Gaussian Splatting reconstruction pipelines for Cape Town scenes.
---

# NeRF / 3DGS Pipeline

Invoke when processing drone/satellite imagery into 3D reconstructions.

## Checklist

1. **Validate Input Imagery:** All images must be geotagged (EXIF GPS). Minimum: ≥50 images, ≥1920×1080, ≥70% overlap. Coordinates must fall within Cape Town bbox.
2. **Select Pipeline:** NeRF = best visual fidelity. 3DGS = real-time rendering priority. 4DGS = dynamic/temporal scenes. Decision: has timestamps → 4DGS, needs real-time → 3DGS, else → NeRF.
3. **Configure Python Microservice:** GPU-required service on port 8090. Config: iterations (30k), SH degree (3), output format (3D Tiles 1.1), compression (Draco), LOD levels (4).
4. **Ensure Output in EPSG:4326:** Transform from local CRS (e.g., UTM Zone 34S / EPSG:32734) to WGS84. Height in metres above ellipsoid.
5. **Generate CesiumJS 3D Tiles:** Output `tileset.json` with bounding region in radians, geometric error per LOD, Draco-compressed GLB content, batch table with source metadata.
6. **Quality Validation:** Point count ≥1M, coverage ≥95%, reprojection error ≤1px, bbox within Cape Town, total size ≤500MB.

## Output
- Pipeline config (`config.yaml`), microservice Dockerfile, 3D Tiles output spec, quality report.

## When NOT to Use
- Pre-existing 3D models, Google Photorealistic Tiles already available, 2D-only analysis, LiDAR point clouds (use 4dgs_event_replay).
