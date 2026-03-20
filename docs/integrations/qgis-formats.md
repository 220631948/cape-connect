# QGIS Format Integration

## TL;DR
QGIS uploads are supported through project-level extraction (`.qgz/.qgs`) and robust GeoPackage ingestion (`.gpkg`), with all renderable geometry normalized to `EPSG:4326`. GeoPackage is the recommended exchange format for production because it preserves schema and CRS metadata better than legacy shapefile bundles. Ingestion is tenant-scoped, security-screened, and failure-explicit.

## Assumptions & Uncertainty Tags
- Canonical uncertainty label in this doc set is `[ASSUMPTION — UNVERIFIED]`.
- Apply this tag where automated path repair, server-side parsing thresholds, or PII detection automation is not implementation-verified.
- Unknown CRS and unresolved dependencies must remain explicit in import diagnostics.

## Supported and Unsupported QGIS Formats

| Format | Extensions | Status | Parser / Ingestion Path | CRS Handling | Cesium Rendering Path | Limitations / Notes |
|---|---|---|---|---|---|---|
| QGIS Project | `.qgz` (zipped `.qgs`), `.qgs` (XML) | Partially supported | Parse project XML, extract data source references | CRS resolved from project/layer metadata where available | N/A directly; render extracted layers only | Relative/absolute path rewrites often required |
| GeoPackage | `.gpkg` | Supported (preferred) | `sql.js` (SQLite WASM) or server SQLite path -> feature extraction | Read `gpkg_spatial_ref_sys` and layer SRS IDs | `GeoJsonDataSource` (vector) / imagery path (raster) | Best compatibility for complete layer transfer |

### Unsupported / Not Preserved
- Native QGIS desktop symbology and composer layouts are not preserved 1:1.
- Plugin-defined or local-machine-only data source paths that cannot be resolved server-side.
- Project automation/macros and environment-specific runtime behaviors.

> **Ralph Q:** *If `.qgz` opens in QGIS, why can’t the platform render it identically?*  
> **A:** `.qgz` is a project container; we ingest underlying data layers, not the full desktop rendering engine and plugin runtime.

## QGIS Project (`.qgz/.qgs`) Ingestion Notes

### Layer Extraction
- `.qgz` is unzipped to locate embedded `.qgs` XML.
- Layer source URIs are parsed and normalized.
- Relative paths are rebased to upload workspace when possible.
- Broken source references produce explicit partial-import diagnostics.

### Failure Handling
- Unreadable XML -> hard fail with parse error detail.
- Project references unavailable local paths -> partial import (metadata retained, missing layers flagged).
- Mixed CRS without resolvable definitions -> CRS prompt or strict-mode block.

> **Ralph Q:** *What if every layer path in `.qgs` points to someone’s C: drive?*  
> **A:** The importer flags unresolved sources, imports only resolvable layers, and reports a repair checklist instead of silently dropping context.

## GeoPackage (`.gpkg`) as Preferred Exchange Format

Why recommend GeoPackage over shapefile:
- Single-file transport simplifies upload reliability and auditability.
- Preserves richer schema, Unicode attributes, and larger field widths.
- Stores explicit CRS metadata tables (`gpkg_spatial_ref_sys`).
- Better alignment with modern OGC workflows and multiformat interoperability.

> **Ralph Q:** *Is GeoPackage always better even for tiny datasets?*  
> **A:** Usually yes operationally; shapefile can still be accepted, but GeoPackage reduces multi-file failure modes and CRS ambiguity.

## File Size, Upload Limits, and Performance

- File size cap enforced by `GEO_FILE_MAX_SIZE_MB` (tenant tier may further constrain).
- Chunked upload supports unstable networks and resumable transfer.
- Large vector layers trigger simplification thresholds before interactive rendering.
- Progressive loading prioritizes current map extent/zoom.
- Mobile/low-memory contexts can route large files to deferred server-side processing.

### Failure Handling for Large Files
- Exceeds hard cap -> immediate rejection with documented upgrade/reprocess paths.
- Parse memory pressure -> move to server-side queue instead of browser crash.
- Timeout during extract -> retry window, then fail with resumable token guidance.

> **Ralph Q:** *What if a 2GB `.gpkg` is uploaded from mobile in poor connectivity?*  
> **A:** The pipeline uses chunked resumable upload and may defer heavy parsing to server workers with progress feedback.

## CRS Detection and Reprojection Behaviour

- Primary source for `.gpkg`: `gpkg_spatial_ref_sys` + layer SRS linkage.
- For `.qgs/.qgz`: project/layer CRS metadata, then datasource-level metadata.
- All accepted geometries are normalized to `EPSG:4326` for globe rendering.
- Source CRS and transform details are retained in metadata for transparency.
- Unknown CRS requires manual selection or policy-based fallback warning.

> **Ralph Q:** *Could a wrong CRS selection make farm boundaries appear offshore?*  
> **A:** Yes, so unknown CRS is always surfaced to the user and never silently accepted without warning/confirmation policy.

## QGIS Plugin Recommendation for Export Compatibility

Recommend users export/import through:
1. GeoPackage (`.gpkg`) for full-featured vector/raster interchange.
2. GeoJSON for lightweight vector exchange.
3. Cloud-Optimized GeoTIFF for large raster pipelines.

Guidance should explicitly warn that desktop-only styling may not transfer.

## Multitenant Ingestion Boundaries and Security Checks

### Boundaries
- Upload workspace and parsed artifacts are tenant-namespaced under `{tenantId}`.
- `UploadedGeoFile` entities and derived features inherit tenant ownership.
- Cross-tenant project URI resolution is blocked by design.
- Audit records include user, tenant, source format, and transformation events.

### Security Checks
- Validate extension/MIME/magic bytes before parsing.
- Scan archives and embedded payloads for malware and decompression abuse.
- Prevent path traversal on `.qgz` extraction.
- Sanitize attribute payloads and reject malformed geometries.
- Enforce authZ checks on every read/write action in import lifecycle.

> **Ralph Q:** *What if a crafted `.qgz` tries `../` paths to escape extraction root?*  
> **A:** Extraction is path-normalized and sandboxed; traversal attempts are blocked and security-audited.

## ⚖️ Ethical Use & Compliance
- Clearly label partial-fidelity imports to avoid overclaiming equivalence with native QGIS desktop output.
- Preserve provenance and CRS transformation transparency to reduce decision risk.
- Respect licensing constraints on externally referenced layers.
- Apply tenant-scoped access controls and retention rules for potentially sensitive spatial datasets.
- Ensure exports used for legal/public claims include uncertainty and transformation disclosures.

## Environment Variables

| Variable | Required | Source |
|---|---|---|
| `GEO_FILE_UPLOAD_ENABLED` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `GEO_FILE_MAX_SIZE_MB` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `GEO_FILE_STORAGE_PATH` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `GEO_FILE_DEFAULT_CRS` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `CLAUDE.md` §7 |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | `CLAUDE.md` §7 |

## Three-Tier Fallback

`[LIVE]` Client-side parse (`.gpkg` via `sql.js`, `.qgs` via XML parse) → `[CACHED]` previously ingested features in Supabase → `[MOCK]` sample GeoJSON in `public/mock/qgis-sample.geojson`.

## Data Source Badge

`[QGIS Upload · {YEAR} · LIVE|CACHED|MOCK]` — displayed on every rendered layer originating from QGIS file import.

## Error Handling

- **Parse failure:** hard fail with diagnostic detail; no silent partial ingestion.
- **CRS unknown:** prompt user for manual selection or apply policy-mode fallback with visible warning.
- **Large file:** chunked resumable upload; defer heavy parsing to server workers.
- **Broken `.qgs` layer references:** partial import with repair checklist.

## POPIA Implications

- QGIS uploads may contain personal data in attribute tables (e.g., property owner details in GeoPackage).
- Scan attribute fields for PII patterns before storage; apply POPIA annotation if detected.
- Tenant-scoped storage ensures cross-tenant PII isolation. [ASSUMPTION — UNVERIFIED] — automated PII detection not yet implemented.

## Milestone Mapping

- **M3** (Data Ingestion): GeoPackage upload pipeline (preferred format).
- **M5** (File Format Support): QGIS project file extraction (`.qgz`/`.qgs`).
- **M8** (Domain Extensions): Domain-specific QGIS template recommendations.

## Ralph/edge-case Q&A
- **Q:** What if a `.qgz` references missing external layer paths? **A:** Import available layers, report missing dependencies, and provide a repair checklist before publish.
- **Q:** What if a large GeoPackage stalls client-side parsing? **A:** Shift parsing to server workers and continue with cached/mock fallback to preserve UX continuity.

## Known Unknowns
- Which `.qgz` dependency patterns are most common and should get automated path-repair heuristics?
- Should very large GeoPackage parsing be always server-side for deterministic performance?
- What tenant-tier defaults are optimal for strict CRS blocking vs warning-based fallback?
- How should unresolved project layers be represented in UI for best operator recovery?

## References
- [ArcGIS Format Integration](./arcgis-formats.md)
- [File Import Pipeline](../architecture/file-import-pipeline.md)
- [Coordinate System Detection](../architecture/coordinate-system-detection.md)
- [Spatial Data Architecture Spec](../specs/04-spatial-data-architecture.md)
- [Multitenant Architecture Spec](../specs/11-multitenant-architecture.md)
- QGIS Documentation: https://docs.qgis.org/
- OGC GeoPackage Standard: https://www.ogc.org/standards/geopackage/
- PROJ documentation: https://proj.org/
- EPSG Registry: https://epsg.org/
- CesiumJS Data Sources: https://cesium.com/learn/cesiumjs-learn/cesiumjs-data-sources/
- SQLite format and docs: https://www.sqlite.org/docs.html
