---
name: cesium-3d-tiles
description: Manage CesiumJS and Google Photorealistic 3D Tiles integration for Cape Town immersive views.
---

# CesiumJS 3D Tiles

Invoke when adding 3D building models, terrain, or photorealistic tiles to the map.

## Checklist

1. **Configure CesiumJS Viewer:** Set Cape Town centre coordinates (`18.4241, -33.9249`), disable default UI (geocoder, homeButton, animation, timeline). Fly to default view at 15km height, -45° pitch.
2. **Load Google 3D Tiles:** Use `NEXT_PUBLIC_GOOGLE_3D_TILES_KEY` from env. NEVER hardcode API keys. If key absent, hide 3D Tiles gracefully.
3. **Camera Constraints:** Restrict to Cape Town bounding box (`18.0–19.5°E`, `33.0–34.5°S`). Min height: 50m, max height: 100km.
4. **Layer Ordering:** Top to bottom: User Draw → Risk Overlays → Zoning → Cadastral → Suburbs → Google 3D Tiles → CARTO Basemap. CesiumJS renders beneath transparent MapLibre overlay in hybrid mode.
5. **Fallback Strategy:** LIVE: Google 3D Tiles API → CACHED: Pre-downloaded tiles in Supabase Storage → MOCK: MapLibre 2D with fill-extrusion buildings.

## Attribution
Add `© Google` for Photorealistic Tiles alongside existing `© CARTO | © OpenStreetMap contributors`.

## Output
- CesiumJS viewer config, tile source URLs, fallback strategy, layer ordering spec.

## When NOT to Use
- 2D-only MapLibre views, PMTiles/Martin vector tiles, 4DGS temporal reconstruction, static map screenshots.
