# Task: Spatial Agent — POPIA-Compliant Zoning Intersections

> **TL;DR:** Intersect a user-drawn polygon with Cape Town zoning layers and return zone stats + property data gated by authentication, role, and explicit POPIA consent.

**Priority:** M8 (Phase 2)
**Status:** PLANNED — Pending M7 completion
**Agent:** spatial-agent
**Created:** 2026-03-11
**Dependencies:** M7 (OpenSky flight layer), M5 (Zoning overlay), M1 (Database schema + RLS)

---

## 1. Objective

Enable authenticated users to draw an arbitrary polygon on the map and receive a POPIA-compliant spatial intersection report: which zoning districts overlap the selection, the area breakdown per zone type, and (for authorised roles with explicit consent) aggregate property counts. Guests and low-privilege roles receive zone geometry only — never owner names, ERF numbers, or property-level PII.

---

## 2. Inputs

| Input | Source | Required |
|-------|--------|----------|
| User-drawn GeoJSON polygon | `DrawControl` component (Turf.js validated) | YES |
| `tenant_id` | Supabase session JWT (`app.current_tenant`) | YES |
| `role` | JWT claim (`user_role`) | YES |
| `popia_consent` flag | `profiles.popia_consent` (DB lookup) | YES (for property data) |
| Zoning layer data | `api_cache` table or Martin MVT endpoint | YES |

All polygon coordinates must fall within bbox `{ west: 18.0, south: -34.5, east: 19.5, north: -33.0 }` (Rule 9).

---

## 3. Outputs

| Output | Condition | Format |
|--------|-----------|--------|
| Intersecting zone GeoJSON | Always (all roles) | `FeatureCollection` |
| Zone statistics (count, area m² per zone type) | Always (all roles) | JSON object |
| Property count per zone | `ANALYST+` role + `popia_consent = true` | Integer (aggregated) |
| Full property list (address, erf, owner) | `POWER_USER+` role + `popia_consent = true` | JSON array |
| Source badge metadata | Always | `{ source, year, tier: LIVE|CACHED|MOCK }` |

---

## 4. Processing Logic

```
1. Receive polygon → validate GeoJSON structure (Turf.js)
2. Validate all vertices within Cape Town bbox → reject with 422 if outside
3. Check session → extract tenant_id, role, popia_consent
4. If GUEST → proceed to step 7 (zone geometry only)
5. If VIEWER or higher:
     a. Query profiles table for popia_consent flag
     b. If popia_consent = false → treat as GUEST for property data
6. Execute PostGIS intersection query (see §9) with RLS active
7. Apply RBAC filter on result set:
     GUEST / no-consent  → zones + area stats only
     VIEWER + consent    → zones + area stats only
     ANALYST + consent   → zones + area stats + aggregated property count
     POWER_USER+ consent → zones + area stats + full property list
8. If property data returned → INSERT into audit_log (user_id, tenant_id,
   action='zoning_intersection', payload_hash, timestamp)
9. Attach source badge to response
10. Return response (never expose raw SQL errors to client)
```

---

## 5. POPIA Considerations

### Personal Data in Zoning Intersections

Property-level data (owner name, ERF number, street address, valuation) constitutes personal data under POPIA §1. Zone codes and geometric intersections do not — they are geographic metadata.

| Data Element | Personal Data? | Minimum Role | Requires Consent |
|---|---|---|---|
| Zone code / description | No | GUEST | No |
| Intersection area (m²) | No | GUEST | No |
| Property count (aggregate) | Borderline | ANALYST | Yes |
| Street address | Yes | POWER_USER | Yes |
| ERF / SG number | Yes | POWER_USER | Yes |
| Owner name | Yes | POWER_USER | Yes |

### Guest Mode Restrictions
- No property counts, no addresses, no owner data
- No persistent storage of query polygon
- Maximum 3 intersection queries per session before sign-up prompt

### Consent Mechanism
- `popia_consent` must be `true` in `profiles` before any property data leaves the API
- Consent prompt must reference specific purpose: "property count within drawn area"
- Consent withdrawal: re-sets flag; audit_log entries are retained (legal obligation)

### Audit Log Requirement
Every response that includes property data must log to `audit_log`:
```
user_id, tenant_id, action, polygon_bbox, result_property_count, timestamp
```
Never log the raw polygon geometry (excessive retention).

---

## 6. Fallback Checklist

### Zoning Layer
| Tier | Source | Trigger |
|------|--------|---------|
| LIVE | ArcGIS REST API (`odp-cctegis.opendata.arcgis.com`) | Normal operation |
| CACHED | `api_cache` table (TTL 24 h) | ArcGIS unreachable / rate-limited |
| MOCK | `public/mock/zoning.geojson` | Cache stale or absent |

Badge: `City of Cape Town Zoning · 2024 · [LIVE|CACHED|MOCK]`

### Property Count
| Tier | Source | Trigger |
|------|--------|---------|
| LIVE | PostGIS spatial query (valuation_data table) | Authenticated + consent |
| CACHED | Aggregated stats in `api_cache` (property_count_by_zone) | DB query timeout |
| N/A | No mock — PII must never be fabricated | — |

Badge: `GV Roll 2022 · CCT · [LIVE|CACHED]`

**Rule:** If property count unavailable and role requires it, return zone data with `property_count: null` and badge `[UNAVAILABLE]`. Never show a fabricated count.

---

## 7. Acceptance Criteria

- [ ] AC-01: Polygon outside Cape Town bbox returns HTTP 422 with descriptive error
- [ ] AC-02: Guest user receives zone GeoJSON + area stats; response contains zero PII fields
- [ ] AC-03: Authenticated user with `popia_consent = false` receives same response as Guest
- [ ] AC-04: ANALYST role + consent receives `property_count` integer per zone; no addresses
- [ ] AC-05: POWER_USER role + consent receives full property list; fields: address, erf, zone
- [ ] AC-06: Every property-data response writes one row to `audit_log` within the same transaction
- [ ] AC-07: Source badge present on every response at all three fallback tiers
- [ ] AC-08: RLS policy enforces `tenant_id` — cross-tenant data never returned
- [ ] AC-09: MOCK fallback activates automatically; map never shows blank or unhandled error
- [ ] AC-10: Intersection query completes in < 2 s for polygons ≤ 5 km² (P95, local Docker)
- [ ] AC-11: Files implementing this feature carry full POPIA annotation block (Rule 5)
- [ ] AC-12: No raw PostGIS error messages exposed in API response body

---

## 8. Undocumented Dependency Flags

- `[ASSUMPTION — UNVERIFIED]` PostGIS `ST_Intersection` performance on large zone polygons (> 10 km²) — may require geometry simplification pre-query or GIST index confirmation.
- `[ASSUMPTION — UNVERIFIED]` ArcGIS zoning layer field names (`zone_code`, `zone_description`) — must be verified against live API before implementation; fields may have changed since M5 research.
- `[ASSUMPTION — UNVERIFIED]` Rate limiting for the polygon intersection API endpoint is not yet defined — recommend 10 req/min per tenant as a starting point (requires human approval).
- `[ASSUMPTION — UNVERIFIED]` `profiles.popia_consent` column exists with correct type (`boolean NOT NULL DEFAULT false`) — confirm against M1 migration before coding.
- `[ASSUMPTION — UNVERIFIED]` `audit_log` table schema supports `polygon_bbox` and `result_property_count` columns — verify or add migration.

---

## 9. SQL Example

```sql
-- Zoning intersection query (spatial-agent pattern)
-- $1: GeoJSON polygon string from user DrawControl
SELECT
  z.code          AS zone_code,
  z.description   AS zone_name,
  ST_AsGeoJSON(
    ST_Intersection(z.geometry, ST_GeomFromGeoJSON($1))
  )               AS intersection_geom,
  ST_Area(
    ST_Intersection(z.geometry, ST_GeomFromGeoJSON($1))::geography
  )               AS area_sqm
FROM zones z
WHERE
  z.tenant_id = current_setting('app.current_tenant', TRUE)::uuid
  AND ST_Intersects(z.geometry, ST_GeomFromGeoJSON($1))
ORDER BY area_sqm DESC;
```

> Ensure a GIST spatial index exists on `zones.geometry` before production use.
> Use `ST_Intersects` in the WHERE clause (fast index scan) and `ST_Intersection` in SELECT only (expensive, post-filter).

---

## 10. Edge Cases

| # | Scenario | Expected Behaviour |
|---|----------|--------------------|
| EC-01 | Polygon spans Cape Town / Western Cape provincial boundary | Clip to bbox; warn user; return partial intersection |
| EC-02 | Polygon is a single point or line (degenerate geometry) | Reject with 422 "Polygon must have ≥ 3 non-collinear vertices" |
| EC-03 | Drawn polygon self-intersects | Auto-repair with `ST_MakeValid`; log warning; continue |
| EC-04 | Zone layer cache is stale AND ArcGIS is down | Serve MOCK; badge shows `[MOCK]`; no error thrown |
| EC-05 | User revokes `popia_consent` mid-session | Subsequent requests treated as no-consent; in-flight request completes; no new audit log |
| EC-06 | Intersection result is empty (polygon in ocean / unzoned area) | Return empty `FeatureCollection`; stats `{ total_zones: 0 }`; HTTP 200 |
| EC-07 | `tenant_id` missing from JWT (misconfigured client) | RLS rejects query; API returns 403; no data leaks |
| EC-08 | Polygon covers > 50 km² (unusually large draw) | Warn user; execute with 500 ms query timeout extension; badge `[SLOW_QUERY]` |
| EC-09 | PostGIS `ST_Intersection` returns `GEOMETRYCOLLECTION EMPTY` for a zone | Skip that zone in result set; do not count toward stats |
| EC-10 | POWER_USER requests property list but valuation_data table is locked | Return zone stats only; `property_list: null`; badge `[UNAVAILABLE]`; do not error |
