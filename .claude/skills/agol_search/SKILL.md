---
name: agol_search
description: >
  Search ArcGIS Online (City of Cape Town's AGOL org at odp-cctegis.opendata.arcgis.com)
  for datasets. Returns filtered results with metadata: item ID, title, type, updated date,
  license, download URL. Flags non-EPSG:4326 items.
__generated_by: self-evolve-pass-2026-03-14
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Standardize discovery of City of Cape Town open datasets on ArcGIS Online.
Replaces manual WebFetch from RESEARCHER agent with a structured, safe-defaults search.
Only searches within the Cape Town AGOL org. Returns metadata needed for provenance_tag.

## Trigger Conditions

- "search arcgis online", "find agol dataset", "cape town open data portal"
- RESEARCHER agent dataset discovery phase
- DATA-AGENT pre-import dataset validation
- Before running `/provenance-record` (to get correct metadata)

## Procedure

1. **Construct AGOL REST API query:**
   ```
   GET https://odp-cctegis.opendata.arcgis.com/api/search/v1/items
     ?q=<search_term>
     &f=json
     &num=10
     &start=1
     &orgid=<cape_town_org_id>
   ```
   Apply safe defaults: always scope to `odp-cctegis.opendata.arcgis.com`.

2. **For each result — extract metadata:**
   - `id`: AGOL item ID
   - `title`: dataset name
   - `type`: Feature Layer, File Geodatabase, CSV, etc.
   - `modified`: last updated (Unix timestamp → ISO 8601)
   - `licenseInfo`: license text (classify: open vs. proprietary)
   - `accessInformation`: attribution text
   - `url`: access URL / service endpoint
   - `extent`: bounding box (verify within Cape Town bounds)

3. **Filter results:**
   - Exclude items with proprietary or unknown licenses → flag as ⚠️ PROPRIETARY
   - Flag items where `extent` is NOT within Cape Town bbox → mark ⚠️ OUT_OF_SCOPE
   - Flag items with CRS other than EPSG:4326 or EPSG:3857 → mark ⚠️ REPROJECT_NEEDED

4. **Return structured result:**
   For each item: ID, title, type, updated date, license classification, download URL, flags.

5. **If a promising result found:**
   Suggest next steps: run `provenance_tag` with returned metadata.

## Output Format

```
=== AGOL SEARCH RESULTS ===
Query: "suburb boundaries" | Org: odp-cctegis.opendata.arcgis.com

ID              TITLE                  TYPE           UPDATED     LICENSE  FLAGS
abc123def       Suburb Boundaries CT   Feature Layer  2023-06-01  CC-BY    ✅
xyz789ghi       City Zoning 2022       File GDB       2022-03-15  OGL      ⚠️ REPROJECT
...

Top result: Suburb Boundaries CT (abc123def)
Download: https://odp-cctegis.opendata.arcgis.com/datasets/abc123def/...
Next: /provenance-record suburb-boundaries-ct --source <url> --license CC-BY --date 2023-06
```

## When NOT to Use

- For datasets not from City of Cape Town AGOL (use `cape_town_gis_research` instead)
- For datasets on data.gov.za or odp.capetown.gov.za (use WebFetch directly)
- For PostGIS table searches (use `schema_smells` or postgres MCP)
- For Lightstone data (Rule 8 — never use Lightstone)
