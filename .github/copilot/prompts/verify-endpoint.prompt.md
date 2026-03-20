---
description: Verify a Cape Town GIS data source endpoint and document findings.
name: verify-endpoint
tools: ['fetch', 'editFiles']
---

Verify a Cape Town GIS data source endpoint using the `.github/skills/cape_town_gis_research/SKILL.md` protocol:

1. **Test the endpoint URL** — record the HTTP response code.
2. **Check for authentication** — 401/403 indicates registration required.
3. **Verify the data format** — confirm matches expected (GeoJSON, esriJSON, WFS, WMS).
4. **Check geographic coverage** — does it cover Cape Town specifically?
5. **Check currency** — when was the dataset last updated?
6. **Verify the licence** — note redistribution permissions.

Update these files:
- `docs/DATA_CATALOG.md` — add/update the source entry with status (CONFIRMED / LIKELY / UNCERTAIN / DATA_GAP).
- `docs/API_STATUS.md` — log the endpoint test result.

If the endpoint is unreachable, log as UNREACHABLE and note the date.
