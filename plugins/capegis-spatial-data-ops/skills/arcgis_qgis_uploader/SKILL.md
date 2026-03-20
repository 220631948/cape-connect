---
name: arcgis-qgis-uploader
description: Handle ArcGIS .shp/.gdb and QGIS .qgz file upload, validation, reprojection, and visualization.
---

# ArcGIS / QGIS Uploader

Invoke when user uploads spatial data files (`.shp`, `.dbf`, `.shx`, `.prj`, `.gdb`, `.qgz`, `.gpkg`).

## Checklist

1. **Validate File Integrity:** Shapefiles require all four files (`.shp`, `.dbf`, `.shx`, `.prj`). GeoPackage must have valid `gpkg_contents` table. QGIS `.qgz` must be valid ZIP.
2. **Detect Source CRS:** Parse `.prj` for Shapefiles, `spatial_ref_sys` for GeoPackage. Common SA CRS: EPSG:2046 (Hartebeesthoek94), EPSG:4148.
3. **Reproject to EPSG:4326:** Use `ogr2ogr -f GeoJSON -t_srs EPSG:4326`. Preserve original CRS in metadata for audit trail.
4. **Extract Geometry Types:** Classify as Point/Line/Polygon. Reject mixed-geometry layers — split into separate typed layers.
5. **Check Feature Count:** >10,000 features → load into PostGIS → serve via Martin MVT. ≤10,000 → client-side GeoJSON.
6. **POPIA Scan:** Check attribute columns against PII patterns (`/owner/i`, `/name/i`, `/id.?number/i`, `/phone/i`, `/email/i`). Flag and require human review.
7. **Generate Preview Layer Config:** Auto-generate MapLibre layer config with appropriate paint properties for the geometry type.

## Output
- Reprojected GeoJSON or PostGIS table, MapLibre layer config, POPIA report, import summary.

## When NOT to Use
- Data already in PostGIS, pre-processed GeoJSON, raster data (`.tif`), CSV with lat/lng.
