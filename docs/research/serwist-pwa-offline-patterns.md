# Serwist PWA & Offline Patterns for Next.js 15

> **TL;DR:** Serwist (the maintained Workbox fork for Next.js) provides the service worker lifecycle for capegis PWA. Key patterns: precache the App Shell + critical map tiles, runtime-cache API responses to Supabase `api_cache` via IndexedDB (Dexie.js), serve PMTiles from Cache Storage for offline basemap. Background sync queues spatial edits for reconnection. The three-tier fallback (LIVE→CACHED→MOCK) maps directly to `NetworkFirst` → `StaleWhileRevalidate` → `CacheOnly` Workbox strategies.
>
> **Roadmap Relevance:** M2 (Tile Pipeline) — PMTiles offline caching. M4 (Offline/PWA) — full service worker lifecycle, Dexie.js sync, background sync queues.

---

## 1. Why Serwist (Not raw Workbox)

| Criterion | Serwist | Raw Workbox |
|-----------|---------|-------------|
| Next.js 15 App Router support | `[VERIFIED]` First-class `@serwist/next` plugin | Manual webpack config required |
| Maintained | Active (2024–present fork of `next-pwa`) | Google-maintained but no Next.js integration |
| RSC compatibility | Handles server component routes | Requires custom routing logic |
| Config location | `serwist.config.ts` at project root | `next.config.js` webpack override |

**Key dependency:** `@serwist/next` ^9.x — `[VERIFIED]` compatible with Next.js 15.

---

## 2. Service Worker Lifecycle

```
Install → Precache App Shell + critical assets
Activate → Clean old caches, claim clients
Fetch → Route-based strategy selection
```

### Precache manifest (generated at build)
- HTML shell for `/`, `/map`, `/dashboard`
- CSS + JS chunks (Tailwind, MapLibre GL JS)
- Critical fonts (Inter/system stack)
- `public/mock/*.geojson` (MOCK tier fallback data)

### Runtime caching strategies

| URL pattern | Strategy | Cache name | Max entries | Max age |
|------------|----------|------------|-------------|---------|
| `/api/*` (Supabase proxy) | `NetworkFirst` | `api-cache` | 200 | 24h |
| `*.pmtiles` | `CacheFirst` | `tile-cache` | 50 files | 7d |
| Martin MVT `/{z}/{x}/{y}.pbf` | `StaleWhileRevalidate` | `mvt-cache` | 5000 | 1h |
| Google Fonts / CDN | `StaleWhileRevalidate` | `cdn-cache` | 30 | 30d |
| `/mock/*.geojson` | `CacheFirst` | `mock-cache` | 50 | ∞ |

---

## 3. Dexie.js IndexedDB Schema

```typescript
// db.ts
import Dexie from 'dexie';

const db = new Dexie('capegis-offline');
db.version(1).stores({
  apiCache: '++id, url, tenantId, cachedAt, expiresAt',
  pendingEdits: '++id, featureId, editType, payload, createdAt, synced',
  tileMetadata: 'url, etag, lastFetched, sizeBytes',
  savedSearches: '++id, tenantId, query, geometry, createdAt',
});
```

`[VERIFIED]` Dexie.js v4+ supports live queries with `useLiveQuery()` React hook.

---

## 4. Three-Tier Fallback Mapping

```
LIVE  → NetworkFirst strategy → fetch from Supabase/Martin
  ↓ (network fail)
CACHED → Read from Dexie.js apiCache table or Cache Storage
  ↓ (cache miss)
MOCK  → CacheFirst on /public/mock/*.geojson (precached at install)
```

The data source badge updates automatically:
- `[SOURCE · YEAR · LIVE]` when NetworkFirst succeeds
- `[SOURCE · YEAR · CACHED]` when served from IndexedDB/Cache Storage
- `[SOURCE · YEAR · MOCK]` when falling back to precached mock data

---

## 5. PMTiles Offline Strategy

PMTiles (Protomaps) stores an entire tileset in a single file with HTTP range requests.

| Approach | Pros | Cons |
|----------|------|------|
| Full file in Cache Storage | True offline | Cape Town extract ~50–200 MB |
| Range-request caching | Only cache viewed tiles | Partial coverage offline |
| Hybrid: precache z0–z12, range z13+ | Good baseline + detail on demand | Complex cache logic |

**Recommended:** Hybrid approach. Precache Cape Town bounding box at z0–z12 (~15 MB), cache z13+ on demand.

`[ASSUMPTION — UNVERIFIED]` Cape Town PMTiles extract at z0–z12 is approximately 15 MB. Actual size depends on source data density and Tippecanoe simplification settings.

---

## 6. Background Sync for Spatial Edits

```typescript
// Register background sync
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  const reg = await navigator.serviceWorker.ready;
  await reg.sync.register('pending-spatial-edits');
}

// In service worker
self.addEventListener('sync', (event) => {
  if (event.tag === 'pending-spatial-edits') {
    event.waitUntil(syncPendingEdits());
  }
});
```

`[ASSUMPTION — UNVERIFIED]` Background Sync API is supported in Chromium browsers but not Firefox/Safari as of 2025. Fallback: poll on `navigator.onLine` change events.

---

## 7. Security Considerations

- Service worker scope: `/` (whole app)
- Never cache responses containing `SUPABASE_SERVICE_ROLE_KEY`
- Tenant isolation: IndexedDB databases are origin-scoped (subdomain tenants get separate stores)
- Clear all caches on logout: `caches.keys().then(keys => keys.forEach(k => caches.delete(k)))`
- POPIA: no personal data in precache manifest; only cache PII-containing responses with user consent

---

## 8. Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@serwist/next` | ^9.x | Next.js 15 service worker integration |
| `serwist` | ^9.x | Core service worker runtime |
| `dexie` | ^4.x | IndexedDB wrapper with React hooks |
| `dexie-react-hooks` | ^1.x | `useLiveQuery()` for reactive offline data |
| `pmtiles` | ^3.x | PMTiles reader for MapLibre |

---

## 9. Open Questions

- [ ] What is the actual PMTiles file size for Cape Town at z0–z12 with OSM data?
- [ ] Should we implement Periodic Background Sync for tile updates (requires permission)?
- [ ] How to handle IndexedDB quota limits on mobile Safari (default ~50 MB)?
- [ ] Should background sync use Supabase Realtime for conflict resolution?

---

*Research compiled: 2026-03-06 · capegis research audit*
