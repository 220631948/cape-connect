#!/bin/bash
API_KEY="fc-0604240ce2b0436894b0d61ed17b06b2"
npx firecrawl-cli@1.8.0 search "MapLibre GL JS v5.0 stable version source-layer vector tile martin tilejson pattern" --limit 3 --scrape -o .firecrawl/search-maplibre.json --json --api-key $API_KEY &
npx firecrawl-cli@1.8.0 search "CARTO free student tier developer grant program 2026 application timeline" --limit 3 --scrape -o .firecrawl/search-carto.json --json --api-key $API_KEY &
npx firecrawl-cli@1.8.0 search "Google Earth Engine April 27 2026 quota tier deadline community tier export compute" --limit 3 --scrape -o .firecrawl/search-gee.json --json --api-key $API_KEY &
npx firecrawl-cli@1.8.0 search "ArcGIS Maps SDK for JavaScript v5.0 release date widget deprecation July 2026 pro expiry" --limit 3 --scrape -o .firecrawl/search-arcgis.json --json --api-key $API_KEY &
npx firecrawl-cli@1.8.0 search "QGIS Server current stable version OGC protocol Docker image Heroku Azure deployment" --limit 3 --scrape -o .firecrawl/search-qgis.json --json --api-key $API_KEY &
npx firecrawl-cli@1.8.0 search "Appwrite spatial PostGIS equivalent Supabase replacement" --limit 3 --scrape -o .firecrawl/search-appwrite.json --json --api-key $API_KEY &
npx firecrawl-cli@1.8.0 search "PMTiles v3 spec version addProtocol API Serwist integration offline" --limit 3 --scrape -o .firecrawl/search-pmtiles.json --json --api-key $API_KEY &
npx firecrawl-cli@1.8.0 search "Cesium ion free tier limits 2026 GPU hosting conversion streaming" --limit 3 --scrape -o .firecrawl/search-cesium.json --json --api-key $API_KEY &
wait
