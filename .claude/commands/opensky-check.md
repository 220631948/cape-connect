<!--
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
-->

# /opensky-check — OpenSky Network Integration Health

## Trigger
`/opensky-check` or "check flight data" or "verify OpenSky"

## What It Does
Verifies the health and compliance of the OpenSky Network REST API integration for live flight tracking over Cape Town airspace.

## Procedure
1. **Check API connectivity**
   - Verify `OPENSKY_API_URL` env var (default: `https://opensky-network.org/api`)
   - If authenticated: check `OPENSKY_USERNAME` and `OPENSKY_PASSWORD` exist in `.env`
   - Test `/states/all` endpoint with Cape Town bbox filter
   - Confirm response shape matches expected OpenSky state vector format
2. **Verify rate limiter config**
   - Anonymous: ≤ 10 requests/sec, ≤ 400 requests/day
   - Authenticated: ≤ 20 requests/sec, ≤ 4000 requests/day
   - Check rate limiter middleware is applied to OpenSky fetch functions
   - Verify exponential backoff on 429 responses
3. **Validate bounding box filter**
   - API calls must include Cape Town bbox: `lamin=-34.5&lomin=18.0&lamax=-33.0&lomax=19.5` (Rule 9)
   - Confirm no global flight data is fetched (bandwidth + POPIA)
   - Verify coordinate order matches OpenSky API spec (lat/lon, not lon/lat)
4. **Check api_cache table for flight data**
   - Query `api_cache` for `source = 'opensky'` entries
   - Verify cache TTL is appropriate (flight data: 10–30 seconds)
   - Confirm three-tier fallback: LIVE (API) → CACHED (`api_cache`) → MOCK (`public/mock/flights.geojson`) (Rule 2)
   - Check that stale cache entries are pruned
5. **Verify POPIA compliance for flight data**
   - Flight callsigns and ICAO24 addresses are NOT personal data — confirm no PII linkage
   - If any flight-to-operator mapping exists, verify POPIA annotation block (Rule 5)
   - Confirm guest users can see aggregate flight counts but not individual callsigns
   - Verify no flight data is persisted beyond cache TTL without consent

## Expected Output
```
OpenSky Network Health Check — [date]
=====================================
Mode: [anonymous | authenticated]

✅ PASSED:
  - API endpoint reachable: 200 OK (142ms)
  - Rate limiter: configured at 10 req/sec (anonymous)
  - Bounding box: Cape Town bbox correctly applied
  - api_cache: 23 cached flight states, oldest 28s ago
  - POPIA: no PII linkage detected in flight data

⚠️ WARNINGS:
  - Cache TTL set to 60s — consider reducing to 15s for live flight display
  - Mock fallback file public/mock/flights.geojson has 0 features
    → Add sample Cape Town flight data for offline mode

🚨 ERRORS:
  - OPENSKY_USERNAME present but OPENSKY_PASSWORD missing
    → Add both or remove both for anonymous mode
  - Rate limiter not applied to fetchFlightStates()
    → Wrap with rateLimiter middleware
```

## When NOT to Use
- For historical flight data analysis (OpenSky Trino API is a separate integration)
- When debugging MapLibre flight layer rendering (use `/validate-spatial`)
- On non-flight spatial data sources
