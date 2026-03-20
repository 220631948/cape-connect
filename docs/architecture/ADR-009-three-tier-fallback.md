# ADR 009: Three-Tier Data Fallback Pattern (LIVE → CACHED → MOCK)

> **TL;DR:** Every external data component must implement a mandatory three-tier fallback: LIVE API → Supabase `api_cache` → local mock GeoJSON. The map must never show a blank screen or error-only state. This is CLAUDE.md Rule 2 — non-negotiable.

**Status:** Accepted
**Date:** 2026-03-05
**Deciders:** Senior GIS Architect

## Context

The platform depends on multiple external APIs (CoCT ArcGIS, OpenSky, CartoDB, Overpass) that may be:
- Rate-limited or quota-exhausted
- Temporarily unavailable
- Blocked by network conditions (load-shedding, mobile connectivity)
- Slow to respond on constrained SA networks

A blank map or error screen destroys user trust and renders the platform useless for field operations.

## Decision Drivers

- **Reliability:** Map must always render meaningful content
- **User trust:** Users must see data, even if stale or mocked
- **Transparency:** Source badge shows exactly what data tier is active
- **Simplicity:** Single pattern for all external data — no per-service fallback logic

## Considered Options

1. **Error screen on API failure:** Simple but unacceptable (blank map)
2. **Cache-only fallback:** Better but no last resort when cache is cold
3. **Three-tier LIVE → CACHED → MOCK:** Comprehensive, always renders data

## Decision

Chosen option: **Three-tier fallback (LIVE → CACHED → MOCK)** as a mandatory pattern for every external data component.

### Pattern Implementation

```typescript
async function fetchWithFallback<T>(config: {
  live: () => Promise<T>;
  cached: () => Promise<T | null>;
  mock: () => Promise<T>;
  source: string;
}): Promise<{ data: T; tier: 'LIVE' | 'CACHED' | 'MOCK' }> {
  // Tier 1: LIVE
  try {
    const data = await config.live();
    await cacheResponse(config.source, data); // Update cache
    return { data, tier: 'LIVE' };
  } catch {
    // Tier 2: CACHED
    const cached = await config.cached();
    if (cached) return { data: cached, tier: 'CACHED' };
    // Tier 3: MOCK
    const mock = await config.mock();
    return { data: mock, tier: 'MOCK' };
  }
}
```

### Cache Table Schema

```sql
CREATE TABLE api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  source_name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  response_body JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, source_name, endpoint)
);

ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cache FORCE ROW LEVEL SECURITY;
```

### Source Badge Requirement

Every data display must show: `[SOURCE_NAME · YEAR · LIVE|CACHED|MOCK]`
- Badge must be visible without hovering (CLAUDE.md Rule 1)
- Tier indicator updates in real-time as fallback activates

### Mock Data Convention

- Location: `public/mock/*.geojson`
- Must contain representative Cape Town data within bounding box
- Must be valid GeoJSON with realistic property schemas
- One mock file per data source

## Consequences

- **Good:** Map always renders; transparent data quality; simple pattern
- **Bad:** Mock data must be maintained and kept realistic
- **Neutral:** Cache TTLs need tuning per data source

## Edge Cases & Failure Modes

| Scenario | Behaviour |
|----------|-----------|
| LIVE succeeds | Show data, update cache, badge shows `LIVE` |
| LIVE fails, cache fresh | Show cached data, badge shows `CACHED` |
| LIVE fails, cache stale | Show stale cache with "stale" indicator |
| LIVE fails, cache empty | Show mock data, badge shows `MOCK` |
| Mock file missing | Log error, render empty layer (never crash) |
| Cache write fails | Continue serving LIVE data, log cache error |

## Acceptance Criteria

- [ ] `fetchWithFallback()` utility implemented and used by all external data components
- [ ] `api_cache` table exists with `tenant_id`, `expires_at`, RLS enabled
- [ ] Source badge component renders `[SOURCE · YEAR · TIER]` visibly
- [ ] Mock GeoJSON files exist for: zoning, cadastral, suburbs, flights
- [ ] No component shows blank map or error-only screen on API failure
- [ ] Badge tier updates automatically when fallback activates
- [ ] Cache TTL configurable per source (default: 24h)

## M7 OpenSky Fallback Triggers

| Trigger | Tier Transition | Action |
|---------|----------------|--------|
| HTTP 429 (rate limit) | LIVE → CACHED | Serve stale cache; exponential backoff 1s→2s→4s→max 30s |
| HTTP 5xx (server error) | LIVE → CACHED | Immediate fallback; retry after 60s |
| Request timeout (>5s) | LIVE → CACHED | AbortController cancels; serve cache |
| Cache TTL expired (>30s) | CACHED → LIVE attempt | Refresh cycle; if LIVE fails → MOCK |
| Cache miss (cold start) | CACHED → MOCK | First load uses mock until LIVE succeeds |
| Network offline | LIVE → CACHED → MOCK | Progressive fallback; badge shows `MOCK` |

### OpenSky Cache TTL Extension Strategy

When rate limited (429), the cache TTL is extended by +60 seconds rather than letting it expire:
- Normal TTL: 30 seconds
- Rate-limited TTL: Extended to 90 seconds (30s base + 60s extension)
- This prevents cache miss → MOCK cascade during brief rate limit windows

### MOCK Trigger Conditions

The MOCK tier activates when ALL of:
- LIVE API returns error (4xx, 5xx, timeout, or network failure)
- Cache is empty OR expired AND rate limit prevents refresh

MOCK data (`public/mock/flights-cape-town.geojson`) must contain:
- ≥5 realistic Cape Town aircraft positions within FACT airspace
- Valid GeoJSON Point features with all required properties
- Airline callsigns (SAA, FA, 4Z format) for guest mode compatibility

---

*v1.0 · 2026-03-05 · Created during architecture documentation polish*
*v1.1 · 2026-03-11 · Added M7 OpenSky Fallback Triggers section (Unit 8)*
