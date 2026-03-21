# GIS_SUPERSTACK_01_GEO_FORMATS

This document is a technology matrix for common geospatial interchange and storage formats used in the CapeTown GIS Hub (capegis). It is written by Unit 01: GIS_SUPERSTACK_01_GEO_FORMATS researcher and is intended as a reference for engineering teams. It follows the project constraints in CLAUDE.md (no API keys in source, EPSG rules, three-tier fallback, etc.).

Geographic scope: Cape Town + Western Cape Province only. Always verify source bounding boxes match the canonical project bbox: { west: 18.0, south: -34.5, east: 19.5, north: -33.0 } and initial centre { lng: 18.4241, lat: -33.9249 }.

POPIA note: This document does not contain or prescribe handling of personal data. Any operational guidance that touches PII must include a POPIA ANNOTATION in the consuming code as required by CLAUDE.md.

---

Guidance summary (quick):
- Always prefer vector tile formats (PMTiles / MVT) for client rendering at scale in MapLibre.
- Use GeoPackage or PostGIS for server-side canonical storage when features are larger than small GeoJSONs.
- Maintain Three-Tier Fallback: LIVE → CACHED (Supabase api_cache) → MOCK (public/mock/*.geojson).
- Do not hardcode credentials; use env vars only.


### GeoJSON
[GeoJSON v1.0] – https://geojson.org

GeoJSON is the lingua franca for lightweight feature interchange (points, lines, polygons, FeatureCollections). It is human-readable, widely supported, and ideal for small datasets and mock data in the repo's public/mock/*.geojson.

Example usage (Python):
```python
import json
with open('public/mock/cape_town_suburbs.geojson') as f:
    data = json.load(f)
# iterate features
for feat in data['features']:
    print(feat['properties'].get('name'))
```

CLI conversion (ogr2ogr):
```bash
ogr2ogr -f GeoJSON -t_srs EPSG:4326 suburbs.geojson suburbs.gpkg
```

Rollback / fallback note: If GeoJSON is too large (>10k features for client), fallback to PMTiles/MVT server-side tiles or produce a cached simplified GeoJSON. For map rendering, respect the 10,000 feature client limit in CLAUDE.md.


### GeoPackage
[GeoPackage v1.2] – https://www.geopackage.org

GeoPackage (GPKG) is an SQLite container for vector and raster geospatial data. It is ideal for portable, single-file datasets (offline sync, exports) and supports spatial indexes.

Example usage (ogr2ogr):
```bash
ogr2ogr -f GPKG city_data.gpkg PG:host=localhost user=postgres dbname=capegis "-nln city_suburbs"
```

Python (fiona):
```python
import fiona
with fiona.open('city_data.gpkg', layer='city_suburbs') as src:
    for feat in src:
        print(feat['properties']['id'])
```

Rollback / fallback note: If a client cannot open GeoPackage (e.g., older mobile environments), export a GeoJSON fallback into public/mock/ and use cached Supabase api_cache copies. GeoPackage may require additional native libs (GDAL/sqlcipher) in constrained environments.


### Shapefile
[Shapefile v1.0] – https://gdal.org/drivers/vector/shapefile.html

Shapefile (ESRI) is a legacy multi-file vector format (.shp, .shx, .dbf). Still ubiquitous for data exchange with municipal partners but limited by attribute name length and multi-file fragility.

Conversion (ogr2ogr):
```bash
ogr2ogr -f "ESRI Shapefile" parcels_shp/ parcels.geojson
```

Read in Python (pyshp / shapefile):
```python
import shapefile
r = shapefile.Reader('parcels_shp/parcels.shp')
for rec in r.records():
    print(rec)
```

Rollback / fallback note: When shapefile transfers fail (missing sidecar files), request an alternative (GeoPackage or GeoJSON). Always validate the .dbf encoding and attribute truncation; if attributes were truncated, ask for a GPKG export to preserve metadata.


### PMTiles
[PMTiles v1.0] – https://pmtiles.org

PMTiles is a single-file packaging format for vector (and raster) tiles optimized for distribution (HTTP range requests friendly). PMTiles is the approved offline tiles format for this project (see CLAUDE.md: Offline tiles: PMTiles).

Creating PMTiles with pmtiles-cli / tippecanoe workflow (example):
```bash
# generate mbtiles first (tippecanoe), then convert to pmtiles
tippecanoe -o suburbs.mbtiles -z12 -Z6 suburbs.geojson
pmtiles convert suburbs.mbtiles suburbs.pmtiles
```

Usage in MapLibre (client):
```js
map.addSource('suburbs', {
  type: 'vector',
  url: 'https://cdn.example.com/tiles/suburbs.pmtiles'
});
```

Rollback / fallback note: If PMTiles cannot be served, fall back to MBTiles hosted on server (Martin or Supabase storage) or to cached GeoJSON endpoints. PMTiles is the preferred route — no PLAN_DEVIATION required.


### MBTiles
[MBTiles v1.3] – https://github.com/mapbox/mbtiles-spec

MBTiles is a SQLite container for tiles (raster or vector). It is commonly produced by Tippecanoe for vector tiles. The project prefers PMTiles, but MBTiles is still widely used in server workflows.

Produce MBTiles with tippecanoe:
```bash
tippecanoe -o capetown.mbtiles -zg --drop-oldest-as-needed capetown.geojson
```

Serve MBTiles (example using mbtiles-server):
```bash
mbtiles-server serve capetown.mbtiles --port tileserver
```

Rollback / fallback note: Because CLAUDE.md prefers PMTiles, using MBTiles constitutes an operational deviation if proposed as the canonical serving format. Include callout when proposing MBTiles for production.

> ⚠️ PLAN_DEVIATION required: MBTiles is not the primary tile format in CLAUDE.md (PMTiles is). If MBTiles are proposed for production tile serving, document migration to PMTiles in docs/PLAN_DEVIATIONS.md and justify (e.g., existing tooling, cost of conversion).


### FlatGeobuf
[FlatGeobuf v1.0] – https://github.com/bjornharrtell/flatgeobuf

FlatGeobuf is a compact binary spatial format based on FlatBuffers with fast random access. It is suitable for large vector files and streaming. It is not listed in CLAUDE.md and therefore should be evaluated before adoption.

Create FlatGeobuf (ogr2ogr):
```bash
ogr2ogr -f FlatGeobuf output.fgb input.geojson
```

Read with node (flatgeobuf):
```js
import { deserialize } from 'flatgeobuf';
// stream/deserialize usage here
```

Rollback / fallback note: If platform lacks FlatGeobuf support, export GeoJSON or GeoPackage and use cached copies. FlatGeobuf introduces a new runtime dependency.

> ⚠️ PLAN_DEVIATION required: FlatGeobuf is not on the approved stack in CLAUDE.md; adding it requires documenting reasons in docs/PLAN_DEVIATIONS.md and approval from maintainers.


### GeoParquet (Parquet + geometry)
[GeoParquet v0.1] – https://github.com/opengeospatial/geoparquet

GeoParquet stores spatial data in columnar Parquet format with geometry columns (WKB/Geometric typed). It is excellent for analytics and large-scale batch processing (analytics pipelines), but not directly consumable by browsers without conversion to tiles.

Example: converting GeoJSON to GeoParquet using geopandas (Python):
```python
import geopandas as gpd
gdf = gpd.read_file('capetown_buildings.geojson')
gdf.to_parquet('capetown_buildings.parquet')
```

Rollback / fallback note: Browsers cannot read Parquet directly; convert GeoParquet to GeoJSON or to vector tiles (MVT/PMTiles) for client use. Adoption requires new analytics tooling (PyArrow, parquet readers).

> ⚠️ PLAN_DEVIATION required: GeoParquet is not documented in CLAUDE.md's approved stack. If proposed for canonical analytics storage, add a PLAN_DEVIATION entry and justify (performance / columnar benefits).


### WKB / WKT (Well-Known Binary / Text)
[WKT/WKB v1.2] – https://www.ogc.org

WKT and WKB are compact representations for single geometry values used in databases and interchange. PostGIS uses WKB/WKT internally and for SQL exchanges. Use these for SQL-level geometry handling.

PostGIS example (WKT to geometry):
```sql
INSERT INTO parcels (tenant_id, geom) VALUES (
  '00000000-0000-0000-0000-000000000000',
  ST_SetSRID(ST_GeomFromText('POLYGON((18.4 -33.9,18.5 -33.9,18.5 -33.8,18.4 -33.8,18.4 -33.9))'), 4326)
);
```

Rollback / fallback note: For web interchange, wrap WKB/WKT into GeoJSON or convert server-side to MVT. WKT is human readable but verbose; WKB is compact but binary.


### TopoJSON
[TopoJSON v3.0] – https://github.com/topojson/topojson

TopoJSON encodes topology to reduce file sizes by storing shared arcs once. It is useful for country/administrative boundary sets where topology reduces redundancy.

Conversion (topojson-client / topojson-server):
```bash
topojson -o suburbs.topojson -- suburbs.geojson
```

Usage (client-side simplification):
```js
import topojson from 'topojson-client';
const geo = topojson.feature(topology, topology.objects.suburbs);
```

Rollback / fallback note: If consumer libraries don't support TopoJSON, convert to GeoJSON before use. TopoJSON is less forgiving for ad-hoc edits because topology operations can be complex to edit manually.


### Mapbox Vector Tiles (MVT) / Protocol Buffers
[MVT v2.1] – https://docs.mapbox.com/vector-tiles/specification/

MVT (Protocol Buffers) is the standard vector tile format for high-performance rendering in MapLibre / Mapbox GL. MVTs are generated by Tippecanoe, Martin, or PostGIS ST_AsMVT.

Produce MVT from PostGIS (example):
```sql
SELECT ST_AsMVT(q, 'layername', 4096, 'geom')
FROM (
  SELECT id, name, ST_Transform(geom, 3857) AS geom
  FROM parcels
  WHERE ST_Intersects(geom, ST_MakeEnvelope(18.0, -34.5, 19.5, -33.0, 4326))
) AS q;
```

Tippecanoe usage to create tiles (mbtiles):
```bash
tippecanoe -o tiles.mbtiles -zg --drop-densest-as-needed data.geojson
```

Rollback / fallback note: Always ensure tiles use EPSG:3857 for rendering in MapLibre. If MVT serving fails, fall back to PMTiles or cached GeoJSON endpoints. Respect CLAUDE.md rule about reprojection: storage EPSG:4326, rendering EPSG:3857.


### KML / GML
[KML v2.3] – https://developers.google.com/kml

KML (Keyhole Markup Language) and GML (Geography Markup Language) are XML-based formats used for GIS interchange in some agencies. KML is useful for Google Earth exports; GML for OGC-compliant complex schemas.

Convert KML to GeoJSON (ogr2ogr):
```bash
ogr2ogr -f GeoJSON output.geojson input.kml
```

Rollback / fallback note: Because KML/GML are XML-based and verbose, prefer GeoPackage or GeoJSON for programmatic integrations. If a partner only provides KML/GML, ingest and convert to canonical server format (PostGIS/GPKG) and cache results.


### CSV + WKT (tabular interchange)
[CSV-WKT v1.0] – https://tools.ietf.org/html/rfc4180

Many legacy datasets are supplied as CSV with WKT geometry columns. This is useful for attribute-centric datasets where geometry is secondary.

Convert CSV (with WKT) to GeoJSON using ogr2ogr:
```bash
ogr2ogr -f GeoJSON output.geojson input.csv -oo GEOM_POSSIBLE_NAMES=geometry -oo KEEP_GEOM_COLUMNS=NO
```

Python parsing example:
```python
import pandas as pd
from shapely import wkt
df = pd.read_csv('addresses.csv')
df['geometry'] = df['wkt_column'].apply(wkt.loads)
```

Rollback / fallback note: Validate coordinate order and CRS when ingesting CSV+WKT. If geometry column missing or malformed, fall back to address geocoding or request a GeoPackage export.


---

Recommendations (operational):
- Client rendering: PMTiles (single-file) with MapLibre, MVT tile layers in EPSG:3857.
- Server canonical storage: PostGIS (EPSG:4326) + exports to GeoPackage for offline exchange.
- Batch analytics: GeoParquet for columnar analytics pipelines (document deviation and justify adoption).
- Legacy partner intake: Support Shapefile and KML, but convert to canonical formats on ingestion and store in PostGIS.

Deviations and approvals: Any format/tool not explicitly listed in CLAUDE.md must be documented in docs/PLAN_DEVIATIONS.md before being adopted (see FlatGeobuf, GeoParquet, MBTiles when used as primary). The document includes inline callouts where appropriate.


Authorship & next steps:
- Add this file to the repo under docs/research/
- Raise a PR with implementation notes and a test plan (see PR body).
