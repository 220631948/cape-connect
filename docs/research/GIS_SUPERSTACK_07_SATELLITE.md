# GIS_SUPERSTACK_07_SATELLITE — Satellite Imagery Domain

This document surveys satellite imagery providers, licensing, preprocessing, ingest pipelines, cloud masking, analytics, and operational recommendations for the CapeTown GIS Hub (capegis). Emphasis is placed on open data sources (Sentinel, Landsat) and pragmatic processing stacks that fit the project's constraints (Open tools, PostGIS + Martin tile server, Vercel frontend). Where recommendations exceed the approved budget or scope the document calls out a required PLAN_DEVIATION.

NOTE: Follow project rules in /home/mr/Desktop/Geographical Informations Systems (GIS)/CLAUDE.md when implementing any of these recommendations (CRS, RLS, no new libs without approval, data badges, etc.).

---

### 1. Overview [Tool v3.7] – https://gdal.org
Code snippet (GDAL info):

    gdalinfo --version

Rollback note: Remove created temp files and revert any environment variables set for processing (e.g., unset S3 credentials). If pipeline changes committed, revert the commit.

### 2. Open data first: Sentinel-2 [Tool v2.11 (Sen2Cor)] – https://sentinel.esa.int
Code snippet (download + inspect):

    aws s3 cp s3://sentinel-s2-l1c/tiles/ --recursive --exclude "*" --include "*202603*.jp2" --no-sign-request

Rollback note: Delete any downloaded L1C tiles and any derived products. If configured scheduled downloads, disable cron/Cloud Function.

### 3. Open data: Landsat 8/9 [Tool v1.5] – https://landsat.usgs.gov
Code snippet (download via USGS/earth-search):

    landsat-download --collection landsat-8 --scene-id LC08_L1TP_... --output ./landsat

Rollback note: Remove local scenes and clear staged COGs. Revoke any temporary API tokens used.

### 4. Commercial provider: PlanetScope (Planet) [Tool v1.0] – https://www.planet.com
Code snippet (Planet API example):

    curl -u "$PLANET_API_KEY": https://api.planet.com/data/v1/item-types/PSScene4Band/items

Rollback note: Terminate subscriptions or automated ordering tasks. > ⚠️ PLAN_DEVIATION required — Planet imagery is commercial and may exceed budget.

### 5. Commercial provider: Maxar (DigitalGlobe) [Tool v1.0] – https://www.maxar.com
Code snippet (order imagery):

    # Maxar ordering uses their portal/API — example placeholder
    curl -H "Authorization: Bearer $MAXAR_TOKEN" "https://api.maxar.com/orders"

Rollback note: Cancel orders, revoke API keys. > ⚠️ PLAN_DEVIATION required — Maxar licensing costs are high; approve before procurement.

### 6. Radiometric calibration & band arithmetic [Tool v1.3] – https://rasterio.readthedocs.io
Code snippet (convert DN to reflectance, example with GDAL Calc):

    gdal_calc.py -A B04.jp2 -B B03.jp2 --outfile=ndvi.tif --calc="(A.astype(float)-B.astype(float))/(A.astype(float)+B.astype(float))"

Rollback note: Delete intermediate calibrated files and regenerate from source if needed.

### 7. Atmospheric correction: Sen2Cor (Sentinel) [Tool v2.11] – https://step.esa.int
Code snippet (run Sen2Cor):

    L2A_Process --resolution 10 <SENTINEL_L1C_SAFE_DIR>

Rollback note: Remove generated L2A SAFE products and any cached look-up tables. Re-run on L1C if needed.

### 8. Cloud masking: Fmask / s2cloudless [Tool v4.0] – https://github.com/prsultan/fmask
Code snippet (s2cloudless python example):

    python -c "from s2cloudless import S2Cloudless; print('ok')"

Rollback note: Recompute masks if algorithm or thresholds change; store masks separately from COGs for efficient rollback.

### 9. Reprojection & resampling (EPSG:4326 → 3857) [Tool v3.7] – https://gdal.org/programs/gdalwarp.html
Code snippet (gdalwarp to WebMercator):

    gdalwarp -t_srs EPSG:3857 -r bilinear input.tif output_3857.tif

Rollback note: Keep original CRS copies; delete reprojections if mistaken. Prefer regenerate rather than in-place edits.

### 10. Create Cloud-Optimized GeoTIFFs (COGs) for serving [Tool v3.7] – https://gdal.org/drivers/raster/gtiff.html
Code snippet (create COG):

    gdal_translate input.tif output.tif -co "TILED=YES" -co "COMPRESS=LZW" -co "BIGTIFF=IF_SAFER"
    gdaladdo -r average output.tif 2 4 8 16

Rollback note: Replace COGs with previous version or delete from object storage and re-upload prior version.

### 11. Tiling & vector caches (PMTiles / Martin) [Tool v0.9] – https://github.com/protomaps/pmtiles
Code snippet (generate raster tiles with gdal2tiles-like approach):

    gdal2tiles.py -z 0-14 -w none output.tif ./tiles

Rollback note: Purge tile bucket, rollback tile index, and re-run tile generation. If using Martin, update service config and restart Docker container.

### 12. Ingest pipelines: orchestration (Dagster/airflow alternatives) [Tool v0.1] – https://github.com/PrefectHQ/prefect
Code snippet (example cron job wrapping a script):

    #!/bin/bash
    python /opt/pipelines/ingest_sentinel.py --date 2026-03-01

Rollback note: Disable scheduled job, revert pipeline code, and restore previous scheduling configuration. > ⚠️ PLAN_DEVIATION required if recommending paid orchestration services without approval.

### 13. Storage: Supabase Storage vs S3 (object store) [Tool v1.0] – https://supabase.com
Code snippet (upload COG to Supabase Storage via CLI):

    supabase storage upload satellite/2026-03-01/output.tif output.tif --public

Rollback note: Remove staged objects, revoke temporary keys. If moving between providers revert references in tile server configs.

### 14. Analytics — Vegetation indices & change detection [Tool v0.16] – https://turfjs.org (client) / https://rasterio.readthedocs.io (server)
Code snippet (NDVI with rasterio/python):

    import rasterio
    with rasterio.open('B08.tif') as nir, rasterio.open('B04.tif') as red:
        ndvi = (nir.read(1).astype(float)-red.read(1).astype(float))/(nir.read(1)+red.read(1)+1e-6)

Rollback note: Archive derived layers with timestamps; to rollback remove specific analysis products.

### 15. Time-series compositing & phenology [Tool v0.15] – https://eoxhub.org
Code snippet (median composite using GDAL):

    rio stack create --output stack.vrt B*.tif
    rio stack percentile --percentile 50 stack.vrt composite.tif

Rollback note: Keep per-date inputs and composites; replace composite with previous median if necessary.

### 16. QA, provenance & metadata (STAC) [Tool v1.0] – https://stacspec.org
Code snippet (generate STAC item with pystac):

    from pystac import Item
    # ... create Item and save

Rollback note: If STAC items are incorrect, delete and recreate with corrected metadata. Keep audit logs for provenance.

### 17. Edge delivery: MapLibre + raster tiles/XYZ [Tool v2.1] – https://maplibre.org
Code snippet (MapLibre source):

    map.addSource('sat-tiles', { type: 'raster', tiles: ['https://tiles.example.com/{z}/{x}/{y}.png'], tileSize: 256 })

Rollback note: If client side rendering causes issues, disable the source and fall back to cached raster layer or mock data per Rule 2 (Three-Tier Fallback).

### 18. Large-area workflows & compute (Dask, xarray, rioxarray) [Tool v2024.8] – https://xarray.dev
Code snippet (open multiple COGs with rioxarray):

    import rioxarray as rxr
    ds = rxr.open_rasterio('s3://bucket/path/to/*.tif', chunks={'band':1, 'x':1024, 'y':1024})

Rollback note: Terminate cluster jobs, delete temporary Zarr caches. > ⚠️ PLAN_DEVIATION required if recommending paid cloud cluster sizing beyond budget.

### 19. Cloud masking operational patterns (practical patterns)
Code snippet (fmask run):

    python fmask.py -i input.tif -o mask.tif

Rollback note: Regenerate masks with different thresholds or revert to conservative mask (keep more cloudy pixels) depending on analytics needs.

### 20. Performance tuning & storage patterns (COG + overviews)
Code snippet (build overviews):

    gdaladdo -r average output.tif 2 4 8 16 32

Rollback note: Restore original file from versioned storage; verify tile server points to correct COG.

---

Recommendations (summary and operational guidance):

- Prioritise Sentinel-2 and Landsat for baseline analyses: they are freely available, global, and consistent with project budget and openness. Use Sen2Cor for atmospherics when higher-quality surface reflectance is required.

- Use COGs and PMTiles for efficient serving to the front-end (MapLibre). Martin tile server can serve vector tiles; raster tiles should be deployed as XYZ from object storage or a raster tile server. Maintain the Three-Tier Fallback (LIVE → CACHED → MOCK) for satellite-based layers.

- For production pipelines, implement versioned buckets (timestamped prefixes), STAC cataloging, and manifest-driven ingest. Keep provenance in a Postgres table and in STAC metadata.

- Commercial data (Planet, Maxar): only procure after formal approval and budget sign-off. Marked as PLAN_DEVIATION when suggested.

- Do not hardcode API keys in source. Store in .env and ensure Next.js public variables only where safe.

- Keep analytical outputs under 300-line source limit by splitting long scripts into modules and documenting in docs/research rather than single giant files.

Operational checklist (short):
- [ ] Configure sentinel and landsat scheduled acquisitions
- [ ] Build ingest pipeline producing L2A (Sentinel) and COGs
- [ ] Publish STAC catalog for imagery
- [ ] Add data source badges to UI per Rule 1
- [ ] Ensure Three-Tier Fallback and mock GEOJSONs are available

---

Files added/changed by this research note:
- /home/mr/Desktop/Geographical Informations Systems (GIS)/docs/research/GIS_SUPERSTACK_07_SATELLITE.md

If any recommended paid services are selected, document the decision in docs/PLAN_DEVIATIONS.md and do not proceed to procurement without human approval.

Generated by Unit 07: GIS_SUPERSTACK_07_SATELLITE researcher.
