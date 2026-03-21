---
name: stac-catalog-sync
description: |
  Sync and validate SpatioTemporal Asset Catalog (STAC) metadata for geospatial rasters.
  Ensures malformed metadata doesn't break frontend layer fetching.
---

# STAC Catalog Sync Skill

## Capability
Automates the generation and validation of STAC metadata for rasters hosted in GCS or local directories.

## Triggers
- "Sync STAC catalog"
- "Generate STAC metadata for [directory/bucket]"
- "Validate STAC catalog"

## Instructions
1. Run the generation script: `python scripts/generate_stac_catalog.py --path <target_path>`.
2. Analyze the generated `catalog.json` (or similar).
3. Verify required fields: `id`, `type`, `stac_version`, `description`, `extent`, `links`.
4. Use Gemini to check for logical consistency (e.g., temporal extent matches filenames).

## Tools / Commands
- `python scripts/generate_stac_catalog.py`: Main generation tool.
- `mcp__gis-mcp__validate_geometry`: For verifying bounding box extents in metadata.

## Example
User: "Sync the STAC catalog for the 2024 aerial imagery in gs://capegis-rasters/aerial-2024"
Action: Run `python scripts/generate_stac_catalog.py gs://capegis-rasters/aerial-2024`, read output, and validate metadata.
