# Dataset Registry — CapeTown GIS Hub

> **Authoritative index** of all curated datasets for the research lab.
> Individual manifests live alongside this file as `ds-NNN-*.yaml`.
> Last updated: 2026-03-05 | Curator: Data Curator agent

---

## Summary Table

| ID | Name | Source | License | Privacy (1–5) | POPIA | Refresh | Status |
|----|------|--------|---------|:-------------:|:-----:|---------|--------|
| [ds-001](./ds-001-gv-roll-2022.yaml) | CoCT General Valuation Roll 2022 | odp.capetown.gov.za (bulk CSV) | Open Government Licence (SA) | **4** | ✅ Yes | Static / ~4-yearly | APPROVED |
| [ds-002](./ds-002-izs-zoning.yaml) | CoCT Integrated Zoning Scheme (IZS) | odp-cctegis ArcGIS REST | Open Government Licence (SA) | 1 | ❌ No | Monthly | APPROVED |
| [ds-003](./ds-003-cadastral-parcels.yaml) | CoCT Cadastral Parcels | odp-cctegis ArcGIS REST | Open Government Licence (SA) | **2** | ⚠️ Conditional | Weekly | APPROVED |
| [ds-004](./ds-004-osm-amenities.yaml) | OSM Amenities — Cape Town Metro | Overpass API | ODbL 1.0 | 1 | ❌ No | Weekly | APPROVED |
| [ds-005](./ds-005-opensky-flights.yaml) | OpenSky Network ADS-B Flights | OpenSky REST API | CC BY 4.0 (non-commercial) | **2** | ❌ No | Real-time | PENDING (OQ-016) |
| [ds-006](./ds-006-spacenet8.yaml) | SpaceNet 8 Building Footprints | AWS S3 open dataset | CC BY-SA 4.0 | 1 | ❌ No | Static | APPROVED (Phase 2) |

**Status key:** APPROVED = cleared for use | PENDING = awaiting legal/compliance resolution | Phase 2 = deferred to Phase 2 milestones

---

## Re-Identification Risk: Data Combination Warnings

### ⚠️  HIGH RISK — GV Roll + Cadastral Parcels

| Combination | Risk Level | Mitigation |
|-------------|:----------:|------------|
| `ds-001.erf_nr` + `ds-003.erf_no` (spatial join only, no PII) | LOW | Permitted — join key is non-PII |
| `ds-001.Full_Names` (pre-strip) + `ds-003.geometry` | **CRITICAL** | Full_Names must be dropped *before* any join or DB load |
| `ds-001` (post-strip) + `ds-003` + Deeds Office records | **HIGH** | External enrichment with ownership data is prohibited |
| `ds-001` (post-strip) + `ds-003` + `ds-002.zone_code` | LOW | Aggregate zoning analysis — no PII path |

**Mandatory rule:** GV Roll (`ds-001`) and Cadastral Parcels (`ds-003`) may only be joined **inside the secured PostgreSQL database layer** with RLS enforced. The combined result **must never be exported with any owner field**. Violation would constitute processing of personal information under POPIA Section 1.

### ⚠️  MODERATE RISK — OpenSky + Cadastral/Points of Interest

| Combination | Risk Level | Mitigation |
|-------------|:----------:|------------|
| `ds-005.icao24` + public ICAO ownership registries | MODERATE | Private/charter operators may be identified — treat as sensitive |
| `ds-005` flight paths over residential parcels (`ds-003`) | LOW | Aggregate statistics only; no individual tracking |

---

## Approved Data Join Patterns

```
PERMITTED (DB-only, RLS enforced):
  valuation_data (ds-001, PII stripped) ──erf_nr──► cadastral_parcels (ds-003)
  cadastral_parcels (ds-003) ──spatial──► izs_zoning (ds-002)
  valuation_data (ds-001) ──suburb──► amenities (ds-004) [aggregate only]

PROHIBITED:
  ds-001.Full_Names → any table (must be dropped at ETL Phase 2)
  ds-001 + ds-003 → CSV/file export with owner data
  ds-005 live data → paid tenant endpoints (until OQ-016 resolved)
  Any dataset → Lightstone enrichment (CLAUDE.md Rule 8)
```

---

## Licensing Summary

| Dataset | Share-alike? | Attribution Required | Commercial Notes |
|---------|:------------:|---------------------|-----------------|
| GV Roll 2022 | No | "City of Cape Town" | Permitted |
| IZS Zoning | No | "City of Cape Town" | Permitted |
| Cadastral Parcels | No | "City of Cape Town" | Permitted |
| OSM Amenities | **Yes (ODbL)** | "© OpenStreetMap contributors" | Permitted; derived DBs must be ODbL |
| OpenSky ADS-B | No (BY 4.0) | "OpenSky Network" | Non-commercial only; see OQ-016 |
| SpaceNet 8 | **Yes (SA 4.0)** | "SpaceNet 8 dataset" | Permitted; derived datasets must be CC BY-SA |

---

## Open Issues

| Ref | Dataset | Issue |
|-----|---------|-------|
| OQ-016 | ds-005 | Commercial licensing for OpenSky on paid tenant tiers unresolved — do not go LIVE for paid tenants until legal sign-off |

---

## Recommendations

1. **Always strip `Full_Names`** during GV Roll ETL before any DB operation (enforced in `docs/ETL_PIPELINE.md`).
2. **Join GV Roll + Cadastral Parcels in DB only** — never export the combined result with any owner-related field.
3. **OpenSky non-commercial path only** until OQ-016 is resolved. MOCK fallback must be ready before Phase 2 launch.
4. **ODbL share-alike** for OSM-derived data: any new database built from `ds-004` must be published under ODbL 1.0.
5. **SpaceNet 8 share-alike**: ML models trained on SpaceNet 8 that produce derivative datasets must be released CC BY-SA 4.0.
6. **Cache TTLs** are authoritative in `docs/DATA_LIFECYCLE.md §2`; manifests reflect the same values.
