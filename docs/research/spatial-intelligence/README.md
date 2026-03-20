# Spatial Intelligence Research — Master Summary

> **TL;DR:** Synthesis of 3,347 lines across 4 agent outputs. 10 cross-cutting insights emerged: CesiumJS is inevitable but sequenced (Phase 2 gate), AI content labeling is non-negotiable, OpenSky is highest-value/highest-risk integration, Google 3D Tiles CT coverage is unverified, three-tier fallback is a platform invariant, SA CRS complexity is under-estimated (7 EPSG codes), NL→Spatial is the force multiplier. 3 confirmed red flags: CesiumJS vs MapLibre mandate, OpenSky licensing, GV Roll POPIA classification.
>
> **Roadmap Relevance:** M0–M15 — master research synthesis. RF1/RF2/RF3 are blocking unknowns that must be resolved before Phase 2.

> **Produced by:** Consolidation Agent (orchestrator synthesis)
> **Date:** 2026-03-06
> **Source files:** 4 agent outputs, 3 347 lines of research across 9 upstream documents
> **Scope:** CapeTown GIS Hub (`capegis`) — City of Cape Town + Western Cape only

---

## Table of Contents

1. [Fleet Overview](#1-fleet-overview)
2. [Cross-Cutting Insights](#2-cross-cutting-insights)
3. [Red Flags from Research](#3-red-flags-from-research)
4. [Phased Implementation Roadmap](#4-phased-implementation-roadmap)
5. [Quick Reference Index](#5-quick-reference-index)

---

## 1. Fleet Overview

| Agent | Output File | Lines | One-Sentence Summary |
|-------|-------------|------:|----------------------|
| **A — GIS Feature Extractor** | `gis-features.md` | 732 | Catalogues every spatial primitive, CRS rule, tile format, and layer architecture constraint needed to build capegis correctly, sourced across 9 research documents. |
| **B — WorldView Analyst** | `worldview-patterns.md` | 964 | Reverse-engineers spatialintelligence.ai's WorldView platform into actionable patterns for capegis, including a rigorous CesiumJS-vs-MapLibre conflict analysis with a two-phase resolution path. |
| **C — Spatial AI Innovator** | `spatial-ai-innovations.md` | 956 | Catalogues 23 AI innovations from NL-to-PostGIS querying to 3D Gaussian Splatting, each with phase assignment, confidence level, and key dependency. |
| **D — Domain Synthesizer** | `domain-extensions.md` | 695 | Cross-references 11 user domains against the current milestone plan, exposing 12 missing data sources, 15 missing features, and 8 missing integrations. |
| **Total** | — | **3 347** | — |

---

## 2. Cross-Cutting Insights

These insights emerge only when all four outputs are read together.

### I1 — CesiumJS Is Inevitable, But Sequenced
Agents A, B, C, and D all reference CesiumJS for 3D Tiles, 3DGS rendering, CZML animation, and temporal replay. Agent B documents the conflict with the current CLAUDE.md MapLibre mandate explicitly. The cross-agent consensus is a **phased hybrid architecture**: MapLibre owns Phase 1 entirely; CesiumJS enters in Phase 2 after a `docs/PLAN_DEVIATIONS.md` entry and human approval. No agent recommends workarounds.

### I2 — AI Content Labeling Is Non-Negotiable for All Domains
Agent C identifies mandatory `aiContentMetadata` watermarking. Agent D confirms this must gate **every AI feature across all 11 domains** — not just 3DGS. The watermark component (non-removable, pointer-events: none) must be built in Phase 1 before any AI capability is enabled. All four agents treat this as a hard dependency.

### I3 — OpenSky Is Both the Highest-Value and Highest-Risk Integration
Agents B, C, and D all identify OpenSky ADS-B as enabling 5 domains simultaneously (Aviation, Journalists, Emergency, Logistics, Defense). Agent D marks commercial licensing as a **blocking unknown** (KU2). Agent B flags the same. Agent A provides the zoom-gated MapLibre layer pattern to implement it. The risk-to-reward ratio is high enough that the licensing question must be resolved before any OpenSky code is written.

### I4 — Google 3D Tiles Cape Town Coverage Is Unverified and Blocks the 3D Strategy
Agents A, B, and D all list this as their highest-impact unknown. Agent B rates its confidence as `UNVERIFIED`. Without confirmed street-level photorealistic tile coverage of Cape Town, the CesiumJS 3D globe strategy (Phase 2) has no guaranteed foundation. A single API test call to the Google Maps Tile API resolves this — it should be the first action when Phase 2 begins.

### I5 — The Three-Tier Fallback Pattern Is Architecturally Universal
Every data layer described across all four agents requires `LIVE → CACHED → MOCK`. Agent A defines the Martin MVT / GeoJSON serving pattern. Agent B maps it to WorldView's implicit design. Agent C requires it for real-time AI sensor fusion. Agent D requires it for all 11 domain dashboards. The pattern is not a feature — it is a platform invariant.

### I6 — South African CRS Complexity Is Systematically Under-Estimated
Agent A identifies 7 EPSG codes in active use in Western Cape data (4326, 3857, 22279, 2053, 2046, 2048, 4148). Agent D identifies CRS auto-detection as a missing feature blocking 7 of 11 domains. Agents B and C assume 4326 storage throughout but do not address the Lo19 transformation problem for raw CoCT datasets. The GeoFile upload pipeline (Domain Extension MT1) must include CRS auto-detection as a first-class feature.

### I7 — The NL→Spatial Agent Is the Force Multiplier for All Professional Domains
Agent C rates NL-to-PostGIS (tool-calling approach) at TRL 5–7 and marks it Phase 2 (M10). Agent D identifies it as enabling all professional domains (VIEWER+). Agent B notes that LiteLLM proxy → Claude is already architecturally defined in `GIS_MASTER_CONTEXT.md §5.2`. Critically, Agent C cites a SIGMOD 2025 paper showing tool-calling is safer than raw SQL generation — the parameterized tool approach is both the right UX and the right security posture.

### I8 — POPIA Creates Distinct Bright Lines Across Domains
Agent D maps POPIA risk to specific domains: citizen location data (Domain 10), GV Roll owner names (Domain 7), OSINT subject tracking (Domain 3). Agent C's AI labeling section adds the human-review gate before any AI output enters a legal or insurance context. Agent B excludes CCTV integration explicitly (POPIA). These constraints are not optional — they determine which features can be built at all.

### I9 — The 11-Domain Architecture Requires Domain-Specific Dashboard Modes
Agent D documents 11 user domains each with distinct data needs, RBAC levels, and export requirements. Agent B's visualization mode switching concept (Standard/Analysis/Comparison/Presentation) maps onto this. Agent C's AI features activate at different RBAC levels. None of this is reflected in the current milestone plan (M0–M15). Domain-specific dashboard modes represent the largest unplanned work surface.

### I10 — Performance Budget for SA Mobile Is an Unresolved Risk
Agent D lists SA mobile performance (5 Mbps, KU10) as a partially-known unknown. Agent A's 10 000-feature threshold and PMTiles offline strategy directly address this. Agent B flags CesiumJS as heavy for mobile (⚠️). Agent C's edge AI / ONNX Runtime WASM pattern exists precisely to address offline inference for field users. The SA market reality (load-shedding, variable connectivity) makes this a first-class constraint, not an afterthought.

---

## 3. Red Flags from Research

### 🔴 Confirmed Conflicts

| # | Red Flag | Source Agents | Impact |
|---|----------|---------------|--------|
| RF1 | **CesiumJS vs MapLibre mandate** — CLAUDE.md explicitly requires MapLibre only; CesiumJS is required by WorldView patterns, 3DGS rendering, CZML, and Google 3D Tiles | A, B, C, D | Blocks all Phase 2+ 3D features until human approves DEV entry |
| RF2 | **OpenSky commercial licensing unverified** — Platform assumes OpenSky ADS-B use in multi-tenant SaaS without confirmed license | B, D | Blocks 5 domains; legal risk if implemented before resolution |
| RF3 | **GV Roll POPIA classification unclear** — Does the public GV Roll contain personal data (owner names)? Blocks M6 implementation | D | Legal review required before any valuation data displayed |

### 🟠 Speculative Data Sources

| Data Source | Issue | Agent |
|-------------|-------|-------|
| WCG Spatial Data Warehouse | URL not verified accessible (`gis.westerncape.gov.za/server2/rest/services/…`) | D |
| SANBI BGIS | No research, no format evaluation, no licensing | D |
| South African Weather Service (SAWS) | No API evaluation; referenced only implicitly | D |
| Google 3D Tiles (Cape Town coverage) | Coverage at street level not confirmed — needs API test | A, B, D |
| Cesium ion direct PLY upload | Community discussion only; no confirmed workflow (March 2026) | B |

### 🟠 Missing Implementations (in current PLAN.md)

| Gap | Blocking |
|-----|---------|
| AI content watermark component | All AI features — **must exist first** |
| Data source badge component | CLAUDE.md Rule 1 — **must exist before any data layer** |
| CRS auto-detection pipeline | Blocks GeoFile upload for 7 of 11 domains |
| GeoFile upload pipeline | Blocks Farmers, Environmental, Urban Planners, Academics |
| OpenSky ADS-B layer | Blocks Aviation, Journalists, Emergency, Logistics, Defense |
| pgvector / Spatial RAG | Blocks NL→Spatial agent (Phase 2) |
| MCP server definitions | 5 required servers defined in `GIS_MASTER_CONTEXT.md §5.3`; zero milestones |
| WCAG 2.1 AA accessibility | Referenced in research; no milestone |

### 🟡 AI Hallucination Risks

| Risk | Mitigation |
|------|-----------|
| NL→SQL injection via LLM-generated queries | Use parameterized tool-calling only (never raw SQL generation) — confirmed by SIGMOD 2025 |
| 3DGS / NeRF output misrepresented as photographs | Non-removable watermark + `humanReviewed: false` export gate (mandatory) |
| Speculative Phase 3 items (Skyfall-GS, InstantSplat++) presented as production-ready | Agent C marks these explicitly as `Speculative` confidence level — do not schedule |
| KHR_gaussian_splatting presented as ratified | RC published Feb 3, 2026; full ratification expected Q2 2026 — PLY fallback required |

---

## 4. Phased Implementation Roadmap

### Phase 1 — NOW (MapLibre, No CesiumJS)

Build these with confidence today. No library additions required.

| Item | What | Domain Impact |
|------|------|---------------|
| **Data source badge** | Stateless React component: `[SOURCE · YEAR · LIVE\|CACHED\|MOCK]` | All domains (Rule 1) |
| **AI content watermark** | Non-removable overlay on any AI-generated map content | All AI features |
| **Three-tier fallback hook** | `useLiveData()` with LIVE→CACHED→MOCK pattern | All data layers |
| **MapLibre dark dashboard** | Near-black basemap, CARTO attribution, layer Z-order | Core platform |
| **Zoom-gated layers** | Cadastral ≥ 14, Zoning ≥ 10, Suburbs ≥ 8 | Platform correctness |
| **Browser geolocation button** | `getCurrentPosition()` + reverse geocode to suburb | Citizens (Domain 10) |
| **OpenSky ADS-B (2D, MapLibre)** | GeoJSON source + rotated icon layer, 30s poll, mock fallback | Aviation, Journalists |
| **Cape Town Gazetteer** | Local place-name geocoding against PostGIS | NL→Spatial (Phase 2 prep) |
| **CRS auto-detection** | proj4js with SA EPSG codes pre-loaded | GeoFile upload (Phase 2 prep) |
| **Progressive layer loading** | `addSource()` / `addLayer()` on viewport entry | Mobile performance |

### Phase 2 — After Human Approval (CesiumJS + Live Integrations)

Requires: DEV entry in `docs/PLAN_DEVIATIONS.md`, human sign-off, OpenSky license confirmed.

| Item | What | Key Dependency |
|------|------|----------------|
| **CesiumJS introduction** | Add as optional 3D viewer; MapLibre remains default | DEV-NNN human approval |
| **Google Photorealistic 3D Tiles** | Table Mountain, V&A Waterfront, CBD 3D view | Verify CT coverage first |
| **GeoFile upload pipeline** | Shapefile, GeoPackage, GeoJSON, KML, GeoTIFF + GDAL server-side | Node.js GDAL bindings |
| **OpenSky ADS-B (3D CZML)** | Full 3D aircraft entities with velocity orientation | OpenSky commercial license |
| **Sentinel-2 NDVI layer** | ESA Copernicus API + NDVI band math + COG rendering | Free API; no licensing blocker |
| **Spatial RAG (pgvector)** | Semantic PostGIS search via Supabase pgvector extension | Confirmed available in Supabase |
| **NL→Spatial (tool-calling, Phase 1)** | 6 parameterized PostGIS tools via LiteLLM proxy | LiteLLM + Claude API |
| **Maritime AIS layer** | Port of Cape Town Table Bay (aggregate only) | AIS data feed evaluation |
| **CZML temporal scrubbing** | Time slider → CesiumJS clock → entity animation | CesiumJS Phase 2 gate |

### Phase 3 — Visionary (R&D, No Current Milestone)

Do not schedule until Phase 2 is complete and validated.

| Item | What | TRL |
|------|------|-----|
| **4D WorldView Event Replay** | CesiumJS globe + 3DGS scenes + CZML + time scrubbing per domain scenario | 3–4 |
| **GIS Copilot (NL→Spatial agent)** | Multi-step spatial reasoning agent with 15 PostGIS tools, GeoFlow graph | 5–7 |
| **3DGS Reconstruction Pipeline** | Drone images → COLMAP → Splatfacto → PLY → Cesium ion → KHR_gaussian_splatting | 6–7 |
| **Block-NeRF city-scale NeRF** | Full Cape Town CBD photorealistic neural scene | 4–5 |
| **Multimodal spatial fusion** | Image + coordinates + text → insight via multi-model pipeline | Speculative |
| **Edge AI (offline inference)** | ONNX Runtime WASM for field-work offline spatial queries | 6 |
| **Domain-specific 4D dashboards** | Per-domain temporal scenarios for all 11 domains | Visionary |

---

## 5. Quick Reference Index

### [`gis-features.md`](gis-features.md) — Agent A · 732 lines

- **CRS pipeline:** Store in EPSG:4326, render in EPSG:3857, transform Lo19 (EPSG:22279) via `ST_Transform` or proj4js before use; 7 EPSG codes catalogued.
- **Feature thresholds:** < 5 000 → GeoJSON direct; ≤ 10 000 → viewport-clipped GeoJSON; > 10 000 → Martin MVT mandatory.
- **Layer Z-order (top→bottom):** User Draw → Risk Overlays → Zoning → Cadastral → Suburbs → Transport → Basemap; Cadastral zoom-gated at ≥ 14.

---

### [`worldview-patterns.md`](worldview-patterns.md) — Agent B · 964 lines

- **Stack conflict documented:** CesiumJS is required by WorldView patterns but prohibited by CLAUDE.md until human approval; two-phase resolution is the only architecturally sound path.
- **Phase 1 adaptations ready:** Dark dashboard, OpenSky 2D icon layer, data source badges, three-tier fallback, progressive loading, and mode-switching concept all implementable in MapLibre today.
- **Key unknowns:** Google 3D Tiles Cape Town coverage `UNVERIFIED`; OpenSky commercial licensing `UNVERIFIED`; CesiumJS bundle size (~30–50 MB) is a real mobile PWA risk.

---

### [`spatial-ai-innovations.md`](spatial-ai-innovations.md) — Agent C · 956 lines

- **NL→Spatial safety:** Parameterized tool-calling (not raw SQL generation) is the correct approach — confirmed safe by SIGMOD 2025; Cape Town bbox validation on all generated geometries.
- **3DGS pipeline validated:** Splatfacto (Nerfstudio) + COLMAP + Cesium ion is TRL 7; `KHR_gaussian_splatting` Khronos RC published Feb 3, 2026 — PLY fallback required until ratification.
- **AI labeling is mandatory:** Every AI output (ControlNet, 3DGS, NeRF, NL-query) must carry `aiContentMetadata` + non-removable visual watermark + `humanReviewed` export gate.

---

### [`domain-extensions.md`](domain-extensions.md) — Agent D · 695 lines

- **11 domains, 15 missing features:** Domain-specific dashboard modes, temporal scrubbing, GeoFile upload, citation export, and spatial copilot chat are all absent from the current milestone plan.
- **Quick wins for Phase 1:** AI watermark component, data source badge, and browser geolocation button each require < 1 sprint and unlock multiple domains immediately.
- **Ethical bright lines:** Individual ADS-B tracking prohibited; CCTV excluded (POPIA); GV Roll POPIA classification must be legally confirmed before M6; OpenSky pattern-of-life on aggregate only.

---

*Master summary compiled from 3 347 lines across 4 agent outputs.*
*All unverified claims retain their `[UNVERIFIED]` status from source agents — this document does not promote speculative findings to confirmed status.*
*Next action: resolve RF1 (CesiumJS DEV entry), RF2 (OpenSky license), and run Google 3D Tiles Cape Town API test.*
