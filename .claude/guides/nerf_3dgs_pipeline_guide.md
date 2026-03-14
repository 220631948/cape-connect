---
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
---

# NeRF/3DGS/4DGS Reconstruction Pipeline Guide

## Pipeline Overview

```
Geotagged images → COLMAP SfM → Point cloud → 3DGS training → Export → 3D Tiles → CesiumJS
```

### Full Pipeline Steps
1. **Capture** — Geotagged imagery (drone, phone, satellite)
2. **SfM** — COLMAP structure-from-motion → sparse point cloud + camera poses
3. **Dense** — COLMAP dense reconstruction (optional, for NeRF comparison)
4. **Train** — 3D Gaussian Splatting optimisation
5. **Temporal** — 4DGS extension for time-varying scenes
6. **Edit** — ControlNet + GaussCtrl for scene modifications
7. **Export** — Convert to CesiumJS-compatible 3D Tiles
8. **Serve** — Tile server or static hosting
9. **Render** — CesiumJS viewer with temporal controls

## Python Microservice Architecture

### Tech Stack
```
FastAPI (REST API) + Celery (task queue) + Redis (broker) + Docker
```

### Service Layout
```
reconstruction-service/
├── Dockerfile
├── docker-compose.yml
├── app/
│   ├── main.py              # FastAPI entrypoint
│   ├── routers/
│   │   ├── upload.py         # Image upload endpoint
│   │   ├── jobs.py           # Job status/control
│   │   └── export.py         # 3D Tiles download
│   ├── workers/
│   │   ├── colmap_worker.py  # SfM pipeline
│   │   ├── gs_worker.py      # 3DGS training
│   │   └── export_worker.py  # 3D Tiles conversion
│   ├── models/
│   │   └── schemas.py        # Pydantic models
│   └── config.py             # Environment config
├── requirements.txt
└── tests/
```

### API Endpoints
```python
@router.post("/jobs")
async def create_reconstruction_job(
    images: list[UploadFile],
    params: ReconstructionParams,
    tenant_id: str = Depends(get_tenant),
) -> JobResponse:
    """Start a new reconstruction job."""
    job = await queue_reconstruction(images, params, tenant_id)
    return JobResponse(job_id=job.id, status="queued")

@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str) -> JobStatus:
    """Check reconstruction job progress."""

@router.get("/jobs/{job_id}/tiles")
async def download_tiles(job_id: str) -> FileResponse:
    """Download 3D Tiles output."""
```

## Input Requirements

### Geotagged Imagery
| Parameter | Minimum | Recommended |
|-----------|---------|-------------|
| Image count | 20 | 50–200 |
| Overlap | 60% | 75–80% |
| Resolution | 1920×1080 | 4K+ |
| GPS accuracy | 10m | Sub-metre (RTK) |
| Format | JPEG with EXIF | JPEG/PNG with EXIF GPS |

### EXIF GPS Tags Required
```
GPSLatitude, GPSLongitude, GPSAltitude, GPSImgDirection (optional)
```

### Coordinate Convention
> All input coordinates: **EPSG:4326** (CLAUDE.md §2). The pipeline validates and rejects
> non-WGS84 inputs.

## 3D Gaussian Splatting Training Parameters

### Default Configuration
```python
training_params = {
    "iterations": 30_000,
    "position_lr_init": 0.00016,
    "position_lr_final": 0.0000016,
    "position_lr_delay_mult": 0.01,
    "position_lr_max_steps": 30_000,
    "feature_lr": 0.0025,
    "opacity_lr": 0.05,
    "scaling_lr": 0.005,
    "rotation_lr": 0.001,
    "densification_interval": 100,
    "opacity_reset_interval": 3000,
    "densify_from_iter": 500,
    "densify_until_iter": 15_000,
    "densify_grad_threshold": 0.0002,
    "sh_degree": 3,
}
```

### Quality Presets
| Preset | Iterations | Time (est.) | PSNR Target |
|--------|-----------|-------------|-------------|
| Draft | 7,000 | ~5 min | 25+ dB |
| Standard | 30,000 | ~20 min | 30+ dB |
| High | 60,000 | ~45 min | 33+ dB |
| Ultra | 100,000 | ~90 min | 35+ dB |

## 4DGS Temporal Extension

### Concept
4D Gaussian Splatting adds a temporal dimension to static 3DGS — each Gaussian has a
time-dependent position, opacity, and covariance. This enables reconstruction of dynamic
scenes from multi-timestamp captures.

### Timestamped Reconstructions
```python
class TemporalGaussian:
    position: Callable[[float], np.ndarray]   # pos(t) → [x, y, z]
    opacity: Callable[[float], float]          # opacity(t) → [0, 1]
    covariance: Callable[[float], np.ndarray]  # cov(t) → 3×3 matrix
    sh_coefficients: np.ndarray                # View-dependent colour
    timestamp_range: tuple[float, float]       # Valid time range
```

### Use Cases for Cape Town
- Construction progress monitoring (multi-date drone surveys)
- Coastal erosion tracking (seasonal beach imagery)
- Event visualisation (V&A Waterfront, sports venues)
- Urban development timeline (before/after comparisons)

## ControlNet + GaussCtrl Editing

### Capabilities
- **Texture editing:** Change building facades, road markings
- **Object insertion:** Add proposed buildings to existing scene
- **Removal:** Remove temporary structures, vehicles
- **Style transfer:** Apply different lighting/weather conditions

### Pipeline
```
3DGS scene → Select edit region → ControlNet generates target →
GaussCtrl optimises Gaussians → Updated 3DGS scene
```

### Example: Proposed Building Insertion
```python
edit_params = {
    "scene_path": "output/cape_town_cbd/point_cloud.ply",
    "edit_region": {
        "center": [18.4241, -33.9249],
        "radius_m": 50,
    },
    "prompt": "Modern glass office tower, 20 stories, Cape Town style",
    "control_type": "depth",
    "strength": 0.8,
}
```

## Output Format: CesiumJS-Compatible 3D Tiles

### Conversion Pipeline
```bash
# 3DGS PLY → glTF → 3D Tiles (1.1)
python convert_gs_to_gltf.py --input scene.ply --output scene.gltf
npx 3d-tiles-tools tilesetToDatabase --input scene.gltf --output tileset/
```

### Tileset Structure
```
tileset/
├── tileset.json          # Root tileset descriptor
├── tile_0_0_0.b3dm       # Batched 3D Model tiles
├── tile_1_0_0.b3dm
└── ...
```

### CesiumJS Loading
```typescript
const reconstruction = await Cesium3DTileset.fromUrl('/tiles/tileset.json', {
  maximumScreenSpaceError: 8,
  maximumMemoryUsage: 256,
});
viewer.scene.primitives.add(reconstruction);

// Data source badge (CLAUDE.md Rule 1)
<DataBadge source="3DGS Reconstruction" year="2024" status="LIVE" />
```

## Quality Validation Checklist

- [ ] COLMAP SfM registered ≥ 90% of input images
- [ ] Point cloud is within Cape Town bounding box (18.0–19.5°E, 33.0–34.5°S)
- [ ] 3DGS training PSNR ≥ 28 dB (standard preset)
- [ ] No floating artifacts outside scene bounds
- [ ] Exported 3D Tiles load in CesiumJS without errors
- [ ] Tileset georeferenced correctly (overlay matches 2D basemap)
- [ ] File size within tile budget (< 100 MB for single POI)
- [ ] Temporal consistency verified (4DGS: smooth transitions between timestamps)
- [ ] Attribution metadata embedded in tileset.json

## Cape Town Specific Targets

### Heritage Buildings
- City Hall, Castle of Good Hope, Bo-Kaap houses
- High SH degree (3) for colourful facades
- Heritage overlay validation: check protection zones

### Table Mountain
- Large-scale terrain reconstruction
- Use satellite + drone imagery fusion
- Validate against CoCT DEM data
- Seasonal vegetation changes → 4DGS candidate

### V&A Waterfront Harbour
- Dynamic scene (boats, crowds) → 4DGS
- Multiple capture sessions for temporal coverage
- Maritime heritage structures: Clock Tower, Grain Silo
- Coordinate with harbour access permits

### Processing Notes
- Cape Town scenes are GPU-intensive (high dynamic range, reflective surfaces)
- Ocean/water areas: mask out before training (poor Gaussian fit)
- Windy conditions affect drone captures — check EXIF for blur
- Table Mountain cloud cover: filter cloudy images pre-COLMAP
