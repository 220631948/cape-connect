# 🗺️ CapeTown GIS Hub — Research Index

> **TL;DR:** Complete index of ~52 research documents covering PostGIS, MapLibre, Martin MVT, multi-tenancy, 3D reconstruction (NeRF/3DGS/4DGS), OpenSky flight tracking, POPIA compliance, and AI-for-GIS. Each file has been audited with TL;DR summaries, `[VERIFIED]` / `[ASSUMPTION — UNVERIFIED]` markers, and roadmap milestone relevance notes.

---

## GIS Super-Stack Research (2026)

| #   | File                                                         | Key Finding                                              | Milestone |
| --- | ------------------------------------------------------------ | -------------------------------------------------------- | --------- |
| —   | [Session Summary](GIS_STACK_SESSION_SUMMARY.md)              | Shift to Cloud-Native: DuckDB, PMTiles v3, SAM-Geo       | M17+      |
| 01  | [Geo Formats](GIS_SUPERSTACK_01_GEO_FORMATS.md)              | GeoParquet + FlatGeobuf for high-performance interchange | M17       |
| 02  | [Spatial Databases](GIS_SUPERSTACK_02_SPATIAL_DATABASES.md)  | DuckDB-Spatial for analytics; PostGIS for operations     | M17       |
| 03  | [Tile Pipelines](GIS_SUPERSTACK_03_TILE_PIPELINES.md)        | PMTiles v3 for serverless/edge tile delivery             | M17       |
| 04  | [Visualization](GIS_SUPERSTACK_04_VISUALIZATION.md)          | MapLibre v5.20.1 + CesiumJS 1.115 hybrid rendering       | M17       |
| 05  | [Spatial API](GIS_SUPERSTACK_05_SPATIAL_API.md)              | OGC API - Features + PostgREST v12                       | M17       |
| 06  | [Geospatial AI](GIS_SUPERSTACK_06_GEOSPATIAL_AI.md)          | SAM-Geo for feature extraction; TorchGeo for EO ML       | M17       |
| 07  | [Satellite Imagery](GIS_SUPERSTACK_07_SATELLITE.md)          | GEE deadline (4/27/26); Sentinel Hub + STAC              | M17       |
| 08  | [Open Data](GIS_SUPERSTACK_08_OPEN_DATA.md)                  | Overture Maps + CoCT ODP Hub verified sources            | M17       |
| 09  | [Multi-Tenancy](GIS_SUPERSTACK_09_MULTITENANCY.md)           | Row-Level Security (RLS) + CRDT for collab editing       | M17       |
| 10  | [DevOps & Infra](GIS_SUPERSTACK_10_DEVOPS_INFRASTRUCTURE.md) | Terraform + S3 + PMTiles serverless architecture         | M17       |

## Core Research Series (01–11)

| #   | File                                                             | Key Finding                                                  | Milestone |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------ | --------- |
| 01  | [PostGIS Ecosystem](01_PostGIS_Core_Ecosystem.md)                | PostGIS + pgvector is the spatial/semantic standard          | M1        |
| 02  | [Routing & pgRouting](02_Routing_pgRouting.md)                   | pgRouting too heavy for MVP; use `ST_DWithin` or public APIs | M6+       |
| 03  | [Tile Servers](03_MapServer.md)                                  | Martin (Rust) is gold standard for MVT                       | M2        |
| 04  | [Web Mapping](04_Web_Mapping_OpenLayers_Leaflet.md)              | MapLibre GL JS (WebGPU renderer) is the winner               | M1        |
| 04b | [ArcGIS Integration](04b_ArcGIS_Web_Integration.md)              | ArcGIS REST JS for CoCT open data ingestion                  | M3        |
| 05  | [Python Geo Stack](05_Python_Geo_Stack.md)                       | TorchGeo/Rasterio for AI analysis; core stays in Next.js     | M10+      |
| 06  | [GeoAI & Real-Time](06_GeoAI_RealTime_Integration.md)            | MobilityDB for trajectory tracking, pgvector for RAG         | M7, M10   |
| 07  | [Multitenancy & RLS](07_Multitenancy_Access_Views_ArcGIS_Hub.md) | Shared-schema RLS with UUIDv7 tenant keys                    | M1        |
| 08  | [Executive Summary](08_Executive_Summary_Recommendations.md)     | Supabase + Martin + MapLibre = capegis stack                 | M0        |
| 09  | [Local Dev & Docker](09_Local_Dev_LocalStack_Docker.md)          | Docker Compose for PostGIS + Martin local dev                | M0        |
| 10  | [MapLibre + Next.js](10_MapLibre_NextJS_Integration.md)          | Dynamic import, ref guard, `map.remove()` cleanup            | M1        |
| 11  | [Google Maps Platform](11_Google_Maps_Platform_Overview.md)      | Street View API for property context; optional               | M5+       |

## 3D Reconstruction & Immersive

| File                                                   | Key Finding                                                                                  | Milestone |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------- | --------- |
| [3DGS + NeRF for GIS](3dgs-nerf-gis-research.md)       | 3DGS via Nerfstudio Splatfacto; COLMAP for sparse reconstruction                             | M8        |
| [3DGS + NeRF Core](3dgs-nerf-research.md)              | Gaussian splatting outperforms NeRF for real-time; CesiumJS 1.139 has KHR_gaussian_splatting | M8        |
| [ControlNet for GIS](controlnet-gis-reconstruction.md) | ControlNet for sparse-view 3D enhancement; experimental TRL 3–4                              | M8+       |
| [ControlNet Core](controlnet-research.md)              | ControlNet 1.1 + SDXL for architectural conditioning                                         | M8+       |

## Flight Tracking & OSINT

| File                                                       | Key Finding                                                               | Milestone |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- | --------- |
| [OpenSky + Cesium OSINT](opensky-cesium-osint.md)          | Combined flight tracking + OSINT pattern; commercial licensing unverified | M7        |
| [OpenSky + Cesium Integration](opensky-cesium-research.md) | OpenSky REST API, 5s polling, ADS-B protocol details                      | M7        |

## Platform & Architecture

| File                                                           | Key Finding                                                      | Milestone |
| -------------------------------------------------------------- | ---------------------------------------------------------------- | --------- |
| [GIS Platform Synthesis](gis-platform-synthesis.md)            | Comparative analysis of ESRI, QGIS, MapLibre approaches          | M0        |
| [GIS File Formats](gis-file-formats-research.md)               | GeoJSON, GeoPackage, Shapefile, PMTiles — format selection guide | M2, M3    |
| [ArcGIS/QGIS Formats](arcgis-qgis-formats-research.md)         | .shp/.gdb/.qgz upload, validation, reprojection patterns         | M3        |
| [Technical Architecture](technical_architecture_extensions.md) | Extended architecture patterns beyond core research              | M1–M5     |
| [Technical Spec Findings](technical_specification_findings.md) | Spec-level findings from research synthesis                      | M1–M5     |

## AI & Autonomous GIS

| File                                         | Key Finding                                              | Milestone |
| -------------------------------------------- | -------------------------------------------------------- | --------- |
| [Autonomous GIS](autonomous-gis-research.md) | LLM-driven spatial analysis agents; tool-calling pattern | M10+      |
| [NL → Spatial Query](nl-to-spatial-query.md) | Natural language to PostGIS SQL; multi-agent approach    | M10       |
| [LiteLLM Proxy](litellm-proxy-research.md)   | Multi-provider LLM gateway for AI features               | M10+      |

## Compliance & Security

| File                                                    | Key Finding                                                     | Milestone  |
| ------------------------------------------------------- | --------------------------------------------------------------- | ---------- |
| [POPIA Compliance Tech](popia-compliance-technology.md) | POPIA 8 conditions, spatial PII, consent management, Section 72 | M1, M4, M6 |
| [Supabase RLS Performance](supabase-rls-performance.md) | RLS overhead 5–15%, GiST interaction, silent failure modes      | M1, M3, M6 |

## Infrastructure & Tooling

| File                                                            | Key Finding                                                          | Milestone |
| --------------------------------------------------------------- | -------------------------------------------------------------------- | --------- |
| [Martin MVT Optimization](martin-mvt-optimization.md)           | PostGIS tile functions, zoom-level strategy, CDN caching             | M2, M3    |
| [Serwist PWA & Offline](serwist-pwa-offline-patterns.md)        | Service worker lifecycle, Dexie.js, PMTiles offline, background sync | M2, M4    |
| [Copilot CLI Orchestration](copilot-cli-agent-orchestration.md) | Agent fleet design for AI-assisted development                       | M0        |
| [Copilot Vibecoding](copilot-vibecoding-research.md)            | AI-assisted development workflow patterns                            | M0        |

## Spatial Intelligence Research (Multi-Agent Synthesis)

| File                                                                     | Key Finding                                                               | Milestone |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------- | --------- |
| [Master Summary](spatial-intelligence/README.md)                         | 10 cross-cutting insights, 3 red flags (CesiumJS, OpenSky, GV Roll POPIA) | M0–M15    |
| [GIS Features Catalogue](spatial-intelligence/gis-features.md)           | Spatial primitives, CRS pipeline, layer Z-order rules                     | M1–M5     |
| [WorldView Patterns](spatial-intelligence/worldview-patterns.md)         | spatialintelligence.ai WorldView reverse-engineering → capegis patterns   | M5        |
| [Spatial AI Innovations](spatial-intelligence/spatial-ai-innovations.md) | 23 AI innovations catalogued with TRL and phase assignment                | M8–M15    |
| [Domain Extensions](spatial-intelligence/domain-extensions.md)           | 12 missing data sources, 15 missing features across 11 domains            | M3–M15    |
| [Completion Log](spatial-intelligence/RESEARCH_COMPLETION_LOG.md)        | Research phase complete; 4 task scaffolds, 5 blocking unknowns            | Phase 2   |

## Deep Dives & References

| File                                                                            | Key Finding                                                                            | Milestone |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------- |
| [spatialintelligence.ai Deep Dive](spatialintelligence-deep-dive-2026-03-05.md) | Newsletter not product; WorldView OSINT, KHR_gaussian_splatting concepts               | M5, M8    |
| [spatialintelligence.ai Research](spatialintelligence-research.md)              | Initial research on spatial intelligence platform patterns                             | M5        |
| [GIS Research Swarm Synthesis](gis-research-swarm-synthesis.md)                 | Cross-validated recurring autopilot template with agent cleanup + architecture actions | M0+       |
| [Verification Report](verification_report.md)                                   | Systematic verification of claims across all research docs                             | All       |
| [Reference URL Catalog](reference_url_catalog.md)                               | Curated list of authoritative reference URLs                                           | All       |
| [GIS Research URLs](gis_research_urls.txt)                                      | Raw URL collection from research phase                                                 | —         |

## Swarm Cycle 1 Delta Outputs (2026-03-05)

| File                                                                                      | Focus                                                                           | Primary downstream impact                                     |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [swarm-python-geospatial-tooling](swarm-python-geospatial-tooling.md)                     | Python geospatial tooling applicability and implementation-gap audit            | Tech-stack and roadmap boundary checkpoints                   |
| [swarm-react-geospatial-visualization](swarm-react-geospatial-visualization.md)           | React/MapLibre/Cesium visualization pattern and drift risks                     | Runtime compatibility and verification labeling gates         |
| [swarm-frappe-spatial-integrations](swarm-frappe-spatial-integrations.md)                 | Frappe sidecar integration constraints under tenant/RLS model                   | Integration boundary and multitenant mapping requirements     |
| [swarm-cross-validation-cycle1](swarm-cross-validation-cycle1.md)                         | Cross-validation of all Cycle 1 research findings across four agent lanes       | Claim verification and confidence scoring for Cycle 1 outputs |
| [gis-research-swarm-autopilot-final-report](gis-research-swarm-autopilot-final-report.md) | Autopilot final report: agent ecosystem, architecture, Frappe, Copilot steering | Recurring runbook template for continuous swarm cycles        |
| [cycle1-research-synthesis](cycle1-research-synthesis.md)                                 | Evidence-weighted synthesis of all Cycle 1 research deltas                      | Consolidated decision input for architecture and roadmap      |

## Swarm Cycle 1 Specialist Outputs (2026-03-05)

| File                                                                                            | Focus                                                                                        | Milestone  |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------- |
| [cycle1-3dgs-runtime-compatibility-matrix](cycle1-3dgs-runtime-compatibility-matrix.md)         | CesiumJS + MapLibre 3DGS runtime compatibility: SDK versions, KHR_gaussian_splatting support | M8         |
| [cycle1-ai-pipeline-delta](cycle1-ai-pipeline-delta.md)                                         | Delta analysis: NeRF/3DGS/4DGS/ControlNet/Cesium docs against current literature             | M8+        |
| [cycle1-aoi-validation-pack](cycle1-aoi-validation-pack.md)                                     | Pre-build AOI validation pack for Cape Town bounding box and CRS rules                       | M1         |
| [cycle1-docs-only-retro](cycle1-docs-only-retro.md)                                             | Documentation-only retrospective for Cycle 1 agent run                                       | M0         |
| [cycle1-opensky-commercialization-constraints](cycle1-opensky-commercialization-constraints.md) | OpenSky Network commercialization constraints for multi-tenant SaaS use                      | M7         |
| [cycle1-policy-licensing-delta](cycle1-policy-licensing-delta.md)                               | Policy/licensing delta: Google Maps Tiles, CesiumJS, OpenSky, AI models                      | M5, M7, M8 |
| [cycle1-spatialintelligence-delta](cycle1-spatialintelligence-delta.md)                         | SpatialIntelligence.ai / WorldView delta — evidence-tagged pattern analysis                  | M5         |

---

## 🚀 MVP Recommendation

The fastest path to a world-class GIS platform:

1. **Backend:** Supabase (PostgreSQL 15 + PostGIS 3.x) with RLS tenant isolation
2. **Tile Layer:** Martin (Rust MVT) in Docker on DigitalOcean
3. **Frontend:** Next.js 15 App Router + MapLibre GL JS
4. **Data Ingestion:** ArcGIS REST JS for CoCT open data + three-tier fallback
5. **Offline:** Serwist PWA + Dexie.js + PMTiles

---

_Research index updated: 2026-03-17 · 63 files indexed · Super-Stack 2026 research integrated._
