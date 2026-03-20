# GIS Data Lifecycle & Caching Strategy


> **TL;DR:** Data follows a three-tier fallback: LIVE (external API) → CACHED (Supabase `api_cache`) → MOCK (`public/mock/*.geojson`). Never show blank map or error instead of MOCK data (CLAUDE.md Rule 2). Source badge required on every display: `[SOURCE · YEAR · LIVE|CACHED|MOCK]` (Rule 1). See `CLAUDE.md` §3 for rules and `docs/ETL_PIPELINE.md` for GV Roll ingestion.

**Document version:** 1.0
**Date:** 2026-03-01
**Status:** DRAFT

## 1. Overview
The Cape Town GIS Hub relies on a mix of real-time municipal data and infrequent bulk-load records. This document defines how often data is refreshed and how the **Three-Tier Fallback** (Live → Cached → Mock) is managed.

## 2. Layer Update Frequency

| Layer | Type | Source | Refresh Freq | TTL (api_cache) |
|---|---|---|---|---|
| **Cadastral Parcels** | Feature Service | CoCT ArcGIS | Continuous | 7 Days |
| **Zoning Overlay (IZS)** | Feature Service | CoCT ArcGIS | Per By-law Update | 30 Days |
| **General Valuation (GV)** | Bulk CSV | CoCT ODP | ~Every 3-4 Years | 1 Year |
| **Flood/Risk Layers** | MapServer | WCG SDW | Irregular | 30 Days |
| **Amenities (OSM)** | Overpass API | OpenStreetMap | Weekly | 24 Hours |

## 3. The "Live → Cached → Mock" Logic

### 3.1 Live Tier (L1)
*   **Trigger:** User session initial request or cache expiry.
*   **Action:** Direct HTTP fetch to external endpoint (e.g., CoCT ArcGIS).
*   **Update:** Successful responses are written to the Supabase `api_cache` table with a timestamp.

### 3.2 Cached Tier (L2)
*   **Trigger:** L1 failure (404, 503, timeout) or network offline.
*   **Action:** Query `api_cache` using `cache_key` (layer name + bbox + tenant_id).
*   **UI Indicator:** Displays a "CACHED" badge with the data timestamp.

### 3.3 Mock Tier (L3)
*   **Trigger:** L2 miss or data corrupted.
*   **Action:** Load static GeoJSON from `apps/web/public/mock/[layer].geojson`.
*   **UI Indicator:** Displays a critical "MOCK DATA" warning badge.

## 4. Cache Invalidation
*   **Manual Invalidation:** Platform Admins can force a cache clear via the Admin Panel.
*   **Automatic Invalidation:** Background Edge Functions (Deno) scan for expired TTLs and attempt to pre-warm the cache for high-traffic suburbs during off-peak hours.

## 5. POPIA Retention Rules
*   Any cached data containing PII (e.g., specific user saved searches) is subject to a strict **30-day deletion rule** upon user account deactivation.
*   The GV Roll cache contains NO PII (stripped at ingestion).

## 6. Provider-Specific Cache Legality Matrix (Cycle 1 Delta)

| Provider | Legal/Policy Posture | Cache TTL Guidance | Offline Guidance | Notes |
|---|---|---|---|---|
| Google Maps Tile API | Strict contractual controls | Follow response headers/terms; no uncontrolled long-lived warehouse | Restricted/prohibited for general offline archives | Attribution must remain visible `[PL]` |
| Cesium ion + third-party feeds | Contract + upstream inheritance | Plan/terms-bounded cache only | Only where explicitly allowed by contract | Upstream rights can change/suspend `[PL]` |
| OpenSky Network | Research/non-commercial default + contract path for commercial | Short operational TTL (e.g., 30s) for resilience | No paid-tenant LIVE rollout without commercial path | Citation/attribution required `[PL][SI]` |
| Self-hosted open municipal layers | Project-governed | Standard lifecycle TTL in this doc | Allowed for offline if no PII and policy-compliant | Prefer PMTiles for disconnected field use |

### Prohibited Scenarios (Explicit)
- Building persistent offline archives of Google-restricted tiles.
- Removing/obscuring required provider attribution while serving cached data.
- Routing paid production traffic to OpenSky LIVE without commercialization clearance.

## 7. Database Performance & RLS Verification

### 7.1 Spatial Indexing Standard
All tenant-scoped spatial tables MUST implement composite GIST indexes to optimize RLS-filtered queries:
```sql
CREATE INDEX idx_[table]_geom_tenant ON [table] USING GIST (geometry) INCLUDE (tenant_id);
```
This enables **Index-Only Scans** where the RLS filter (`tenant_id`) is satisfied directly from the spatial index leaf nodes.

### 7.2 RLS Verification Protocol
Before promoting any schema change to `M2+`, the RLS Test Harness (`supabase/tests/rls_test.sql`) must be executed. Verification requires:
1.  **Isolation Check**: Zero cross-tenant leakage between `Alpha` and `Bravo` test tenants.
2.  **Anonymous Check**: Zero records returned when `app.current_tenant` is unset or invalid.
3.  **Performance Check**: Query plans for spatial lookups must show `Index Scan` on the composite index.

> Assumption note: exact contractual boundaries for edge/CDN/mobile cache topologies remain `[ASSUMPTION — UNVERIFIED]` pending legal sign-off.
