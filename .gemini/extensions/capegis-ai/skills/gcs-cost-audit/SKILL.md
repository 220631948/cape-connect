---
name: gcs-cost-audit
description: Estimate and optimize GCS storage and egress costs for CapeTown GIS Hub.
version: 1.0.0
---

# GCS Cost Audit

## Capability
This skill executes specialized scripts to analyze the storage usage and egress patterns of GCS buckets, providing actionable insights for FinOps optimization.

## Triggers
- User asks "How much is GCS costing us?"
- User asks to "audit cloud costs."
- Before major data migrations or infrastructure changes.

## Instructions
1.  Ensure `gcloud` CLI is authenticated and the correct project is set.
2.  Run the cost estimation script.
3.  Analyze the output for "high-cost" items (e.g., standard storage for cold data, high egress regions).
4.  Recommend lifecycle policy updates or regional shifts.

## Tools / Commands
- `bash scripts/estimate_gcs_cost.sh`: Executes the full GCS cost audit and outputs a summary.

## Examples
User: "Perform a cost audit on our raster storage."
Action: `bash scripts/estimate_gcs_cost.sh`
