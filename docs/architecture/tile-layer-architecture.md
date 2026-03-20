# Tile Layer Architecture

> **TL;DR:** Defines tile delivery from upstream providers through tenant-isolated caching into CesiumJS rendering, including Martin MVT fallback and billing controls.


## Scope
This architecture defines Pillar 1 tile delivery from upstream map providers through tenant-isolated caching into CesiumJS rendering, including fallback behavior and billing attribution controls.

> **Ralph Q:** *What breaks first under heavy pan/zoom load: provider, cache, or renderer?*  
> **A:** Usually provider quota or latency; cache hit-rate and tenant-attributed throttling are the first operational controls to protect user experience.

## Data Flow (Google Maps API -> CDN proxy cache -> CesiumJS renderer)
```mermaid
flowchart LR
    U[Client Viewer\n(tenant-scoped session)] --> A[App Backend / Tile Proxy]
    A --> C{Tenant Cache\nkey={tenantId}/{tileType}/{z}/{x}/{y}}
    C -- hit --> A
    C -- miss --> G[Google Maps Tile API]
    G --> A
    A --> C
    A --> R[CesiumJS Renderer]

    A --> B[Billing & Audit Stream\n(tenantId, tileType, hit/miss, latency)]
    A --> F{Fallback Controller}
    F -->|3D unavailable| S[2D Satellite]
    F -->|Imagery unavailable| M[2D Roadmap]
    F -->|Provider unavailable| O[OSM fallback]
    S --> R
    M --> R
    O --> R
```

## Layer Authority Hierarchy
| Layer Function | Authority | Why |
|---|---|---|
| Elevation/measurement | Cesium World Terrain | Prompt requirement: measurement authority for route/planning calculations. |
| Visual city mesh | Google Photorealistic 3D | Prompt requirement: visual authority for context. |
| Base fallback imagery | Google 2D Satellite | Primary graceful degradation target when 3D is absent. |
| Last-resort base map | 2D Roadmap/OSM | Keeps operational continuity when premium layers fail. |

> **Ralph Q:** *If visual and measurement layers conflict, do we average them?*  
> **A:** No. Keep explicit authority split: measure on terrain authority, view on visual authority.

## Offline Tile Pre-Fetch for Emergency AOIs
1. Identify known AOIs and incident playbooks per tenant.
2. Pre-fetch allowed tiles ahead of incidents into tenant namespace.
3. Apply TTL and legal/terms constraints before storage.
4. During outage, serve prefetched cache and trigger fallback cascade.
5. Record stale-age metadata so operators know data freshness.

> **Ralph Q:** *Can we prefetch everything for safety?*  
> **A:** Not safely; prefetch scope must respect provider terms, quota, and storage budgets.

## Multitenant Constraints and Billing Attribution
- **Cache key pattern (mandatory):** `{tenantId}/{tileType}/{z}/{x}/{y}`.
- **Storage path pattern:** `{BASE_PATH}/{tenantId}/{resourceId}/`.
- **Request traceability:** every tile request logs `tenantId` + layer type + cache status.
- **Isolation boundary:** cross-tenant cache reads/writes are prohibited.
- **Noisy-neighbor controls:** per-tenant rate limits and cache quota budgets.

> **Ralph Q:** *Can two tenants share one cache object for the same tile to save cost?*  
> **A:** No by default. Cross-tenant cache reuse is prohibited unless a dedicated ADR defines cryptographic partitioning, policy approval, and auditable controls. [ASSUMPTION — UNVERIFIED]

## Fallback Logic (Safety-Critical Order)
1. Photorealistic 3D available -> render 3D.
2. If 3D coverage gap -> use 2D satellite.
3. If satellite unavailable -> use 2D roadmap.
4. If provider outage or quota block -> use OSM fallback.
5. If all remote layers fail -> serve stale tenant cache with freshness warning.

> **Ralph Q:** *What is never acceptable during fallback?*  
> **A:** A blank map without explanation when any lower-tier layer or cached data is available.

## Policy Delta Alignment (Cycle 1)
| Constraint | Architecture Rule | Risk Treatment | Evidence |
|---|---|---|---|
| Google tiles caching/offline restrictions | Only header/terms-bounded cache windows are allowed | Block long-lived offline packs for Google-derived tiles | `[PL]` |
| Cesium third-party term inheritance | Provider terms evaluated before enabling cache profile | Disable non-compliant cache policy at runtime and log decision | `[PL]` |
| OpenSky commercialization gate | LIVE paid deployment requires confirmed commercial path | Force CACHED/MOCK fallback until license gate is cleared | `[PL][SI]` |

## Assumptions Register
- [ASSUMPTION — UNVERIFIED] Specific cache backend (Redis/CDN vendor) is not fixed in repository docs.
- [ASSUMPTION — UNVERIFIED] Exact stale-cache max age threshold per domain is not yet standardized.
