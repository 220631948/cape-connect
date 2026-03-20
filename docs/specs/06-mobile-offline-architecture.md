# 06 — Mobile Map & Offline Architecture

> **TL;DR:** Adapts the web GIS PWA for field workers using rn-mapbox for native GPU rendering, WatermelonDB for offline-first local storage, encrypted sync queues with FIFO processing and exponential backoff, PMTiles cached locally via background download (~270MB total), and strict POPIA controls (encrypted device storage, purge on logout). Designed for load-shedding resilience.

| Field | Value |
|-------|-------|
| **Milestone** | M4c — Serwist PWA / Offline |
| **Status** | Draft |
| **Depends on** | M3 (MapLibre Base Map), M4b (Martin MVT) |
| **Architecture refs** | [SYSTEM_DESIGN](../architecture/SYSTEM_DESIGN.md), [ADR-003](../architecture/ADR-003-tile-server.md) |

`[MOBILE_ARCH]`

## Topic

The mobile architecture adapts the web GIS platform for field workers facing load-shedding and poor network signals, using native rendering, offline-first storage, and secure sync queues.

## Native Map Rendering

### React Native with rn-mapbox

- Use **rn-mapbox** (Mapbox Maps SDK for React Native) instead of Leaflet or MapLibre GL JS
- rn-mapbox natively consumes Mapbox Vector Tiles (MVT) and uses the **device GPU** to render dense zoning polygons smoothly
- Device memory is limited — enforce **strict viewport pruning**:
  - Drop all features outside the visible screen immediately (no +20% buffer like web)
  - Gate dense geometries: aggregate views below zoom 14, individual polygons at zoom 14+
  - Monitor memory usage; degrade gracefully (reduce detail, disable animations) when approaching limits

### Memory Budget

| Device Tier | RAM Available | Max Features | Strategy |
|---|---|---|---|
| Low-end (2GB) | ~200MB for map | 1,000 | Aggressive simplification, no 3D |
| Mid-range (4GB) | ~500MB for map | 5,000 | Standard rendering |
| High-end (8GB+) | ~1GB for map | 10,000+ | Full detail, 3D buildings optional |

## Local Storage & Database

### WatermelonDB or SQLite

- Replace browser-based IndexedDB with a **mobile-optimised, offline-first database**
- **WatermelonDB** (recommended): Built on SQLite, provides lazy loading, optimistic updates, and built-in sync primitives
- **SQLite** (alternative): Direct SQLite via `react-native-sqlite-storage` for maximum control

### Cached API Responses

- Cache intercepted API responses (the `api_cache` equivalent) locally:
  - On first load: fetch from Supabase, store in local DB
  - On subsequent visits: serve from local DB, fetch updates in background
  - Expire entries after configurable TTL (default: 24 hours for zoning, 1 hour for live data)

### Schema for Local Cache

```sql
-- [MOBILE_ARCH] Local cache schema (WatermelonDB/SQLite)
CREATE TABLE local_cache (
  id TEXT PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  response_data TEXT NOT NULL,       -- JSON string
  created_at INTEGER NOT NULL,       -- Unix timestamp
  expires_at INTEGER NOT NULL,
  synced_at INTEGER                  -- NULL = never synced
);

CREATE INDEX idx_local_cache_key ON local_cache(cache_key);
```

## Offline PMTiles on Mobile

For fully disconnected field work during load-shedding:

### Download Strategy

- Use a **background download manager** (e.g., `react-native-background-downloader`) to save PMTiles archives to the device's local file system
- Download during Wi-Fi/charging windows — never over metered data by default
- Show download progress and estimated size before starting
- Support **delta updates** — only download changed tiles, not the full archive

### Local File Reading

- Point the map renderer to read local PMTiles via `file://` URIs instead of web URLs
- rn-mapbox supports local tile sources natively
- Verify file integrity with SHA-256 checksums after download

### PMTiles Workflow for Mobile

```
Cloud Storage (S3/GCS)
       ↓ (background download)
Device File System (/data/tiles/)
       ↓ (file:// URI)
rn-mapbox (native GPU rendering)
```

### Storage Budget

| Dataset | Approximate Size | Update Frequency |
|---|---|---|
| Cape Town zoning (IZS) | ~50MB PMTiles | Weekly |
| Base boundaries (suburbs) | ~20MB PMTiles | Monthly |
| Property boundaries (full) | ~200MB PMTiles | Monthly |
| **Total** | **~270MB** | — |

## Secure Sync Queue

When a user creates or edits data while offline, the changes are queued for later synchronisation:

### Sync Queue Table

```sql
-- [MOBILE_ARCH] Offline sync queue
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  operation TEXT NOT NULL,           -- 'INSERT', 'UPDATE', 'DELETE'
  target_table TEXT NOT NULL,        -- e.g. 'properties', 'favourites'
  payload TEXT NOT NULL,             -- JSON of the record
  created_at INTEGER NOT NULL,       -- Unix timestamp
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,                   -- Last sync error message
  status TEXT DEFAULT 'pending'      -- 'pending', 'syncing', 'synced', 'failed'
);
```

### Sync Protocol

1. **User edits offline** → action saved to `sync_queue` with status `pending`
2. **Network reconnects** → sync service starts processing the queue FIFO
3. **For each entry:**
   - Set status → `syncing`
   - Send to Supabase API (authenticated request)
   - Supabase **RLS policies enforce** at the moment of synchronisation
   - On success: set status → `synced`, optionally delete after 7 days
   - On failure: increment `retry_count`, save error, backoff exponentially (max 5 retries)
4. **Conflict resolution:** Last-write-wins with timestamp comparison; flag conflicts for user review

### Security Guarantees

- All sync operations go through Supabase's authenticated API — **RLS is enforced server-side**
- The sync queue is encrypted at rest on the device (use `react-native-encrypted-storage`)
- JWT tokens are refreshed before sync; expired sessions require re-authentication
- Failed sync items with permission errors are flagged and never retried automatically

## Data Sources

- Martin vector tile server (MVT endpoints)
- PMTiles archives on S3/Cloud Storage
- Supabase API (authenticated sync)

## Data Source Badge (Rule 1)
- Mobile app must display same badge format: `[SOURCE · YEAR · LIVE|CACHED|MOCK]`
- When serving from local WatermelonDB cache: badge shows `[CACHED]`
- When serving from PMTiles: badge shows `[CACHED]` with tooltip "Offline tiles"

## Three-Tier Fallback (Rule 2)
- **LIVE:** Supabase API via authenticated request
- **CACHED:** WatermelonDB local cache (configurable TTL: 1h live data, 24h zoning)
- **MOCK:** Bundled mock GeoJSON in app assets — never blank map

## Provider Cache/Offline Legality Matrix (Cycle 1 Delta)

| Provider/Layer | Offline Cache Posture | Allowed Pattern | Prohibited Pattern | Evidence |
|---|---|---|---|---|
| Google Maps tiles (incl. photorealistic) | Restricted | Header/terms-bounded short-lived cache only | Long-lived offline archive or uncontrolled prefetch packs | `[PL]` |
| Cesium ion third-party content | Contract-bound | Plan/terms-compliant cache windows and attribution | Rehosting or offline persistence beyond entitlement | `[PL]` |
| OpenSky telemetry | License-bound | Short TTL operational cache for resilience in approved modes | Paid production LIVE usage without confirmed commercial path | `[PL][SI]` |
| PMTiles (self-hosted municipal/open datasets) | Project-controlled | Offline packs with checksum + retention policy | Packing personal data into field offline archives | `[PL]` |

- Assumption note: final legal interpretation of each mobile caching topology remains `[ASSUMPTION — UNVERIFIED]` until counsel review.

## Tenant Isolation Risk Treatment (Cycle 1 Alignment)
- Local cache keys and sync queues must include `tenant_id`; cross-tenant cache re-use is prohibited.
- Device telemetry uploaded during sync is tenant-partitioned and retained per POPIA policy windows.
- [ASSUMPTION — UNVERIFIED] exact mobile retention windows for each telemetry class require legal/security sign-off.

## Edge Cases
- **Storage full:** Device runs out of space during PMTiles download → show "Insufficient storage" error; partial file deleted
- **Background download interrupted:** Power loss during download → resume from last byte on next charge
- **Sync queue overflow:** >1000 pending items → warn user; oldest items beyond 7 days auto-expire
- **Conflict on sync:** Client and server both modified same record → show diff dialog; default to server version
- **JWT expired during sync:** Queue pauses → re-authenticate → resume from failed item
- **Device encryption unavailable:** Refuse to store personal data locally; warn user

## Security Considerations
- Local device storage encrypted via `react-native-encrypted-storage`
- JWT tokens stored in secure keychain (iOS) / encrypted shared preferences (Android)
- Sync queue encrypted at rest — payloads may contain PII
- On logout: purge all local data (cache, sync queue, PMTiles with personal data)
- 24-hour lockout: re-authenticate if `lastSyncTimestamp` > 24h ago

## Performance Budget

| Metric | Target |
|--------|--------|
| Map first paint (warm cache) | < 1.5s |
| PMTiles tile read (local) | < 50ms |
| Sync queue flush (per item) | < 500ms |
| Total offline storage budget | ≤ 300MB |
| Background download speed | ≥ 1MB/s on Wi-Fi |

## POPIA Implications

- **Local device storage** containing personal data (property owner names, favourites) must be encrypted
- On user logout or account deletion: purge all local data (cache, sync queue, PMTiles with personal data)
- PMTiles for field workers must contain **zoning and boundaries only** — no personal data
- Sync queue payloads may contain personal data — encrypt at rest, purge after successful sync + 7 days

## Acceptance Criteria

- [ ] Mobile map rendering tools and memory limits documented under `[MOBILE_ARCH]`
- [ ] rn-mapbox chosen for native GPU rendering with strict viewport pruning
- [ ] Local database choice (WatermelonDB) and cache schema explicitly defined
- [ ] Offline sync queue mechanism defined with FIFO processing, retry, and conflict resolution
- [ ] PMTiles download strategy mapped out with background download and `file://` URI reading
- [ ] Storage budget estimated (~270MB total for Cape Town datasets)
- [ ] POPIA controls defined for local device storage encryption and data purging
