# ADR 007: Offline-First Architecture (Serwist + Dexie + PMTiles)

> **TL;DR:** Adopted an offline-first PWA architecture using Serwist (service worker), Dexie.js (IndexedDB), and PMTiles (vector tiles) to ensure the GIS platform remains functional on SA mobile networks (3–5 Mbps) and during load-shedding power outages.

**Status:** Accepted
**Date:** 2026-03-05
**Deciders:** Senior GIS Architect

## Context

Cape Town users face intermittent connectivity due to:
- Load-shedding power outages affecting cell towers
- SA mobile networks averaging 3–5 Mbps bandwidth
- Field workers in areas with poor reception
- The platform must never show a blank map or error-only screen (CLAUDE.md Rule 2)

## Decision Drivers

- **Reliability:** Map must render even without network connectivity
- **Performance:** Tile loading must work on constrained bandwidth
- **User trust:** Data must persist across sessions without data loss
- **PWA compliance:** App must be installable and work offline

## Considered Options

1. **No offline support:** Simple but unacceptable for SA infrastructure reality
2. **Full offline database sync:** Complex, large storage footprint
3. **Selective offline (Serwist + Dexie + PMTiles):** Cache last viewport, queue writes, pre-generate tiles

## Decision

Chosen option: **Selective offline-first with Serwist + Dexie + PMTiles**.

### Implementation Strategy

- **Serwist:** Service worker manages cache strategies (network-first for API, cache-first for tiles)
- **Dexie.js:** IndexedDB wrapper stores offline data, queued mutations, and user state
- **PMTiles:** Pre-generated vector tiles stored in Supabase Storage for offline basemap
- **Background Sync:** Queued uploads sync when connectivity returns

### Offline Capabilities Matrix

| Feature | Online | Offline | Notes |
|---------|--------|---------|-------|
| Basemap rendering | ✅ | ✅ (cached viewport) | Last viewport + 20% buffer |
| Suburb boundaries | ✅ | ✅ (PMTiles) | Pre-generated |
| Property search | ✅ | ❌ | Requires server |
| Saved searches | ✅ | ✅ (Dexie) | Synced on reconnect |
| Draw/annotate | ✅ | ✅ (Dexie) | Queued for sync |
| Live data layers | ✅ | ❌ → MOCK fallback | Falls through to mock GeoJSON |

## Consequences

- **Good:** App usable during load-shedding; field workers can operate offline; installable PWA
- **Bad:** Storage footprint on device; cache invalidation complexity; PMTiles generation pipeline needed
- **Neutral:** Requires careful sync conflict resolution strategy

## Edge Cases & Failure Modes

- **Storage quota exceeded:** Evict oldest cached tiles first, warn user
- **Sync conflict:** Server wins for shared data; client wins for user annotations (last-write-wins with conflict log)
- **Stale cache:** Display "Last synced: X ago" badge; auto-refresh on reconnect
- **Service worker update:** Use Serwist's built-in update prompt flow

## Acceptance Criteria

- [ ] Service worker registered via Serwist with precache manifest
- [ ] Last viewport tiles cached (minimum 5-minute offline window)
- [ ] Dexie.js stores user state, favourites, and queued mutations
- [ ] Background Sync queues uploads and processes on reconnect
- [ ] PMTiles basemap loads from Supabase Storage when Martin unavailable
- [ ] Offline indicator displayed when network unavailable
- [ ] No blank map screen — falls through to cached or mock data
- [ ] App installable as PWA on Android and iOS

---

*v1.0 · 2026-03-05 · Created during architecture documentation polish*
