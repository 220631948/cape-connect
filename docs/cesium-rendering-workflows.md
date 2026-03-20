# Cesium Rendering Workflows — Quick recipes

1) GeoJSON → CesiumJS (small vector datasets)
- Use Cesium.GeoJsonDataSource.load('url_or_blob')
- Apply styling and clampToGround/height where required

2) Large vector datasets → PMTiles / Vector Tiles → MapLibre / Cesium
- Produce vector tiles (Tippecanoe or Martin) and serve as PMTiles or via Martin tile server
- Use Cesium/Panorama integration for hybrid vector+3D layers

3) Point Clouds (LAS/LAZ) → 3D Tiles
- Convert with PDAL/entwine or use Cesium 3D Tiles conversion tooling
- Host 3D Tiles on object storage and reference via Cesium3DTileset

4) Raster imagery (GeoTIFF) → Cesium imagery
- Produce tiled imagery (XYZ/WMTS) or use CesiumIon for large imagery

5) 3D Models & photogrammetry → 3D Tiles / 3DGS
- Convert glTF/GLB to 3D Tiles for streaming; for Gaussian Splatting outputs, document ingestion path (3D Tiles or Cesium 3D Tiles)

Notes:
- Keep client-side feature counts low (<=10k). Move to vector tiles / server-side rendering when exceeding limits.
- Ensure DataSourceBadge and attribution (© CARTO | © OpenStreetMap contributors) are present.
