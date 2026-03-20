# GIS SUPER-STACK RESEARCH & ARCHITECTURE SESSION SUMMARY

<!-- Status: COMPLETED | Date: 2026-03-17 -->

## Executive Summary

This session conducted a deep-dive research into the "GIS Super-Stack" for the CapeTown GIS Hub (capegis), evaluating 50-80 tools across 10 domains. The research favors a shift toward "Cloud-Native GIS," where analytical workloads are offloaded to **DuckDB-Spatial** and vector delivery is increasingly handled by serverless **PMTiles v3**.

## Top 10 Tool Recommendations

1.  **DuckDB-Spatial (v1.5.0)**: Use for high-speed on-the-fly analytical queries (10x-50x speedup over PostGIS for OLAP).
2.  **PMTiles v3**: Optimal serverless tiling format for PWA/Offline strategy; reduces dependency on active tile servers for static layers.
3.  **Martin (v0.15.0)**: Retain as the primary Rust-based MVT server for dynamic PostGIS layers.
4.  **SAM-Geo (Segment Geospatial)**: State-of-the-art for automatic feature extraction (e.g., building footprints, swimming pools).
5.  **TorchGeo (v0.6.0)**: PyTorch library for Earth Observation; recommended for land cover classification tasks.
6.  **TiTiler**: Serverless dynamic tile server for Cloud-Optimized GeoTIFFs (COGs).
7.  **Overture Maps**: High-quality open map data (Buildings, Places) as a primary base layer.
8.  **Protomaps**: Recommended for basemap hosting and serverless map delivery.
9.  **Serwist**: Retain for managing PWA service worker tile caching.
10. **H3 (Hexagonal Hierarchical Spatial Index)**: Essential for spatial-temporal ML feature engineering and aggregation.

## Rejected / Deprecated Tools

- **Leaflet**: Rejected for high-performance vector tiles; limited WebGL support compared to MapLibre.
- **MBTiles**: Deprecated in favor of PMTiles for cloud-native/serverless deployment.
- **Shapefile**: Labeled as technical debt due to 2GB limits and field truncation; use for legacy ingestion only.
- **Google Earth Engine (GEE)**: Cautioned due to upcoming Tier Quotas (April 27, 2026).

## Time-Critical Items

- ⚠️ **DEADLINE**: Google Earth Engine (GEE) Tier Quotas take effect **April 27, 2026**. Transition plans should be initiated if budget is not secured.

## Recommended Next Engineering Actions

1.  **DuckDB Implementation**: Implement `/api/analysis` using DuckDB-Wasm for client-side valuation trend analysis.
2.  **PMTiles Migration**: Convert static cadastral and zoning layers to PMTiles hosted on Supabase Storage/S3.
3.  **SAM-Geo Pilot**: Test SAM-Geo for automated verification of building footprints against Sentinel-2 imagery.
4.  **MVT Optimization**: Apply `?optimize=true` to all Martin source URLs as recommended in M17.
5.  **Data Provenance**: Integrate `scripts/pipeline/provenance.py` for every new dataset ingestion.

## Open Questions

- ⚠️ UNCERTAIN: Will the Western Cape PSDI support OGC API - Features by end of 2026?
- ⚠️ UNCERTAIN: Exact cost scaling of private Planet API for the entire CoCT area.
- ⚠️ UNCERTAIN: Impact of Section 72 cross-border controls on Cloudflare Workers usage for spatial clipping.

---

_Verified by GIS Research Swarm | 2026-03-17_
