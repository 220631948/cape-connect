---
name: arcgis-qgis-uploader
description: Handle ArcGIS .shp/.gdb and QGIS .qgz file upload, validation, reprojection, and visualization.
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
---

# ArcGIS / QGIS Uploader Skill

## Purpose
Handle ArcGIS `.shp`/`.gdb` and QGIS `.qgz` file upload, validation, reprojection, and visualization. Ensures uploaded spatial data conforms to project CRS, feature count limits, and POPIA requirements before integration.

## Trigger
Invoke when:
- User uploads spatial data files (`.shp`, `.dbf`, `.shx`, `.prj`, `.gdb`, `.qgz`, `.gpkg`)
- Processing external GIS datasets for import into the platform
- Converting between spatial file formats
- Bulk-loading vector data into PostGIS

## Procedure

### Step 1 — Validate File Integrity and Format
| Format | Required Files | Validation |
|--------|---------------|------------|
| Shapefile | `.shp` + `.dbf` + `.shx` + `.prj` | All four must be present |
| FileGDB | `.gdb/` directory | Valid Esri geodatabase structure |
| QGIS Project | `.qgz` | Valid ZIP containing `.qgs` XML |
| GeoPackage | `.gpkg` | Valid SQLite with `gpkg_contents` table |

```bash
# Validate shapefile completeness
for ext in shp dbf shx prj; do
  [ -f "${basename}.${ext}" ] || echo "MISSING: ${basename}.${ext}"
done
```

### Step 2 — Detect Source CRS
```bash
# Using GDAL/OGR
ogrinfo -al -so input.shp | grep "Layer SRS"
```
- Parse `.prj` file for Shapefiles
- Read `spatial_ref_sys` for GeoPackage
- Common South African CRS to expect: EPSG:2046 (Hartebeesthoek94), EPSG:4148 (Hartebeesthoek94 geographic)

### Step 3 — Reproject to EPSG:4326
```bash
ogr2ogr -f GeoJSON -t_srs EPSG:4326 output.geojson input.shp
```
- Always reproject to EPSG:4326 for storage
- Preserve original CRS metadata in feature properties for audit trail
- Log reprojection in import report

### Step 4 — Extract Geometry Types
Classify all features:
- Point / MultiPoint
- LineString / MultiLineString
- Polygon / MultiPolygon
- GeometryCollection (split into typed layers)

Reject mixed-geometry layers — split into separate typed layers.

### Step 5 — Check Feature Count (>10k → Martin MVT)
```typescript
if (featureCount > 10_000) {
  // Load into PostGIS table → serve via Martin MVT
  console.warn('Feature count exceeds 10k — routing to Martin MVT pipeline');
} else {
  // Serve as client-side GeoJSON
}
```

### Step 6 — POPIA Scan for Personal Data Columns
Scan attribute columns for potential personal information:
```typescript
const PII_PATTERNS = [
  /owner/i, /name/i, /surname/i, /id.?number/i,
  /phone/i, /email/i, /address/i, /contact/i,
  /income/i, /race/i, /gender/i
];
```
- Flag columns matching PII patterns
- Generate POPIA annotation block if PII detected
- Require human review before import of flagged datasets

### Step 7 — Generate Preview Layer Config
```typescript
const layerConfig = {
  id: `upload-${timestamp}`,
  type: geometryType === 'Polygon' ? 'fill' : geometryType === 'Point' ? 'circle' : 'line',
  source: { type: 'geojson', data: reprojectedData },
  paint: { /* auto-generated style */ },
  metadata: { source: filename, crs_original: sourceCRS, feature_count: count }
};
```

## Output
- Reprojected GeoJSON file or PostGIS table (EPSG:4326)
- MapLibre layer configuration object
- POPIA report (flagged columns, risk assessment)
- Import summary (feature count, geometry types, CRS transformation log)

## When NOT to Use This Skill
- Data already loaded in PostGIS — query directly
- Pre-processed GeoJSON files in `public/mock/`
- Raster data (`.tif`, `.img`) — requires separate raster pipeline
- CSV with lat/lng columns — use simple geocoding instead
