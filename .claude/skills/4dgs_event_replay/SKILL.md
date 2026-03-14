---
name: 4dgs-event-replay
description: Guide 4D Gaussian Splatting event replay pipeline — temporal reconstruction of Cape Town events using timestamped point clouds.
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
---

# 4D Gaussian Splatting Event Replay Skill

## Purpose
Guide 4D Gaussian Splatting event replay pipeline — temporal reconstruction of Cape Town events using timestamped point clouds. Ensures temporal point cloud data flows correctly from capture through reconstruction to CesiumJS-based playback.

## Trigger
Invoke when:
- Working on 4DGS reconstruction or temporal replay pipelines
- Processing timestamped point cloud data for dynamic scene rendering
- Building temporal navigation UI for 3D scene playback
- Integrating 4DGS output with CesiumJS 3D Tiles

## Procedure

### Step 1 — Validate Input Point Cloud Format
Accepted formats: `.ply`, `.las`, `.laz`, `.pcd`, `.xyz`.
Each point must include `x, y, z` plus per-point attributes (colour, normal, timestamp).

```python
# Validate PLY header contains required fields
required_fields = ['x', 'y', 'z', 'timestamp', 'red', 'green', 'blue']
```

### Step 2 — Check Temporal Metadata (ISO 8601)
All timestamps must be ISO 8601 format with timezone:
```
2026-01-15T14:32:00+02:00   # SAST (UTC+2)
```
- Reject data without temporal metadata
- Validate chronological ordering within each capture session
- Minimum temporal resolution: 1 frame per second for event replay

### Step 3 — Ensure EPSG:4326 Coordinates
All point cloud coordinates must be in EPSG:4326 (WGS84):
```sql
-- Verify coordinate ranges match Cape Town
SELECT COUNT(*) FROM point_cloud_meta
WHERE lng BETWEEN 18.0 AND 19.5
  AND lat BETWEEN -34.5 AND -33.0;
```
- Reproject from local survey CRS if needed (e.g., Hartebeesthoek94 → WGS84)
- Height values in metres above WGS84 ellipsoid

### Step 4 — Verify CesiumJS 3D Tiles Output Compatibility
Output must conform to 3D Tiles 1.1 specification:
- `tileset.json` with temporal extensions
- Batch table contains `TIMESTAMP` property
- GLB/glTF content with Draco compression
- LOD pyramid with geometric error thresholds

```json
{
  "asset": { "version": "1.1" },
  "geometricError": 500,
  "root": {
    "boundingVolume": {
      "region": [0.3141, -0.6021, 0.3403, -0.5760, 0, 300]
    }
  }
}
```

### Step 5 — Check Frame Rate Targets
| Quality | FPS | Use Case |
|---------|-----|----------|
| Preview | 10 | Quick review, scrubbing |
| Standard | 24 | Dashboard playback |
| High | 30 | Presentation, export |

Warn if reconstructed frame count cannot sustain target FPS for scene duration.

### Step 6 — Validate Bounding Box Within Cape Town
```typescript
const CAPE_TOWN_BBOX = {
  west: 18.0, south: -34.5, east: 19.5, north: -33.0
};
// All point cloud extents must fit within this bbox
```
Reject datasets with >5% of points outside the bounding box.

## Output
- 4DGS pipeline configuration (`pipeline.yaml`)
- Temporal index mapping timestamps to frame IDs
- CesiumJS integration notes (viewer config, clock settings, timeline widget)
- Quality report (point density, temporal coverage, reconstruction fidelity)

## When NOT to Use This Skill
- Static 2D map layers — use spatial_validation instead
- Simple GeoJSON overlays — use data_source_badge instead
- Pre-rendered video flyovers with no interactive temporal control
- Google Photorealistic 3D Tiles (static, not 4DGS)
