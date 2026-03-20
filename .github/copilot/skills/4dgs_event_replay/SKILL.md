---
name: 4dgs-event-replay
description: Guide 4D Gaussian Splatting event replay pipeline — temporal reconstruction of Cape Town events using timestamped point clouds.
---

# 4D Gaussian Splatting Event Replay

Invoke when working on 4DGS reconstruction, temporal replay, or dynamic scene rendering of Cape Town events.

## Checklist

1. **Validate Input Point Cloud:** Accepted formats: `.ply`, `.las`, `.laz`, `.pcd`, `.xyz`. Each point must include `x, y, z, timestamp, r, g, b`.
2. **Check Temporal Metadata:** All timestamps must be ISO 8601 with timezone (e.g., `2026-01-15T14:32:00+02:00` SAST). Reject data without temporal metadata.
3. **Ensure EPSG:4326 Coordinates:** All point cloud coordinates in WGS84. Reproject from local survey CRS if needed. Verify within Cape Town bbox (`18.0–19.5°E`, `33.0–34.5°S`).
4. **Verify CesiumJS 3D Tiles Output:** Output must conform to 3D Tiles 1.1 with temporal extensions. Batch table must contain `TIMESTAMP` property. Use Draco-compressed GLB.
5. **Check Frame Rate Targets:** Preview: 10 FPS, Standard: 24 FPS, High: 30 FPS. Warn if frame count cannot sustain target.
6. **Validate Bounding Box:** Reject datasets with >5% of points outside Cape Town bounding box.

## Output
- Pipeline configuration (`pipeline.yaml`), temporal index, CesiumJS integration notes, quality report.

## When NOT to Use
- Static 2D map layers, simple GeoJSON overlays, pre-rendered video flyovers, Google Photorealistic 3D Tiles.
