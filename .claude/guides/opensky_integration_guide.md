---
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
---

# OpenSky Network Integration Guide

## OpenSky API Overview

### REST Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/states/all` | GET | All current state vectors |
| `/api/states/all?lamin=&lomin=&lamax=&lomax=` | GET | Filtered by bounding box |
| `/api/flights/all?begin=&end=` | GET | Historical flights in time range |
| `/api/flights/aircraft?icao24=&begin=&end=` | GET | Flights for specific aircraft |
| `/api/tracks/all?icao24=&time=` | GET | Track waypoints for a flight |

### Base URL
```
https://opensky-network.org
```

### Authentication
```env
# .env.local — optional but recommended for higher rate limits
OPENSKY_USERNAME=your_username
OPENSKY_PASSWORD=your_password
```

## Rate Limiting Strategy

| Access Level | Limit | Recommended Polling |
|-------------|-------|-------------------|
| Anonymous | 10 requests / 10 seconds | Every 10 seconds |
| Authenticated | ~100 requests / 10 seconds | Every 5 seconds |
| Data feed (advanced) | Higher, negotiated | Real-time WebSocket |

### Implementation
```typescript
const OPENSKY_POLL_INTERVAL = 10_000; // 10s for anonymous
const OPENSKY_AUTH_POLL_INTERVAL = 5_000; // 5s for authenticated

// Rate limiter
let lastRequest = 0;
async function fetchWithRateLimit(url: string) {
  const now = Date.now();
  const minInterval = hasCredentials()
    ? OPENSKY_AUTH_POLL_INTERVAL
    : OPENSKY_POLL_INTERVAL;
  const wait = Math.max(0, minInterval - (now - lastRequest));
  if (wait > 0) await sleep(wait);
  lastRequest = Date.now();
  return fetch(url);
}
```

## Cape Town Airspace Bounding Box

```typescript
// CLAUDE.md Rule 9 — Cape Town bounding box
const CAPE_TOWN_AIRSPACE = {
  lamin: -34.5,   // south
  lamax: -33.0,   // north
  lomin: 18.0,    // west
  lomax: 19.5,    // east
};

const statesUrl = new URL('https://opensky-network.org/api/states/all');
statesUrl.searchParams.set('lamin', String(CAPE_TOWN_AIRSPACE.lamin));
statesUrl.searchParams.set('lamax', String(CAPE_TOWN_AIRSPACE.lamax));
statesUrl.searchParams.set('lomin', String(CAPE_TOWN_AIRSPACE.lomin));
statesUrl.searchParams.set('lomax', String(CAPE_TOWN_AIRSPACE.lomax));
```

## Data Model

### StateVector
```typescript
interface StateVector {
  icao24: string;           // Unique ICAO 24-bit address (hex)
  callsign: string | null;  // Callsign (8 chars max)
  origin_country: string;   // Country of registration
  time_position: number;    // Unix timestamp of last position update
  last_contact: number;     // Unix timestamp of last contact
  longitude: number | null; // WGS-84 longitude (EPSG:4326)
  latitude: number | null;  // WGS-84 latitude (EPSG:4326)
  baro_altitude: number | null; // Barometric altitude (metres)
  on_ground: boolean;       // Whether aircraft is on ground
  velocity: number | null;  // Ground speed (m/s)
  true_track: number | null; // Track angle (degrees clockwise from north)
  vertical_rate: number | null; // Vertical rate (m/s)
  sensors: number[] | null; // Sensor IDs
  geo_altitude: number | null;  // Geometric altitude (metres)
  squawk: string | null;    // Transponder squawk code
  spi: boolean;             // Special Purpose Indicator
  position_source: number;  // 0=ADS-B, 1=ASTERIX, 2=MLAT, 3=FLARM
}

// Parse API response (array-based)
function parseStateVector(arr: any[]): StateVector {
  return {
    icao24: arr[0],
    callsign: arr[1]?.trim() || null,
    origin_country: arr[2],
    time_position: arr[3],
    last_contact: arr[4],
    longitude: arr[5],
    latitude: arr[6],
    baro_altitude: arr[7],
    on_ground: arr[8],
    velocity: arr[9],
    true_track: arr[10],
    vertical_rate: arr[11],
    sensors: arr[12],
    geo_altitude: arr[13],
    squawk: arr[14],
    spi: arr[15],
    position_source: arr[16],
  };
}
```

## Caching Strategy

### Three-Tier Fallback (CLAUDE.md Rule 2)
```
LIVE (OpenSky API) → CACHED (Supabase api_cache) → MOCK (public/mock/flights.geojson)
```

### Supabase `api_cache` Table
```sql
INSERT INTO api_cache (
  tenant_id, cache_key, data, fetched_at, ttl_seconds, source_name
) VALUES (
  current_setting('app.current_tenant', TRUE)::uuid,
  'opensky:cape_town:states',
  $1::jsonb,
  NOW(),
  5,                    -- 5-second TTL for live tracking
  'OpenSky Network'
);

-- Historical data uses longer TTL
INSERT INTO api_cache (cache_key, data, ttl_seconds, source_name)
VALUES ('opensky:cape_town:historical:2024-03-04', $1::jsonb, 3600, 'OpenSky Network');
```

### Refresh Intervals
| Data Type | TTL | Refresh |
|----------|-----|---------|
| Live state vectors | 5 seconds | Polling loop |
| Historical flights | 1 hour | On-demand |
| Aircraft metadata | 24 hours | Background job |
| Track waypoints | 1 hour | On first request |

### Data Source Badge
```typescript
<DataBadge
  source="OpenSky Network"
  year={new Date().getFullYear().toString()}
  status={isLive ? 'LIVE' : isCached ? 'CACHED' : 'MOCK'}
/>
```

## CesiumJS Rendering

### Aircraft Entities
```typescript
import { Entity, Cartesian3, HeadingPitchRoll, Transforms } from 'cesium';

function renderAircraft(viewer: Viewer, states: StateVector[]) {
  // Clear previous entities
  viewer.entities.removeAll();

  for (const sv of states) {
    if (!sv.longitude || !sv.latitude) continue;

    const position = Cartesian3.fromDegrees(
      sv.longitude,
      sv.latitude,
      sv.baro_altitude ?? 1000
    );

    viewer.entities.add({
      id: sv.icao24,
      position,
      model: {
        uri: '/models/aircraft.glb',
        minimumPixelSize: 24,
        scale: 1.0,
      },
      label: {
        text: sv.callsign || sv.icao24,
        font: '12px monospace',
        fillColor: Color.fromCssColorString('#4D9EFF'),
        style: LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: VerticalOrigin.BOTTOM,
        pixelOffset: new Cartesian2(0, -20),
        showBackground: true,
        backgroundColor: Color.fromCssColorString('#111118').withAlpha(0.8),
      },
      description: `
        <b>${sv.callsign || 'Unknown'}</b><br/>
        Origin: ${sv.origin_country}<br/>
        Altitude: ${sv.baro_altitude?.toFixed(0) ?? '?'} m<br/>
        Speed: ${sv.velocity?.toFixed(0) ?? '?'} m/s
      `,
    });
  }
}
```

### Flight Path Visualisation
```typescript
function renderFlightPath(viewer: Viewer, waypoints: Waypoint[]) {
  const positions = waypoints.map((wp) =>
    Cartesian3.fromDegrees(wp.longitude, wp.latitude, wp.altitude)
  );

  viewer.entities.add({
    polyline: {
      positions,
      width: 2,
      material: Color.fromCssColorString('#4D9EFF').withAlpha(0.7),
      clampToGround: false,
    },
  });
}
```

### Altitude Visualisation
```typescript
// Vertical lines from ground to aircraft altitude
function renderAltitudeLines(viewer: Viewer, states: StateVector[]) {
  for (const sv of states) {
    if (!sv.longitude || !sv.latitude || !sv.baro_altitude) continue;
    viewer.entities.add({
      polyline: {
        positions: [
          Cartesian3.fromDegrees(sv.longitude, sv.latitude, 0),
          Cartesian3.fromDegrees(sv.longitude, sv.latitude, sv.baro_altitude),
        ],
        width: 1,
        material: Color.fromCssColorString('#34D399').withAlpha(0.3),
      },
    });
  }
}
```

## Historical Flight Replay

### Link to 4DGS Temporal System
```typescript
// Sync with temporal slider (see spatialintelligence_patterns.md)
const useTemporalStore = useStore((s) => s.temporal);

useEffect(() => {
  if (useTemporalStore.isPlaying) {
    const interval = setInterval(async () => {
      const historicalStates = await fetchHistoricalStates(
        useTemporalStore.currentTime
      );
      renderAircraft(viewer, historicalStates);
    }, 1000 / useTemporalStore.playbackSpeed);
    return () => clearInterval(interval);
  }
}, [useTemporalStore.isPlaying, useTemporalStore.currentTime]);
```

## POPIA Considerations

```typescript
/**
 * POPIA ANNOTATION
 * Personal data handled: [aircraft registration, callsign, origin country]
 * Purpose: [airspace visualisation, flight tracking display]
 * Lawful basis: [legitimate interests — publicly broadcast ADS-B data]
 * Retention: [24 hours for live data, GV Roll period for historical]
 * Subject rights: [access ✓ | correction ✗ | deletion ✓ | objection ✓]
 */
```

### Private Aircraft Filtering
- Filter out military squawk codes (e.g., 7700, 7600, 7500 are emergency, not military)
- Consider filtering private/charter aircraft if operator requests removal
- Do NOT display crew names or personal details
- Guest users: show aircraft count only, not individual callsigns
