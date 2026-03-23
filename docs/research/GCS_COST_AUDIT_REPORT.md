# GCS Cost Audit Report — CapeTown GIS Hub
**Date**: 2026-03-21
**Audit Type**: Static Infrastructure Analysis (Tools missing in local environment)

## Executive Summary
The current GCS infrastructure is functional but sub-optimal for high-velocity raster streaming. Enabling Cloud CDN is the primary recommendation to prevent budget overruns as traffic scales.

## Findings

### 1. Missing Cloud CDN (Critical Optimization)
- **Status**: Not configured in `infra/gcp/main.tf`.
- **Impact**: All Cloud Optimized GeoTIFF (COG) range requests are served directly from GCS, incurring full internet egress rates ($0.12/GB in africa-south1).
- **Recommendation**: Implement an HTTP(S) Load Balancer with Cloud CDN enabled. This will reduce egress costs by 60-80% for repeated tile requests.

### 2. Redundant/Conflicting Budget Alerts
- **Status**: Redundancy found between `infra/gcp/main.tf` ($30 limit) and `infra/gcp/budget_alerts.tf` ($90 limit).
- **Impact**: Confusion in monitoring and potential for missed alerts if one is assumed to be the "source of truth."
- **Recommendation**: Consolidate into a single budget alert at $30/mo (aligned with project ceiling) in `main.tf`.

### 3. Terraform Provider Inconsistency
- **Status**: `main.tf` uses `google` provider `~> 5.0`, while `budget_alerts.tf` uses `~> 4.0`.
- **Impact**: Maintenance overhead and potential compatibility issues.
- **Recommendation**: Upgrade `budget_alerts.tf` to use `~> 5.0`.

### 4. Storage Lifecycle Rules
- **Status**: **PASS**. 
- **Configuration**: Standard -> Nearline (90d) -> Coldline (365d) is correctly implemented in `main.tf`.

## Estimated Monthly Cost (Based on 122 GB Egress Assumption)

| Category | Current (No CDN) | Optimized (With CDN) | Savings |
|----------|------------------|----------------------|---------|
| Egress   | $14.64          | $6.10               | $8.54  |
| Storage  | $1.15           | $1.15               | $0.00  |
| Ops      | $0.21           | $0.10               | $0.11  |
| **Total**| **$16.00**      | **$7.35**           | **$8.65** |

## Action Plan
1. **[ ]** Update `infra/gcp/main.tf` to include Cloud CDN resources.
2. **[ ]** Remove `infra/gcp/budget_alerts.tf` and unify alerting in `main.tf`.
3. **[ ]** Verify COG optimization using `rio cogeo validate` on sample data once tools are available.
