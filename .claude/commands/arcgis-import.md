<!--
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
-->

# /arcgis-import — ArcGIS Shapefile / Geodatabase Import Validator

## Trigger
`/arcgis-import <path>` or "import shapefile" or "load .gdb"

## What It Does
Validates ArcGIS `.shp` and `.gdb` (File Geodatabase) files for import into the PostGIS database. Checks file integrity, detects source CRS, plans reprojection to EPSG:4326, scans for POPIA-sensitive fields, and generates a ready-to-use SQL migration.

## Procedure
1. **Detect file type**
   - Identify if input is `.shp` (Shapefile) or `.gdb` (File Geodatabase directory)
   - For `.gdb`: list all feature classes inside
   - For `.shp`: identify the target layer name from filename
2. **Validate integrity**
   - Shapefile requires companion files: `.dbf` (attributes), `.shx` (index), `.prj` (projection)
   - Report missing companions as 🚨 ERROR
   - For `.gdb`: verify it's a valid Esri File Geodatabase (check `gdb` directory structure)
   - Check file sizes — warn if > 500MB (consider chunked import)
3. **Detect source CRS**
   - Parse `.prj` file (Shapefile) or feature class spatial reference (GDB)
   - Identify EPSG code from WKT projection definition
   - Common South African CRS to detect:
     - `EPSG:4326` (WGS 84) — no reprojection needed
     - `EPSG:2048` (Hartebeesthoek94 / Lo19) — Cape Town zone
     - `EPSG:2046` (Hartebeesthoek94 / Lo15)
     - `EPSG:32734` (WGS 84 / UTM zone 34S)
     - `EPSG:4148` (Hartebeesthoek94 geographic)
   - If CRS is unknown, flag as 🚨 ERROR — do not guess
4. **Plan reprojection to EPSG:4326**
   - If source is not EPSG:4326, generate `ogr2ogr` command for reprojection
   - Verify reprojected coordinates fall within Cape Town bbox (Rule 9)
   - Warn if datum transformation is needed (Hartebeesthoek94 → WGS84)
5. **Check feature count**
   - Count features using `ogrinfo`
   - If > 10,000: recommend Martin MVT instead of client-side GeoJSON (CLAUDE.md map rule)
   - If > 100,000: recommend chunked import with `COPY` instead of `INSERT`
6. **POPIA scan**
   - Scan attribute columns for PII indicators:
     - Names: `owner`, `name`, `surname`, `first_name`, `last_name`, `id_number`
     - Contact: `email`, `phone`, `address`, `cell`
     - Financial: `income`, `salary`, `bank`
   - If PII detected: require POPIA annotation block on import migration (Rule 5)
   - Flag columns that should be excluded from guest-mode queries
7. **Generate import SQL**
   - Produce a migration file template: `supabase/migrations/YYYYMMDDHHMMSS_import_[layer].sql`
   - Include: `CREATE TABLE`, geometry column (`GEOMETRY(MultiPolygon, 4326)`), GiST index
   - Include: RLS enable + force + tenant isolation policy (Rule 4)
   - Include: `COPY` or `INSERT` strategy based on feature count
   - Include: `ST_MakeValid()` post-import cleanup

## Expected Output
```
ArcGIS Import Readiness Report — [date]
=====================================
Input: data/cadastral_parcels.shp
Type: ESRI Shapefile
Companions: .dbf ✅ .shx ✅ .prj ✅ .cpg ✅

Source CRS: EPSG:2048 (Hartebeesthoek94 / Lo19)
Target CRS: EPSG:4326 (WGS 84)
Reprojection: REQUIRED

Features: 45,231
Geometry type: MultiPolygon

✅ PASSED:
  - File integrity: all companion files present
  - CRS detected: EPSG:2048
  - Geometry type: MultiPolygon (compatible with PostGIS)

⚠️ WARNINGS:
  - Feature count 45,231 exceeds 10,000 → use Martin MVT for rendering
  - POPIA: column 'OWNER_NAME' may contain personal data
    → Add POPIA annotation to migration, exclude from guest queries

🚨 ERRORS:
  - None

Reprojection command:
  ogr2ogr -f "GeoJSON" output.geojson input.shp -t_srs EPSG:4326 -s_srs EPSG:2048

Migration template saved to:
  supabase/migrations/20260304145100_import_cadastral_parcels.sql
```

## When NOT to Use
- For GeoJSON files (use `/validate-spatial` instead)
- For QGIS project files `.qgz` / `.gpkg` (use `/qgis-import`)
- For raster data (GeoTIFF, ECW) — not supported by this command
- For data outside Cape Town / Western Cape bounding box (Rule 9)
