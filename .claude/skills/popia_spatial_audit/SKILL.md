---
name: popia-spatial-audit
description: Extended POPIA compliance audit specifically for spatial data — checks for location-based PII, movement tracking, residential address inference.
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
---

# POPIA Spatial Audit Skill

## Purpose
Extended POPIA compliance audit specifically for spatial data — checks for location-based PII, movement tracking, residential address inference. Goes beyond the standard POPIA skill by addressing the unique privacy risks that arise from geographic and temporal location data.

## Trigger
Invoke when:
- Any spatial dataset is imported, processed, or displayed that could reveal personal information through location
- Adding parcel-level data that links to property owners
- Processing flight paths or vehicle tracking data
- Displaying point-level data that could identify individuals
- Temporal data reveals movement patterns of identifiable persons
- Combining datasets where spatial join could expose PII

## Procedure

### Step 1 — Scan for Residential Parcel Linkage
```sql
-- Check if spatial data can be joined to residential parcels with owner info
SELECT COUNT(*) FROM imported_data d
JOIN cadastral_parcels p ON ST_Within(d.geom, p.geom)
WHERE p.land_use IN ('RESIDENTIAL', 'RESIDENTIAL_MIXED');
```

**Risk levels:**
| Linkage Type | Risk | Action |
|-------------|------|--------|
| Point in residential parcel | HIGH | Aggregate to suburb level for guests |
| Polygon overlapping residential | MEDIUM | Remove owner details in display |
| Line through residential area | LOW | No individual identification likely |

### Step 2 — Check Flight Path → Individual Tracking Potential
For aviation/drone data:
- Private aircraft registration → owner identification (HIGH risk)
- Repeated flight patterns → personal movement inference (HIGH risk)
- Commercial airline flights → no individual tracking (LOW risk)

```typescript
function assessFlightPrivacy(track: FlightTrack): RiskLevel {
  if (track.callsign?.match(/^(SAA|FA|MN|KQ)/)) return 'LOW';    // Commercial
  if (track.isPrivate && track.repeated > 3) return 'HIGH';        // Pattern
  return 'MEDIUM';
}
```

### Step 3 — Verify Aggregate-Only Display for Guest Mode
Guest users must NEVER see:
- Individual property owner details
- Individual movement tracks
- Point-level data at residential addresses
- Any data linkable to a specific person

```typescript
function enforceGuestAggregation(features: Feature[], userRole: Role): Feature[] {
  if (userRole === 'GUEST') {
    return aggregateToSuburb(features); // Aggregate points to suburb polygons
  }
  return features;
}
```

### Step 4 — Check Temporal Data for Movement Pattern Inference
Temporal + spatial data creates **movement profiles**:
```
Risk Matrix:
  Spatial precision HIGH + Temporal precision HIGH = CRITICAL RISK
  Spatial precision HIGH + Temporal precision LOW  = HIGH RISK
  Spatial precision LOW  + Temporal precision HIGH = MEDIUM RISK
  Spatial precision LOW  + Temporal precision LOW  = LOW RISK
```

Mitigations:
- Snap timestamps to 1-hour intervals for guest display
- Reduce spatial precision to suburb centroid for aggregate views
- Never store individual movement sequences without explicit consent

### Step 5 — Ensure Spatial Data Retention Policies
| Data Type | Retention | Justification |
|-----------|-----------|---------------|
| Real-time positions (OpenSky) | 30 days | Operational monitoring |
| Cached API responses | Per `api_cache.expires_at` | Performance |
| Historical tracks | 90 days | Planning analytics |
| Reconstruction imagery | 1 year | Asset lifecycle |
| Property valuation (GV Roll) | Until next GV Roll | Statutory |

```sql
-- Enforce retention via scheduled cleanup
DELETE FROM api_cache WHERE expires_at < NOW();
DELETE FROM flight_tracks WHERE created_at < NOW() - INTERVAL '90 days';
```

### Step 6 — Validate Consent for Location-Based Personal Data
Required consent checks:
```typescript
interface SpatialConsentChecklist {
  dataContainsLocationPII: boolean;      // Can location identify a person?
  consentObtained: boolean;              // Explicit opt-in?
  consentScope: string;                  // What was consented to?
  purposeLimitation: string;             // Specific use case
  rightToErasure: boolean;               // Can we delete on request?
  crossBorderTransfer: boolean;          // Data leaving SA?
  dataMinimisation: boolean;             // Only necessary precision?
}
```

## Output
POPIA Spatial Audit Report:
```
═══════════════════════════════════════
 POPIA SPATIAL AUDIT REPORT
 Dataset: [name]
 Date: [ISO 8601]
 Auditor: [agent]
═══════════════════════════════════════

 Risk Score: [LOW | MEDIUM | HIGH | CRITICAL]

 ☐ Residential parcel linkage:  [PASS | FAIL | N/A]
 ☐ Individual tracking potential: [PASS | FAIL | N/A]
 ☐ Guest mode aggregation:      [PASS | FAIL | N/A]
 ☐ Movement pattern inference:   [PASS | FAIL | N/A]
 ☐ Retention policy compliance:  [PASS | FAIL | N/A]
 ☐ Consent validation:           [PASS | FAIL | N/A]

 Required Annotations: [list of files needing POPIA blocks]
 Recommended Actions:  [specific mitigations]
═══════════════════════════════════════
```

## When NOT to Use This Skill
- Non-personal geographic data (zoning boundaries, terrain elevation, land cover)
- Aggregate statistical data with no individual linkage
- Public infrastructure data (roads, utilities) with no owner information
- Mock/test data in `public/mock/` with synthetic coordinates
