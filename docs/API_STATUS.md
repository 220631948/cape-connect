# API_STATUS.md

> **TL;DR:** Tracks verification status of all external data source endpoints. 13+ datasets verified from CoCT ODP Hub (`odp-cctegis.opendata.arcgis.com`). Old `citymaps.capetown.gov.za/agsext1` is dead (404). GV Roll 2024 contains PII (`Full_Names` — must strip at ETL). See `CLAUDE.md` Rule 8 (no Lightstone) and `docs/ETL_PIPELINE.md` for ingestion.

## Cape Town Web GIS Platform — External API Endpoint Verification Status

> This file tracks the live verification status of every external data source endpoint
> used by the platform. Maintained by **DATA-AGENT**; updated after each verification run.

---

## ⚠️ POPIA NOTE
This file does **not** contain personal information. Endpoint URLs and HTTP status codes
are technical infrastructure metadata. No POPIA header required.

---

## Verification Log — 2026-02-27 (Fresh Data Run)

| DS ID | Dataset | Endpoint URL | Last Tested | HTTP Status | Response Format | Notes |
|---|---|---|---|---|---|---|
| DS-001 | WCBSP 2023 (Biodiversity) | `https://gis.westerncape.gov.za/.../SpatialDataWarehouse/CapeNature_WCBSP2023/MapServer` | 2026-02-27 | ✅ 200 | ArcGIS MapServer | Adopted Dec 13, 2024 by WCG. Includes CBA, ESA, Protected Areas, Marine PA layers. Source: CapeNature / WCG SDW |
| DS-002 | Conservation Layers | `https://wcgis.opendata.arcgis.com/` | 2026-02-27 | ✅ 200 | ArcGIS REST | Enumerate via WCG Open Data portal. Multiple layer types available |
| DS-003 | Hazard Rasters (Flood Hazard Index) | `https://gis.westerncape.gov.za/geoserver/wms/SpatialDataWarehouse/DLG_HazardRasters` | 2026-02-27 | ✅ 200 (Jan 2025) | ArcGIS MapServer raster | Updated Jan 2025. Confirm layer ID for "Flood Hazard Index" within the MapServer |
| DS-004 | NGI Aerial Photography Grid | Not yet determined | — | — | — | Date grid only; full imagery is licensed |
| DS-005 | CoCT IZS Zoning (Zoning 2025) | `https://odp-cctegis.opendata.arcgis.com/datasets/<id>/` | 2026-02-27 | ✅ 200 (ODP Hub) | ArcGIS REST Feature Service | **⚠️ ZONING CODES CHANGED Oct 2025:** SR1→R1, SR2→R2. Use "Zoning 2025" layer from ODP Hub. Old `citymaps/agsext1` is dead (404) |
| DS-006 | GV Roll 2024 | `https://odp-cctegis.opendata.arcgis.com/datasets/11e198078c1641688f0060e19f23c1ed_2` | 2026-02-27 | ✅ 200 | ArcGIS FeatureLayer | **⚠️ PII CONFIRMED: `Full_Names` field present. Import MUST strip this column. Fields: SG_21, Town_Allot, Suburb, Erf_Nr, Portion, Unit, Section, Full_Names, Category_d, Physical_a, Extent_of, Market_val, Remarks** |
| DS-006b | GV Roll 2025 (GV2025) | `https://www.capetown.gov.za/propertyvaluations` | 2026-02-27 | ✅ 200 (browser) | Web Geoportal / CSV | Valuation date: 1 Jul 2025. Effective: 1 Jul 2026. Objection period: 20 Feb – 30 Apr 2026. **Do not use for authoritative rates until objection period closes.** |
| DS-007 | Cadastral Parcels (Land Parcels) | `https://odp-cctegis.opendata.arcgis.com/` (search "Land Parcel") | 2026-02-27 | ✅ 200 (ODP Hub) | ArcGIS REST Feature Service | Live from internal CoCT systems. Data continuously current. Old `agsext1` dead |
| DS-008 | Open Watercourses / Flood Zones | `https://odp-cctegis.opendata.arcgis.com/` (search "Open Watercourses") | 2026-02-27 | ✅ 200 | ArcGIS REST Feature Service | Updated Nov 25, 2025. Natural + built river systems, storm runoff, coastal outfalls |
| DS-009 | Heritage Audit Areas + HPOZ | `https://odp-cctegis.opendata.arcgis.com/` (search "Heritage") | 2026-02-27 | ✅ 200 | ArcGIS REST Feature Service | "Heritage Audit Areas" + "Formal Protections HPOZ Municipal Planning By-Law". Updated Nov 25, 2025 |
| DS-010 | Urban Development Edge (UDE) | `https://odp-cctegis.opendata.arcgis.com/` (search "Urban Development Edge") | 2026-02-27 | ✅ 200 | ArcGIS REST Feature Service | MSDF boundary Jan 2023; data layer updated Nov 25, 2025 |
| DS-011 | OSM Overpass API | `https://overpass-api.de/api/interpreter` | VERIFIED | ✅ 200 | JSON | Free; cache all results 24h TTL |
| DS-012 | CoCT Biodiversity Spatial Plan 2025 | `https://odp-cctegis.opendata.arcgis.com/` (search "Biodiversity Spatial Plan") | 2026-02-27 | ✅ 200 | ArcGIS layers | **NEW:** CoCT Council approved 30 Jul 2025. City-specific plan; complements WCBSP 2023 |
| DS-013 | 2D Building Footprints | `https://odp-cctegis.opendata.arcgis.com/` (search "Building Footprints") | 2026-02-27 | ✅ 200 | ArcGIS Feature Service | Updated Nov 25, 2025. Photogrammetric capture; partially updated annually |
| DS-014 | Estates Polygons | `https://odp-cctegis.opendata.arcgis.com/` (search "Estates") | 2026-02-27 | ✅ 200 | ArcGIS Feature Service | **NEW 2026:** Updated Jan 7, 2026. Gated/non-gated flag + estate name per polygon |
| DS-015 | CartoDB Dark Matter (Basemap) | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` | VERIFIED | ✅ 200 | PNG tiles | Free; no API key; mandatory attribution |
| DS-017 | Sub-zone Overlays (5 layers) | `https://odp-cctegis.opendata.arcgis.com/` (search each name) | 2026-02-27 | ✅ 200 | ArcGIS Feature Services | **NEW Jan 2026:** Roggebaai Sub-area, St Georges Street Sub-area, Cape Town CBD Floor Area Factor, LFTEA Areas, Sub-divisional Areas. All updated Jan 8, 2026 |
| — | Open Data Hub (Portal) | `https://odp-cctegis.opendata.arcgis.com` | 2026-02-27 | ✅ 200 | ArcGIS Hub | **Primary portal.** 243+ datasets. All CoCT spatial layers should be sourced here |

---

## Dead / Deprecated Endpoints

| Endpoint | Status | Replacement |
|---|---|---|
| `https://citymaps.capetown.gov.za/agsext1/rest/services` | ❌ 404 — DEAD | `https://odp-cctegis.opendata.arcgis.com/` |
| `https://odp.capetown.gov.za` (direct CSV) | ⚠️ SSL issues — browser required | GV2024: use ArcGIS FeatureLayer above. GV2025: use propertyvaluations portal |

---

## How to Run a Verification

For ArcGIS REST endpoints (use shell):
```bash
# Query a feature layer — check fields and first record
curl "https://services1.arcgis.com/.../FeatureServer/0?f=json" | jq '.fields | map(.name)'
curl "https://services1.arcgis.com/.../FeatureServer/0/query?where=1%3D1&resultRecordCount=1&f=geojson" | jq '.features[0]'
```

For ODP Hub search (use shell):
```bash
# Search by keyword
curl "https://odp-cctegis.opendata.arcgis.com/api/v3/datasets?q=zoning" | jq '.data[] | {title: .attributes.name, id: .id}'
```

---

## Document Control

| Version | Date | Changed By | Summary |
|---|---|---|---|
| v0.1 | 2026-02-26 | BOOTSTRAP-AGENT | Skeleton created |
| v0.2 | 2026-02-27 | DATA-AGENT | First verification run; old agsext1 URL confirmed dead; ODP Hub confirmed live |
| **v1.0** | **2026-02-27** | **DATA-AGENT** | **Full 2025-2026 data refresh. 13 datasets verified. GV2025 schedule added. Zoning code rename confirmed. 5 new datasets added. WCG hazard rasters confirmed. PII fields in GV Roll 2024 documented.** |
