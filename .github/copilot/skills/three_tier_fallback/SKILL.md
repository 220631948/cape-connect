---
name: three-tier-fallback
description: Guide for implementing the LIVE→CACHED→MOCK three-tier data fallback pattern required by CLAUDE.md Rule 2.
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
