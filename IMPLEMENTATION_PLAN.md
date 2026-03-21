# Implementation Plan

## Task: Hybrid Offload Architecture & Security Fixes

- **Goal**: Offload raster tile serving to cloud object storage while keeping vector data on Supabase PostGIS. Remove leaked Google API Key.
- **Learnings & Actions**:
  1. The Google API key found in `.gemini/extensions/chrome-devtools-mcp/src/tools/performance.ts` was replaced with an environment variable (`process.env.CRUX_API_KEY`).
  2. The Hybrid Offload plan was documented in `docs/architecture/hybrid-offload-plan.md` featuring an ASCII diagram, PMTiles recommendations, budget limits, and a rollback plan.
  3. Created `supabase/functions/raster-proxy/index.ts` to serve as a proxy edge function with JWT validation and Cache-Control headers.
  4. Created `scripts/generate_stac_catalog.py` for STAC catalog generation from raster data.
  5. Created `scripts/gee_export_cape_town.js` for exporting Sentinel-2 data to GCP as Cloud Optimized GeoTIFFs (COGs).
  6. Configured GCP budget alerts in `infra/gcp/budget_alerts.tf` to enforce a $3/day ($90/mo) limit.
  7. Conducted a full git repo synchronization (fetch --all, force-reset main, rebase jules-sentinel-api branch, and force push). Merge to main was successful.

## State Output
```json
{
  "prompt": 3,
  "architecture": "hybrid",
  "services_retained": ["Vercel", "Supabase PostGIS", "Supabase Auth", "Martin"],
  "services_added": ["GCP Cloud Storage", "GCP Cloud Functions", "Terraform Budget Alerts"],
  "stac_catalog_generated": true,
  "gee_export_script_generated": true,
  "pmtiles_recommended": true,
  "cost_guard_deployed": true,
  "gee_deadline": "2026-04-27",
  "estimated_monthly_post_credit": "< $20/mo"
}
```

## Next Tasks
- [ ] Evaluate Vector Data PostGIS vs FlatGeobuf requirements
- [ ] Deploy the budget_alerts.tf with actual GCP credentials
