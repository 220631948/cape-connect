# Task M7: OpenSky Flight Tracking — CPT Airspace Data Pipeline

> **TL;DR:** Build real-time flight tracking for Cape Town airspace (FACT/CPT) using OpenSky Network API. Renders aircraft positions on MapLibre 2D (Phase 1) and CesiumJS 3D (Phase 2) with heading-rotated icons, callsign labels, and 30s polling. Requires OpenSky commercial licensing verification before multi-tenant deployment.

**Priority:** M7 (Phase 2)
**Status:** SCAFFOLDED — Requires License Verification
**Created:** 2026-03-05
**Updated:** 2026-03-05 (TL;DR, measurable criteria, edge cases added)
**Dependencies:** M4a (three-tier fallback), M3 (MapLibre basemap), ADR-009 (fallback pattern)
**Blocking:** OpenSky commercial licensing MUST be verified before multi-tenant deployment [ASSUMPTION — UNVERIFIED]

---

## 1. Objective

Build a real-time flight tracking layer for Cape Town airspace using OpenSky Network API, with proper rate limiting, caching, spatial filtering, and CesiumJS/MapLibre rendering.

---

## 2. Cape Town Domain Context

### Why Flight Tracking Matters

Cape Town International Airport (FACT/CPT) is the second-busiest airport in South Africa. The airspace over Cape Town includes:

- **Commercial aviation:** SAA, Airlink, FlySafair routes
- **Private aviation:** General aircraft, helicopters
- **Military:** AFB Ysterplaat operations
- **Emergency:** Medical evacuation helicopters, fire spotting aircraft
- **Cargo:** Freight operations

**Domain impact:**
| Domain | Use Case |
|--------|----------|
| **Aviation enthusiasts** | Real-time aircraft positions, flight history |
| **Journalists** | Track VIP movements, emergency response patterns |
| **Emergency responders** | Coordinate with air ambulance, fire spotting |
| **Logistics** | Cargo flight timing analysis |
| **Defense (aggregate only)** | Airspace activity patterns (not individual tracking) |

### POPIA Considerations

Flight data contains potentially identifiable information:
- **Callsigns** may identify specific pilots or private aircraft owners
- **Registration numbers** can link to owner records via SACAA database
- **Flight patterns** of private aircraft may reveal personal movements

**Mitigation strategy:**
- Display airline callsigns only (e.g., `SAA123`) in guest mode
- Aggregate private aviation data — no individual tracking for guests
- POPIA annotation required for any storage of flight crew identifiers

---

## 3. Data Pipeline Architecture

### 3.1 OpenSky API Configuration

```typescript
const OPENSKY_CONFIG = {
  baseUrl: 'https://opensky-network.org/api',
  endpoints: {
    states: '/states/all',      // Real-time aircraft states
    flights: '/flights/all',    // Historical flight data
    tracks: '/tracks/all',      // Full flight tracks
  },
  rateLimit: {
    anonymous: { requests: 100, window: 86400 },     // 100 requests/day
    authenticated: { requests: 4000, window: 86400 }, // 4000 requests/day
  },
  pollInterval: 10_000,  // 10 seconds minimum between polls
  timeout: 5000,         // 5 second request timeout
};
```

**Environment variables:**
```env
OPENSKY_USERNAME=your_username    # Optional, increases rate limit
OPENSKY_PASSWORD=your_password     # Optional, increases rate limit
```

### 3.2 Cape Town Bounding Box

```typescript
const CAPE_TOWN_AIRSPACE = {
  lamin: -34.5,   // south (latitude)
  lamax: -33.0,   // north (latitude)
  lomin: 18.0,    // west (longitude)
  lomax: 19.5,    // east (longitude)
  minAltitude: 0,     // metres (sea level)
  maxAltitude: 15000, // metres (~50,000 ft — typical commercial cruise)
};

// API URL construction
const url = `${OPENSKY_CONFIG.baseUrl}/states/all?` +
  `lamin=${CAPE_TOWN_AIRSPACE.lamin}&` +
  `lamax=${CAPE_TOWN_AIRSPACE.lamax}&` +
  `lomin=${CAPE_TOWN_AIRSPACE.lomin}&` +
  `lomax=${CAPE_TOWN_AIRSPACE.lomax}`;
```

### 3.3 API Response Schema

OpenSky returns aircraft states as arrays (positional):

```typescript
interface OpenSkyStateVector {
  icao24: string;           // Unique aircraft identifier (hex)
  callsign: string;         // Flight callsign (e.g., "SAA324")
  origin_country: string;   // Country of registration
  time_position: number;    // Unix timestamp of last position update
  last_contact: number;     // Unix timestamp of last communication
  longitude: number;        // WGS84 degrees
  latitude: number;         // WGS84 degrees
  baro_altitude: number;    // Barometric altitude (metres)
  on_ground: boolean;       // true if aircraft is on ground
  velocity: number;         // Ground speed (m/s)
  true_track: number;       // Heading (degrees, 0-360)
  vertical_rate: number;    // Climb/descent rate (m/s)
  sensors: number[];        // Sensor IDs (OpenSky network)
  geo_altitude: number;     // Geometric altitude (metres)
  squawk: string;           // Transponder code
  spi: boolean;             // Special Position Indicator
  position_source: number;  // 0=ADS-B, 1=AST, 2=TS, 3=UAT
  category: number;         // Aircraft category (A0-E7)
}

// API response structure
interface OpenSkyStatesResponse {
  time: number;             // Unix timestamp
  states: OpenSkyStateVector[];
}
```

### 3.4 Three-Tier Fallback

| Tier | Source | TTL | Trigger |
|------|--------|-----|---------|
| **LIVE** | OpenSky API | 30 seconds | Real-time polling |
| **CACHED** | `api_cache` table | 30 seconds | Rate limit approaching, use cached data |
| **MOCK** | `public/mock/flights-cape-town.geojson` | — | API unavailable |

```typescript
async function fetchFlightData(): Promise<OpenSkyStatesResponse> {
  // Check cache first
  const cached = await getCachedData('opensky', '/states/all?bbox=cape_town');
  if (cached && !isNearExpiry(cached, 30)) {
    return cached.response_body;
  }

  try {
    const response = await fetch(`${OPENSKY_CONFIG.baseUrl}/states/all?...`, {
      headers: OPENSKY_USERNAME ? {
        Authorization: `Basic ${btoa(`${OPENSKY_USERNAME}:${OPENSKY_PASSWORD}`)}`
      } : {},
    });

    if (response.status === 429) {
      // Rate limited — return cached data even if stale
      return getCachedData('opensky', '/states/all?bbox=cape_town');
    }

    const data = await response.json();

    // Cache with 30-second TTL
    await cacheData('opensky', '/states/all?bbox=cape_town', data, 30);

    return data;
  } catch (error) {
    // Fallback to mock data
    console.warn('OpenSky API failed, using mock data:', error);
    return fetch('/mock/flights-cape-town.geojson').then(r => r.json());
  }
}
```

---

## 4. Rendering Architecture

### 4.1 MapLibre 2D Layer (Phase 1)

```typescript
// app/src/components/map/FlightLayer.tsx
import { useEffect, useRef } from 'react';
import { Map, GeoJSONSource, CircleLayer, SymbolLayer } from 'maplibre-gl';

interface AircraftFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];  // [lng, lat]
  };
  properties: {
    icao24: string;
    callsign: string;
    origin_country: string;
    altitude: number;
    velocity: number;
    heading: number;
    on_ground: boolean;
  };
}

export function FlightLayer({ map }: { map: Map }) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add source
    map.addSource('opensky-flights', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
      buffer: 256,
      tolerance: 0.375,
    });

    // Aircraft icon layer — rotated by heading
    const aircraftIconLayer: SymbolLayer = {
      id: 'opensky-aircraft-icon',
      type: 'symbol',
      source: 'opensky-flights',
      layout: {
        iconImage: 'aircraft-icon',  // Must be loaded into map sprite
        iconSize: 1.0,
        iconRotate: ['get', 'heading'],
        iconAllowOverlap: true,
        iconIgnorePlacement: true,
        visibility: 'visible',
      },
      paint: {
        'icon-opacity': 0.9,
      },
    };

    // Callsign label layer
    const callsignLabel: SymbolLayer = {
      id: 'opensky-callsign-label',
      type: 'symbol',
      source: 'opensky-flights',
      layout: {
        textField: ['get', 'callsign'],
        textFont: ['Noto Sans Regular'],
        textSize: 11,
        textOffset: [0, 1.5],
        textAnchor: 'top',
      },
      paint: {
        'text-color': '#00d4ff',
        'text-halo-color': '#0a0a0f',
        'text-halo-width': 2,
      },
    };

    map.addLayer(aircraftIconLayer);
    map.addLayer(callsignLabel);

    // Poll for updates
    const pollInterval = setInterval(async () => {
      const data = await fetchFlightData();
      const features = data.states.map(toFeature);

      const source = map.getSource('opensky-flights') as GeoJSONSource;
      source.setData({
        type: 'FeatureCollection',
        features,
      });
    }, OPENSKY_CONFIG.pollInterval);

    return () => {
      clearInterval(pollInterval);
      map.removeLayer('opensky-aircraft-icon');
      map.removeLayer('opensky-callsign-label');
      map.removeSource('opensky-flights');
    };
  }, [map]);

  return null;
}

function toFeature(state: OpenSkyStateVector): AircraftFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [state.longitude, state.latitude],
    },
    properties: {
      icao24: state.icao24,
      callsign: state.callsign?.trim() || 'N/A',
      origin_country: state.origin_country,
      altitude: state.geo_altitude || state.baro_altitude,
      velocity: state.velocity,
      heading: state.true_track,
      on_ground: state.on_ground,
    },
  };
}
```

### 4.2 CesiumJS 3D Entities (Phase 2)

```typescript
// app/src/components/cesium/FlightEntities.tsx
import { Viewer, Entity, Cartesian3, LabelStyle } from 'cesium';

interface FlightEntityProps {
  viewer: Viewer;
  aircraft: OpenSkyStateVector;
}

export function FlightEntity({ viewer, aircraft }: FlightEntityProps) {
  useEffect(() => {
    const entity = viewer.entities.add({
      position: Cartesian3.fromDegrees(
        aircraft.longitude,
        aircraft.latitude,
        aircraft.geo_altitude || aircraft.baro_altitude
      ),
      orientation: computeOrientation(aircraft.true_track),
      model: {
        uri: '/models/aircraft.glb',
        scale: 0.5,
        minimumPixelSize: 32,
      },
      label: {
        text: aircraft.callsign?.trim() || 'N/A',
        font: '12px monospace',
        style: LabelStyle.FILL_AND_OUTLINE,
        fillColor: { red: 0, green: 212, blue: 255, alpha: 1 },
        outlineColor: { red: 0, green: 0, blue: 0, alpha: 1 },
        outlineWidth: 2,
        verticalOrigin: 1,  // TOP
        pixelOffset: { x: 0, y: 20 },
      },
      properties: {
        icao24: aircraft.icao24,
        origin_country: aircraft.origin_country,
        velocity: aircraft.velocity,
        on_ground: aircraft.on_ground,
      },
    });

    return () => {
      viewer.entities.remove(entity);
    };
  }, [viewer, aircraft]);

  return null;
}

function computeOrientation(heading: number): any {
  // Convert heading (degrees) to CesiumJS heading quaternion
  const { Math: CesiumMath, HeadingPitchRoll, Quaternion, Transforms } = await import('cesium');

  const hpr = new HeadingPitchRoll(
    CesiumMath.toRadians(heading),
    CesiumMath.toRadians(0),
    CesiumMath.toRadians(0)
  );

  return Quaternion.fromHeadingPitchRoll(hpr);
}
```

### 4.3 Zoom-Gated Visibility

```typescript
// Only show flight layer at appropriate zoom levels
const FLIGHT_LAYER_CONFIG = {
  minZoom: 6,   // Show flights when zoomed in to regional scale
  maxZoom: 18,  // Hide at very high zoom (clutter)
};

// MapLibre implementation
map.on('zoom', () => {
  const zoom = map.getZoom();
  const visibility = zoom >= FLIGHT_LAYER_CONFIG.minZoom &&
                     zoom <= FLIGHT_LAYER_CONFIG.maxZoom
    ? 'visible'
    : 'none';

  map.setLayoutProperty('opensky-aircraft-icon', 'visibility', visibility);
  map.setLayoutProperty('opensky-callsign-label', 'visibility', visibility);
});
```

---

## 5. Temporal Integration (4DGS)

Flight path data feeds into the 4DGS temporal replay pipeline:

```typescript
interface FlightTemporalEntry {
  icao24: string;
  timestamp: string;  // ISO 8601
  position: [number, number, number]; // [lng, lat, alt]
  heading: number;
  velocity: number;
  callsign?: string;
}

// Historical track reconstruction
async function fetchHistoricalTrack(icao24: string, time: number): Promise<FlightTemporalEntry[]> {
  const response = await fetch(
    `${OPENSKY_CONFIG.baseUrl}/tracks/all?icao24=${icao24}&time=${time}`
  );
  const data = await response.json();

  return data.path.map((point: any) => ({
    icao24,
    timestamp: new Date(point.time * 1000).toISOString(),
    position: [point.lng, point.lat, point.geo_altitude],
    heading: point.true_track,
    velocity: point.velocity,
  }));
}
```

---

## 6. Data Source Badge

```
[OpenSky Network · 2026 · LIVE|CACHED|MOCK]
```

Badge visibility: Bottom-right corner of map viewport.

---

## 7. POPIA Annotation

```typescript
/**
 * POPIA ANNOTATION
 * Personal data handled:
 *   - Aircraft callsigns (may identify specific pilots or private aircraft owners)
 *   - Registration numbers (linkable to owner records via SACAA)
 *   - Flight patterns (may reveal personal movements for private aircraft)
 * Purpose: Airspace visualization for urban planning and emergency response context
 * Lawful basis: Legitimate interests (public airspace data, ADS-B is publicly broadcast)
 * Retention:
 *   - Real-time data: Not persisted (ephemeral display only)
 *   - Cached data: 30 seconds TTL in api_cache table
 *   - Historical tracks: Only with explicit user action (saved searches)
 * Subject rights:
 *   - access ✓ (via OpenSky Network directly)
 *   - correction ✗ (source data: OpenSky — cannot modify)
 *   - deletion ✓ (cached data auto-expires)
 *   - objection ✓ (guest mode shows aggregate only)
 */
```

---

## 8. Skeptical Expert Notes

### What Could Go Wrong

| Risk | Severity | Mitigation |
|------|----------|------------|
| **OpenSky commercial licensing unverified** — Platform assumes OpenSky use in multi-tenant SaaS without confirmed license | CRITICAL | Contact OpenSky Network for commercial terms before Phase 2; budget for paid tier if required |
| **Rate limit exhaustion** — Anonymous: 100/day; Authenticated: 4000/day. Multi-tenant platform could exceed this | HIGH | Implement per-tenant rate limiting; aggregate requests across tenants; cache aggressively |
| **ADS-B coverage gaps** — OpenSky relies on volunteer ground stations. Cape Town coverage may be incomplete | MEDIUM | Fallback to alternative ADS-B sources (FlightRadar24 API, ADS-B Exchange); display coverage quality indicator |
| **CesiumJS bundle size** — Adding CesiumJS for 3D flight entities increases bundle by ~30–50 MB | HIGH | Lazy-load CesiumJS only when 3D mode enabled; MapLibre 2D fallback for mobile |
| **POPIA risk for private aircraft** — Individual tracking of private flights may violate POPIA | MEDIUM | Aggregate private aviation data in guest mode; require authentication for detailed tracking |
| **Data staleness** — 30-second cache TTL may show outdated positions during rapid aircraft movement | LOW | Display "Last updated: X seconds ago" indicator; increase poll frequency if rate limits allow |

### Required Skill Dependencies

Before implementing this task, the developer MUST read:

1. **`.claude/skills/opensky_flight_tracking/SKILL.md`** — OpenSky API configuration, Cape Town bounding box, caching strategy, CesiumJS rendering, POPIA compliance
2. **`.claude/skills/spatial_validation/SKILL.md`** — CRS handling, Cape Town bounding box validation
3. **`.claude/skills/three_tier_fallback/SKILL.md`** — LIVE→CACHED→MOCK pattern implementation
4. **`.claude/skills/popia_spatial_audit/SKILL.md`** — Extended POPIA compliance for spatial data

### Technical Unknowns

- **OpenSky commercial licensing** — `UNVERIFIED`. Must contact OpenSky Network before multi-tenant deployment.
- **Cape Town ADS-B coverage quality** — `UNVERIFIED`. Requires empirical testing with live API.
- **Alternative ADS-B sources** — FlightRadar24, ADS-B Exchange licensing and API terms not evaluated.

---

## 9. Acceptance Criteria

- [ ] OpenSky API client with rate limiting: anonymous ≤100 req/day, authenticated ≤4000 req/day
- [ ] Cape Town bounding box: `lamin=-34.5, lamax=-33.0, lomin=18.0, lomax=19.5`
- [ ] Three-tier fallback: LIVE API → `api_cache` (30s TTL) → `public/mock/flights-cape-town.geojson`
- [ ] MapLibre 2D layer with heading-rotated aircraft icons (`icon-rotate: ['get', 'heading']`)
- [ ] Callsign labels: 11px, cyan (#00d4ff) text, 2px dark halo
- [ ] Zoom-gated visibility: visible at zoom 6–18 only
- [ ] Data source badge: `[OpenSky Network · 2026 · LIVE|CACHED|MOCK]`
- [ ] POPIA annotation in file header with callsign/registration privacy assessment
- [ ] Guest mode: airline callsigns only, no private aircraft individual tracking
- [ ] Polling interval: 10s minimum between requests
- [ ] Rate limit 429 response: serve stale cache, exponential backoff (1s → 2s → 4s → max 30s)
- [ ] CesiumJS 3D entities (Phase 2) with altitude-aware positioning
- [ ] Historical track API integration for temporal replay

### Edge Cases & Failure Modes

| Scenario | Expected Behaviour |
|----------|-------------------|
| OpenSky returns 429 (rate limited) | Serve stale cache, backoff, badge shows `CACHED` |
| Aircraft position outside bbox | Filter out before rendering |
| Callsign is null/empty | Display "N/A", still show position icon |
| >200 aircraft in viewport | Performance-safe (GeoJSON source with buffer:256) |
| OpenSky API key missing | Use anonymous tier (100 req/day), warn in logs |
| Duplicate ICAO24 in response | Deduplicate, keep most recent timestamp |
| Aircraft on ground (`on_ground: true`) | Render with ground icon variant, lower opacity |

---

## 10. Files to Create/Modify

```
app/src/components/map/
├── FlightLayer.tsx             # MapLibre 2D flight tracking layer
└── aircraft-icon.svg           # Aircraft icon for MapLibre sprite

app/src/components/cesium/
└── FlightEntities.tsx          # CesiumJS 3D aircraft entities (Phase 2)

app/src/lib/
├── opensky-api.ts              # OpenSky API client with rate limiting
└── flight-data-transformer.ts  # OpenSky response → GeoJSON converter

app/src/hooks/
└── useLiveData.ts              # Three-tier fallback hook

public/mock/
└── flights-cape-town.geojson   # Mock flight data for fallback

app/sprites/
└── aircraft-icon.png           # Aircraft icon for MapLibre sprite sheet
```

---

## 11. Estimated Complexity

- **OpenSky API integration:** 1–2 days
- **MapLibre flight layer:** 2–3 days
- **Caching and rate limiting:** 1–2 days
- **POPIA compliance (guest mode filtering):** 1 day
- **CesiumJS 3D entities (Phase 2):** 2–3 days
- **Testing & fallback validation:** 1–2 days

**Total:** ~8–13 days (Phase 2 sprint)

**Blocking:** OpenSky commercial licensing must be verified before multi-tenant deployment.

---

*Generated by Antigravity Agent — Ralph Wiggum voice: "The airplanes know the secret time-castle codes!"*
