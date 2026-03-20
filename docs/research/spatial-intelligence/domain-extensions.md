# Domain Extensions — Cross-Reference Synthesis

> **TL;DR:** Cross-references 11 user domains against the current milestone plan, exposing 12 missing data sources, 15 missing features, and 8 missing integrations. Quick wins for Phase 1: AI watermark component, data source badge, and browser geolocation button (<1 sprint each). Ethical bright lines: individual ADS-B tracking prohibited, CCTV excluded (POPIA), GV Roll POPIA classification must be legally confirmed.
>
> **Roadmap Relevance:** M3–M15 — gap analysis. Identifies unplanned work across all 11 domains. Domain-specific dashboard modes represent the largest unplanned work surface.

> **AGENT D — Domain Synthesizer**
> Generated: 2026-03-05
> Source: Cross-reference of GIS_MASTER_CONTEXT.md against 7 research reports
> Output: `docs/research/spatial-intelligence/domain-extensions.md`

---

## ⚠️ Agent Constraint Notice

This document was produced by **AGENT D** running in parallel with AGENTS A, B, and C.
At the time of writing, the output files from those agents do **not yet exist**.
Cross-referencing was therefore performed directly against the **source research files**
listed below — NOT against peer-agent outputs:

- `docs/context/GIS_MASTER_CONTEXT.md` (primary reference — 1208 lines)
- `docs/research/spatialintelligence-research.md`
- `docs/research/gis-platform-synthesis.md`
- `docs/research/08_Executive_Summary_Recommendations.md`
- `docs/research/07_Multitenancy_Access_Views_ArcGIS_Hub.md`
- `docs/RESEARCH_BRIEF.md`
- `docs/research/gis-file-formats-research.md`
- `docs/research/verification_report.md`

All claims are sourced from the above files. Inter-agent synthesis should be
revisited by `@orchestrator` once AGENTS A, B, and C have completed their outputs.

---

## Table of Contents

1. [Part 1 — The 11 User Domains](#part-1--the-11-user-domains)
2. [Part 2 — Gap Analysis](#part-2--gap-analysis)
3. [Part 3 — Domain Extension Recommendations](#part-3--domain-extension-recommendations)
4. [Part 4 — Knowledge Confidence Matrix](#part-4--knowledge-confidence-matrix)
5. [Known Unknowns](#known-unknowns)
6. [Ethical Use & Compliance](#ethical-use--compliance)

---

## Part 1 — The 11 User Domains

> **Ralph Question:** *"Why do we need 11 different kinds of users? Can't they all just look at the map?"*
>
> Answer: Each domain represents a fundamentally different question about the world,
> a different data pipeline, a different privacy threshold, and a different export format.
> A farmer asking "why is this field brown?" and a journalist asking "where was this aircraft?" are
> both spatial questions, but the data, the pipeline, the POPIA posture, and the UI are completely
> different. Serving them from one platform requires explicit per-domain design.

---

### Domain 1 — Urban Planners

| Field | Value |
|---|---|
| **Ralph Question** | *"What if the 3D tile shows a demolished building that was replaced last month?"* |
| **Primary Integration** | Google 3D Tiles, CesiumJS, Solar API |
| **4D Scenario** | Monthly Street View comparison → construction progress timeline → 4DGS rendering of building lifecycle |
| **Data Sources Needed** | Google Photorealistic 3D Tiles; CoCT ArcGIS Hub (zoning, IZS); Street View archive; Solar API (roof area, irradiation for solar feasibility) |
| **Currently Supported in PLAN.md** | M5 (Zoning Overlay), M8 (Spatial Analysis), M10 (Property Detail Panel) |
| **Currently Missing** | CesiumJS 3D view; Street View archive temporal comparison; Solar API integration; 3DGS building reconstruction; construction permit timeline overlays |
| **Priority** | Phase 2 (M7–M10) for zoning + analysis; Future (M12+) for 3D/temporal |

**Detailed Gap:**
PLAN.md delivers zoning overlays and property analysis — both relevant to urban planners. However,
the domain's **defining feature** is temporal 3D visualization of construction progress, which requires:
1. Google Photorealistic 3D Tiles (not yet in any milestone)
2. CesiumJS integration beyond the base MapLibre view (M3 only covers MapLibre)
3. A time-scrubbing UI component (not documented anywhere in PLAN.md)

**Required data sources not yet integrated:**
- `Solar API` — entirely absent
- Street View archive API for historical comparison
- CoCT building permits API or dataset

---

### Domain 2 — Emergency Responders

| Field | Value |
|---|---|
| **Ralph Question** | *"What if the network is down mid-incident?"* |
| **Primary Integration** | OpenSky Network, NASA FIRMS, offline PMTiles |
| **4D Scenario** | Wildfire spread: FIRMS fire perimeters → wind direction overlays → aircraft suppression tracks → 4D progression from T-0 to containment |
| **Data Sources Needed** | NASA FIRMS (fire perimeters, updated every 10 min); OpenSky Network (aerial suppression aircraft); National Weather Service / SAWS wind data; CoCT risk overlays; offline tile cache |
| **Currently Supported in PLAN.md** | M4c (Serwist PWA / Offline caching) |
| **Currently Missing** | NASA FIRMS integration; OpenSky real-time aircraft layer; wind/weather overlay; incident command UI (pan/zoom to area of interest); role-specific "Emergency Responder" dashboard; offline data pre-caching for known risk areas |
| **Priority** | Phase 2 (FIRMS + offline pre-cache for risk areas); Future (full incident dashboard) |

**Critical Offline Requirement:**
The executive summary (`08_Executive_Summary_Recommendations.md`) lists load-shedding resilience
as Risk #1, explicitly naming Workbox (now Serwist) PWA caching. The Emergency Responder domain
requires this to be extended beyond "last viewport" to **pre-cached risk area tiles** for the Western
Cape. PLAN.md M4c covers basic offline, but not pre-planned emergency coverage areas.

**Missing: South African Weather Service (SAWS) API**
No research file evaluates SAWS data availability or API access. This is an unresolved dependency
for fire and flood risk visualization.

---

### Domain 3 — Investigative Journalists

| Field | Value |
|---|---|
| **Ralph Question** | *"Can I publish the AI reconstruction as a photo?"* |
| **Primary Integration** | OpenSky ADS-B, OSINT fusion, NeRF/3DGS reconstruction |
| **4D Scenario** | Aircraft incident: ADS-B tracks → OSINT image collection → ControlNet conditioning → 3DGS reconstruction → AI-labeled 4D replay with citation export |
| **Data Sources Needed** | OpenSky Network (ADS-B flight tracks); public traffic cameras; Sentinel-2 satellite imagery; social media geotagged imagery; NOTAM databases |
| **Currently Supported in PLAN.md** | Nothing — this domain has zero coverage in PLAN.md |
| **Currently Missing** | OpenSky integration; 3DGS reconstruction pipeline; AI content labeling UI (Section 9 of GIS_MASTER_CONTEXT is comprehensive but not in any milestone); citation export; human review gate for professional evidence export; OSINT image collection tools |
| **Priority** | Future (M12+) — requires Pillars 2 and 3 which are not in current PLAN.md |

**The AI Labeling Obligation:**
GIS_MASTER_CONTEXT Section 9 defines a non-negotiable metadata schema for AI-generated content.
This is directly relevant to the journalist domain — the `humanReviewed: false` gate MUST block
"Verified Evidence" export. This safeguard is **not mentioned anywhere in PLAN.md**.
It must be added as a cross-cutting concern before any 3DGS work begins.

**Answer to the Ralph Question:**
No. AI-reconstructed scenes must carry `watermarkText: "⚠️ AI-reconstructed — not verified ground truth"` at all times. The platform's citation template must accompany any export. `humanReviewed: false` blocks the "Verified Evidence" export mode entirely.

---

### Domain 4 — Environmental Scientists

| Field | Value |
|---|---|
| **Ralph Question** | *"What if seasonal change looks like deforestation?"* |
| **Primary Integration** | Sentinel-2, NASA FIRMS, USGS earthquake/flood data |
| **4D Scenario** | 72-hour flood evolution: Sentinel-2 SAR imagery before/during/after → USGS stream gauge data → flood polygon temporal progression → land cover change detection |
| **Data Sources Needed** | ESA Copernicus Sentinel-2 (NDVI, SAR); USGS Water Resources API; NASA FIRMS; SANBI BGIS (biodiversity); Western Cape Government environmental datasets |
| **Currently Supported in PLAN.md** | Partially M11 (Analytics Dashboard) for aggregated stats |
| **Currently Missing** | Sentinel-2 imagery integration; NDVI change detection pipeline; temporal NDVI comparison UI; USGS flood gauge integration; SANBI BGIS data connection; GeoFile upload for drone-captured survey data; time-series raster analysis |
| **Priority** | Phase 2 (Sentinel-2 NDVI for farmers/scientists); Future (full change detection pipeline) |

**Answer to the Ralph Question:**
NDVI time-series analysis requires a baseline comparison period (e.g., same month, previous 3 years)
to distinguish seasonal variation from genuine land cover change. The platform must provide a
"NDVI delta vs seasonal baseline" view, not raw NDVI, before reporting potential deforestation.
This is a significant analytical feature not present in any current milestone.

**SANBI BGIS Gap:**
The RESEARCH_BRIEF.md explicitly marks SANBI BGIS data availability as `[UNVERIFIED]`.
Before implementing any biodiversity or environmental change detection feature, this data source
must be validated — available formats, licensing terms, and update frequency are unknown.

---

### Domain 5 — Aviation Professionals

| Field | Value |
|---|---|
| **Ralph Question** | *"What if OpenSky shows an illegal airspace intrusion?"* |
| **Primary Integration** | OpenSky ADS-B, ICAO airspace volumes, NOTAM databases |
| **4D Scenario** | Near-miss event: dual aircraft ADS-B tracks → separation distance calculation → airspace volume intersection → 4D replay of closing geometry |
| **Data Sources Needed** | OpenSky Network (ADS-B at 4,000 credits/day authenticated); ICAO airspace boundaries; South African CAA NOTAMs; aircraft registration database (SACAA) |
| **Currently Supported in PLAN.md** | Nothing |
| **Currently Missing** | OpenSky integration; ICAO airspace volume overlays; NOTAM display; separation distance calculation (PostGIS ST_Distance); flight track replay; squawk code alert system (7700/7600/7500 = emergency) |
| **Priority** | Phase 2 (OpenSky basic tracking); Future (full aviation analysis suite) |

**Answer to the Ralph Question:**
The platform should display the ADS-B track data as-is (public information) but must NOT take any
enforcement or reporting action. The platform's role is visualization only. An airspace intrusion
annotation must be labeled as an observation derived from public ADS-B data, not as a legal finding.
Defense Analyst domain ethics rules apply: OSINT is not surveillance or enforcement.

**OpenSky Commercial Licensing Risk:**
The gis-platform-synthesis.md and verification_report.md both flag that OpenSky's FAQ states
"commercial use requires a license." A multi-tenant SaaS platform likely qualifies as commercial.
This must be resolved (legal/licensing decision) before OpenSky is used for paying tenants.

---

### Domain 6 — Logistics Operators

| Field | Value |
|---|---|
| **Ralph Question** | *"What if the ship disappears into an AIS coverage gap?"* |
| **Primary Integration** | OpenSky (aircraft), AIS (maritime), Google Routes API |
| **4D Scenario** | Port of Cape Town incident: AIS vessel track to point of disappearance → known AIS coverage gap overlay → estimated position reconstruction → 4D comparison with CCTV-derived observations |
| **Data Sources Needed** | Maritime AIS feeds (MarineTraffic API or open AIS); Google Routes API (road logistics); Port of Cape Town operations data; AIS coverage gap polygons |
| **Currently Supported in PLAN.md** | Nothing |
| **Currently Missing** | Maritime AIS integration; AIS coverage gap overlay; vessel tracking UI; route optimization visualization; port operations layer; logistics corridor analysis |
| **Priority** | Future (M13+) — AIS integration is complex and scope-adjacent |

**Answer to the Ralph Question:**
AIS coverage gaps are documented phenomena in maritime tracking. The platform should display
the last known AIS position, the estimated dead-reckoning track (based on last known speed/heading),
and the coverage gap boundary — with the data badge clearly showing `[AIS · CACHED · GAP]` during
the coverage gap period. Never interpolate positions across gaps without explicit labeling.

**AIS Data Source:**
spatialintelligence-research.md (Table 2.1) identifies maritime AIS as a WorldView data layer
used by Bilawal Sidhu. However, no research report evaluates specific AIS data APIs for the
Cape Town/Table Bay area, cost structure, or real-time update frequency.
This is a significant unresolved data gap.

---

### Domain 7 — Real Estate Developers

| Field | Value |
|---|---|
| **Ralph Question** | *"What if the 3D tile shows the site 3 years before my purchase — the building may have changed."* |
| **Primary Integration** | Google 3D Tiles, Street View archive, GV Roll 2022 |
| **4D Scenario** | Historical site condition: Street View archive timeline → 3DGS reconstruction of historical state → overlaid zoning changes → valuation trend over time |
| **Data Sources Needed** | Google Photorealistic 3D Tiles; Street View archive; CoCT GV Roll 2022 (830,000 records); CoCT zoning (IZS); Planning portal (development applications) |
| **Currently Supported in PLAN.md** | ✅ **Best-covered domain** — M5 (Zoning), M6 (GV Roll), M7 (Search), M8 (Spatial Analysis), M9 (Favourites), M10 (Property Detail Panel), M11 (Analytics) |
| **Currently Missing** | Street View temporal comparison; 3D property visualization; valuation trend timeline; development application overlays; comparable sales analysis |
| **Priority** | Phase 1–2 ✅ (already in PLAN.md) |

**This is the primary "home domain" of the current PLAN.md.** Milestones M5–M11 comprehensively
address real estate developer needs. The notable gap is temporal/3D visualization (Street View archive
and 3D Tiles), which are Phase 2–Future features even for this primary domain.

**GV Roll POPIA Note:**
RESEARCH_BRIEF.md (Research Area 3) states: "The public version does not contain owner names,
but this must be verified upon each new download." This is a critical POPIA checkpoint —
property ownership data may constitute personal data requiring POPIA annotation blocks.

---

### Domain 8 — Researchers & Academics

| Field | Value |
|---|---|
| **Ralph Question** | *"How do I cite a map layer in a peer-reviewed paper?"* |
| **Primary Integration** | All APIs + citation export tools + data provenance tracking |
| **4D Scenario** | Reproducible event reconstruction: full data provenance chain → version-locked snapshot → peer-review-ready citation package with DOI links to all source datasets |
| **Data Sources Needed** | All platform data sources (with API version tracking); Zenodo/DOI integration for dataset citation; ORCID for researcher identity |
| **Currently Supported in PLAN.md** | Nothing specific to academic workflow |
| **Currently Missing** | Citation export (BibTeX, RIS, APA); data provenance panel; dataset version locking for reproducibility; API version recording in export metadata; DOI resolution for cited datasets; academic data export format (GeoJSON + provenance JSON bundle) |
| **Priority** | Phase 2 (citation export as part of M13 Share URLs); Future (full reproducibility framework) |

**Answer to the Ralph Question:**
The platform should auto-generate citations in the form:
```
CapeTown GIS Hub. (2026). [Layer Name] [Dataset]. Retrieved [date] from
[URL]. Source: [DATA_SOURCE · YEAR · LIVE/CACHED/MOCK].
Confidence: [score]. AI-generated content: [yes/no, with metadata].
```
This citation format must be available as a one-click export from every data layer panel.

**Academic Export Gate:**
Section 9 of GIS_MASTER_CONTEXT defines that `humanReviewed: false` blocks professional
evidence export. For academic use, this gate should be configurable by TENANT_ADMIN — some
research projects specifically study AI-generated content and need to export it labeled as such.

---

### Domain 9 — Defense Analysts

| Field | Value |
|---|---|
| **Ralph Question** | *"Is OSINT analysis the same as surveillance?"* |
| **Primary Integration** | OpenSky + AIS + public cams (OSINT only — no proprietary feeds) |
| **4D Scenario** | Pattern-of-life from public data: OpenSky aircraft tracks over time → AIS vessel patterns → public event calendar overlay → statistically anomalous movement detection |
| **Data Sources Needed** | OpenSky (full historical API); AIS historical data; publicly available event data; anomaly detection logic (PostGIS + pgvector embeddings) |
| **Currently Supported in PLAN.md** | Nothing |
| **Currently Missing** | Pattern-of-life analysis tools; temporal aggregation UI; anomaly detection; historical OpenSky data queries; access tier enforcement (Agency/Admin only) |
| **Priority** | Future (M14+) — requires advanced analytics and strict access controls |

**Answer to the Ralph Question:**
OSINT analysis using only publicly available data is NOT surveillance in the legal sense.
However, combining multiple public data sources to construct individual movement profiles
crosses the platform's **Privacy Bright Lines** (Section 14 of GIS_MASTER_CONTEXT):
"Building individual movement profiles from ADS-B data" is explicitly prohibited.
Pattern-of-life analysis must operate on **aggregate statistics**, not individual tracks.
Access to this feature requires the `AGENCY` access tier with additional audit logging.

---

### Domain 10 — Public Citizens

| Field | Value |
|---|---|
| **Ralph Question** | *"What if I don't know what coordinate format my phone uses?"* |
| **Primary Integration** | Google 2D maps, simplified CesiumJS view |
| **4D Scenario** | Community environmental report: citizen photo geotag → automatic coordinate detection → overlay on base map → aggregation into community observation layer |
| **Data Sources Needed** | Device GPS (browser Geolocation API); CoCT base data; community report aggregation; optional photo upload |
| **Currently Supported in PLAN.md** | M3 (MapLibre base map); M2 (Guest access via RBAC) |
| **Currently Missing** | "My Location" button (browser Geolocation API); coordinate format auto-detection and display; citizen report submission form; community layer aggregation; simplified "non-technical" UI mode; accessibility features (WCAG 2.1 AA) |
| **Priority** | Phase 2 (geolocation + simplified UI); guest mode is in M2 |

**Answer to the Ralph Question:**
The browser's `navigator.geolocation.getCurrentPosition()` returns coordinates in WGS84
(EPSG:4326 decimal degrees) — the same storage format the platform uses internally.
No reprojection is needed. However, the UI must NEVER display raw coordinates to citizens.
Instead, show the suburb name, street address (via reverse geocoding), or a simple
"You are in [area name]" message. Coordinate systems are an implementation detail, not a UX feature.

**Accessibility Gap:**
gis-platform-synthesis.md explicitly identifies "Accessibility (WCAG) for dark dashboard"
as a research gap affecting quality. No existing research addresses contrast ratios,
screen reader support for map content, or focus management in the CesiumJS 3D view.

---

### Domain 11 — Farmers & Agronomists ★

| Field | Value |
|---|---|
| **Ralph Question** | *"What if the brown fields are just harvest, not drought?"* |
| **Primary Integration** | Sentinel-2 NDVI, NOAA/SAWS weather, GeoFile upload (drone .gpkg/.tif) |
| **4D Scenario** | Crop damage analysis: farmer uploads `.gpkg` field boundaries → Sentinel-2 NDVI overlay → delta NDVI vs same-week prior years → AI-assisted interpretation (harvest vs drought vs disease patterns) |
| **Data Sources Needed** | ESA Copernicus Sentinel-2 (10m resolution NDVI); NOAA/South African Weather Service (SAWS) precipitation; drone imagery (GeoTIFF/LAS upload); NDVI baseline historical archive |
| **Currently Supported in PLAN.md** | Nothing (★ = added in v2 of GIS_MASTER_CONTEXT as Bilawal Sidhu–validated domain) |
| **Currently Missing** | Sentinel-2 API integration; NDVI calculation and rendering; NDVI delta vs seasonal baseline; farm boundary GeoFile upload; drone GeoTIFF processing pipeline; crop type classification; weather correlation overlays |
| **Priority** | Phase 2 (GeoFile upload + basic NDVI); Future (AI crop analysis) |

**Answer to the Ralph Question:**
NDVI delta analysis must compare against a seasonal baseline (same calendar week, averaged over
3–5 prior years) rather than absolute NDVI values. A field at NDVI 0.3 in March might be normal
post-harvest or severe drought — only the temporal comparison reveals which.
The UI must prominently display: `"NDVI -0.4 vs 3-year baseline for this week"`, not raw NDVI.

**GeoFile Upload — Verified Pathway:**
gis-file-formats-research.md (Section 8) provides a complete ingestion architecture:
- `.gpkg` (farmer's field boundaries) → `@ngageoint/geopackage` browser-side or GDAL server-side
- `.tif` (drone imagery) → `geotiff.js` preview + GDAL COG conversion + Supabase Storage
- CRS auto-detection handles South African CRS codes (EPSG:2046, 2048) transparently
This is the most implementation-ready domain gap in the platform.

---

## Part 2 — Gap Analysis

### 2.1 Missing Data Sources

Sources referenced in research but not yet implemented or planned:

| Data Source | Domains Affected | Research Evidence | Implementation Gap | Priority |
|---|---|---|---|---|
| **NASA FIRMS** (fire perimeters) | Emergency, Environmental | Mentioned in GIS_MASTER_CONTEXT §11 | No milestone, no API evaluation | Phase 2 |
| **OpenSky Network ADS-B** | Journalists, Aviation, Logistics, Defense | Full implementation guide in `opensky-cesium-osint.md` (not included in source list but referenced in synthesis) | No milestone in PLAN.md | Phase 2 |
| **ESA Copernicus Sentinel-2** | Environmental, Farmers | Referenced in §11 | No API evaluation, no NDVI pipeline | Phase 2 |
| **Maritime AIS feeds** | Logistics, Defense | WorldView architecture in `spatialintelligence-research.md` §2.1 | No research, no evaluation | Future |
| **South African Weather Service (SAWS)** | Emergency, Farmers | Referenced implicitly | No research at all — `[UNVERIFIED]` | Future |
| **CoCT Solar API** | Urban Planners | Mentioned in §11 | No evaluation, no milestone | Future |
| **USGS Water Resources API** | Environmental | Referenced in §11 | No evaluation | Future |
| **SANBI BGIS** | Environmental | RESEARCH_BRIEF.md §2, explicitly `[UNVERIFIED]` | No research | Future |
| **ICAO airspace volumes** | Aviation | Referenced in §11 | No evaluation | Future |
| **South African CAA NOTAMs** | Aviation | Referenced in §11 | No evaluation | Future |
| **Zenodo / DOI integration** | Academics | Implied by citation export need | No evaluation | Future |
| **WCG Spatial Data Warehouse** | Multiple | `verification_report.md` — URL `[UNVERIFIED]` | Not verified accessible | Phase 2 (verify first) |

### 2.2 Missing Features

GIS features described in research but absent from PLAN.md:

| Feature | Research Source | TRL | Missing From |
|---|---|---|---|
| **CesiumJS 3D globe view** | `spatialintelligence-research.md` §4; `gis-platform-synthesis.md` §4.1 | TRL 9 | PLAN.md (M3 covers MapLibre only) |
| **Google Photorealistic 3D Tiles** | GIS_MASTER_CONTEXT §4 Pillar 1; `spatialintelligence-research.md` §7.1 | TRL 9 | All milestones |
| **OpenSky ADS-B layer** | `gis-platform-synthesis.md` §5.2 | TRL 8 | All milestones |
| **GeoFile upload pipeline** | `gis-file-formats-research.md` §8; GIS_MASTER_CONTEXT §7.4 | TRL 8 | All milestones |
| **CRS auto-detection & reprojection** | `gis-file-formats-research.md` §7 | TRL 9 | All milestones |
| **Temporal scrubbing / 4D replay** | `spatialintelligence-research.md` §4.2; `gis-platform-synthesis.md` §5.2 | TRL 3–4 | All milestones |
| **AI content labeling UI** | GIS_MASTER_CONTEXT §9 (non-negotiable) | TRL 8 | All milestones |
| **Spatial Copilot (NL → PostGIS)** | Referenced in GIS_MASTER_CONTEXT §3; `gis-platform-synthesis.md` §4.2 | TRL 5–7 | All milestones |
| **3DGS reconstruction pipeline** | GIS_MASTER_CONTEXT §7.2; `gis-platform-synthesis.md` §3 | TRL 6–7 | All milestones |
| **NDVI analysis & change detection** | GIS_MASTER_CONTEXT §11 (Domain 11); §11 (Domain 4) | TRL 7 | All milestones |
| **Visualization mode switching** | `spatialintelligence-research.md` §6.2 | TRL 9 | All milestones |
| **Progressive layer loading** | `spatialintelligence-research.md` §4.3; `gis-platform-synthesis.md` §1.6 | TRL 9 | PLAN.md M4b only partial |
| **Citation / provenance export** | GIS_MASTER_CONTEXT §11 Domain 8 | TRL 8 | All milestones |
| **WCAG 2.1 AA accessibility** | `gis-platform-synthesis.md` §7.2; GIS_MASTER_CONTEXT §4 Pillar 4 | TRL 9 | All milestones |
| **Geolocation (My Location)** | GIS_MASTER_CONTEXT §11 Domain 10 | TRL 9 | All milestones |

### 2.3 Missing Integrations

Third-party services mentioned in research but not connected:

| Integration | Status | Blocker |
|---|---|---|
| **OpenSky Network OAuth2** | `[UNVERIFIED]` commercial licensing | Legal/commercial decision required before implementation |
| **Cesium ion** | Env vars documented in GIS_MASTER_CONTEXT §15; no milestone | Needs M5+ milestone allocation |
| **Google Maps Tile API** | Referenced in GIS_MASTER_CONTEXT §15; no milestone | Needs M5+ milestone and billing setup |
| **LiteLLM proxy → Claude Code** | Documented in GIS_MASTER_CONTEXT §5.2, §15 | Env vars present; no implementation milestone |
| **ArcGIS REST (CoCT Hub)** | `verification_report.md` confirms active; `07_Multitenancy_Access_Views_ArcGIS_Hub.md` covers integration | PLAN.md M5 covers zoning overlay but no dedicated ArcGIS connector milestone |
| **Koop JS (ArcGIS compatibility bridge)** | `07_Multitenancy_Access_Views_ArcGIS_Hub.md` recommends for multi-tenant | No milestone |
| **pgvector** | `verification_report.md` §06 confirms Supabase includes it | No milestone for semantic search / NL queries |
| **MCP Servers** | GIS_MASTER_CONTEXT §5.3 defines 5 required MCP servers | Not in PLAN.md at all |

### 2.4 Missing UI Components

Dashboard patterns described in research but not yet designed:

| UI Component | Research Source | Domain(s) | Complexity |
|---|---|---|---|
| **Temporal scrubbing slider** | `spatialintelligence-research.md` §4.2 | Urban Planners, Journalists, Environmental, Farmers | High |
| **Multi-sensor data fusion layer toggle** | `spatialintelligence-research.md` §6.3 | All domains | Medium |
| **AI content watermark overlay** | GIS_MASTER_CONTEXT §9 | Journalists, Defense, Academics | Low (mandatory) |
| **Confidence score badge** | GIS_MASTER_CONTEXT §8 | All OSINT users | Medium |
| **Domain-specific dashboard mode** | GIS_MASTER_CONTEXT §11 | 11 different dashboards | High |
| **Visualization mode switcher** | `spatialintelligence-research.md` §6.2 | Power users, Analysts | Medium |
| **Progressive layer loading indicator** | `spatialintelligence-research.md` §4.3 | Mobile users, Emergency | Low |
| **Citation export panel** | GIS_MASTER_CONTEXT §11 Domain 8 | Academics, Journalists | Medium |
| **GeoFile upload + CRS preview** | `gis-file-formats-research.md` §8.1 | Farmers, Environmental, Urban Planners | Medium |
| **Human review gate (AI export)** | GIS_MASTER_CONTEXT §9 | Journalists, Legal, Insurance | Medium (mandatory) |
| **Spatial Copilot chat panel** | `gis-platform-synthesis.md` §4.2 | All professional domains | High |
| **NDVI change detection panel** | GIS_MASTER_CONTEXT §11 Domain 11 | Environmental, Farmers | High |
| **Entity relationship inspector** | GIS_MASTER_CONTEXT §8 Palantir Ontology | Defense, Journalists | High |

---

## Part 3 — Domain Extension Recommendations

### 3.1 Quick Wins (Phase 1 — Minimal Effort)

These can be added to M3–M4 milestones with minimal architectural change:

#### QW1 — AI Content Watermark Component *(Mandatory, Not Optional)*

**What:** A React component that overlays `"⚠️ AI-reconstructed — not verified ground truth"` on
any AI-generated map content. The watermark is non-removable (CSS `pointer-events: none; user-select: none`).

**Why Phase 1:** GIS_MASTER_CONTEXT §9 explicitly states this is NON-NEGOTIABLE and must be present
before any AI feature is enabled. It has no dependencies on any other system. A standalone component
can be built and tested independently.

**Effort:** 1 sprint. Single React component + CSS module. No backend. No API.

**Source:** GIS_MASTER_CONTEXT §9; maps to every domain using AI features.

---

#### QW2 — Data Source Badge Component

**What:** The `[SOURCE_NAME · YEAR · LIVE|CACHED|MOCK]` badge required by CLAUDE.md Rule 1.
A stateless presentational component that accepts `{ source, year, status }` props and renders
a small badge near every data display.

**Why Phase 1:** This is Rule 1 of CLAUDE.md — non-negotiable. It must exist before any real data
layer is displayed. The badge informs ALL 11 domains about the provenance of what they're seeing.

**Effort:** < 1 sprint. Pure TypeScript/React, zero dependencies beyond Tailwind.

**Source:** CLAUDE.md Rule 1; `gis-platform-synthesis.md` §2 concept frequency matrix (3 reports).

---

#### QW3 — Browser Geolocation "My Location" Button

**What:** A map control button that calls `navigator.geolocation.getCurrentPosition()` and
flies the map to the user's location. Displays suburb name + ward via reverse geocode against
the CoCT suburb layer (PostGIS `ST_Contains`).

**Why Phase 1:** Directly addresses Domain 10 (Public Citizens) Ralph Question.
Requires only the browser Geolocation API and the suburb boundaries layer (already planned in M1).
Transforms a passive map into an interactive personal tool for non-technical users.

**Effort:** < 1 sprint. Browser API + 1 PostGIS reverse geocode query + 1 UI button.

**Source:** GIS_MASTER_CONTEXT §11 Domain 10; `07_Multitenancy_Access_Views_ArcGIS_Hub.md` (RLS pattern applies).

---

### 3.2 Medium-Term Additions (Phase 2 — 2–3 Month Effort)

These are validated, production-ready technologies requiring dedicated milestones:

#### MT1 — GeoFile Upload Pipeline with CRS Auto-Detection *(Highest Research Confidence)*

**What:** Server-side ingestion pipeline for Shapefile, GeoPackage, GeoJSON, KML/KMZ, and GeoTIFF.
Browser-side preview using `shpjs`, `@ngageoint/geopackage`, `@tmcw/togeojson`, `geotiff.js`.
Server-side GDAL conversion via `gdal-async` (Node.js bindings). CRS auto-detection with
pre-loaded South African EPSG codes (2046, 2048, 4148, 22234).

**Why Phase 2:** This is the most implementation-ready domain gap. `gis-file-formats-research.md`
provides a complete architecture (Section 8), verified npm packages (Section 6), and validated
library choices. Enables **7 of 11 domains** to upload their existing files (Farmers, Urban Planners,
Environmental Scientists, Researchers, Real Estate, Emergency, Logistics).

**Effort:** 4–6 sprints. Browser client + Next.js API routes + GDAL server-side + PostGIS import.

**Milestone Suggestion:** New M4e — GeoFile Ingestion.

**Source:** `gis-file-formats-research.md` §8; GIS_MASTER_CONTEXT §7.4 (ArcGIS/QGIS Format Matrix).

---

#### MT2 — OpenSky ADS-B Real-Time Layer *(Second-Highest Research Confidence)*

**What:** Server-side OpenSky polling (30s interval, 1 credit/request), `api_cache` storage,
SSE fan-out to clients, MapLibre icon layer with rotation bearing, 3D CesiumJS CZML entities.
Bounding box filter: `{ west: 18.0, south: -34.5, east: 19.5, north: -33.0 }`.
Three-tier fallback: OpenSky API → `api_cache` → mock aircraft GeoJSON.

**Why Phase 2:** Validated by `gis-platform-synthesis.md` §5 (Medium Priority, M4–M5).
Enables **5 domains** (Aviation, Journalists, Emergency Responders, Logistics, Defense).
Also validates the real-time data pipeline architecture for all future live data layers.

**Effort:** 3–4 sprints. Server poller + cache + SSE + MapLibre layer + CesiumJS entity.

**Blocker:** Commercial licensing decision on OpenSky for multi-tenant SaaS must come first.

**Milestone Suggestion:** New M5b — OpenSky Flight Layer (parallel with M5 Zoning Overlay).

**Source:** `gis-platform-synthesis.md` §5; GIS_MASTER_CONTEXT §11 Domains 3, 5, 6, 9.

---

#### MT3 — Sentinel-2 NDVI Change Detection Layer

**What:** ESA Copernicus API integration for Sentinel-2 satellite imagery (10m resolution).
NDVI calculation (band math: `(NIR - RED) / (NIR + RED)`). Seasonal baseline comparison
(same week, prior 3 years). NDVI delta visualization with color ramp.
GeoTIFF COG rendering via MapLibre raster source.

**Why Phase 2:** Enables **2 high-value domains** (Farmers + Environmental Scientists)
with a single integration. Sentinel-2 data is free (ESA Copernicus Open Access).
The NDVI calculation runs entirely in PostGIS or Python with rasterio — no new infrastructure.

**Effort:** 4–6 sprints. Copernicus API client + NDVI pipeline + baseline archive + raster rendering.

**Milestone Suggestion:** New M7b — Satellite Imagery Layer (parallel with M7 Search).

**Source:** GIS_MASTER_CONTEXT §11 Domain 11 (★ highest-priority new domain); Domain 4.

---

### 3.3 Visionary Extensions (Future / Phase 3+)

These are architecturally sound but require significant R&D or external dependencies:

#### VE1 — 4D WorldView Event Replay Dashboard

**What:** A CesiumJS-based temporal replay dashboard inspired by Bilawal Sidhu's WorldView.
Time scrubbing slider + multi-source data fusion on a 3D globe + Gaussian Splatting scene
reconstruction + CZML time-dynamic entities. Per-domain 4D scenarios as described in §11.

**Why Future:** `gis-platform-synthesis.md` §3 rates 4D event replay at TRL 3–4.
Requires: CesiumJS 3D globe (unimplemented), OpenSky integration (MT2, Phase 2),
3DGS reconstruction pipeline (separate R&D effort), temporal data model (PostGIS time-series).

**Domains Enabled:** All 11 — each with their specific 4D scenario.

**Key Technical Dependency:** `KHR_gaussian_splatting` (Khronos RC Feb 2026, Q2 2026 ratification).

**Source:** `spatialintelligence-research.md` §2.2; GIS_MASTER_CONTEXT §7.2; §11 all domains.

---

#### VE2 — GIS Copilot — Natural Language Spatial Query Agent

**What:** Tool-calling LLM (Claude via LiteLLM proxy) with 15 curated PostGIS tools.
Phase 1 (6 tools): geocode, proximity, area search, details, distance, count.
Phase 2 (15 tools): land use analysis, temporal comparison, NDVI query, valuation stats.
`gis_copilot_reader` read-only PostGIS role. VIEWER minimum RBAC. Spatial query sanitization.
Cape Town bbox validation on all generated geometries.

**Why Future:** `gis-platform-synthesis.md` §3 rates NL-to-PostGIS at TRL 5–7.
Academic GIS Copilot (Penn State, v1.0, verified in `verification_report.md` addendum) demonstrates
feasibility. The SIGMOD 2025 security paper confirms tool-calling is safer than raw SQL generation.

**Domains Enabled:** All professional domains (VIEWER+). Transforms the platform from a data
viewer into an active intelligence assistant.

**LiteLLM Integration:** Env vars already documented in GIS_MASTER_CONTEXT §15 and §5.2.
The proxy routing (Copilot CLI → LiteLLM → Claude Code) is architecturally defined.

**Source:** GIS_MASTER_CONTEXT §3 (Autonomous GIS Agent reference); `gis-platform-synthesis.md` §4.2.

---

#### VE3 — 3DGS Event Reconstruction Pipeline (Cape Town Landmarks)

**What:** On-demand 3D Gaussian Splatting reconstruction triggered by event detection.
Pipeline: public image collection (Street View + drone upload + Sentinel-2) →
COLMAP pose estimation → Splatfacto training (~15 min on A100) →
`ns-export gaussian` → PLY/glTF export → Cesium ion upload →
CesiumJS rendering via `KHR_gaussian_splatting` + AI content labeling.

**Why Future:** `gis-platform-synthesis.md` §3 rates 3DGS browser rendering at TRL 6–7.
The full Cesium ion deployment pipeline is TRL 6 — prototypeable but not production-ready.
Drone capture → COLMAP → Splatfacto is the validated sub-pipeline (TRL 7).

**Cape Town Specific:** Initial targets: Table Mountain iconic face, V&A Waterfront Piazza,
Bo-Kaap neighbourhood (distinctive architecture). These high-recognition landmarks provide
validation data with clear reference images.

**AI Labeling Gate:** Every 3DGS output MUST carry `aiContentMetadata` (GIS_MASTER_CONTEXT §9)
and the visual watermark. The professional export gate (`humanReviewed: true`) must be in place
before any reconstruction output is used in journalism, legal, or insurance contexts.

**Source:** GIS_MASTER_CONTEXT §7.2; `gis-platform-synthesis.md` §4.3; Domains 3, 7, 8.

---

## Part 4 — Knowledge Confidence Matrix

| Research Area | Source Quality | Evidence Strength | Confidence | Notes |
|---|---|---|---|---|
| **CesiumJS + Google 3D Tiles architecture** | Industry (Cesium docs, WorldView case study) | 6/7 reports agree | **HIGH** | Production-ready; Cape Town coverage unverified |
| **MapLibre GL JS rendering** | npm verified, 3 reports | Direct implementation evidence | **HIGH** | Core infrastructure, no gaps |
| **PostGIS + Supabase + RLS** | Official docs, `07_Multitenancy_Access_Views_ArcGIS_Hub.md` | 3/7 reports agree | **HIGH** | Canonical patterns confirmed |
| **Martin tile server** | `verification_report.md` corrected version to v1.3.1; official docs | 3/7 reports | **HIGH** | Version error corrected; architecture validated |
| **GeoFile ingestion (Shapefile, GeoPackage, GeoTIFF)** | npm registry verified, download counts confirmed | 14 libraries verified | **HIGH** | Best-evidenced implementation path |
| **CRS auto-detection + proj4 reprojection** | npm verified (840K/week), SA EPSG codes confirmed | Cross-report validation | **HIGH** | Pre-load EPSG:2046, 2048, 4148, 22234 |
| **OpenSky ADS-B API** | `verification_report.md` addendum; official API docs | Rate limits confirmed (4,000/day); OAuth2 migration confirmed | **HIGH** | Commercial license required for SaaS |
| **3D Gaussian Splatting (Splatfacto)** | 13 peer-reviewed papers (SIGGRAPH/CVPR/ECCV); CesiumJS changelog | 3/7 reports agree | **HIGH** (technology) / **MEDIUM** (GIS application) | TRL 6–7; browser support incomplete |
| **KHR_gaussian_splatting glTF extension** | Khronos press release Feb 3, 2026; verified in addendum | RC status confirmed; Q2 2026 ratification | **HIGH** | Not yet ratified; PLY format fallback needed |
| **WorldView UI/UX patterns** | First-party Bilawal Sidhu articles + Bit Rebels analysis | Multiple corroborating sources | **HIGH** (patterns) / **MEDIUM** (implementation) | Source code not open-source |
| **ControlNet → 3D Tiles pipeline** | 12 academic papers + `gis-platform-synthesis.md` §6.3 | Explicitly contradicted: TRL 2–3 | **LOW** | No validated end-to-end system exists |
| **NL-to-PostGIS raw SQL generation** | SIGMOD 2025 security paper; `gis-platform-synthesis.md` §6.4 | Security risks documented | **LOW** (raw SQL) / **HIGH** (tool-calling pattern) | Use tool-calling; never raw SQL below PLATFORM_ADMIN |
| **NASA FIRMS real-time fire data** | Referenced in GIS_MASTER_CONTEXT only | No dedicated research | **MEDIUM** | FIRMS API is well-documented publicly; no implementation research done |
| **Sentinel-2 NDVI pipeline** | Referenced in GIS_MASTER_CONTEXT only | No dedicated research | **MEDIUM** | ESA Copernicus Open Access; technical path known; no implementation research |
| **Maritime AIS integration** | WorldView case study only | Single source | **MEDIUM** (WorldView) / **LOW** (Cape Town AIS) | AIS data API for Table Bay completely unresearched |
| **South African Weather Service (SAWS) API** | Not researched | Zero evidence | **SPECULATIVE** | Mentioned implicitly only; no API evaluation |
| **SANBI BGIS spatial data** | RESEARCH_BRIEF.md marks as `[UNVERIFIED]` | Zero evidence | **SPECULATIVE** | Must verify before any biodiversity feature |
| **Google Photorealistic 3D Tiles — Cape Town coverage** | `spatialintelligence-research.md` §9.1 flags as `[UNVERIFIED]` | Zero verification | **SPECULATIVE** | Blocks entire CesiumJS 3D strategy if absent |
| **WCG Spatial Data Warehouse** | `verification_report.md` — URL `[UNVERIFIED]` | Zero verification | **SPECULATIVE** | Must navigate to URL to confirm |
| **CoCT ArcGIS Hub (zoning, GV Roll)** | `verification_report.md` — Active; updated Feb 2026 | Direct verification | **HIGH** | Multiple datasets confirmed active |
| **POPIA compliance architecture** | `docs/RESEARCH_BRIEF.md` §5; `07_Multitenancy_Access_Views_ArcGIS_Hub.md` | DPA with Supabase requirement confirmed | **HIGH** | UK GDPR adequacy confirmed; DPA mandatory |
| **Multi-agent AI development workflow** | First-party Bilawal Sidhu quote; `spatialintelligence-research.md` §3.1 | Direct evidence | **HIGH** (concept) / **MEDIUM** (governance) | Validates capegis fleet approach |
| **pgvector for semantic search** | `verification_report.md` §06; Supabase docs | Confirmed in Supabase | **HIGH** | No implementation milestone yet |
| **Load-shedding / offline PWA** | `08_Executive_Summary_Recommendations.md` Risk #1; PLAN.md M4c | Multiple sources | **HIGH** | PLAN.md already addresses via Serwist |

---

## ⚠️ Known Unknowns

| # | Unknown | Blocking | Resolution Path |
|---|---|---|---|
| KU1 | Google Photorealistic 3D Tiles coverage of Cape Town CBD | ✅ Blocks CesiumJS 3D strategy | Run API test against Cape Town coordinates |
| KU2 | OpenSky commercial licensing for multi-tenant SaaS | ✅ Blocks Domains 3, 5, 6, 9 | Legal/commercial decision; contact OpenSky |
| KU3 | WCG Spatial Data Warehouse URL accessibility | Partial | Navigate to `gis.westerncape.gov.za/server2/rest/services/SpatialDataWarehouse` |
| KU4 | SANBI BGIS data format, licensing, update frequency | Partial (Environmental domain) | Direct inquiry to SANBI |
| KU5 | SAWS API availability and licensing | Partial (Emergency + Farmers) | SAWS developer portal evaluation |
| KU6 | GV Roll ownership data — POPIA classification | ✅ Blocks M6 implementation | Legal review: does public GV Roll contain personal data? |
| KU7 | CoCT ArcGIS layer index for zoning (`/MapServer/?`) | Partial | Browse `citymaps.capetown.gov.za/agsext1/rest/services/` live |
| KU8 | Supabase current PostgreSQL version for this project | Partial | Check Supabase dashboard |
| KU9 | MapLibre ↔ CesiumJS dual-viewer switching pattern | Architectural | Research or prototype: tab switching vs modal vs split-screen |
| KU10 | Performance budget for mobile GIS in SA market (5Mbps) | Partial | Needs PWA performance benchmarking |

---

## ⚖️ Ethical Use & Compliance

### Domain-Specific Ethics

| Domain | Primary Risk | Mitigation |
|---|---|---|
| Investigative Journalists | Publishing AI reconstructions as photographs | Non-removable watermark + `humanReviewed: false` export gate |
| Defense Analysts | Building individual movement profiles from public ADS-B | Pattern-of-life on aggregate only; individual tracking prohibited (GIS_MASTER_CONTEXT §14) |
| Public Citizens | Location data collection without consent | POPIA annotation; opt-in only geolocation; no persistent storage of citizen locations without explicit consent |
| Farmers | Crop data as trade secrets | Tenant isolation; uploaded GeoFiles are tenant-scoped, never shared cross-tenant |
| All domains | Data source misrepresentation | Mandatory data badge; three-tier fallback status always visible |

### POPIA Annotation Requirements

All domain-specific files that handle personal data must include the POPIA annotation block
(CLAUDE.md Rule 5). Specifically:
- Domain 10 (Citizens): location data
- Domain 7 (Real Estate): property ownership (if GV Roll contains owner names)
- Domain 8 (Academics): researcher identity via ORCID integration
- Domain 3 (Journalists): OSINT subject data (individuals in ADS-B tracks)

### OpenSky Privacy Bright Lines

As stated in GIS_MASTER_CONTEXT §14, the following are **prohibited** on this platform even
when technically possible with public data:
- Persistent tracking of specific individuals via aircraft registration
- Building individual movement profiles from ADS-B data
- Combining multiple public sources to de-anonymise private individuals

These prohibitions directly affect how Domain 5 (Aviation), Domain 9 (Defense), and
Domain 3 (Journalists) interact with OpenSky data.

---

## References

| Source | Relevance |
|---|---|
| `docs/context/GIS_MASTER_CONTEXT.md` | Primary reference — §11 (11 domains), §8 (ontology), §9 (AI labeling), §14 (ethics) |
| `docs/research/spatialintelligence-research.md` | WorldView patterns, domain extensions, Cape Town adaptations |
| `docs/research/gis-platform-synthesis.md` | Cross-report validation, TRL assessment, gap analysis, risk register |
| `docs/research/08_Executive_Summary_Recommendations.md` | Architecture decision matrix, SA-specific risks |
| `docs/research/07_Multitenancy_Access_Views_ArcGIS_Hub.md` | RLS patterns, ArcGIS Hub integration, Koop JS |
| `docs/RESEARCH_BRIEF.md` | SA data sources, POPIA compliance, infrastructure realities |
| `docs/research/gis-file-formats-research.md` | GeoFile ingestion architecture, library verification |
| `docs/research/verification_report.md` | Fact verification, CesiumJS version corrections, CoCT portal status |
| `PLAN.md` | Current milestone coverage — basis for gap analysis |
| `CLAUDE.md` | Non-negotiable rules referenced throughout |

---

*Document version: 1.0 | Generated: 2026-03-05*
*Agent: AGENT D — Domain Synthesizer*
*Constraint: AGENTS A, B, C outputs not yet available — cross-referenced against source research only*
*Next review: After @orchestrator completes inter-agent synthesis*
