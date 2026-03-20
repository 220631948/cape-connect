# 11 — Google Maps Platform Overview & Conceptual Comparison (Technical Overview and Comparison)

> **TL;DR:** Google Maps Platform offers robust capabilities (Photorealistic 3D Tiles, Places API, deck.gl integration) but is proprietary and pay-as-you-go. **MapLibre GL JS is the better fit** for our open-source, self-hosted architecture — it provides full data control, no usage costs, and aligns with PostGIS/Martin infrastructure. GMP could supplement with geocoding or Places search if needed.
>
> **Roadmap Relevance:** Reference only — informs M5+ decisions about supplementary geocoding/places features. MapLibre remains the mandatory rendering engine per CLAUDE.md.


## Overview
This report provides an overview of Google Maps Platform (GMP) capabilities for web development, focusing on mapping, data visualization, and general GIS features relevant to a multi-tenant platform. It also offers a conceptual comparison with open-source alternatives like MapLibre GL JS.

## Google Maps Platform Capabilities for Web GIS

### 1. Maps JavaScript API
The core of GMP for web development. It allows for highly customized, interactive 2D and 3D maps.

-   **Features:**
    -   **Map Types:** Road, satellite, hybrid, terrain, and custom maps.
    -   **Customization:** Extensive styling options for roads, geographical features, points of interest, etc. Cloud-based map styling is available.
    -   **Markers & Overlays:** Customizable markers, info windows, polylines, polygons, custom overlays, and ground overlays.
    -   **Data Layers:** Display GeoJSON and other data types directly on the map.
    -   **WebGL Overlay View:** Build rich 3D and 2D experiences on the vector basemap using WebGL.
    -   **3D Maps:** Photorealistic 3D tiles and Aerial View API.
    -   **Controls:** Customizable UI controls (zoom, pan, etc.).
    -   **Events:** React to user interactions and map lifecycle events.
    -   **Localization:** Automatic localization into over 40 languages.
    -   **Performance:** Features like marker clustering and heatmaps for visualizing data density.

-   **Libraries:** Optional libraries (e.g., Drawing, Geometry, Visualization, Places) extend functionality.

### 2. Data Visualization
GMP offers robust solutions for data visualization:

-   **Data Layer:** Directly supports GeoJSON for displaying vector data.
-   **Heatmaps:** Visualize the density of data points.
-   **Marker Clustering:** Group large numbers of markers for a cleaner UI.
-   **deck.gl Integration:** Google actively supports `deck.gl` for advanced WebGL-accelerated data visualizations on top of the Google Maps base map. This allows for complex layer-based rendering of geospatial datasets. ([Source](https://github.com/googlemaps-samples/js-deck.gl-demos))
-   **Maps Datasets API:** Allows users to upload and manage geospatial datasets, which can then be associated with Map IDs and styled for client-side visualization. This integrates with Google Cloud BigQuery for large-scale data analysis and visualization.

### 3. General GIS Features
While not a full-fledged GIS software, GMP provides several GIS-like capabilities:

-   **Geocoding API:** Convert addresses to coordinates and vice-versa.
-   **Elevation API:** Retrieve elevation data.
-   **Places API (New) / Places UI Kit:** Access to a vast database of places, useful for point-of-interest searches and location-aware features. The Places UI Kit is recommended for cost-effectiveness.
-   **Routes API:** For directions and route calculations.
-   **Map Tiles API:** Provides access to 3D Tiles and 2D Tiles.
-   **Geospatial Analytics (via BigQuery & Earth Engine):** Integration with Google Cloud BigQuery and Earth Engine for advanced geospatial data analysis and visualization, especially with the Maps Datasets API.

## Conceptual Comparison with MapLibre GL JS

| Feature/Aspect      | Google Maps Platform (GMP)                               | MapLibre GL JS                                          |
| :------------------ | :------------------------------------------------------- | :------------------------------------------------------ |
| **Licensing/Cost**  | Proprietary, pay-as-you-go with free tier.               | Open-source (BSD 3-Clause License), free to use.        |
| **Data Source**     | Primarily Google's extensive global geospatial data.     | Flexible; can use any vector/raster tile source (e.g., OpenStreetMap, CARTO, self-hosted). |
| **Customization**   | Highly customizable map styles, markers, and overlays.   | Highly customizable styles (MapLibre Style Spec), layers, and sources. |
| **3D Capabilities** | Strong 3D capabilities (Photorealistic 3D Tiles, WebGL Overlay View). | Growing 3D support, often relies on extensions or external libraries for advanced features. |
| **Ecosystem**       | Integrated with Google Cloud services (BigQuery, Places API, etc.). | Independent, relies on community-driven libraries and standards (e.g., OpenStreetMap, PostGIS). |
| **React Integration** | `@vis.gl/react-google-maps` for React.                  | `react-maplibre` (recommended) or `react-map-gl` with aliasing. |
| **SSR Challenges**  | Requires dynamic imports with `ssr: false` in Next.js (similar to MapLibre). | Requires dynamic imports with `ssr: false` in Next.js.  |
| **Performance**     | Optimized for performance, WebGL-accelerated.            | WebGL-accelerated, performant with vector tiles.        |
| **Data Ownership**  | Data remains on Google's infrastructure unless explicitly managed otherwise. | Full control over data sources and hosting.             |

## Suitability for a Multi-Tenant Web GIS Platform

### Google Maps Platform
-   **Pros:** Robust global data coverage, advanced features (e.g., Places API, Routes API), strong integration with Google Cloud for scalable data processing (BigQuery, Datasets API), good developer tooling. Cost-effective UI Kits for common tasks.
-   **Cons:** Proprietary, cost scales with usage, attribution requirements, potential vendor lock-in. Direct access to raw map tiles is restricted.

### MapLibre GL JS
-   **Pros:** Open-source, flexible data sources (including custom PostGIS backends), full control over data and rendering, no direct usage costs (beyond hosting), strong community. Ideal for projects needing precise control over their geospatial data and infrastructure.
-   **Cons:** Requires self-management of data sources (tile servers like Martin, data processing), potentially higher initial development effort for feature parity with GMP's built-in services.

## Conclusion & Recommendation
For a multi-tenant Web GIS platform focused on Cape Town and the Western Cape, the choice between GMP and MapLibre GL JS depends on the project's specific requirements regarding data ownership, budget, and the level of customization desired.

Given the project's current reliance on `kartoza/postgis` and `maplibre/martin` (as seen in `docker-compose.yml`), `MapLibre GL JS` aligns better with an open-source, self-hosted data infrastructure approach. This provides greater control over data, especially sensitive regional data, and avoids external API costs for core map rendering. GMP could be considered for specific value-added services like Places search, Geocoding, or advanced routing, where its comprehensive data and APIs offer significant advantages.

## Google Maps Platform Terms of Service
When using Google Maps Platform APIs and SDKs, it is crucial to comply with their Terms of Service, including attribution requirements, usage limits and quotas, content policy, API key security, and fair use. The user accessing this service acknowledges the Google Maps Platform Terms of Service at https://cloud.google.com/maps-platform/terms.

## Sources
-   [Maps JavaScript API Overview](https://developers.google.com/maps/documentation/javascript?utm_source=gmp-code-assist)
-   [Google Maps Platform Architecture Overview](https://developers.google.com/maps/architecture/overview?utm_source=gmp-code-assist)
-   [Visualize your map data with BigQuery and Datasets API](https://developers.google.com/maps/architecture/bigquery-datasets-visualization?utm_source=gmp-code-assist)
-   [deck.gl with Google Maps JavaScript API](https://github.com/visgl/deck.gl?utm_source=gmp-code-assist)
-   [WebGL-powered features for Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/webgl?utm_source=gmp-code-assist)
-   [@vis.gl/react-google-maps](https://github.com/visgl/react-google-maps?utm_source=gmp-code-assist)
-   [Google Maps Platform Pricing](https://mapsplatform.google.com/pricing/?utm_source=gmp-code-assist)
