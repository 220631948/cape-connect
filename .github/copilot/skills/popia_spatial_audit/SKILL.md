---
name: popia-spatial-audit
description: Extended POPIA compliance audit specifically for spatial data — checks for location-based PII, movement tracking, residential address inference.
---

# POPIA Spatial Audit

Invoke when any spatial dataset is imported, processed, or displayed that could reveal personal information through location.

## Checklist

1. **Residential Parcel Linkage:** Check if spatial data can be joined to residential parcels with owner info. Points in residential parcels = HIGH risk → aggregate to suburb level for guests.
2. **Flight Path / Individual Tracking:** Private aircraft registration → owner identification (HIGH). Repeated flight patterns → movement inference (HIGH). Commercial flights → LOW risk.
3. **Guest Mode Aggregation:** Guests must NEVER see individual property owner details, individual movement tracks, point-level residential data, or any data linkable to a person. Enforce `aggregateToSuburb()`.
4. **Movement Pattern Inference:** Spatial HIGH + Temporal HIGH = CRITICAL. Mitigate: snap timestamps to 1-hour intervals for guests, reduce precision to suburb centroids, never store individual movement sequences without consent.
5. **Retention Policies:** Real-time positions: 30 days. Cached API: per `expires_at`. Historical tracks: 90 days. Imagery: 1 year. GV Roll: until next roll. Enforce via scheduled cleanup.
6. **Consent Validation:** Check: does location identify a person? Is consent obtained? Is purpose limited? Can we erase on request? Is data leaving SA? Is precision minimised?

## Output Format
```
POPIA SPATIAL AUDIT REPORT
Risk Score: [LOW | MEDIUM | HIGH | CRITICAL]
☐ Residential parcel linkage:   [PASS | FAIL | N/A]
☐ Individual tracking potential: [PASS | FAIL | N/A]
☐ Guest mode aggregation:       [PASS | FAIL | N/A]
☐ Movement pattern inference:    [PASS | FAIL | N/A]
☐ Retention policy compliance:   [PASS | FAIL | N/A]
☐ Consent validation:            [PASS | FAIL | N/A]
```

## When NOT to Use
- Non-personal geographic data (zoning, terrain, land cover), aggregate statistics, public infrastructure, mock/test data.
