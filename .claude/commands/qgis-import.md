<!--
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
-->

# /qgis-import — QGIS Project / GeoPackage Import Validator

## Trigger
`/qgis-import <path>` or "import QGIS project" or "load .gpkg"

## What It Does
Validates QGIS `.qgz` project files and `.gpkg` (GeoPackage) files for import into the PostGIS database. Extracts project structure, inventories layers, detects CRS per layer, plans reprojection, and scans for POPIA-sensitive attributes.

## Procedure
1. **Extract .qgz (it's a zip)**
   - `.qgz` is a zipped QGIS project — extract to temp directory
   - Identify the `.qgs` XML file inside (the actual project definition)
   - For `.gpkg` input: skip extraction, proceed directly to layer inventory
   - Check for embedded data sources vs external file references
2. **Parse QGIS project XML**
   - Read `<mapcanvas>` for project CRS and extent
   - Extract `<projectlayers>` list with data source paths
   - Identify layer types: vector, raster, mesh, point cloud
   - Only vector layers are importable — flag others as ⚠️ skipped
   - Check for broken data source references (missing files)
3. **Identify layers**
   - List all vector layers with: name, geometry type, feature count, source path
   - For `.gpkg`: use `ogrinfo` to list tables/layers inside the GeoPackage
   - Detect layer groups and ordering (useful for Z-order mapping to MapLibre)
   - Map QGIS layer styles to potential MapLibre style equivalents (informational)
4. **Detect CRS per layer**
   - Each layer may have a different CRS — check individually
   - Parse `<srs>` elements in project XML or GeoPackage `gpkg_spatial_ref_sys` table
   - Common South African CRS:
     - `EPSG:4326` (WGS 84) — no reprojection needed
     - `EPSG:2048` (Hartebeesthoek94 / Lo19)
     - `EPSG:2046` (Hartebeesthoek94 / Lo15)
     - `EPSG:32734` (WGS 84 / UTM zone 34S)
   - Flag layers with mismatched CRS (project CRS ≠ layer CRS)
5. **Plan reprojection**
   - For each non-EPSG:4326 layer, generate `ogr2ogr` reprojection command
   - Verify reprojected extents fall within Cape Town bbox (Rule 9)
   - For `.gpkg` with multiple layers: batch reprojection script
6. **Check feature counts**
   - Per-layer feature count via `ogrinfo -so`
   - If any layer > 10,000 features: recommend Martin MVT (CLAUDE.md map rule)
   - Total feature count across all layers — warn if > 200,000
7. **POPIA scan**
   - Per-layer attribute scan for PII indicators:
     - Names: `owner`, `name`, `surname`, `first_name`, `last_name`, `id_number`
     - Contact: `email`, `phone`, `address`, `cell`
     - Financial: `income`, `salary`, `bank`
   - Flag layers containing PII — require POPIA annotation on import migration (Rule 5)
   - Recommend column exclusion list for guest-mode queries

## Expected Output
```
QGIS Import Readiness Report — [date]
=====================================
Input: planning_data.qgz
Type: QGIS Project (zipped)
Project CRS: EPSG:2048

Layer Inventory:
┌──────────────────────┬────────────┬──────────┬───────────┬───────────┐
│ Layer                │ Geom Type  │ Features │ CRS       │ Status    │
├──────────────────────┼────────────┼──────────┼───────────┼───────────┤
│ zoning_polygons      │ MultiPoly  │ 8,412    │ EPSG:2048 │ ✅ ready  │
│ heritage_sites       │ Point      │ 234      │ EPSG:4326 │ ✅ ready  │
│ road_centrelines     │ LineString │ 31,007   │ EPSG:2048 │ ⚠️ MVT    │
│ owner_parcels        │ MultiPoly  │ 12,891   │ EPSG:2048 │ ⚠️ POPIA  │
│ aerial_2024          │ Raster     │ —        │ EPSG:3857 │ ⏭️ skip   │
└──────────────────────┴────────────┴──────────┴───────────┴───────────┘

✅ PASSED:
  - Project file extracted successfully
  - 4 vector layers identified
  - CRS detected for all layers

⚠️ WARNINGS:
  - road_centrelines: 31,007 features → use Martin MVT
  - owner_parcels: column 'OWNER_NAME' flagged as PII → POPIA annotation required
  - aerial_2024: raster layer skipped (vector import only)

🚨 ERRORS:
  - None

Reprojection commands:
  ogr2ogr -f GPKG output.gpkg input.qgz -t_srs EPSG:4326 -nln zoning_polygons
  ogr2ogr -f GPKG output.gpkg input.qgz -t_srs EPSG:4326 -nln road_centrelines -append

Import layers ready: 4/5 (1 raster skipped)
```

## When NOT to Use
- For ArcGIS `.shp` / `.gdb` files (use `/arcgis-import`)
- For standalone GeoJSON files (use `/validate-spatial`)
- For raster-only QGIS projects — this command handles vector layers only
- For data outside Cape Town / Western Cape bounding box (Rule 9)
