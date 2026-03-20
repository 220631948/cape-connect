---
name: three-tier-fallback
description: Guide for implementing the LIVE→CACHED→MOCK three-tier data fallback pattern required by CLAUDE.md Rule 2 and codified in ADR-009. Every external data component must implement this pattern so the map never shows a blank screen or raw error. Use this skill whenever the user is creating or editing a component that fetches data from any external API (CoCT ArcGIS, OpenSky, Overpass, CartoDB, AIS Maritime), adding a new data layer, implementing a data service function, adding the api_cache table, creating mock GeoJSON fallback data, or adding source badges to any data display. This is non-negotiable — invoke it proactively when touching data-fetching code.
---

# Three-Tier Fallback Implementation

## Purpose
Every external data component must follow the three-tier hierarchy: **LIVE** → **CACHED** (Supabase `api_cache`) → **MOCK** (`public/mock/*.geojson`). Never show a blank map or raw error. This skill enforces CLAUDE.md Rule 2.

## Trigger Condition
Invoke when creating any component that fetches data from an external API (ArcGIS REST, City of Cape Town ODP, Western Cape SDW).

## Procedure

### Step 1 — Identify Data Source
- What external API does this component call?
- Is it listed in `docs/API_STATUS.md`? If not, add it.
- What is the expected response format (GeoJSON, ArcGIS JSON, MVT)?

### Step 2 — Implement LIVE Tier
```typescript
// Tier 1: LIVE fetch
const liveData = await fetchFromAPI(endpoint);
if (liveData) {
  updateCache(cacheKey, liveData, TTL);
  return { data: liveData, source: 'LIVE', year: CURRENT_YEAR };
}
```

### Step 3 — Implement CACHED Tier
```typescript
// Tier 2: CACHED from Supabase api_cache
const cachedData = await supabase
  .from('api_cache')
  .select('data, cached_at')
  .eq('cache_key', cacheKey)
  .gt('expires_at', new Date().toISOString())
  .single();

if (cachedData) {
  return { data: cachedData.data, source: 'CACHED', year: extractYear(cachedData.cached_at) };
}
```

### Step 4 — Implement MOCK Tier
```typescript
// Tier 3: MOCK from static GeoJSON
const mockData = await import(`/public/mock/${layerName}.geojson`);
return { data: mockData, source: 'MOCK', year: 'STATIC' };
```

### Step 5 — Add Source Badge
Every data display must show the source badge (CLAUDE.md Rule 1):
```
[SOURCE_NAME · YEAR · LIVE|CACHED|MOCK]
```
Badge must be visible without hovering. Use the `DataSourceBadge` component.

### Step 6 — Verify Fallback Chain
Test each tier in isolation:
1. Disconnect from network → should fall through to CACHED or MOCK
2. Clear `api_cache` → should fall through to MOCK
3. Delete mock file → should show graceful error, never blank map

## Output Format
The data service function must return:
```typescript
interface DataResult<T> {
  data: T;
  source: 'LIVE' | 'CACHED' | 'MOCK';
  year: string;
  sourceName: string;
}
```

## When NOT to Use This Skill
- Basemap tiles (handled by MapLibre + PMTiles offline cache)
- Martin MVT tiles (separate tile-serving infrastructure)
- Static UI content with no external data dependency

---

## Generic Utility (ADR-009)

Use the `fetchWithFallback<T>` generic for all external data fetching — this is the canonical pattern from ADR-009:

```typescript
// lib/data/fetch-with-fallback.ts
async function fetchWithFallback<T>(config: {
  live: () => Promise<T>;
  cached: () => Promise<T | null>;
  mock: () => Promise<T>;
  source: string;
}): Promise<{ data: T; tier: 'LIVE' | 'CACHED' | 'MOCK' }> {
  // Tier 1: LIVE
  try {
    const data = await config.live();
    await cacheResponse(config.source, data); // write through to api_cache
    return { data, tier: 'LIVE' };
  } catch {
    // Tier 2: CACHED
    const cached = await config.cached();
    if (cached) return { data: cached, tier: 'CACHED' };
    // Tier 3: MOCK — never returns null; always renders data
    const mock = await config.mock();
    return { data: mock, tier: 'MOCK' };
  }
}

// Usage example
const { data, tier } = await fetchWithFallback({
  live: () => fetchCoCTZoning(bbox),
  cached: () => supabase.from('api_cache').select('response_body')
    .eq('source_name', 'coct-izs').gt('expires_at', new Date().toISOString())
    .single().then(r => r.data?.response_body ?? null),
  mock: () => import('@/public/mock/izs_zones.geojson'),
  source: 'coct-izs',
});
```

## Cache TTL Reference

| Layer | Source | Cache TTL |
|-------|--------|-----------|
| Cadastral Parcels | CoCT ArcGIS | 7 days |
| Zoning Overlay (IZS) | CoCT ArcGIS | 30 days |
| General Valuation (GV) | CoCT ODP (bulk) | 1 year |
| Flood/Risk Layers | WCG SDW | 30 days |
| Amenities (OSM) | Overpass API | 24 hours |
| OpenSky Flights | OpenSky Network | 30 seconds |

## Edge Cases (ADR-009)

| Scenario | Behaviour |
|----------|-----------|
| LIVE succeeds | Show data, update `api_cache`, badge shows `LIVE` |
| LIVE fails, cache fresh | Show cached data, badge shows `CACHED` |
| LIVE fails, cache stale | Show stale cache with staleness indicator |
| LIVE fails, cache empty | Show mock data, badge shows `MOCK` |
| Mock file missing | Log error, render empty layer (never crash) |
| Cache write fails | Continue serving LIVE data, log cache error |

## Prohibited Scenarios (DATA_LIFECYCLE.md)

- Building persistent offline archives of Google-restricted tiles
- Removing/obscuring required provider attribution while serving cached data
- Routing paid production traffic to OpenSky LIVE without commercial licensing (OQ-016)
