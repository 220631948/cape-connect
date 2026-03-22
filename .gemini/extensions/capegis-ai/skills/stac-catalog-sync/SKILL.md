---
name: stac-catalog-sync
description: Validates and syncs STAC (SpatioTemporal Asset Catalog) metadata for spatial assets.
version: 1.0.0
---

# STAC Catalog Sync

## Capability
This skill allows the agent to generate and synchronize STAC metadata for newly ingested geospatial rasters and vectors, ensuring they are discoverable and compliant with project standards.

## Triggers
- User asks to "sync metadata" for a specific spatial asset.
- User asks to "generate STAC catalog" for a directory of rasters.
- Post-ingestion verification steps.

## Instructions
1.  Locate the spatial asset (GeoTIFF, GeoPackage, etc.).
2.  Run the STAC generation script.
3.  Validate the generated JSON against the STAC 1.0.0 specification.
4.  Commit the metadata to the repository or upload to the STAC API endpoint.

## Tools / Commands
- `python scripts/generate_stac_catalog.py --input <path_to_asset> --output <path_to_metadata>`: Generates STAC metadata for a single asset.
- `python scripts/sync_stac_registry.py`: Syncs local STAC files with the central registry.

## Examples
User: "Sync the STAC metadata for the sentinel2 export."
Action: `python scripts/generate_stac_catalog.py --input Sentinel2_CT.tif --output sentinel2_stac.json`
