# DATA CATALOG — CapeTown GIS Hub

## Verified Sources

### 1. General Valuation Roll 2022
* **Source:** odp.capetown.gov.za
* **Format:** CSV + PDF
* **Status:** VERIFIED (CSV ready, GLM-OCR local setup planned if needed)

### 2. City ArcGIS Endpoint
* **Source:** `https://citymaps.capetown.gov.za/agsext1/rest/services?f=json`
* **Status:** VERIFIED (HTTP 200 open access confirmed)

### 3. CARTO Tiles
* **Source:** carto.com
* **Status:** VERIFIED (Commercial use permitted, need attribution)

## Satellite Imagery Sources (Phase 1 MVP)

### Copernicus Sentinel-2
* **URL:** https://scihub.copernicus.eu (or via GEE / Copernicus Data Space)
* **Data:** Sentinel-1 (SAR radar), Sentinel-2 (10m optical)
* **Free:** Yes — EU Copernicus programme, fully open
* **Best for:** LULC classification (10m resolution), NDVI, urban mapping
* **Cape Town:** Excellent coverage, ~5-day revisit time
* **Status:** VERIFIED FOR MVP

### OpenAerialMap
* **URL:** https://openaerialmap.org
* **Data:** Crowdsourced aerial imagery, high resolution
* **Free:** Yes — CC BY licence
* **Best for:** Informal settlement mapping where commercial imagery is unavailable
* **Status:** PENDING VERIFICATION of Cape Town coverage

### OpenTopography
* **URL:** https://opentopography.org
* **Data:** LiDAR point clouds, DEMs (SRTM, Copernicus DEM 30m)
* **Free:** Yes (academic); some datasets require registration
* **Best for:** Terrain analysis for drainage planning, flood modelling, slope analysis
* **Status:** LOGGED

### WorldClim
* **URL:** https://www.worldclim.org
* **Data:** Global climate data, precipitation, temperature
* **Free:** Yes (CC BY)
* **Best for:** Climate context layers for environmental planning overlays
* **Status:** LOGGED
