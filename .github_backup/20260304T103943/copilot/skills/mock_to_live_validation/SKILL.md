---
name: mock-to-live-validation
description: Validate transition from mock data to live GIS endpoint data for Cape Town layers.
---

# Mock-to-Live Data Transition Validation

Invoke before switching any layer from MOCK to LIVE status.

## Steps

1. **Pre-transition:** Confirm endpoint URL is CONFIRMED in `DATA_CATALOG.md`, format is documented, field mapping exists, cache schema is ready, mock matches live schema.
2. **Endpoint Verification:** Test HTTP response code for service directory and test query (Cape Town CBD bbox). Check for auth requirements (401/403). Update `API_STATUS.md`.
3. **Field Mapping:** Compare every live field to documentation. Flag DATA GAPs and UNDOCUMENTED FIELDs.
4. **Data Quality:** Sample 3+ suburbs. Confirm EPSG:4326 coords render correctly, zone codes match IZS, no null geometry, feature count within performance limits.
5. **Badge Update:** Switch layer status to LIVE. Confirm `DataSourceBadge` shows `[LIVE]`. Confirm mock file no longer loaded.
6. **Rollback:** Document procedure: switch to CACHED or MOCK, update badge, log failure in `API_STATUS.md`.
