---
name: db-raster-wire-check
description: Verify PostGIS out-db raster references against actual files in GCS.
version: 1.0.0
---

# DB Raster Wire Check

## Capability
This skill validates that all "out-db" raster records in the PostGIS database point to valid, accessible objects within the configured GCS buckets, diagnosing "broken map layers" before deployment.

## Triggers
- User asks to "check raster connections."
- User asks "Are any map layers broken?"
- Before running database migrations that involve rasters.

## Instructions
1.  Connect to the PostGIS database using the `postgres` tool.
2.  Query for all raster columns using `ST_BandFile` or custom reference fields.
3.  Cross-reference the resulting URIs against the `gcloud storage ls` output.
4.  Report any "dangling" references (database records with no matching file).

## Tools / Commands
- `mcp__postgres__query("SELECT ...")`: Used to extract raster URIs from the database.
- `gcloud storage ls <uri>`: Used to verify file existence.

## Examples
User: "Verify all out-db raster links are valid."
Action: `mcp__postgres__query("SELECT filename FROM raster_metadata WHERE out_db = true")` followed by GCS checks.
