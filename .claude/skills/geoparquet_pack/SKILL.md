---
name: geoparquet_pack
description: >
  Package GIS layers into GeoParquet format with CRS metadata, Cape Town bbox in file
  metadata, and POPIA annotation if personal data present. Validates output with
  geopandas.read_parquet() smoke test. For batch processing and external tool integration.
__generated_by: self-evolve-pass-2026-03-14
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Enable efficient large-dataset exchange between the PostGIS database, analysis tools
(Python/GeoPandas), and external consumers. GeoParquet provides columnar storage with
embedded CRS metadata, making it ideal for the GV Roll, cadastral parcels, and analysis
result exports that are too large for GeoJSON serving.

## Trigger Conditions

- "geoparquet", "pack layer", "export parquet", "analytical export"
- EXPORT-AGENT exporting analysis results from ExportPanel
- DATA-AGENT packaging large datasets for external tools
- When GeoJSON export > 10MB (switch to GeoParquet for efficiency)

## Procedure

1. **Accept inputs:**
   - Layer name / PostGIS table name
   - Output path (e.g., `exports/<name>.parquet`)
   - Filter conditions (optional: date range, bbox, tenant_id)
   - Flag: `--include-popia-annotation` if personal data present

2. **Query PostGIS for the layer:**
   ```python
   import geopandas as gpd
   gdf = gpd.read_postgis(
     f"SELECT * FROM {table} WHERE tenant_id = '{tenant_id}' AND ST_Within(geom, bbox)",
     con=engine, geom_col='geom', crs='EPSG:4326'
   )
   ```
   Apply tenant_id filter (RLS enforcement at query level — Rule 4).
   Apply Cape Town bbox filter (Rule 9).

3. **Add file metadata:**
   ```python
   gdf.attrs['crs'] = 'EPSG:4326'
   gdf.attrs['bbox'] = { 'west': 18.0, 'south': -34.5, 'east': 19.5, 'north': -33.0 }
   gdf.attrs['source'] = '<provenance_id>'
   gdf.attrs['generated_at'] = datetime.utcnow().isoformat()
   ```

4. **If `--include-popia-annotation`:**
   Add to file metadata:
   ```python
   gdf.attrs['popia'] = {
     'personal_data': '<list>',
     'purpose': '<purpose>',
     'lawful_basis': '<basis>',
     'retention': '<period>'
   }
   ```

5. **Write GeoParquet:**
   ```python
   gdf.to_parquet(output_path, index=False, compression='snappy')
   ```

6. **Smoke test — validate output:**
   ```python
   gdf_check = gpd.read_parquet(output_path)
   assert len(gdf_check) == len(gdf), "Row count mismatch"
   assert gdf_check.crs.to_epsg() == 4326, "CRS mismatch"
   assert gdf_check.total_bounds[0] >= 18.0, "Bbox violation"
   ```

7. **Report:** output path, file size, row count, CRS, bbox, POPIA annotation status.

## Output Format

```
=== GEOPARQUET PACK ===
Layer: valuation_data (tenant: abc-corp)
Features: 45,832 | CRS: EPSG:4326 ✅ | Bbox: within Cape Town ✅
POPIA: annotated (personal_data: owner_name, property_value)
Output: exports/valuation-data-abc-corp-2026-03-14.parquet
File size: 8.2 MB (vs ~45 MB GeoJSON)
Smoke test: ✅ PASS (45,832 rows, EPSG:4326, bbox OK)
```

## When NOT to Use

- For files < 1MB (GeoJSON is simpler for small datasets)
- For MapLibre/browser serving (use PMTiles or GeoJSON instead)
- For sharing with non-technical users (GeoJSON is more universally readable)
- Without running the smoke test (always validate output)
