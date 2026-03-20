# Coordinate System Detection and Normalization

## TL;DR
CRS detection is a first-class safety mechanism: incorrect CRS can place otherwise valid geometry in the wrong location without obvious errors. The platform detects CRS from format-specific metadata, then reprojects to `EPSG:4326` for consistent Cesium rendering. When CRS cannot be resolved, ingestion must warn or block based on policy—never silently continue.

## Why CRS Detection Matters

- Prevents silent wrong-location rendering ("wrong country" failures).
- Protects downstream analysis integrity (distance, area, route overlay correctness).
- Supports reproducibility by preserving source CRS and transform metadata.

> **Ralph Q:** *If the map still draws something, why do we care about exact CRS?*  
> **A:** A visually plausible but geographically wrong render is a high-risk failure mode; correctness must be validated before trust.

## Detection Method Reference

| Format | CRS Location | Detection Method | Fallback Behaviour |
|---|---|---|---|
| Shapefile | `.prj` WKT string | Parse WKT -> proj lookup -> EPSG mapping | `EPSG:4326` warning flow or strict block |
| GeoTIFF | TIFF geokeys / tags (e.g., 34736/34737) | `geotiff.js` metadata read + EPSG resolution | `EPSG:4326` warning flow or strict block |
| GeoPackage | `gpkg_spatial_ref_sys` table + layer SRS | `sql.js` query for SRS IDs/definitions | `EPSG:4326` warning flow or strict block |
| GeoJSON | RFC 7946 default (WGS84 lon/lat) | Trust spec + structural validation | N/A |
| KML | OGC KML geographic coordinates | Trust spec + parser validation | N/A |
| NetCDF | Global CRS attributes (e.g., `CRS_WKT`) | `netcdfjs` metadata parse | `EPSG:4326` warning flow or strict block |

## WKT to EPSG Resolution

Resolution strategy:
1. Parse WKT tokens and projection parameters.
2. Match against known EPSG/proj definitions.
3. If exact EPSG match unavailable, build equivalent proj string and mark confidence.
4. Require manual confirmation when confidence is below threshold.

Common families handled:
- WGS84 geographic (`EPSG:4326`)
- Web Mercator (`EPSG:3857`)
- UTM zones (north/south variants)
- National grid systems where definitions are available.

> **Ralph Q:** *What if WKT is custom/local and not in EPSG registry?*  
> **A:** The system stores unresolved WKT, offers manual CRS selection, and can block rendering in strict assurance mode.

## Reprojection Behaviour and Accuracy

- Target CRS: always `EPSG:4326` for platform render consistency.
- Coordinate precision is retained to configured decimal tolerance.
- Antimeridian crossing is normalized to avoid wrap artifacts.
- Transform confidence and any approximation flags are persisted.

### Accuracy Risk Controls
- Distortion threshold checks for high-precision workflows.
- Bounding-box sanity checks (e.g., geometry unexpectedly outside expected AOI).
- Stage-level diagnostics to separate detection errors from transform errors.

## User-Facing CRS Panel

The file info panel must show:
- Detected source CRS (or unresolved state).
- Reprojection confirmation (`source -> EPSG:4326`).
- Confidence indicator and warning text when fallback/assumption used.
- Manual override control (permission-scoped, auditable).

## Common Projections Reference (20)

1. EPSG:4326 (WGS84)
2. EPSG:3857 (Web Mercator)
3. EPSG:32633 (UTM 33N)
4. EPSG:32634 (UTM 34N)
5. EPSG:32635 (UTM 35N)
6. EPSG:32636 (UTM 36N)
7. EPSG:32637 (UTM 37N)
8. EPSG:32733 (UTM 33S)
9. EPSG:32734 (UTM 34S)
10. EPSG:32735 (UTM 35S)
11. EPSG:32736 (UTM 36S)
12. EPSG:32737 (UTM 37S)
13. EPSG:27700 (British National Grid)
14. EPSG:2154 (RGF93 / Lambert-93)
15. EPSG:25832 (ETRS89 / UTM 32N)
16. EPSG:25833 (ETRS89 / UTM 33N)
17. EPSG:3111 (GDA94 / Vicgrid)
18. EPSG:2193 (NZGD2000 / NZTM)
19. EPSG:102100 (ESRI Web Mercator alias)
20. EPSG:3413 (NSIDC Polar Stereographic North)

> **Ralph Q:** *Do we let users override CRS even if autodetection found one?*  
> **A:** Yes with guarded permissions and audit logging, because field datasets sometimes carry incorrect metadata.

## Supported/Unsupported CRS Inputs

### Supported
- Standard EPSG-referenced CRS definitions.
- Well-formed WKT and proj-compatible definitions.
- Format-native CRS metadata from supported formats.

### Unsupported or Restricted
- Missing CRS without user confirmation (or strict mode override).
- Malformed WKT that cannot be parsed safely.
- Ambiguous CRS requiring assumptions that exceed policy risk tolerance.

## Multitenant Boundaries and Security Checks

- CRS metadata and transformation logs are tenant-scoped (`tenantId`).
- Manual CRS overrides require tenant-authorized role and are audit-logged.
- Cross-tenant CRS profiles or cached assumptions are not shared implicitly.
- Parser inputs are sanitized to prevent malicious payloads in metadata fields.
- `pre-file-render` hook blocks rendering when CRS safety state is unresolved.

## Failure Handling

- **Detection failure:** unresolved state + user prompt or strict block.
- **Lookup failure:** record raw CRS metadata; request manual selection.
- **Reprojection failure:** stop render, retain diagnostics.
- **Out-of-range sanity failure:** warning/block based on assurance policy.

## Assumptions Register (Cycle 1 Alignment)
- [ASSUMPTION — UNVERIFIED] confidence threshold defaults for auto-accept vs manual CRS confirmation are not finalized.
- [ASSUMPTION — UNVERIFIED] high-assurance domains may require mandatory manual review even for high-confidence CRS matches.

## Known Unknowns
- Which confidence score threshold should force manual CRS confirmation?
- Should all unresolved CRS cases be blocked for emergency/defense domains by default?
- How should we rank suggested CRS options from local metadata hints?
- What geometry error envelope is acceptable per tenant domain for reprojection?
