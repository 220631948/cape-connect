<!--
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
-->

# /4dgs-status — 4D Gaussian Splatting Pipeline Status

## Trigger
`/4dgs-status` or "check 4DGS pipeline" or "splatting status"

## What It Does
Checks the operational status of the 4D Gaussian Splatting (4DGS) reconstruction pipeline, including the Python microservice, training data, output format, temporal indexing, and CRS compliance.

## Procedure
1. **Verify Python microservice config**
   - Check `4dgs-service/` or equivalent directory exists
   - Verify `requirements.txt` / `pyproject.toml` includes: `torch`, `numpy`, `plyfile`, `py3dtiles` (or equivalent)
   - Check Docker container config for the 4DGS service in `docker-compose.yml`
   - Verify service health endpoint responds (if running)
   - Confirm GPU requirements are documented (CUDA version, VRAM minimum)
2. **Check training data availability**
   - Verify input image/video directory is configured
   - Check COLMAP or equivalent SfM output exists (cameras.bin, images.bin, points3D.bin)
   - Validate input data covers Cape Town bbox `{ west: 18.0, south: -34.5, east: 19.5, north: -33.0 }` (Rule 9)
   - Confirm training data is not committed to git (check `.gitignore`)
3. **Validate output format (3D Tiles)**
   - Verify pipeline outputs OGC 3D Tiles 1.1 format (`.b3dm` / `.glb` + `tileset.json`)
   - Check `tileset.json` schema: `geometricError`, `refine`, `boundingVolume` present
   - Confirm output directory is served by Martin or static file server
   - Validate that output integrates with CesiumJS `Cesium3DTileset` loader
4. **Check temporal index**
   - 4DGS produces time-varying splats — verify temporal dimension is indexed
   - Check timestamp metadata in output tiles (ISO 8601 format)
   - Verify temporal slider/playback config exists in frontend viewer
   - Confirm temporal range is bounded to valid capture dates
5. **Verify EPSG:4326 output**
   - All output coordinates must be in EPSG:4326 (WGS 84) for storage
   - Check georeferencing transform in pipeline config
   - Verify output `boundingVolume.region` uses radians (CesiumJS convention) derived from WGS84
   - Confirm no implicit CRS mixing between training input and tile output

## Expected Output
```
4DGS Pipeline Status Report — [date]
=====================================

✅ PASSED:
  - Python microservice: docker container '4dgs-service' running
  - Dependencies: torch 2.2, py3dtiles 7.0 installed
  - Training data: 1,247 images, COLMAP SfM complete
  - Output: tileset.json valid, 342 .b3dm tiles
  - Temporal index: 12 timesteps (2025-01-15 to 2025-12-20)
  - CRS: output in EPSG:4326, boundingVolume.region in radians

⚠️ WARNINGS:
  - GPU: CUDA 12.1 detected, pipeline tested on 11.8
    → Verify torch+cu121 compatibility
  - Training data: 23 images outside Cape Town bbox
    → Filter before next training run

🚨 ERRORS:
  - Docker container '4dgs-service' not found in docker-compose.yml
    → Add service definition with GPU passthrough
  - Output tileset.json missing 'geometricError' at root
    → Fix py3dtiles export config
  - No temporal metadata in .b3dm tiles
    → Add timestamp to batch table
```

## When NOT to Use
- For standard 2D vector tile issues (use `/optimize-tiles`)
- When debugging CesiumJS viewer (use `/cesium-validate`)
- For pre-trained static 3D models (this is for the reconstruction pipeline)
