---
name: db-raster-wire-check
description: |
  Verify PostGIS out-db raster references against actual files in GCS.
  Diagnoses broken map layers where metadata points to missing files.
---

# DB Raster Wiring Check Skill

## Capability
Cross-references raster metadata in PostGIS with the availability of the corresponding raster files in Google Cloud Storage.

## Triggers
- "Check raster wiring"
- "Why are rasters not loading?"
- "Verify out-db raster references"

## Instructions
1. Run the wiring script: `scripts/env-raster-wiring.sh --check`.
2. Use `mcp__postgres__query` to list all `out-db` raster URIs from the database.
3. Compare the list with actual file paths in GCS (can use `gsutil ls` or `mcp__filesystem` if mounted).
4. Identify broken links (URIs in DB that don't exist in storage).

## Tools / Commands
- `scripts/env-raster-wiring.sh`: Main wiring configuration and check tool.
- `mcp__postgres`: To query the database for raster URIs.

## Example
User: "Check if all rasters in the database are correctly wired to GCS."
Action: Query Postgres for raster paths, check their existence in GCS, and report missing files.
