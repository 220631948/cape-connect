---
name: cesium-3d-tiles
description: Manage CesiumJS and Google Photorealistic 3D Tiles integration for Cape Town immersive views.
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
---

# CesiumJS 3D Tiles Skill

## Purpose
Manage CesiumJS and Google Photorealistic 3D Tiles integration for Cape Town immersive views. Handles viewer configuration, tile loading, camera constraints, and graceful fallback to MapLibre-only mode when 3D is unavailable.

## Trigger
Invoke when:
- Adding 3D building models, terrain, or photorealistic tiles to the map
- Configuring CesiumJS viewer for Cape Town scenes
- Integrating Google Photorealistic 3D Tiles via Map Tiles API
- Setting up 2D/3D hybrid view with MapLibre + CesiumJS
- Handling fallback when CesiumJS or 3D Tiles are unavailable

## Procedure

### Step 1 — Configure CesiumJS Viewer with Cape Town Centre
```typescript
import { Viewer, Cartesian3, Math as CesiumMath } from 'cesium';

const viewer = new Viewer('cesium-container', {
  terrain: undefined,   // Use Google 3D Tiles instead of terrain
  baseLayer: false,      // No default imagery
  geocoder: false,
  homeButton: false,
  animation: false,
  timeline: false,
});

// Fly to Cape Town centre
viewer.camera.flyTo({
  destination: Cartesian3.fromDegrees(18.4241, -33.9249, 15000),
  orientation: {
    heading: CesiumMath.toRadians(0),
    pitch: CesiumMath.toRadians(-45),
    roll: 0,
  },
});
```

### Step 2 — Load Google 3D Tiles via API Key from Env
```typescript
import { createGooglePhotorealistic3DTileset } from 'cesium';

// API key from environment variable — NEVER hardcode
const GOOGLE_TILES_KEY = process.env.NEXT_PUBLIC_GOOGLE_3D_TILES_KEY;

if (GOOGLE_TILES_KEY) {
  const tileset = await createGooglePhotorealistic3DTileset({
    key: GOOGLE_TILES_KEY,
  });
  viewer.scene.primitives.add(tileset);
}
```

**Environment variable:**
| Variable | Required | Absent Behaviour |
|----------|----------|-----------------|
| `NEXT_PUBLIC_GOOGLE_3D_TILES_KEY` | No | 3D Tiles hidden, MapLibre-only mode |

### Step 3 — Set Camera Constraints to Bounding Box
```typescript
// Restrict camera to Cape Town area
const CAPE_TOWN_BOUNDS = {
  west: 18.0, south: -34.5, east: 19.5, north: -33.0,
  minHeight: 50,     // metres — prevent underground
  maxHeight: 100000, // metres — max zoom out
};

viewer.scene.screenSpaceCameraController.minimumZoomDistance = CAPE_TOWN_BOUNDS.minHeight;
viewer.scene.screenSpaceCameraController.maximumZoomDistance = CAPE_TOWN_BOUNDS.maxHeight;
```

### Step 4 — Layer Ordering with Existing MapLibre 2D Layers
```
┌─────────────────────────┐
│ User Draw Layers        │  ← Top (MapLibre overlay)
│ Risk Overlays           │
│ Zoning                  │
│ Cadastral Parcels       │
│ Suburb Boundaries       │
├─────────────────────────┤
│ Google 3D Tiles         │  ← CesiumJS layer
│ CesiumJS Terrain        │
├─────────────────────────┤
│ CARTO Basemap           │  ← Bottom (MapLibre base)
└─────────────────────────┘
```

In hybrid mode, CesiumJS renders beneath a transparent MapLibre overlay for 2D annotations.

### Step 5 — Handle Fallback to MapLibre-Only Mode
```typescript
async function initSpatialView(): Promise<'3d' | '2d'> {
  try {
    if (!GOOGLE_TILES_KEY) throw new Error('No 3D Tiles API key');
    const viewer = await initCesiumViewer();
    return '3d';
  } catch (error) {
    console.warn('CesiumJS unavailable, falling back to MapLibre 2D:', error);
    return '2d';  // MapLibre-only mode — fully functional
  }
}
```

Three-tier fallback applies:
1. **LIVE**: Google Photorealistic 3D Tiles via API
2. **CACHED**: Pre-downloaded 3D Tiles subset in Supabase Storage
3. **MOCK**: MapLibre 2D view with building extrusions (fill-extrusion layer)

## Output
- CesiumJS viewer configuration (viewer options, camera defaults)
- Tile source URLs and API key configuration
- Fallback strategy documentation (3D → cached → 2D)
- Layer ordering specification for hybrid 2D/3D mode
- Attribution: `© Google` for Photorealistic Tiles + existing `© CARTO | © OpenStreetMap contributors`

## When NOT to Use This Skill
- 2D-only map views using MapLibre — use spatial_validation instead
- PMTiles / Martin vector tiles — use tile_optimization instead
- 4DGS temporal reconstruction — use 4dgs_event_replay instead
- Static map screenshots or print layouts
