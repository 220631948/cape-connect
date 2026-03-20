---
name: cape-town-gis-research
description: Research protocol for Cape Town and Western Cape GIS data sources.
---

# Cape Town GIS Data Research Protocol

Invoke when researching any Cape Town or Western Cape spatial data.

## Phase 1 — Primary Sources
- **City of Cape Town Open Data Portal** (odp.capetown.gov.za): zoning, flood zones, GVR.
- **CoCT GIS REST Services**: Enumerate ArcGIS REST service directory first. NEVER hardcode URLs.
- **Western Cape Government Spatial Data Warehouse**: Provincial datasets (biodiversity, fire hazard).
- **SANBI BGIS**: National/provincial biodiversity data.

## Phase 2 — Verification
For each source: (a) Auth check (401/403?), (b) Licence review, (c) Format check (prefer GeoJSON / ArcGIS REST JSON), (d) Coverage check (Cape Town specific?), (e) Currency check.

## Phase 3 — Document
Add to `docs/DATA_CATALOG.md` with status: CONFIRMED / LIKELY / UNCERTAIN.

## Phase 4 — Cape Town Specifics
Check for: Urban Edge, Heritage Protection Zones, MyCiTi BRT feeds, Cape Flats ethical concerns, Coastal setback lines.

## Phase 5 — Negative Results
Explicitly log `DATA_GAP` status for sources that cannot be found/accessed.
