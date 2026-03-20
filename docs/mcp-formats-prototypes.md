# MCP Examples: Format Prototypes (commands & skeletons)

This document lists minimal, runnable examples (commands and skeleton code) that developers can run locally to inspect and convert spatial files. These are *examples*, not production pipelines.

1) Shapefile (inspect + convert to GeoJSON)
- Command (GDAL):
  ogr2ogr -f GeoJSON output.json input.shp
- Node (sketch):
  // npm install shapefile
  const shapefile = require('shapefile');
  shapefile.open('input.shp')
    .then(source => source.read().then(function log(result){ if (result.done) return; console.log(result.value); return source.read().then(log); }))

2) GeoPackage (inspect layers)
- List layers (GDAL):
  ogrinfo -al -so input.gpkg
- Convert layer to GeoJSON:
  ogr2ogr -f GeoJSON layer.json input.gpkg layername

3) GeoTIFF (inspect and convert to tiles)
- Inspect: gdalinfo input.tif
- Convert to tiles (gdal2tiles or gdal_translate + gdalwarp) recommended for large rasters.
- Client: use geotiff.js for small rasters in browser.

4) LAS/LAZ (point cloud)
- Convert to 3D Tiles via PDAL / entwine:
  pdal translate input.laz output.laz writer=entwine
  # then use entwine to build a Potree/entwine bundle, or convert to 3D Tiles for Cesium

5) File Geodatabase (.gdb)
- Export with ogr2ogr:
  ogr2ogr -f GPKG output.gpkg input.gdb

6) KML/KMZ
- Convert to GeoJSON:
  ogr2ogr -f GeoJSON output.json input.kml

Scripting notes:
- Prefer server-side conversion for large files and locked formats.
- Provide small sample datasets in `public/mock/` for UI development and CI tests.
