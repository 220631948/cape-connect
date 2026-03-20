# GIS Fleet Plan — Pillar 6: File Import & Format Support

This document adds Pillar 6 (File Import & Format Support) to the GIS Fleet Plan. It documents the canonical formats we support, recommended parsing libraries, CRS auto-detection rules, and the rendering/integration paths for MapLibre and CesiumJS.

Pillar 6 is a P1 deliverable: domain users reference this when uploading spatial files. The formats inventory, prototypes, and an @formats-agent persona are the minimal set required to reduce friction and prevent bad uploads.

## Pillar 6 — Summary
- Goal: Make ArcGIS and QGIS file formats first-class citizens in developer docs and provide runnable examples and agent guidance for ingestion, validation, reprojection, and rendering.
- Deliverables: formats inventory, @formats-agent persona file, prototype parsers, CRS detection guide, Cesium rendering recipes, docs integration and CI hooks.

## Supported formats (inventory)
| Format | Tool | Type | Recommended libraries / notes |
|---|---|---|---|
| `.shp` + `.dbf` + `.prj` | ArcGIS / QGIS | Vector (Shapefile bundle) | `shapefile` (node), `shapefile-js`, `turf.js` for validation; read `.prj` for CRS detection |
| `.gpkg` | QGIS | Vector + Raster (GeoPackage) | Prefer GDAL/ogr2ogr or server-side access; `sql.js` for lightweight inspection; note locking issues |
| `.geojson` | Both | Vector | Native browser parsing; validate feature counts and properties; use MapLibre/Cesium for rendering |
| `.kml` / `.kmz` | ArcGIS / Google | Vector | Convert or use `Cesium.KmlDataSource`; beware of large files |
| `.gdb` | ArcGIS | File Geodatabase | Server-side extraction (GDAL/arcgis-rest-js) recommended; WASM ports experimental |
| `.qgz` / `.qgs` | QGIS | Project file (XML) | Not for client runtime; export referenced layers to supported formats |
| `.mxd` / `.aprx` | ArcGIS | Project file | Unsupported for client parsing — recommend server-side export |
| `.tif` / `.geotiff` | Both | Raster imagery | `geotiff.js` for client read; prefer tiled imagery or Cesium imagery provider for large files |
| `.laz` / `.las` | Both | Point cloud (LiDAR) | Server-side conversion to 3D Tiles (Potree/PDAL) recommended; document Cesium ingestion path |

## Agent: @formats-agent (summary)
- Purpose: answer developer questions about supported formats, provide validation checklist, and generate per-format ingestion recipes.
- Scope: parsing guidance, CRS heuristics, quick-conversion commands (ogr2ogr, gdal_translate, pdal), and safe recommendations for server-side processing.

## Integration points
- `app/public/mock/` or `public/mock/` for mock GeoJSON test data (Three-tier fallback rules)
- CI: add checks for uploaded sample files (size, presence of .prj, feature count limits)
- UI: ensure DataSourceBadge is visible for any imported dataset per CLAUDE.md Rule 1

## Acceptance criteria
- Inventory table exists and linked from the main GIS plan
- Formats-agent persona is present in `.github/agents/` and contains sample prompts
- Basic prototypes (commands + skeleton scripts) documented in `docs/mcp-formats-prototypes.md`

References: See `docs/format-inventory.md`, `docs/crs-detection.md`, `docs/cesium-rendering-workflows.md` for deeper detail.
