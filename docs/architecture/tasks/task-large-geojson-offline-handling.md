# Task: Large GeoJSON & Offline Handling — Architecture Stress Test Mitigations

> **TL;DR:** Three targeted mitigations prevent browser out-of-memory crashes and blank-map failures when GeoJSON responses exceed 5,000 features or when the device goes offline. Mitigation 1 enforces a hard client-side feature cutoff and queues PMTiles generation. Mitigation 2 applies AbortController timeouts and viewport-pruning to reduce feature count by 60–80% before render. Mitigation 3 defines offline-aware toast behaviour, badge transitions, and Dexie.js fallback for large cached files.

**Status:** DOCUMENTED — Awaiting Implementation
**Created:** 2026-03-11
**Updated:** 2026-03-11
**Milestone:** M4c (Serwist PWA + offline)
**Owner:** map-agent
**Dependencies:**
- ADR-007: Offline-First Architecture (Serwist + Dexie + PMTiles)
- ADR-009: Three-Tier Data Fallback Pattern (LIVE → CACHED → MOCK)
- `task-M7-opensky-flight-layer.md` — `useLiveData` hook referenced in Mitigation 1
- `CLAUDE.md` Rule 2 (Three-Tier Fallback), Rule 5 (POPIA), Rule 7 (File Size ≤ 300 lines)

---

## 1. Problem Statement

### The 50,000-Feature Scenario

The CapeTown GIS Hub requests GeoJSON from multiple sources: City of Cape Town ODP,
Western Cape Government Open Data Portal, and server-side PostGIS queries. Several of
these datasets can return **50,000 features or more** in a single response:

- Cadastral parcel layer (CCT): ~380,000 parcels city-wide
- Zoning overlay (IZS): ~95,000 zones
- Street network centrelines: ~120,000 segments
- Informal settlement boundaries: ~17,000 polygons

Loading a 50,000-feature FeatureCollection into a MapLibre `GeoJSONSource` on a
mid-range Android device (2 GB RAM, Chrome) causes the following failure cascade:

1. JSON parse stalls the main thread for 800 ms – 3 s
2. MapLibre tile generation allocates ~400 MB of heap
3. Browser OOM killer terminates the tab
4. User sees a blank white screen — **CLAUDE.md Rule 2 violation**

In the offline scenario, the same failure occurs if a stale 50,000-feature blob is
retrieved from IndexedDB and fed directly to MapLibre without guards.

**Stress test findings (internal simulation, 2026-03-11):**

| Feature count | Device class | Outcome |
|---|---|---|
| ≤ 5,000 | Low-end (2 GB) | ✅ Renders in < 600 ms |
| 5,001 – 20,000 | Low-end (2 GB) | ⚠️ 2–8 s stall, possible OOM |
| > 20,000 | Low-end (2 GB) | ❌ Tab crash (OOM) |
| ≤ 10,000 | Mid-range (4 GB) | ✅ Renders in < 1 s |
| > 50,000 | Mid-range (4 GB) | ❌ Tab crash (OOM) |

**Root cause:** MapLibre's `GeoJSONSource` processes features synchronously on the
main thread. There is no built-in streaming or pagination. Exceeding the safe feature
budget is a hard crash, not a graceful degradation.

---

## 2. Mitigation 1 — Hard Client-Side Feature Cutoff

### Rule

If a GeoJSON response contains **> 5,000 features**, the client-side render is rejected.
The request is instead queued for server-side PMTiles generation.

### Rationale

5,000 features is the empirically safe upper bound for the target device class (low-end
Android, 2 GB RAM). This aligns with CLAUDE.md §5 Map Rules:

> Max 10,000 GeoJSON features per client layer → switch to Martin MVT above.

The cutoff is set conservatively at 5,000 (half the stated limit) to account for:
- Multiple layers being loaded simultaneously
- React re-renders consuming additional heap
- Supabase response deserialization overhead

### User-Facing Behaviour

1. Feature count check fires in `useLiveData` hook **before** `setData()` is called
2. Toast notification: `"Large dataset detected. Generating optimized tiles..."`
3. Map source switches to MOCK data (`public/mock/<source>.geojson`) immediately
4. Background job queues server-side PMTiles generation (Supabase Storage, tenant-scoped bucket)
5. When PMTiles job completes, `useLiveData` receives webhook/poll signal and switches source to Martin MVT

### PMTiles Storage

Generated tiles are stored in Supabase Storage under:
```
buckets/<tenant_id>/pmtiles/<source_id>/<timestamp>.pmtiles
```

Tenant isolation enforced via RLS on the `storage.objects` table. PMTiles URL is
served through Martin tile server or directly from Supabase Storage CDN.

### Code Pattern

Check feature count in `useLiveData` hook BEFORE calling `setData()` on the GeoJSON source:

```typescript
// app/src/hooks/useLiveData.ts
const CLIENT_FEATURE_LIMIT = 5_000;

async function loadGeoJSONSource(
  sourceId: string,
  features: GeoJSON.Feature[],
  map: maplibregl.Map
): Promise<void> {
  if (features.length > CLIENT_FEATURE_LIMIT) {
    console.warn(
      `[GeoJSON] Feature count ${features.length} exceeds client limit ` +
      `(${CLIENT_FEATURE_LIMIT}). Queuing PMTiles.`
    );
    toast.warn('Large dataset detected. Generating optimized tiles...');
    await queuePMTilesGeneration(sourceId, features);
    return; // Do NOT load to client — abort before setData()
  }

  const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
  source.setData({
    type: 'FeatureCollection',
    features,
  });
}
```

### `queuePMTilesGeneration` Signature

```typescript
// app/src/lib/pmtiles-queue.ts
export async function queuePMTilesGeneration(
  sourceId: string,
  features: GeoJSON.Feature[]
): Promise<void> {
  // POST to Next.js API route — never expose service role key to client
  await fetch('/api/tiles/queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId, featureCount: features.length }),
  });
  // The API route writes a job record to Supabase; Martin picks it up
}
```

> **Note:** The actual GeoJSON payload is NOT sent to the API route. Only metadata
> is sent. The server-side job reads from the canonical data source directly to avoid
> double-transmitting a large payload.

---

## 3. Mitigation 2 — AbortController + Viewport Pruning

### Pattern

All GeoJSON fetches use `AbortController` with a **10-second timeout**. Before loading
features into MapLibre, they are filtered to only those within the current map viewport
expanded by a 20% buffer. This reduces client-side feature count by typically **60–80%**
for large, city-wide datasets.

### Rationale

A 10-second timeout prevents hanging network requests from blocking the fallback chain.
If the LIVE tier does not respond within 10 s, the hook falls through to CACHED, then
MOCK — satisfying CLAUDE.md Rule 2 without a blank map.

Viewport pruning reduces the feature count that reaches the cutoff check in Mitigation 1.
Even if a dataset contains 50,000 features city-wide, only 2,000–5,000 are visible
within a typical zoom-11 viewport. Pruning those before rendering:
- Reduces MapLibre heap allocation
- Reduces JSON serialisation overhead on `source.setData()`
- Keeps feature count below the 5,000-feature hard cutoff for most viewport states

### `expandBbox` Helper

```typescript
// app/src/lib/geo-utils.ts
import type { LngLatBounds } from 'maplibre-gl';

/**
 * Expand a MapLibre LngLatBounds by a fractional buffer factor.
 * buffer = 0.2 → 20% expansion on each side.
 */
export function expandBbox(
  bounds: LngLatBounds,
  buffer: number
): GeoJSON.BBox {
  const w = bounds.getEast() - bounds.getWest();
  const h = bounds.getNorth() - bounds.getSouth();

  return [
    bounds.getWest()  - w * buffer,  // west
    bounds.getSouth() - h * buffer,  // south
    bounds.getEast()  + w * buffer,  // east
    bounds.getNorth() + h * buffer,  // north
  ];
}
```

### Code Pattern

```typescript
// app/src/hooks/useLiveData.ts
import * as turf from '@turf/turf';
import { expandBbox } from '@/lib/geo-utils';

const FETCH_TIMEOUT_MS = 10_000;

async function fetchWithViewportPruning(
  url: string,
  map: maplibregl.Map
): Promise<GeoJSON.Feature[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const geojson: GeoJSON.FeatureCollection = await response.json();

    // Viewport pruning — filter to current viewport + 20% buffer
    const viewport   = map.getBounds();
    const bboxArr    = expandBbox(viewport, 0.2); // [w, s, e, n]
    const bboxPoly   = turf.bboxPolygon(bboxArr);

    const prunedFeatures = geojson.features.filter((f) =>
      turf.booleanIntersects(f, bboxPoly)
    );

    console.debug(
      `[ViewportPrune] ${geojson.features.length} → ${prunedFeatures.length} features ` +
      `(${Math.round((1 - prunedFeatures.length / geojson.features.length) * 100)}% reduction)`
    );

    return prunedFeatures;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### Abort Error Handling

When `controller.abort()` fires (10 s timeout):
- `fetch()` throws `DOMException: AbortError`
- `useLiveData` catches this and falls through to the CACHED tier
- If CACHED is also stale or absent, falls through to MOCK

```typescript
try {
  const features = await fetchWithViewportPruning(url, map);
  await loadGeoJSONSource(sourceId, features, map);
} catch (err) {
  if ((err as DOMException).name === 'AbortError') {
    console.warn(`[Fetch] Timeout after ${FETCH_TIMEOUT_MS}ms — falling back to CACHED`);
    setTier('CACHED');
    await loadFromCache(sourceId, map);
  } else {
    throw err; // Re-throw unexpected errors
  }
}
```

### Interaction with Mitigation 1

The pruned feature array is what reaches Mitigation 1's count check. In typical usage:

```
Raw API response:  50,000 features (full city dataset)
After viewport pruning: ~4,500 features (zoom 11, 20% buffer)
Mitigation 1 check: 4,500 < 5,000 ✅ → loads to MapLibre
```

However, at low zoom levels (entire city visible), pruning may not reduce enough:

```
Raw API response:  50,000 features
After viewport pruning: ~48,000 features (zoom 8, full extent)
Mitigation 1 check: 48,000 > 5,000 ❌ → PMTiles queue triggered
```

This is the intended behaviour: low-zoom, full-city views are served by Martin MVT,
not client-side GeoJSON.

---

## 4. Mitigation 3 — Offline Warning Toast Behaviour

### Network State Detection

The app listens to two complementary APIs:

```typescript
// app/src/hooks/useNetworkState.ts
export function useNetworkState() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
```

The Network Information API (`navigator.connection`) provides additional signal (effective
connection type, downlink) but is not universally supported. `navigator.onLine` is the
authoritative source; Network Information API supplements it where available.

### Toast Behaviour

| Network event | Toast message | Badge transition | LIVE tier |
|---|---|---|---|
| Goes offline | `"You're offline — showing cached data"` | `LIVE` → `CACHED` or `MOCK` | Suppressed |
| Returns online | `"Connection restored — refreshing data"` | `CACHED/MOCK` → `LIVE` | Triggered |

**Badge visibility:** CLAUDE.md Rule 1 — badge must be visible without hovering. The
`CACHED` or `MOCK` badge replaces `LIVE` immediately on offline detection. No badge
flash or delay is acceptable.

**LIVE suppression:** While offline, `useLiveData` skips the LIVE fetch entirely to
avoid a flood of failed network requests that would:
- Fill the browser's DevTools error console
- Trigger Sentry error events for non-actionable failures
- Drain mobile battery via repeated TCP connection attempts

```typescript
// app/src/hooks/useLiveData.ts
const { isOnline } = useNetworkState();

async function fetchTieredData(sourceId: string): Promise<DataTier> {
  // Skip LIVE tier entirely when offline — go straight to CACHED
  if (isOnline) {
    try {
      const features = await fetchWithViewportPruning(liveUrl, map);
      await loadGeoJSONSource(sourceId, features, map);
      return 'LIVE';
    } catch (err) {
      console.warn(`[LIVE] fetch failed for ${sourceId}:`, err);
    }
  } else {
    console.info(`[LIVE] Skipping — device is offline`);
  }

  // CACHED tier
  const cached = await loadFromCache(sourceId, map);
  if (cached) return 'CACHED';

  // MOCK tier — never fails (CLAUDE.md Rule 2)
  await loadMockData(sourceId, map);
  return 'MOCK';
}
```

### PWA Behaviour (Serwist)

The Serwist service worker (ADR-007) caches API responses using a
`NetworkFirst` strategy with a 10-second timeout. When offline:

1. Serwist intercepts the `fetch()` call
2. Returns the cached response from Cache Storage
3. `useLiveData` receives a valid response — no special handling needed

The `useLiveData` hook's offline detection layer is a **belt-and-suspenders** guard for:
- Datasets not yet cached by Serwist (first visit offline)
- Cache entries that have expired (TTL > cache age)
- Service worker not yet registered (first page load)

### Dexie.js for Large Cached Files (> 5 MB)

The Cache API (used by Serwist) has per-origin storage limits. Large GeoJSON files
(cadastral parcels, full zoning dataset) can exceed 5 MB per response. These are
stored in IndexedDB via Dexie.js instead of Cache Storage.

**Threshold:** If the serialised GeoJSON response body > 5 MB, route to Dexie.js.

```typescript
// app/src/lib/offline-cache.ts
import Dexie from 'dexie';

const LARGE_FILE_THRESHOLD_BYTES = 5 * 1024 * 1024; // 5 MB

class OfflineCache extends Dexie {
  geojsonCache!: Dexie.Table<{ key: string; data: string; cachedAt: number }, string>;

  constructor() {
    super('capegis-offline');
    this.version(1).stores({ geojsonCache: 'key, cachedAt' });
  }
}

const db = new OfflineCache();

export async function cacheGeoJSON(key: string, data: object): Promise<void> {
  const serialised = JSON.stringify(data);

  if (serialised.length > LARGE_FILE_THRESHOLD_BYTES) {
    // Large file — use IndexedDB (Dexie.js)
    await db.geojsonCache.put({ key, data: serialised, cachedAt: Date.now() });
    console.debug(`[OfflineCache] Stored ${key} in IndexedDB (${(serialised.length / 1024 / 1024).toFixed(1)} MB)`);
  } else {
    // Small file — use Cache API (Serwist handles automatically)
    // No action needed; Serwist intercepts and caches the response
  }
}

export async function loadCachedGeoJSON(key: string): Promise<object | null> {
  const record = await db.geojsonCache.get(key);
  if (!record) return null;
  return JSON.parse(record.data);
}
```

**Cache eviction:** Dexie.js records older than 24 hours are evicted on app startup.
This prevents IndexedDB bloat on long-running sessions.

---

## 5. Implementation Order

Implement in the following sequence to minimise rework and ensure test coverage builds
incrementally on stable foundations:

### Phase 1 — Network State & Toast (Mitigation 3 first)
Rationale: Establishes `useNetworkState` hook and toast infrastructure used by all
three mitigations. Easiest to test independently with browser DevTools → offline toggle.

1. Implement `useNetworkState` hook (`app/src/hooks/useNetworkState.ts`)
2. Integrate into `useLiveData` — add LIVE suppression when offline
3. Wire toast notifications for `online`/`offline` events
4. Implement badge transition logic (`LIVE` → `CACHED`/`MOCK`)
5. Implement Dexie.js large-file cache (`app/src/lib/offline-cache.ts`)

### Phase 2 — AbortController + Viewport Pruning (Mitigation 2)
Rationale: Reduces feature counts before they reach the cutoff check. Must be in place
before the cutoff check is added to avoid false positives on prunable datasets.

6. Implement `expandBbox` helper (`app/src/lib/geo-utils.ts`)
7. Wrap all `useLiveData` fetches with `AbortController` + 10 s timeout
8. Apply Turf.js `booleanIntersects` viewport filter
9. Add debug logging of pre/post pruning counts

### Phase 3 — Hard Feature Cutoff + PMTiles Queue (Mitigation 1)
Rationale: Depends on Mitigation 2 being in place (pruning reduces false positives).
Also requires the PMTiles queue API route to be deployed.

10. Add `CLIENT_FEATURE_LIMIT` constant check in `loadGeoJSONSource`
11. Implement `queuePMTilesGeneration` client function
12. Implement `/api/tiles/queue` Next.js API route
13. Wire PMTiles-ready signal back to `useLiveData` (poll or Supabase Realtime)

---

## 6. Testing Approach

### Unit Tests

| Test | Assertion |
|---|---|
| `expandBbox(bounds, 0.2)` | Returns bbox 20% larger than input on each side |
| `fetchWithViewportPruning` — large dataset | Returns ≤ original feature count |
| `loadGeoJSONSource` — 4,999 features | Calls `source.setData()` |
| `loadGeoJSONSource` — 5,001 features | Does NOT call `source.setData()`; calls `queuePMTilesGeneration` |
| `cacheGeoJSON` — 6 MB payload | Writes to IndexedDB (Dexie.js), not Cache API |
| `cacheGeoJSON` — 2 MB payload | Does NOT write to IndexedDB |

### Integration Tests (Jest + MSW)

| Scenario | Expected outcome |
|---|---|
| API returns 50,000-feature GeoJSON | Toast shown; PMTiles queued; MOCK data on map |
| API times out after 10 s | AbortError caught; CACHED tier loaded; badge = `CACHED` |
| Device goes offline mid-session | LIVE skipped; CACHED served; badge = `CACHED` |
| Device returns online | LIVE fetch triggered; badge = `LIVE` |
| Offline + no cache | MOCK data served; badge = `MOCK`; no blank map |

### Manual Test — Offline Simulation

1. Open app, load a data layer (LIVE tier confirmed)
2. DevTools → Network → Offline
3. Verify: toast `"You're offline — showing cached data"` appears within 500 ms
4. Verify: badge transitions from `LIVE` to `CACHED` or `MOCK`
5. Verify: map still shows data (not blank)
6. DevTools → Network → Online
7. Verify: toast `"Connection restored — refreshing data"` appears
8. Verify: badge returns to `LIVE`

### Performance Benchmark

Run on a low-end device simulator (Chrome DevTools → CPU throttle 4×, 2 GB memory cap):

| Scenario | Target |
|---|---|
| 5,000-feature load time | < 600 ms to first render |
| 50,000-feature response (PMTiles path) | Toast < 200 ms; map shows MOCK < 400 ms |
| AbortController timeout fires | Fallback to CACHED within 10,200 ms total |

---

## 7. Acceptance Criteria

- [ ] **AC-1:** GeoJSON responses with > 5,000 features never call `source.setData()`. `queuePMTilesGeneration` is called instead, and a toast notification is shown.
- [ ] **AC-2:** All GeoJSON fetches are wrapped in `AbortController` with a 10-second timeout. On timeout, the hook falls through to CACHED tier (no blank map, no unhandled promise rejection).
- [ ] **AC-3:** Viewport pruning reduces feature count by ≥ 60% for a city-wide dataset at zoom level 11 in the Cape Town bounding box.
- [ ] **AC-4:** When `navigator.onLine` transitions to `false`, LIVE fetches are suppressed immediately and the data source badge changes to `CACHED` or `MOCK` without requiring a page reload.
- [ ] **AC-5:** When `navigator.onLine` transitions to `true`, LIVE fetches resume and the badge updates to `LIVE` within one polling interval.
- [ ] **AC-6:** GeoJSON payloads > 5 MB are stored in IndexedDB (Dexie.js), not Cache API. Payloads ≤ 5 MB are handled by Serwist Cache API.
- [ ] **AC-7:** The MOCK tier is always available as a last resort. No scenario produces a blank map or unhandled error in place of MOCK data (CLAUDE.md Rule 2).
- [ ] **AC-8:** The data source badge is visible at all times without user interaction (CLAUDE.md Rule 1). It reflects the active tier: `LIVE`, `CACHED`, or `MOCK`.
- [ ] **AC-9:** PMTiles are stored in the tenant-scoped Supabase Storage bucket (`<tenant_id>/pmtiles/...`) with RLS enforced.
- [ ] **AC-10:** All new files are ≤ 300 lines (CLAUDE.md Rule 7). Hooks exceeding this limit are split by responsibility.

---

## 8. Related Files

### Files to Create

```
app/src/hooks/
├── useNetworkState.ts           # navigator.onLine listener + Network Information API
└── useLiveData.ts               # Three-tier fallback hook (update: add Mitigation 1, 2, 3)

app/src/lib/
├── geo-utils.ts                 # expandBbox, bboxPolygon helpers
├── offline-cache.ts             # Dexie.js large-file cache (> 5 MB)
└── pmtiles-queue.ts             # queuePMTilesGeneration client function

app/src/app/api/tiles/
└── queue/route.ts               # Next.js API route — accepts PMTiles queue job
```

### Files to Update

```
app/src/hooks/useLiveData.ts     # Add cutoff check, AbortController, offline guard
app/src/components/map/          # Data source badge component — add tier-reactive display
```

### Mock Data Required

```
public/mock/<source>.geojson     # One MOCK file per data source (pre-existing requirement)
```

---

## 9. Related ADRs

| ADR | Relevance |
|---|---|
| `ADR-007-offline-first.md` | Serwist + Dexie.js offline architecture — foundational dependency |
| `ADR-009-three-tier-fallback.md` | LIVE → CACHED → MOCK pattern — Mitigation 3 extends this |

---

## 10. Open Questions

- **OQ-1:** Should the PMTiles generation job be fire-and-forget, or should the UI poll
  for completion and auto-switch from MOCK to MVT when ready?
- **OQ-2:** What is the maximum acceptable PMTiles generation time before a user
  abandons the session? (Hypothesis: 30 s — needs user research.)
- **OQ-3:** Should viewport pruning be applied to CACHED tier data as well, or only LIVE?
  (Pruning cached data may cause visible "pop-in" on pan.)
- **OQ-4:** Dexie.js cache eviction: 24-hour TTL is assumed. Should this be
  configurable per tenant via `tenant_settings`?

Record resolutions in `docs/OPEN_QUESTIONS.md` (OQ prefix, sequential numbering).

---

*Unit 12 — M7 batch · Architecture Stress Test Mitigations · 2026-03-11*
