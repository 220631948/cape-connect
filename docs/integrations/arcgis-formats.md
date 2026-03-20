# ArcGIS Format Integration

## TL;DR
The platform accepts ArcGIS-origin geospatial data when it can be converted to tenant-scoped, normalized geometry in `EPSG:4326` for Cesium rendering. ArcGIS project and style files are treated as partial metadata imports (layer references/symbology hints), not full-fidelity project recreation. Every upload is validated for file completeness, CRS detectability, tenant isolation, and security policy before ingestion.

## Assumptions & Uncertainty Tags
- Canonical uncertainty label in this doc set is `[ASSUMPTION — UNVERIFIED]`.
- Use the tag when conversion-path fidelity, automated PII detection, or style normalization parity is not confirmed by repository evidence.
- Unknown CRS must stay explicit (strict block or warn+confirm policy); no silent assumptions.

## Supported and Unsupported ArcGIS Formats

| Format | Extensions | Status | Parser / Ingestion Path | CRS Handling | Cesium Rendering Path | Limitations / Notes |
|---|---|---|---|---|---|---|
| Shapefile bundle | `.shp` + `.dbf` + `.shx` (+ `.prj` strongly recommended) | Supported (preferred ArcGIS vector interchange) | `shpjs` / `shapefile.js` -> GeoJSON conversion | Parse `.prj` WKT when present; fallback warning flow when absent | `GeoJsonDataSource` | Upload blocked if `.shp/.dbf/.shx` not all present |
| File Geodatabase | `.gdb` directory/bundle | Conditionally supported (server-side extraction path) | Server-side conversion pipeline (FGDB -> GeoJSON/GeoParquet) | CRS from geodatabase metadata; normalize to `EPSG:4326` | `GeoJsonDataSource` or imagery layer after conversion | Browser-only parsing is not guaranteed at production scale |
| ArcMap Project | `.mxd` | Partially supported (metadata extraction only) | Layer/source reference extraction | CRS inferred from referenced datasets, not from full project runtime | N/A directly; render only extracted data layers | Project layout/composer logic is not preserved |
| ArcGIS Pro Project | `.aprx` | Partially supported (metadata extraction only) | Layer/source reference extraction from project package | CRS inferred from referenced datasets | N/A directly; render only extracted data layers | ArcGIS Pro symbology and map automation are not preserved |
| ArcGIS Layer files | `.lyr`, `.lyrx` | Limited support | Style mapping import (best effort) | Not authoritative CRS source | Applied as platform style hints | Vendor-specific cartography may degrade |
| ASCII Raster | `.asc` | Supported with conversion | ASCII grid parse -> raster conversion | Header CRS or user-supplied CRS -> normalized | `SingleTileImageryProvider` (or tiled service for large rasters) | Large rasters may require server-side tiling |

### Explicitly Unsupported or Rejected Inputs
- Password-protected/proprietary archives that cannot be scanned or parsed safely.
- Incomplete shapefile uploads missing required core files (`.shp`, `.dbf`, `.shx`).
- ArcGIS project files expecting 1:1 symbology fidelity and geoprocessing toolbox execution.
- Files that fail tenant-boundary checks, signature validation, or malware/zip-bomb screening.

> **Ralph Q:** *What if someone uploads `.shp` without `.dbf` and `.shx` and expects it to “just work”?*  
> **A:** The validator hard-fails the upload with actionable guidance listing missing files; ingestion never starts with partial core bundles.

## ArcGIS REST API Integration

Server-hosted ArcGIS layers can be integrated through REST endpoints as an alternative to raw file upload.

- Typical URL pattern: `.../FeatureServer/{layerId}/query` and `.../MapServer/{layerId}`.
- Authentication: tenant-scoped credentials or tokens; no shared cross-tenant reuse.
- Response normalization: geometry and attributes are transformed into internal `UploadedGeoFile`/feature entities with `tenantId` tagging.
- Projection handling: if service responds in non-`EPSG:4326`, reprojection is applied before storage and rendering.

> **Ralph Q:** *What if an ArcGIS REST service returns Web Mercator while the viewer expects WGS84?*  
> **A:** The ingestion service reprojects server responses to `EPSG:4326` and records both source and normalized CRS in file metadata.

## Shapefile Multi-File Upload Pattern

### Validation Rules
1. Require same upload session to include `.shp`, `.dbf`, `.shx`.
2. Treat `.prj` as strongly recommended; if absent, invoke fallback CRS workflow.
3. Enforce basename matching (e.g., `parcel.shp`, `parcel.dbf`, `parcel.shx`, `parcel.prj`).
4. Reject duplicate conflicting bundles in one upload transaction.

### Failure Handling
- **Missing required bundle file:** hard fail, no partial ingestion.
- **Mismatched basenames:** hard fail with rename instruction.
- **Unreadable DBF or geometry corruption:** fail and surface parser diagnostics.
- **Upload interrupted:** resumable/chunk retry up to policy limit; then abort and clean temp storage.

### Upload Limits
- Maximum file size: controlled by `GEO_FILE_MAX_SIZE_MB`.
- Large bundles trigger server-side simplification and progressive loading.
- Mobile-tier uploads may receive stricter caps by plan/access tier.

> **Ralph Q:** *What if the `.prj` is missing and we silently render data in the wrong country?*  
> **A:** Silence is prohibited: fallback to assumed `EPSG:4326` is allowed only with a visible warning and explicit user confirmation path.

## CRS Detection from `.prj` and Reprojection Behaviour

### Detection Flow
1. Read `.prj` WKT string.
2. Resolve projection via WKT parse + proj definition lookup.
3. Map to EPSG when possible.
4. Normalize all coordinates to `EPSG:4326`.
5. Persist `originalCRS`, `normalizedCRS`, and transform audit fields.

### Reprojection Guarantees
- Rendering CRS target is always `EPSG:4326`.
- Source CRS is displayed in file info panel for transparency.
- Reprojection logs support debugging and tenant billing traceability.

### Fallback Behaviour
- Unknown/malformed `.prj` -> prompt for manual CRS selection from common list.
- If user skips selection, system can block ingest (strict mode) or warn+assume `EPSG:4326` (policy mode).

> **Ralph Q:** *Can reprojection precision errors distort small cadastral parcels?*  
> **A:** Precision thresholds are monitored; small-geometry distortion beyond tolerance triggers warning and recommends source reprojection QA.

## Multitenant Ingestion Boundaries and Security Checks

### Boundaries
- Storage namespace pattern: `{GEO_FILE_STORAGE_PATH}/{tenantId}/{uploadId}/`.
- Every extracted feature/entity remains tenant-scoped.
- Cross-tenant reads are denied unless explicit sharing grants exist.
- API attribution logs bind ingestion actions to `tenantId` for billing/audit.

### Security Checks
- Extension + MIME + magic-byte verification (triple check).
- Archive safety checks (zip-slip/path traversal, zip bombs, nested archive limits).
- Malware scanning before parse pipeline execution.
- Schema sanitization for attribute fields to avoid injection in downstream analytics/UI.
- Signed upload URLs must embed tenant context; mismatched tenant claims are rejected.

> **Ralph Q:** *What if someone replays a signed upload URL from another tenant?*  
> **A:** The server validates token tenant claim against authenticated tenant context; mismatch is rejected and logged as a security event.

## ⚖️ Ethical Use & Compliance
- Do not represent ArcGIS project imports as exact legal/cartographic reproductions when symbology fidelity is partial.
- Always disclose CRS assumptions and transformations to prevent misleading geospatial conclusions.
- Respect data licensing/terms for ArcGIS-hosted layers and tenant-owned uploads.
- Apply least-privilege access: only authorized tenant members can ingest/view tenant datasets.
- For sensitive geospatial datasets, enforce jurisdictional privacy/data-protection obligations before sharing or export.

## Environment Variables

| Variable | Required | Source |
|---|---|---|
| `GEO_FILE_UPLOAD_ENABLED` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `GEO_FILE_MAX_SIZE_MB` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `GEO_FILE_STORAGE_PATH` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `GEO_FILE_SUPPORTED_FORMATS` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `GEO_FILE_DEFAULT_CRS` | Yes | `GIS_MASTER_CONTEXT.md` §15 |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `CLAUDE.md` §7 |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | `CLAUDE.md` §7 |

## Three-Tier Fallback

`[LIVE]` ArcGIS REST API query or client-side file parse → `[CACHED]` previously ingested features in Supabase `api_cache` → `[MOCK]` sample GeoJSON in `public/mock/arcgis-sample.geojson`.

## Data Source Badge

`[ArcGIS Upload · {YEAR} · LIVE|CACHED|MOCK]` — displayed on every rendered layer originating from ArcGIS file import.

## Error Handling

- **API down (ArcGIS REST):** fall back to cached features, then mock data; never blank map.
- **Parse failure:** surface parser diagnostics; no partial silent ingestion.
- **CRS unknown:** prompt user or apply policy-mode fallback with visible warning.

## POPIA Implications

- ArcGIS uploads may contain personal data (e.g., property owner names in `.dbf` attributes).
- Scan attribute fields for PII patterns before storage; apply POPIA annotation if detected.
- Tenant-scoped storage ensures cross-tenant PII isolation. [ASSUMPTION — UNVERIFIED] — automated PII detection in attribute tables not yet implemented.

## Milestone Mapping

- **M3** (Data Ingestion): Shapefile + GeoPackage upload pipeline.
- **M5** (File Format Support): Full ArcGIS format matrix including `.gdb`, `.mxd`, `.aprx`.
- **M8** (Domain Extensions): ArcGIS REST API integration for domain-specific layers.

## Ralph/edge-case Q&A
- **Q:** What if a shapefile arrives without a valid `.prj`? **A:** Pause publish, request manual CRS confirmation, and apply only tenant-approved fallback policy.
- **Q:** What if imported attributes include owner/contact fields? **A:** Keep data tenant-scoped, flag POPIA review, and require explicit authorization before share/export.

## Known Unknowns
- Which FGDB conversion path provides the best performance/accuracy balance per deployment target?
- Should strict-mode CRS policy (block when unknown CRS) be default for high-assurance tenants?
- What distortion tolerance should auto-trigger a reprojection quality warning per domain (planning vs emergency response)?
- Which subset of `.lyrx` style semantics can be safely normalized without false visual equivalence claims?

## References
- [QGIS Format Integration](./qgis-formats.md)
- [File Import Pipeline](../architecture/file-import-pipeline.md)
- [Coordinate System Detection](../architecture/coordinate-system-detection.md)
- [Spatial Data Architecture Spec](../specs/04-spatial-data-architecture.md)
- [Multitenant Architecture Spec](../specs/11-multitenant-architecture.md)
- OGC GeoPackage Standard: https://www.ogc.org/standards/geopackage/
- Esri Shapefile Technical Description: https://support.esri.com/en-us/technical-paper/esri-shapefile-technical-description-398
- ArcGIS REST API reference: https://developers.arcgis.com/rest/
- EPSG Registry: https://epsg.org/
- PROJ documentation: https://proj.org/
- CesiumJS Data Sources: https://cesium.com/learn/cesiumjs-learn/cesiumjs-data-sources/
