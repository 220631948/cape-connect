// GEE Export Script for Cape Town AOI
// Ensure you have authenticated with ee.Authenticate()

var capeTownAOI = ee.Geometry.Polygon(
  [[[18.3, -34.1],
    [18.6, -34.1],
    [18.6, -33.8],
    [18.3, -33.8],
    [18.3, -34.1]]]
);

// Example: Sentinel-2 Surface Reflectance
var collection = ee.ImageCollection('COPERNICUS/S2_SR')
  .filterBounds(capeTownAOI)
  .filterDate('2024-01-01', '2024-01-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10));

var image = collection.median().clip(capeTownAOI);

// Select RGB bands for visualization or export all needed bands
var exportImage = image.select(['B4', 'B3', 'B2']).float();

Export.image.toCloudStorage({
  image: exportImage,
  description: 'cape-town-s2-export-jan2024',
  bucket: 'YOUR_GCP_BUCKET_NAME', // e.g., 'cape-town-rasters'
  fileNamePrefix: 'sentinel2/cape-town-2024-01',
  scale: 10,
  crs: 'EPSG:4326', // Use WGS84 or 3857 based on frontend requirements
  fileFormat: 'GeoTIFF',
  formatOptions: {
    cloudOptimized: true
  }
});

print("Export task sent to Cloud Storage. Please start the task in the Tasks tab.");
