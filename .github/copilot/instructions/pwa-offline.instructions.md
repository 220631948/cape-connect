---
applyTo: '**/*.{ts,tsx,js}'
---
# PWA Offline Instructions (Serwist + Dexie + PMTiles)

> TL;DR: Register the Serwist service worker in Next.js 15 App Router, store offline data in Dexie (IndexedDB), serve cached vector tiles via PMTiles, and queue failed mutations for background sync.

## Serwist Service Worker — Next.js 15 Setup

### next.config.ts
```typescript
import withSerwist from '@serwist/next'

const withSerwistConfig = withSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})
export default withSerwistConfig({ /* next config */ })
```

### app/sw.ts (service worker entry)
```typescript
import { defaultCache } from '@serwist/next/worker'
import { installSerwist } from '@serwist/sw'

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    ...defaultCache,
    {
      matcher: /^https:\/\/.*\/tiles\//,
      handler: 'CacheFirst',
      options: { cacheName: 'mvt-tiles', expiration: { maxAgeSeconds: 86400 } },
    },
  ],
})
```

### Registration (app/layout.tsx)
```typescript
// Serwist auto-registers via @serwist/next — no manual navigator.serviceWorker.register needed
// Ensure <head> includes the manifest link:
// <link rel="manifest" href="/manifest.json" />
```

## Dexie.js — Offline Data Schema

```typescript
import Dexie, { type Table } from 'dexie'

interface CachedLayer {
  id: string
  tenantId: string
  layerName: string
  geojson: object
  cachedAt: number
  expiresAt: number
}

interface SyncQueue {
  id?: number
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  payload: object
  createdAt: number
  retryCount: number
}

class CapegisDB extends Dexie {
  cachedLayers!: Table<CachedLayer>
  syncQueue!: Table<SyncQueue>

  constructor() {
    super('capegis')
    this.version(1).stores({
      cachedLayers: 'id, tenantId, layerName, expiresAt',
      syncQueue: '++id, action, table, createdAt',
    })
  }
}

export const db = new CapegisDB()
```

## Three-Tier Fallback with Dexie
```typescript
async function fetchLayer(layerName: string): Promise<{ data: GeoJSON; tier: 'LIVE' | 'CACHED' | 'MOCK' }> {
  // Tier 1: LIVE
  try {
    const res = await fetch(`/api/layers/${layerName}`, { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const data = await res.json()
      await db.cachedLayers.put({ id: layerName, tenantId, layerName, geojson: data, cachedAt: Date.now(), expiresAt: Date.now() + 3600_000 })
      return { data, tier: 'LIVE' }
    }
  } catch { /* fall through */ }

  // Tier 2: CACHED (Dexie)
  const cached = await db.cachedLayers.get(layerName)
  if (cached && cached.expiresAt > Date.now()) {
    return { data: cached.geojson as GeoJSON, tier: 'CACHED' }
  }

  // Tier 3: MOCK
  const mock = await fetch(`/mock/${layerName}.geojson`).then(r => r.json())
  return { data: mock, tier: 'MOCK' }
}
```

## PMTiles — Offline Vector Tiles

```typescript
// Install: npm install pmtiles
import { Protocol } from 'pmtiles'
import maplibregl from 'maplibre-gl'

// Register PMTiles protocol with MapLibre (call once at map init)
const protocol = new Protocol()
maplibregl.addProtocol('pmtiles', protocol.tile)

// Use in MapLibre source
map.addSource('offline-parcels', {
  type: 'vector',
  url: 'pmtiles:///tiles/cape-town-parcels.pmtiles',
})
```

### PMTiles caching strategy
- Store `.pmtiles` files in `public/tiles/` for offline-first scenarios
- Serwist `CacheFirst` rule handles tile range requests automatically
- PMTiles only fetches needed tile ranges — no full-file download required

## Background Sync Queue
```typescript
// Queue a failed mutation for retry
async function queueSync(action: 'INSERT' | 'UPDATE' | 'DELETE', table: string, payload: object) {
  await db.syncQueue.add({ action, table, payload, createdAt: Date.now(), retryCount: 0 })
}

// Drain queue when online (call on 'online' event)
async function drainSyncQueue() {
  const items = await db.syncQueue.toArray()
  for (const item of items) {
    try {
      await supabase.from(item.table)[item.action.toLowerCase()](item.payload)
      await db.syncQueue.delete(item.id!)
    } catch {
      await db.syncQueue.update(item.id!, { retryCount: item.retryCount + 1 })
    }
  }
}

window.addEventListener('online', drainSyncQueue)
```

## Common Pitfalls
- **Do not** register the service worker manually — Serwist handles this via `@serwist/next`
- **Do not** cache API responses that contain PII without encryption at rest (POPIA Rule 5)
- **Do not** set `disable: false` in development — SW caching masks live code changes
- **Do not** store `tenant_id` from an untrusted source in Dexie — always derive from the session
- **Do not** use `localStorage` for GeoJSON — it has a 5 MB limit; use Dexie instead
