# GIS Feature Extraction Catalogue

> **TL;DR:** Structured extraction of all core GIS feature concepts from the CapeTown GIS Hub research corpus. Covers CRS conventions, geometry primitives, spatial operations, tile formats, data formats, analysis primitives, and layer architecture rules — sourced across 9 research documents.
>
> **Roadmap Relevance:** M1–M5 (Phase 1) — defines the spatial primitives, CRS pipeline (store 4326, render 3857, transform Lo19), feature thresholds (<5k GeoJSON, >10k Martin MVT), and layer Z-order rules used across all map implementations.

**Generated:** 2026-03-06  
**Source Documents:** GIS_MASTER_CONTEXT.md (§7–8), spatialintelligence-research.md, 01_PostGIS_Core_Ecosystem.md, 03_MapServer.md, 04_Web_Mapping_OpenLayers_Leaflet.md, 10_MapLibre_NextJS_Integration.md, gis-platform-synthesis.md, technical_architecture_extensions.md, technical_specification_findings.md  
**Agent:** AGENT A — GIS Feature Extractor

---

## Contents

1. [Coordinate Reference Systems (CRS)](#1-coordinate-reference-systems-crs)
2. [Geospatial Primitives](#2-geospatial-primitives)
3. [Vector Tile Formats & Protocols](#3-vector-tile-formats--protocols)
4. [Data Formats Supported](#4-data-formats-supported)
5. [Spatial Analysis Primitives](#5-spatial-analysis-primitives)
6. [Layer Architecture Rules](#6-layer-architecture-rules)

---

## 1. Coordinate Reference Systems (CRS)

### 1.1 EPSG Code Catalogue

| EPSG Code | Name / Description | Use Case in capegis | Source |
|-----------|-------------------|---------------------|--------|
| **EPSG:4326** | WGS 84 — geographic lat/lon | **Storage standard** for all PostGIS geometries. RFC 7946 mandates for GeoJSON. | 01_PostGIS, gis-platform-synthesis, GIS_MASTER_CONTEXT §8, technical_spec |
| **EPSG:3857** | Web Mercator (Pseudo-Mercator) | **Rendering standard** for MapLibre GL JS, OpenLayers, and CARTO basemap tiles. | 01_PostGIS, gis-platform-synthesis |
| **EPSG:22279** | Lo19 / Hartebeesthoek94, Cape Town | Western Cape municipal coordinate system used in raw City of Cape Town data. Must be transformed to 4326 before use. | 01_PostGIS |
| **EPSG:2053** | Hartebeesthoek94 / Lo19 (Gauss-Kruger) | Mentioned in performance specification: `EPSG:2053 → 4326` conversion drift < 0.00001°. | technical_spec |
| **EPSG:2046** | Hartebeesthoek94 / Lo15 | South African projected CRS — include in pre-loaded proj4 definitions. | gis-platform-synthesis |
| **EPSG:2048** | Hartebeesthoek94 / Lo17 | South African projected CRS — include in pre-loaded proj4 definitions. | gis-platform-synthesis |
| **EPSG:4148** | Hartebeesthoek94 (geographic) | South African datum — include in pre-loaded proj4 definitions. | gis-platform-synthesis |
| ECEF (implicit) | Earth-Centered, Earth-Fixed | CesiumJS internal representation for 3D Tiles and CZML entities. Aligns with WGS84 ellipsoid. | spatialintelligence-research, GIS_MASTER_CONTEXT §5 |

### 1.2 CRS Transformation Patterns

```
Storage (PostGIS)       Serving                Client Rendering
EPSG:4326 ──────────▶  GeoJSON (4326) ──────▶ MapLibre (projects to 3857 internally)
EPSG:4326 ──────────▶  Martin MVT   ──────────▶ MapLibre GL JS (WebGL)
EPSG:4326 ──────────▶  GeoJSON/CZML ──────────▶ CesiumJS (converts to ECEF)
```

**Server-side transformation:**
```sql
-- PostGIS on-the-fly reprojection (CPU-heavy on large datasets)
SELECT ST_Transform(geom, 4326) FROM parcels WHERE tenant_id = $1;

-- Bounding box query in storage CRS (4326)
SELECT * FROM parcels
WHERE geom && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326);
```

**Client-side reprojection (proj4js):**
```typescript
import proj4 from 'proj4';

// Pre-load South African definitions
proj4.defs('EPSG:22279', '+proj=tmerc +lat_0=0 +lon_0=19 ...');
proj4.defs('EPSG:2053',  '+proj=tmerc ...');

// Transform Lo19 → WGS84
const [lng, lat] = proj4('EPSG:22279', 'EPSG:4326', [xLocal, yLocal]);
```

### 1.3 CRS Auto-Detection Pipeline

```
File upload received
  ↓
Check for CRS metadata:
  ├── .prj file (Shapefile) → parse WKT projection string
  ├── GeoTIFF header       → read TIFF GeoKeys (EPSG code or WKT)
  ├── GeoPackage           → read gpkg_spatial_ref_sys table
  ├── GeoJSON              → assume EPSG:4326 (RFC 7946 default)
  └── No CRS detected      → prompt user + show common list
  ↓
proj4js: transform all coordinates to EPSG:4326
  ↓
PostGIS: store as geometry(*, 4326)
  ↓
Martin / GeoJSON API: serve in 4326 → MapLibre renders in 3857
```

**Pre-loaded South African EPSG definitions:**  
`2046`, `2048`, `4148`, `22234`, `22279`, `2053`

### 1.4 CRS Mixing Warnings & Rules

| Rule | Description | Source |
|------|-------------|--------|
| **Never mix CRS without reprojection** | Explicit ST_Transform required; implicit mixing causes drift | CLAUDE.md Rule / 01_PostGIS |
| **Spatial accuracy target** | Coordinate drift < 0.00001° during EPSG:2053 → 4326 conversion | technical_spec |
| **GeoJSON always 4326** | RFC 7946 removed CRS field; coordinates must be WGS84 | gis-file-formats-research |
| **Shapefile without .prj** | Default to EPSG:4326 with user warning | GIS_MASTER_CONTEXT §7.4 |
| **CesiumJS CRS** | CesiumJS handles ECEF internally; feed WGS84 lat/lon/alt | spatialintelligence-research §5.3 |
| **`ST_Transform` performance** | On-the-fly transform of massive datasets is CPU-heavy; prefer pre-stored 4326 | 01_PostGIS |

---

## 2. Geospatial Primitives

### 2.1 Geometry Types

| Type | PostGIS Keyword | capegis Use Case | Source |
|------|----------------|-----------------|--------|
| Point | `geometry(Point, 4326)` | Aircraft positions, CCTV cameras, landmarks, OSINT events | GIS_MASTER_CONTEXT §8, spatialintelligence |
| LineString | `geometry(LineString, 4326)` | Road networks, flight trajectories, coastlines | GIS_MASTER_CONTEXT §8 |
| Polygon | `geometry(Polygon, 4326)` | Cadastral parcels, zoning areas, suburb boundaries | 01_PostGIS, technical_spec |
| MultiPolygon | `geometry(MultiPolygon, 4326)` | Complex municipal boundaries, disjoint zones | 01_PostGIS |
| GeometryCollection | `geometry(GeometryCollection, 4326)` | Mixed-type uploads (e.g., GeoPackage with multiple layer types) | gis-file-formats-research |
| PointZ / Point3D | `geometry(PointZ, 4326)` | Aircraft positions with altitude, satellite orbital points | GIS_MASTER_CONTEXT §8 |
| Raster | `raster` (postgis_raster) | DEM terrain, NDVI rasters — **opt-in only**, not default enabled | 01_PostGIS |

**GeoJSON feature types supported in MapLibre:**
- `Point`, `MultiPoint`, `LineString`, `MultiLineString`, `Polygon`, `MultiPolygon`, `GeometryCollection`

### 2.2 Spatial Operations

#### Core Topology (GEOS-powered)

| Function | Purpose | capegis Query Example | Source |
|----------|---------|----------------------|--------|
| `ST_Intersects(a, b)` | True if geometries share any space | "Find all zoning polygons overlapping this parcel" | 01_PostGIS |
| `ST_DWithin(a, b, dist)` | True if geometries are within distance | "Properties within 500m of informal trading bay" | 01_PostGIS |
| `ST_Buffer(geom, radius)` | Create buffer polygon | "500m exclusion zone around heritage site" | 01_PostGIS |
| `ST_Contains(a, b)` | True if a fully contains b | "Is this point within a flood risk zone?" | GIS_MASTER_CONTEXT §8 |
| `ST_Within(a, b)` | True if a is fully within b | "Is this parcel within Cape Town Metro?" | GIS_MASTER_CONTEXT §8 |
| `ST_Overlaps(a, b)` | True if geometries overlap but neither contains | Partial zone overlaps | gis-platform-synthesis |
| `ST_Union(geom)` | Dissolve/merge geometries | Aggregating suburb boundaries | gis-platform-synthesis |
| `ST_Difference(a, b)` | Subtract geometry b from a | Compute non-flood areas within a zone | gis-platform-synthesis |
| `&&` operator | Bounding box intersection (fast pre-filter) | Viewport bbox queries | 01_PostGIS |

#### Bounding Box & Viewport

```sql
-- Fast viewport bbox query (uses GiST index)
WHERE geom && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
  AND ST_Intersects(geom, ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326))
```

#### Proximity & Distance

```sql
-- Properties within 500m of a point (uses index)
SELECT * FROM parcels
WHERE ST_DWithin(
  geom::geography,
  ST_SetSRID(ST_MakePoint(-33.9249, 18.4241), 4326)::geography,
  500  -- metres (geography type enables metric distance)
);
```

#### Tile Generation

```sql
-- Direct MVT tile generation from PostGIS (consumed by Martin)
SELECT ST_AsMVT(tile_data, 'parcels', 4096, 'geom')
FROM (
  SELECT id, erf_number, zoning,
         ST_AsMVTGeom(geom, ST_TileEnvelope(z, x, y), 4096, 256, true) AS geom
  FROM parcels
  WHERE geom && ST_TileEnvelope(z, x, y)
) AS tile_data;
```

### 2.3 Indexing Strategies

| Index Type | Use Case | Creation | Performance Impact | Source |
|-----------|---------|----------|-------------------|--------|
| **GiST (primary)** | All spatial column queries | `CREATE INDEX ON parcels USING GIST(geom);` | Extremely high — scales to billions of rows when clustered | 01_PostGIS |
| **GiST (geography)** | Metric distance queries (ST_DWithin with geography) | `CREATE INDEX ON parcels USING GIST(geom::geography);` | Required for accurate metric proximity | 01_PostGIS |
| **BRIN** | Time-ordered append-only data (e.g., aircraft tracks, audit logs) | `CREATE INDEX ON flight_positions USING BRIN(recorded_at);` | Low storage, fast for sequential scan | gis-platform-synthesis |
| **B-tree** | Attribute filtering (tenant_id, erf_number, zoning_code) | `CREATE INDEX ON parcels (tenant_id, zoning_code);` | Standard for equality/range filters combined with spatial | gis-platform-synthesis |
| **Partial GiST** | Tenant-filtered spatial queries | `CREATE INDEX ON parcels USING GIST(geom) WHERE is_public = true;` | Smaller index; faster for common subset | technical_arch |

**Clustering note:** Clustering on GiST index improves cache locality for viewport queries:
```sql
CLUSTER parcels USING parcels_geom_idx;
```

### 2.4 PostGIS Underlying Libraries

| Library | Role | Version Notes |
|---------|------|---------------|
| **GEOS** | Topological operations (intersections, buffers, overlaps) | Bundled with PostGIS; handles ST_Intersects, ST_Buffer, ST_Union |
| **PROJ** | CRS transformation (EPSG lookup, WKT parsing) | PROJ 9.x in PostGIS 3.x; handles ST_Transform |
| **GDAL** | Raster/vector format translation | opt-in via `postgis_raster`; not enabled by default in capegis |

---

## 3. Vector Tile Formats & Protocols

### 3.1 Format Comparison

| Format | Description | Use in capegis | TRL | Source |
|--------|-------------|----------------|-----|--------|
| **MVT** (Mapbox Vector Tiles) | Binary PBF tiles; served per `{z}/{x}/{y}` | **Primary** tile format from Martin; consumed by MapLibre | 9 | 03_MapServer, 01_PostGIS |
| **PMTiles** | Single-file archive of MVT tiles (HTTP range reads) | **Offline** use via PWA service worker; replaces MBTiles for web | 8 | technical_arch, gis-platform-synthesis |
| **MBTiles** | SQLite container of tiles | Legacy; replaced by PMTiles for cloud/PWA | 7 | gis-platform-synthesis |
| **MLT** (MapLibre Tile) | Next-gen format from MapLibre ecosystem (2026) | Future consideration; monitor adoption | 5 | 04_Web_Mapping |
| **WMS** (Web Map Service) | OGC raster image tiles | **Consumption only** — City of Cape Town serves WMS; capegis consumes, not hosts | 9 | 03_MapServer, technical_arch |
| **WMTS** | OGC tiled WMS | Consumption from government sources | 9 | 04_Web_Mapping |
| **3D Tiles** (Cesium) | Hierarchical 3D tile format for CesiumJS | Point clouds, photorealistic city models, 3DGS scenes | 9 | GIS_MASTER_CONTEXT §7.2 |

### 3.2 Tile Server Patterns

#### Martin (Primary Recommendation)

| Property | Detail |
|----------|--------|
| **Language** | Rust |
| **Deployment** | Docker container on DigitalOcean Droplet |
| **Input** | PostGIS connection string → auto-discovers tables and functions |
| **Output** | `/{schema}.{table}/{z}/{x}/{y}.pbf` |
| **Performance** | Blazingly fast; minimal CPU/RAM overhead |
| **MVT generation** | Via PostGIS `ST_AsMVT` function |
| **Feature count trigger** | Activate Martin when GeoJSON exceeds **10,000 features** per client layer |
| **Recommendation** | ✅ **Use immediately** — TRL 9 | 

```typescript
// MapLibre consuming Martin MVT tiles
map.addSource('zoning-tiles', {
  type: 'vector',
  tiles: ['https://tiles.capegis.com/public.zoning/{z}/{x}/{y}.pbf'],
  minzoom: 10,
  maxzoom: 18
});
map.addLayer({
  id: 'zoning-fill',
  type: 'fill',
  source: 'zoning-tiles',
  'source-layer': 'public.zoning',
  paint: { 'fill-color': ['get', 'color_code'], 'fill-opacity': 0.6 }
});
```

#### pg_tileserv

| Property | Detail |
|----------|--------|
| **Status** | Entering maintenance phase vs. active Martin development (2025/2026) |
| **Recommendation** | ⚠️ Not preferred — Martin is the active choice |

#### GeoServer / MapServer

| Property | Detail |
|----------|--------|
| **GeoServer** | Java; GUI admin; WFS-T; heavy JVM overhead for SaaS MVP |
| **MapServer** | C-based; excellent server-side WMS rendering; not suited for MVT-first architecture |
| **Recommendation** | ❌ Reject for capegis primary tile serving; consume CoCT's WMS endpoints instead |

### 3.3 Zoom Level Strategies

| Layer | Min Zoom | Max Zoom | Notes |
|-------|----------|----------|-------|
| Basemap (CARTO Dark) | 0 | 22 | Always visible |
| Suburb boundaries | 8 | 22 | Province-level overview |
| Zoning overlay | 10 | 22 | Activate at city scale |
| **Cadastral parcels** | **14** | **22** | **Rule: zoom ≥ 14 only** (CLAUDE.md) |
| Property detail labels | 16 | 22 | Fine-grained label density |
| Aircraft icons | 6 | 22 | OpenSky real-time layer |
| Satellite orbital paths | 0 | 22 | CelesTrak — always visible |

**Viewport buffer:** 20% beyond visible bounds for pre-fetching tiles (CLAUDE.md).

**PMTiles offline zoom range:**  
Khayelitsha ward cache: Zoom 14–18 for basemap + Zoom 14–18 for parcel data.

### 3.4 URL Patterns

```
Martin tile endpoint:    https://tiles.capegis.com/{schema}.{table}/{z}/{x}/{y}.pbf
PMTiles (Supabase):      https://storage.capegis.com/{tenantId}/{dataset}.pmtiles
Style optimization:      https://tiles.capegis.com/style.json?optimize=true
CoCT WMS consumption:    https://citymaps.capetown.gov.za/agsext1/rest/services/.../MapServer/{layerId}
```

---

## 4. Data Formats Supported

### 4.1 Vector Formats

| Format | Extension | Browser-Parseable | Server-Side | MapLibre Path | CesiumJS Path | Recommended Library | Size Limit (client) |
|--------|-----------|-------------------|-------------|--------------|--------------|--------------------|--------------------|
| **GeoJSON** | `.geojson` | ✅ Native JSON | ✅ | Native source | `GeoJsonDataSource` | Native | < 10,000 features |
| **Shapefile** | `.shp` + `.dbf` + `.prj` + `.shx` | ✅ | ✅ GDAL | Via GeoJSON | Via GeoJSON | `shpjs` (77K downloads/wk) | < 50 MB |
| **GeoPackage** | `.gpkg` | ✅ | ✅ GDAL | Via GeoJSON | Via GeoJSON | `@ngageoint/geopackage` (NGA) | Server preferred |
| **KML / KMZ** | `.kml` / `.kmz` | ✅ | ✅ GDAL | Via GeoJSON | `KmlDataSource` (native) | `@tmcw/togeojson` (122K downloads/wk) | < 50 MB |
| **File Geodatabase** | `.gdb` (folder) | ⚠️ (unmaintained `fileGDB.js`) | ✅ GDAL `OpenFileGDB` | Via GeoJSON | Via GeoJSON | Server-only: `ogr2ogr` | **Server only** |
| **WKT / WKB** | `.wkt` | ✅ | ✅ PostGIS | Via GeoJSON | Via GeoJSON | `wellknown`, `wkx` | Small |
| **CSV (lat/lon)** | `.csv` | ✅ | ✅ | Via GeoJSON conversion | Via GeoJSON | `Papa Parse` | < 50 MB |
| **FlatGeobuf** | `.fgb` | ✅ | ✅ | Progressive | — | `flatgeobuf` | Large; streaming |
| **NetCDF** | `.nc` | ✅ | ✅ | Custom raster layer | Custom imagery layer | `netcdfjs` | Time-series climate |

**GDAL server-side conversion command:**
```bash
# Convert any vector format to GeoJSON in EPSG:4326
ogr2ogr -f GeoJSON output.geojson input.gdb layer_name -t_srs EPSG:4326
```

### 4.2 Project Formats (Read-Only Metadata Extraction)

| Format | Extension | What to Extract | What NOT to Attempt | Tool |
|--------|-----------|----------------|---------------------|------|
| **QGIS Project** | `.qgz` / `.qgs` | Layer names, data source paths, CRS (authid), symbology rules | Do NOT render the project | XML parse `.qgs`; unzip `.qgz` first |
| **ArcMap Project** | `.mxd` | Nothing without arcpy | Parsing binary format | Requires ArcGIS Desktop license |
| **ArcGIS Pro Project** | `.aprx` | Limited XML metadata (map names, CRS) from unzipped XML | Layer definitions in binary | Unzip + XML parse |
| **Layer File** | `.lyr` / `.lyrx` | Symbology (JSON-based `.lyrx`) | Geometry — no geometry here | JSON parse `.lyrx` |

**QGIS XML structure example:**
```xml
<maplayer type="vector" geometry="Polygon">
  <datasource>./data/suburbs.shp</datasource>
  <srs><spatialrefsys><authid>EPSG:4326</authid></spatialrefsys></srs>
  <renderer-v2 type="singleSymbol">...</renderer-v2>
</maplayer>
```

### 4.3 Raster Formats

| Format | Extension | Browser Support | CesiumJS Path | Library | Notes |
|--------|-----------|----------------|--------------|---------|-------|
| **GeoTIFF** | `.tif` / `.tiff` | ✅ `geotiff.js` | `SingleTileImageryProvider` | `geotiff` (50K downloads/wk) | CRS in GeoKeys |
| **Cloud-Optimised GeoTIFF (COG)** | `.tif` | ✅ HTTP range reads | `TileCoordinatesImageryProvider` | `geotiff.js`, `@cogeotiff/core` (LINZ) | Preferred raster format |
| **ASCII Raster** | `.asc` | ✅ Custom parser | Via GeoTIFF conversion | Custom | Simple text grid |

**GDAL COG conversion:**
```bash
gdal_translate -of COG -co COMPRESS=DEFLATE input.tif output_cog.tif
```

**MapLibre raster integration (via server tiles):**
```typescript
map.addSource('dem-tiles', {
  type: 'raster',
  tiles: ['https://tiles.capegis.com/terrain/{z}/{x}/{y}.png'],
  tileSize: 256
});
```

### 4.4 3D Formats

| Format | Description | CesiumJS Support | capegis Use Case | Source |
|--------|-------------|-----------------|-----------------|--------|
| **3D Tiles** (`.3dtiles`) | Hierarchical LOD tile format; OGC standard | ✅ Native `Cesium3DTileset` | Photorealistic city models (Google), point clouds | GIS_MASTER_CONTEXT §7, gis-platform-synthesis |
| **Google Photorealistic 3D Tiles** | Google Maps API — volumetric city mesh | ✅ Via Google Maps Tiles API | Foundation 3D layer for Cape Town (verify Cape Town coverage) | spatialintelligence-research |
| **glTF** | Khronos open 3D format | ✅ | Reconstructed scenes, urban models | GIS_MASTER_CONTEXT §7.2 |
| **glTF + KHR_gaussian_splatting** | Gaussian Splat extension (Feb 2026 RC) | ✅ CesiumJS 1.134+ | Primary 3DGS export path from Nerfstudio Splatfacto | GIS_MASTER_CONTEXT §7.2 |
| **PLY** (`.ply`) | Point cloud / Gaussian Splat raw format | ✅ (via conversion) | Fallback when KHR_gaussian_splatting not ratified | GIS_MASTER_CONTEXT §7.2 |
| **CZML** | CesiumJS time-dynamic entity format | ✅ Native | Aircraft trajectories, satellite orbits (time-dynamic) | GIS_MASTER_CONTEXT §8 |

### 4.5 Point Cloud Formats

| Format | Extension | Browser | Server | CesiumJS Path | Notes |
|--------|-----------|---------|--------|--------------|-------|
| **LAS** | `.las` | ✅ `@loaders.gl/las` | ✅ PDAL/laspy | Via 3D Tiles | Uncompressed; large |
| **LAZ** (compressed) | `.laz` | ⚠️ WASM decoder | ✅ PDAL/laszip | Via 3D Tiles | Compress LAS to LAZ first |

**Point cloud pipeline:** LAZ → PDAL → 3D Tiles → Cesium ion → CesiumJS `Cesium3DTileset`

### 4.6 Remote Sensing / Satellite Formats

| Format | Source | capegis Use Case | Processing | Source Document |
|--------|--------|-----------------|------------|----------------|
| **Sentinel-2** (GeoTIFF bands) | ESA Copernicus | NDVI, land classification, flood/fire detection | GDAL → COG → serve | GIS_MASTER_CONTEXT §11 |
| **FIRMS** (fire data) | NASA | Fire risk overlay, wildfire event reconstruction | API fetch → GeoJSON | GIS_MASTER_CONTEXT §11 |
| **USGS** (earthquake) | USGS | Seismic event data | API fetch → GeoJSON | GIS_MASTER_CONTEXT §8 |
| **AIS maritime** | Marine Traffic / AIS networks | Port of Cape Town ship tracking | API poll → CZML | spatialintelligence-research |

---

## 5. Spatial Analysis Primitives

### 5.1 Viewport Culling & Bounding Box Queries

**Cape Town canonical bounding box:**
```json
{ "west": 18.0, "south": -34.5, "east": 19.5, "north": -33.0 }
```

This bbox is used as:
- Validation gate for uploaded files (reject geometries outside)
- Filter for OpenSky API queries
- LLM coordinate validation in NL-to-spatial copilot
- Geographic scope boundary for all data operations

**PostGIS viewport query pattern:**
```sql
-- Function for Next.js Server Component RPC
CREATE OR REPLACE FUNCTION get_parcels_in_bbox(
  min_lng float, min_lat float, max_lng float, max_lat float
)
RETURNS jsonb AS $$
  SELECT jsonb_build_object(
    'type', 'FeatureCollection',
    'features', jsonb_agg(ST_AsGeoJSON(t.*)::jsonb)
  )
  FROM (
    SELECT id, erf_number, geom
    FROM parcels
    WHERE geom && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
      AND geom && ST_MakeEnvelope(18.0, -34.5, 19.5, -33.0, 4326) -- Cape Town gate
    -- RLS applies automatically with user JWT
  ) AS t;
$$ LANGUAGE sql;
```

**Viewport buffer:** Fetch 20% beyond visible map bounds for pre-loading. Use `ST_Expand(viewport_bbox, buffer_degrees)`.

### 5.2 Proximity Analysis

| Operation | PostGIS Function | Example Use Case |
|-----------|----------------|-----------------|
| Point in polygon | `ST_Contains(zone, point)` | "Is this parcel in a flood risk zone?" |
| Distance to feature | `ST_Distance(a::geography, b::geography)` | Distance in metres between two properties |
| Within radius | `ST_DWithin(a::geography, b::geography, radius_m)` | "Properties within 500m of General Business zoning" |
| Nearest N | `ORDER BY geom <-> target_geom LIMIT N` | Nearest 5 bus stops to a property |
| Buffer zone | `ST_Buffer(geom::geography, 500)::geometry` | 500m exclusion zone analysis |

**Note:** Cast to `geography` type for accurate metric distance; avoids degree-based approximations.

### 5.3 Routing (pgRouting)

| Function | Use Case | Status in capegis |
|----------|---------|-----------------|
| `pgr_dijkstra()` | Shortest path between nodes | Planned — NL-to-spatial copilot tools |
| `pgr_drivingDistance()` | Isochrone generation | Planned — accessibility analysis |
| `pgr_TSP()` | Travelling salesman / route optimisation | Future — logistics domain |

**pgRouting is a research gap** (mentioned in synthesis §7.3); not yet implemented. Requires road network topology in PostGIS.

### 5.4 Raster Analysis

| Analysis | Tool | capegis Application |
|----------|------|-------------------|
| **NDVI** (Normalized Difference Vegetation Index) | `(NIR - Red) / (NIR + Red)` via GDAL/rasterio | Sentinel-2 bands → crop health, drought detection (Farmer domain) |
| **Change detection** | Band differencing between temporal rasters | Deforestation, flood inundation mapping |
| **Flood risk classification** | Raster reclassification | Western Cape Government Hazard Raster services |
| **Land use classification** | ControlNet-seg conditioning | Semantic mask for 3DGS reconstruction |
| **DEM terrain** | GeoTIFF → `postgis_raster` or Cesium terrain | Topography for MapLibre terrain, CesiumJS hillshading |

**PostGIS raster status:** `postgis_raster` is opt-in, not enabled by default. Enable only for explicit raster processing needs (e.g., Western Cape Hazard Rasters).

### 5.5 Real-Time Data Fusion Patterns

Derived from WorldView (spatialintelligence-research.md §2.1) and OpenSky integration:

| Data Category | Freshness | Fetch Pattern | Cache Layer | capegis Layer |
|---------------|-----------|--------------|------------|--------------|
| Aircraft (OpenSky ADS-B) | Near real-time (~10–30s) | Server-side poll → SSE fan-out | `api_cache` table | Flight tracking (MapLibre icons + CZML) |
| Satellite orbits (CelesTrak TLE) | Periodic (minutes) | Scheduled fetch → compute orbital path | Supabase table | Orbital arc layer (CesiumJS) |
| Maritime AIS | Real-time (~1–5 min) | API poll | `api_cache` | Port of Cape Town layer (future M13+) |
| Fire alerts (NASA FIRMS) | Near real-time | Webhook / poll | `api_cache` | Fire risk overlay (Emergency domain) |
| Weather / load shedding | Periodic | API poll | `api_cache` | Risk overlay (planned) |

**Three-tier fallback (mandatory for all external data):**
```
LIVE (API poll) → CACHED (Supabase api_cache) → MOCK (public/mock/*.geojson)
```

### 5.6 Temporal / 4D Analysis

| Pattern | Description | capegis Implementation |
|---------|-------------|----------------------|
| **Temporal scrubbing** | Time slider through historical data | CesiumJS CZML clock + interval system; 4D event replay |
| **Property valuation timeline** | GV Roll history over years | Attribute-based temporal filter + UI time slider |
| **Construction progress** | Monthly Street View archive comparison | Google Street View temporal API (Urban Planner domain) |
| **4D event reconstruction** | 3DGS + CZML with time-tagged entities | WorldView pattern — aircraft + events on timeline |
| **Change detection** | Before/after satellite imagery comparison | Sentinel-2 temporal band differencing |

### 5.7 Feature-State Pattern (MapLibre Performance)

For rapid UI feedback (hover highlights, selection) without re-parsing geometry:
```typescript
// Hover highlight without re-rendering geometry
map.setFeatureState(
  { source: 'parcels', sourceLayer: 'public.parcels', id: hoveredParcelId },
  { hover: true }
);
// Paint property reads feature-state
paint: { 'fill-color': ['case', ['boolean', ['feature-state', 'hover'], false], '#ff0', '#ccc'] }
```

---

## 6. Layer Architecture Rules

### 6.1 Z-Order Convention (Bottom → Top)

From CLAUDE.md and synthesis reports:

```
Layer Order (top = rendered above all others)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  7.  User draw / annotations       (top — always above data)
  6.  Risk overlays (flood/fire)
  5.  Zoning classification
  4.  Cadastral / parcel outlines
  3.  Suburb / ward boundaries
  2.  Transport / road network
  1.  Basemap (CARTO Dark Matter)   (bottom)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**WorldView-inspired extension (spatialintelligence-research §2.3):**
- Detection overlays sit above all data layers
- Real-time entities (aircraft, ships) sit above static overlays
- Foundation 3D photorealistic layer is below all data

### 6.2 Zoom Gating Rules

| Layer | Zoom Gate | Rationale | Source |
|-------|-----------|-----------|--------|
| **Cadastral parcels** | ≥ 14 | Hundreds of thousands of polygons — browser performance | CLAUDE.md Rule / 03_MapServer |
| Zoning overlay | ≥ 10 | City-scale detail not needed at province level | gis-platform-synthesis |
| Suburb boundaries | ≥ 8 | Province overview starts at 8 | gis-platform-synthesis |
| Property detail labels | ≥ 16 | Text readability threshold | technical_spec |
| Building footprints | ≥ 15 | Not needed below street level | gis-platform-synthesis |

**Every layer must declare minzoom/maxzoom:**
```typescript
map.addLayer({
  id: 'cadastral-parcels',
  type: 'fill',
  source: 'cadastral-tiles',
  'source-layer': 'parcels',
  minzoom: 14,  // REQUIRED — never omit
  maxzoom: 22,
  paint: { 'fill-color': '#3a3a5c', 'fill-opacity': 0.5 }
});
```

### 6.3 Layer Naming Conventions

| Pattern | Example | Applied To |
|---------|---------|-----------|
| `{dataset}-fill` | `cadastral-fill` | Polygon fill layers |
| `{dataset}-outline` | `cadastral-outline` | Polygon stroke/outline |
| `{dataset}-label` | `suburb-label` | Text label layers |
| `{dataset}-icon` | `aircraft-icon` | Point icon layers |
| `{dataset}-line` | `roads-line` | LineString layers |
| `{dataset}-heatmap` | `events-heatmap` | Density heatmap layers |
| `{dataset}-extrusion` | `buildings-extrusion` | 3D fill-extrusion layers |

### 6.4 Feature Count Thresholds

| Threshold | Action | Source |
|-----------|--------|--------|
| < 5,000 features | Safe for GeoJSON in MapLibre | 03_MapServer, 04_Web_Mapping |
| 5,000 – 10,000 features | Acceptable with viewport clipping (ST_MakeEnvelope) | 01_PostGIS |
| > 10,000 features | **Switch to Martin MVT tiles** — mandatory | CLAUDE.md |
| > 10,000 particles | Cap active particles for browser performance | spatialintelligence-research §4.3 |

### 6.5 Attribution Rule

All map instances must display (CLAUDE.md Rule 6):
```
© CARTO | © OpenStreetMap contributors
```

CARTO Dark Matter style URL:
```
https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json
```

MapLibre attribution configuration:
```typescript
<Map
  attributionControl={true}
  customAttribution="© CARTO | © OpenStreetMap contributors"
  mapStyle="https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
/>
```

### 6.6 Performance Optimization Rules

From `technical_specification_findings.md` — Render Time equation:  
`Render Time = C + (S × tₛ) + (L × tₗ) + (V × tᵥ)`

| Optimization | Rule | Impact |
|-------------|------|--------|
| **Layer pruning** | Consolidate related classifications into one layer with data-driven styling | Reduces `L × tₗ` |
| **Zoom filtering** | Use explicit `minzoom`/`maxzoom`, not filter expressions | More performant than complex filters |
| **Feature states** | Use `feature-state` for hover/selection — avoids geometry re-parse | Reduces Layer Update Time |
| **Restrictive filter order** | Put most restrictive filter first (e.g., ward_id before geometry_type) | Reduces filter evaluation cost |
| **Tile optimization** | Append `?optimize=true` to style URLs | Prunes unused features at low zoom |
| **Viewport buffer** | 20% buffer for pre-fetching; reduces visible tile-pop | UX improvement |
| **P95 tile load target** | < 400ms on 10Mbps fibre | technical_specification_findings |

### 6.7 MapLibre Initialization Rules (CLAUDE.md)

| Rule | Implementation |
|------|---------------|
| Initialise MapLibre **once per page** (ref guard) | `if (mapRef.current) return;` |
| Import CSS in `app/layout.tsx` | `import 'maplibre-gl/dist/maplibre-gl.css';` |
| Dynamic import with `ssr: false` | `const Map = dynamic(() => import('./MapComponent'), { ssr: false })` |
| Call `map.remove()` in cleanup | `useEffect(() => () => map.current?.remove(), [])` |
| Use `react-maplibre` (not `react-map-gl`) | Avoids webpack alias complexity |

---

## 7. Data Entity Schema (Palantir-Inspired Ontology)

From GIS_MASTER_CONTEXT.md §8:

### 7.1 Core Entity Types

```typescript
interface UploadedGeoFile {
  id: string;
  tenantId: string;
  filename: string;
  format: GeoFileFormat;           // 'shapefile' | 'geopackage' | 'geojson' | ...
  originalCRS: string | null;      // detected from .prj or metadata
  normalizedCRS: 'EPSG:4326';      // always after reprojection
  featureType: 'point' | 'line' | 'polygon' | 'raster' | 'pointcloud' | 'mixed';
  featureCount: number | null;
  processingStatus: 'pending' | 'processing' | 'ready' | 'failed';
}

type GeoFileFormat =
  | 'shapefile' | 'geopackage' | 'file-geodatabase'
  | 'arcmap-project' | 'arcgis-pro-project'
  | 'qgis-project' | 'geojson' | 'kml' | 'kmz'
  | 'geotiff' | 'cog-geotiff' | 'las' | 'laz'
  | 'netcdf' | 'csv-latlon' | 'wkt';
```

### 7.2 Event Entity (Spatial Trigger)

```typescript
interface Event {
  id: string;                       // "evt_{YYYYMMDD}_{area}_{seq}"
  type: EventType;
  location: GeoJSON.Feature;        // in EPSG:4326
  boundingBox: [minLat, minLon, maxLat, maxLon];
  timeStart: string;                // ISO 8601
  timeEnd: string | null;
  tenantId: string;
  reconstructionAssetId: string | null; // Cesium ion asset ID
}

type EventType =
  | 'aircraft_incident' | 'wildfire' | 'flood' | 'protest'
  | 'infrastructure_failure' | 'crop_damage' | 'environmental_change' | 'other';
```

---

## 8. Quick Reference Summary

### CRS Rules (Non-Negotiable)

```
Store:   EPSG:4326 (WGS84 lat/lon)
Render:  EPSG:3857 (Web Mercator — MapLibre handles internally)
3D:      ECEF (CesiumJS handles internally — feed WGS84)
SA data: Lo19 (EPSG:22279) must be transformed via ST_Transform or proj4
```

### Feature Count Thresholds

```
< 5,000  → GeoJSON directly in MapLibre
≤ 10,000 → GeoJSON with viewport clipping (ST_MakeEnvelope)
> 10,000 → Martin MVT tiles (mandatory)
```

### Spatial Operations Cheat Sheet

```sql
-- Viewport query (fast, uses GiST)
WHERE geom && ST_MakeEnvelope(w, s, e, n, 4326)

-- Proximity (metric, uses geography)
WHERE ST_DWithin(geom::geography, target::geography, 500)

-- CRS transform
ST_Transform(geom, 4326)

-- Tile generation
ST_AsMVT(...) + ST_AsMVTGeom(...)

-- Distance metric
ST_Distance(a::geography, b::geography)  -- returns metres
```

### Layer Z-Order (Top → Bottom)

```
User Draw → Risk Overlays → Zoning → Cadastral → Suburbs → Transport → Basemap
```

### Zoom Gates

```
Cadastral:  zoom ≥ 14 (MANDATORY)
Zoning:     zoom ≥ 10
Suburbs:    zoom ≥ 8
```

---

## ⚠️ Known Unknowns

| Gap | Impact | Action Required |
|-----|--------|----------------|
| **Google 3D Tiles Cape Town coverage** | Blocks CesiumJS 3D strategy | Verify via API test before committing |
| **MapLibre ↔ CesiumJS dual-viewer pattern** | No research covers 2D/3D switching UX | Design pattern needed |
| **pgRouting** for routing/isochrones | Mentioned but not researched | Independent research query |
| **PostGIS raster extension** need | WC Hazard Raster Services | Evaluate whether to enable `postgis_raster` |
| **FlatGeobuf** vs GeoJSON for large vectors | Not evaluated | Consider for streaming large datasets |

---

## References

| Document | Key Contribution |
|----------|----------------|
| `GIS_MASTER_CONTEXT.md` §7–8 | NeRF/3DGS architecture, Palantir entity ontology, CRS auto-detection pipeline |
| `spatialintelligence-research.md` | WorldView multi-sensor fusion, Z-order pattern, 4D temporal model |
| `01_PostGIS_Core_Ecosystem.md` | GiST indexing, spatial operations, GEOS/PROJ/GDAL library details |
| `03_MapServer.md` | Martin tile server, 5K/10K feature thresholds, tile URL patterns |
| `04_Web_Mapping_OpenLayers_Leaflet.md` | MapLibre rendering engine details, performance characteristics |
| `10_MapLibre_NextJS_Integration.md` | SSR dynamic import, react-maplibre, CARTO style URL |
| `gis-platform-synthesis.md` | Technology readiness matrix, cross-report CRS validation, layer Z-order synthesis |
| `technical_architecture_extensions.md` | RLS patterns, offline PMTiles strategy, ArcGIS REST integration |
| `technical_specification_findings.md` | Performance equation, render time optimization, P95 tile load target |
