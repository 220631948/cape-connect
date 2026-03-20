---
name: arcgis-to-maplibre
description: Converts ArcGIS Feature Layers to MapLibre GeoJSON/PMTiles, including CRS reprojection.
---

# ArcGIS to MapLibre Skill

## Purpose

Seamlessly integrate ArcGIS Feature Layers into the MapLibre-based `capegis` ecosystem. Handles the complex reprojection and normalization required to move data from the Esri ecosystem to the open-source spatial stack.

## Inputs

- **Feature Layer URL:** (e.g., `https://services.arcgis.com/.../FeatureServer/0`)
- **API Key:** (Optional, will prompt if required).

## Procedure

### 1. Metadata Inspection

- Detect the coordinate reference system (CRS) from the layer metadata.
- **Verification:** Confirm the presence of a supported spatial reference (e.g., 4326, 3857, or 102100).

### 2. Reprojection Planning

- If the source is not `EPSG:4326`, use `proj4` (or `postgis-pipeline` MCP tool) to plan the transformation.
- **Rule:** All `capegis` data must be stored in `EPSG:4326`.

### 3. Paged Extraction

- Extract all features using the ArcGIS REST API pagination (typically 1,000 features per page).
- **Normalization:** Map ArcGIS attributes to the `capegis` property model (camelCase).

### 4. Format Conversion

- Write the final dataset as a GeoJSON file in `public/data/`.
- **Optionally:** Invoke `pmtiles-pipeline` to generate a PMTiles v3 archive for offline support if the dataset is large (>10k features).

## Outputs

- **GeoJSON File:** Generated in `public/data/`.
- **PMTiles File:** Generated if requested.
- **Conversion Log:** Detailed mapping of ArcGIS fields to `capegis` properties.

## Registration

- Manual developer tool for data ingestion.
- **Pre-commit:** Not recommended for this skill due to network dependency.

## Read-only Audit Mode

- **Flag:** `--audit`
- Reports the feature count and metadata without performing the extraction or conversion.
