<!--
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
-->

# /cesium-validate — CesiumJS Configuration Validation

## Trigger
`/cesium-validate` or "check CesiumJS setup" or "validate 3D tiles"

## What It Does
Validates the CesiumJS integration and 3D Tiles configuration for the Cape Town GIS Hub immersive spatial stack. Confirms API keys, camera bounds, tile endpoints, MapLibre fallback, and attribution compliance.

## Procedure
1. **Check API key env vars**
   - Verify `NEXT_PUBLIC_CESIUM_ION_TOKEN` exists in `.env` / `.env.local`
   - Confirm it is not hardcoded in any source file (Rule 3)
   - Check `CESIUM_ION_ASSET_ID` if 3D Tiles are hosted on Cesium Ion
2. **Verify camera bounds match Cape Town bbox**
   - Default camera home must target `{ lng: 18.4241, lat: -33.9249 }` zoom 11
   - Camera clamp rectangle must fall within `{ west: 18.0, south: -34.5, east: 19.5, north: -33.0 }` (Rule 9)
   - Verify `EPSG:4326` coordinates are used for camera positioning (CesiumJS uses WGS84 natively)
3. **Validate 3D Tiles endpoint**
   - Check `Cesium3DTileset` source URL is configured
   - Verify endpoint responds (or is correctly stubbed in dev)
   - Confirm tileset `geometricError` and `refine` strategy are set
   - Check that tileset root `boundingVolume` intersects Cape Town bbox
4. **Check fallback to MapLibre**
   - Verify graceful degradation path exists: if CesiumJS fails to load → MapLibre 2D map renders
   - Check error boundary wraps CesiumJS viewer component
   - Confirm three-tier fallback applies: LIVE (Cesium Ion) → CACHED (local 3D Tiles) → MOCK (MapLibre 2D) (Rule 2)
5. **Verify attribution display**
   - CesiumJS viewer must show `© CARTO | © OpenStreetMap contributors` (Rule 6)
   - Cesium Ion attribution must not be suppressed
   - Data source badge `[SOURCE · YEAR · LIVE|CACHED|MOCK]` visible on 3D view (Rule 1)

## Expected Output
```
CesiumJS Validation Report — [date]
=====================================

✅ PASSED:
  - NEXT_PUBLIC_CESIUM_ION_TOKEN: present in .env.local
  - Camera home: (18.4241, -33.9249) within Cape Town bbox
  - 3D Tiles endpoint: https://assets.ion.cesium.com/... responds 200
  - MapLibre fallback: error boundary detected in CesiumViewer component
  - Attribution: © CARTO | © OpenStreetMap contributors visible

⚠️ WARNINGS:
  - Cesium Ion asset 12345: boundingVolume extends 2km beyond Cape Town bbox
    → Consider tighter tileset clipping

🚨 ERRORS:
  - CESIUM_ION_ASSET_ID not found in .env
    → Add to .env.example and .env.local
  - Data source badge missing on 3D Tiles layer
    → Add [CesiumIon · 2026 · LIVE] badge to viewer overlay
```

## When NOT to Use
- When working only with 2D MapLibre layers (use `/validate-spatial` instead)
- For debugging MapLibre-specific tile rendering issues (use `/optimize-tiles`)
- On production Cesium Ion assets directly — validate locally first
