---
name: opensky-flight-tracking
description: Integrate OpenSky Network real-time flight data over Cape Town airspace.
---

# OpenSky Flight Tracking

Invoke when adding flight tracking, airspace visualization, or aviation data layers.

## Checklist

1. **Configure OpenSky API:** Base URL `https://opensky-network.org/api`. Rate limits: 100/day (anonymous), 4000/day (authenticated). Poll interval: ≥10 seconds. Use env vars `OPENSKY_USERNAME` / `OPENSKY_PASSWORD`.
2. **Filter by Cape Town Bounding Box:** `lamin=-34.5&lamax=-33.0&lomin=18.0&lomax=19.5`. Only fetch aircraft within Cape Town airspace.
3. **Cache in api_cache Table:** Insert responses with 30-second TTL. Three-tier fallback: LIVE (API) → CACHED (`api_cache`) → MOCK (`public/mock/flights-cape-town.geojson`).
4. **Render on CesiumJS:** Create entities for each aircraft with position, model (`/models/aircraft.glb`), callsign label, heading orientation. Include velocity and altitude in properties.
5. **Link to 4DGS Temporal Replay:** Historical tracks create 4D flight path visualisation. Sync flight timeline with 4DGS scene clock.
6. **POPIA Check:** Private aircraft registrations are HIGH risk (owner identification). Display airline callsigns only in guest mode. No individual tracking for guest users. Add POPIA annotation for flight crew data storage.

## Data Source Badge
`[OpenSky Network · 2026 · LIVE|CACHED|MOCK]`

## Output
- Flight data pipeline config, CesiumJS entity definitions, cache strategy, POPIA report.

## When NOT to Use
- Ground-only spatial analysis, static datasets, non-Cape Town airspace.
