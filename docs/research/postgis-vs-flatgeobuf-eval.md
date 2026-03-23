# Evaluation: PostGIS vs FlatGeobuf for Vector Data Offload

**Date:** 2026-03-22
**Status:** DRAFT / RESEARCH
**Task:** Evaluate Vector Data PostGIS vs FlatGeobuf requirements

## Executive Summary
The CapeTown GIS Hub currently uses a hybrid approach where vector data is fetched from external ArcGIS endpoints via Next.js API routes and cached in PostGIS (Supabase). For large datasets like "Parcels" or complex "Zoning" layers, this approach introduces latency and database overhead. FlatGeobuf (FGB) offers a cloud-native, binary alternative that enables random access over HTTP, potentially reducing costs and improving client-side performance.

## Current State Analysis
- **Sources:** External ArcGIS FeatureServers (CoCT ODP).
- **Delivery:** Next.js API Routes (`/api/zoning`, `/api/suburbs`) acting as proxies.
- **Caching:** Supabase `cache` table (JSONB storage).
- **Frontend:** MapLibre GL JS using `type: 'geojson'`.

## Comparison Matrix

| Feature | PostGIS / Martin (Current) | FlatGeobuf (Proposed Offload) |
|---------|----------------------------|-------------------------------|
| **Latency** | Medium (Proxy + DB Fetch) | Low (Direct GCS Stream) |
| **Data Size** | Unlimited (Server-side query) | Large (Random access range requests) |
| **Spatial Query** | Strong (ST_Intersects, etc.) | Limited (Bounding Box only) |
| **Cost** | Database Storage + Compute | GCS Storage + Egress (Lower) |
| **Complexity** | High (API, Auth, Cache logic) | Low (Static file + FGB library) |
| **Offline** | Hard (requires sync) | Easier (FGB is a single file) |

## Recommendations

### 1. Offload Static Boundaries (Suburbs, Ward Boundaries)
Small, static layers should be moved to FlatGeobuf immediately.
- **Benefit:** Removes dependency on ArcGIS uptime and Next.js proxying for common basemap layers.
- **Implementation:** Pre-generate FGB via GitHub Action or manual script.

### 2. The "Parcels" Challenge
Land parcels are too large for GeoJSON (often 50MB+). FlatGeobuf is the **only viable serverless way** to serve these with random access without a dedicated tile server (Martin).
- **Recommendation:** Use FlatGeobuf for Parcels, hosted on GCS with public read access (respecting POPIA).

### 3. Keep PostGIS for "Live" / Interactive Data
Any data requiring user writes, complex spatial joins (e.g., "Find firms within 500m of this walk corridor"), or strict RLS should remain in PostGIS.

## Plan Deviation Assessment
> ⚠️ **PLAN_DEVIATION:** Adopting FlatGeobuf is not in the core `CLAUDE.md` stack. 
> **Justification:** Essential for meeting the < $20/mo cost target by reducing Supabase JSONB storage and Next.js execution time.

## Next Steps
1. [ ] Implement a prototype FGB loader in `src/lib/gis/fgb-loader.ts`.
2. [ ] Convert `public/mock/suburbs.geojson` to `.fgb` and test performance.
3. [ ] Update `ZoningLayer.tsx` to support FGB source type.
