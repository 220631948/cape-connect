# Task M5-M7: Sensor Fusion — Port of Cape Town AIS + Table Mountain 3D Data

> **TL;DR:** Build a multi-sensor fusion pipeline combining maritime AIS data from Port of Cape Town with Google 3D Tiles terrain for Table Mountain. Renders in CesiumJS with vessel 3D models, temporal replay, and MapLibre 2D fallback. Requires AIS licensing verification before implementation.

**Priority:** M5-M7 (Phase 2)
**Status:** SCAFFOLDED — Requires Data Source Verification
**Created:** 2026-03-05
**Updated:** 2026-03-05 (TL;DR, acceptance criteria, edge cases added)
**Dependencies:** M4a (three-tier fallback), M4b (Martin MVT), M3 (MapLibre basemap)
**Blocking:** AIS data source licensing MUST be verified before implementation [ASSUMPTION — UNVERIFIED]

---

## 1. Objective

Architect a multi-sensor fusion pipeline that combines maritime AIS (Automatic Identification System) data from the Port of Cape Town with 3D terrain/building data for Table Mountain and the surrounding urban context.

---

## 2. Cape Town Domain Context

### Port of Cape Town — Table Bay Harbor

The Port of Cape Town is a critical maritime hub handling:
- **Container shipping:** MSC, Maersk, CMA CGM routes
- **Bulk cargo:** Ore, grain, coal exports
- **Passenger vessels:** Cruise ships (V&A Waterfront)
- **Fishing fleet:** Commercial trawlers, line fishers
- **Naval:** SAN frigates, patrol vessels
- **Emergency:** Sea rescue, harbor pilots

### Why Fuse AIS + 3D Terrain?

| Use Case | Value Proposition |
|----------|-------------------|
| **Maritime logistics** | Visualize ship positions relative to terminal infrastructure |
| **Environmental monitoring** | Track vessel emissions near residential areas (Blouberg, Green Point) |
| **Tourism (V&A Waterfront)** | Show cruise ship arrivals against Table Mountain backdrop |
| **Emergency response** | Coordinate sea rescue with terrain awareness |
| **Urban planning** | Analyze visual impact of port operations on city views |
| **Defense/Security** | Aggregate vessel pattern analysis (not individual tracking) |

### Data Sources

#### AIS (Maritime)
| Source | Format | Latency | Licensing |
|--------|--------|---------|-----------|
| **Port of Cape Town** | NMEA 0183 over TCP | Real-time | Commercial agreement required |
| **AIS Hub (SA)** | HTTP JSON API | ~30 seconds | Free tier available |
| **MarineTraffic** | REST API | 5–10 minutes | Paid tiers |
| **VesselFinder** | WebSocket stream | Real-time | Paid tiers |
| **Open AIS (volunteer)** | Various | Variable | Community licensing |

**Status:** `UNVERIFIED` — No formal evaluation of AIS data sources for Cape Town coverage.

#### 3D Terrain/Buildings
| Source | Format | Coverage | Licensing |
|--------|--------|----------|-----------|
| **Google Photorealistic 3D Tiles** | 3D Tiles 1.1 | Cape Town metro | Google Maps Platform API |
| **SRTM (NASA)** | GeoTIFF | Regional (30m) | Public domain |
| **AW3D (JAXA)** | GeoTIFF | Regional (30m) | Free for research |
| **CoCT LiDAR** | LAS/LAZ | City only | Municipal data agreement |
| **OpenStreetMap** | OSM buildings | City (variable) | ODbL |

---

## 3. Sensor Fusion Architecture

### 3.1 Conceptual Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    Sensor Fusion Pipeline                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   AIS Data   │    │  3D Terrain  │    │  3D Buildings │      │
│  │   (vessels)  │    │   (SRTM)     │    │   (Google)    │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Temporal Alignment Layer                   │   │
│  │  - All timestamps normalized to ISO 8601 (SAST/UTC+2)   │   │
│  │  - Coordinate systems unified to EPSG:4326              │   │
│  │  - Update rates synchronized (AIS: 10s, 3D: static)     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              CesiumJS Fusion Engine                     │   │
│  │  - AIS vessels as 3D entities with orientation          │   │
│  │  - Terrain mesh as elevation base                       │   │
│  │  - 3D buildings for urban context                       │   │
│  │  - Camera sync with MapLibre overlay                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Dashboard Presentation Layer               │   │
│  │  - Vessel positions + 3D city context                   │   │
│  │  - Temporal scrubber for replay                         │   │
│  │  - Data source badges for each layer                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 AIS Data Schema

```typescript
interface AISVessel {
  // Static data (from vessel registry)
  mmsi: string;           // Maritime Mobile Service Identity
  imo: string;            // IMO number (if available)
  name: string;           // Vessel name
  callsign: string;       // Radio callsign
  type: VesselType;       // Cargo, tanker, passenger, etc.
  dimensions: {
    length: number;       // metres
    width: number;        // metres
    draft: number;        // metres
  };

  // Dynamic data (real-time)
  timestamp: string;      // ISO 8601, SAST
  position: {
    lat: number;          // WGS84 degrees
    lon: number;          // WGS84 degrees
    accuracy: number;     // metres (GNSS quality)
  };
  navigation: {
    heading: number;      // degrees (0-360)
    course: number;       // degrees (0-360)
    speed: number;        // knots
    rate_of_turn: number; // degrees/minute
    status: NavigationStatus;
  };

  // Voyage data (optional)
  destination?: string;   // Port of destination
  eta?: string;           // ISO 8601
}

enum VesselType {
  CARGO = 'cargo',
  TANKER = 'tanker',
  PASSENGER = 'passenger',
  FISHING = 'fishing',
  NAVAL = 'naval',
  PLEASURE = 'pleasure',
  UNDEFINED = 'undefined',
}

enum NavigationStatus {
  UNDERWAY = 'underway',
  ANCHORED = 'anchored',
  MOORED = 'moored',
  CONSTRAINED = 'constrained',
  NOT_UNDER_COMMAND = 'not_under_command',
}
```

### 3.3 Table Mountain 3D Data Pipeline

```typescript
interface Terrain3DData {
  source: 'google' | 'srmt' | 'lidar';
  format: '3d-tiles' | 'geotiff' | 'las';
  coverage: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  resolution: {
    horizontal: number;   // metres per pixel
    vertical: number;     // metres
  };
  url: string;            // Tile URL or storage path
}

const TABLE_MOUNTAIN_3D: Terrain3DData = {
  source: 'google',
  format: '3d-tiles',
  coverage: {
    west: 18.35,
    south: -34.10,
    east: 18.50,
    north: -33.85,
  },
  resolution: {
    horizontal: 0.1,  // ~10 cm per pixel (street level)
    vertical: 0.5,    // 50 cm vertical accuracy
  },
  url: 'https://tile.googleapis.com/v1/3d/root?...',
};
```

---

## 4. CesiumJS Integration

### 4.1 Terrain + AIS Entity Fusion

```typescript
// app/src/components/cesium/MaritimeFusion.tsx
import { Viewer, Entity, Cartesian3, LabelStyle, Color } from 'cesium';

interface MaritimeFusionProps {
  viewer: Viewer;
  vessels: AISVessel[];
}

export function MaritimeFusion({ viewer, vessels }: MaritimeFusionProps) {
  useEffect(() => {
    // Load Google 3D Tiles for Table Mountain
    import('cesium').then(async ({ createGooglePhotorealistic3DTileset }) => {
      const tileset = await createGooglePhotorealistic3DTileset({
        key: process.env.NEXT_PUBLIC_GOOGLE_3D_TILES_KEY!,
      });
      viewer.scene.primitives.add(tileset);

      // Fly to Table Mountain + Port view
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(18.41, -33.91, 8000),
        orientation: {
          heading: 0,
          pitch: -35,
          roll: 0,
        },
      });
    });

    // Add vessel entities
    const vesselEntities = vessels.map(vessel => {
      return viewer.entities.add({
        position: Cartesian3.fromDegrees(
          vessel.position.lon,
          vessel.position.lat,
          0  // Sea level
        ),
        orientation: computeVesselOrientation(vessel.navigation.heading),
        model: {
          uri: getModelUriForVesselType(vessel.type),
          scale: getScaleForVessel(vessel.dimensions),
          minimumPixelSize: 24,
        },
        label: {
          text: vessel.name,
          font: '11px monospace',
          style: LabelStyle.FILL_AND_OUTLINE,
          fillColor: Color.CYAN,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          verticalOrigin: 1,
          pixelOffset: { x: 0, y: 16 },
          showBackground: true,
          backgroundColor: Color.BLACK.withAlpha(0.7),
        },
        properties: {
          mmsi: vessel.mmsi,
          type: vessel.type,
          speed: vessel.navigation.speed,
          destination: vessel.destination,
        },
      });
    });

    return () => {
      vesselEntities.forEach(e => viewer.entities.remove(e));
    };
  }, [viewer, vessels]);

  return null;
}

function computeVesselOrientation(heading: number): any {
  const { Math: CesiumMath, HeadingPitchRoll, Quaternion } = await import('cesium');

  const hpr = new HeadingPitchRoll(
    CesiumMath.toRadians(heading),
    CesiumMath.toRadians(0),
    CesiumMath.toRadians(0)
  );

  return Quaternion.fromHeadingPitchRoll(hpr);
}

function getModelUriForVesselType(type: VesselType): string {
  const modelMap: Record<VesselType, string> = {
    cargo: '/models/vessels/cargo-ship.glb',
    tanker: '/models/vessels/tanker.glb',
    passenger: '/models/vessels/cruise-ship.glb',
    fishing: '/models/vessels/fishing-boat.glb',
    naval: '/models/vessels/naval-vessel.glb',
    pleasure: '/models/vessels/yacht.glb',
    undefined: '/models/vessels/generic-vessel.glb',
  };
  return modelMap[type] || modelMap.undefined;
}

function getScaleForVessel(dimensions: { length: number; width: number }): number {
  // Scale model to match real-world dimensions
  // Base scale: 1 unit = 1 metre
  const referenceLength = 100;  // metres (reference vessel)
  return dimensions.length / referenceLength;
}
```

### 4.2 Temporal Replay Integration

```typescript
// app/src/lib/ais-temporal-index.ts
interface AISTemporalEntry {
  mmsi: string;
  timestamp: string;  // ISO 8601
  position: [number, number]; // [lon, lat]
  heading: number;
  speed: number;
  status: NavigationStatus;
}

// Build temporal index for AIS track replay
async function buildAISTemporalIndex(
  startTime: string,
  endTime: string
): Promise<Map<string, AISTemporalEntry[]>> {
  const response = await fetch(
    `/api/ais/history?start=${startTime}&end=${endTime}`
  );
  const data = await response.json();

  // Group by MMSI for per-vessel tracks
  const index = new Map<string, AISTemporalEntry[]>();

  for (const entry of data.positions) {
    const mmsi = entry.mmsi;
    if (!index.has(mmsi)) {
      index.set(mmsi, []);
    }
    index.get(mmsi)!.push({
      mmsi,
      timestamp: entry.timestamp,
      position: [entry.lon, entry.lat],
      heading: entry.heading,
      speed: entry.speed,
      status: entry.status,
    });
  }

  return index;
}

// Sync with CesiumJS clock
function syncAISTracksWithClock(
  viewer: Viewer,
  temporalIndex: Map<string, AISTemporalEntry[]>
) {
  const { TimeInterval, TimeIntervalCollection, JulianDate } = await import('cesium');

  for (const [mmsi, track] of temporalIndex.entries()) {
    const positions = track.map(entry => ({
      time: JulianDate.fromIso8601(entry.timestamp),
      position: Cartesian3.fromDegrees(entry.position[0], entry.position[1]),
    }));

    // Create sampled position property for smooth interpolation
    const sampledPosition = new SampledPositionProperty();
    for (const pos of positions) {
      sampledPosition.addSample(pos.time, pos.position);
    }

    // Create entity with temporal availability
    viewer.entities.add({
      id: `ais-${mmsi}`,
      position: sampledPosition,
      availability: new TimeIntervalCollection([
        new TimeInterval({
          start: positions[0].time,
          stop: positions[positions.length - 1].time,
        }),
      ]),
      // ... model, label config
    });
  }
}
```

---

## 5. Three-Tier Fallback

| Tier | AIS Source | 3D Source | Trigger |
|------|------------|-----------|---------|
| **LIVE** | AIS Hub API / Port TCP stream | Google 3D Tiles | All API keys present |
| **CACHED** | `api_cache` table (30s TTL) | Pre-cached 3D tiles subset | API rate-limited |
| **MOCK** | `public/mock/ais-cape-town.geojson` | MapLibre 2D + building extrusions | APIs unavailable |

```typescript
async function fetchMaritimeData(): Promise<{
  vessels: AISVessel[];
  terrain3D: Terrain3DData | null;
}> {
  // Fetch AIS data with fallback
  const vessels = await fetchWithFallback({
    live: () => fetchAISLiveData(),
    cached: () => fetchCachedAIS('ais', '/vessels?bbox=cape_town'),
    mock: () => fetch('/mock/ais-cape-town.geojson').then(r => r.json()),
  });

  // Fetch 3D terrain with fallback
  const terrain3D = await fetchWithFallback({
    live: () => fetchGoogle3DTiles(),
    cached: () => fetchCached3DTiles('cape_town_port'),
    mock: () => null,  // 2D fallback
  });

  return { vessels, terrain3D };
}
```

---

## 6. Data Source Badges

```
[AIS Hub · 2026 · LIVE|CACHED|MOCK]
[Google 3D Tiles · 2026 · LIVE|CACHED|MOCK]
```

Badge visibility: Bottom-right corner, stacked vertically.

Attribution requirements:
```
© Google | © OpenStreetMap contributors | © AIS Hub SA
```

---

## 7. Skeptical Expert Notes

### What Could Go Wrong

| Risk | Severity | Mitigation |
|------|----------|------------|
| **AIS data licensing unverified** — No formal evaluation of AIS sources for Cape Town | CRITICAL | Contact AIS Hub SA, MarineTraffic, or Port of Cape Town for commercial terms before Phase 2 |
| **Google 3D Tiles Cape Town coverage** — Street-level photorealistic tiles may not cover Table Bay harbor | HIGH | Test API before Phase 2: `https://tile.googleapis.com/v1/3d/tileMetadata` with harbor coords |
| **CesiumJS performance on mobile** — 3D terrain + AIS entities + buildings = heavy render load | HIGH | Detect mobile via `navigator.userAgent`; force 2D MapLibre-only mode; LOD management |
| **AIS data spoofing** — Vessels may transmit false MMSI/position data | MEDIUM | Display data quality indicator; cross-reference with multiple sources where available |
| **POPIA concerns for private vessels** — Pleasure craft tracking may reveal personal movements | MEDIUM | Aggregate private vessel data in guest mode; require authentication for detailed tracking |
| **Temporal alignment complexity** — AIS updates at 10s intervals, 3D terrain is static | LOW | Static 3D terrain doesn't require sync; only AIS entities need temporal interpolation |

### Required Skill Dependencies

Before implementing this task, the developer MUST read:

1. **`.claude/skills/opensky_flight_tracking/SKILL.md`** — Similar real-time tracking patterns (aviation → maritime adaptation)
2. **`.claude/skills/cesium_3d_tiles/SKILL.md`** — CesiumJS viewer configuration, Google 3D Tiles integration
3. **`.claude/skills/spatialintelligence_inspiration/SKILL.md`** — Multi-sensor fusion patterns, temporal controls
4. **`.claude/skills/spatial_validation/SKILL.md`** — CRS handling, Cape Town bounding box validation
5. **`.claude/skills/three_tier_fallback/SKILL.md`** — LIVE→CACHED→MOCK pattern for multiple data sources

### Technical Unknowns

- **AIS data source licensing** — `UNVERIFIED`. Must evaluate AIS Hub SA, MarineTraffic, or Port of Cape Town API terms.
- **Google 3D Tiles harbor coverage** — `UNVERIFIED`. May not include water surface or port infrastructure at street level.
- **Vessel 3D model availability** — No evaluated source for maritime vessel glTF models. May need to create or license.

---

## 8. Acceptance Criteria

- [ ] AIS data pipeline configured with rate limiting (≤100 req/day anonymous, ≤4000 authenticated) and caching (30s TTL)
- [ ] Cape Town bounding box filtering: `{west: 18.0, south: -34.5, east: 19.5, north: -33.0}`
- [ ] Three-tier fallback: LIVE API → `api_cache` → `public/mock/ais-cape-town.geojson`
- [ ] Google 3D Tiles loaded for Table Mountain + port area (lat: -33.91, lng: 18.41)
- [ ] CesiumJS vessel entities render with correct orientation (heading-based quaternion)
- [ ] Vessel labels display name, type, and speed (≤11px monospace, cyan fill)
- [ ] Data source badges visible: `[AIS Hub · 2026 · LIVE|CACHED|MOCK]` and `[Google 3D Tiles · 2026 · LIVE|CACHED|MOCK]`
- [ ] Temporal replay syncs vessel positions with CesiumJS clock (10s interpolation)
- [ ] Mobile fallback: MapLibre 2D with vessel point icons when CesiumJS unavailable
- [ ] POPIA annotation present (private vessel filtering in guest mode)
- [ ] Attribution includes `© Google | © OpenStreetMap contributors | © AIS Hub SA`

### Edge Cases & Failure Modes

| Scenario | Expected Behaviour |
|----------|-------------------|
| AIS API returns empty states array | Display "No vessels in range" message, keep 3D terrain visible |
| Vessel heading is NaN or missing | Default to 0° heading, display warning icon |
| Google 3D Tiles timeout (>10s) | Fall back to MapLibre 2D with building extrusions |
| AIS data spoofing (false MMSI) | Display data quality indicator, no auto-trust |
| Private vessel in guest mode | Aggregate to "X vessels in area" — no individual tracking |
| >500 vessels in viewport | Cluster markers, reduce label density |

---

## 9. Files to Create/Modify

```
app/src/components/cesium/
├── MaritimeFusion.tsx        # Main CesiumJS AIS + 3D terrain component
└── VesselEntity.tsx          # Individual vessel 3D model entity

app/src/components/map/
└── AISLayer.tsx              # MapLibre 2D AIS layer (fallback)

app/src/lib/
├── ais-api.ts                # AIS API client (AIS Hub, MarineTraffic)
├── terrain-3d-loader.ts      # Google 3D Tiles + SRTM fallback
├── ais-temporal-index.ts     # Temporal indexing for replay
└── vessel-models.ts          # 3D model registry by vessel type

public/mock/
├── ais-cape-town.geojson     # Mock AIS data for fallback
└── models/
    └── vessels/              # 3D vessel models (glTF/GLB)

app/sprites/
└── vessel-icon.png           # Vessel icon for MapLibre sprite sheet
```

---

## 10. Estimated Complexity

- **AIS API integration:** 2–3 days
- **Google 3D Tiles verification + integration:** 1–2 days
- **CesiumJS vessel entities:** 2–3 days
- **Temporal replay sync:** 2 days
- **Three-tier fallback:** 1–2 days
- **POPIA compliance (guest mode):** 1 day
- **Testing & validation:** 2–3 days

**Total:** ~11–16 days (Phase 2 sprint)

**Blocking:**
- AIS data source licensing must be verified before implementation.
- Google 3D Tiles Cape Town harbor coverage must be confirmed via API test.

---

*Generated by Antigravity Agent — Ralph Wiggum voice: "The boats and the mountain are having a shiny conversation!"*
