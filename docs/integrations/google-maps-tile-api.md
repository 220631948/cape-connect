# Google Maps Tile API Integration

## TL;DR · Session Token Lifecycle
This integration uses Google Maps Tile API sessions with strict tenant attribution and failure-safe fallback so operational maps do not go dark when tokens expire. The repo requirements specify a 1-hour session lifetime and proactive renewal at T-55 minutes, with explicit `TOKEN_EXPIRED` handling. Any behavior not explicitly documented in this repository is marked as uncertain.

## Assumptions & Uncertainty Tags
- Canonical uncertainty label in this doc set is `[ASSUMPTION — UNVERIFIED]`.
- Use this tag when repository evidence does not confirm endpoint contract, SLA, legal interpretation, or runtime parity.
- Known uncertain areas in this integration: Street View/Aerial endpoint variants, DAU-to-currency modeling inputs, and regional coverage/SLA detail.
- Uncertainty must remain visible in UI and export pathways; do not silently upgrade uncertain data to “verified”.

> **Ralph Q:** *If the session token expires at 2am mid-wildfire tracking, does the map go blank?*  
> **A:** No. The documented control is proactive refresh at T-55 minutes plus retry-on-`TOKEN_EXPIRED`; if refresh fails, degrade to cached tiles and then lower-fidelity base maps instead of blank rendering.

### Session lifecycle sequence (tenant-scoped)
```mermaid
sequenceDiagram
    autonumber
    participant Client as Tenant Viewer
    participant App as GIS App Backend
    participant Cache as CDN/Tile Cache
    participant Google as Google Tile API

    Client->>App: Request tiles (tenantId, viewport)
    App->>Google: POST /v1/createSession (tileType, mapType, apiKey[tenant])
    Google-->>App: sessionToken + expiry (~1h)
    App-->>Client: Session metadata (token not exposed beyond policy)

    loop Tile fetch during active session
        Client->>App: Tile request (z/x/y, tileType, tenantId)
        App->>Cache: Lookup {tenantId}/{tileType}/{z}/{x}/{y}
        alt Cache hit
            Cache-->>App: Tile bytes
            App-->>Client: Tile
        else Cache miss
            App->>Google: GET tile with sessionToken
            Google-->>App: Tile bytes
            App->>Cache: Store namespaced tile
            App-->>Client: Tile
        end
    end

    Note over App: Proactive renewal at T-55m
    App->>Google: POST /v1/createSession (renew)
    Google-->>App: New sessionToken

    alt Token expired unexpectedly
        Google-->>App: TOKEN_EXPIRED
        App->>Google: POST /v1/createSession
        Google-->>App: New token
        App-->>Client: Retry served; no blank map
    end
```

## Tile Type Reference Table
| Tile Type | API Path Pattern | Typical Use | Operational Notes |
|---|---|---|---|
| 2D Roadmap | `/v1/2dtiles/{z}/{x}/{y}` | Labels/navigation context | Use as last-resort visual fallback when imagery unavailable. |
| 2D Satellite | `/v1/2dtiles/{z}/{x}/{y}` | Background imagery fallback | Primary fallback under 3D coverage gaps. |
| 2D Terrain | `/v1/2dtiles/{z}/{x}/{y}` | Terrain context | Measurement authority remains Cesium World Terrain per plan. |
| Photorealistic 3D Tiles | `/v1/3dtiles/...` | Primary city mesh visual layer | **[Verified Absent 2026]** Not yet available for Cape Town. |
| Street View Tiles | `[ASSUMPTION — UNVERIFIED]` endpoint variant | Ground-level context | Endpoint and quota model not fully specified in repo docs. |
| Aerial View / 3D imagery variants | `[ASSUMPTION — UNVERIFIED]` endpoint variant | Supplemental scene context | Treat as optional enhancement until endpoint contract is confirmed. |

> **Ralph Q:** *What if Google has no 3D tile coverage for an area?*  
> **A:** **[Verified for Cape Town]** Photorealistic mesh is absent. The system MUST fall back to standard 3D terrain and extruded buildings, or supplemental 3rd-party captures.

## API Key Security
- Enforce per-tenant key isolation (`RULE 1 — KEY ISOLATION` in `GIS_MASTER_CONTEXT.md`).
- Route tile calls through a server-side proxy; never embed unrestricted keys in public clients.
- Apply key restrictions (HTTP referrer + IP restrictions) as documented in environment guidance.
- Log each outbound request with `tenantId` for attribution and incident traceability.
- Rotate tenant keys on compromise or planned cadence.

> **Ralph Q:** *Can one leaked key expose all tenants?*  
> **A:** It should not; architecture requires one key per tenant (or equivalent isolated credential scope) so blast radius stays tenant-bounded.

## Billing & Cost
- Billing model in repo context: metered requests with Google Maps monthly credit (`$200/month`) noted in docs.
- Per-tenant attribution is mandatory (`RULE 3 — BILLING ATTRIBUTION`).
- Cache-first strategy reduces repeat paid requests: cache key pattern `{tenantId}/{tileType}/{z}/{x}/{y}`.
- Cost scenarios at 100/1K/10K DAU are required by plan, but exact financial values are not computed in repo docs.

| DAU Scenario | Required Attribution Signal | Confidence |
|---|---|---|
| 100 DAU | request_count by tenantId + tileType + cache_hit_ratio | High (documented requirement) |
| 1K DAU | same + per-tenant burst/rate metrics | High (documented requirement) |
| 10K DAU | same + capacity planning and CDN offload metrics | High (documented requirement) |
| Currency estimate | [ASSUMPTION — UNVERIFIED] until pricing calculator inputs are fixed | Unverified |

> **Ralph Q:** *What does it cost if 10,000 tenants pan across different cities simultaneously?*  
> **A:** Unknown from repository-only evidence; required mitigation is per-tenant key routing + CDN/cache + attribution telemetry so finance can compute actuals from real traffic.

## Coverage & Fallback
- Coverage awareness is mandatory: expose whether requested AOI supports photorealistic 3D.
- Degradation cascade (explicitly documented in prompt):
  1. Photorealistic 3D
  2. 2D Satellite
  3. 2D Roadmap
  4. OSM fallback
- Authority split:
  - Visual authority: Google photorealistic 3D layer
  - Measurement authority: Cesium World Terrain

> **Ralph Q:** *Cesium elevation and Google mesh disagree. Which wins for route planning?*  
> **A:** Cesium World Terrain wins for measurement computations; Google 3D remains visual context.

## Offline Strategy
- Pre-fetch known emergency AOIs before incidents when legally and contractually allowed.
- Store pre-fetched tiles in tenant-namespaced cache partitions.
- Use TTL controls (`TILE_CACHE_TTL_SECONDS`) and explicit expiry handling.
- If upstream APIs are unavailable, serve cached content and lower-fidelity base map fallback.
- Prohibited: do not create long-lived offline archives of Google-restricted tile content outside explicit contractual allowance.
- Prohibited: do not use tile content for non-visual extraction/resale/object detection/model training workflows.

> **Ralph Q:** *What if network fails during an incident?*  
> **A:** Serve tenant-scoped cached tiles first, then degrade to simpler map layers; never fail to blank where fallback data exists.

## Multitenant Configuration
- Key routing: resolve credential by `tenantId`.
- Cache isolation: `{tenantId}/{tileType}/{z}/{x}/{y}`.
- Storage namespace: `{BASE_PATH}/{tenantId}/{resourceId}/`.
- Access isolation: block cross-tenant access without explicit sharing grants.
- Auditability: every tile request must be linkable to `tenantId` for billing and security review.

> **Ralph Q:** *Could cached tiles leak between tenants if they request the same z/x/y?*  
> **A:** Not if cache keys remain tenant-prefixed; this prefix is non-optional in the architecture.

## Environment Variables

| Variable | Required | Source |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `GOOGLE_MAPS_MAP_ID` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `TILE_CACHE_ENABLED` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `TILE_CACHE_MAX_SIZE_MB` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `TILE_CACHE_TTL_SECONDS` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `NEXT_PUBLIC_GOOGLE_STREET_VIEW_KEY` | No | `CLAUDE.md` §7 (absent → Street View hidden) |

## Three-Tier Fallback

`[LIVE]` Google Maps Tile API (Photorealistic 3D → 2D Satellite → 2D Roadmap) → `[CACHED]` tenant-namespaced CDN/tile cache → `[MOCK]` OSM fallback basemap. Badge: `[Google Maps · {YEAR} · LIVE|CACHED|MOCK]`.

## Data Source Badge

`[Google Maps · {YEAR} · LIVE|CACHED|MOCK]` — displayed on all tile layers with attribution `© Google`.

## Error Handling
- `TOKEN_EXPIRED`: refresh session via `createSession`, retry request, preserve rendered map state.
- Upstream `429`/`5xx`: apply exponential backoff + jitter and circuit-breaker protection.
- If live fetch fails, degrade to tenant-scoped cache and then OSM fallback; never render a blank map.
- Emit tenant-scoped telemetry for token failures, rate-limit bursts, and fallback transitions.

## Mandatory Attribution Rendering Rules
- Attribution (Google + required third-party notices) must remain visible, readable, and non-obscured in all map states.
- Attribution must remain present during fullscreen, side-panel overlays, and exported/screenshot views.
- If overlays compete for space, move overlays; never hide attribution.
- [ASSUMPTION — UNVERIFIED] final pixel-level placement constraints require legal/UI sign-off.

## EEA Terms Operational Note
- If billing entity is EEA-based, apply EEA-specific Google Maps terms as release-gate checks before enabling tile-dependent features.
- Keep billing-region policy branch explicit in ops/config docs to avoid accidental non-EEA assumption.

## POPIA Implications

- Tile request logs contain tenant viewport coordinates; do not correlate with individual user identity.
- Street View imagery may contain identifiable individuals (Google blurs by default).
- Per-tenant cache isolation prevents cross-tenant viewport inference. [ASSUMPTION — UNVERIFIED] — cache-level PII risk assessment not yet formalized.

## Milestone Mapping

- **M1** (Core Map): MapLibre basemap + Google 2D tile integration.
- **M6** (3D Visualization): Photorealistic 3D Tiles via CesiumJS.
- **M9** (Offline): Pre-fetched emergency AOI tile cache.

## Ralph/edge-case Q&A
- **Q:** What if session tokens expire mid-navigation? **A:** Rotate tokens immediately and degrade to cached/OSM fallback without blank map.
- **Q:** What if attribution is obscured by overlays on small screens? **A:** Reflow overlays first; attribution remains mandatory and always visible.

## Known Unknowns
- Exact Street View and Aerial tile endpoint contracts used by this codebase are not yet specified in repo docs.
- Concrete DAU-to-currency cost table values are not derivable from repository evidence alone.
- Regional 3D coverage verification endpoint and SLA are not documented with production thresholds.
- Session token transport boundary (client-visible vs backend-only token handling) needs implementation confirmation.

## ⚖️ Ethical Use & Compliance
### Terms and usage boundaries
- Use Google Maps APIs under official terms; no scraping or unapproved offline training on tile content.
- Respect attribution requirements in all map views and exported artifacts.
- Monitor metered usage to prevent hidden cost transfer between tenants.

### Tenant isolation and privacy
- Tenant data and request history are namespaced and isolated.
- Cross-tenant access is prohibited unless explicit sharing grants exist.
- Do not use map interaction telemetry to infer sensitive individual behavior patterns.

### Safety posture
- Degraded/fallback layers must be clearly labeled to avoid false precision in emergency or legal decisions.
- AI-derived overlays must not be presented as ground-truth imagery.

## References
- [Cesium Platform Integration](./cesium-platform.md)
- [Tile Layer Architecture](../architecture/tile-layer-architecture.md)
- [ADR-009: Three-Tier Fallback](../architecture/ADR-009-three-tier-fallback.md)
- [Multitenant Architecture Spec](../specs/11-multitenant-architecture.md)
- `docs/prompts/GIS_FLEET_PLAN_PROMPT_V3.md` (Pillar 1 requirements)
- `docs/context/GIS_MASTER_CONTEXT.md` (multitenant rules, ethical guardrails, env guidance)
- Google Maps Tile API docs: https://developers.google.com/maps/documentation/tile
- Google Maps Platform Terms: https://developers.google.com/maps/terms
- OpenStreetMap: https://www.openstreetmap.org
