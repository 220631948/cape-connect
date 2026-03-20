# Copilot Agent Fleet Audit

> **TL;DR:** Audit pruned 55 discovered agents down to a canonical 10-agent fleet. All `.claude/agents/` (24) and `.gemini/agents/` (14 of 15) definitions were removed as duplicates. The 10 retained agents live in `.github/agents/` (2) and `.github/copilot/agents/` (8). One `.gemini/agents/bootstrap-agent.md` is held pending confirmation. See `AGENTS.md` for the authoritative fleet.

- Generated: 2026-03-05T11:13:04.516481+00:00
- Scope: `.github/copilot/agents`, `.github/agents`, `.claude/agents`, `.gemini/agents`
- Backups excluded: `.github_backup/**`, `.claude_backup/**`
- Target fleet size: **10**

## 1) Discovery Summary

- Total agents discovered: **55**
- `.github/copilot/agents`: **10**
- `.github/agents`: **6**
- `.claude/agents`: **24**
- `.gemini/agents`: **15**

## 2) Full Agent Inventory

| File | Agent name | Purpose | Domain | Files it controls | Tools/MCP refs | Class | Status |
|---|---|---|---|---|---|---|---|
| `.claude/agents/ai-agent.agent.md` | AI Agent | You are the **AI Agent**, the documentation expert for the platform's most technically ambitio… | NeRF · 3DGS · ControlNet · GIS Copilot Documentation Specialist | docs/integrations/nerf-3dgs-integration.md; docs/integrations/cesium-nerf-export.md; … | Not explicitly specified | KEEP | REMOVED |
| `.claude/agents/auth-agent.md` | AUTH-AGENT | Designs and implements authentication flows, session management, role-based access control, an… | Primary: M2 — Auth, RBAC, POPIA Consent | app/src/lib/auth/; app/src/hooks/useAuth.ts; … | Claude Code CLI; popia-compliance; documentation-first; … | OPTIONAL | REMOVED |
| `.claude/agents/cesium-agent.md` | CESIUM-AGENT | Manages the CesiumJS viewer, Google Photorealistic 3D Tiles integration, 3D scene composition,… | Primary: CesiumJS 3D viewer and scene management | app/src/components/cesium/; app/src/hooks/useCesium.ts; … | Claude Code CLI; spatial-validation; three-tier-fallback | KEEP | REMOVED |
| `.claude/agents/dashboard-agent.md` | DASHBOARD-AGENT | Builds the analytics dashboard with Recharts, showing aggregate statistics, trend lines, and s… | Primary: M11 — Analytics Dashboard | app/src/components/dashboard/; app/src/hooks/useDashboard.ts; … | Claude Code CLI; three-tier-fallback; documentation-first | REMOVE | REMOVED |
| `.claude/agents/data-agent.md` | DATA-AGENT | Implements the three-tier data fallback system (LIVE→CACHED→MOCK), manages the `api_cache` tab… | Primary: M4a — Three-Tier Fallback; Secondary: M6 — GV Roll 2022 Import | app/src/lib/data/; app/src/hooks/useDataService.ts; … | Claude Code CLI; three-tier-fallback; mock-to-live-validation; … | KEEP | REMOVED |
| `.claude/agents/db-agent.md` | DB-AGENT | Database schema specialist for the Cape Town Web GIS platform. Designs PostgreSQL + PostGIS ta… | Primary: M1 — Database Schema, RLS, PostGIS; Secondary: M4d — RLS Test Har… | supabase/migrations/*.sql; supabase/seed.sql; … | Claude Code CLI; rls-audit; popia-compliance; … | KEEP | REMOVED |
| `.claude/agents/details-agent.md` | DETAILS-AGENT | Builds the property detail panel showing valuation data (GV Roll 2022), zoning info, parcel ge… | Primary: M10 — Property Detail Panel | app/src/components/panels/PropertyDetail.tsx; app/src/components/panels/ValuationCard.tsx… | Claude Code CLI; popia-compliance; three-tier-fallback; … | REMOVE | REMOVED |
| `.claude/agents/domains-agent.agent.md` | Domains Agent | You are the **Domains Agent**, the documentation expert for making sure the platform actually … | 11 User Domain Guides + UX Accessibility Specialist | docs/user-guides/urban-planners.md; docs/user-guides/emergency-responders.md; … | Not explicitly specified | KEEP | REMOVED |
| `.claude/agents/export-agent.md` | EXPORT-AGENT | Implements multi-tenant white-labeling, share URLs, data export functionality, and tenant bran… | Primary: M12 — Multi-Tenant White-Labeling; Secondary: M13 — Share URLs | app/src/components/tenant/; app/src/components/export/; … | Claude Code CLI; popia-compliance; documentation-first | REMOVE | REMOVED |
| `.claude/agents/flight-tracking-agent.md` | FLIGHT-TRACKING-AGENT | Integrates the OpenSky Network API for real-time Cape Town airspace visualization. Manages fli… | Primary: Real-time flight tracking and airspace visualization | app/src/lib/flight-tracking/; app/src/components/flight/; … | Claude Code CLI; three-tier-fallback; data-source-badge, [OpenSky · 2026 · LIVE|CACHED|MO… | KEEP | REMOVED |
| `.claude/agents/immersive-reconstruction-agent.md` | IMMERSIVE-RECONSTRUCTION-AGENT | Manages NeRF, 3D Gaussian Splatting (3DGS), and 4D Gaussian Splatting (4DGS) reconstruction pi… | Primary: Immersive spatial reconstruction pipeline | services/reconstruction/; services/reconstruction/colmap/; … | Claude Code CLI; spatial-validation; assumption-verification | KEEP | REMOVED |
| `.claude/agents/infra-agent.agent.md` | Infra Agent | You are the **Infra Agent**, the fleet's last agent and its most grounding voice. You run afte… | Docker · Environment · Feature Backlog · Risk Register | docs/docker/environment-config.md; docs/docker/DOCKER_README.md; … | Not explicitly specified | KEEP | REMOVED |
| `.claude/agents/map-agent.md` | MAP-AGENT | Builds the MapLibre GL JS base map, dark dashboard shell, responsive layout, and accessibility… | Primary: M3 — MapLibre Base Map | app/src/components/map/; app/src/components/layout/; … | Claude Code CLI; documentation-first | KEEP | REMOVED |
| `.claude/agents/orchestrator.agent.md` | Orchestrator Agent | You are the **Orchestrator**, the fleet commander of the GIS Spatial Intelligence Platform doc… | Fleet Commander & Synthesis Engine | ROADMAP.md; README.md; … | Not explicitly specified | KEEP | REMOVED |
| `.claude/agents/osint-agent.agent.md` | OSINT Agent | You are the **OSINT Agent**, the documentation expert for everything that moves through the sk… | OpenSky Network + Palantir Intelligence Fusion Specialist | docs/integrations/opensky-network.md; docs/architecture/osint-intelligence-layer.md; … | Not explicitly specified | KEEP | REMOVED |
| `.claude/agents/overlay-agent.md` | OVERLAY-AGENT | Integrates Martin MVT tile layers, builds zoning overlays with IZS codes, manages layer Z-orde… | Primary: M4b — Martin MVT Integration; Secondary: M5 — Zoning Overlay (IZS… | app/src/components/map/layers/; app/src/lib/map/layers.ts; … | Claude Code CLI; mock-to-live-validation; documentation-first | KEEP | REMOVED |
| `.claude/agents/save-agent.md` | SAVE-AGENT | Implements favourites (bookmarked properties) and saved searches (persisted filter configurati… | Primary: M9 — Favourites + Saved Searches | app/src/components/favourites/; app/src/components/saved-searches/; … | Claude Code CLI; popia-compliance; documentation-first | REMOVE | REMOVED |
| `.claude/agents/search-agent.md` | SEARCH-AGENT | Implements property search, geocoding, address autocomplete, and filter interfaces. Connects s… | Primary: M7 — Search + Filters | app/src/components/search/; app/src/hooks/useSearch.ts; … | Claude Code CLI; documentation-first; popia-compliance | REMOVE | REMOVED |
| `.claude/agents/spatial-agent.md` | SPATIAL-AGENT | Implements draw-polygon tools, spatial queries (buffer, intersection, within), area/perimeter … | Primary: M8 — Draw Polygon + Spatial Analysis | app/src/components/map/draw/; app/src/lib/spatial/; … | Claude Code CLI; documentation-first; assumption-verification | KEEP | REMOVED |
| `.claude/agents/spatial-upload-agent.md` | SPATIAL-UPLOAD-AGENT | Handles the upload pipeline for ArcGIS Shapefiles (.shp/.dbf/.shx/.prj), File Geodatabases (.g… | Primary: Spatial data upload and import pipeline | app/src/lib/upload/; app/src/components/upload/; … | Claude Code CLI; spatial-validation; popia-compliance; … | KEEP | REMOVED |
| `.claude/agents/test-agent.md` | TEST-AGENT | Writes and maintains the test suite: Vitest unit tests, RLS isolation tests, Playwright E2E te… | Primary: M4d — RLS Test Harness; Secondary: M14 — QA (all acceptance crite… | __tests__/; e2e/; … | Claude Code CLI; rls-audit; assumption-verification | OPTIONAL | REMOVED |
| `.claude/agents/tile-agent.md` | TILE-AGENT | Owns the end-to-end vector tile pipeline: Martin MVT tile server configuration, PMTiles genera… | Primary: M5 — Cadastral Layer + Tile Pipeline; Secondary: M6 — Offline Mod… | app/src/lib/tiles/; app/src/hooks/useTiles.ts; … | Claude Code CLI; three-tier-fallback; assumption-verification | KEEP | REMOVED |
| `.claude/agents/tiles-agent.agent.md` | Tiles Agent | You are the **Tiles Agent**, the documentation expert for everything that makes the GIS platfo… | Google Maps Platform + CesiumJS Documentation Specialist | docs/integrations/google-maps-tile-api.md; docs/integrations/cesium-platform.md; … | Not explicitly specified | KEEP | REMOVED |
| `.claude/agents/vibecoding-steering-agent.md` | VIBECODING-STEERING-AGENT | Meta-agent that ensures all vibecoding sessions stay aligned with PLAN.md, CLAUDE.md rules, an… | Primary: Cross-cutting governance across all milestones | docs/PLAN_DEVIATIONS.md; docs/OPEN_QUESTIONS.md; … | Claude Code CLI; assumption-verification; documentation-first; … | KEEP | REMOVED |
| `.gemini/agents/auth-agent.md` | AUTH-AGENT 🔐 — Authentication & RBAC Specialist | Authentication, session management, RBAC, and POPIA consent design. | Authentication & RBAC Specialist | docs/specs/02-authentication-rbac.md (was AUTH_DESIGN.md)`, `src/contexts/AuthContext.tsx`, `src/hooks/useAuth.ts`, auth pages,… | ArcGIS; Supabase | OPTIONAL | REMOVED |
| `.gemini/agents/bootstrap-agent.md` | BOOTSTRAP-AGENT 🏗️ | "Geospatial agent for the Cape Town GIS project." | "Geospatial agent for the Cape Town GIS project." | Reading planning documents (`PLAN.md`, `docs/*.md`); Writing documentation files (`docs/*… | Supabase | KEEP | KEPT_PENDING_CONFIRMATION |
| `.gemini/agents/dashboard-agent.md` | DASHBOARD-AGENT 📊 — Analytics Dashboard Specialist | Analytics dashboard, suburb deep dive charts, metro stats, and PDF export. | Analytics Dashboard Specialist | Not explicitly specified | Not explicitly specified | REMOVE | REMOVED |
| `.gemini/agents/data-agent.md` | DATA-AGENT 🌐 — Data Integration Specialist | Live ArcGIS data integration, cache layer, viewport loading, and GV Roll import. | Data Integration Specialist | Not explicitly specified | ArcGIS; Supabase | KEEP | REMOVED |
| `.gemini/agents/db-agent.md` | DB-AGENT 🗄️ — Database Schema Architect | Database schema architect for PostGIS, RLS, RBAC, and multi-tenancy design. | Database Schema Architect | Not explicitly specified | PostGIS; Supabase | KEEP | REMOVED |
| `.gemini/agents/deployment-specialist.agent` | deployment-specialist.agent | "Handles the complex orchestration of Docker Compose, LocalStack, and multi-cloud deployments." | "Handles the complex orchestration of Docker Compose, LocalStack, and mult… | Not explicitly specified | Docker | REMOVE | REMOVED |
| `.gemini/agents/details-agent.md` | DETAILS-AGENT 📋 — Property Details Specialist | Property details panel, nearby amenities, trend charts, and Street View. | Property Details Specialist | Not explicitly specified | Not explicitly specified | REMOVE | REMOVED |
| `.gemini/agents/export-agent.md` | EXPORT-AGENT 📤 — Share & Export Specialist | Share links, map image export, WhatsApp URL optimization, and client views. | Share & Export Specialist | Not explicitly specified | Not explicitly specified | REMOVE | REMOVED |
| `.gemini/agents/gis-architect.agent` | gis-architect.agent | "Senior Geospatial Full-Stack Architect and White-Label SaaS Specialist." | "Senior Geospatial Full-Stack Architect and White-Label SaaS Specialist." | Not explicitly specified | MapLibre; PostGIS; Supabase; … | KEEP | REMOVED |
| `.gemini/agents/map-agent.md` | MAP-AGENT 🗺️ — Map Infrastructure Specialist | Base map, dark dashboard shell, responsive layout, and accessibility. | Map Infrastructure Specialist | MapLibre GL JS ONLY** — NOT Leaflet. Load via `next/dynamic({ ssr: false })`. | MapLibre; ArcGIS | KEEP | REMOVED |
| `.gemini/agents/overlay-agent.md` | OVERLAY-AGENT 🧩 — GeoJSON Overlay Specialist | GeoJSON overlay system, layer registry, mock data, popups, and data badges. | GeoJSON Overlay Specialist | Build popup content and data source badges (`[LIVE]` / `[CACHED]` / `[MOCK]`). | Not explicitly specified | KEEP | REMOVED |
| `.gemini/agents/save-agent.md` | SAVE-AGENT 💾 — Persistence & POPIA Specialist | Favourites, saved searches, multi-tenant workspaces, POPIA account deletion. | Persistence & POPIA Specialist | Not explicitly specified | Not explicitly specified | REMOVE | REMOVED |
| `.gemini/agents/search-agent.md` | SEARCH-AGENT 🔍 — Search & Filter Specialist | Suburb search, price/zoning filters, heatmap, and URL state management. | Search & Filter Specialist | Not explicitly specified | Not explicitly specified | REMOVE | REMOVED |
| `.gemini/agents/spatial-agent.md` | SPATIAL-AGENT 📐 — Spatial Computation Specialist | PostGIS + client-side spatial analysis with Cape Town geographic constraints. | Spatial Computation Specialist | Not explicitly specified | PostGIS | KEEP | REMOVED |
| `.gemini/agents/test-agent.md` | TEST-AGENT 🧪 — Quality Assurance Specialist | QA specialist that finds bugs and reports them. Never fixes bugs. | Quality Assurance Specialist | docs/specs/ (QA plan pending M14)`, `src/__tests__/` files. | Not explicitly specified | OPTIONAL | REMOVED |
| `.github/agents/ai-agent.agent.md` | AI Agent | Documentation specialist for NeRF/3DGS, ControlNet workflows, and AI-content labeling governan… | NeRF · 3DGS · ControlNet · GIS Copilot Documentation Specialist | docs/integrations/nerf-3dgs-integration.md; docs/integrations/cesium-nerf-export.md; … | Instant-NGP; Nerfstudio; ControlNet / ControlNet++; … | KEEP | REMOVED |
| `.github/agents/domains-agent.agent.md` | Domains Agent | Documentation specialist translating platform features into role-specific guides for 11 domain… | 11 User Domain Guides + UX Accessibility Specialist | docs/user-guides/urban-planners.md; docs/user-guides/emergency-responders.md; … | WCAG 2.1 | KEEP | REMOVED |
| `.github/agents/infra-agent.agent.md` | Infra Agent | Documentation specialist for Docker/environment setup, feature backlog prioritisation, and ris… | Docker · Environment · Feature Backlog · Risk Register | docs/docker/environment-config.md; docs/docker/DOCKER_README.md; … | Docker; Docker Compose; GitHub secret scanning | KEEP | KEPT |
| `.github/agents/orchestrator.agent.md` | Orchestrator Agent | Fleet commander that decomposes subagent tasks, audits consistency, and synthesises root-level… | Fleet Commander & Synthesis Engine | ROADMAP.md; README.md; … | Not explicitly specified | KEEP | KEPT |
| `.github/agents/osint-agent.agent.md` | OSINT Agent | Documentation specialist for OpenSky integration and Palantir-inspired intelligence fusion ont… | OpenSky Network + Palantir Intelligence Fusion Specialist | docs/integrations/opensky-network.md; docs/architecture/osint-intelligence-layer.md; … | OpenSky Network REST API; HTTP Basic Auth; CesiumJS; … | KEEP | REMOVED |
| `.github/agents/tiles-agent.agent.md` | Tiles Agent | Documentation specialist for Google tile infrastructure and CesiumJS 3D scene composition. | Google Maps Platform + CesiumJS Documentation Specialist | docs/integrations/google-maps-tile-api.md; docs/integrations/cesium-platform.md; … | Google Maps Map Tiles API; CesiumJS; Cesium ion; … | KEEP | REMOVED |
| `.github/copilot/agents/cesium-agent.agent.md` | Cesium Agent | CesiumJS 3D viewer, Google Photorealistic 3D Tiles, and 3D scene composition. | CesiumJS 3D Viewer Specialist | CesiumJS components; hooks; … | editFiles; codebase; search; … | KEEP | KEPT |
| `.github/copilot/agents/data-agent.agent.md` | Data Agent | Live ArcGIS data integration, cache layer, viewport loading, and GV Roll import. | Data Integration Specialist | Not explicitly specified | editFiles; codebase; search; … | KEEP | KEPT |
| `.github/copilot/agents/db-agent.agent.md` | DB Agent | Database schema architect for PostGIS, RLS, RBAC, and multi-tenancy design. | Database Schema Architect | supabase/ directory only — schema docs; migration plans; … | editFiles; codebase; search; … | KEEP | KEPT |
| `.github/copilot/agents/flight-tracking-agent.agent.md` | Flight Tracking Agent | OpenSky Network integration for real-time Cape Town airspace visualization. | OpenSky Network & Airspace Visualization Specialist | Flight tracking lib; flight components; … | editFiles; codebase; search; … | KEEP | KEPT |
| `.github/copilot/agents/immersive-reconstruction-agent.agent.md` | Immersive Reconstruction Agent | NeRF/3DGS/4DGS reconstruction pipelines for Cape Town 3D scenes. | NeRF/3DGS/4DGS Pipeline Specialist | Reconstruction services; COLMAP configs; … | editFiles; codebase; search; … | KEEP | KEPT |
| `.github/copilot/agents/map-agent.agent.md` | Map Agent | Base map, dark dashboard shell, responsive layout, and accessibility. | Map Infrastructure Specialist | Map components; layout components; … | editFiles; codebase; search; … | KEEP | KEPT |
| `.github/copilot/agents/spatial-agent.agent.md` | Spatial Agent | PostGIS + client-side spatial analysis with Cape Town geographic constraints. | Spatial Computation Specialist | Not explicitly specified | editFiles; codebase; search; … | KEEP | KEPT |
| `.github/copilot/agents/spatial-upload-agent.agent.md` | Spatial Upload Agent | ArcGIS .shp/.gdb and QGIS .qgz file upload, validation, reprojection, and PostGIS import. | ArcGIS/QGIS File Upload Pipeline Specialist | Upload lib; upload components; … | editFiles; codebase; search; … | KEEP | REMOVED |
| `.github/copilot/agents/test-agent.agent.md` | Test Agent | QA specialist that finds bugs and reports them. Never fixes bugs. | Quality Assurance Specialist | docs/specs/ (QA plan pending M14); src/__tests__/ files | codebase; search; fetch; … | OPTIONAL | KEPT |
| `.github/copilot/agents/vibecoding-steering-agent.agent.md` | Vibecoding Steering Agent | Meta-agent ensuring vibecoding sessions align with PLAN.md, CLAUDE.md rules, and current phase. | Meta-Agent & Session Governance Specialist | Deviation logs; open questions; … | editFiles; codebase; search; … | KEEP | REMOVED |

## 3) Classification Results

- KEEP: **39**
- OPTIONAL: **5**
- REMOVE: **11**
- Needs confirmation flagged during classification: **1**

## 4) Duplicate / Overlap Analysis

- Duplicate groups identified: **12**
- Merge candidates: **34**
- Remove candidates (group-level): **11**

| Duplicate group | Overlap reason | Recommended primary |
|---|---|---|
| orchestration_control_plane | All members coordinate subagents, enforce plan/rule compliance, and synthesize fleet output. | Orchestrator Agent [.github/agents/orchestrator.agent.md] |
| gis_surface_and_overlay | Map shell, layer rendering, and overlay/layer-order responsibilities materially overlap. | Map Agent [.github/copilot/agents/map-agent.agent.md] |
| data_ingestion_and_fallback | ArcGIS/QGIS ingestion and LIVE→CACHED→MOCK data flow are one contiguous ingestion responsibility. | Data Agent [.github/copilot/agents/data-agent.agent.md] |
| spatial_computation_core | All three own Turf/PostGIS spatial operations under Cape Town geographic constraints. | Spatial Agent [.github/copilot/agents/spatial-agent.agent.md] |
| database_security_and_persistence | RLS, RBAC, tenant data isolation, and persistence/consent flows overlap at data-governance boundaries. | DB Agent [.github/copilot/agents/db-agent.agent.md] |
| cesium_and_tile_pipeline | Cesium scene composition and tile/PMTiles/MVT infrastructure are tightly coupled in 3D rendering workflows. | Cesium Agent [.github/copilot/agents/cesium-agent.agent.md] |
| spatial_ai_reconstruction_docs | NeRF/3DGS/4DGS and AI reconstruction documentation responsibilities overlap heavily. | Immersive Reconstruction Agent [.github/copilot/agents/immersive-reconstruction-agent.agent.md] |
| osint_and_flight_intelligence | Both sets aggregate live intelligence feeds (OpenSky/OSINT) into geospatial situational awareness. | Flight Tracking Agent [.github/copilot/agents/flight-tracking-agent.agent.md] |
| infra_and_domain_docs | All are documentation/synthesis roles with adjacent scope and repeated output surfaces. | Infra Agent [.github/agents/infra-agent.agent.md] |
| quality_assurance_optional | All are QA-focused with near-identical testing mission and duplicated execution boundaries. | Test Agent [.github/copilot/agents/test-agent.agent.md] |
| business_feature_silos_sunset | Feature-silo UI agents overlap with map/data/spatial execution surfaces and are already classified REMOVE. | Map Agent [.github/copilot/agents/map-agent.agent.md] |
| bootstrap_generalists_review | Broad generalist/architect/deployment scopes overlap but are not crisply bounded; one member is explicitly unclear-purp… | gis-architect.agent [.gemini/agents/gis-architect.agent] |

## 5) Final Minimal Fleet (10)

| Role | Canonical agent | Why retained |
|---|---|---|
| copilot-orchestration | `.github/agents/orchestrator.agent.md` | Single control-plane owner for planning, delegation, and policy checks across the fleet. |
| system-architecture-documentation | `.github/agents/infra-agent.agent.md` | Central owner for architecture constraints, infrastructure risks, and design documentation synthesis. |
| gis-domain-map-infrastructure | `.github/copilot/agents/map-agent.agent.md` | Primary owner for MapLibre lifecycle, layer ordering, and UI map surface behavior. |
| data-ingestion-fallback | `.github/copilot/agents/data-agent.agent.md` | Owns external-source ingestion and the mandatory LIVE→CACHED→MOCK fallback path. |
| spatial-analysis-core | `.github/copilot/agents/spatial-agent.agent.md` | Maintains CRS guardrails, Turf/PostGIS spatial logic, and Cape Town bounds validation. |
| database-governance | `.github/copilot/agents/db-agent.agent.md` | Owns PostGIS schema, RLS/RBAC isolation, and tenant-safe persistence patterns. |
| gis-3d-tiles-visualization | `.github/copilot/agents/cesium-agent.agent.md` | Covers Cesium and 3D tile rendering architecture required for immersive GIS views. |
| spatial-ai-pipeline | `.github/copilot/agents/immersive-reconstruction-agent.agent.md` | Owns NeRF/3DGS/4DGS reconstruction pipeline and spatial AI execution guidance. |
| research-intelligence | `.github/copilot/agents/flight-tracking-agent.agent.md` | Provides live geospatial intelligence/research stream integration via OpenSky and related feeds. |
| optional-testing-review | `.github/copilot/agents/test-agent.agent.md` | Provides optional quality gate coverage for lint/type/test and regression checks. |

## 6) Removal List (with reasons)

- Files removed: **44**

| Removed file | Classification | Reason |
|---|---|---|
| `.claude/agents/ai-agent.agent.md` | KEEP | AI reconstruction and labeling governance are core spatial AI goals. |
| `.claude/agents/auth-agent.md` | OPTIONAL | Authentication/RBAC/consent is security support outside core GIS architecture. |
| `.claude/agents/cesium-agent.md` | KEEP | Cesium/3D tiles work is core GIS architecture and immersive spatial context. |
| `.claude/agents/dashboard-agent.md` | REMOVE | Dashboard feature delivery is outside architecture/GIS/spatial-AI core goals. |
| `.claude/agents/data-agent.md` | KEEP | Three-tier data integration and source governance are core system design. |
| `.claude/agents/db-agent.md` | KEEP | PostGIS/RLS/RBAC schema design is core platform architecture. |
| `.claude/agents/details-agent.md` | REMOVE | Property details workflow is a product feature, not core architecture scope. |
| `.claude/agents/domains-agent.agent.md` | KEEP | Role/domain documentation aligns with documentation and research goals. |
| `.claude/agents/export-agent.md` | REMOVE | Share/export workflows are peripheral to core architecture/research goals. |
| `.claude/agents/flight-tracking-agent.md` | KEEP | OpenSky fusion aligns with spatial intelligence and research goals. |
| `.claude/agents/immersive-reconstruction-agent.md` | KEEP | NeRF/3DGS/4DGS reconstruction is explicit spatial AI pipeline scope. |
| `.claude/agents/infra-agent.agent.md` | KEEP | Environment and risk architecture docs support core system design. |
| `.claude/agents/map-agent.md` | KEEP | Map infrastructure and layer architecture are core GIS capabilities. |
| `.claude/agents/orchestrator.agent.md` | KEEP | Fleet orchestration and synthesis match core orchestration/system design goals. |
| `.claude/agents/osint-agent.agent.md` | KEEP | OSINT/spatial fusion documentation supports core research goals. |
| `.claude/agents/overlay-agent.md` | KEEP | Overlay/layer registry and badges are core GIS map architecture. |
| `.claude/agents/save-agent.md` | REMOVE | Favourites/saved-search persistence is a user workflow, not core audit scope. |
| `.claude/agents/search-agent.md` | REMOVE | Search/filter UX workflow is not part of core architecture/spatial-AI goals. |
| `.claude/agents/spatial-agent.md` | KEEP | Spatial analysis and geographic constraints are core GIS functions. |
| `.claude/agents/spatial-upload-agent.md` | KEEP | ArcGIS/QGIS ingestion and reprojection are core GIS pipeline needs. |
| `.claude/agents/test-agent.md` | OPTIONAL | Testing is quality support (optional) rather than primary architecture scope. |
| `.claude/agents/tile-agent.md` | KEEP | Martin/PMTiles implementation pipeline is core GIS architecture. |
| `.claude/agents/tiles-agent.agent.md` | KEEP | Tile infrastructure documentation is core GIS architecture/system design. |
| `.claude/agents/vibecoding-steering-agent.md` | KEEP | Governance/orchestration of agent workflows is a core Copilot objective. |
| `.gemini/agents/auth-agent.md` | OPTIONAL | Authentication/RBAC/consent is security support outside core GIS architecture. |
| `.gemini/agents/dashboard-agent.md` | REMOVE | Dashboard feature delivery is outside architecture/GIS/spatial-AI core goals. |
| `.gemini/agents/data-agent.md` | KEEP | Three-tier data integration and source governance are core system design. |
| `.gemini/agents/db-agent.md` | KEEP | PostGIS/RLS/RBAC schema design is core platform architecture. |
| `.gemini/agents/deployment-specialist.agent` | REMOVE | LocalStack multi-cloud deployment orchestration is not part of this project stack. |
| `.gemini/agents/details-agent.md` | REMOVE | Property details workflow is a product feature, not core architecture scope. |
| `.gemini/agents/export-agent.md` | REMOVE | Share/export workflows are peripheral to core architecture/research goals. |
| `.gemini/agents/gis-architect.agent` | KEEP | Geospatial architecture specialization maps directly to system design goals. |
| `.gemini/agents/map-agent.md` | KEEP | Map infrastructure and layer architecture are core GIS capabilities. |
| `.gemini/agents/overlay-agent.md` | KEEP | Overlay/layer registry and badges are core GIS map architecture. |
| `.gemini/agents/save-agent.md` | REMOVE | Favourites/saved-search persistence is a user workflow, not core audit scope. |
| `.gemini/agents/search-agent.md` | REMOVE | Search/filter UX workflow is not part of core architecture/spatial-AI goals. |
| `.gemini/agents/spatial-agent.md` | KEEP | Spatial analysis and geographic constraints are core GIS functions. |
| `.gemini/agents/test-agent.md` | OPTIONAL | Testing is quality support (optional) rather than primary architecture scope. |
| `.github/agents/ai-agent.agent.md` | KEEP | AI reconstruction and labeling governance are core spatial AI goals. |
| `.github/agents/domains-agent.agent.md` | KEEP | Role/domain documentation aligns with documentation and research goals. |
| `.github/agents/osint-agent.agent.md` | KEEP | OSINT/spatial fusion documentation supports core research goals. |
| `.github/agents/tiles-agent.agent.md` | KEEP | Tile infrastructure documentation is core GIS architecture/system design. |
| `.github/copilot/agents/spatial-upload-agent.agent.md` | KEEP | ArcGIS/QGIS ingestion and reprojection are core GIS pipeline needs. |
| `.github/copilot/agents/vibecoding-steering-agent.agent.md` | KEEP | Governance/orchestration of agent workflows is a core Copilot objective. |

## 7) Reference / Collection Cleanup

- Updated `.claude/commands/check-remit.md` to resolve active agent definitions from canonical `.github` agent paths.
- Updated `.claude/commands/validate-spatial.md` to reference canonical `spatial-agent` path in `.github/copilot/agents`.
- Updated `.claude/commands/optimize-tiles.md` to reference canonical `map-agent` path in `.github/copilot/agents`.
- Updated `.gemini/gemini-extension.json` to remove deprecated `.gemini/agents` collection reference.
- Added root `AGENTS.md` documenting the active 10-agent canonical fleet and the one pending-confirmation hold.

## 8) Verification

- Remaining canonical agents: **10**
- `.claude/agents` remaining files: **0**
- `.gemini/agents` retained hold files: **1** (`.gemini/agents/bootstrap-agent.md`)
- Active broken references detected: **0**
- Verification status: **PASS**

## 9) Final Coverage Check

The retained fleet covers all required project domains:
- Copilot orchestration
- System architecture/documentation
- GIS map infrastructure
- Data ingestion + fallback
- Spatial analysis + CRS governance
- Database governance (PostGIS/RLS/RBAC)
- CesiumJS 3D visualization
- Spatial AI reconstruction pipelines
- Research intelligence (OpenSky)
- Optional testing/review support

## 10) Cycle 1 Governance Follow-Up (Swarm delta)

The following follow-up items are now part of the active governance cleanup backlog:

1. Enforce canonical-path policy for duplicate-role agents across `.github/agents` and `.github/copilot/agents`.
2. Add CI parity checks that fail when same-named agent definitions diverge materially across directories.
3. Close the pending `.gemini/agents/bootstrap-agent.md` hold with an explicit retain/retire decision.
4. Add append-only route-decision logging fields (requested role, selected agent, policy version, allowed tools, outcome).

*(Source: `docs/agents/swarm-agent-audit-cycle1.md`, `docs/architecture/swarm-architecture-insights-cycle1.md`)*

Pending confirmation item:
- `.gemini/agents/bootstrap-agent.md` (scope flagged unclear during classification; retained instead of deleted).
