# ArcGIS/QGIS Formats Research (Normalized)

> **TL;DR:** Browser-friendly path is to normalize ArcGIS/QGIS uploads into GeoJSON (primary) or GeoPackage. Shapefiles require multi-file validation + CRS handling. `.qgz`, `.gdb`, `.mxd`, `.aprx` project files are NOT direct web-renderable — server-side conversion required. Do not promise desktop GIS parity.
>
> **Roadmap Relevance:** M3 (Data Ingestion) — defines the file upload normalization pipeline. Phase 2 GeoFile upload depends on this research.

## Scope
Synthesis of repository findings on ingesting ArcGIS/QGIS formats for browser-centric GIS pipelines.

## Findings (evidence-tagged)
- **[Verified-Repo]** Browser-friendly path is to normalize uploads into interoperable formats (primarily GeoJSON; also GeoPackage where feasible) (`gis-file-formats-research.md`, `GIS_MASTER_CONTEXT.md` §7.4).
- **[Verified-Repo]** Shapefile workflows require multi-file validation (`.shp/.dbf/.shx` + recommended `.prj`) and CRS handling before rendering (`GIS_MASTER_CONTEXT.md` §7.4).
- **[Verified-Repo]** `.qgz/.qgs` and ArcGIS project files are documented as project/container artifacts, not direct Cesium-native data sources (`gis-file-formats-research.md`, `GIS_MASTER_CONTEXT.md` §7.4).
- **[Verified-Repo]** Large or proprietary formats often require server-side conversion/offloading (`gis-file-formats-research.md`, `spatialintelligence-deep-dive-2026-03-05.md`).

## Skeptical Notes
- **[Unverified]** End-to-end pure-browser support for `.gdb` at production scale is not demonstrated in this repo.
  - **Verification needed:** memory/perf tests with representative city-scale datasets.
- **[Unverified]** Full fidelity transfer of complex symbology from `.aprx/.mxd/.lyrx` into web clients is not proven in local implementation artifacts.
  - **Verification needed:** compatibility matrix with test fixtures and visual diff checks.

## Practical Implication for This Repo
Treat ArcGIS/QGIS uploads as ingestion inputs to a normalization pipeline; do not promise direct parity with desktop GIS project semantics.

## References
- `docs/research/gis-file-formats-research.md`
- `docs/context/GIS_MASTER_CONTEXT.md`
- `docs/research/spatialintelligence-deep-dive-2026-03-05.md`
