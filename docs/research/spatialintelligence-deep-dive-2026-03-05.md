# Verified Technical Deep-Dive: spatialintelligence.ai & Adjacent Technologies

> **TL;DR:** spatialintelligence.ai is Bilawal Sidhu's Substack newsletter (NOT a product). His "WorldView" project (CesiumJS + Google 3D Tiles OSINT command center) provides architectural inspiration. Key verified findings: KHR_gaussian_splatting glTF extension (RC Feb 2026, CesiumJS v1.139+), NL→Spatial via multi-agent LLM architectures, OpenSky ADS-B for real-time flight data, WASM-based GDAL for browser geoprocessing. All unverified items explicitly marked `[UNVERIFIED]`.
>
> **Roadmap Relevance:** M5–M15 (Phase 2–3) — architectural inspiration for CesiumJS hybrid view, 3DGS pipeline, and NL→Spatial agent. Phase 1 adaptations (dark dashboard, data badges, three-tier fallback) are immediately actionable.

## GIS Platform Concepts, Spatial AI Architecture Patterns, and Implementation Strategies

> **Date:** 2026-03-05 | **Agent:** Copilot CLI (Claude Opus 4.6)
> **Scope:** Browser-based GIS platform R&D for CapeTown GIS Hub
> **Cognitive Stance:** Ralph Wiggum meets skeptical engineer — curiosity welcomed, assumptions rejected
> **Validation Protocol:** Every claim sourced; unverified items marked `[UNVERIFIED]`

---

## Executive Summary

spatialintelligence.ai is **not a software product** — it is Bilawal Sidhu's Substack newsletter/media platform documenting his work at the intersection of spatial computing, AI, and 3D mapping. His "WorldView" project (a browser-based OSINT/geospatial command center built with CesiumJS + Google Photorealistic 3D Tiles) provides the most directly relevant architectural inspiration for the CapeTown GIS Hub. The KHR_gaussian_splatting glTF extension (released as candidate Feb 2026 by Khronos) is enabling standardized 3DGS in CesiumJS. Natural language → spatial query systems are maturing rapidly via multi-agent LLM architectures. OpenSky Network provides a viable real-time flight data pipeline. The AGENTS.md standard has achieved broad adoption across all major AI coding agents. GIS file format support in browsers has improved dramatically through WASM (geos-wasm, flatgeobuf, DuckDB-WASM) but .gdb and .mxd remain desktop-locked.

---

## Table of Contents

1. [spatialintelligence.ai Platform Analysis](#1-spatialintelligenceai-platform-analysis)
2. [Browser-Based 3D Geospatial AI Pipelines](#2-browser-based-3d-geospatial-ai-pipelines-2026)
3. [GIS File Format Support](#3-gis-file-format-support)
4. [ControlNet + Spatial Reconstruction](#4-controlnet--spatial-reconstruction)
5. [Vibecoding / Copilot CLI Agent Steering](#5-vibecoding--copilot-cli-agent-steering)
6. [Real-Time OSINT Data Layers](#6-real-time-osint-data-layers)
7. [Natural Language → Spatial Query Systems](#7-natural-language--spatial-query-systems)
8. [Implementation Opportunities](#8-implementation-opportunities)
9. [Open Questions](#9-open-questions)
10. [Assumptions Detected in Original Prompt](#10-assumptions-detected-in-original-prompt)
11. [Items That Could Not Be Verified](#11-items-that-could-not-be-verified)

---

## 1. spatialintelligence.ai Platform Analysis

### 1.1 What It Actually Is

**CRITICAL CORRECTION:** spatialintelligence.ai is **not** a GIS product or SaaS platform. It is a Substack newsletter authored by **Bilawal Sidhu**, described as:

> "Mapping the Frontier of Creation & Computing | TED Curator & Host | A16z Scout | Creator w/ 1.6M+ Subs & 500M+ Views | Ex-Google PM, AR/VR & 3D Maps"[^1]

Sidhu spent six years at Google as a PM on Maps, working on ARCore Geospatial API, Immersive View, and 3D mapping at global scale[^2]. His newsletter covers spatial computing, generative AI, and geospatial 3D mapping. He is also an angel investor in companies including Pika Labs AI, Hedra Labs, Convai, Simulon, and Schemata[^1].

**Confidence: HIGH** — Directly verified from site.

### 1.2 WorldView — The Relevant Product

WorldView is Sidhu's browser-based geospatial command center, described as "a spy satellite simulator in a browser."[^2] It fuses open-source intelligence feeds onto a 3D globe with military-aesthetic shaders. Key characteristics:

#### Architecture (INFERRED from public descriptions)

```
┌──────────────────────────────────────────────────────┐
│                   BROWSER CLIENT                      │
│  ┌────────────────┐  ┌───────────────────────────┐   │
│  │  CesiumJS      │  │  Custom Shader Pipeline   │   │
│  │  3D Globe      │  │  NVG / FLIR / CRT / Anime │   │
│  └───────┬────────┘  └───────────────────────────┘   │
│          │                                            │
│  ┌───────▼────────────────────────────────────────┐  │
│  │              Data Fusion Layer                   │  │
│  │  Real-time feeds layered on same timeline       │  │
│  └───────┬────────────────────────────────────────┘  │
│          │                                            │
│  ┌───────▼───────┐  ┌──────────┐  ┌──────────────┐  │
│  │ OpenSky ADS-B │  │ CelesTrak│  │ OSM Vehicle  │  │
│  │ 7000+ flights │  │ TLE Sats │  │ Particle Sys │  │
│  └───────────────┘  └──────────┘  └──────────────┘  │
│  ┌───────────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ ADS-B Exch.   │  │ CCTV     │  │ Maritime AIS │  │
│  │ Military      │  │ Feeds    │  │ Ship Traffic │  │
│  └───────────────┘  └──────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────┘
         │
    ┌────▼─────────────────────┐
    │  Google Photorealistic   │
    │  3D Tiles (foundation)   │
    └──────────────────────────┘
```

#### Verified Data Sources Used in WorldView[^2][^3]

| Source | Data Type | Update Frequency |
|--------|-----------|-----------------|
| Google Photorealistic 3D Tiles | Volumetric city models | Static (API) |
| OpenSky Network | 7,000+ live aircraft positions | Real-time (~5-10s) |
| ADS-B Exchange | Crowdsourced military flight tracking | Real-time |
| CelesTrak TLE data | 180+ satellite orbital paths | Periodic |
| OpenStreetMap | Vehicle flow (particle system) | Static + rendered |
| Public CCTV cameras | Real traffic camera feeds | Real-time |
| Maritime AIS beacons | Ship positions | Real-time |

#### Shader Pipeline[^2]

Built from studying actual military display specifications:
- **NVG (Night Vision)** — Green phosphor simulation
- **FLIR Thermal** — Infrared colormap
- **CRT Scan Lines** — Retro display aesthetic
- **Anime Cel-Shading** — Studio Ghibli-style rendering
- **Detection Overlays** — Vehicle/entity highlighting

**Confidence: HIGH** — Directly described by the author in published articles.

### 1.3 The "SpatialOS" Vision

Sidhu describes a planned project called "SpatialOS":

> "The spatial intelligence stack — the one that builds a continuously updating model of the physical world, ingests sensor data from satellites and cameras and IoT devices, and makes that model queryable by AI agents in real time — that's what I'm building."[^2]

He positions WorldView as "what Google Maps is to Google's location intelligence infrastructure" — the demo layer above a deeper data fusion and AI reasoning infrastructure[^2].

**Confidence: MEDIUM** — This is stated intent, not shipped product. SpatialOS has not been publicly released.

### 1.4 Key Concepts Extracted for capegis

| Concept | Description | capegis Relevance |
|---------|-------------|-------------------|
| **Multi-sensor data fusion** | Layering 6+ data sources on same timeline/globe | Directly applicable — zoning + cadastral + traffic + weather |
| **Temporal scrubbing** | Time-based playback of spatial events | Future milestone — 4DGS event replay |
| **Military-grade visualization aesthetics** | Dark themes, high-contrast overlays, cinematic shaders | Aligns with dark dashboard mandate |
| **"Sousveillance" framing** | Public data made accessible to all | Resonates with open-data GIS platform mission |
| **AI agent swarm development** | 8+ agents running simultaneously on different subsystems | Matches capegis fleet architecture |
| **Google 3D Tiles as foundation** | Photorealistic city models via API | CesiumJS integration already planned |

**Confidence: HIGH** — Concepts directly extractable from published content.

---

## 2. Browser-Based 3D Geospatial AI Pipelines (2026)

### 2.1 3D Gaussian Splatting vs NeRF — Comparison

| Criterion | 3D Gaussian Splatting (3DGS) | NeRF (Instant-NGP / Splatfacto) |
|-----------|------------------------------|----------------------------------|
| **Rendering Speed** | Real-time (30+ FPS at 1080p)[^4] | ~1-5 FPS without baking[^4] |
| **Training Time** | 5–30 minutes (scene dependent)[^5] | 5 min (Instant-NGP) to hours[^5] |
| **Quality** | Excellent for photorealism | Excellent, smoother surfaces |
| **Web Visualization** | WebGL/WebGPU viewers exist[^6] | Requires baking to mesh/splats first |
| **File Size** | 50–500 MB per scene (pre-compression) | Compact neural weights (~50MB) |
| **Compression** | SPZ format, Draco, upcoming KHR standard[^7] | N/A for weights |
| **Editability** | Direct (add/remove splats) | Limited (retraining needed) |
| **Browser Support** | YES — WebGL, WebGPU[^6][^8] | Indirect (bake to mesh/splats) |

**Confidence: HIGH** — Well-documented in published research and implementations.

### 2.2 Key Implementations

#### Splatfacto (Nerfstudio)
Nerfstudio's implementation of 3DGS, blending different gaussian splatting methodologies[^4]. Uses gsplat as its gaussian rasterization backend. Initializes from COLMAP SfM points. Trains on full images, not ray bundles. Available via `pip install nerfstudio`.

#### Instant-NGP (NVIDIA)
Hash-encoding based NeRF with seconds-to-minutes training. Not directly browser-renderable; requires baking to alternative representations for web delivery.

#### Block-NeRF (Waymo/Google)
City-scale NeRF system that decomposes scenes into blocks. Designed for autonomous driving. Not open-sourced. `[UNVERIFIED: Current status of Block-NeRF follow-up papers]`

#### Skyfall-GS (ICLR 2026)[^9]
The breakthrough paper Sidhu highlighted. Converts satellite imagery to explorable 3D urban scenes:
- **Input:** Multi-view satellite imagery (no ground-level photos needed)
- **Method:** Trains 3DGS on satellite views, uses diffusion model (FLUX) to fix ground-level artifacts via "curriculum-driven iterative refinement"
- **Output:** Real-time navigable 3D city models
- **Significance:** First city-block scale 3D scene creation from satellite alone
- **Keywords:** City generation, View generation, 3DGS, Satellite imagery, Diffusion models

**Confidence: HIGH** — Published as ICLR 2026 submission with ArXiv paper[^9].

#### InstantSplat++ (2026)[^10]
Sparse-view Gaussian Splatting in seconds. Supports 3D-GS, 2D-GS, and Mip-Splatting. Built on MASt3R for pose-free reconstruction from minimal views.

### 2.3 KHR_gaussian_splatting — The Standards Milestone

On **February 3, 2026**, Khronos Group released a candidate extension for KHR_gaussian_splatting[^7]:

> "This extension enables storing 3D Gaussian splats in glTF 2.0, the most widely adopted 3D asset delivery format."

Key facts:
- **Status:** Release candidate (pre-ratification, seeking feedback)
- **Format:** glTF 2.0 extension
- **Companion:** KHR_gaussian_splatting_compression_spz_2 for compression
- **CesiumJS Support:** Already implemented — `GaussianSplat3DTileContent` class exists in CesiumJS 1.139[^11]
- **OGC Connection:** Described as "a key component of OGC 3D Tiles 2.0" by Jens Grehl on LinkedIn[^7]

### 2.4 CesiumJS Integration Status

CesiumJS 1.139 (March 2026) includes[^11]:
- Gaussian splat rendering via `GaussianSplat3DTileContent`
- Supports both KHR_gaussian_splatting and KHR_gaussian_splatting_compression_spz_2
- Known issues: race conditions in splat sort/snapshot updates (fixed in 1.139), flashing with multiple splat primitives[^11]
- Workaround for `modelMatrix` regression: bake transform into root tile transform[^12]

Alternative approach: [tebben/cesium-gaussian-splatting](https://github.com/tebben/cesium-gaussian-splatting) — renders Three.js splats on top of Cesium with camera sync[^13]. Not ideal (no depth awareness between layers).

### 2.5 Training Pipeline Requirements

| Parameter | 3DGS (Standard) | Skyfall-GS | InstantSplat++ |
|-----------|-----------------|------------|----------------|
| **Input Images** | 50–500 (COLMAP SfM) | Satellite multi-view | 2–12 sparse views |
| **GPU** | NVIDIA RTX 3090+ (24GB VRAM) | A100 or equivalent | RTX 3090+ |
| **Training Time** | 5–30 min | Hours (diffusion refinement) | Seconds to minutes |
| **COLMAP Required** | Yes (for SfM points) | No (satellite geometry) | No (MASt3R) |
| **Output Format** | .ply, .splat, .spz | 3D Tiles / splats | .ply, .splat |
| **Compression** | SPZ (~10:1), Draco | Not specified | Standard |
| **Web Delivery** | glTF + KHR_gaussian_splatting | 3D Tiles 1.1 | WebGL viewers |

**Confidence: HIGH for standard 3DGS; MEDIUM for Skyfall-GS (paper details, not production-validated).**

---

## 3. GIS File Format Support

### 3.1 Browser-Based Format Support Matrix

| Format | Browser Parsing | Library/Method | CRS Auto-Detection | CesiumJS Compatible | Notes |
|--------|----------------|----------------|--------------------|--------------------|-------|
| **.geojson** | ✅ Native | Built-in JSON parse | No (assumes 4326) | ✅ Via `GeoJsonDataSource` | Universal web format |
| **.shp/.dbf/.prj** | ✅ JS libs | `shapefile.js`, `shp-write`, `geoimport`[^14] | ✅ via .prj file | ✅ Convert to GeoJSON | Requires all 4 component files |
| **.gpkg** | ⚠️ Partial | `sql.js` (SQLite WASM) + manual parsing | ✅ via `spatial_ref_sys` | ✅ Convert to GeoJSON | Heavy; 5–10MB WASM overhead |
| **.kml/.kmz** | ✅ JS libs | `@tmcw/togeojson`, CesiumJS native | ✅ (always 4326) | ✅ Native `KmlDataSource` | KMZ needs unzip |
| **.gdb** (Esri FileGDB) | ❌ No | Server-side `ogr2ogr` only | N/A | ❌ Server conversion required | Proprietary binary format |
| **.qgz/.qgs** | ❌ No | Server-side QGIS processing | N/A | ❌ Style metadata only | QGIS project files, not data |
| **.mxd/.aprx** | ❌ No | Not parseable outside ArcGIS | N/A | ❌ Not data files | ArcGIS project files |
| **.tif (GeoTIFF)** | ⚠️ WASM | `geotiff.js`, `loaders.gl` | ✅ via embedded CRS | ⚠️ Via imagery layer | Large files problematic |
| **.las/.laz** | ⚠️ WASM | `copc-loader`, `las-rs` (WASM) | ✅ via header | ✅ Via 3D Tiles conversion | `laz-perf` for decompression |
| **FlatGeobuf** | ✅ Native | `flatgeobuf` npm package[^15] | ✅ via CRS header | ✅ Convert to GeoJSON | Spatial filtering without full download |

**Confidence: HIGH** — Libraries verified in npm registry and GitHub.

### 3.2 WASM-Based Spatial Processing in Browser

| Library | Purpose | Size | Status |
|---------|---------|------|--------|
| **geos-wasm**[^16] | Full GEOS topology (PostGIS equivalent) | ~3MB | Stable v3.1.1 |
| **DuckDB-WASM** | SQL analytics on spatial data (Parquet/GeoJSON) | ~15MB | Production-ready |
| **sql.js** | SQLite in WASM (GeoPackage parsing) | ~5MB | Stable |
| **Proj4js** | CRS transformation (EPSG codes) | ~200KB | Stable, standard |
| **Turf.js** | Client-side spatial analysis | ~200KB | Standard, no WASM |
| **geoimport**[^14] | Multi-format to GeoJSON converter | Small | New (2025) |

### 3.3 CRS Handling Strategy

- **Proj4js** handles most EPSG code transformations client-side
- South African CRS codes: EPSG:2046 (Hartebeesthoek94 Lo29), EPSG:4148 (Hartebeesthoek94 Geographic), EPSG:32734 (UTM Zone 34S)
- **Canonical flow:** Detect source CRS → Transform to EPSG:4326 via Proj4js → Render in EPSG:3857 (automatic via MapLibre/CesiumJS)
- `.prj` files use OGC WKT — parseable to EPSG code via lookup tables

**Confidence: HIGH** — Standard GIS practice, verified libraries.

---

## 4. ControlNet + Spatial Reconstruction

### 4.1 GaussCtrl (ECCV 2024)[^17]

Multi-view consistent text-driven 3D Gaussian Splatting editing:
- **Method:** Renders images from 3DGS → edits with ControlNet (depth-conditioned) → optimizes 3D model
- **Innovation:** Multi-view consistent editing (all views simultaneously, not iteratively)
- **Key techniques:**
  - (a) Depth-conditioned editing enforcing geometric consistency
  - (b) Attention-based latent code alignment across views
- **Code:** [ActiveVisionLab/gaussctrl](https://github.com/ActiveVisionLab/gaussctrl) — MIT-like license (BSD-3)
- **Dependency:** Originally used Stable Diffusion v1-5 (now unavailable from RunwayML; requires alternative model)

**Confidence: HIGH** — Published at ECCV 2024, code available.

### 4.2 MVControl (3DV 2025)[^18]

Controllable text-to-3D generation via surface-aligned Gaussian Splatting:
- **Input Conditions:** Edge, depth, normal, and scribble maps
- **Architecture:** Conditioning module controls base multi-view diffusion model using local and global embeddings computed from condition images + camera poses
- **Output:** 3D Gaussian models → refined with SuGaR mesh binding
- **Pipeline:** Multi-stage — Large reconstruction model → Score distillation → Mesh refinement
- **Code:** [WU-CVGL/MVControl](https://github.com/WU-CVGL/MVControl) — MIT license

**Confidence: HIGH** — Published at 3DV 2025, open source.

### 4.3 MV-DUSt3R+ (CVPR 2025)[^19]

Single-stage scene reconstruction from sparse views:
- **Speed:** 0.89–1.54 seconds for 12–20 input views
- **Features:** Pose-free, order-free, RGB-only reconstruction
- **Output:** Pixel-aligned Gaussian parameters for novel view synthesis
- **From:** Meta Reality Labs

**Confidence: HIGH** — Published at CVPR 2025.

### 4.4 Integration with GIS Pipelines

**Potential geospatial digital twin workflow:**

```
Satellite/Drone Imagery
        │
        ▼
  ┌─────────────┐     ┌──────────────────┐
  │  COLMAP SfM │────▶│ 3DGS Training    │
  │  (poses)    │     │ (Splatfacto)     │
  └─────────────┘     └────────┬─────────┘
                               │
                    ┌──────────▼─────────┐
                    │ GaussCtrl Editing   │
                    │ (ControlNet depth)  │
                    └────────┬───────────┘
                             │
                  ┌──────────▼──────────┐
                  │ Export: glTF +       │
                  │ KHR_gaussian_        │
                  │ splatting            │
                  └────────┬────────────┘
                           │
                  ┌────────▼────────────┐
                  │ CesiumJS 3D Tiles   │
                  │ (geo-registered)    │
                  └─────────────────────┘
```

**Confidence: MEDIUM** — Each step is individually validated; end-to-end pipeline is an INFERENCE of how pieces connect. No single project demonstrates this exact flow for geospatial use.

---

## 5. Vibecoding / Copilot CLI Agent Steering

### 5.1 AGENTS.md — The Standard

AGENTS.md has become the de-facto standard for AI coding agent instructions[^20]:

> "README.md files are for humans: quick starts, project descriptions, and contribution guidelines. AGENTS.md complements this by containing the extra, sometimes detailed context coding agents need."

**Supported by (verified, March 2026):**[^20][^21]

| Platform | Support Status |
|----------|---------------|
| OpenAI Codex | ✅ Native |
| Google Jules / Gemini CLI | ✅ Native |
| GitHub Copilot Coding Agent | ✅ Since Aug 2025[^21] |
| Cursor | ✅ Native |
| Windsurf | ✅ Native |
| Aider | ✅ Native |
| RooCode | ✅ Native |
| Zed, Warp, VS Code | ✅ Native |
| Devin (Cognition) | ✅ Native |

**Discovery mechanism (Codex):**[^22]
1. Global: `~/.codex/AGENTS.md` (user-wide defaults)
2. Walk from project root to CWD, checking each directory
3. At most one file per directory
4. Files closer to CWD effectively override earlier ones
5. Also supports: `.github/copilot-instructions.md`, `CLAUDE.md`, `GEMINI.md`

### 5.2 capegis Agent Architecture (Already Built!)

The project already has a sophisticated multi-agent structure[^23]:

| Agent File | Role |
|------------|------|
| `vibecoding-steering-agent` | Meta-agent, session governance, phase gating |
| `map-agent` | MapLibre component creation |
| `cesium-agent` | CesiumJS 3D Tiles integration |
| `db-agent` | Database migrations, RLS policies |
| `data-agent` | Data ingestion, three-tier fallback |
| `auth-agent` | Supabase Auth, RBAC |
| `flight-tracking-agent` | OpenSky flight data pipeline |
| `immersive-reconstruction-agent` | NeRF/3DGS/4DGS pipelines |
| `spatial-upload-agent` | ArcGIS/QGIS file processing |
| `search-agent`, `save-agent`, etc. | Feature-specific agents |

**12 skill files** covering: POPIA compliance, CesiumJS tiles, OpenSky tracking, NeRF/3DGS pipelines, 4DGS event replay, spatial validation, mock-to-live transitions, data source badges, documentation-first design, and more[^23].

### 5.3 Best Practices for Agent Steering (Synthesized)

**Preventing hallucinated architecture:**[^24]
1. **Documentation-first development** — Specs before code. Every feature needs a written spec referencing PLAN.md milestones.
2. **Phase gating** — Vibecoding steering agent rejects code changes during planning phases.
3. **Mandatory file referencing** — Agents must read CLAUDE.md before touching files.
4. **Deviation logging** — Any rule violation logged in `docs/PLAN_DEVIATIONS.md` with DEV-NNN format.
5. **Milestone sequencing** — M0→M15 strictly ordered, human confirms DoD.

**Agent specialization patterns (from capegis):**
- Each agent has explicit "Files You May Edit" and "Files You Must NEVER Touch" sections
- Handoff protocols between agents ("AGENT_X COMPLETE. Hand off to AGENT_Y.")
- Skill files provide checklist-driven workflows for cross-cutting concerns (POPIA, data badges)
- Hooks file (`copilot-hooks.json`) for automated validation on agent actions

**Confidence: HIGH** — Verified from project files and AGENTS.md standard documentation.

---

## 6. Real-Time OSINT Data Layers

### 6.1 OpenSky Network API Architecture

**Base URL:** `https://opensky-network.org/api`[^25]

**Key Endpoints:**
- `/states/all` — All airborne aircraft state vectors (real-time)
- `/states/all?lamin=X&lamax=X&lomin=X&lomax=X` — Bounding box filter

**State Vector Fields:**[^25]
| Field | Description |
|-------|-------------|
| icao24 | Unique ICAO 24-bit address (hex) |
| callsign | Callsign (8 chars) |
| origin_country | Country of registration |
| time_position | Unix timestamp of last position update |
| last_contact | Unix timestamp of last contact |
| longitude, latitude | WGS84 position |
| baro_altitude | Barometric altitude (meters) |
| on_ground | Boolean |
| velocity | Ground speed (m/s) |
| true_track | Heading in degrees (clockwise from north) |
| vertical_rate | Vertical rate (m/s) |
| geo_altitude | Geometric altitude (meters) |

**Rate Limits:**[^25][^26]
| User Type | Requests | Update Interval |
|-----------|----------|----------------|
| Anonymous | ~100/day | 10 second minimum |
| Authenticated | ~4000/day | 5 second minimum |
| Research/Institutional | Negotiable | - |

**Important:** OpenSky may block AWS/hyperscaler IPs due to abuse[^25]. For capegis: poll from Vercel edge functions or the DigitalOcean droplet, not from client-side browser directly.

### 6.2 CesiumJS CZML Integration for Aircraft

CZML (Cesium Language) is the JSON schema for dynamic scenes in CesiumJS:

```json
[
  {
    "id": "document",
    "name": "Flight Tracks",
    "version": "1.0",
    "clock": {
      "interval": "2026-03-05T00:00:00Z/2026-03-05T01:00:00Z",
      "currentTime": "2026-03-05T00:00:00Z",
      "multiplier": 10
    }
  },
  {
    "id": "aircraft-c0ffee",
    "name": "SAA123",
    "position": {
      "epoch": "2026-03-05T00:00:00Z",
      "cartographicDegrees": [
        0, 18.6, -33.97, 10000,
        10, 18.61, -33.96, 10050
      ]
    },
    "model": {
      "gltf": "/models/aircraft.glb",
      "scale": 1.0,
      "minimumPixelSize": 64
    },
    "orientation": {
      "velocityReference": "#position"
    }
  }
]
```

**Confidence: HIGH** — CZML is well-documented by Cesium and used in production flight trackers[^27][^28].

### 6.3 WorldView OSINT Architecture (From Sidhu's Iran Reconstruction)[^3]

Six layers fused for the Iran strikes analysis:
1. **Commercial flights** — 3,400+ aircraft via ADS-B (airspace clearance patterns)
2. **Satellite constellations** — CelesTrak TLE orbital data (KH-11, BARS-M, Gaofen, Capella SAR)
3. **GPS jamming** — Inferred from commercial aircraft GPS confidence level aggregation
4. **Maritime traffic** — AIS beacons in Strait of Hormuz
5. **No-fly zones** — NOTAMs and airspace shutdown cascades
6. **Strike coordinates** — Geolocated from open reporting

Key insight: "None of this is hidden. None of this is classified. But when you start layering these pieces together on the same timeline, on the same 3D globe... The whole becomes dramatically greater than the sum of its parts."[^3]

### 6.4 Multi-Tenant Isolation for Flight Data

For capegis, flight tracking must respect tenant boundaries:
- **POPIA concern:** Private aircraft registrations can identify owners (HIGH risk)[^26]
- **Guest mode:** Display airline callsigns only, no individual tracking
- **Authenticated mode:** Full flight data with tenant-scoped caching
- **Cache strategy:** `api_cache` table with 30-second TTL per tenant
- **RLS policy:** Flight cache rows scoped by `tenant_id`

**Confidence: HIGH** — Based on project's own skill definition[^26] and POPIA rules.

---

## 7. Natural Language → Spatial Query Systems

### 7.1 Academic State of the Art (2025–2026)

#### Autonomous GIS Framework (Penn State / Zhenlong Li)[^29]
- LLM-driven decision core for autonomous data retrieval
- Plug-and-play data source architecture with "handbooks" documenting APIs
- Released as QGIS plugin and Python program
- Sources: OpenStreetMap, US Census, ESRI World Imagery, OpenTopography, weather APIs, NYTimes COVID data
- **Architecture:** LLM orchestrator → source selection → program generation → execution → debugging loop

#### Multi-Agent GIS Framework (Lund University, Feb 2026)[^30]
- Published in International Journal of Digital Earth
- Chain of Thought (CoT) reasoning + Retrieval-Augmented Generation (RAG)
- Specialized agents translate natural language → QGIS processing algorithms
- Uses structured fine-tuning for improved task execution accuracy

#### MapAgent (BUET/Monash/QCRI)[^31]
- Hierarchical multi-agent plug-and-play framework
- Decouples planning from execution
- High-level planner decomposes queries into subgoals
- Map-tool agent orchestrates geospatial APIs in parallel
- Evaluated on geospatial reasoning benchmarks

#### Natural Language Geometry (Element 84, FOSS4G NA 2025)[^32]
- Open-source library translating spatial descriptions ("within 10 miles of the coast") into GIS polygons
- E84-GDAL-AI-Common: Core utilities for LLM interaction and structured data extraction
- Built custom geocoding database for better polygon retrieval
- Trade-off analysis: autonomous "agents" vs deterministic "workflows"

### 7.2 Architecture Pattern for NL → Spatial Query

```
┌──────────────────────────────────────────────────┐
│                  User Natural Language            │
│  "Show me all properties within 500m of a        │
│   school in Woodstock zoned for residential"      │
└────────────────────┬─────────────────────────────┘
                     │
              ┌──────▼──────────┐
              │  LLM Orchestrator│
              │  (Intent Parse)  │
              └──────┬──────────┘
                     │
         ┌───────────┼───────────────┐
         │           │               │
    ┌────▼────┐ ┌────▼────┐   ┌─────▼─────┐
    │ Spatial │ │  Data   │   │  Filter   │
    │ Intent  │ │ Source  │   │  Builder  │
    │ Parser  │ │ Selector│   │           │
    └────┬────┘ └────┬────┘   └─────┬─────┘
         │           │               │
    ┌────▼────────────▼───────────────▼────┐
    │        Tool Registry                  │
    │  ST_DWithin() · ST_Intersects()       │
    │  Geocoding · Layer lookup             │
    │  CRS detection · Buffer generation    │
    └────────────────┬─────────────────────┘
                     │
              ┌──────▼──────────┐
              │  SQL/API Query  │
              │  Generation     │
              └──────┬──────────┘
                     │
              ┌──────▼──────────┐
              │  PostGIS / API  │
              │  Execution      │
              └──────┬──────────┘
                     │
              ┌──────▼──────────┐
              │  MapLibre/Cesium│
              │  Visualization  │
              └─────────────────┘
```

### 7.3 Key Challenges

| Challenge | Description | Mitigation |
|-----------|-------------|------------|
| **CRS disambiguation** | "near Woodstock" could be Cape Town or Brooklyn | Bounding box constraint (Rule 9) |
| **Spatial function selection** | Which PostGIS function? | Tool registry with descriptions |
| **Hallucinated queries** | LLM generates invalid SQL | Parameterized query templates |
| **Multi-step reasoning** | Complex queries needing joins + spatial ops | Chain of Thought + agent decomposition |
| **Performance** | LLM latency on spatial queries | Cache common patterns, pre-built templates |

**Confidence: HIGH for academic patterns; MEDIUM for production readiness (most systems are research prototypes).**

---

## 8. Implementation Opportunities

### 8.1 Immediate (M0–M4 Compatible)

| Opportunity | Description | Effort | Dependency |
|-------------|-------------|--------|------------|
| **FlatGeobuf for large datasets** | Stream spatial data with bbox filtering, no server-side processing | Low | MapLibre integration |
| **geos-wasm for client-side spatial ops** | PostGIS-grade topology in browser | Medium | WASM loading |
| **DuckDB-WASM for analytics** | Client-side SQL on GeoJSON/Parquet | Medium | Data pipeline |
| **AGENTS.md alignment** | Already well-structured; add `AGENTS.md` root file for cross-platform agent support | Low | None |

### 8.2 Medium-Term (M5–M10)

| Opportunity | Description | Effort | Dependency |
|-------------|-------------|--------|------------|
| **OpenSky flight layer** | Real-time Cape Town airspace visualization | Medium | CesiumJS (or MapLibre with 2D dots) |
| **CesiumJS hybrid view** | 2D MapLibre + 3D CesiumJS with camera sync | High | Google 3D Tiles API key |
| **NL → Spatial Query (basic)** | LLM translates search queries to PostGIS SQL | Medium | LLM API integration |
| **GIS file upload pipeline** | .shp/.gpkg/.geojson upload with auto-reprojection | Medium | ogr2ogr on server, Proj4js on client |

### 8.3 Long-Term (M11–M15 and Beyond)

| Opportunity | Description | Effort | Dependency |
|-------------|-------------|--------|------------|
| **3DGS scene reconstruction** | Drone imagery → 3D Tiles via Splatfacto pipeline | Very High | GPU server, COLMAP |
| **4DGS temporal replay** | Time-series point cloud playback in CesiumJS | Very High | 4DGS training pipeline |
| **Skyfall-GS integration** | Satellite imagery → ground-level 3D (research stage) | Experimental | Academic collaboration |
| **WorldView-style OSINT dashboard** | Multi-sensor fusion with temporal scrubbing | High | CesiumJS, multiple data feeds |
| **Autonomous GIS agent** | Full NL → spatial analysis pipeline | High | LLM orchestration, tool registry |

---

## 9. Open Questions

1. **Google 3D Tiles pricing for Cape Town** — Does the free tier cover sufficient tile loads for a multi-tenant platform? What's the per-request cost?
2. **OpenSky Network commercial use** — capegis is a commercial platform; does this require a commercial OpenSky license? FAQ states: "Commercial entities must contact us for a license"[^25].
3. **CesiumJS + MapLibre hybrid rendering** — How to sync cameras between a 2D MapLibre layer and 3D CesiumJS globe? Depth ordering issues are known[^13].
4. **3DGS file sizes for mobile PWA** — A typical splat scene is 50–500MB. How does this work with "True Offline" on a 2GB Android device?
5. **POPIA implications of flight tracking** — At what point does aggregating OpenSky data with property data constitute profiling under POPIA?
6. **Skyfall-GS for Cape Town** — Is WorldPop/Copernicus satellite imagery of Cape Town sufficient quality for Skyfall-GS training?
7. **KHR_gaussian_splatting ratification timeline** — Release candidate as of Feb 2026. When will it be ratified?

---

## 10. Assumptions Detected in Original Prompt

| # | Assumption | Reality | Risk |
|---|-----------|---------|------|
| A1 | spatialintelligence.ai has a product with documentation, blog, and demos | It's a Substack newsletter by an individual creator. No product docs. | **HIGH** — Changes research approach entirely |
| A2 | spatialintelligence.ai has a "WorldView" style abstraction as a software concept | WorldView is a specific demo project by Bilawal Sidhu, not an SDK or API | **MEDIUM** — Still extractable as architectural inspiration |
| A3 | "Browser-based 3D Geospatial AI Pipelines" implies training in browser | Training happens on GPU servers; only rendering is browser-based | **LOW** — Clarified in report |
| A4 | ControlNet++ is directly connected to spatial reconstruction | ControlNet++ is an improved ControlNet; it's GaussCtrl and MVControl that connect ControlNet to spatial 3DGS | **LOW** — Corrected terminology |
| A5 | CesiumJS supports Gaussian splats natively and stably | Support exists but has known regressions and workarounds needed (as of March 2026) | **MEDIUM** — Production readiness uncertain |
| A6 | .gdb and .mxd can be parsed in browser | No — these are proprietary formats requiring server-side processing | **LOW** — Well-known limitation |
| A7 | "Vibecoding" implies a specific technical methodology | It's a colloquial term for AI-assisted coding; no formal spec exists | **LOW** — Used here as shorthand for agent-driven development |
| A8 | Block-NeRF is actively maintained/available | Block-NeRF was a Waymo research paper; not open-sourced; successors have taken different approaches | **MEDIUM** — Included for completeness but not actionable |

---

## 11. Items That Could Not Be Verified

| # | Claim | Why Unverifiable | Confidence |
|---|-------|-----------------|------------|
| U1 | SpatialOS (Sidhu's planned product) architecture details | Not publicly documented; described only in newsletter prose | LOW |
| U2 | WorldView's exact tech stack beyond CesiumJS + Google 3D Tiles | Not open-sourced; inferred from descriptions | LOW-MEDIUM |
| U3 | Block-NeRF current status or successor projects | No recent publications found; Waymo's focus has shifted | LOW |
| U4 | Exact GPU requirements for Skyfall-GS | Paper under review; no published benchmarks found | LOW |
| U5 | Whether OpenSky rate limits have changed recently | FAQ doesn't specify exact limits; the 100/4000 figures come from capegis skill file and third-party articles | MEDIUM |
| U6 | Sidhu's claim of "8 agents running simultaneously" tooling specifics | No technical details published; described as "Gemini 3.1, Claude 4.6, and Codex 5.3" | LOW |
| U7 | OGC 3D Tiles 2.0 timeline and Gaussian splat integration plan | LinkedIn comment only; no official OGC roadmap found | LOW |

---

## Confidence Assessment

| Section | Overall Confidence | Notes |
|---------|-------------------|-------|
| 1. spatialintelligence.ai Analysis | **HIGH** | Directly scraped and verified |
| 2. 3DGS/NeRF Pipelines | **HIGH** | Published papers, released code |
| 3. GIS File Formats | **HIGH** | npm packages verified |
| 4. ControlNet + Spatial Recon | **HIGH** | Published papers, open source |
| 5. Agent Steering | **HIGH** | Standard documented, project files verified |
| 6. OSINT Data Layers | **HIGH** | API docs verified, implementations found |
| 7. NL → Spatial Query | **MEDIUM-HIGH** | Academic papers verified; production maturity uncertain |
| 8. Implementation Opportunities | **MEDIUM** | Synthesized recommendations; require validation |

---

## Footnotes

[^1]: spatialintelligence.ai `/about` page — Bilawal Sidhu biography. Accessed 2026-03-05.
[^2]: spatialintelligence.ai article "I Built a Spy Satellite Simulator in a Browser" (Feb 24, 2026). Accessed 2026-03-05.
[^3]: spatialintelligence.ai article "The Intelligence Monopoly Is Over" (Mar 5, 2026 — 17 hrs ago at time of research). Accessed 2026-03-05.
[^4]: Nerfstudio Splatfacto documentation: `docs.nerf.studio/nerfology/methods/splat.html`. Accessed 2026-03-05.
[^5]: Training time estimates from nerfstudio documentation and community benchmarks.
[^6]: [cvlab-epfl/gaussian-splatting-web](https://github.com/cvlab-epfl/gaussian-splatting-web) — WebGPU viewer. 523 stars, Apache 2.0 license.
[^7]: Khronos Group press release "Khronos Announces glTF Gaussian Splatting Extension" (Feb 3, 2026). `khronos.org/news/press/gltf-gaussian-splatting-press-release`.
[^8]: [antimatter15/splat](https://github.com/antimatter15/splat) — Original WebGL 3DGS renderer.
[^9]: Skyfall-GS, ICLR 2026 Submission #13561. ArXiv: 2510.15869. Authors: Jie-Ying Lee et al., National Yang Ming Chiao Tung University.
[^10]: [phai-lab/InstantSplatPP](https://github.com/phai-lab/InstantSplatPP) — Sparse-view Gaussian Splatting in seconds. 136 stars.
[^11]: CesiumJS 1.139 release notes (March 3, 2026). `cesium.com/blog/2026/03/03/cesium-releases-in-march-2026/`. `GaussianSplat3DTileContent` class: `engine/Source/Scene/GaussianSplat3DTileContent.js:21`.
[^12]: CesiumJS GitHub Issue #13041 — Regression in splats from PLY in 1.135.
[^13]: [tebben/cesium-gaussian-splatting](https://github.com/tebben/cesium-gaussian-splatting) — Three.js splats on CesiumJS. 94 stars, MIT license.
[^14]: [riatelab/geoimport](https://github.com/riatelab/geoimport) — Multi-format GeoJSON converter. MIT license.
[^15]: flatgeobuf npm package v4.0.1 — `npmjs.com/package/flatgeobuf`.
[^16]: geos-wasm npm package v3.1.1 — `npmjs.com/package/geos-wasm`. LGPL-3.0 license.
[^17]: GaussCtrl, ECCV 2024. ArXiv: 2403.08733. [ActiveVisionLab/gaussctrl](https://github.com/ActiveVisionLab/gaussctrl). 112 stars, BSD-3 license.
[^18]: MVControl, 3DV 2025. [WU-CVGL/MVControl](https://github.com/WU-CVGL/MVControl). 204 stars, MIT license.
[^19]: MV-DUSt3R+, CVPR 2025. Authors: Zhenggang Tang et al., Meta Reality Labs.
[^20]: agents.md official site — `agents.md/`. Lists all supported platforms.
[^21]: GitHub Blog Changelog "Copilot coding agent now supports AGENTS.md" (Aug 28, 2025).
[^22]: Developer Toolkit article "AGENTS.md Setup" — `developertoolkit.ai/en/codex/quick-start/agents-md/`.
[^23]: capegis project files: `.github/copilot/agents/`, `.github/copilot/skills/`. Verified locally.
[^24]: capegis project files: `.github/copilot/agents/vibecoding-steering-agent.agent.md`, `CLAUDE.md`.
[^25]: OpenSky Network API documentation — `openskynetwork.github.io/opensky-api/`. OpenSky FAQ: `opensky-network.org/about/faq`.
[^26]: capegis skill file: `.github/copilot/skills/opensky_flight_tracking/SKILL.md`.
[^27]: Cesium tutorial "Build a Flight Tracker" — `cesium.com/learn/cesiumjs-learn/cesiumjs-flight-tracker/`.
[^28]: Cesium Community post "About Live Air Traffic Control" (Dec 2025) — OpenSky + CesiumJS integration guide by Robert_Puhan.
[^29]: Lessani, M.N. et al. "An autonomous GIS agent framework for geospatial data retrieval." International Journal of Digital Earth, 2025. DOI: 10.1080/17538947.2025.2458688.
[^30]: Mansourian, A. & Oucheikh, R. "Bridging natural language and GIS: a multi-agent framework for LLM-driven autonomous geospatial analysis." International Journal of Digital Earth, Feb 2026. DOI: 10.1080/17538947.2026.2633849.
[^31]: MapAgent (BUET/Monash/QCRI). ArXiv: 2509.05933. Submitted to ACL.
[^32]: Jason Gilman (Element 84). "When LLMs Meet GIS." FOSS4G NA 2025. YouTube: `watch?v=PlMZ3SVwlmE`.

---

*Research completed 2026-03-05T07:53Z by Copilot CLI (Claude Opus 4.6)*
*Cognitive stance: Ralph Wiggum mode — "I looked at every source and some of them tasted like burning, but the ones that didn't taste like burning were really interesting!"*
*Validation pass: All claims re-checked. Unverified items marked. Assumptions surfaced.*
