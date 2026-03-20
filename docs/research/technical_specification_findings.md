# Technical Architecture Specification: High-Performance Multi-Tenant Geospatial Platform (CapeTown GIS Hub)

> **TL;DR:** Full architecture spec for high-performance multi-tenant GIS: Martin MVT for 800k+ features, MapLibre rendering optimization (minzoom/maxzoom, feature-state for hover), Serwist PWA with true offline via IndexedDB (200MB+), POPIA Privacy-by-Design with Section 72 cross-border controls, and HPCDPC data localisation for CII datasets. Performance targets: P95 tile load < 400ms on 10Mbps.
>
> **Roadmap Relevance:** M0–M15 — authoritative technical specification. Directly governs rendering performance, offline strategy, and POPIA compliance across all milestones.


> **Date**: 26 February 2026  
> **Status**: Final Specification  
> **Target Region**: Cape Town & Western Cape, South Africa  
> **Compliance**: POPIA & Data Localisation Mandates

---

## 1. Project Vision and Strategic Alignment
The **CapeTown GIS Hub** is engineered as a high-performance, resilient geospatial ecosystem designed to serve as the definitive spatial decision-support tool for the Western Cape. In alignment with South Africa’s **Fourth Industrial Revolution (4IR)** goals, the platform bridges cutting-edge WebGL/WebGPU rendering with rigorous adherence to local data governance.

The architecture prioritizes **Technological Sovereignty**, utilizing an open-source aligned stack (Next.js 16, PostGIS, Martin) to reduce legacy dependency while ensuring **Infrastructure Resilience** against regional constraints like Stage 6 load shedding through "True Offline" capabilities.

---

## 2. High-Performance Rendering & Update Models
To manage massive municipal datasets—specifically the **General Valuation Roll** and detailed **Cadastres**—frontend performance is optimized using the Mapbox GL JS mathematical model.

### 2.1. The Performance Equation
Optimization requires the minimization of the three core variables of the Mapbox engine:
1.  **Render Time** = $C + (S 	imes t_s) + (L 	imes t_l) + (V 	imes t_v)$
2.  **Source Update Time** = $C + (L_s 	imes t_l) + (V 	imes t_v)$
3.  **Layer Update Time** = $C + (V_{ls} 	imes t_v)$
*(Where $C$=constant, $S$=sources, $L$=layers, $V$=vertices, $t$=time coefficient)*

### 2.2. Optimization Strategies
*   **Vector Tileset Dominance:** For the Valuation Roll (>800k features), we utilize **Martin** to serve vector tiles instead of GeoJSON. We append `?optimize=true` to style URLs to prune unused features at low zoom levels.
*   **Layer Pruning:** We utilize data-driven styling to consolidate property classifications (e.g., Residential vs. Commercial) into a single layer, significantly reducing the $(L 	imes t_l)$ variable.
*   **Targeted Feature States:** Rapid UI feedback (hovering over an Erf) is handled via `feature-state`. This allows the engine to update paint properties without re-parsing geometry, optimizing the **Layer Update Time**.

### 2.3. Spatial Expression Guide
| Approach | More Performant | Less Performant |
| :--- | :--- | :--- |
| **Zoom Filtering** | Explicit `minzoom`/`maxzoom` on layers. | Relying on complex filters to hide features. |
| **Comparison** | Simple equality: `["==", ["get", "type"], "res"]` | Match logic: `["match", ["get", "type"], ...]` |
| **Conditionals** | `all` expressions checking for property existence. | Direct filters on properties that may be null. |
| **Filter Order** | Restrictive conditions first (e.g., `ward_id`) | General conditions (e.g., `geometry-type`) |

---

## 3. PWA Framework & True Offline Support
Field operations in Cape Town’s diverse precincts require "True Offline Support." Unlike a standard "App Shell" model that merely caches the UI, this architecture ensures the application remains functional—allowing for data inspection and collection—when the network is completely absent.

### 3.1. Technical Stack (Serwist & Next.js 16)
The platform utilizes **Serwist** for advanced Service Worker management, implementing a **"Stale-While-Revalidate"** strategy. Assets are served instantly from the cache, while the **Background Sync API** ensures that any field data collected (e.g., informal settlement surveys) is pushed to Supabase once connectivity returns.

### 3.2. Local State: IndexedDB
We utilize **IndexedDB** over LocalStorage to manage spatial data volumes:
*   **Volume:** Supports 200MB+ of attribute data and tile fragments.
*   **Async I/O:** Prevents UI "jank" during map pans while reading local parcels.
*   **Indexing:** Enables complex local queries (e.g., "Find Erf 1234 in local cache").

---

## 4. Backend Geospatial Infrastructure
### 4.1. Supabase and Martin Integration
The core data engine resides in **Supabase (PostGIS)**. For high-concurrency access to cadastral layers, **Martin** (Rust-based) generates tiles on the fly directly from PostGIS functions. This eliminates the need for expensive pre-caching and allows parameter-driven filtering (e.g., "Show only properties valued > R2,000,000").

### 4.2. ArcGIS Location Platform Integration
The platform integrates with the City of Cape Town’s REST directory:
`https://citymaps.capetown.gov.za/agsext1/rest/services?f=json`
*   **Operational Risk:** To ensure service continuity, **Pay-As-You-Go (PAYG)** must be enabled on the ArcGIS Location Platform account to prevent immediate service termination if free geocoding/basemap tiers are exceeded.

---

## 5. Regulatory Compliance & Data Localisation
### 5.1. POPIA Conditions
The platform is built on a **Privacy-by-Design** framework satisfying the eight conditions of POPIA:
1.  **Accountability**: Identifying responsible parties for all spatial data processing.
2.  **Security Safeguards**: Implementing technical measures to prevent unauthorized access via RLS.
3.  **Information Quality**: Maintaining the integrity of the General Valuation Roll during the **Stitch ETL** pipeline.

### 5.2. Localisation of Critical Infrastructure
As per the National Data and Cloud Policy:
*   **Critical Information Infrastructure (CII)**: Municipal datasets identified as CII must be stored within South African borders.
*   **HPCDPC Mandate**: Data generated from South African natural resources (topography, zoning near nature reserves) is ideally stored at the **High Performance Computing and Data Processing Centre (HPCDPC)**.
*   **Cross-Border Flow**: Under **Section 72**, transfers to non-SA regions are only permitted if the recipient jurisdiction provides an "adequate level of protection" or subject to binding corporate rules.

---

## 6. Implementation Roadmap & ICT Channel Risk
### 6.1. Milestones
*   **M0 (Bootstrap)**: Establish governance and data localisation contracts.
*   **M1 (Database)**: Deploy PostGIS with RLS; download GV Roll from Open Data Portal to define schema.
*   **M6 (Live Data)**: Transition to live ArcGIS REST integration via the `?f=json` directory.
*   **M14 (QA)**: Full validation of POPIA security safeguards and HPCDPC data sync.

### 6.2. ICT Channel Agility
Timelines assume a **24-hour validity on hardware quotes**. Global DRAM/NAND imbalances necessitate agile procurement of field-work tablets to avoid 15%–40% cost overruns mid-milestone.

---

## 7. Recommended Google Cloud Integration
| Tool | Application in CapeTown GIS Hub |
| :--- | :--- |
| **Stitch with Google** | Automated ETL for pulling CoCT open-data into PostGIS. |
| **Google Earth Engine** | Land-use classification and environmental risk analysis (Fire/Flood). |
| **BigQuery GIS** | Serverless spatial analytics for region-wide valuation trends. |
| **Vertex AI Gemini** | AI-assisted code generation for complex spatial expressions. |
| **Cloud Logging** | POPIA-compliant audit trails for all data access events. |
