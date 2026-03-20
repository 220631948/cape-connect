# Spatial AI Innovations Catalogue

> **TL;DR:** Catalogues 23 AI innovations for GIS: NL-to-PostGIS querying (tool-calling, TRL 5–7), 3D Gaussian Splatting (Splatfacto + COLMAP, TRL 7), ControlNet sparse-view enhancement (experimental), Spatial RAG (pgvector), and edge AI (ONNX Runtime WASM). Each innovation has phase assignment, confidence level, and key dependency. AI content labeling is mandatory for all AI features.
>
> **Roadmap Relevance:** M8–M15 (Phase 2–3) — AI feature catalogue. NL→Spatial in M10, 3DGS in M8, Spatial RAG in M10.

> **Agent:** AGENT C — Spatial AI Innovator  
> **Generated:** 2026-03-05  
> **Sources:** nl-to-spatial-query.md · controlnet-gis-reconstruction.md · 06_GeoAI_RealTime_Integration.md · GIS_MASTER_CONTEXT.md §7 & §9 · spatialintelligence-deep-dive-2026-03-05.md · 3dgs-nerf-gis-research.md  
> **Project:** CapeTown GIS Hub (`capegis`)

---

## Table of Contents

1. [Natural Language → Spatial Query (NL2SQL-GIS)](#1-natural-language--spatial-query-nl2sql-gis)
2. [ControlNet for Spatial Reconstruction](#2-controlnet-for-spatial-reconstruction)
3. [3D Gaussian Splatting & NeRF](#3-3d-gaussian-splatting--nerf)
4. [AI Content Labeling Requirements](#4-ai-content-labeling-requirements)
5. [Real-Time AI & Sensor Fusion](#5-real-time-ai--sensor-fusion)
6. [Emerging Spatial AI Patterns](#6-emerging-spatial-ai-patterns)
7. [Master Summary Table](#7-master-summary-table)

---

## 1. Natural Language → Spatial Query (NL2SQL-GIS)

### 1.1 Overview

| Field | Value |
|-------|-------|
| **What it does** | Converts plain English geographic questions into parameterized PostGIS queries or spatial tool calls |
| **Primary inputs** | User NL string, tenant context, RBAC role, Cape Town bounding box |
| **Key dependency** | Supabase PostGIS, LLM API (Claude / GPT-4), Vercel AI SDK |
| **Project phase** | Phase 1 (tool registry M6), Phase 2 (agent M10) |
| **Confidence** | High (architecture); Medium (production accuracy) |

### 1.2 Architecture — Three LLM Orchestration Patterns

#### Pattern A: Tool-Calling / Function-Calling (RECOMMENDED)

```
User NL → LLM → Selects tool + extracts params → Executes parameterized query → Result
```

- LLM selects from a **curated registry of ~15 spatial tools**
- No raw SQL generated; all queries are pre-validated and parameterized
- Tenant-safe: every tool enforces RLS context via `SET LOCAL app.current_tenant`
- Auditable: every tool call logged to `audit_log`

```typescript
// Example tool definition
{
  name: "find_features_near_point",
  description: "Find geographic features within a radius of a point.",
  parameters: {
    latitude:        { type: "number", validation: { min: -34.5, max: -33.0 } },
    longitude:       { type: "number", validation: { min: 18.0, max: 19.5 } },
    distance_meters: { type: "number", validation: { min: 1, max: 10000 } },
    feature_type:    { type: "string", validation: { enum: ["parcels","schools","clinics","parks","roads"] } }
  }
}
```

#### Pattern B: Direct SQL Generation (Text-to-PostGIS)

```
User NL → LLM + schema context → Raw SQL → Validate AST → Execute (read-only role)
```

- Higher risk: SQL injection, schema leakage, CRS errors, hallucinated table names
- Permitted only for `PLATFORM_ADMIN` with additional safeguards
- **Research:** GeoSQL-Eval (arXiv:2509.25264) is the first PostGIS-specific benchmark; GPT-4 ~70% accuracy on standard benchmarks, drops significantly on complex spatial joins [UNVERIFIED — study-specific]

#### Pattern C: Agent-Based Multi-Step (ReAct / Plan-and-Execute)

```
User NL → LLM Agent → Plan → Execute sub-steps → Observe → Iterate → Result
```

- Used for complex, multi-operation queries (e.g., "Which schools in Khayelitsha are >2km from any clinic?")
- **Key research:** MapAgent (arXiv:2509.05933) — hierarchical planner + executor split; Spatial-Agent (arXiv:2601.16965) — GeoFlow Graphs for spatial concept decomposition
- Higher latency, higher LLM cost, greater hallucination cascade risk
- Target audience: `POWER_USER` and above

### 1.3 Geoprocessing Tool Registry

**Tier 1 — Launch (M6)**

| Tool | PostGIS Basis | Min RBAC Role |
|------|---------------|---------------|
| `geocode_place` | Gazetteer lookup | GUEST |
| `find_features_near_point` | `ST_DWithin` | VIEWER |
| `find_features_in_area` | `ST_Intersects` | VIEWER |
| `get_feature_details` | PK lookup | VIEWER |
| `measure_distance` | `ST_Distance` | VIEWER |
| `count_features_in_area` | `ST_Intersects` + COUNT | VIEWER |

**Tier 2 — Analysis (M8+)**

| Tool | PostGIS Basis | Min RBAC Role |
|------|---------------|---------------|
| `buffer_analysis` | `ST_Buffer` | ANALYST |
| `aggregate_by_area` | `ST_Intersects` + GROUP BY | ANALYST |
| `nearest_features` | `ST_Distance` + ORDER BY | ANALYST |
| `spatial_join` | `ST_Intersects` join | ANALYST |

**Tier 3 — Advanced (M10+)**

| Tool | PostGIS Basis | Min RBAC Role |
|------|---------------|---------------|
| `cluster_analysis` | `ST_ClusterDBSCAN` | POWER_USER |
| `isochrone_analysis` | pgRouting | POWER_USER |
| `multi_step_chain` | Agent orchestration | POWER_USER |

### 1.4 Natural Language Intent → PostGIS Function Mapping

| NL Trigger | PostGIS Function | Example |
|------------|-----------------|---------|
| "near", "within X meters", "close to" | `ST_DWithin`, `ST_Distance` | "Properties within 500m of N2" |
| "buffer", "surrounding area" | `ST_Buffer` | "500m buffer around the N1" |
| "in", "inside", "overlapping" | `ST_Intersects`, `ST_Within` | "Parcels in flood zone AND zoned residential" |
| "nearest", "closest" | `ST_Distance` + ORDER BY + LIMIT | "Nearest clinic to Khayelitsha" |
| "how big", "area of" | `ST_Area` | "Area of Woodstock suburb" |
| "clusters", "hotspots" | `ST_ClusterDBSCAN` | "Crime hotspots in Cape Town CBD" |
| "merge", "combine" | `ST_Union` | "Merge adjacent parcels" |

### 1.5 Prompt Engineering Patterns for Geographic Reasoning

**System prompt constraints (mandatory):**
```
1. All coordinates must be in EPSG:4326 (WGS 84).
2. Latitude range: -34.5 to -33.0 (Cape Town bounding box).
3. Longitude range: 18.0 to 19.5 (Cape Town bounding box).
4. Never generate DROP, UPDATE, DELETE, or INSERT statements.
5. Always use the provided tool registry — do not invent tools.
6. When a place name is ambiguous, call geocode_place() first.
```

**RAG augmentation context to inject:**
- Cape Town gazetteer (suburb names, landmarks, informal settlement variants)
- PostGIS function reference (ST_DWithin, ST_Buffer, etc.)
- Few-shot examples of recent successful queries

### 1.6 Ambiguity Resolution Strategies

| Ambiguity | Strategy | Example |
|-----------|----------|---------|
| "near" = how many meters? | Default 500m; ask if > 2km needed | "Properties near Cape Town CBD" → 500m |
| Place name conflict | Geocode to local gazetteer; prefer CoCT boundary match | "Woodstock" = Cape Town suburb, not Brooklyn |
| "recent" = how old? | Default 12 months; ask user to specify | "Recent property sales" |
| CRS confusion | Validate all output coords against bbox; reject out-of-range | Reject lat=5780000 (EPSG:3857 leaked) |
| Multiple feature types | List available types; ask for clarification | "Show me everything in Khayelitsha" |

**Cape Town-specific disambiguation:**
- Informal settlement names (may not appear in OSM — build local gazetteer)
- Afrikaans/English/Xhosa place name variants (e.g., "Kaapstad" vs "Cape Town")
- Local landmarks without formal geocoding ("the Foreshore", "the Parade")

**Recommended Supabase gazetteer schema:**
```sql
CREATE TABLE gazetteer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_variants TEXT[] DEFAULT '{}',  -- Afrikaans, Xhosa, informal
  feature_type TEXT,  -- suburb, landmark, road, facility
  geom GEOMETRY(GEOMETRY, 4326),
  source TEXT
);
CREATE INDEX gazetteer_name_gin ON gazetteer USING gin(to_tsvector('english', name));
CREATE INDEX gazetteer_geom_gist ON gazetteer USING gist(geom);
```

### 1.7 Safety & Multi-Tenant Guardrails

```sql
-- Restricted read-only database role for all copilot queries
CREATE ROLE gis_copilot_reader NOLOGIN;
GRANT USAGE ON SCHEMA public TO gis_copilot_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO gis_copilot_reader;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM gis_copilot_reader;

-- Before every copilot query:
SET LOCAL app.current_tenant = $tenantId;
SET LOCAL role = 'gis_copilot_reader';
```

**Rate limits by RBAC role:**

| Role | Queries/hr | Max Rows | Max Buffer |
|------|-----------|----------|------------|
| GUEST | 0 (no access) | — | — |
| VIEWER | 30 | 100 | 2 km |
| ANALYST | 120 | 500 | 10 km |
| POWER_USER | 300 | 1000 | 25 km |
| TENANT_ADMIN | 600 | 5000 | 50 km |

### 1.8 Existing Systems Reference

| System | Type | Status | Relevance |
|--------|------|--------|-----------|
| **ArcGIS AI Assistants** | Commercial (Esri) | Shipping (beta, Feb 2026) | Validates market; not open API |
| **Penn State GIS Copilot v1.0** | Academic open-source | Released Oct 2025 | QGIS plugin; architecture reference |
| **Atlas Navi** | Commercial SaaS | Shipping | Closest to NL-to-map vision; not self-hostable |
| **gis-mcp** (mahdin75) | Open-source MCP server | v0.14.0, MIT | Reference for MCP tool design |
| **LLM-Geo** | Academic | 2023 prototype | First autonomous GIS concept |
| **MapAgent** | Academic | 2025 | Hierarchical planner/executor pattern |

---

## 2. ControlNet for Spatial Reconstruction

### 2.1 Overview

| Field | Value |
|-------|-------|
| **What it does** | Conditions a diffusion model on geometry priors (depth, normals, edges) to generate new views or textures constrained by known 3D structure |
| **Primary inputs** | Depth/normal maps (from Google 3D Tiles, LiDAR, or COLMAP), text prompt, camera poses |
| **Key dependency** | GPU server (A100+ recommended), COLMAP, Stable Diffusion base model |
| **Project phase** | Phase 2+ (M5 prototype; M11+ production) |
| **Confidence** | High for base ControlNet; Medium for ControlNet++; Speculative for end-to-end GIS pipeline |

### 2.2 ControlNet Variant Landscape

| Variant | Paper | Venue | What It Does | TRL | Confidence |
|---------|-------|-------|-------------|-----|-----------|
| **ControlNet** (base) | Zhang et al. 2023 | ICCV 2023 | Adds spatial conditioning to diffusion models via zero-convolutions | 8–9 | **High** |
| **ControlNet++** | Li et al. 2024 | ECCV 2024 | Pixel-level cycle consistency → better depth/normal fidelity | 5–6 | **High** |
| **MVControl** | Li et al. 2023/2024 | ECCV 2024 | Multi-view consistent generation with camera pose awareness | 4–5 | **High** |
| **ControlCity** | Zhou et al. 2024 | arXiv 2409.17049 | GIS-specific: satellite/map → photorealistic imagery | 4 | **Medium** |
| **GPS2Pix** | Feng et al. 2025 | CVPR 2025 | GPS coordinates as conditioning signal for place-specific generation | 4–5 | **Medium** |
| **GeoTexBuild** | Wang et al. 2025 | arXiv 2504.08419 | 3D buildings from map footprints + height-map ControlNet | 3–4 | **Medium** |
| **LooseControl** | Bhat et al. 2023 | arXiv 2312.03079 | Loose/approximate depth specs + 3D box control | 4–5 | **Medium** |

### 2.3 How ControlNet Conditions on Geometry Priors

**Zero-convolution mechanism:**
1. Pretrained diffusion encoder is **locked** (frozen weights)
2. A **trainable copy** of encoder blocks processes the conditioning input
3. Zero-initialized convolution layers ("zero convolutions") connect the trainable copy to the locked model
4. During early training, zero convolutions output zero → no change to base model; as training progresses, the conditioning gradually influences generation

**Conditioning signals for GIS (from GIS_MASTER_CONTEXT §7.3):**

| Signal | Extracted From | ControlNet Model | Geometric Effect |
|--------|---------------|-----------------|-----------------|
| **Depth map** | Google 3D Tiles Z-buffer render, LiDAR | ControlNet-depth | ★★★★★ Primary geometry anchor |
| **Normal map** | Google 3D Tiles normal render | ControlNet-normal | ★★★★ Surface fidelity |
| **Canny edges** | Google Tiles edge detection | ControlNet-canny | ★★★ Structural outlines |
| **Semantic mask** | Land-use classification / CoCT zoning | ControlNet-seg | ★★★ Material consistency |
| **Camera pose** | OpenSky trajectory + COLMAP estimation | MVControl | ★★★★ Multi-view consistency |

### 2.4 Integration with 3DGS Training Pipeline

**The 8-step ControlNet → 3DGS pipeline (from GIS_MASTER_CONTEXT §7.3):**

```
Step 1  Event trigger (OpenSky → event_id, bbox, timestamp)
Step 2  Geometry prior extraction (Google 3D Tiles → depth + normal + edge maps)
Step 3  Public image collection (Street View + webcams + Sentinel-2, 4–8 images)
Step 4  Multi-ControlNet conditioning (depth+normal+edge → 8–16 novel views)
        2026 extensions: MVControl, GaussCtrl, ControlNet++
Step 5  COLMAP pose estimation + EPSG:4326 georeferencing
Step 6  Splatfacto training (3DGS, ~15 min on A100)
Step 7  Cesium ion export (ns-export gaussian → upload → 3D Tiles asset_id)
Step 8  4D WorldView assembly (8-layer CesiumJS stack + time scrubber)
```

**COLMAP integration points:**
- `COLMAP → ControlNet`: Use COLMAP-recovered camera poses + estimated depth maps as conditioning for view synthesis
- `ControlNet → COLMAP`: Feed synthesized views back into COLMAP for densification or directly into MVS
- **Risk:** COLMAP may reject AI-synthesized views during bundle adjustment if geometrically inconsistent

### 2.5 Use Cases

| Use Case | Maturity | Description |
|----------|---------|-------------|
| **Event scene reconstruction** | Speculative | Reconstruct aircraft incidents, protest locations, wildfires from sparse public-camera images conditioned on Google 3D Tiles geometry |
| **Historical scene recovery** | Speculative | Generate plausible historical views of demolished buildings from archival photos + known footprint geometry |
| **Texture generation from geometry** | Medium | Generate facade textures for buildings where only footprint + height is known (from CoCT building data) |
| **Change visualization** | Speculative | Generate "before/after" scenes for urban planning proposals by conditioning on zoning maps |
| **Sparse-view gap filling** | Medium | Synthesize additional training views for 3DGS from minimal drone captures |
| **Zoning-to-aerial visualization** | Research | ControlCity: convert CoCT land-use maps to photorealistic aerial views |

### 2.6 Sparse-View Reconstruction Systems

| System | Approach | Input | TRL | Confidence |
|--------|----------|-------|-----|-----------|
| **ReconFusion** (CVPR 2024) | Diffusion prior regularizes NeRF | 3–9 images + poses | 5 | High |
| **CAT3D** (Google DeepMind, 2024) | Multi-view diffusion → 3D reconstruction | 1+ images | 5 | High |
| **ReconX** (Tsinghua, 2024) | Video diffusion for sparse reconstruction | Sparse images | 5 | High |
| **SparseGS-W** (2025) | 3DGS from 5 images with generative priors | 5 images | 4 | Medium |

### 2.7 Quality vs Hallucination Risk Tradeoffs

| Quality Factor | Risk Factor |
|---------------|------------|
| ControlNet++ improves pixel-level consistency | Diffusion models generate *plausible*, not *accurate*, content |
| Multi-view conditioning reduces per-view artifacts | Scale ambiguity: metric scale requires external reference |
| PSNR/SSIM metrics validate photometric quality | Outputs are stochastic (same inputs → different outputs) |
| Geometric consistency checked via MVS feedback | Legal/regulatory use of AI imagery unsupported in SA |
| GCPs + RTK GPS anchor georeferencing | COLMAP may reject synthetic views; bundle adjustment can fail |

**Critical warning:** AI-generated geospatial imagery is **acceptable for visualization** but **dangerous for surveying, legal, cadastral, or compliance purposes**. CoCT GV Roll 2022 remains the sole authoritative valuation source (CLAUDE.md Rule 8).

### 2.8 Maturity Assessment Summary

| Component | TRL | Production Use |
|-----------|-----|---------------|
| ControlNet (base) | 8–9 | ✅ Widely used in content production |
| ControlNet++ | 5–6 | ⚠️ Research only |
| MVControl | 4–5 | ❌ Published paper + code; not production-tested |
| ControlCity | 4 | ❌ Early-stage; directly relevant |
| GPS2Pix | 4–5 | ❌ CVPR 2025 novel concept |
| End-to-end ControlNet → 3D Tiles | 2–3 | ❌ No validated pipeline exists |

---

## 3. 3D Gaussian Splatting & NeRF

### 3.1 Overview

| Field | Value |
|-------|-------|
| **What it does** | Reconstructs photorealistic 3D scenes from multi-image captures; renders in real-time in browser via WebGL/WebGPU |
| **Primary inputs** | 50–500 geotagged images, NVIDIA GPU ≥8 GB VRAM, COLMAP for SfM |
| **Key dependency** | Nerfstudio (Splatfacto), COLMAP, Cesium ion, CesiumJS |
| **Project phase** | Phase 2+ (M5 prototype); Phase 3 (M11 production) |
| **Confidence** | High (technology); Medium (GIS pipeline integration) |

### 3.2 Instant-NGP Architecture (Hash Encoding)

**Paper:** Müller et al., "Instant Neural Graphics Primitives with a Multiresolution Hash Encoding," SIGGRAPH 2022.

```
THE INSTANT-NGP PIPELINE

INPUT: 5D vector (x, y, z, θ, φ) — position + viewing direction

HASH GRID ENCODING (the breakthrough):
  L=16 resolution levels, each with hash table T entries
  Each entry: F-dimensional trainable feature vector

  Step 1: Hash voxel vertices
    Resolution per level: Nₗ = floor(N_min × b^l)
    Hash: h(x) = (x₁π₁ XOR x₂π₂ XOR x₃π₃) mod T

  Step 2: Feature lookup
    Retrieve F-dim vector for each hashed vertex

  Step 3: Trilinear interpolation
    Blend 8 corner features → 1 feature vector per level

  Step 4: Concatenate all levels
    Final input: (L × F + 16) dims (includes 4-deg spherical harmonics)

COMPACT MLP: 2 hidden layers, 64 neurons (hash grid carries burden)

OUTPUT: (RGB, σ) — colour + volume density

VOLUME RENDERING: Ray marching + alpha compositing

WHY FOR GIS: Training in seconds → on-demand event reconstruction viable
             as platform feature, triggered by OpenSky trajectory intersection
```

| Property | Value |
|----------|-------|
| Training time | 5 sec – 5 min (scene-dependent) |
| Rendering speed | ~9–15 FPS at 1080p (ray marching, not real-time) |
| VRAM required | 4 GB min; 8 GB recommended |
| Browser feasibility | LOW — requires CUDA neural inference |
| Primary use in capegis | Rapid preview during capture; NOT for browser delivery |

### 3.3 3D Gaussian Splatting — 2026 Production Standard

**Paper:** Kerbl et al., "3D Gaussian Splatting for Real-Time Radiance Field Rendering," SIGGRAPH 2023. **Best Paper Award.**

Each Gaussian primitive has:
- **Position:** (x, y, z)
- **Covariance matrix:** encodes shape (scale + rotation)
- **Opacity:** α ∈ [0, 1]
- **Colour:** spherical harmonics coefficients (view-dependent)

Rendering: project Gaussians to screen → depth-sort → alpha-composite via differentiable tile rasteriser.

**3DGS is the primary recommendation for all browser-deployed AI reconstructions** (GIS_MASTER_CONTEXT §7.2).

### 3.4 Framework Decision Matrix

| Framework | Training | FPS (browser) | Scale | Primary Use Case | Cesium Path |
|-----------|---------|--------------|-------|-----------------|------------|
| Classic NeRF | Days | ~1 | Object | Legacy reference only | Via mesh export |
| **Instant-NGP** | **Seconds** | **~8** | Single scene | **Rapid prototype / dev iteration** | Via Nerfstudio |
| Nerfacto | 20 min | ~3 | Outdoor | Quality outdoor scenes | `ns-export mesh` |
| Block-NeRF | Hours | ~1 | City scale | City-scale digital twins | Via Cesium ion |
| **Splatfacto ★** | **15 min** | **100+** | **Outdoor** | **⭐ Primary production path** | **`ns-export gaussian`** |
| **3DGS (original)** | **30 min** | **100+** | Single scene | Direct training control | Native `.ply` |
| GaussCtrl | Minutes (edit) | 100+ | Event scene | Post-reconstruction editing | Native |

### 3.5 Splatfacto Training Workflow

**Input requirements:**

| Parameter | Requirement |
|-----------|------------|
| Images | 50–200 (Splatfacto); 1000s+ (Block-NeRF) |
| Camera poses | COLMAP SfM (mandatory) |
| GPU | NVIDIA RTX 3090/4090, ≥8 GB VRAM |
| Training time | 15–45 min (single scene, Splatfacto) |
| PSNR improvement | +5.3 dB over vanilla 3DGS for in-the-wild (Splatfacto-W) |

**Full pipeline:**
```
Capture → COLMAP SfM → Splatfacto training → PLY/glTF export
       → 3D Tiles tiling → Cesium ion hosting → CesiumJS rendering
```

**Nerfstudio commands:**
```bash
# Install
pip install nerfstudio

# Preprocess images with COLMAP
ns-process-data images --data /path/to/images --output-dir /path/to/processed

# Train Splatfacto
ns-train splatfacto --data /path/to/processed

# Export as Gaussian splats
ns-export gaussian-splat --load-config /path/to/outputs/config.yml \
  --output-dir /path/to/export
```

### 3.6 COLMAP for Structure-from-Motion (SfM)

**Paper:** Schönberger & Frahm, CVPR 2016. De facto standard SfM pipeline.

**Role in pipeline:**
1. Feature extraction (SIFT) from all input images
2. Feature matching across image pairs
3. Incremental SfM → sparse 3D point cloud + camera poses
4. Camera intrinsics recovered automatically
5. Optional: dense reconstruction via Multi-View Stereo (MVS)

**GIS integration:** COLMAP camera poses provide the EPSG:4326 anchor when drone GPS (EXIF) or GCPs are used. RTK-corrected GPS yields centimetre-level accuracy.

**Georeferencing path:**
```
COLMAP local frame → Similarity transform (local → ECEF/WGS84) 
                   → Apply as 3D Tiles tileset root transform
                   → CesiumJS renders in ECEF automatically
```

### 3.7 Rendering Performance Benchmarks

| Platform | Gaussians | Resolution | FPS | Confidence |
|----------|-----------|------------|-----|-----------|
| Native CUDA (RTX 3090) | 3M | 1080p | 100–200 | **High** (Kerbl et al. 2023) |
| WebGPU (Visionary platform) | 1–3M | 1080p | 30–60 | Medium (Visionary benchmarks) |
| WebGL (splat viewers) | 500K–1M | 1080p | 15–30 | Medium (community implementations) |
| NeRF (any method) | N/A | 1080p | <1 | **High** (requires neural inference) |

**Key quality benchmarks (from Kerbl et al. 2023):**

| Method | Training Time | PSNR (dB) | Rendering FPS |
|--------|--------------|----------|--------------|
| 3DGS (6 min) | 6 min | ~23.6 | 160+ |
| 3DGS (51 min) | 51 min | ~25.2 | 134+ |
| Mip-NeRF360 | 48 hours | ~24.9 | 0.07 |
| Instant-NGP | 5 min | ~21.8 | 9–15 |

### 3.8 CesiumJS & Standards Integration

**KHR_gaussian_splatting extension (Khronos, Feb 2026):**
- Status: **Release candidate** — not yet ratified
- Format: glTF 2.0 extension
- Collaborators: Khronos, OGC, Cesium/Bentley, Esri, Niantic, NVIDIA, Google, Adobe
- Companion: `KHR_gaussian_splatting_compression_spz_2` for efficient storage

**CesiumJS support:**
- v1.130.1: Experimental 3DGS support
- v1.131+: Stable support via `GaussianSplat3DTileContent`
- v1.134+: Bug fixes (flickering artifacts, sorting improvements)
- v1.139+: Full KHR_gaussian_splatting support

**Fallback format:** `.ply` (always support alongside glTF)

### 3.9 Urban-Scale Challenges

| Challenge | Mitigation |
|-----------|-----------|
| Scene too large for single 3DGS | Block decomposition (Block-NeRF strategy applied to 3DGS) |
| Dynamic objects (cars, pedestrians) | Transient object masking (Splatfacto-W) |
| Lighting variation (day/weather) | Appearance embeddings (Splatfacto-W, Block-NeRF) |
| Model too large for browser | Reduced 3DGS (27× size reduction via pruning + quantization) |
| POPIA: faces/license plates in captures | Blur/mask PII before training (mandatory) |
| Georeferencing accuracy | RTK GPS + 5+ GCPs with known WGS84 coordinates |

### 3.10 GaussCtrl — Post-Reconstruction Editing

**Paper:** Wu et al., "GaussCtrl: Multi-View Consistent Text-Driven 3D Gaussian Splatting Editing," ECCV 2024. arXiv:2403.08733. Oxford Active Vision Lab.

- Modifies existing 3DGS reconstructions using **text prompts**
- Renders images from 3DGS → edits via ControlNet diffusion → re-optimizes 3DGS
- Ensures multi-view consistency across all edited views
- **Use case for capegis:** "Add trees," "Change building facade," "Apply damage overlays"
- **Note:** This is an editing tool, NOT a reconstruction method

---

## 4. AI Content Labeling Requirements

### 4.1 Mandatory Specification (NON-NEGOTIABLE)

> Source: GIS_MASTER_CONTEXT.md §9 — This section CANNOT be disabled, overridden, or omitted by any agent, user, or tenant configuration.

Every AI-generated or AI-inferred geometry asset must carry:
1. **Programmatic metadata** (TypeScript/YAML schema)
2. **Visible, non-removable visual watermark** in the rendered scene

### 4.2 Mandatory Metadata Schema

```yaml
aiContentMetadata:
  isAiGenerated: true                          # ALWAYS true — this field only exists on AI assets
  generationMethod: "3dgs | nerf | controlnet | diffusion | hybrid"
  generationFramework: "splatfacto | instant-ngp | nerfacto | controlnet++"
  sourceImagesCount: integer                   # number of real input photos
  sourceImagesVerified: boolean                # human-verified provenance
  controlnetConditioning: string[]             # ["depth", "normal", "edge", ...]
  reconstructionDate: string                   # ISO 8601
  eventId: string                              # links to Event entity
  tenantId: string                             # multitenant isolation
  confidenceLevel: "low | medium | high"
  psnrScore: number | null
  ssimScore: number | null
  humanReviewed: boolean                       # MUST be true before professional evidence export
  displayWatermark: true                       # NEVER false — non-removable
  watermarkText: "⚠️ AI-reconstructed — not verified ground truth"
  watermarkPosition: "bottom-left"
  exportAllowed: boolean
  citationRequired: true
  citationTemplate: string                     # auto-generated, always present
```

### 4.3 Confidence Level Thresholds

| Level | PSNR | Source Images | Conditioning | Human Review Required |
|-------|------|---------------|-------------|----------------------|
| `low` | < 25 dB | < 8 | Single type | Before **ANY** professional use |
| `medium` | 25–30 dB | 8–20 | Multi-type | Before evidence/legal use |
| `high` | > 30 dB | > 20 | Multi-type + verified | Still strongly recommended |

**Source reliability scores (from confidence schema):**
```
AI-reconstructed (high PSNR):  0.65–0.75
AI-reconstructed (low PSNR):   0.30–0.50
Human-verified source photos:   0.85–0.95
User-uploaded GeoFile:          0.60–0.80
```

### 4.4 Professional Export Gate

```
humanReviewed: false → BLOCKS "Verified Evidence" export mode
```

This gate is **enforced at the platform export API level** — it is not a UI preference. It applies to:
- Journalism workflows
- Legal/insurance workflows
- Defense/investigation workflows

### 4.5 Watermarking Pattern

```typescript
// Component: AIWatermark.tsx
// Applied on every AI-generated 3D scene tile/asset
const AI_WATERMARK_STYLE = {
  position: 'absolute',
  bottom: '8px',
  left: '8px',
  padding: '4px 8px',
  backgroundColor: 'rgba(255, 200, 0, 0.85)',
  color: '#000',
  fontSize: '11px',
  fontWeight: 'bold',
  borderRadius: '3px',
  userSelect: 'none',
  pointerEvents: 'none',   // non-interactive
  zIndex: 9999,
};

// Watermark text: "⚠️ AI-reconstructed — not verified ground truth"
// Cannot be hidden by CSS override (inline style, not class-based)
```

### 4.6 Citation Export Pattern

**For researchers and academics (Domain 8):**
```
citationTemplate:
  "CapeTown GIS Hub. (${year}). AI-Reconstructed Scene: ${eventId}.
   Generated via ${generationFramework} (${generationMethod}).
   Source images: ${sourceImagesCount}. PSNR: ${psnrScore} dB.
   Human reviewed: ${humanReviewed}. Retrieved ${exportDate}.
   Tenant: ${tenantId}. [AI-generated — not verified ground truth]"
```

### 4.7 Storage Namespacing for AI Assets (Multitenant)

```
{BASE_PATH}/{tenantId}/{resourceId}/
  ├── model.ply                 # 3DGS Gaussian splats
  ├── model.glb                 # glTF export (KHR_gaussian_splatting)
  ├── tileset.json              # 3D Tiles manifest
  ├── metadata.json             # aiContentMetadata (full schema)
  └── preview.jpg               # Thumbnail with watermark baked in
```

### 4.8 Legal / Ethical Constraints

| Constraint | Source | Enforcement |
|-----------|--------|------------|
| AI imagery NOT for official cadastral use | CLAUDE.md Rule 8 | Hard block in export API |
| Faces/plates must be blurred before training | POPIA (CLAUDE.md Rule 5) | Pre-training validation step |
| Must not present AI imagery as photographic evidence | GIS_MASTER_CONTEXT §9 | Export gate + watermark |
| CoCT GV Roll 2022 is the only valuation source | CLAUDE.md Rule 8 | Data source badge enforcement |
| Data source badge mandatory on every display | CLAUDE.md Rule 1 | Badge component required |

**Applicable licenses:**
- Nerfstudio / 3DGS: Apache 2.0 / MIT
- ControlNet base models: CreativeML Open RAIL-M (no commercial redistribution without compliance)
- ControlNet++ / MVControl: Apache 2.0

---

## 5. Real-Time AI & Sensor Fusion

### 5.1 Overview

| Field | Value |
|-------|-------|
| **What it does** | Fuses multiple real-time sensor streams (ADS-B, AIS, IoT, satellite) into a unified spatial intelligence layer |
| **Primary inputs** | OpenSky ADS-B, maritime AIS, MQTT IoT streams, Sentinel-2 imagery, Supabase Realtime |
| **Key dependency** | Supabase (PostGIS + pgvector + Realtime), MobilityDB, MQTT broker |
| **Project phase** | Phase 3+ (M10+) — "Hold for Phase 3; build static map first" |
| **Confidence** | High (individual components); Medium (integrated pipeline) |

### 5.2 Spatial RAG — The 2026 GeoAI Paradigm

The field has moved from "where is it?" to **Spatial RAG (Retrieval-Augmented Generation)**: combining PostGIS spatial context with `pgvector` semantic intelligence.

```sql
-- pgvector: stored alongside geometry in Supabase
-- "Find properties that look like this one" in a single SQL statement
SELECT p.*, embedding <=> $query_embedding AS similarity
FROM parcels p
WHERE ST_DWithin(p.geom::geography, $reference_geom::geography, 2000)
ORDER BY similarity ASC
LIMIT 20;
```

**Stack:** Supabase (PostGIS + pgvector) — one database for both maps and AI. No separate vector DB needed.

### 5.3 MobilityDB — Trajectory Intelligence

**MobilityDB** (built on PostGIS) handles moving object trajectories:
- Stores one "trajectory" object instead of thousands of GPS points
- Enables blazingly fast spatiotemporal queries
- **Cape Town use case:** Track MyCiTi bus fleet, emergency vehicles, delivery logistics

```sql
-- Example: Find all buses within 100m of a property between 14:00–15:00
SELECT b.vehicle_id, b.trajectory
FROM buses b
WHERE ST_DWithin(
  valueAtTimestamp(b.trajectory, now()::timestamp)::geography,
  (SELECT geom FROM parcels WHERE id = $parcel_id)::geography,
  100
)
AND b.trajectory && period('[2024-01-15 14:00, 2024-01-15 15:00]');
```

### 5.4 Edge AI for Field Devices

| Capability | Description | Framework | Confidence |
|-----------|-------------|-----------|-----------|
| **Offline inference** | Run AI models on field devices without connectivity | ONNX Runtime (mobile), TensorFlow Lite | High |
| **On-device object detection** | Identify building damage, vegetation, infrastructure faults | YOLOv8 Mobile, EfficientDet | High |
| **Local tile serving** | PMTiles from device storage (offline PWA) | PMTiles + Serwist service worker | High |
| **Sync on reconnect** | Upload field observations once connectivity restored | Supabase Realtime queue | Medium |

**capegis integration:** Serwist service worker + Dexie.js (IndexedDB) provide the offline storage layer. ONNX Runtime can be bundled as WASM for browser-based edge inference without native installation.

### 5.5 NDVI Change Detection (Sentinel-2 + ML)

**Use case:** Detect vegetation loss, crop damage, wildfire spread in the Western Cape.

```
Pipeline:
Sentinel-2 → NDVI calculation → Temporal diff → Anomaly detection model
                                                → Alert if ΔNDVI > threshold
                                                → Classify: harvest vs drought vs fire
```

**NDVI formula:**
```
NDVI = (NIR - Red) / (NIR + Red)
     = (Band 8 - Band 4) / (Band 8 + Band 4)    [Sentinel-2]
```

| NDVI Range | Interpretation |
|-----------|---------------|
| < 0.1 | Bare soil, rock, water |
| 0.1–0.3 | Sparse vegetation |
| 0.3–0.6 | Moderate vegetation |
| > 0.6 | Dense healthy vegetation |

**ML approach:** Train a change-detection classifier (Random Forest / CNN) on labelled Sentinel-2 time series to distinguish harvest from drought from wildfire. Feed alerts into the `events` table with `eventType: "environmental_change"`.

**Domain 11 (Farmers/Agronomists):** The classic Ralph question: "What if the brown fields are just harvest, not drought?" → Temporal context + phenology calendar + weather cross-validation before alerting.

**Confidence: Medium** — Sentinel-2 is free and well-established; the ML classification pipeline is proven in research but needs Cape Town / Western Cape training data.

### 5.6 Anomaly Detection in ADS-B / AIS Streams

**ADS-B (aircraft):**
- **Squawk codes 7700/7600/7500**: automatic emergency flags → trigger NeRF/3DGS reconstruction event
- **Speed anomalies**: rapid deceleration, altitude deviation from filed plan
- **Airspace intrusion**: detect when trajectories enter restricted zones

```typescript
// Event trigger: OpenSky trajectory intersects event bounding box
// TRIGGER → 3DGS reconstruction pipeline starts automatically
Flight --[trajectory_intersects]--> Event.boundingBox → isReconstructed = true
```

**AIS (maritime):**
- Ships disappearing into coverage gaps → correlate with known AIS blind spots
- Unusual anchorage or speed patterns near Cape Town harbour
- **Reference:** "Using LLMs for Analyzing AIS Data" (Merten et al., IEEE MARIS 2025)

**Anomaly detection approaches:**
1. **Rule-based (Phase 1):** Threshold triggers (squawk code, speed limit, zone crossing)
2. **Statistical (Phase 2):** Z-score on trajectory segments vs historical baselines
3. **ML-based (Phase 3+):** LSTM/Transformer trained on normal trajectory patterns → flag deviations

### 5.7 Predictive Spatial Modeling Concepts

| Model | What It Predicts | Inputs | Confidence |
|-------|-----------------|--------|-----------|
| **Activity Heatmap** | Foot traffic density by time-of-day | Anonymized movement data, OSM, transit feeds | Medium |
| **Flood risk propagation** | Flood extent given rainfall levels | Elevation (DSM), drainage network, rainfall data | Medium |
| **Wildfire spread** | Fire progression over time | FIRMS hotspots, wind, vegetation (NDVI), terrain | Medium |
| **Property value shift** | Predicted price change from proximity to development | CoCT GV Roll, zoning, infrastructure proximity | Speculative |
| **Crime heatmap** | Predicted crime density shifts | Historical incidents, lighting, transit, demographics | Speculative (POPIA) |

**Domain 4 (Environmental Scientists) use case:** 72-hour flood evolution from satellite data. Sentinel-2 + FIRMS + weather APIs + elevation model → predict inundation extent.

### 5.8 Real-Time Architecture Pattern (Next.js 15 + Supabase Realtime)

```typescript
// Subscribing to real-time vehicle position updates
const channel = supabase.channel('realtime:vehicles')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'trajectories'
  }, payload => {
    updateMaplibreMarker(payload.new);
  })
  .subscribe();

// Cleanup on unmount
return () => { supabase.removeChannel(channel); };
```

**Scalability note:** MobilityDB + Kafka/Flink can scale to millions of events per second. Standard Supabase Postgres may be overwhelmed by high-throughput streams — partition by tenant + time range.

---

## 6. Emerging Spatial AI Patterns

### 6.1 Foundation Models for Geospatial Data

| Model / System | What It Is | Status | Confidence |
|---------------|-----------|--------|-----------|
| **GeoGPT / LLM-Geo** | LLM with spatial reasoning, autonomous GIS | Research (Penn State, 2023+) | High |
| **Skyfall-GS** | Satellite imagery → explorable 3D urban scenes via 3DGS + FLUX diffusion | ICLR 2026 | High |
| **SpatialOS** (Bilawal Sidhu) | Continuously updating world model, queryable by AI agents | Stated intent (not shipped) | Speculative |
| **Block-NeRF** | City-scale NeRF with temporal block-by-block updates | Production at Waymo/Google | High |
| **Atlas Navi** | Commercial AI that builds maps from conversation | Shipping SaaS | High |
| **Esri ArcGIS AI Assistants** | Role-scoped NL assistants in ArcGIS Pro/Online | Shipping beta (Feb 2026) | High |

**Emerging concept: Spatial RAG (2026)**
> Organizations in 2026 are combining spatial context (PostGIS geometries) with semantic intelligence (pgvector embeddings). "Find properties that look like this one" can be answered with a single PostGIS + pgvector SQL query.

### 6.2 Vector Embeddings for Spatial Search

**pgvector integration with PostGIS:**
```sql
-- Store embedding alongside geometry
ALTER TABLE parcels ADD COLUMN embedding vector(1536);

-- Semantic + spatial combined search
SELECT p.id, p.address, p.embedding <=> $query_embedding AS similarity
FROM parcels p
WHERE ST_DWithin(p.geom::geography, ST_SetSRID(ST_MakePoint(18.42, -33.93), 4326)::geography, 1000)
  AND p.tenant_id = current_setting('app.current_tenant')::uuid
ORDER BY similarity
LIMIT 20;
```

**Use cases:**
- "Find properties similar to this one" (embedding similarity)
- Semantic search over property descriptions + spatial proximity
- Cluster parcels by semantic + spatial co-occurrence
- Hybrid search: keyword full-text + embedding semantic + spatial bounding box

### 6.3 Multimodal Inputs (Image + Coordinates + Text)

**Inputs that can be fused in 2026:**

| Input Type | Format | AI Processing |
|-----------|--------|--------------|
| **Text** | NL query | LLM intent parsing → tool call |
| **Coordinates** | GPS lat/lng, bounding box | Spatial tool parameter |
| **Satellite image** | Sentinel-2 bands (GeoTIFF) | CNN/ControlNet conditioning |
| **Street-level photo** | JPEG + EXIF GPS | 3DGS reconstruction input |
| **Drone imagery** | Geotagged JPEG/RAW | COLMAP SfM + Splatfacto |
| **Vector layer** | GeoJSON / GeoPackage | PostGIS query context |
| **Time** | ISO 8601 timestamp | Temporal filtering |

**Fusion pipeline example (event reconstruction trigger):**
```
OpenSky ADS-B trajectory (coordinates + time)
   + Street View archive images (image + coordinates)
   + Google 3D Tiles depth render (depth map)
   + Text prompt ("reconstruct incident scene at 14:32")
→ ControlNet conditioning (depth + pose)
→ Novel view synthesis (8–16 views)
→ Splatfacto 3DGS training
→ CesiumJS 4D playback
```

### 6.4 Skyfall-GS — Satellite-Only 3D Reconstruction

**Paper:** ICLR 2026 (Bilawal Sidhu highlighted as key breakthrough)

- **Input:** Multi-view satellite imagery (NO ground-level photos needed)
- **Method:** Trains 3DGS on satellite views; uses FLUX diffusion model to fix ground-level artifacts via "curriculum-driven iterative refinement"
- **Output:** Real-time navigable 3D city models
- **Significance:** First city-block scale 3D scene creation from satellite imagery alone
- **capegis relevance:** Could enable city-wide digital twin updates using freely available satellite data without drone captures

**Confidence: High** (published ICLR 2026); production viability is **speculative** (early research).

### 6.5 InstantSplat++ — Pose-Free Sparse Reconstruction

- Sparse-view 3DGS in seconds (vs 15–45 min for Splatfacto)
- Built on MASt3R for pose-free reconstruction (no COLMAP needed)
- Supports 3D-GS, 2D-GS, and Mip-Splatting
- Input: as few as 2–12 images
- **capegis relevance:** Could dramatically reduce field capture requirements for event reconstruction

**Confidence: High** (2026 paper); production integration is **speculative**.

### 6.6 GeoFlow Graphs (Spatial-Agent, 2025)

**Paper:** Bao et al., "Spatial-Agent," arXiv:2601.16965

- Represents geo-analytical queries as **DAGs** (Directed Acyclic Graphs) where:
  - Nodes = spatial concepts (place, buffer, intersection, aggregation)
  - Edges = spatial transformations
- Grounds LLM reasoning in spatial information theory
- Enables structured decomposition of complex multi-step spatial analyses
- More deterministic than open-ended agent loops

**Relevance:** Provides a theoretical framework for structuring the capegis GIS Copilot's multi-step query execution.

### 6.7 WorldView Dashboard Pattern (Spatialintelligence.ai)

**Key architectural concepts from Bilawal Sidhu's WorldView:**

| Concept | Description | capegis Relevance |
|---------|-------------|-------------------|
| Multi-sensor fusion | Layer 6+ live data feeds on same spatiotemporal timeline | Zoning + cadastral + traffic + weather + aircraft |
| Temporal scrubbing | Time-based playback of events | 4DGS event replay (M11+) |
| Dark-theme HUD | Military-aesthetic shaders (NVG, FLIR, CRT) | Dark dashboard mandate |
| "Sousveillance" model | Public data made accessible to all citizens | Open-data GIS mission |
| Google 3D Tiles as base | Photorealistic foundation, everything layered on top | CesiumJS integration planned |
| AI agent swarm development | 8+ agents working simultaneously on subsystems | Matches capegis fleet architecture |

---

## 7. Master Summary Table

| Innovation | What It Does | Phase | Confidence | Key Dependency |
|-----------|-------------|-------|-----------|----------------|
| **NL→Spatial (tool-calling)** | NL queries → parameterized PostGIS tools | Phase 1 (M6) | High | LLM API, Supabase |
| **NL→Spatial (agent)** | Complex multi-step spatial reasoning | Phase 2 (M10) | Medium | LLM API, tool registry |
| **Cape Town Gazetteer** | Local place name geocoding | Phase 1 (M6) | High | Supabase |
| **ControlNet (base)** | Geometry-conditioned image generation | Phase 2 (M5 prototype) | High | GPU, Stable Diffusion |
| **ControlNet++** | Improved depth/normal consistency | Phase 2+ | Medium | GPU, ControlNet++ |
| **MVControl** | Multi-view consistent 3D generation | Phase 3+ (M11) | Medium | GPU, MVDream |
| **ControlCity** | GIS data → photorealistic aerial | Phase 2+ | Medium | GPU |
| **GPS2Pix** | GPS-conditioned neighborhood generation | Phase 3+ | Medium | GPU, training data |
| **Splatfacto (3DGS)** | Photorealistic 3D from drone images | Phase 2 (M5 proto) | High | GPU, COLMAP, Nerfstudio |
| **Instant-NGP** | Seconds-training NeRF for rapid preview | Phase 2 (M5) | High | NVIDIA GPU |
| **Block-NeRF approach** | City-scale block decomposition | Phase 3+ | Medium | GPU cluster |
| **GaussCtrl** | Text-driven 3DGS editing | Phase 3+ | High | GPU, pre-trained 3DGS |
| **AI Content Labels** | Mandatory watermark + metadata | ALL phases | High | Platform enforcement |
| **Spatial RAG** | PostGIS + pgvector semantic search | Phase 2 (M8) | High | Supabase + pgvector |
| **MobilityDB** | Moving object trajectory queries | Phase 3 (M10) | High | Supabase extension |
| **NDVI change detection** | Sentinel-2 vegetation anomalies | Phase 2+ | Medium | Sentinel-2 API, ML model |
| **ADS-B anomaly detection** | OpenSky flight anomaly alerts | Phase 2 (M8) | Medium | OpenSky Network |
| **AIS anomaly detection** | Maritime AIS anomaly detection | Phase 3+ | Medium | AIS data feed |
| **Skyfall-GS** | Satellite-only 3D city reconstruction | Phase 3+ speculative | Medium | ICLR 2026 research |
| **InstantSplat++** | Pose-free sparse 3DGS in seconds | Phase 3+ speculative | Medium | 2026 research |
| **GeoFlow Graphs** | Structured multi-step spatial reasoning | Phase 2 (M10) | Medium | LLM integration |
| **Multimodal fusion** | Image + coordinates + text → insight | Phase 3+ | Speculative | Multi-model pipeline |
| **Edge AI (offline)** | On-device inference for field work | Phase 2+ | Medium | ONNX Runtime WASM |

---

## Appendix A — Key Papers Reference

| Paper | Authors | Venue | Topic |
|-------|---------|-------|-------|
| "3D Gaussian Splatting for Real-Time Radiance Field Rendering" | Kerbl et al. | SIGGRAPH 2023 | 3DGS (Best Paper) |
| "Instant Neural Graphics Primitives with a Multiresolution Hash Encoding" | Müller et al. | SIGGRAPH 2022 | Instant-NGP |
| "Adding Conditional Control to Text-to-Image Diffusion Models" | Zhang et al. | ICCV 2023 | ControlNet |
| "ControlNet++: Improving Conditional Controls with Efficient Consistency Feedback" | Li et al. | ECCV 2024 | ControlNet++ |
| "MVControl: Adding Conditional Control to Multi-view Diffusion" | Li et al. | ECCV 2024 | MVControl |
| "GaussCtrl: Multi-View Consistent Text-Driven 3D Gaussian Splatting Editing" | Wu et al. | ECCV 2024 | 3DGS editing |
| "Block-NeRF: Scalable Large Scene Neural View Synthesis" | Tancik et al. | CVPR 2022 | City-scale NeRF |
| "GIS Copilot: Towards an Autonomous GIS Agent for Spatial Analysis" | Akinboyewa et al. | Int. J. Digital Earth 2025 | NL→GIS |
| "GeoSQL-Eval: Automated evaluation of LLMs on PostGIS queries" | Hou et al. | arXiv:2509.25264 | NL→PostGIS benchmark |
| "MapAgent: Hierarchical Agent for Geospatial Reasoning" | Hasan et al. | arXiv:2509.05933 | Multi-agent GIS |
| "GPS as a Control Signal for Image Generation" | Feng et al. | CVPR 2025 | GPS2Pix |
| "ControlCity: Multimodal Diffusion for Geospatial Generation" | Zhou et al. | arXiv:2409.17049 | GIS-specific ControlNet |
| "ReconFusion: 3D Reconstruction with Diffusion Priors" | Wu et al. | CVPR 2024 | Sparse-view reconstruction |
| "Splatfacto-W: Nerfstudio Gaussian Splatting for Unconstrained Photos" | Xu et al. | arXiv:2407.12306 | Splatfacto |
| "Bridging natural language and GIS: multi-agent framework" | Mansourian & Oucheikh | Int. J. Digital Earth 2026 | Multi-agent GIS |
| "Are Your LLM Text-to-SQL Models Secure?" | Lin et al. | SIGMOD 2025 | SQL injection via LLMs |

---

## Appendix B — Confidence Key

| Level | Meaning |
|-------|---------|
| **High** | Peer-reviewed publication, verified implementation, or official product documentation |
| **Medium** | Published preprint or early-stage implementation; plausible but not independently validated |
| **Speculative** | Stated intent, extrapolation, or concept without published results |

---

*Generated by AGENT C — Spatial AI Innovator | CapeTown GIS Hub v2.0 | 2026-03-05*
