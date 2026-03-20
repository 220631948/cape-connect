# Swarm Research: React Geospatial Visualization Patterns (Repository-Constrained)

## Scope
This document captures React + geospatial visualization patterns evidenced in this repository, focused on MapLibre, Cesium planning, layer architecture, performance, UX, state/offline behavior, and fallback strategy.

---

## Verified Items (Repository-Evidenced)

### 1) React + geospatial stack baseline is clearly defined
- Frontend baseline is documented as Next.js + React + MapLibre, with PWA/offline components (`Serwist`, `Dexie`, `PMTiles`) and `zustand` state management in the dependency set ([README.md:7-11](../../README.md), [CLAUDE.md:28-37](../../CLAUDE.md), [package.json:17-28](../../package.json)).
- Architecture diagrams position a service layer between rendering engines and data providers, with three-tier fallback as a shared runtime behavior ([docs/architecture/SYSTEM_DESIGN.md:25-40](../architecture/SYSTEM_DESIGN.md), [docs/architecture/SYSTEM_DESIGN.md:73-100](../architecture/SYSTEM_DESIGN.md)).

### 2) MapLibre integration conventions are explicit and consistent
- MapLibre is the selected mapping engine; Leaflet/Mapbox GL JS are intentionally excluded in standards docs ([docs/architecture/ADR-002-mapping-engine.md:22-29](../architecture/ADR-002-mapping-engine.md), [.github/copilot/instructions/maplibre.instructions.md:9-13](../../.github/copilot/instructions/maplibre.instructions.md)).
- SSR exclusion for map components via dynamic import is repeatedly specified for Next.js compatibility (`ssr: false`) ([docs/specs/01-base-map.md:31-45](../specs/01-base-map.md)).
- Basemap attribution and Cape Town/WC spatial constraints are encoded as rules and acceptance criteria ([CLAUDE.md:93-105](../../CLAUDE.md), [docs/specs/01-base-map.md:62-76](../specs/01-base-map.md)).

### 3) Layering model is well-defined for 2D flows
- Canonical Z-order appears in both governance and system architecture docs: user-draw > risk > zoning > cadastral > suburbs > basemap ([CLAUDE.md:131-133](../../CLAUDE.md), [docs/architecture/SYSTEM_DESIGN.md:166-174](../architecture/SYSTEM_DESIGN.md)).
- Zoom gates are a first-class strategy (example: zoning min zoom 13; cadastral zoom thresholds), supporting rendering/load control ([docs/specs/03-zoning-overlays.md:53-66](../specs/03-zoning-overlays.md), [docs/PERFORMANCE_BUDGET.md:36-38](../PERFORMANCE_BUDGET.md)).

### 4) Fallback behavior is mandatory and highly structured
- LIVE → CACHED → MOCK is an accepted architecture rule and enforced across specs/ADRs, with source badge visibility requirements ([CLAUDE.md:61-67](../../CLAUDE.md), [docs/architecture/ADR-009-three-tier-fallback.md:34-57](../architecture/ADR-009-three-tier-fallback.md), [docs/specs/13-arcgis-fallback.md:20-27](../specs/13-arcgis-fallback.md)).
- Fallback wrappers include tenant-scoped cache keys and typed source metadata patterns ([docs/specs/13-arcgis-fallback.md:92-133](../specs/13-arcgis-fallback.md)).

### 5) Performance guardrails are measurable and domain-specific
- Explicit network, map-load, and payload targets exist (TTI, initial map load, layer constraints, tile timing) ([docs/PERFORMANCE_BUDGET.md:15-34](../PERFORMANCE_BUDGET.md), [docs/specs/01-base-map.md:79-85](../specs/01-base-map.md)).
- Additional pipeline/serve budgets are present for PMTiles and fallback latency classes ([docs/specs/08-pmtiles-pipeline.md:105-110](../specs/08-pmtiles-pipeline.md), [docs/specs/13-arcgis-fallback.md:54-60](../specs/13-arcgis-fallback.md)).

### 6) UX + accessibility expectations are documented at interaction level
- Mobile interactions, offline indicators, low-bandwidth mode behavior, and PWA install flow are explicitly specified ([docs/ux/mobile-patterns.md:30-47](../ux/mobile-patterns.md), [docs/ux/mobile-patterns.md:55-79](../ux/mobile-patterns.md), [docs/ux/mobile-patterns.md:80-98](../ux/mobile-patterns.md)).
- Accessibility includes ARIA map roles, keyboard controls, and badge status annunciation ([docs/ux/accessibility-guidelines.md:13-22](../ux/accessibility-guidelines.md), [docs/ux/accessibility-guidelines.md:47-53](../ux/accessibility-guidelines.md), [docs/ux/accessibility-guidelines.md:61-79](../ux/accessibility-guidelines.md)).

### 7) Offline/state behavior is documented with security constraints
- Background sync, cache strategy by resource type, iOS constraints, and lockout logic are documented in detail ([docs/specs/14-background-sync.md:20-28](../specs/14-background-sync.md), [docs/specs/14-background-sync.md:76-87](../specs/14-background-sync.md), [docs/specs/09-offline-sync-queue.md:75-83](../specs/09-offline-sync-queue.md)).
- Queue semantics (FIFO, retries, conflict paths) and RLS-sensitive sync behavior are explicitly defined ([docs/specs/09-offline-sync-queue.md:43-60](../specs/09-offline-sync-queue.md), [docs/specs/09-offline-sync-queue.md:99-105](../specs/09-offline-sync-queue.md)).

---

## Unverified Items (Documented but not implementation-proven in this repository)

1. **Cesium hybrid runtime is specified as Phase-2 architecture, not demonstrated in committed app code here.**
   - Hybrid component examples exist as task/spec content and are marked with planning/unknown notes ([docs/architecture/tasks/task-M5-hybrid-view.md:170-261](../architecture/tasks/task-M5-hybrid-view.md), [docs/architecture/tasks/task-M5-hybrid-view.md:375-380](../architecture/tasks/task-M5-hybrid-view.md), [docs/architecture/SYSTEM_DESIGN.md:15-16](../architecture/SYSTEM_DESIGN.md)).

2. **Multiple snippets reference future `app/src/...` implementation targets; repository currently centers on docs/specs and governance assets.**
   - Planned structure and future app paths are described in governance/spec docs ([CLAUDE.md:170-176](../../CLAUDE.md), [docs/architecture/tasks/task-M5-hybrid-view.md:413-423](../architecture/tasks/task-M5-hybrid-view.md)).

3. **Provider-side unknowns remain explicit** (e.g., Google 3D coverage, ion token topology, legal/contract cache windows).
   - These are tagged with uncertainty markers in integration/task docs ([docs/integrations/google-maps-tile-api.md:180-184](../integrations/google-maps-tile-api.md), [docs/integrations/cesium-platform.md:19-20](../integrations/cesium-platform.md), [docs/integrations/cesium-platform.md:125-129](../integrations/cesium-platform.md)).

---

## Risk / Mitigation (Docs + Architecture)

| Risk | Evidence | Impact | Mitigation (measurable) |
|---|---|---|---|
| Docs-code drift: extensive pseudocode without adjacent implementation status | [docs/specs/01-base-map.md:35-73](../specs/01-base-map.md), [docs/architecture/tasks/task-M5-hybrid-view.md:174-261](../architecture/tasks/task-M5-hybrid-view.md) | Medium: readers may treat examples as deployed | Add a `Status:` block to each spec with `Planned / Implemented / Verified` and a "last verified date"; target 100% of map-related docs updated. |
| Inconsistent cache/source conventions across docs | [docs/architecture/ADR-009-three-tier-fallback.md:79-91](../architecture/ADR-009-three-tier-fallback.md), [docs/specs/13-arcgis-fallback.md:136-145](../specs/13-arcgis-fallback.md) | Medium: integration ambiguity for new contributors | Create one canonical badge/fallback reference section and cross-link from all geospatial specs; target 0 conflicting badge formats in `docs/specs` + `docs/architecture`. |
| Accessibility criteria may be defined but not tied to map acceptance tests | [docs/ux/accessibility-guidelines.md:160-167](../ux/accessibility-guidelines.md), [docs/specs/01-base-map.md:141-153](../specs/01-base-map.md) | Medium: non-testable WCAG statements | Add explicit accessibility acceptance rows per map spec (keyboard + ARIA + badge announcement); target at least 3 a11y acceptance checks per geospatial spec. |
| Performance budgets distributed across files may diverge over time | [docs/PERFORMANCE_BUDGET.md:15-40](../PERFORMANCE_BUDGET.md), [docs/specs/08-pmtiles-pipeline.md:105-110](../specs/08-pmtiles-pipeline.md) | Medium: conflicting performance targets | Introduce one authoritative KPI table reference and include only links in per-feature docs; target single-source KPI ownership with no duplicated thresholds by end of next doc pass. |

---

## Suggested Updates by File Path (Measurable Documentation + Architecture Notes)

### A) `docs/specs/01-base-map.md`
- Add a short **Implementation Status Matrix**:
  - `Pattern`, `Spec’d`, `Implemented`, `Verified Date`, `Evidence Path`.
- Success metric: matrix populated for SSR exclusion, attribution, maxBounds, badges, fallback (5/5 rows complete).

### B) `docs/specs/03-zoning-overlays.md`
- Normalize fallback and badge wording to exactly match ADR-009 canonical phrasing.
- Add one line clarifying authoritative mock data location if path changes (`public/mock` vs other references).
- Success metric: no path mismatch for mock data references across zoning/fallback specs.

### C) `docs/specs/13-arcgis-fallback.md`
- Add a "Contracted Interface" block for `withFallback<T>` (input/output invariants).
- Success metric: include 4 invariants minimum (`tenant isolation`, `source enum`, `TTL behavior`, `error downgrade rules`).

### D) `docs/specs/14-background-sync.md` and `docs/specs/09-offline-sync-queue.md`
- Add a shared cross-reference subsection named `Offline Write/Read Relationship` to reduce duplication and clarify boundaries.
- Success metric: each file contains reciprocal anchor links; no contradictory retry/lockout thresholds.

### E) `docs/architecture/SYSTEM_DESIGN.md`
- Add explicit verification legend for each pillar (`Implemented`, `Spec-only`, `Roadmap`).
- Success metric: all six pillars carry one of three statuses with evidence links.

### F) `docs/architecture/tasks/task-M5-hybrid-view.md`
- Add a preface banner: `Speculative implementation sketch — not yet repository runtime code`.
- Success metric: banner present and referenced by at least one upstream architecture doc.

### G) `docs/ux/accessibility-guidelines.md`
- Add geospatial acceptance mapping table linking each checklist item to map specs.
- Success metric: map specs (`01`, `03`, `13`, `14`) each linked to at least one keyboard + one screen-reader criterion.

---

## Architecture Notes (Repository-Relevant Synthesis)

1. The repository describes a **service-layer-first geospatial frontend** where rendering engines (MapLibre now, Cesium planned) are downstream of fallback/state policies ([docs/architecture/SYSTEM_DESIGN.md:25-40](../architecture/SYSTEM_DESIGN.md), [docs/architecture/ADR-009-three-tier-fallback.md:38-57](../architecture/ADR-009-three-tier-fallback.md)).
2. **Map performance and safety are policy-bound**, not only implementation-bound, via explicit rules (zoom gating, feature limits, source badges, never-blank map) ([CLAUDE.md:127-134](../../CLAUDE.md), [docs/PERFORMANCE_BUDGET.md:24-39](../PERFORMANCE_BUDGET.md)).
3. **Hybrid 2D/3D direction exists as architecture intent with known unknowns**, requiring ongoing separation of verified runtime behavior from planned capabilities ([docs/architecture/tasks/task-M5-hybrid-view.md:3-10](../architecture/tasks/task-M5-hybrid-view.md), [docs/integrations/cesium-platform.md:125-129](../integrations/cesium-platform.md)).

---

## Conclusion
For this repository, React geospatial visualization guidance is strong at spec/ADR level, especially for MapLibre conventions, fallback policy, and offline UX. The main documentation quality concern is not missing patterns, but consistent verification labeling across planned vs implemented behavior.
