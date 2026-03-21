# Open Questions — CapeTown GIS Hub

Tracking register for blocking decisions that require human verification.

---

## OQ-NEW-B — Watercourse Buffer Distance for Trading Bay Suitability

| Field                  | Value                                          |
|------------------------|------------------------------------------------|
| **Status**             | PENDING VERIFICATION                           |
| **Blocks**             | MP1 — Trading Bay Suitability endpoint         |
| **Default Value Used** | 10 metres (National Water Act general setback) |
| **Confidence**         | Low — by-law may specify a different distance  |
| **Date Raised**        | 2026-03-21                                     |

### Research Performed

1. **CoCT Informal Trading By-law 2023** — attempted to fetch from
   lawlibrary.org.za ([C8](https://www.lawlibrary.org.za/ZA/gov/za/munic/wc/011/by-law/2023/informal-trading/eng@2023-08-23)).
   URL returns HTTP 404. Document not available online at this URL as of 2026-03-21.
2. **OpenByLaws.org.za** — searched `za-cpt/act/by-law/2009/informal-trading/`. No watercourse-specific buffer distance
   found in the indexed text.
3. **National Water Act (Act 36 of 1998)** — Section 21(c) and (i) activities require a general setback of **10 metres**
   from the edge of a watercourse for most activities. This is the commonly cited minimum.

### Current Implementation

The `spatial_analysis.py` service uses a **configurable** `WATERCOURSE_BUFFER_M` constant (default: **10.0 metres**)
that can be updated once the exact by-law distance is verified. The value is NOT hardcoded inline — it is defined once
as a named constant.

### Action Required

- [ ] Download the CoCT Informal Trading By-law 2023 from the City of Cape Town municipal website or request from the
  drainage planner
- [ ] Extract the exact watercourse buffer distance (may vary by watercourse class)
- [ ] Update `WATERCOURSE_BUFFER_M` in `backend/app/services/spatial_analysis.py`
- [ ] Update this entry to VERIFIED with the source citation

### RALPH FLAG

> "The 10m watercourse buffer is from the National Water Act. I am not inventing it.
> Verify the exact buffer distance with the drainage planner persona before hardcoding 10m.
> It may differ by watercourse class."

---

## OQ-001 — City of Cape Town ArcGIS REST Service Authentication Status

| Field             | Value                             |
|-------------------|-----------------------------------|
| **Status**        | **RESOLVED** ✓                    |
| **Blocks**        | MP3 — ArcGIS Proxy + Cache Warmer |
| **Date Raised**   | Pre-project (inherited)           |
| **Date Resolved** | 2026-03-21                        |
| **Resolved By**   | DATA-AGENT (MP3)                  |

### Evidence

| Endpoint                                                        | HTTP Status | Result                             |
|-----------------------------------------------------------------|-------------|------------------------------------|
| `https://citymaps.capetown.gov.za/agsext1/rest/services?f=json` | **404**     | IIS "File or directory not found"  |
| `https://gis.westerncape.gov.za/server2/rest/services?f=json`   | **200**     | ArcGIS 11.3, 17 folders, no auth   |
| `https://odp-cctegis.opendata.arcgis.com/`                      | **200**     | CoCT Open Data Portal (HTML + API) |

### Conclusion

The CoCT ArcGIS REST service directory at `/agsext1/` **does not exist** (HTTP 404). This is NOT an authentication
issue (401/403) — the endpoint path itself has been removed or renamed. The Western Cape Government Spatial Data
Warehouse is available as an alternative source (no auth required). Mock fallback activated for all CoCT layers.

Full details: `docs/API_STATUS.md`

---

## OQ-NEW-A — GV Roll Format (CSV or PDF?)

| Field      | Value                                              |
|------------|----------------------------------------------------|
| **Status** | PENDING                                            |
| **Blocks** | MPA — OCR milestone (may not be needed if CSV)     |
| **Action** | Download from odp.capetown.gov.za and check format |

---

## OQ-NEW-C — Railway Redis Celery Result Backend

| Field      | Value                                              |
|------------|----------------------------------------------------|
| **Status** | PENDING                                            |
| **Blocks** | MP5                                                |
| **Action** | Test with Railway Redis URL in local Celery config |

---
