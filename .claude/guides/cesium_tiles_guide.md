---
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
---

# CesiumJS & Google Photorealistic 3D Tiles Guide

## CesiumJS Setup

### Install Packages
```bash
npm install cesium @cesium/engine @cesium/widgets
```

### Viewer Initialization
```typescript
import { Viewer, Cartesian3, Math as CesiumMath } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Dynamic import for Next.js (client-side only)
const CesiumViewer = dynamic(() => import('@/components/CesiumViewer'), {
  ssr: false,
  loading: () => <div className="bg-gray-950 h-full" />,
});
```

### Viewer Config (Cape Town)
```typescript
const viewer = new Viewer('cesiumContainer', {
  terrainProvider: await CesiumTerrainProvider.fromIonAssetId(1),
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  animation: false,
  timeline: false,
  scene3DOnly: true,
});

// Cape Town initial camera (CLAUDE.md Rule 9)
viewer.camera.flyTo({
  destination: Cartesian3.fromDegrees(18.4241, -33.9249, 15000),
  orientation: {
    heading: CesiumMath.toRadians(0),
    pitch: CesiumMath.toRadians(-45),
    roll: 0,
  },
});
```

## Google Photorealistic 3D Tiles

### API Key Management
```env
# .env.local — NEVER commit (CLAUDE.md Rule 3)
NEXT_PUBLIC_GOOGLE_3D_TILES_KEY=your_key_here
```

```typescript
// Only load if key is present — graceful degradation
const google3DTilesKey = process.env.NEXT_PUBLIC_GOOGLE_3D_TILES_KEY;
if (!google3DTilesKey) {
  console.warn('Google 3D Tiles key absent — falling back to 2D');
}
```

### Endpoint Configuration
```typescript
import { Cesium3DTileset, Resource } from 'cesium';

const GOOGLE_3D_TILES_URL =
  'https://tile.googleapis.com/v1/3dtiles/root.json';

async function loadGoogle3DTiles(viewer: Viewer) {
  const tileset = await Cesium3DTileset.fromUrl(
    new Resource({
      url: GOOGLE_3D_TILES_URL,
      queryParameters: { key: google3DTilesKey },
    }),
    {
      maximumScreenSpaceError: 8,    // Quality vs performance
      maximumMemoryUsage: 512,       // MB — tune for mobile
      preloadWhenHidden: false,
      skipLevelOfDetail: true,
    }
  );
  viewer.scene.primitives.add(tileset);
  return tileset;
}
```

## Cape Town Camera Configuration

### Bounding Box (CLAUDE.md Rule 9)
```typescript
const CAPE_TOWN_BBOX = {
  west: 18.0,
  south: -34.5,
  east: 19.5,
  north: -33.0,
};

// Fly to Cape Town bounds
viewer.camera.flyTo({
  destination: Rectangle.fromDegrees(
    CAPE_TOWN_BBOX.west,
    CAPE_TOWN_BBOX.south,
    CAPE_TOWN_BBOX.east,
    CAPE_TOWN_BBOX.north
  ),
});
```

### Key Viewpoints
| Location | Lon | Lat | Altitude | Pitch |
|----------|-----|-----|----------|-------|
| Table Mountain | 18.4037 | -33.9628 | 5000 | -35° |
| V&A Waterfront | 18.4210 | -33.9036 | 1000 | -30° |
| Cape Town CBD | 18.4241 | -33.9249 | 3000 | -45° |
| Cape Flats | 18.5500 | -34.0000 | 8000 | -60° |
| Harbour | 18.4300 | -33.9100 | 800 | -25° |

## MapLibre Fallback Strategy

> **Three-tier:** CesiumJS 3D → MapLibre 2D → Static image (CLAUDE.md Rule 2)

```typescript
function initMapView() {
  const has3DTilesKey = !!process.env.NEXT_PUBLIC_GOOGLE_3D_TILES_KEY;
  const supportWebGL2 = checkWebGL2Support();

  if (has3DTilesKey && supportWebGL2) {
    return initCesiumViewer();    // Full 3D experience
  } else {
    return initMapLibreViewer();  // 2D fallback — always available
  }
}

function checkWebGL2Support(): boolean {
  const canvas = document.createElement('canvas');
  return !!canvas.getContext('webgl2');
}
```

## Layer Composition: CesiumJS 3D + MapLibre 2D

### Approach: Side-by-Side or Toggle
```typescript
// Option A: Cesium full-screen with MapLibre mini-map
// Option B: Toggle between 3D (Cesium) and 2D (MapLibre) views
// Option C: Cesium 3D with 2D data overlays via Entity API

// Overlay 2D GeoJSON data on CesiumJS globe
import { GeoJsonDataSource } from 'cesium';

const zoningOverlay = await GeoJsonDataSource.load('/mock/zoning.geojson', {
  stroke: Color.fromCssColorString('#FF6B6B'),
  fill: Color.fromCssColorString('#FF6B6B').withAlpha(0.2),
  strokeWidth: 2,
  clampToGround: true,
});
viewer.dataSources.add(zoningOverlay);
```

### Layer Z-Order (CesiumJS)
1. Entity overlays (user draw, annotations) — top
2. Risk/heatmap overlays (clamped to ground)
3. GeoJSON vector data (zoning, cadastral)
4. Google 3D Tiles (buildings, terrain)
5. Terrain provider — bottom

## Performance Considerations

### Tile Level of Detail (LOD)
```typescript
// Adjust for device capability
const isMobile = /Mobi|Android/i.test(navigator.userAgent);
const tileset = await Cesium3DTileset.fromUrl(url, {
  maximumScreenSpaceError: isMobile ? 16 : 8,
  maximumMemoryUsage: isMobile ? 256 : 512,
  skipLevelOfDetail: true,
  skipScreenSpaceErrorFactor: 16,
  skipLevels: 1,
  loadSiblings: false,
});
```

### Camera-Based Loading
```typescript
// Only load tiles within Cape Town bbox
viewer.scene.globe.preloadSiblings = false;
viewer.scene.requestRenderMode = true;
viewer.scene.maximumRenderTimeChange = 0.1;

// Restrict camera to Cape Town region
viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100;
viewer.scene.screenSpaceCameraController.maximumZoomDistance = 50000;
```

## Attribution Requirements

> **CLAUDE.md Rule 6 + Google ToS**

```typescript
// Must display both attributions
const attribution = '© Google | © CARTO | © OpenStreetMap contributors';

// CesiumJS credit display
viewer.creditDisplay.addStaticCredit(
  new Credit('© Google | © OpenStreetMap contributors', true)
);
```

## Offline Fallback

### 2D Fallback: PMTiles
```typescript
// When 3D Tiles unavailable (offline/no API key)
// Fall back to PMTiles via MapLibre (see pmtiles_martin_guide.md)
import { Protocol } from 'pmtiles';
const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);
```

### Pre-Cached 3D Tiles (Future)
```typescript
// Strategy for offline 3D:
// 1. Cache most-viewed tiles via service worker
// 2. Store in IndexedDB (Dexie.js)
// 3. Serve from cache when navigator.onLine === false
// Note: Google 3D Tiles ToS may restrict caching — verify before implementing
```

## Data Source Badge
```typescript
// CLAUDE.md Rule 1 — always show source badge
<DataBadge source="Google 3D Tiles" year="2024" status="LIVE" />
// Fallback:
<DataBadge source="PMTiles" year="2024" status="CACHED" />
```
