---
name: nerf-3dgs-pipeline
description: Orchestrate NeRF and 3D Gaussian Splatting reconstruction pipelines for Cape Town scenes.
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
---

# NeRF / 3DGS Pipeline Skill

## Purpose
Orchestrate NeRF and 3D Gaussian Splatting reconstruction pipelines for Cape Town scenes. Manages the full workflow from geotagged imagery ingestion through 3D reconstruction to CesiumJS-compatible 3D Tiles output.

## Trigger
Invoke when:
- Processing drone or satellite imagery into 3D reconstructions
- Selecting between NeRF, 3DGS, or 4DGS pipeline variants
- Configuring Python reconstruction microservice
- Generating CesiumJS-compatible 3D Tiles from point clouds or radiance fields
- Quality-checking reconstruction output

## Procedure

### Step 1 — Validate Input Imagery
All input images must be geotagged with EXIF coordinates:
```python
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

def validate_image(path: str) -> dict:
    img = Image.open(path)
    exif = img._getexif()
    gps_info = exif.get(34853)  # GPSInfo tag
    assert gps_info is not None, f"No GPS data in {path}"
    lat = dms_to_decimal(gps_info[2], gps_info[1])
    lng = dms_to_decimal(gps_info[4], gps_info[3])
    # Verify within Cape Town bbox
    assert 18.0 <= lng <= 19.5, f"Longitude {lng} outside Cape Town"
    assert -34.5 <= lat <= -33.0, f"Latitude {lat} outside Cape Town"
    return {'path': path, 'lat': lat, 'lng': lng}
```

Minimum requirements:
- Resolution: ≥ 1920×1080
- Overlap: ≥ 70% between adjacent frames
- Image count: ≥ 50 for quality reconstruction

### Step 2 — Select Pipeline Variant
| Pipeline | Input | Output | Use When |
|----------|-------|--------|----------|
| **NeRF** | Multi-view images | Novel view synthesis | High visual fidelity needed |
| **3DGS** | Multi-view images | Gaussian splat model | Real-time rendering priority |
| **4DGS** | Timestamped images/video | Temporal splat model | Dynamic scenes, event replay |

Decision logic:
```python
def select_pipeline(has_timestamps: bool, needs_realtime: bool) -> str:
    if has_timestamps:
        return '4dgs'   # Temporal reconstruction
    elif needs_realtime:
        return '3dgs'   # Fast rendering
    else:
        return 'nerf'   # Best quality
```

### Step 3 — Configure Python Microservice
```yaml
# reconstruction-service/config.yaml
service:
  name: capegis-reconstruction
  port: 8090
  gpu_required: true

pipeline:
  type: 3dgs  # nerf | 3dgs | 4dgs
  iterations: 30000
  sh_degree: 3
  resolution: 1
  white_background: false

output:
  format: 3dtiles    # 3D Tiles 1.1
  crs: EPSG:4326
  compression: draco
  lod_levels: 4
```

### Step 4 — Ensure Output in EPSG:4326
All reconstructed geometry must be georeferenced to EPSG:4326:
```python
# Transform local reconstruction coordinates to WGS84
import pyproj

transformer = pyproj.Transformer.from_crs(
    "EPSG:32734",   # UTM Zone 34S (common for Cape Town surveys)
    "EPSG:4326",
    always_xy=True
)
lng, lat = transformer.transform(x_local, y_local)
```

### Step 5 — Generate CesiumJS-Compatible 3D Tiles
Output structure:
```
output/
├── tileset.json          # Root tileset descriptor
├── tiles/
│   ├── 0/               # LOD 0 (coarsest)
│   ├── 1/               # LOD 1
│   ├── 2/               # LOD 2
│   └── 3/               # LOD 3 (finest)
└── metadata.json         # Source imagery info, reconstruction params
```

Tileset must include:
- Bounding region in radians (Cape Town extent)
- Geometric error per LOD level
- Draco-compressed GLB content
- Batch table with source metadata

### Step 6 — Quality Validation
```python
quality_checks = {
    'point_count': count >= 1_000_000,           # Minimum point density
    'coverage': coverage_pct >= 95.0,             # % of input views reconstructed
    'reprojection_error': rpe <= 1.0,             # pixels
    'bbox_valid': within_cape_town(output_bbox),  # Geographic constraint
    'file_size': total_mb <= 500,                 # Reasonable output size
}
```

## Output
- Pipeline configuration file (`config.yaml`)
- Microservice Dockerfile for GPU-enabled reconstruction
- 3D Tiles output specification (tileset.json schema)
- Quality validation report
- Integration guide for CesiumJS viewer

## When NOT to Use This Skill
- Pre-existing 3D models already in 3D Tiles format
- Google Photorealistic 3D Tiles already available for the area
- 2D-only analysis without 3D reconstruction needs
- Non-imagery data (LiDAR point clouds → use 4dgs_event_replay)
