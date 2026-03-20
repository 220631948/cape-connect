# Supported File Formats & Ingestion Paths

**Canonical Reference for Pillar 6: File Import & Format Support**

This document provides comprehensive guidance on supported spatial file formats, parsing strategies, validation rules, and rendering paths for both MapLibre (2D) and CesiumJS (3D) visualization.

---

## Quick Reference Table

| Format | Type | Origin | Client-Side? | Recommended Path |
|--------|------|--------|------------|------------------|
| `.shp` + `.dbf` + `.prj` | Vector (Shapefile) | ArcGIS / QGIS | ✅ Limited | Parse → GeoJSON → MapLibre/Cesium |
| `.gpkg` | Vector + Raster | QGIS | ⚠️ Read-only | Server-side extraction → GeoJSON/MVT/Tiles |
| `.geojson` | Vector | Standard | ✅ Direct | MapLibre source / CesiumJS GeoJSONDataSource |
| `.kml` / `.kmz` | Vector | ArcGIS / Google | ✅ With conversion | CesiumJS KmlDataSource or convert to GeoJSON |
| `.gdb` | File Geodatabase | ArcGIS | ❌ No | Server-side extraction via GDAL/ArcGIS REST |
| `.qgz` / `.qgs` | Project File (XML) | QGIS | ❌ No | Extract layers to `.shp` / `.geojson` |
| `.mxd` / `.aprx` | Project File (binary) | ArcGIS | ❌ No | Server-side export to standard formats |
| `.tif` / `.geotiff` | Raster imagery | Both | ✅ Small only | Tiled imagery / Cesium ImageryProvider |
| `.laz` / `.las` | Point cloud (LiDAR) | Both | ⚠️ Server | Convert to 3D Tiles (PDAL/Entwine) → Cesium |

---

## Vector Formats

### `.shp` + `.dbf` + `.prj` — Shapefile Bundle

**Type:** Vector  
**Supported By:** ArcGIS, QGIS, most GIS tools

#### Parsing Library
- **JavaScript/Node.js:** `shapefile.js` (pure JS, no dependencies)
- **Python:** `pyshp` or GDAL's `ogrinfo`
- **Validation:** Use `turf.js` for geometry checks

#### Validation Rules
- **Bundle completeness:** Must include `.shp`, `.dbf`, and `.prj` (projection required for CRS detection)
- **Maximum size:** <50 MB recommended for client-side parsing; larger files should be processed server-side
- **Feature count:** Warn if >100k features (performance impact in Cesium/MapLibre)
- **Geometry types:** Validate all features have consistent geometry type (Point, LineString, Polygon)
- **Encoding:** `.dbf` may use CP1252 (Windows ANSI); decode carefully with `iconv-lite`

#### CesiumJS Rendering
```javascript
// 1. Parse shapefile on server
const { records } = await parse(shapefile);
const geojson = convertToGeoJSON(records);

// 2. Add as GeoJSONDataSource
const dataSource = await Cesium.GeoJsonDataSource.load(geojson);
viewer.dataSources.add(dataSource);

// 3. For large datasets, convert to 3D Tiles server-side
// Using GDAL: ogr2ogr -f "3D Tiles" output.tileset input.shp
```

#### MapLibre Rendering
```javascript
// 1. Convert to GeoJSON
const geojson = convertToGeoJSON(shapefileRecords);

// 2. Add as GeoJSON source
map.addSource('shapefile', { type: 'geojson', data: geojson });
map.addLayer({
  id: 'shapefile-fill',
  type: 'fill',
  source: 'shapefile',
  paint: { 'fill-color': '#088', 'fill-opacity': 0.8 }
});
```

#### CRS Detection
- Read `.prj` file (OGC WKT format)
- Parse EPSG code (e.g., `EPSG:4326`)
- Transform to EPSG:3857 for MapLibre if necessary

---

### `.gpkg` — GeoPackage

**Type:** Vector + Raster (SQLite-based)  
**Supported By:** QGIS, PostGIS, most modern GIS tools

#### Parsing Library
- **Preferred:** Server-side `GDAL/ogr2ogr` or PostGIS import
- **JavaScript (client inspection only):** `sql.js` (SQLite WASM port) — read-only, no write locks
- **Python:** `geopandas` + `fiona`

#### Validation Rules
- **Write locks:** Do NOT attempt client-side writes; always process server-side
- **Layer count:** List all available layers with `ogrinfo` or `PRAGMA table_list`
- **Maximum size:** <500 MB for server extraction; split larger files
- **Spatial index:** Check for spatial indices to ensure query performance
- **Coordinate systems:** Inspect `gpkg_spatial_ref_sys` table for CRS definitions

#### CesiumJS Rendering
```bash
# Server-side: Extract layer to GeoJSON
ogr2ogr -f GeoJSON output.geojson input.gpkg LayerName

# Then load in Cesium
const dataSource = await Cesium.GeoJsonDataSource.load('output.geojson');
viewer.dataSources.add(dataSource);
```

#### MapLibre Rendering
```bash
# Convert to MVT (Map Vector Tiles) for efficient rendering
ogr2ogr -f MVT tiles.mbtiles input.gpkg -dsco FORMAT=MBTILES

# Or convert to GeoJSON for direct source
ogr2ogr -f GeoJSON output.geojson input.gpkg
```

---

### `.geojson` — GeoJSON

**Type:** Vector  
**Standard:** RFC 7946 (IETF)

#### Parsing Library
- **Native browser:** `JSON.parse()` (no library needed)
- **Validation:** `@mapbox/geojson-validation` or custom schema validation
- **Optimization:** `mapbox-gl` can ingest GeoJSON directly

#### Validation Rules
- **Feature count:** Warn if >50k features (browser performance); recommend MVT tiling for larger datasets
- **Schema:** All features must have consistent `properties` structure
- **Geometry validity:** Run `turf.js` booleanValid() on each geometry
- **Coordinate bounds:** Ensure coordinates stay within EPSG:4326 range (-180 to 180 lon, -90 to 90 lat)
- **File size:** <10 MB recommended for direct browser loading; use tiled/MVT for larger files

#### CesiumJS Rendering
```javascript
// Direct loading
const dataSource = await Cesium.GeoJsonDataSource.load({
  type: 'FeatureCollection',
  features: [...] // GeoJSON features
});
viewer.dataSources.add(dataSource);

// With styling
dataSource.entities.values.forEach(entity => {
  entity.polygon.material = Cesium.Color.BLUE.withAlpha(0.5);
});
```

#### MapLibre Rendering
```javascript
// Add as inline source
map.addSource('geojson-source', {
  type: 'geojson',
  data: geojsonObject
});

map.addLayer({
  id: 'geojson-layer',
  type: 'fill',
  source: 'geojson-source'
});
```

---

### `.kml` / `.kmz` — Keyhole Markup Language

**Type:** Vector  
**Origin:** Google Earth format

#### Parsing Library
- **CesiumJS:** `Cesium.KmlDataSource.load()` (native support)
- **JavaScript:** `toGeoJSON` library for conversion to GeoJSON
- **Python:** `fastkml` or `lxml`

#### Validation Rules
- **File size:** Warn if >100 MB (large KML files degrade performance)
- **Namespace:** Verify KML namespace `http://www.opengis.net/kml/2.2`
- **Compression:** `.kmz` is ZIP; validate contents before extraction
- **Styles:** KML embedded styles may not fully translate; document conversion rules
- **Feature types:** Validate Placemarks, Folders, GroundOverlays, ScreenOverlays

#### CesiumJS Rendering
```javascript
// Load KML directly in Cesium
const dataSource = await Cesium.KmlDataSource.load('path/to/file.kml', {
  camera: viewer.camera,
  canvas: viewer.canvas
});
viewer.dataSources.add(dataSource);
```

#### MapLibre Rendering
```javascript
// Convert KML to GeoJSON first (server-side)
ogr2ogr -f GeoJSON output.geojson input.kml

// Then add as GeoJSON source (see `.geojson` section above)
```

---

### `.gdb` — File Geodatabase (ArcGIS)

**Type:** Vector (proprietary binary format)  
**Origin:** ArcGIS desktop/server

#### Parsing Library
- **JavaScript/Browser:** Not recommended; no stable WASM port
- **Server-side (recommended):** GDAL/`ogr2ogr`, ArcGIS REST API, or `arcgis-rest-js`
- **Python:** `arcpy` (if ArcGIS installed) or GDAL

#### Validation Rules
- **Server-side only:** Always extract on server; never attempt client-side parsing
- **Multi-feature class:** Inspect all feature classes with `ogrinfo`:
  ```bash
  ogrinfo input.gdb
  ```
- **Feature count:** List with `ogrcount` or SQL queries
- **Locking:** Ensure no ArcGIS locks prevent extraction
- **Data types:** GDB supports advanced types (e.g., XML blobs, rasters); validate compatibility

#### CesiumJS Rendering
```bash
# Server-side extraction
ogr2ogr -f GeoJSON output.geojson input.gdb FeatureClassName

# Client loads resulting GeoJSON
const dataSource = await Cesium.GeoJsonDataSource.load('output.geojson');
viewer.dataSources.add(dataSource);
```

#### MapLibre Rendering
```bash
# Extract and tile for efficient rendering
ogr2ogr -f GeoJSON temp.geojson input.gdb FeatureClassName
tippecanoe -o output.mbtiles temp.geojson

# Or MVT:
ogr2ogr -f MVT output.mbtiles input.gdb
```

---

## Project File Formats

### `.qgz` / `.qgs` — QGIS Project Files

**Type:** Project file (XML/ZIP format)  
**Origin:** QGIS

#### Parsing Library
- **Not for client ingestion:** QGIS project files are XML + embedded data; parsing is complex
- **Recommended approach:** Export layers from QGIS to `.geojson` or `.shp`
- **Inspection (Python):** `qgis` Python API or manual XML parsing (limited)

#### Validation Rules
- **Not for data ingestion:** `.qgz` / `.qgs` are project containers, not data formats
- **Recommended workflow:** In QGIS, right-click layer → "Export as" → `.geojson`
- **Metadata:** Project may contain styling, symbology, and layer order; document manually
- **Embedded data:** Check project size; may contain large raster or vector data

#### CesiumJS Rendering
**Not supported directly.** Export layers first.

#### MapLibre Rendering
**Not supported directly.** Export layers first.

---

### `.mxd` / `.aprx` — ArcGIS Map Documents

**Type:** Project file (binary format)  
**Origin:** ArcGIS Desktop / Pro

#### Parsing Library
- **Client-side:** Unsupported; no stable parsing library
- **Server-side:** ArcGIS Desktop (with automation), `arcpy`, or REST API export
- **WASM/experimental:** Limited GDAL support for older `.mxd` versions

#### Validation Rules
- **Server-side only:** Use ArcGIS Server to export maps as PNG/WMTS or layers as GeoJSON
- **Recommended workflow:** Use ArcGIS REST API to publish and consume layers
- **Metadata:** `.aprx` may contain 3D scenes, tables, and advanced GIS logic; export selectively

#### CesiumJS Rendering
**Not supported directly.** Use ArcGIS REST API for layer export or OGC services.

#### MapLibre Rendering
**Not supported directly.** Use ArcGIS REST API or WMTS endpoint.

---

## Raster Formats

### `.tif` / `.geotiff` — GeoTIFF (Georeferenced TIFF)

**Type:** Raster imagery  
**Supported By:** Most GIS tools, GDAL

#### Parsing Library
- **JavaScript:** `geotiff.js` (reads metadata and pixel data in browser)
- **Server-side:** GDAL (preferred for large files), `gdal_translate`
- **Python:** `rasterio`, `osgeo.gdal`

#### Validation Rules
- **Georeferencing:** Validate GeoTIFF tags (TIFFTAG_GEOPIXELSCALE, TIFFTAG_GEOTIEPOINTS)
- **CRS:** Extract from EPSG code or GeoTIFF tags; convert to Web Mercator (EPSG:3857) for MapLibre
- **File size:** <100 MB recommended for client-side; larger files should be tiled (COG)
- **Compression:** Prefer LZW or deflate; avoid uncompressed GeoTIFFs
- **Band count:** Single-band (grayscale) or 3-band (RGB); multi-band rasters need resampling

#### CesiumJS Rendering
```javascript
// For small GeoTIFFs: Use geotiff.js + Cesium ImageryProvider
import GeoTIFF from 'geotiff';

const response = await fetch('image.tif');
const arrayBuffer = await response.arrayBuffer();
const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
const image = await tiff.getImage();

// Create imagery provider from GeoTIFF data
const imageryProvider = new Cesium.ImageryProvider({
  // Configure with geotiff metadata
});

viewer.imageryLayers.addImageryLayer(
  new Cesium.ImageryLayer(imageryProvider)
);
```

#### MapLibre Rendering
```javascript
// For small, tiled GeoTIFFs as raster source
map.addSource('geotiff-source', {
  type: 'raster',
  url: 'mbtiles://geotiff-tiles', // Pre-tiled with COG or gdal_translate
  tileSize: 256
});

map.addLayer({
  id: 'geotiff-layer',
  type: 'raster',
  source: 'geotiff-source'
});
```

---

## Point Cloud Formats

### `.laz` / `.las` — LiDAR Point Clouds

**Type:** Point cloud (binary format)  
**Standard:** ASPRS LAS Specification

#### Parsing Library
- **JavaScript (client inspection):** `las.js` or `laszip.js` (limited support)
- **Server-side (recommended):** PDAL, Potree, Entwine (for 3D Tiles conversion)
- **Python:** `laspy`, `PDAL Python bindings`

#### Validation Rules
- **File size:** Large LiDAR files (>1 GB) must be converted to 3D Tiles server-side
- **Point count:** Validate with `pdal info` or `lasinfo`; millions of points require tiling
- **CRS:** Extract from LAS header (GeoKeys); ensure EPSG code is valid
- **Vertical datum:** Note vertical units (meters, feet); ensure database stores consistently
- **LAS version:** Support LAS 1.2–1.4; validate version before parsing

#### CesiumJS Rendering
```bash
# Server-side: Convert LAZ to 3D Tiles with Entwine/PDAL
pdal translate input.laz \
  -f las \
  | entwine build \
    --output output.ept \
    --reprojection \
    --hammer

# Client loads tileset
const tileset = await Cesium.Cesium3DTileset.fromUrl('output.ept/ept.json');
await viewer.zoomTo(tileset);
```

#### MapLibre Rendering
**Not suitable for 2D MapLibre.** Use Cesium or dedicated 3D point cloud viewer.

---

## CRS & Coordinate System Guidelines

### Storage & Rendering
- **Database canonical:** Store all vector data in **EPSG:4326** (WGS 84 lat/lon)
- **MapLibre rendering:** Convert to **EPSG:3857** (Web Mercator) for tile rendering
- **CesiumJS rendering:** Use WGS 84 (EPSG:4326) for accuracy; Cesium handles reprojection
- **3D Tiles:** Store in Web Mercator (EPSG:3857) for Cesium tileset optimizations

### Automatic CRS Detection
1. **Shapefile:** Read from `.prj` file (OGC WKT)
2. **GeoJSON:** Assume EPSG:4326 per RFC 7946 (document if different)
3. **GeoTIFF:** Extract from GeoTIFF tags or GDAL metadata
4. **KML:** Always WGS 84 (EPSG:4326)
5. **LAS/LAZ:** Read from LAS header GeoKeys

---

## Three-Tier Fallback Strategy

All formats must support the Three-Tier Fallback pattern per CLAUDE.md Rule 2:

1. **LIVE:** Fetch latest data from authoritative source (PostGIS, ArcGIS REST API, etc.)
   - Add DataSourceBadge: `[SOURCE·LIVE]`

2. **CACHED:** Pre-computed, versioned data (GeoJSON files, MVT tiles, etc.)
   - Add DataSourceBadge: `[SOURCE·CACHED·YYYY-MM]`

3. **MOCK:** Seed data for development & testing
   - Add DataSourceBadge: `[SOURCE·MOCK]`

**Example:**
```javascript
// In your data source component
const dataSourceBadge = data.source === 'live' 
  ? `[SOURCE·LIVE]` 
  : data.source === 'cached' 
  ? `[SOURCE·CACHED·${data.version}]`
  : `[SOURCE·MOCK]`;
```

---

## Ingestion Workflow Checklist

For any uploaded file:

- [ ] **File validation:** Format is in approved list
- [ ] **CRS detection:** Extract & validate coordinate system
- [ ] **Size check:** Does not exceed tier limits (50 MB vector, 500 MB raster, etc.)
- [ ] **Geometry validation:** Run `turf.js` checks; alert on invalid geometries
- [ ] **Feature count:** Warn if >100k features; recommend tiling
- [ ] **Encoding:** Handle non-UTF-8 DBF files (e.g., Windows ANSI)
- [ ] **Reprojection:** Convert to EPSG:4326 for storage; EPSG:3857 for MapLibre
- [ ] **Tiling:** If >10 MB, generate MVT or 3D Tiles
- [ ] **Documentation:** Log source, CRS, processing steps
- [ ] **Three-tier fallback:** Ensure MOCK data exists
- [ ] **DataSourceBadge:** Visible in UI per CLAUDE.md Rule 1

---

## References

- **Pillar 6 Plan:** See `docs/GIS_FLEET_PLAN_PROMPT_V2.md`
- **CRS Detection:** See `docs/crs-detection.md`
- **Cesium Workflows:** See `docs/cesium-rendering-workflows.md`
- **MCP Formats Prototypes:** See `docs/mcp-formats-prototypes.md`
- **Format Agent Persona:** See `.github/agents/formats-agent.md`
