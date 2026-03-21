# API_STATUS.md — External Data Source Availability

> Verified HTTP status codes for external ArcGIS REST and OGC services used by CapeTown GIS Hub.
> Updated by DATA-AGENT during MP3 (ArcGIS Proxy + Cache Warmer).

---

## Source 1 — City of Cape Town ArcGIS REST Services

| Field               | Value                                                                                                                                                                                   |
|---------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **URL**             | `https://citymaps.capetown.gov.za/agsext1/rest/services?f=json`                                                                                                                         |
| **HTTP Status**     | **404 Not Found**                                                                                                                                                                       |
| **Date Tested**     | 2026-03-21                                                                                                                                                                              |
| **Agent**           | DATA-AGENT (MP3)                                                                                                                                                                        |
| **Access Method**   | Direct GET request via httpx                                                                                                                                                            |
| **Response Body**   | IIS 404 error page — "File or directory not found"                                                                                                                                      |
| **Conclusion**      | Service directory is **unavailable**. The `/agsext1/` path appears to have been removed or renamed. This is NOT an authentication issue (401/403) — the endpoint itself does not exist. |
| **Fallback Action** | Activate MOCK fallback for all CoCT ArcGIS layers. Use Western Cape GIS or CoCT Open Data Portal as alternative sources where available.                                                |

### Layer Index

Not available — service directory returns 404.

---

## Source 2 — Western Cape Government Spatial Data Warehouse

| Field              | Value                                                         |
|--------------------|---------------------------------------------------------------|
| **URL**            | `https://gis.westerncape.gov.za/server2/rest/services?f=json` |
| **HTTP Status**    | **200 OK**                                                    |
| **Date Tested**    | 2026-03-21                                                    |
| **Agent**          | DATA-AGENT (MP3)                                              |
| **Access Method**  | Direct GET request via httpx                                  |
| **ArcGIS Version** | 11.3                                                          |
| **Authentication** | None required for service directory enumeration               |

### Available Folders (17)

| Folder                | Description (inferred)                       |
|-----------------------|----------------------------------------------|
| DCAS                  | Dept of Cultural Affairs and Sport           |
| DEADP                 | Dept of Environmental Affairs & Dev Planning |
| DLG                   | Dept of Local Government                     |
| DOH                   | Dept of Health                               |
| DOI-HS                | Dept of Infrastructure — Human Settlements   |
| DOI-Transport         | Dept of Infrastructure — Transport           |
| DotP                  | Dept of the Premier                          |
| Geocoders             | Geocoding services                           |
| GTI_RestrictedUseData | Green Tech Innovation (restricted)           |
| OpenDataPortal        | Open data layers                             |
| PDO                   | Provincial Data Office                       |
| Routing               | Network routing services                     |
| SG_Data               | Surveyor General data                        |
| SpatialDataWarehouse  | Provincial spatial data warehouse            |
| test                  | Test services                                |
| Utilities             | Utility services                             |
| WCED                  | Western Cape Education Dept                  |

---

## Source 3 — City of Cape Town Open Data Portal

| Field              | Value                                                   |
|--------------------|---------------------------------------------------------|
| **URL**            | `https://odp-cctegis.opendata.arcgis.com/`              |
| **HTTP Status**    | **200 OK**                                              |
| **Date Tested**    | 2026-03-21                                              |
| **Type**           | ArcGIS Hub / Open Data Portal (HTML + API)              |
| **API Endpoint**   | `https://odp-cctegis.opendata.arcgis.com/api/v3/search` |
| **Authentication** | Public access (no auth required for search/metadata)    |

---

## Summary Table

| Source                        | URL                                            | Status | Auth Required | Usable |
|-------------------------------|------------------------------------------------|--------|---------------|--------|
| CoCT ArcGIS REST (agsext1)    | citymaps.capetown.gov.za/agsext1/rest/services | 404    | N/A           | ❌ No   |
| WC Gov Spatial Data Warehouse | gis.westerncape.gov.za/server2/rest/services   | 200    | No            | ✅ Yes  |
| CoCT Open Data Portal         | odp-cctegis.opendata.arcgis.com                | 200    | No            | ✅ Yes  |

---

*Last updated: 2026-03-21 by DATA-AGENT (MP3)*
