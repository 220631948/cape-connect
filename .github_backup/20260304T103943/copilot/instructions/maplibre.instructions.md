---
name: 'MapLibre GL JS'
description: 'Map rendering conventions and spatial data handling'
applyTo: '**/components/map/**/*,**/hooks/useMap*,**/styles/map-styles/**/*'
---

# MapLibre GL JS Standards

- MapLibre GL JS is the ONLY mapping library. Do NOT use Leaflet, OpenLayers, or Mapbox GL JS.
- Always load via `next/dynamic({ ssr: false })` — it requires `window` and WebGL.
- Use `react-map-gl` in MapLibre mode for React integration.
- Default centre: Cape Town CBD `[-33.9249, 18.4241]`, zoom 11.
- Basemap: CARTO Dark Matter tiles or custom PMTiles per tenant.
- Attribution is legally required: `© OpenStreetMap contributors © CARTO`.
- Per-tenant map theming is done via JSON style spec swap (MapLibre's killer feature for white-labeling).
- Use `NavigationControl`, `ScaleControl`, and `GeolocateControl`.
- All ArcGIS queries MUST include a Cape Town Metro bounding box.
- Vector tile sources should use `pmtiles://` protocol where available.
- Implement zoom gates to activate layers at appropriate thresholds.
