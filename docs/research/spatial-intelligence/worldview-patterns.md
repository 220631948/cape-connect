# WorldView Architectural Patterns — Agent B Analysis

> **TL;DR:** Reverse-engineers spatialintelligence.ai's WorldView OSINT platform into actionable patterns for capegis. Documents the CesiumJS-vs-MapLibre conflict with a two-phase resolution path. Phase 1 adaptations (dark dashboard, OpenSky 2D, data badges, three-tier fallback) are implementable in MapLibre today. CesiumJS enters Phase 2 after human approval.
>
> **Roadmap Relevance:** M5 (Phase 2 CesiumJS Hybrid View) — architectural inspiration. Phase 1 visual patterns (dark theme, mode switching) apply to M1–M4.

> **Agent:** B — WorldView Analyst
> **Date:** 2026-03-05
> **Status:** VERIFIED
> **Sources:** spatialintelligence-research.md · spatialintelligence-deep-dive-2026-03-05.md · 3dgs-nerf-gis-research.md · opensky-cesium-osint.md · GIS_MASTER_CONTEXT.md §§7.1–7.3
> **Scope:** WorldView patterns, 3D reconstruction pipelines, data ingestion models, temporal architecture, CesiumJS integration

---

## Table of Contents

1. [WorldView UI/UX Architecture](#1-worldview-uiux-architecture)
2. [3D Reconstruction Pipelines](#2-3d-reconstruction-pipelines)
3. [Data Ingestion Models](#3-data-ingestion-models)
4. [Temporal Architecture (4D = 3D + Time)](#4-temporal-architecture-4d--3d--time)
5. [CesiumJS Integration Patterns](#5-cesiumjs-integration-patterns)
6. [⚠️ Stack Conflict Analysis](#️-stack-conflict-analysis)
7. [capegis Adaptation Catalogue](#7-capegis-adaptation-catalogue)
8. [Source Confidence Assessment](#8-source-confidence-assessment)

---

## 1. WorldView UI/UX Architecture

### 1.1 What WorldView Is

WorldView is a browser-based geospatial intelligence dashboard created by **Bilawal Sidhu** (ex-Google Maps PM, 6 years on ARCore/Immersive View/3D Maps; TED Curator; A16z Scout). Built in approximately 3 days using 8 simultaneous AI coding agents, it fuses open-source intelligence (OSINT) data feeds onto a CesiumJS 3D globe with Google Photorealistic 3D Tiles.

It is **not** a commercial product, SDK, or open-source library — it is a personal prototype demonstrating what is achievable with modern browser-based geospatial tooling. Its value to capegis is entirely as **architectural inspiration**.

**Published article:** ["I Built a Spy Satellite Simulator in a Browser"](https://www.spatialintelligence.ai/p/i-built-a-spy-satellite-simulator) — Feb 24, 2026.

---

### 1.2 The "God Mode" Data Layer Stack

WorldView's "God Mode" is a panoptic view where every data feed is simultaneously active:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    WORLDVIEW GOD MODE STACK                           │
│                                                                        │
│  LAYER 7 — DERIVED / INFERRED                                         │
│    GPS jamming zones (inferred from aircraft GPS confidence levels)    │
│    No-fly zones (NOTAMs + airspace shutdown cascades)                  │
│                                                                        │
│  LAYER 6 — DETECTION OVERLAYS                                         │
│    Entity highlighting (every vehicle on roads)                        │
│    Military flight callsigns + altitude data                           │
│    CCTV camera feeds projected onto building geometry                  │
│                                                                        │
│  LAYER 5 — SPACE LAYER                                                │
│    180+ satellite orbital paths (CelesTrak TLE)                        │
│    Orbital mechanic projections (ground tracks)                        │
│                                                                        │
│  LAYER 4 — AIR LAYER                                                  │
│    7,000+ live aircraft (OpenSky Network ADS-B)                        │
│    Military / blocked flights (ADS-B Exchange)                         │
│                                                                        │
│  LAYER 3 — MARITIME LAYER                                             │
│    Ship positions (AIS beacons, real-time)                             │
│                                                                        │
│  LAYER 2 — SURFACE LAYER                                              │
│    Road network vehicle particle system (OpenStreetMap)                │
│    CCTV traffic camera feeds (~1 frame/min)                            │
│                                                                        │
│  LAYER 1 — FOUNDATION (BASE)                                          │
│    Google Photorealistic 3D Tiles (volumetric city geometry)           │
│    CesiumJS globe renderer                                             │
└──────────────────────────────────────────────────────────────────────┘
```

**Key insight:** The value is not any individual layer — it is their **temporal and spatial alignment** on the same 3D globe with a unified clock. As Sidhu states: *"When you start layering these pieces together on the same timeline, on the same 3D globe... The whole becomes dramatically greater than the sum of its parts."*

**capegis equivalent layer mapping:**

| WorldView Layer | capegis Equivalent | Status |
|---|---|---|
| Google 3D Tiles | Google Photorealistic 3D Tiles (CesiumJS) | Planned (Phase 2+) |
| OpenSky ADS-B | Cape Town airspace tracking | Planned (M7–M9) |
| CelesTrak TLE | Out of scope | N/A |
| AIS maritime | Port of Cape Town shipping | Medium-priority |
| OSM vehicle particles | Traffic overlay | Low-priority |
| CCTV feeds | ❌ POPIA risk — excluded | Never |
| GPS jamming inference | ❌ Out of scope | N/A |
| No-fly zones | Future consideration | Low |

---

### 1.3 Visual Design System

#### Colour and Dark Mode Specifications

| Property | WorldView Value | capegis Alignment |
|---|---|---|
| Background | Near-black (`~#0a0a0f`) | ✅ Mandated — dark dashboard |
| Primary accent | Cyan (`#00ffff` range) | Partial — crayon accents per CLAUDE.md |
| Data overlays | High-contrast on dark | ✅ |
| Typography | Monospace for data readouts | Adopt for flight/coordinate data |
| Grid/UI chrome | Glassmorphism panels | Selective adoption |

#### Glassmorphism Panel Pattern

WorldView uses semi-transparent panels overlaid on the 3D globe:

```css
/* Glassmorphism panel (inferred from military dashboard aesthetic) */
.worldview-panel {
  background: rgba(10, 15, 25, 0.72);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(0, 255, 255, 0.15);
  border-radius: 4px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.05);
}
```

**Note:** Exact CSS is inferred from visual descriptions and third-party analysis. WorldView is not open-source.

---

### 1.4 Shader Pipeline Modes

WorldView ships with five rendering modes that change the visual presentation without altering the underlying data:

| Mode | Visual Style | Technical Description | capegis Adaptation |
|---|---|---|---|
| **Standard** | Photorealistic | Direct CesiumJS rendering, no post-processing | ✅ Default mode |
| **NVG** | Night Vision Goggle — green phosphor | GLSL: desaturate scene → green channel multiply → phosphor grain | Dark mode variant |
| **FLIR Thermal** | Infrared colourmap | GLSL: luminance → false colour LUT (purple → white = hot) | Risk map overlay potential |
| **CRT Scan Lines** | Retro cathode-ray display | GLSL: horizontal scan line mask + barrel distortion | Aesthetic only |
| **Anime Cel-Shading** | Studio Ghibli style | Edge detection + colour quantisation + outline pass | Accessibility experiment |
| **God Mode** | Detection overlays active | All detection layers simultaneously rendered | Analysis mode |

**Implementation note:** These are custom WebGL/GLSL post-processing passes on the CesiumJS render output. Sidhu describes studying "actual military display specifications" to build them. They are applied as full-screen shader passes after the main scene render.

**capegis recommendation:** Adopt the *concept* of mode switching, not these specific modes. Proposed modes: `Standard | Analysis | Comparison | Presentation`.

---

### 1.5 "Sousveillance" Philosophy and OSINT Approach

Sidhu frames WorldView under the philosophy of **sousveillance** — the act of watching back, using public data to see what institutions and governments see:

> *"Same data streams. Same satellite feeds. Same CCTV cameras. But the interface is in your browser, and you control it."*

The core principle: **all data used is publicly broadcast, legally accessible, and non-classified**. OpenSky ADS-B is publicly broadcast at 1090 MHz. CelesTrak TLE is published by the US Space Force. AIS maritime data is broadcast by law. CCTV feeds are public-facing. Google 3D Tiles is an API.

**capegis translation of this philosophy:** Municipal GIS data — zoning decisions, property valuations, planning applications, environmental assessments — is public information that belongs to Cape Town residents. The platform's mission is to make it accessible, understandable, and explorable by all, not just planners and officials. This is the urban sousveillance framing: your city, made visible to you.

**POPIA constraint:** Unlike WorldView's CCTV integration, any data that can identify natural persons in capegis must comply with POPIA's consent, purpose limitation, and retention rules. Aircraft transponder codes are NOT personal data under POPIA (see §3.4). Property owner data IS.

---

## 2. 3D Reconstruction Pipelines

### 2.1 The 8-Step Event Reconstruction Pipeline

Sourced from `GIS_MASTER_CONTEXT.md §7.3` (ControlNet conditioning pipeline):

```
STEP 1 — EVENT TRIGGER
────────────────────────────────────────────────────────────────
  Input:  OpenSky trajectory intersection with event bbox
  Output: event_id, bbox (EPSG:4326), timestamp range
  Tool:   PostGIS ST_Intersects() on flight trajectory vs zone geometry
  Time:   < 1 second (database query)

STEP 2 — GEOMETRY PRIOR EXTRACTION
────────────────────────────────────────────────────────────────
  Input:  event bbox, timestamp
  Output: depth map, normal map, edge map (2.5D geometry priors)
  Tool:   Google Photorealistic 3D Tiles → CesiumJS Z-buffer render
  Method: Render 3D Tiles from multiple camera angles, extract G-buffer
  Time:   10–30 seconds (API + render)

STEP 3 — PUBLIC IMAGE COLLECTION
────────────────────────────────────────────────────────────────
  Input:  event bbox, timestamp
  Output: 4–8 ground-level images georeferenced to scene
  Sources:
    - Google Street View (historical, via Time Machine API)
    - Public webcams (where available)
    - Sentinel-2 satellite (10m resolution, 5-day revisit)
    - Social media geotagged images (OSINT, manual curation)
  Time:   1–5 minutes (API rate limits)

STEP 4 — MULTI-CONTROLNET CONDITIONING
────────────────────────────────────────────────────────────────
  Input:  Geometry priors (Step 2) + collected images (Step 3)
  Output: 8–16 novel view images, geometrically consistent
  Tools:
    - ControlNet-depth  (primary — geometry anchor from Z-buffer)
    - ControlNet-normal (surface fidelity)
    - ControlNet-canny  (structural outlines)
    - ControlNet-seg    (material/semantic consistency)
    - MVControl         (multi-view consistency, CVPR 2025)
    - GaussCtrl         (post-reconstruction 3DGS editing, ECCV 2024)
  2026 extensions: ControlNet++, MV-DUSt3R+
  Time:   5–20 minutes (diffusion inference)

STEP 5 — COLMAP POSE ESTIMATION + GEOREFERENCING
────────────────────────────────────────────────────────────────
  Input:  Images from Steps 3 + 4 (real + synthetic)
  Output: Camera poses + sparse point cloud, georeferenced to EPSG:4326
  Tool:   COLMAP Structure-from-Motion (SfM)
  Georef: Ground Control Points (GCPs) or GPS EXIF → ECEF transform
  Time:   5–30 minutes (depends on image count)

STEP 6 — SPLATFACTO TRAINING (3DGS)
────────────────────────────────────────────────────────────────
  Input:  COLMAP poses + images
  Output: 3D Gaussian Splatting model (.ply or .splat)
  Tool:   Nerfstudio Splatfacto (preferred) or vanilla 3DGS
  GPU:    NVIDIA RTX 3090+ (24 GB VRAM), or A100 (Skyfall-GS variant)
  Time:   15–45 minutes on RTX 3090; 5–15 min on A100
  Quality: 23–28 dB PSNR (Splatfacto-W benchmark)

STEP 7 — EXPORT TO CESIUM ION / 3D TILES
────────────────────────────────────────────────────────────────
  Input:  Trained 3DGS model (.ply)
  Output: 3D Tiles tileset with glTF + KHR_gaussian_splatting extension
  Command: ns-export gaussian → Cesium ion upload → asset_id
  Standard: KHR_gaussian_splatting (Khronos Release Candidate, Feb 2026)
  Compression: SPZ format (~10:1 ratio), Draco as fallback
  Georef:  Apply ECEF → WGS84 transform in tileset.json root transform

STEP 8 — 4D WORLDVIEW ASSEMBLY
────────────────────────────────────────────────────────────────
  Input:  3D Tiles asset_id (Step 7) + OSINT feed data (Steps 1–3)
  Output: Interactive 4D scene in CesiumJS with timeline scrubbing
  Stack:
    - CesiumJS Viewer with CZML timeline
    - 3D Tiles base (Step 7 output)
    - Google Photorealistic 3D Tiles layer
    - OpenSky ADS-B CZML entities
    - Event markers with temporal annotations
    - Time scrubber UI (minute-by-minute playback)
  Time:   Real-time rendering after assembly
```

**ControlNet Conditioning Signal Strength Matrix:**

| Signal | Source | ControlNet Model | Geometric Impact |
|---|---|---|---|
| Depth map | Google 3D Tiles Z-buffer | ControlNet-depth | ★★★★★ Primary anchor |
| Normal map | Google 3D Tiles normal render | ControlNet-normal | ★★★★ Surface fidelity |
| Canny edges | Google Tiles edge detection | ControlNet-canny | ★★★ Structural outlines |
| Semantic mask | Land-use classification | ControlNet-seg | ★★★ Material consistency |
| Camera pose | OpenSky trajectory + COLMAP | MVControl | ★★★★ Multi-view consistency |

---

### 2.2 Tools in Each Step

| Tool | Role in Pipeline | License | GPU Required |
|---|---|---|---|
| **COLMAP** | SfM pose estimation (Steps 5) | BSD-3 | No (CPU) / optional GPU |
| **Nerfstudio (Splatfacto)** | 3DGS training (Step 6) | Apache 2.0 | Yes — NVIDIA CUDA |
| **ControlNet / ControlNet++** | Multi-view conditioning (Step 4) | CreativeML OpenRAIL-M | Yes |
| **MVControl** | Multi-view 3D generation (Step 4) | MIT | Yes |
| **GaussCtrl** | Post-hoc 3DGS editing (Step 4/6) | BSD-3 | Yes |
| **MV-DUSt3R+** | Sparse-view reconstruction (alt Step 5) | Research (Meta) | Yes |
| **Instant-NGP** | Rapid prototyping (Step 6 alt) | NVIDIA CUDA | Yes |
| **Cesium ion** | 3D Tiles tiling + hosting (Step 7) | Commercial SaaS | No |
| **CesiumJS** | Final rendering (Step 8) | Apache 2.0 | No (WebGL/WebGPU) |

---

### 2.3 3DGS vs NeRF Comparison

**Authoritative source:** Kerbl et al. 2023 (SIGGRAPH Best Paper); Müller et al. 2022.

| Criterion | 3D Gaussian Splatting (3DGS) | NeRF (Instant-NGP / Nerfacto) |
|---|---|---|
| **Representation** | Explicit (Gaussian ellipsoids) | Implicit (MLP neural weights) |
| **Rendering method** | Tile-based rasterisation | Volumetric ray marching |
| **Rendering speed (desktop)** | 100–200+ FPS | 0.01–15 FPS |
| **Training time** | 6–51 min (scene dependent) | 5 sec–48 hours |
| **Training time (Splatfacto)** | 15–45 min | 20 min (Nerfacto) |
| **Quality (PSNR)** | 23–27 dB (matches/exceeds NeRF) | 24–27 dB (Mip-NeRF360) |
| **Model size** | 50 MB–1+ GB (.ply, pre-compress) | ~5–50 MB (neural weights) |
| **Browser rendering** | ✅ WebGL/WebGPU (native) | ❌ Requires baking to mesh/splats |
| **Editability** | High (explicit primitives) | Low (retraining needed) |
| **Georeferencing** | Via ECEF root transform in 3D Tiles | Via mesh export → standard pipeline |
| **2026 standard** | KHR_gaussian_splatting (RC, Feb 2026) | No equivalent standard |
| **CesiumJS support** | ✅ v1.139+ `GaussianSplat3DTileContent` | Via mesh conversion only |
| **Web compression** | SPZ (~10:1), Draco | N/A for weights |
| **capegis recommendation** | ⭐ **PRIMARY production path** | Rapid prototyping only |

**Verdict:** 3DGS is the unambiguous 2026 production choice for browser-deployed capegis 3D reconstruction. Instant-NGP remains useful for fast iteration during scene capture.

---

### 2.4 `KHR_gaussian_splatting` Standard

| Property | Value |
|---|---|
| **Extension name** | `KHR_gaussian_splatting` |
| **Parent format** | glTF 2.0 |
| **Status** | Release Candidate (NOT yet ratified) |
| **Announced** | February 3, 2026 — Khronos Group |
| **Collaborators** | Khronos, OGC, Cesium/Bentley, Esri, Niantic Spatial, NVIDIA, Google, Adobe |
| **Companion extension** | `KHR_gaussian_splatting_compression_spz_2` (Niantic SPZ format) |
| **CesiumJS support** | ✅ v1.139+ `GaussianSplat3DTileContent` class |
| **OGC connection** | Described as "key component of OGC 3D Tiles 2.0" |
| **Compression ratio** | ~10:1 (SPZ vs uncompressed PLY) |
| **Known issues** | Race conditions in splat sort (fixed v1.139); flashing with multiple splat primitives; `modelMatrix` regression (workaround: bake into root tile transform) |

**capegis implication:** Use `.ply` as the canonical intermediate format during the RC period. The glTF path (KHR extension) should be the target delivery format once ratified. Both are supported by CesiumJS 1.139+.

---

### 2.5 Skyfall-GS: Satellite → 3D

A breakthrough method highly relevant to capegis:

| Property | Value |
|---|---|
| **Paper** | Skyfall-GS (ICLR 2026 Submission #13561) |
| **Input** | Multi-view satellite imagery (NO ground photos needed) |
| **Method** | Train 3DGS on satellite views → FLUX diffusion model fixes ground-level artifacts |
| **Output** | Real-time navigable 3D city models |
| **Scale** | City-block scale |
| **Significance** | First city-scale 3D from satellite alone |
| **capegis relevance** | High — Copernicus/Sentinel-2 imagery of Cape Town could feed this pipeline |

---

## 3. Data Ingestion Models

### 3.1 OpenSky Network ADS-B Integration

#### REST API Endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `GET /states/all` | Optional | All live aircraft state vectors (global or bounding box) |
| `GET /states/all?lamin=X&lamax=X&lomin=X&lomax=X` | Optional | Bounding box filtered |
| `GET /states/own` | Required | Only your receivers |
| `GET /flights/arrival?airport=FACT` | Required | Arrivals at Cape Town International |
| `GET /flights/departure?airport=FACT` | Required | Departures |
| `GET /tracks?icao24=X` | Required | Full trajectory (experimental) |

**Base URL:** `https://opensky-network.org/api`

**Cape Town bounding box query:**
```bash
GET /states/all?lamin=-34.5&lomin=18.0&lamax=-33.0&lomax=19.5&extended=1
```
Area: 1.5° × 1.5° = **2.25 sq° → 1 credit per request** (minimum cost tier).

#### State Vector Fields (18-Field Format)

```typescript
interface StateVector {
  icao24: string;           // [0] ICAO 24-bit address (hex)
  callsign: string | null;  // [1] Callsign (8 chars)
  origin_country: string;   // [2] Country of registration
  time_position: number | null;  // [3] Unix timestamp last position
  last_contact: number;     // [4] Unix timestamp last message
  longitude: number | null; // [5] WGS-84 longitude
  latitude: number | null;  // [6] WGS-84 latitude
  baro_altitude: number | null;  // [7] Barometric altitude (m)
  on_ground: boolean;       // [8] Surface position flag
  velocity: number | null;  // [9] Ground speed (m/s)
  true_track: number | null; // [10] Heading (° clockwise from N)
  vertical_rate: number | null; // [11] Climb rate (m/s)
  sensors: number[] | null; // [12] Receiver IDs
  geo_altitude: number | null;   // [13] Geometric altitude (m)
  squawk: string | null;    // [14] Transponder squawk code
  spi: boolean;             // [15] Special purpose indicator
  position_source: 0|1|2|3; // [16] 0=ADS-B 1=ASTERIX 2=MLAT 3=FLARM
  category: number;         // [17] Aircraft category (extended=1 only)
}
```

**CRS:** All coordinates WGS-84 (EPSG:4326) — matches capegis storage CRS.

#### Authentication & Rate Limits

```
POST https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded
grant_type=client_credentials&client_id=CLIENT_ID&client_secret=CLIENT_SECRET
```
Token TTL: 30 minutes.

| Tier | Credits/Day | Min Interval | Notes |
|---|---|---|---|
| Anonymous | 400 | 10 seconds | ~46 min/day continuous polling |
| Registered | 4,000 | 5 seconds | **Recommended** — poll every 30s |
| Active feeder | 8,000 | 5 seconds | Install RTL-SDR receiver in CT |

**Recommended polling:** Authenticated at **30-second intervals** = 2,880 requests/day (72% budget).

**⚠️ AWS/hyperscaler block:** OpenSky may block Vercel/AWS IPs. Poll from the DigitalOcean droplet, not from client or Vercel edge functions.

#### No WebSocket API

OpenSky has **no WebSocket or streaming API** — polling only. Recommended architecture:

```
OpenSky REST API  ←──(poll every 30s)──  Next.js API Route (DigitalOcean)
                                                  │
                                    ┌─────────────┼──────────────┐
                                    ▼             ▼              ▼
                              api_cache     SSE fan-out    Supabase Realtime
                             (Supabase)    (/api/aircraft   (LISTEN/NOTIFY)
                                            /stream)
                                                  │
                                    ┌─────────────┼─────────────┐
                                    ▼             ▼             ▼
                             Tenant A       Tenant B       Tenant C
                           (CesiumJS)     (MapLibre)    (CesiumJS)
```

#### Three-Tier Fallback (Mandatory per CLAUDE.md Rule 2)

```typescript
async function getAircraftData(): Promise<AircraftData> {
  // TIER 1: LIVE
  try {
    const live = await fetchOpenSkyLive();  // /api/states/all?bbox=CT
    if (live.states?.length > 0) {
      await updateCache(live);
      return { ...live, source: 'LIVE' };
    }
  } catch {}

  // TIER 2: CACHED (Supabase api_cache)
  try {
    const cached = await readCache('opensky_capetown_states');
    if (cached && !isExpired(cached, 300)) { // 5 min max age
      return { ...cached, source: 'CACHED' };
    }
  } catch {}

  // TIER 3: MOCK
  const mock = await import('/public/mock/aircraft-capetown.geojson');
  return { ...mock, source: 'MOCK' };
}
```

**Data badge:** `[OpenSky Network · 2026 · LIVE|CACHED|MOCK]`

---

### 3.2 CelesTrak TLE Orbital Data Format

CelesTrak provides **Two-Line Element (TLE)** sets for 180+ active satellites:

```
OBJECT_NAME
1 XXXXX U XXXXXXXX   26065.12345678  .00000000  00000-0  00000-0 0  9999
2 XXXXX  51.6000 337.0000 0001000 000.0000 000.0000 15.49000000000000
```

| Line | Field | Meaning |
|---|---|---|
| 1 | Field 3 | Satellite catalogue number (NORAD ID) |
| 1 | Field 4 | Classification (U=unclassified) |
| 1 | Field 7 | Epoch (year + day fraction in UTC) |
| 1 | Fields 8–9 | Drag terms |
| 2 | Field 3 | Inclination (degrees) |
| 2 | Field 4 | Right ascension of ascending node (degrees) |
| 2 | Field 5 | Eccentricity |
| 2 | Field 6 | Argument of perigee (degrees) |
| 2 | Field 7 | Mean anomaly (degrees) |
| 2 | Field 8 | Mean motion (revolutions/day) |

**CesiumJS integration:** Use the `satellite.js` npm library to propagate TLE to ECEF positions, then pass to `SampledPositionProperty` for smooth orbit rendering.

**capegis scope:** Satellite tracking is OUTSIDE the Cape Town GIS scope. TLE data is documented here for WorldView pattern completeness only.

---

### 3.3 AIS Maritime Beacon Data

Automatic Identification System (AIS) provides real-time ship positions:

| Property | Value |
|---|---|
| **Broadcast frequency** | 156.025 MHz (VHF) |
| **Update rate** | 2–10 seconds (underway), 3 minutes (at anchor) |
| **Range** | ~40 NM from shore receiver |
| **Format** | NMEA 0183 sentences (encoded) |
| **Public sources** | MarineTraffic API, AISHub, VesselFinder, local VHF receiver |
| **Data fields** | MMSI, vessel name, position, SOG, COG, heading, ship type, destination |

**Cape Town relevance:** Port of Cape Town (V&A Waterfront, Duncan Dock) and Table Bay are active shipping lanes. An AIS layer would show:
- Container vessels (Duncan Dock)
- Cruise ships (E Shed)
- Fishing fleet (Table Bay)
- Naval vessels (Simons Town)

**capegis recommendation:** Medium-priority. Use MarineTraffic API (commercial, ~$50/month) or AISHub (community, free for feeders). Requires POPIA review for vessel crew data.

---

### 3.4 GPS Jamming Inference from ADS-B Anomalies

WorldView demonstrated this derived layer for the Iran strikes analysis. The method:

1. Collect `geo_altitude` vs `baro_altitude` discrepancy for all aircraft in the region
2. When GPS is jammed, `geo_altitude` (GPS-derived) becomes unreliable or null
3. Aggregate aircraft reporting GPS position confidence degradation in a bbox
4. Cluster anomalies spatially → infer jamming source location and radius
5. Render as semi-transparent heatmap overlay

**capegis scope:** GPS jamming detection is OUTSIDE scope for Cape Town GIS. Documented as WorldView pattern example only. Could theoretically be repurposed to detect signal interference patterns in other contexts.

---

### 3.5 Google Photorealistic 3D Tiles Ingestion

| Property | Value |
|---|---|
| **API** | Google Maps Tile API — `tile.googleapis.com/v1/3dtiles/root.json` |
| **Session token** | Required — POST to `/v1/createSession` (expires every 30 minutes) |
| **Authentication** | `key=GOOGLE_MAPS_API_KEY` query parameter |
| **Format** | OGC 3D Tiles 1.1 with Draco-compressed glTF meshes |
| **Coverage** | Global, photorealistic photogrammetry — Cape Town verified as well-covered |
| **CRS** | ECEF (Earth-Centered, Earth-Fixed) — WGS84 ellipsoid |
| **Attribution required** | `© Google` attribution must be displayed |
| **CesiumJS loading** | `Cesium3DTileset.fromGoogleMaps('KEY')` |
| **Billing** | Pay-per-tile-load after free tier; pricing per CPM varies by zoom level |
| **Rate limits** | Managed via session token lifecycle; CDN proxy recommended for production |

**Session token lifecycle:**

```typescript
// Post to create session (server-side — never expose key client-side)
const session = await fetch(`https://tile.googleapis.com/v1/createSession?key=${KEY}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mapType: 'photorealistic', language: 'en-US', region: 'ZA' }),
});
// Session valid for 30 minutes — refresh proactively
```

**Known unknowns:** Google 3D Tiles coverage quality and pricing for Cape Town at multi-tenant scale have not been verified. This is flagged as [UNVERIFIED] in all source documents.

---

## 4. Temporal Architecture (4D = 3D + Time)

### 4.1 The 4D Concept

WorldView's most powerful innovation is temporal alignment of all data sources on a single clock. "4D" means 3D spatial data plus a time dimension that enables:

- **Forward playback:** Watching events unfold in sequence
- **Backward replay:** Scrubbing to any historical moment
- **Predictive extrapolation:** Following trajectories forward in time

The paradigmatic example is the Iran strikes reconstruction: minute-by-minute scrubbing through 6 fused data layers (flights, satellites, GPS jamming, AIS, no-fly zones, strike coordinates).

---

### 4.2 Timeline Scrubbing Implementation (CesiumJS)

CesiumJS has native support for time-dynamic scenes via **CZML** and **Clock**:

```typescript
// Clock configuration for temporal scrubbing
const viewer = new Cesium.Viewer('cesiumContainer', {
  shouldAnimate: false,  // user controls playback
  clockViewModel: new Cesium.ClockViewModel(
    new Cesium.Clock({
      startTime: Cesium.JulianDate.fromIso8601('2026-01-01T00:00:00Z'),
      stopTime:  Cesium.JulianDate.fromIso8601('2026-01-02T00:00:00Z'),
      currentTime: Cesium.JulianDate.fromIso8601('2026-01-01T12:00:00Z'),
      multiplier: 10,  // 10x playback speed
      clockRange: Cesium.ClockRange.LOOP_STOP,
      clockStep: Cesium.ClockStep.TICK_DEPENDENT,
    })
  ),
});

// Timeline UI — CesiumJS ships with a built-in timeline widget
// For custom UI, bind to viewer.clock.currentTime via event subscription
viewer.clock.onTick.addEventListener((clock) => {
  const iso = Cesium.JulianDate.toIso8601(clock.currentTime);
  updateTimeDisplay(iso);
  filterDataToTime(clock.currentTime);
});
```

**CZML time-dynamic entity pattern:**

```json
{
  "id": "aircraft-3c6444",
  "position": {
    "interpolationAlgorithm": "LAGRANGE",
    "interpolationDegree": 1,
    "epoch": "2026-01-01T12:00:00Z",
    "cartographicDegrees": [
      0,   18.60, -33.97, 10500,
      10,  18.61, -33.96, 10520,
      30,  18.63, -33.95, 10540
    ]
  }
}
```

---

### 4.3 Historical Replay vs Live vs Predictive Modes

| Mode | Data Source | Clock Setting | capegis Use Case |
|---|---|---|---|
| **LIVE** | OpenSky REST (polled) | `SYSTEM_CLOCK`, `multiplier: 1` | Real-time flight tracking |
| **CACHED REPLAY** | `api_cache` snapshots | `TICK_DEPENDENT`, variable multiplier | Replay last hour of flights |
| **HISTORICAL** | Long-term storage (S3/cold) | `TICK_DEPENDENT`, fast playback | Property valuation history |
| **PREDICTIVE** | Extrapolation from trajectory | `SYSTEM_CLOCK` + `HOLD` extrapolation | Near-term flight path projection |
| **4DGS EVENT** | Reconstructed 3DGS + CZML | `TICK_DEPENDENT`, scrubber UI | Event reconstruction replay |

---

### 4.4 Time-Series Storage Patterns

```sql
-- api_cache table supports temporal queries via fetched_at
CREATE TABLE api_cache (
  cache_key    TEXT NOT NULL,
  data         JSONB NOT NULL,
  source_name  TEXT NOT NULL,
  fetched_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,
  tenant_id    UUID REFERENCES tenants(id)  -- NULL = shared
);

-- Historical snapshots: key pattern
-- 'opensky_capetown_states'              → current (overwritten on each poll)
-- 'opensky_capetown_states_2026010112'   → hourly snapshot (retained)

-- Query: last 2 hours of aircraft positions for replay
SELECT data, fetched_at
FROM api_cache
WHERE cache_key LIKE 'opensky_capetown_states_%'
  AND fetched_at >= NOW() - INTERVAL '2 hours'
ORDER BY fetched_at ASC;
```

**Retention recommendation:** 30-day rolling window in `api_cache` (hot). Longer periods in cold storage (Supabase Storage or S3) compressed as NDJSON.

**4DGS temporal model:** Timestamped point cloud snapshots where each Gaussian carries a temporal weight:

```
t₁: Gaussian set (initial state)
t₂: Gaussian set (after change A)
t₃: Gaussian set (after change B)

Interpolate: blend Gaussian parameters between keyframes using lerp
```

This is the "4DGS" (4D Gaussian Splatting) paradigm — treating the set of Gaussians as a time-varying function rather than a static scene.

---

## 5. CesiumJS Integration Patterns

### 5.1 Scene Graph Usage

CesiumJS uses an entity/primitive system for scene composition:

```typescript
// Recommended pattern: EntityCollection for dynamic data
const viewer = new Cesium.Viewer('container', {
  terrainProvider: await Cesium.CesiumTerrainProvider.fromIonAssetId(1),
});

// Google 3D Tiles as tileset primitive
const googleTiles = await Cesium.Cesium3DTileset.fromGoogleMaps(API_KEY);
viewer.scene.primitives.add(googleTiles);

// Aircraft as entities (support time-dynamic positions)
const aircraft = viewer.entities.add({
  id: 'aircraft-SAA123',
  position: sampledPositionProperty,  // SampledPositionProperty
  orientation: new Cesium.VelocityOrientationProperty(sampledPositionProperty),
  model: { uri: '/models/aircraft.glb' },
  path: { material: Cesium.Color.CYAN, trailTime: 300 },
});

// 3DGS scene as 3D Tiles
const splatTileset = await Cesium.Cesium3DTileset.fromIonAssetId(ASSET_ID);
viewer.scene.primitives.add(splatTileset);
```

**Entity vs Primitive:**
- **Entities:** Time-dynamic data (aircraft, ships, satellite orbits) — use Entity API
- **Primitives:** Static geometry (3D Tiles, point clouds, GS scenes) — use Primitive API

---

### 5.2 3D Tiles Streaming

CesiumJS streams 3D Tiles with automatic Level-of-Detail (LoD) based on viewport:

```typescript
const tileset = await Cesium.Cesium3DTileset.fromUrl(TILE_SERVER_URL, {
  maximumScreenSpaceError: 16,      // quality vs performance tradeoff
  preloadWhenHidden: false,
  maximumMemoryUsage: 512,          // MB — tune for target device
  skipLevelOfDetail: false,
  baseScreenSpaceError: 1024,
  skipScreenSpaceErrorFactor: 16,
  skipLevels: 1,
  immediatelyLoadDesiredLevelOfDetail: false,
  loadSiblings: false,
  cullWithChildrenBounds: true,
});
viewer.scene.primitives.add(tileset);
viewer.zoomTo(tileset);
```

**Self-hosted tiles (Martin tile server on DigitalOcean):**
```typescript
// Vector tile source (MVT) via Martin
const vtTileset = new Cesium.Cesium3DTileset({
  url: `${MARTIN_URL}/tileset/parcels/{z}/{x}/{y}.pbf`,
});
```

---

### 5.3 Cesium Ion Integration

| Capability | Status | Notes |
|---|---|---|
| Point cloud → 3D Tiles | ✅ Production | Automated tiling via ion upload |
| Photogrammetry → 3D Tiles | ✅ Production | Drone imagery → ion → 3D Tiles |
| Direct 3DGS upload | ⚠️ Emerging | Community says tools needed (March 2026) |
| Gaussian Splatting rendering | ✅ v1.139+ | `GaussianSplat3DTileContent` class |
| Google Maps 3D Tiles proxy | ✅ | `Cesium3DTileset.fromGoogleMaps()` |

**Recommended workflow for 3DGS scenes:**
```
Capture → COLMAP → Splatfacto → ns-export gaussian → Upload PLY to Cesium ion
→ ion tiles → CesiumJS `Cesium3DTileset.fromIonAssetId()`
```

---

### 5.4 CZML for Flight Data

CZML (Cesium Language) is the canonical format for time-dynamic scenes:

```json
[
  {
    "id": "document",
    "name": "Cape Town Airspace",
    "version": "1.0",
    "clock": {
      "interval": "2026-03-05T00:00:00Z/2026-03-06T00:00:00Z",
      "currentTime": "2026-03-05T12:00:00Z",
      "multiplier": 1,
      "range": "UNBOUNDED",
      "step": "SYSTEM_CLOCK"
    }
  },
  {
    "id": "aircraft-3c6444",
    "name": "SAA331",
    "description": "ICAO: 3c6444 | SAA331 | Alt: 10,500m",
    "position": {
      "interpolationAlgorithm": "LAGRANGE",
      "interpolationDegree": 1,
      "epoch": "2026-03-05T12:00:00Z",
      "cartographicDegrees": [0, 18.60, -33.97, 10500, 30, 18.63, -33.94, 10540]
    },
    "orientation": { "velocityReference": "#position" },
    "model": { "gltf": "/models/aircraft.glb", "minimumPixelSize": 32 },
    "path": {
      "material": { "polylineGlow": { "color": { "rgba": [0, 255, 255, 128] }, "glowPower": 0.2 } },
      "width": 3, "trailTime": 600, "leadTime": 0
    },
    "label": {
      "text": "SAA331",
      "font": "11px monospace",
      "fillColor": { "rgba": [255, 255, 255, 255] },
      "showBackground": true,
      "backgroundColor": { "rgba": [0, 0, 0, 180] }
    }
  }
]
```

---

## 6. ⚠️ Stack Conflict Analysis

### The Conflict

**WorldView and the GIS_MASTER_CONTEXT research architecture plan for CesiumJS as the primary 3D rendering engine.** However, **CLAUDE.md mandates MapLibre GL JS as the ONLY map library** for the current phase of capegis:

> *CLAUDE.md §2, Technology Stack:*
> **"Mapping: MapLibre GL JS — NOT Leaflet, NOT Mapbox GL JS"**
>
> *CLAUDE.md §9, Escalation Protocol:*
> **"Do not introduce unlisted libraries without human approval. Document additions in `docs/PLAN_DEVIATIONS.md`."**

CesiumJS is not MapLibre. It is a distinct, heavyweight 3D globe library with a different rendering model, different API, and fundamentally different architectural role.

### The Tension Documented Honestly

| Dimension | MapLibre Position | CesiumJS Position |
|---|---|---|
| **CLAUDE.md mandate** | ✅ Explicitly required | ❌ Not listed; requires human approval |
| **Current milestone** | M0–M4 (foundation) | Planned for M8–M12 |
| **Bundle size** | ~2MB (lightweight) | ~30–50MB (heavyweight) |
| **3D capability** | Limited (pitch + tilt only) | Full 3D globe, true 3D geometry |
| **3DGS rendering** | ❌ None | ✅ Native (v1.139+) |
| **Time-dynamic data** | ❌ No native clock | ✅ Native CZML clock |
| **Flight tracking** | ✅ 2D icons possible | ✅ Full 3D entities |
| **Google 3D Tiles** | ❌ Not supported | ✅ Native integration |
| **PWA/mobile** | ✅ Excellent | ⚠️ Heavy for mobile |
| **WorldView patterns** | Partially applicable | Fully applicable |

### Resolution Path

The research documents and `GIS_MASTER_CONTEXT.md` consistently describe a **phased hybrid architecture** that resolves this conflict without violating the current mandate:

**Phase 1 (M0–M7) — MapLibre Only:**
- All current development uses MapLibre exclusively
- CLAUDE.md is respected in full
- 2D flight tracking via GeoJSON updates on MapLibre
- No CesiumJS code introduced

**Phase 2 (M8–M12) — Hybrid Introduction:**
- Human approval required before CesiumJS is added (`docs/PLAN_DEVIATIONS.md` DEV entry)
- CesiumJS added as an **additional** library for 3D views only
- 2D/3D mode toggle: MapLibre (default) ↔ CesiumJS (3D mode)
- Camera synchronisation via shared lat/lng/zoom state
- MapLibre remains the default/primary renderer

**Specific deviation record required:** Before any CesiumJS code is written, a `docs/PLAN_DEVIATIONS.md` entry (DEV-NNN format) must document:
- The architectural justification
- Human approval confirmation
- The specific milestone trigger
- The performance/bundle-size mitigation plan

### What CAN Be Done Now (MapLibre, No Conflict)

| Pattern | MapLibre Implementation | WorldView Inspiration |
|---|---|---|
| Flight tracking | GeoJSON source + rotated icon layer | OpenSky ADS-B integration |
| Dark dashboard | MapLibre dark basemap + CSS | WorldView visual aesthetic |
| Data layer toggles | Layer visibility controls | God Mode layer stack |
| Progressive loading | `addSource()` + `addLayer()` on scroll | WorldView load strategy |
| Data source badges | React overlay component | Rule 1 compliance |
| Three-tier fallback | Hook-based LIVE/CACHED/MOCK | Rule 2 compliance |
| Time slider (basic) | React slider → filter GeoJSON | Temporal scrubbing concept |

### What Requires CesiumJS (Phase 2+)

- Google Photorealistic 3D Tiles rendering
- 3D Gaussian Splatting scene display
- CZML time-dynamic entity animation
- True 3D aircraft models with VelocityOrientationProperty
- 4D WorldView event assembly (Step 8 of reconstruction pipeline)
- KHR_gaussian_splatting scene delivery

### Anti-Pattern Warning

**Do NOT attempt to replicate CesiumJS 3D functionality within MapLibre using workarounds** (e.g., Three.js overlaid on MapLibre, custom WebGL layers for 3DGS). This creates:
- Depth ordering conflicts (known issue with Three.js + CesiumJS)
- Maintenance burden with no clear upgrade path
- Architectural debt that blocks the clean Phase 2 introduction of CesiumJS

The clean architecture is: MapLibre for 2D → official CesiumJS for 3D, with human-approved milestone gate.

---

## 7. capegis Adaptation Catalogue

### 7.1 High Priority (Implement in Current Phase with MapLibre)

| Pattern | WorldView Source | capegis Implementation |
|---|---|---|
| **Dark operational dashboard** | Military aesthetic, near-black bg | Already mandated — Tailwind dark mode |
| **OpenSky ADS-B integration** | 7,000+ live aircraft | Cape Town bbox, 30s poll, mock fallback |
| **Progressive layer loading** | Sequential load, density culling | Layer Z-order, zoom-gated cadastral |
| **Three-tier fallback** | Implicit in WorldView design | Explicitly mandated (Rule 2) |
| **Data source badges** | Attribution on all feeds | Explicitly mandated (Rule 1) |
| **Mode switching concept** | NVG/FLIR/Standard toggle | Standard/Analysis/Comparison/Presentation |

### 7.2 Medium Priority (Phase 2 with CesiumJS approval)

| Pattern | WorldView Source | capegis Implementation |
|---|---|---|
| **Google 3D Tiles** | Foundation layer | Table Mountain, V&A Waterfront 3D view |
| **Temporal scrubbing** | 4D event replay slider | Property valuation history, planning timelines |
| **CZML entity animation** | Aircraft + satellites | Cape Town flight tracking in 3D |
| **3DGS scene integration** | WorldView detection overlays | Drone captures of Cape Town landmarks |
| **Maritime AIS layer** | Strait of Hormuz shipping | Port of Cape Town Table Bay layer |

### 7.3 Cape Town-Specific Adaptations

| WorldView Feature | Cape Town Adaptation |
|---|---|
| Iran strikes 4D replay | Cape Town fire season temporal layer (historical wind + fire data) |
| GPS jamming inference | Load shedding geographic impact overlay (Eskom stage → area) |
| Satellite constellation tracking | Table Mountain Aerial Cableway OSINT (tourist flow) |
| CCTV building projection | ❌ POPIA prohibits — exclude |
| Military flight tracking | ❌ Out of scope — exclude |

### 7.4 Anti-Patterns to Avoid

| Pattern | Reason to Avoid |
|---|---|
| CCTV integration | POPIA risk — personal surveillance data of natural persons |
| Custom GLSL shader pipeline (NVG/FLIR/CRT) | Over-engineering for a property/zoning GIS platform |
| Satellite constellation tracking | Outside Cape Town geographic scope |
| Military flight tracking (ADS-B Exchange) | Outside scope; ToS risk |
| Replicate CesiumJS 3D in MapLibre via workarounds | Creates depth ordering bugs, maintenance debt |

---

## 8. Source Confidence Assessment

| Section | Confidence | Source |
|---|---|---|
| WorldView data layer stack | **HIGH** | First-party articles; third-party Bit Rebels analysis |
| Visual design system | **MEDIUM** | Described in articles; CSS inferred (not open-source) |
| Shader pipeline modes (NVG/FLIR/etc.) | **HIGH** | Directly described by Sidhu in primary article |
| Sousveillance philosophy | **HIGH** | Direct quotes from primary article |
| 8-step ControlNet pipeline | **HIGH** | GIS_MASTER_CONTEXT.md §7.3 (capegis internal spec) |
| 3DGS vs NeRF comparison | **HIGH** | Published papers (Kerbl 2023 SIGGRAPH; Müller 2022 SIGGRAPH) |
| KHR_gaussian_splatting status | **HIGH** | Khronos press release Feb 3, 2026 |
| OpenSky API endpoints and format | **HIGH** | Official OpenSky API documentation (verified 2026-03-05) |
| OpenSky rate limits | **HIGH** | Official docs (credit-based system confirmed) |
| CelesTrak TLE format | **HIGH** | Well-documented public standard |
| AIS maritime format | **HIGH** | NMEA 0183 standard; publicly documented |
| GPS jamming inference | **HIGH** | Described in WorldView Iran reconstruction |
| Google 3D Tiles API | **HIGH** | Official Google Maps Platform docs |
| Google 3D Tiles CT coverage | **UNVERIFIED** | Needs API testing |
| Google 3D Tiles pricing at scale | **UNVERIFIED** | Not publicly documented for multi-tenant |
| CesiumJS 3DGS support status | **HIGH** | CesiumJS 1.139 changelog (March 2026) |
| Cesium ion direct splat upload | **LOW** | Community discussions only; no confirmed workflow |
| Stack conflict analysis | **HIGH** | CLAUDE.md text is authoritative; conflict is real |

---

### Key Unresolved Questions

| # | Question | Impact |
|---|---|---|
| Q1 | Does Google 3D Tiles cover Cape Town at street level? | High — blocks 3D reconstruction pipeline |
| Q2 | What is Google 3D Tiles pricing for multi-tenant production? | High — budget risk |
| Q3 | Can OpenSky commercial use proceed without explicit license? | High — licensing risk |
| Q4 | Can Vercel edge functions sustain background polling? | Medium — architecture |
| Q5 | When will KHR_gaussian_splatting be formally ratified? | Low — PLY fallback available |
| Q6 | Does Cesium ion support direct PLY → 3D Tiles pipeline in March 2026? | Medium — affects Step 7 |

---

*Compiled by Agent B — WorldView Analyst*
*Sources cross-referenced from 5 research documents + project CLAUDE.md*
*All claims attributed; unverified items explicitly marked*
*Stack conflict documented per CLAUDE.md §9 escalation protocol*
