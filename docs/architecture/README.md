# 🏗️ CapeTown GIS Hub — Architecture Index

> **TL;DR:** 24 architecture documents covering ADRs (decision records), system design, tile layer strategy, 3D/AI reconstruction pipelines, MCP server config, agent design, coordinate systems, data fusion, OSINT layers, and TECH_STACK. These define **HOW** the system is built; specs (`docs/specs/`) define **WHAT** to build.

---

## Architecture Decision Records (ADRs)

| ADR | Title | Status | Decision |
|-----|-------|--------|----------|
| [ADR-001](ADR-001-monorepo-pivot.md) | Next.js 15 Monorepo Pivot | Accepted | Turbo monorepo + Next.js 15 App Router for multi-tenant white-label |
| [ADR-002](ADR-002-mapping-engine.md) | Mapping Engine Selection | Accepted | **MapLibre GL JS** — not Leaflet, not Mapbox GL JS |
| [ADR-003](ADR-003-tile-server.md) | Tile Server | Accepted | **Martin** (Rust MVT) over pg_tileserv and GeoServer |
| [ADR-004](ADR-004-billing-stripe.md) | Billing & Subscription | Accepted | Stripe over PayStack / Peach Payments |
| [ADR-005](ADR-005-tenant-subdomains.md) | Tenant URL Strategy | Accepted | Subdomain routing `[tenant-slug].capegis.com` |
| [ADR-006](ADR-006-desktop-to-web-mapping.md) | Desktop-to-Web GIS Mapping | Accepted | ArcGIS Pro → web GIS mental model translation dictionary |
| [ADR-007](ADR-007-offline-first.md) | Offline-First Architecture | Accepted | Serwist + Dexie.js + PMTiles |
| [ADR-008](ADR-008-playful-ui.md) | Playful Documentation UI | Accepted | Ralph Wiggum theme with technical toggle |
| [ADR-009](ADR-009-three-tier-fallback.md) | Three-Tier Data Fallback | Accepted | LIVE → CACHED (`api_cache`) → MOCK — mandatory for all external data |

---

## Core System Documents

| File | Description | Cross-reference |
|------|-------------|----------------|
| [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) | Multi-tenant GIS PWA architecture: Next.js 15 + MapLibre + Supabase + Martin | All milestones |
| [TECH_STACK.md](TECH_STACK.md) | Authoritative tech stack v4.0: approved libraries, prohibited technologies, MCP servers, Copilot skills | CLAUDE.md Rules 1–10 |
| [tile-layer-architecture.md](tile-layer-architecture.md) | Tile delivery pipeline, tenant-isolated caching, Z-order, CDN strategy | M2, M3, M4b |

---

## 3D, AI & Reconstruction Architecture

| File | Description | Milestone |
|------|-------------|-----------|
| [3d-scene-composition.md](3d-scene-composition.md) | 8-layer 3D scene stack, render order, Z-depth strategy, LOD cascade | M8 |
| [ai-reconstruction-pipeline.md](ai-reconstruction-pipeline.md) | NeRF / 3DGS / 4DGS pipeline — data ingestion through scene output | M8+ |
| [controlnet-workflow.md](controlnet-workflow.md) | ControlNet workflow for sparse-view GIS reconstruction | M8+ |
| [ai-content-labeling.md](ai-content-labeling.md) | Mandatory AI content labeling specification and legal rationale | M8, M15 |

---

## Data & Integration Architecture

| File | Description | Milestone |
|------|-------------|-----------|
| [coordinate-system-detection.md](coordinate-system-detection.md) | CRS detection, normalization, and reprojection pipeline (EPSG:4326 → 3857) | M3, M4a |
| [file-import-pipeline.md](file-import-pipeline.md) | File import pipeline: .shp, .gdb, .qgz, GeoJSON, GeoPackage ingestion flow | M3 |
| [data-fusion-ontology.md](data-fusion-ontology.md) | Data fusion ontology — Pillar 2: cross-source spatial entity merging | M6+ |
| [osint-intelligence-layer.md](osint-intelligence-layer.md) | OSINT intelligence layer architecture — Pillar 2: flight, maritime, urban signals | M7+ |

---

## Agent & MCP Architecture

| File | Description | Milestone |
|------|-------------|-----------|
| [gis-copilot-agent-design.md](gis-copilot-agent-design.md) | GIS Copilot agent design: fleet structure, handoff protocols, routing rules | M0 |
| [mcp-diagnostics-2026-03-05.md](mcp-diagnostics-2026-03-05.md) | MCP server audit report: 9 findings, 9 fixes, config map, manual action checklist | M0 |

---

## Ops & Governance

| File | Description | Milestone |
|------|-------------|-----------|
| [root-cleanup-audit.md](root-cleanup-audit.md) | Root directory audit: every file catalogued, classified, and actioned | M0 |
| [swarm-architecture-insights-cycle1.md](swarm-architecture-insights-cycle1.md) | Architecture insights from Cycle 1 swarm: integration risks, sequencing recommendations | M0+ |

---

## Task Scaffolds (`tasks/` subfolder)

| File | Scope | Milestone |
|------|-------|-----------|
| [task-M5-hybrid-view.md](tasks/task-M5-hybrid-view.md) | Hybrid 2D/3D view switch task scaffold | M5 |
| [task-M5-M7-sensor-fusion.md](tasks/task-M5-M7-sensor-fusion.md) | Multi-sensor fusion task scaffold (AIS + OpenSky + urban) | M5, M7 |
| [task-M7-opensky-flight-layer.md](tasks/task-M7-opensky-flight-layer.md) | OpenSky real-time flight layer task scaffold | M7 |
| [task-M8-4DGS-temporal-scrubbing.md](tasks/task-M8-4DGS-temporal-scrubbing.md) | 4DGS temporal event replay and timeline scrubber task scaffold | M8 |

---

## Quick Navigation

| Need | Go to |
|------|-------|
| Which mapping library? | [ADR-002](ADR-002-mapping-engine.md) |
| Which tile server? | [ADR-003](ADR-003-tile-server.md) |
| How does multi-tenancy work? | [ADR-005](ADR-005-tenant-subdomains.md) + [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) |
| What's the offline strategy? | [ADR-007](ADR-007-offline-first.md) |
| What's the three-tier fallback? | [ADR-009](ADR-009-three-tier-fallback.md) |
| What's the approved tech stack? | [TECH_STACK.md](TECH_STACK.md) |
| What MCP servers are configured? | [mcp-diagnostics-2026-03-05.md](mcp-diagnostics-2026-03-05.md) |
| How does 3D reconstruction work? | [ai-reconstruction-pipeline.md](ai-reconstruction-pipeline.md) |
| Feature specs (WHAT to build) | [`../specs/README.md`](../specs/README.md) |
| Research corpus (evidence base) | [`../research/README.md`](../research/README.md) |

---

*Architecture index created: 2026-03-06 · 24 documents + 4 task scaffolds · Governed by CLAUDE.md Rules 1–10*
