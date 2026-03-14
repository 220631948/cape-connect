---
name: opensky-flight-tracking
description: Integrate OpenSky Network real-time flight data over Cape Town airspace.
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
---

# OpenSky Flight Tracking Skill

## Purpose
Integrate OpenSky Network real-time flight data over Cape Town airspace. Handles API configuration, spatial filtering, caching, CesiumJS rendering, and POPIA compliance for aviation data.

## Trigger
Invoke when:
- Adding flight tracking or airspace visualization layers
- Integrating real-time aviation data into the dashboard
- Building aircraft position overlays on CesiumJS or MapLibre
- Creating temporal replay of flight paths over Cape Town

## Procedure

### Step 1 — Configure OpenSky API with Rate Limiting
```typescript
const OPENSKY_CONFIG = {
  baseUrl: 'https://opensky-network.org/api',
  endpoints: {
    states: '/states/all',
    flights: '/flights/all',
    tracks: '/tracks/all',
  },
  rateLimit: {
    anonymous: { requests: 100, window: 86400 },    // 100/day
    authenticated: { requests: 4000, window: 86400 }, // 4000/day
  },
  pollInterval: 10_000, // 10 seconds minimum
};
```

- Use authenticated access where possible (env: `OPENSKY_USERNAME`, `OPENSKY_PASSWORD`)
- Implement exponential backoff on 429 responses
- Never exceed rate limits — cache aggressively

### Step 2 — Filter by Cape Town Bounding Box
```typescript
const CAPE_TOWN_AIRSPACE = {
  lamin: -34.5,  // south
  lamax: -33.0,  // north
  lomin: 18.0,   // west
  lomax: 19.5,   // east
};

const url = `${OPENSKY_CONFIG.baseUrl}/states/all?lamin=${CAPE_TOWN_AIRSPACE.lamin}&lamax=${CAPE_TOWN_AIRSPACE.lamax}&lomin=${CAPE_TOWN_AIRSPACE.lomin}&lomax=${CAPE_TOWN_AIRSPACE.lomax}`;
```

### Step 3 — Cache in api_cache Table
```sql
INSERT INTO api_cache (
  tenant_id, source, endpoint, response_body, fetched_at, expires_at
) VALUES (
  current_setting('app.current_tenant', TRUE)::uuid,
  'opensky',
  '/states/all?bbox=cape_town',
  $1::jsonb,
  NOW(),
  NOW() + INTERVAL '30 seconds'
);
```

Three-tier fallback:
1. **LIVE**: Real-time OpenSky API
2. **CACHED**: `api_cache` table (30-second TTL)
3. **MOCK**: `public/mock/flights-cape-town.geojson`

### Step 4 — Render Aircraft Positions on CesiumJS
```typescript
// CesiumJS entity for each aircraft
states.forEach((aircraft) => {
  viewer.entities.add({
    position: Cartesian3.fromDegrees(aircraft.longitude, aircraft.latitude, aircraft.baro_altitude),
    model: { uri: '/models/aircraft.glb', scale: 1.0 },
    label: {
      text: aircraft.callsign?.trim() || 'N/A',
      font: '12px monospace',
      style: LabelStyle.FILL_AND_OUTLINE,
    },
    orientation: /* heading from aircraft.true_track */,
    properties: {
      icao24: aircraft.icao24,
      origin_country: aircraft.origin_country,
      velocity: aircraft.velocity,
      on_ground: aircraft.on_ground,
    },
  });
});
```

### Step 5 — Link to 4DGS Temporal Replay
Flight path data feeds into the 4DGS temporal replay pipeline:
- Each aircraft position is a timestamped point
- Historical tracks create 4D flight path visualisation
- Sync flight timeline with 4DGS scene clock

```typescript
interface FlightTemporalEntry {
  icao24: string;
  timestamp: string;  // ISO 8601
  position: [number, number, number]; // lng, lat, alt
  heading: number;
  velocity: number;
}
```

### Step 6 — POPIA Check for Flight Crew Data
**Personal data risks in aviation data:**
- Callsigns may identify specific pilots or private aircraft owners
- Registration numbers can link to owner records
- Flight patterns of private aircraft may reveal personal movements

**Mitigations:**
- Display airline callsigns only (e.g., `SAA123`), not private registrations in guest mode
- Aggregate private aviation data — no individual tracking for guest users
- POPIA annotation required if storing flight crew identifiers

```typescript
/**
 * POPIA ANNOTATION
 * Personal data handled: Aircraft callsigns, registration numbers (potentially linkable to owners)
 * Purpose: Airspace visualization for urban planning context
 * Lawful basis: Legitimate interests (public airspace data)
 * Retention: 30 days (cached), real-time data not persisted
 * Subject rights: access ✓ | correction ✗ (source: OpenSky) | deletion ✓ | objection ✓
 */
```

## Output
- Flight data pipeline configuration (API settings, polling intervals)
- CesiumJS entity definitions for aircraft rendering
- Cache strategy (api_cache schema, TTL, fallback chain)
- POPIA compliance report for aviation data
- Data source badge: `[OpenSky Network · 2026 · LIVE|CACHED|MOCK]`

## When NOT to Use This Skill
- Ground-only spatial analysis (zoning, parcels, buildings)
- Static datasets without real-time component
- Historical aviation data analysis without live feed
- Non-Cape Town airspace (outside bounding box)
