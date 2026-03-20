# Task M5: CesiumJS + MapLibre Hybrid View Architecture

> **TL;DR:** Architect a hybrid 2D/3D spatial view combining CesiumJS (photorealistic 3D tiles, terrain) with MapLibre GL JS (2D vector overlays) in synchronized, performant rendering. Supports `2d`, `3d`, and `hybrid` view modes with automatic mobile fallback to 2D-only. Requires PLAN_DEVIATIONS.md entry before implementation.

**Priority:** M5 (Phase 2)
**Status:** READY FOR IMPLEMENTATION — DEV Entry Created
**Created:** 2026-03-05
**Updated:** 2026-03-05 (TL;DR, edge cases, measurable criteria added)
**Dependencies:** M3 (MapLibre basemap), M4a (three-tier fallback), M4c (Serwist PWA)
**Blocking:** Requires human approval via `docs/PLAN_DEVIATIONS.md` (DEV-NNN) before any CesiumJS code [VERIFIED]

---

## 1. Objective

Architect a hybrid 2D/3D spatial view that combines CesiumJS (for photorealistic 3D tiles and terrain) with MapLibre GL JS (for 2D vector overlays and annotations) in a synchronized, performant manner.

---

## 2. Cape Town Domain Context

### Why Hybrid?

The CapeTown GIS Hub serves multiple user domains with different visualization needs:

| Domain | Preferred View | Rationale |
|--------|---------------|-----------|
| **Urban Planners** | 3D + 2D hybrid | Need building massing (3D) + zoning overlays (2D) |
| **Emergency Responders** | 2D primary | Fast rendering, clear symbology, offline-capable |
| **Tourism / V&A Waterfront** | 3D immersive | Photorealistic buildings, terrain context |
| **Environmental** | 2D with elevation | Contour lines, watershed boundaries, NDVI |
| **Aviation** | 3D globe | Airspace visualization, flight paths in 3D |
| **Citizens (mobile)** | 2D lightweight | Performance on SA mobile networks (5 Mbps) |

**Key insight:** A single view mode cannot serve all domains. The architecture must support seamless switching between 2D-only, 3D-only, and hybrid modes.

---

## 3. Architecture Specification

### 3.1 View Mode Enum

```typescript
type SpatialViewMode = '2d' | '3d' | 'hybrid';

interface SpatialViewConfig {
  mode: SpatialViewMode;
  defaultCenter: { lng: number; lat: number; height?: number };
  defaultZoom: number;  // 2D: zoom level; 3D: height in meters
  syncCameras: boolean; // Keep 2D and 3D views aligned in hybrid mode
}
```

### 3.2 Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  SpatialViewContainer (parent)                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  CesiumJS Layer (3D) — z-index: 0                     │  │
│  │  - Google Photorealistic 3D Tiles                     │  │
│  │  - Terrain mesh                                       │  │
│  │  - 3D building models (glTF)                          │  │
│  │  - Flight paths / CZML entities                       │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  MapLibre Overlay (2D) — z-index: 1, transparent bg   │  │
│  │  - Suburb boundaries                                  │  │
│  │  - Zoning polygons                                    │  │
│  │  - Cadastral parcels (zoom ≥ 14)                      │  │
│  │  - Data source badges                                 │  │
│  │  - User draw layers                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  UI Overlay (controls, timeline, tooltips) — z-index: 2│  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Camera Synchronization Protocol

In hybrid mode, CesiumJS and MapLibre cameras must stay synchronized:

```typescript
interface CameraState {
  center: { lng: number; lat: number };
  zoom?: number;      // MapLibre: 0–22
  height?: number;    // CesiumJS: meters above ground
  heading: number;    // radians
  pitch: number;      // radians
}

// Sync direction: CesiumJS → MapLibre (primary)
function syncMapLibreToCesium(cesiumCamera: CameraState, maplibreMap: Map) {
  const { lng, lat, height } = cesiumCamera;

  // Convert CesiumJS height to MapLibre zoom (approximate)
  const zoom = heightToZoom(height);

  maplibreMap.jumpTo({
    center: [lng, lat],
    zoom,
    bearing: cesiumCamera.heading * (180 / Math.PI),
    pitch: cesiumCamera.pitch * (180 / Math.PI),
  });
}

// Sync direction: MapLibre → CesiumJS (for user interactions on overlay)
function syncCesiumToMapLibre(maplibreCamera: CameraState, cesiumViewer: Viewer) {
  const { lng, lat, zoom } = maplibreCamera;
  const height = zoomToHeight(zoom);

  cesiumViewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(lng, lat, height),
    orientation: {
      heading: maplibreCamera.heading,
      pitch: maplibreCamera.pitch,
    },
    duration: 0,  // Instant sync
  });
}
```

**Note:** Height↔Zoom conversion is non-linear. Use empirical calibration for Cape Town center:

```typescript
function heightToZoom(heightMeters: number): number {
  // Empirical mapping for Cape Town center
  // Derived from visual alignment testing
  const referenceHeight = 15000;  // meters
  const referenceZoom = 11;

  return referenceZoom + Math.log2(referenceHeight / heightMeters);
}

function zoomToHeight(zoom: number): number {
  const referenceHeight = 15000;
  const referenceZoom = 11;

  return referenceHeight / Math.pow(2, zoom - referenceZoom);
}
```

---

## 4. Implementation Strategy

### 4.1 Phase 1: MapLibre-Only (Current — M0–M4)

No CesiumJS dependency. All rendering via MapLibre GL JS.

```typescript
// app/src/components/map/SpatialView.tsx
import { MapProvider } from 'react-map-gl/maplibre';

export function SpatialView() {
  return (
    <MapProvider>
      <Map
        mapLib={maplibregl}
        style="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        center={[18.4241, -33.9249]}
        zoom={11}
      />
    </MapProvider>
  );
}
```

### 4.2 Phase 2: Hybrid Architecture (M5)

Requires `docs/PLAN_DEVIATIONS.md` entry (DEV-NNN) for CesiumJS introduction.

```typescript
// app/src/components/map/SpatialView.tsx
import { MapProvider } from 'react-map-gl/maplibre';
import { Viewer } from 'cesium';
import { useEffect, useRef, useState } from 'react';

interface SpatialViewProps {
  mode: '2d' | '3d' | 'hybrid';
}

export function SpatialView({ mode }: SpatialViewProps) {
  const cesiumRef = useRef<HTMLDivElement>(null);
  const maplibreRef = useRef<HTMLDivElement>(null);
  const [cesiumViewer, setCesiumViewer] = useState<Viewer | null>(null);
  const [maplibreMap, setMaplibreMap] = useState<Map | null>(null);

  useEffect(() => {
    if (mode === '3d' || mode === 'hybrid') {
      const viewer = new Viewer(cesiumRef.current!, {
        terrain: undefined,
        baseLayer: false,
        geocoder: false,
        homeButton: false,
        animation: false,
        timeline: false,
      });

      // Load Google 3D Tiles if API key available
      const GOOGLE_TILES_KEY = process.env.NEXT_PUBLIC_GOOGLE_3D_TILES_KEY;
      if (GOOGLE_TILES_KEY) {
        import('cesium').then(async ({ createGooglePhotorealistic3DTileset }) => {
          const tileset = await createGooglePhotorealistic3DTileset({
            key: GOOGLE_TILES_KEY,
          });
          viewer.scene.primitives.add(tileset);
        });
      }

      setCesiumViewer(viewer);
    }

    return () => {
      cesiumViewer?.destroy();
    };
  }, [mode]);

  // Sync cameras in hybrid mode
  useEffect(() => {
    if (mode === 'hybrid' && cesiumViewer && maplibreMap) {
      const syncCameras = () => {
        const cesiumCam = cesiumViewer.camera;
        // ... sync logic from §3.3
      };

      cesiumViewer.camera.moveEnd.addEventListener(syncCameras);
      return () => {
        cesiumViewer.camera.moveEnd.removeEventListener(syncCameras);
      };
    }
  }, [mode, cesiumViewer, maplibreMap]);

  return (
    <div className="relative w-full h-full">
      {(mode === '3d' || mode === 'hybrid') && (
        <div ref={cesiumRef} className="absolute inset-0" style={{ zIndex: 0 }} />
      )}
      <div ref={maplibreRef} className="absolute inset-0" style={{
        zIndex: 1,
        backgroundColor: mode === '3d' ? 'transparent' : undefined
      }}>
        <MapProvider>
          <Map
            ref={setMaplibreMap}
            mapLib={maplibregl}
            style="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            center={[18.4241, -33.9249]}
            zoom={11}
          />
        </MapProvider>
      </div>
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
        {/* Controls, badges, tooltips — pointer-events: auto on interactive elements */}
      </div>
    </div>
  );
}
```

---

## 5. Layer Ordering Specification

```
┌─────────────────────────┐
│ UI Overlay              │  ← Controls, badges, tooltips (z: 100)
├─────────────────────────┤
│ User Draw Layers        │  ← MapLibre (top vector layer)
│ Risk Overlays           │  ← MapLibre
│ Zoning Polygons         │  ← MapLibre
│ Cadastral Parcels       │  ← MapLibre (zoom ≥ 14)
│ Suburb Boundaries       │  ← MapLibre
├─────────────────────────┤
│ Google 3D Tiles         │  ← CesiumJS primitives
│ CesiumJS Terrain        │  ← CesiumJS terrain
├─────────────────────────┤
│ CARTO Dark Basemap      │  ← CesiumJS imagery OR MapLibre base
└─────────────────────────┘
```

**Implementation note:** In hybrid mode, MapLibre renders 2D vector overlays on top of CesiumJS 3D tiles. The MapLibre background must be transparent:

```css
.maplibregl-map {
  background: transparent !important;
}
```

---

## 6. Three-Tier Fallback

| Tier | Source | Trigger |
|------|--------|---------|
| **LIVE** | Google Photorealistic 3D Tiles via API | `NEXT_PUBLIC_GOOGLE_3D_TILES_KEY` present |
| **CACHED** | Pre-downloaded 3D Tiles in Supabase Storage | API unavailable, cached tiles exist |
| **MOCK** | MapLibre 2D with building extrusions | No 3D Tiles available — fully functional fallback |

```typescript
async function initSpatialView(): Promise<'3d' | '2d'> {
  try {
    if (!process.env.NEXT_PUBLIC_GOOGLE_3D_TILES_KEY) {
      throw new Error('No 3D Tiles API key');
    }

    const viewer = await initCesiumViewer();

    // Verify Google 3D Tiles loaded successfully
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('3D Tiles load timeout')), 10000);
      viewer.scene.primitives.readyPromise.then(() => {
        clearTimeout(timeout);
        resolve();
      }).catch(reject);
    });

    return '3d';
  } catch (error) {
    console.warn('CesiumJS unavailable, falling back to MapLibre 2D:', error);
    return '2d';
  }
}
```

---

## 7. Data Source Badge

In hybrid mode, badge displays:

```
[Google 3D Tiles · 2026 · LIVE]
```

In 2D fallback mode:

```
[MapLibre 2D · 2026 · MOCK]
```

Badge visibility: Bottom-left corner, always visible.

Attribution requirement (CLAUDE.md Rule 6):
```
© Google | © CARTO | © OpenStreetMap contributors
```

---

## 8. Skeptical Expert Notes

### What Could Go Wrong

| Risk | Severity | Mitigation |
|------|----------|------------|
| **CesiumJS bundle size (~30–50 MB)** — Prohibitive for SA mobile networks (5 Mbps average, load-shedding context) | CRITICAL | Code-split CesiumJS as lazy-loaded module; default to MapLibre-only on mobile; add `?3d=false` URL param |
| **Google 3D Tiles Cape Town coverage unverified** — May not have street-level photorealistic tiles for Cape Town | HIGH | Test API before Phase 2: `https://tile.googleapis.com/v1/3d/tileMetadata` with Cape Town coords |
| **Camera sync drift** — CesiumJS and MapLibre use different projection math; visual misalignment over time | MEDIUM | Implement periodic re-sync on camera idle; add manual "Realign Views" button |
| **Z-fighting between layers** — 3D tiles and 2D polygons at similar elevations may flicker | MEDIUM | Offset MapLibre polygon elevations slightly above terrain; use `minZoom` to hide cadastral at low zoom |
| **Memory exhaustion on mobile** — Both CesiumJS and MapLibre running simultaneously | HIGH | Detect mobile via `navigator.userAgent`; force 2D-only mode; limit texture quality in CesiumJS |
| **CLAUDE.md Rule violation** — Current mandate is MapLibre-only | BLOCKING | Requires `docs/PLAN_DEVIATIONS.md` entry (DEV-NNN) + human approval before any CesiumJS code |

### Required Skill Dependencies

Before implementing this task, the developer MUST read:

1. **`.claude/skills/cesium_3d_tiles/SKILL.md`** — CesiumJS viewer configuration, Google 3D Tiles API, camera constraints
2. **`.claude/skills/spatialintelligence_inspiration/SKILL.md`** — Hybrid view architecture, design tokens, layer fusion patterns
3. **`.claude/skills/spatial_validation/SKILL.md`** — CRS handling (EPSG:4326 vs EPSG:3857), Cape Town bounding box validation
4. **`.claude/skills/three_tier_fallback/SKILL.md`** — LIVE→CACHED→MOCK pattern for external data sources

### Technical Unknowns

- **Google 3D Tiles Cape Town coverage** — `UNVERIFIED`. Must test via API before Phase 2.
- **CesiumJS + MapLibre sync precision** — No documented Cape Town-specific calibration data. Requires empirical testing.
- **Mobile performance budget** — SA mobile networks average 5 Mbps; CesiumJS initial load may exceed 10 MB. Requires optimization.

---

## 9. Acceptance Criteria

- [ ] `SpatialView` component supports `'2d' | '3d' | 'hybrid'` mode switching via prop/URL param
- [ ] CesiumJS viewer initializes with Google Photorealistic 3D Tiles when `NEXT_PUBLIC_GOOGLE_3D_TILES_KEY` is present
- [ ] MapLibre overlay renders with transparent background (`background: transparent`) in hybrid mode
- [ ] Camera sync: CesiumJS → MapLibre updates within 1 frame (16ms tolerance)
- [ ] Camera sync: MapLibre → CesiumJS updates with `duration: 0` (instant)
- [ ] Height↔zoom conversion calibrated for Cape Town center (18.4241, -33.9249)
- [ ] Layer Z-order matches specification: UI(z:100) > User Draw > Risk > Zoning > Cadastral > Suburbs > 3D Tiles > Terrain > Basemap
- [ ] Three-tier fallback: Google 3D Tiles → cached tiles (Supabase Storage) → MapLibre 2D extrusions
- [ ] Data source badge: `[Google 3D Tiles · 2026 · LIVE]` or `[MapLibre 2D · 2026 · MOCK]`
- [ ] Attribution: `© Google | © CARTO | © OpenStreetMap contributors`
- [ ] Mobile detection (`navigator.userAgent` or `window.innerWidth < 768`) forces 2D-only mode
- [ ] `docs/PLAN_DEVIATIONS.md` entry (DEV-NNN) created and approved before merge

### Edge Cases & Failure Modes

| Scenario | Expected Behaviour |
|----------|-------------------|
| CesiumJS bundle fails to load (network timeout) | Fall back to MapLibre 2D, log warning |
| Google 3D Tiles API key missing | Skip CesiumJS init, render MapLibre-only |
| Camera sync drift after extended use | Periodic re-sync on camera idle (1s debounce) |
| Z-fighting between 3D tiles and 2D polygons | Offset MapLibre polygon elevations +0.5m above terrain |
| Memory >1GB on mobile device | Force 2D-only, destroy CesiumJS viewer |
| User switches mode rapidly (2D→3D→2D) | Debounce mode changes (300ms), clean up previous viewer |

---

## 10. Files to Create/Modify

```
app/src/components/map/
├── SpatialView.tsx           # Main hybrid view component
├── CesiumViewer.tsx          # CesiumJS wrapper component
├── MapLibreOverlay.tsx       # MapLibre 2D overlay component
├── CameraSync.ts             # Camera synchronization utilities
└── ViewModeToggle.tsx        # 2D/3D/Hybrid mode switch

app/src/lib/
├── cesium-config.ts          # CesiumJS initialization options
└── height-zoom-conversion.ts # Empirical height↔zoom mapping

docs/architecture/
├── ADR-009-cesiumjs-introduction.md  # Architecture Decision Record
└── PLAN_DEVIATIONS.md        # DEV-NNN entry for CesiumJS
```

---

## 11. Estimated Complexity

- **CesiumJS viewer setup:** 1–2 days
- **MapLibre overlay integration:** 1 day
- **Camera synchronization:** 2–3 days
- **Google 3D Tiles API integration:** 1 day
- **Mobile fallback detection:** 1 day
- **Testing & calibration:** 2–3 days

**Total:** ~8–11 days (Phase 2 sprint)

**Blocking:** Requires human approval via `docs/PLAN_DEVIATIONS.md` entry before any CesiumJS code is written.

---

*Generated by Antigravity Agent — Ralph Wiggum voice: "The flat map and the round globe are holding hands now!"*
