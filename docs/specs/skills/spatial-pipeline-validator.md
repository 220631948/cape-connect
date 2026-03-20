---
name: spatial-pipeline-validator
description: Audits spatial health of the entire project, including GeoJSON mocks, Supabase storage refs, and PostGIS geometries.
---

# Spatial Pipeline Validator Skill

## Purpose

Automate the verification of spatial data integrity across the entire project lifecycle, from mock data to production storage. Ensures compliance with CRS contracts and geographic scope.

## Inputs

- **Scope:** Root directory of the `capegis` project.
- **Files:** `public/mock/*.geojson`, `public/data/*.geojson`, and Supabase Storage references.

## Procedure

### 1. File Discovery

- Scan `public/mock/` and `public/data/` for all `.geojson` files.
- Query Supabase metadata for active spatial storage references.

### 2. Geometry Validation

For each file:

- Call `postgis-pipeline` MCP tool `ST_IsValid` to verify geometry structure.
- **P0 Error:** Feature count is zero or file is unreadable.
- **Warning:** Over 10,000 features in a single GeoJSON (suggests switch to Martin MVT).

### 3. CRS Verification

- Check CRS metadata in GeoJSON.
- **Error:** CRS is NOT EPSG:4326.
- **Warning:** CRS metadata is missing (assume 4326 but flag).

### 4. BBox Sanity Check

- Verify that the `bbox` of the data overlaps with the Cape Town metro bounding box:
  `{ west: 18.0, south: -34.5, east: 19.5, north: -33.0 }`
- **Error:** Data is entirely outside the Cape Town metro.

## Outputs

Writes a detailed health report to `docs/validation/SPATIAL_HEALTH_REPORT.md`.
Exits with non-zero status if any P0 error is found (suitable for CI-gate).

## Registration

- **Pre-commit hook:** Run on all staged `.geojson` files.
- **GitHub Actions:** Part of the `spatial-validation.yml` workflow.

## Audit Mode

- **Flag:** `--read-only`
- In audit mode, it reports findings without attempting to repair geometries or update metadata.
