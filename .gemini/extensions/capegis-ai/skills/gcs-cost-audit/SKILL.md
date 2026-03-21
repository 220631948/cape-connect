---
name: gcs-cost-audit
description: |
  Audit and optimize Google Cloud Storage (GCS) storage and egress costs.
  Prevents runaway cloud costs associated with heavy raster (COG) egress.
---

# GCS Cost Audit Skill

## Capability
Estimates monthly GCS costs and provides autonomous recommendations for optimization based on actual usage metrics.

## Triggers
- "Check GCS costs"
- "Audit storage budget"
- "How much is the [bucket] costing?"

## Instructions
1. Run the estimation script: `./scripts/estimate_gcs_cost.sh <bucket_name>`.
2. Analyze the stdout for Storage, Egress, and Ops costs.
3. If the total exceeds the $30 budget ceiling, summarize the warnings.
4. Suggest Terraform changes:
   - Enable Cloud CDN for egress reduction.
   - Configure lifecycle rules (Nearline/Coldline).
   - Verify if rasters are properly optimized as Cloud Optimized GeoTIFFs (COGs).

## Tools / Commands
- `./scripts/estimate_gcs_cost.sh`: Primary estimation tool.
- `mcp__vercel`: To check if environment variables for cost thresholds are set.

## Example
User: "Audit the costs for the capegis-rasters bucket."
Action: Run `./scripts/estimate_gcs_cost.sh capegis-rasters`, parse output, and recommend enabling Cloud CDN if egress is high.
