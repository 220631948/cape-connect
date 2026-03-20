# Cape Town & Western Cape — Structured Research Brief

> **TL;DR:** Factual foundation for `PLAN.md`. Key findings: CoCT ODP Hub (`odp-cctegis.opendata.arcgis.com`) is the primary data portal (243+ datasets). GV Roll 2022 is the approved valuation source — no Lightstone (CLAUDE.md Rule 8). Three-tier fallback is mandatory for unreliable CoCT endpoints. POPIA requires DPA with Supabase and DPIA before first tenant. EPSG:4326 for storage, EPSG:3857 for rendering.

## Planning Mode Artefact

> This document is the output of **PLANNING PROMPT 2**. It synthesizes all existing research into a single, structured brief to serve as the factual foundation for `PLAN.md`. Every factual claim herein is accompanied by a source citation from the project's research files or is explicitly marked as `[UNVERIFIED]`.

---

## RESEARCH AREA 1 — City of Cape Town Open Data Infrastructure

-   **Data Portal:** The City of Cape Town (CoCT) Open Data Portal is the primary source for municipal spatial data.
    -   **Source:** `other/gis_research_urls.txt`
    -   **URL:** `https://odp.capetown.gov.za/` and `https://odp-cctegis.opendata.arcgis.com/`

-   **Data Formats:** A significant portion of datasets are available as ArcGIS REST Feature Services, which is the platform's primary integration method. Others are available as bulk downloads (e.g., CSV, Shapefile).
    -   **Source:** `research-findings/04b_ArcGIS_Web_Integration.md`

-   **Authentication:** Publicly available read-only datasets on the CoCT portal generally do not require API keys or developer registration for access.
    -   **Source:** `other/technical_specification_findings.md`

-   **Licensing:** The portal has a "Terms of Use" page that must be reviewed to ensure compliance with data attribution and usage restrictions. The specific license type (e.g., Creative Commons) needs to be confirmed per dataset.
    -   **Source:** `other/technical_architecture_extensions.md`, `other/gis_research_urls.txt`

-   **General Valuation Roll (GV Roll):** The GV Roll is a critical dataset. The 2022 version is the current target for import. It is available as a bulk download, not a live API, and contains approximately 830,000 property records. The public version does not contain owner names, but this must be verified upon each new download.
    -   **Source:** `docs/architecture/SYSTEM_DESIGN.md`, `docs/specs/10-popia-compliance.md (DPIA pending M15)`

-   **Service Reliability & Uptime:** The CoCT ArcGIS services are known to be intermittent. This is considered a high-priority project risk.
    -   **Source:** `research-findings/08_Executive_Summary_Recommendations.md`
    -   **Mitigation:** A three-tier data fallback strategy (Live → Cache → Mock) is a mandatory part of the architecture.
        -   **Source:** `docs/architecture/SYSTEM_DESIGN.md`

-   **Rate Limiting:** Specific rate limits on CoCT's public ArcGIS REST endpoints are `[UNVERIFIED]`. The application architecture must assume rate limits exist and implement client-side debouncing and server-side caching to mitigate.

---

## RESEARCH AREA 2 — Western Cape Government GIS Data

-   **Data Portal:** The Western Cape Government (WCG) also maintains a GIS data portal.
    -   **URL:** `https://www.westerncape.gov.za/general-publication/gis-data`
    -   **Source:** `other/gis_research_urls.txt`
    -   **Status:** The availability of a specific WCG Spatial Data Warehouse at `gis.westerncape.gov.za/server2/rest/services/SpatialDataWarehouse` is `[UNVERIFIED]`.
        -   **Source:** `other/verification_report.md`

-   **Risk Data (Fire & Flood):** The project plan includes the display of fire and coastal flood risk layers. This implies an expectation that this data is available from WCG or CoCT, likely in raster or polygon format that may require processing.
    -   **Source:** `docs/architecture/SYSTEM_DESIGN.md` (Milestone M11), `research-findings/05_Python_Geo_Stack.md`

-   **SANBI BGIS Portal:** The South African National Biodiversity Institute (SANBI) BGIS portal is a potential source for environmental and biodiversity spatial data, but specific available datasets have not been documented in the existing research. This is `[UNVERIFIED]`.

-   **Inter-Agency Data Sharing:** Any data sharing agreements between CoCT and WCG that affect public data availability are `[UNVERIFIED]`.

---

## RESEARCH AREA 3 — South African Property Data Landscape

-   **Lightstone Property:** This is a paid, proprietary data service. The platform will **not** use Lightstone data and is not a replacement for it. This is a core project constraint.
    -   **Source:** `docs/architecture/SYSTEM_DESIGN.md`

-   **Deeds Office:** The public availability, access methods, and cost structure for property transaction data from the Deeds Registry are `[UNVERIFIED]`.

-   **Other Data Aggregators (PropStats, PayProp, etc.):** The availability of free-tier or academic APIs from these platforms is `[UNVERIFIED]`.

-   **Bond Originator Platforms (BetterBond, ooba):** The availability of public data from these platforms is `[UNVERIFIED]`.

---

## RESEARCH AREA 4 — GIS Feature Research (User Needs)

-   **Core User Tasks:** Analysis of project documents suggests that the primary user needs revolve around understanding property value, zoning regulations, and spatial risk factors.
    -   **Example Query:** "Find me all General Business 1 (GB1) zoned properties within 500m of this informal trading bay."
        -   **Source:** `research-findings/01_PostGIS_Core_Ecosystem.md`

-   **High-Value Future Features:** Advanced features like a live "Activity Heatmap" (requiring real-time data) and "Land-use change detection" (requiring GeoAI) have been identified as strategic differentiators for future phases.
    -   **Source:** `research-findings/06_GeoAI_RealTime_Integration.md`, `research-findings/05_Python_Geo_Stack.md`

-   **Planning Constraints to Visualize:** The most critical spatial datasets for the target users are:
    -   Integrated Zoning Scheme (IZS) polygons.
    -   Cadastral parcels (property boundaries).
    -   Geographic boundaries (suburbs, wards).
    -   Risk overlays (fire, flood).
    -   Informal settlement boundaries.
    -   **Source:** `docs/architecture/SYSTEM_DESIGN.md`, `other/gis_research_urls.txt`

-   **Competitor Analysis:** A detailed analysis of features offered by existing commercial platforms (Property24, Private Property, etc.) is `[UNVERIFIED]`.

---

## RESEARCH AREA 5 — Regulatory and Compliance Context

-   **POPIA (Protection of Personal Information Act):** This is a primary regulatory constraint.
    -   **Personal Data:** The platform will handle user emails, names, saved searches/favourites, and query history.
    -   **Key Safeguard:** Row-Level Security (RLS) in the PostGIS database is the primary technical control to ensure tenant data isolation.
    -   **Cross-Border Transfer:** The platform uses Supabase hosted in `eu-west-1` (London). This is permissible under POPIA Section 72 as the UK has "adequate" data protection laws (UK GDPR). A signed Data Processing Agreement (DPA) with Supabase is mandatory.
    -   **Source:** `docs/specs/10-popia-compliance.md (DPIA pending M15)`, `docs/architecture/SYSTEM_DESIGN.md`, `other/South_African_Data_Sovereignty-1.pdf`

-   **Draft National Data and Cloud Policy (DNCCP):** This draft policy contains data localisation provisions. However, it is not yet law and contains provisions that conflict with POPIA. The current architectural decision is to **not** design around DNCCP until it is enacted.
    -   **Source:** `docs/architecture/SYSTEM_DESIGN.md`

-   **Accessibility:** The platform targets compliance with Web Content Accessibility Guidelines (WCAG) 2.1 AA.
    -   **Source:** `docs/architecture/SYSTEM_DESIGN.md`

---

## RESEARCH AREA 6 — Infrastructure Realities and Technical Constraints

-   **Connectivity:** The platform is designed for a median South African user, with a target of acceptable performance on a **5Mbps connection**.
    -   **Source:** `docs/architecture/SYSTEM_DESIGN.md`

-   **Loadshedding:** Frequent and prolonged power outages are a core design constraint. The architecture addresses this with a "True Offline" Progressive Web App (PWA) model.
    -   **Features:** Service Workers for caching, IndexedDB for local data storage, and the Background Sync API for queuing writes made while offline.
    -   **Source:** `research-findings/08_Executive_Summary_Recommendations.md`, `docs/architecture/SYSTEM_DESIGN.md`

-   **Mobile Data Costs:** High mobile data costs in South Africa are mitigated by using compressed, binary Mapbox Vector Tiles (MVT) served by a tile server (Martin), which are significantly smaller than fetching raw GeoJSON.
    -   **Source:** `docs/architecture/SYSTEM_DESIGN.md`

-   **Hosting Location:** While an AWS region exists in Cape Town (`af-south-1`), the primary database (Supabase) is hosted in `eu-west-1` (London) to satisfy POPIA's adequacy requirements for cross-border data transfer.
    -   **Source:** `research-findings/08_Executive_Summary_Recommendations.md`, `docs/architecture/SYSTEM_DESIGN.md`

-   **Coordinate Systems:** The platform standardizes on **EPSG:4326 (WGS84)** for storage and API transfer. Source data from the CoCT may be in **EPSG:22279 (Lo19)** and must be transformed upon import using `ST_Transform`.
    -   **Source:** `CLAUDE.md §9 (Geographic Scope)`, `docs/OPEN_QUESTIONS.md`

---

## GIS FEATURE IDEATION — Based on Your Research

| Feature Idea | Description | Data Source(s) | Primary Persona | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Zoning Overlay** | Visualize CoCT zoning polygons on the map with clickable popups showing zone type and regulations. | CoCT ArcGIS REST Service (Zoning) | Developer, Investor | MVP-essential |
| **Valuation Display** | Show the latest official property valuation from the General Valuation Roll. | CoCT Open Data (GV Roll CSV) | Investor, Agent | MVP-essential |
| **Proximity Analysis** | Find features within a specified distance of a point or property (e.g., "schools within 1km"). | PostGIS (`ST_DWithin`), Overpass API | Developer, Agent | MVP-essential |
| **Suburb Analytics** | Display aggregated statistics (avg. price, sales volume) for Cape Town suburbs. | PostGIS (pre-aggregated from GV Roll) | Investor, Researcher | High-value extension |
| **Environmental Risk** | Overlay fire risk and coastal flood zone polygons. | WCG / CoCT Spatial Data | Developer, Investor | High-value extension |
| **Live Activity Heatmap** | Visualize real-time foot traffic or vehicle movement patterns. | `[UNVERIFIED]` Real-time data feed (e.g., MobilityDB) | Investor | Speculative |
| **Land-Use Change**| Detect changes in land use over time from satellite imagery. | `[UNVERIFIED]` Satellite imagery archive (e.g., Sentinel) | Researcher | Speculative |

---

PLANNING PROMPT 2 COMPLETE. Research Brief ready for human review.
Awaiting approval before proceeding to Planning Prompt 3.
