# 08 Executive Summary & Recommendations

> **TL;DR:** The winning 2026 GeoSaaS stack is Supabase (PostGIS) + Martin (Rust MVT) + MapLibre GL JS (WebGPU) + Next.js 15 App Router. ArcGIS and Python are data pipelines/intelligence engines, not the core web delivery. Top risks: load-shedding resilience, POPIA data sovereignty, CoCT data reliability (three-tier fallback mandatory), and Lo19→WGS84 projection accuracy.
>
> **Roadmap Relevance:** M0–M15 — this document governs the entire architecture. Directly informs technology selection for every milestone.

## 1. Executive Summary
To build a world-class, white-label GIS SaaS for Cape Town and the Western Cape in 2026, we must move away from heavy, monolithic GIS servers and embrace a **"Thin-Server, Thick-Client"** architecture. By combining **Supabase (PostGIS)** for secure, multi-tenant storage, **Martin** for blazingly fast vector tile delivery, and **MapLibre GL JS (with WebGPU)** for high-performance rendering, we can deliver a premium property intelligence experience that scales effortlessly. Our research strongly suggests that while "official" ArcGIS and Python stacks are powerful, they should be used as "Data Pipelines" and "Intelligence Engines" rather than the core web-delivery mechanism.

## 2. Recommended Architecture
The 2026 "Gold Standard" for GeoSaaS:

```mermaid
graph TD
    User((Property Developer)) -->|HTTPS/Next.js 15| Frontend[MapLibre GL JS + React]
    Frontend -->|Async Fetch| Next.js 15[Next.js App Router]
    Next.js 15 -->|Supabase Auth| Auth[GoTrue / RLS]
    Next.js 15 -->|RPC/SQL| PostGIS[(Supabase / PostgreSQL 18)]
    Frontend -->|MVT Vector Tiles| Martin[Martin Tile Server / Rust]
    Martin -->|Direct Query| PostGIS
    DataPipeline[ArcGIS REST JS / Python] -->|Sync| ArcGISHub[City of Cape Town ArcGIS Hub]
    DataPipeline -->|Upsert| PostGIS
```

## 3. Prioritised Roadmap

| Phase | Timeline | Key Milestone |
| :--- | :--- | :--- |
| **MVP (Phase 1)** | 4–6 Weeks | Supabase RLS Schema, MapLibre PoC, Martin Tile Integration. |
| **Expansion (Phase 2)** | 2–3 Months | Suburb Analytics, PDF Reports (Recharts), ArcGIS Hub Sync. |
| **Intelligence (Phase 3)** | 6 Months+ | GeoAI (pgvector), MobilityDB for real-time tracking, custom Python analysis. |

## 4. Decision Matrix

| Technology | Score (1–10) | Verdict |
| :--- | :--- | :--- |
| **PostGIS (Supabase)** | 10 | **Mandatory.** Backbone of the project. |
| **MapLibre GL JS** | 9.5 | **Mandatory.** Best performance/3D support. |
| **Martin Tile Server** | 9.0 | **Highly Recommended.** Essential for macro views. |
| **Next.js 15** | 9.0 | **Mandatory.** Modern, async-first framework. |
| **ArcGIS REST JS** | 8.5 | **Recommended.** Cleanest bridge to City data. |
| **pgRouting** | 4.0 | **Optional.** Defer to Phase 3. |
| **MapServer** | 2.0 | **Reject.** Use Martin or pg_tileserv instead. |

## 5. Top 5 Risks (South Africa Context)
1.  🚩 **Load-Shedding Resilience:** Next.js 15 App Router must use aggressive PWA caching (Workbox) to ensure the map remains interactive during sudden 2-4 hour connectivity drops.
2.  🚩 **Data Sovereignty (POPIA):** While using Supabase is convenient, we must ensure the data is stored in an "Adequate" region (e.g., EU-West) or the Cape Town region if Supabase makes it available, to comply with POPIA cross-border transfer rules.
3.  🚩 **Open Data Reliability:** The City of Cape Town ArcGIS services can be intermittent. Our **Three-Tier Fallback (Live -> Cache -> Mock)** is a requirement, not a feature.
4.  🚩 **Namecheap DNS Edge Cases:** While reliable, Namecheap's DNS propagation can sometimes lag in SA. We recommend using **Cloudflare** as the nameserver proxy for faster global updates and better DDoS protection.
5.  🚩 **Coordinate Projection Errors:** We MUST standardize on **EPSG:4326** for our API and storage. Converting Lo19 (City data) to WGS84 on-the-fly in PostGIS must be strictly audited to avoid "parcels in the ocean."

## 6. Next 3 Actionable Steps
1.  **Switch to `supabase start`:** Abandon the `kartoza/postgis` image assumption for local dev. Use the official Supabase CLI to ensure Auth and RLS work exactly like production.
2.  **Benchmark Martin Tile Server:** Set up a small Martin container pointing to a sample of Cape Town's parcel data (~100k polygons) and verify performance in MapLibre.
3.  **Implement the Next.js 15 Async Header Pattern:** Update the middleware to propagate `tenant_id` to Supabase GUCs immediately to verify the RLS isolation works.
