# Specifications — CapeTown GIS Hub

> **TL;DR:** 21 feature specifications defining the behavioural requirements for the CapeTown GIS Hub multi-tenant PWA. Each spec maps to a PLAN.md milestone, includes measurable acceptance criteria, three-tier fallback integration, data source badge requirements, failure modes, edge cases, security considerations, and POPIA annotations where personal data is involved. Specs define **WHAT** to build, not **HOW**.

## Quick Reference

| Rule | Requirement | Spec coverage |
|------|-------------|---------------|
| Rule 1 — Data Source Badge | `[SOURCE · YEAR · LIVE\|CACHED\|MOCK]` visible without hovering | All specs with data display |
| Rule 2 — Three-Tier Fallback | LIVE → CACHED → MOCK; never blank map | 01, 03, 04, 06, 07, 08, 09, 12, 13, 14, 15, 17, 18, 19 |
| Rule 4 — RLS + App Layer | Dual-layer tenant isolation | 02, 05, 11, 13, 15, 16 |
| Rule 5 — POPIA Annotation | Personal data annotation block | 02, 04, 06, 09, 10, 12, 15, 16, 17 |
| Rule 8 — No Lightstone | GV Roll 2022 only | 12 |
| Rule 9 — Geographic Scope | Cape Town + Western Cape bbox | 01, 03, 04, 08, 12, 17 |

## Spec Index

| # | Spec | Milestone | Status | Key concern |
|---|------|-----------|--------|-------------|
| 01 | [Base Map & Dashboard Shell](01-base-map.md) | M3 | Draft | MapLibre, responsive shell, SSR exclusion |
| 02 | [Authentication & RBAC](02-authentication-rbac.md) | M2 | Draft | Supabase Auth, 6 roles, POPIA consent |
| 03 | [Zoning Overlays & IZS Codes](03-zoning-overlays.md) | M5 | Draft | IZS zones, WCAG colours, zoom gate |
| 04 | [Spatial Data Architecture](04-spatial-data-architecture.md) | M4a/M4b | Draft | Viewport pruning, Martin MVT, api_cache |
| 05 | [RLS Testing](05-rls-testing.md) | M4d | Draft | pgTAP, Vitest, 3 attack scenarios |
| 06 | [Mobile & Offline Architecture](06-mobile-offline-architecture.md) | M4c | Draft | rn-mapbox, WatermelonDB, sync queue |
| 07 | [Martin Tile Server](07-martin-tile-server.md) | M4b | Draft | Rust MVT, auto-discover, PMTiles gen |
| 08 | [PMTiles Pipeline](08-pmtiles-pipeline.md) | M4c | Draft | martin-cp → MBTiles → PMTiles → S3 |
| 09 | [Offline Sync Queue](09-offline-sync-queue.md) | M4c | Draft | FIFO queue, conflict resolution, iOS |
| 10 | [POPIA Compliance](10-popia-compliance.md) | M2/M15 | Draft | Data classification, consent, deletion |
| 11 | [Multi-Tenant Architecture](11-multitenant-architecture.md) | M1/M12 | Draft | Shared-schema, subdomain routing, RLS |
| 12 | [GV Roll Ingestion](12-gv-roll-ingestion.md) | M6 | Draft | 830K records, PII strip, CRS transform |
| 13 | [ArcGIS Three-Tier Fallback](13-arcgis-fallback.md) | M4a | Draft | LIVE→CACHED→MOCK pattern, withFallback() |
| 14 | [Background Sync & Service Worker](14-background-sync.md) | M4c | Draft | Serwist, caching strategies, 24h lockout |
| 15 | [Search & Filters](15-search-filters.md) | M7 | Implemented | Address/ERF autocomplete, PostGIS RPC |
| 16 | [Draw & Spatial Analysis](16-draw-spatial-analysis.md) | M8 | Implemented | maplibre-gl-draw, analyze_area RPC, charts |
| 17 | [OpenSky Flight Tracking](17-opensky-flight-tracking.md) | M9 | Implemented | Real-time ADS-B, rate limiting, 3D entities |
| 18 | [CesiumJS Hybrid View](18-cesiumjs-hybrid-view.md) | M10 | Implemented | 3D terrain, camera sync, 2D/3D toggle |
| 19 | [Analytics Dashboard](19-analytics-dashboard.md) | M11 | Implemented | Aggregated stats, Recharts, Guest blurring |
| 20 | [Share URLs](20-share-urls.md) | M13 | Implemented | State persistence, deep-linking, debounce |
| 21 | [QA Test Plan](21-qa-test-plan.md) | M14 | Draft | Playwright, RLS audit, 3-tier simulation |
| 22 | [Youth Digital Empowerment](youth-empowerment.md) | M19 | Draft | WiFi hubs, Safe-Walk Corridors, Dexie |

## Milestone Coverage

| Milestone | Specs |
|-----------|-------|
| M0 — Foundation | (governance docs, no feature specs) |
| M1 — Database Schema | 05, 11 |
| M2 — Auth/RBAC/POPIA | 02, 10 |
| M3 — MapLibre Base Map | 01 |
| M4a — Three-Tier Fallback | 04, 13 |
| M4b — Martin MVT | 04, 07 |
| M4c — Serwist PWA / Offline | 06, 08, 09, 14 |
| M4d — RLS Test Harness | 05 |
| M5 — Zoning Overlay | 03 |
| M6 — GV Roll Import | 12 |
| M7 — Search + Filters | 15 |
| M8 — Draw & Spatial Analysis | 16 |
| M9 — OpenSky Flight Tracking | 17 |
| M10 — CesiumJS Hybrid View | 18 |
| M11 — Analytics Dashboard | 19 |
| M12 — White-Labeling | (covered in 11 and whitelabel-config.md) |
| M13 — Share URLs | 20 |
| M14 — QA (Acceptance Criteria) | 21 |
| M15 — DPIA + Deployment | (Future specs) |
| M19 — Youth Layers | 22 |

## Architecture Cross-References

| Document | Location | Relevance |
|----------|----------|-----------|
| SYSTEM_DESIGN.md | [docs/architecture/](../architecture/SYSTEM_DESIGN.md) | Overall system architecture |
| ADR-002 Mapping Engine | [docs/architecture/](../architecture/ADR-002-mapping-engine.md) | MapLibre selection rationale |
| ADR-003 Tile Server | [docs/architecture/](../architecture/ADR-003-tile-server.md) | Martin selection rationale |
| ADR-005 Tenant Subdomains | [docs/architecture/](../architecture/ADR-005-tenant-subdomains.md) | Subdomain-based multi-tenancy |
| TECH_STACK.md | [docs/architecture/](../architecture/TECH_STACK.md) | Technology stack details |
| tile-layer-architecture.md | [docs/architecture/](../architecture/tile-layer-architecture.md) | Tile layer Z-ordering and optimisation |
| CLAUDE.md | [Project root](../../CLAUDE.md) | Non-negotiable rules |
| PLAN.md | [Project root](../../PLAN.md) | Milestone definitions of done |

## Spec Standard

Each spec must contain:
1. **TL;DR** — concise summary at the top
2. **Milestone mapping** — which M# this spec supports
3. **Component hierarchy** — mermaid diagram where applicable
4. **Data Source Badge** — Rule 1 compliance or N/A with reason
5. **Three-Tier Fallback** — Rule 2 integration or N/A with reason
6. **Edge cases** — boundary conditions, race conditions
7. **Failure modes** — what happens when things go wrong
8. **Security considerations** — RLS, tenant isolation, credentials
9. **POPIA annotations** — Rule 5 compliance where personal data is involved
10. **Performance budget** — response times, payload sizes
11. **Measurable acceptance criteria** — testable DoD items

## Naming Convention

Files follow: `<NN>-<descriptive-name>.md` (e.g. `01-base-map.md`, `02-authentication-rbac.md`)

## Topic Scope Test

> Can you describe the topic of concern in **one sentence without 'and'**?
>
> ✓ "The zoning overlay system renders IZS zones with color-coded polygons"
> ✗ "The map system handles tiles, overlays, and search" → 3 topics
