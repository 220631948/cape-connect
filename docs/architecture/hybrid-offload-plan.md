# Hybrid Offload Plan

This document outlines the architecture, rationale, and cost-guard rails for offloading raster tile serving to cloud object storage.

## SECTION 1 – SERVICE MAP

ASCII architecture diagram illustrating what stays, what moves, and what is added:

```
[Browser/CesiumJS/MapLibre]
          |
          |──➤ STAYS: Vercel CDN (Next.js SSR, Edge Functions)
          |           env: NEXT_PUBLIC_RASTER_BASE_URL=https://storage.{{platform}}.com/{{bucket}}
          |
          |──➤ STAYS: Supabase (PostGIS vector tiles via Martin, Auth, Realtime)
          |           out-db rasters: raster metadata in DB ➔ pixel data in cloud
          |
          └──➤ NEW: {{CLOUD}} Object Storage (rasters as COGs)
                    {{CLOUD}} Serverless Function (GeoTIFF ➔ COG ➔ STAC ingest)
```

## SECTION 3 – COG SERVING FOR CESIUMJS + MAPLIBRE

### Approach

- **CesiumJS terrain/imagery:** Use `UrlTemplateImageryProvider` to request tiled formats. Large rasters will be pre-tiled using `rio-tiler` or served directly via the proxy edge function.
- **MapLibre raster layer:** Use COG range requests directly.

### Recommendation: PMTiles for Raster Layers

We strongly recommend pre-generating PMTiles files for all Cape Town raster layers.
- **Why PMTiles?** PMTiles is a single-file archive format. Instead of distributing millions of individual PNG tiles, a single file can be requested natively by MapLibre (and CesiumJS via adapters) using HTTP range requests.
- **Cost Savings:** Eliminates the per-tile request charges typical of S3/GCS. Users only pay for the exact byte ranges fetched.

## SECTION 6 – COST GUARD RAILS

Cloud budget alert configuration (IaC) is set up to fire when:
- Daily spend > $3 (= ~$90/mo)
- Egress > 50 GB/mo
- Storage > 100 GB

**Actions on alert:**
- Disable public access.
- Notify via email / Slack webhook.

*(See `infra/gcp/budget_alerts.tf` for implementation)*

## SECTION 7 – ROLLBACK PLAN

If cloud costs exceed the budget, follow these steps to revert:

1. **Re-enable Supabase Storage** for new uploads.
2. **Update Environment Variable:** Change `NEXT_PUBLIC_RASTER_BASE_URL` to point back to the Supabase storage URL.
3. **Maintain Read-Only Access:** Keep existing cloud storage read-only until migration back is fully completed to avoid disruption for cached/in-flight static assets.
4. **Database intact:** No database schema changes are needed since out-db URIs are strings.

## Success Criteria

✓ Zero changes to Supabase schema for vector data
✓ CesiumJS temporal scrubber can query STAC API for raster dates
✓ COGs served with HTTP range requests (no full-file downloads)
✓ GEE export pipeline operational before April 27, 2026 deadline
✓ Monthly cost < $20 after $200 GCP credit depletes
✓ Rollback to Supabase Storage requires only env var change
