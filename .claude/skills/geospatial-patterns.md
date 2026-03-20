# Geospatial Conventions for CapeTown GIS Hub

## PostGIS
- Default SRID: 4326 (WGS84). Always specify SRID on geometry columns.
- Every geometry column needs a GIST spatial index.
- Use `ST_AsGeoJSON()` for GeoJSON output, not manual JSON construction.
- Use `ST_Transform()` explicitly when mixing SRIDs.

## MapLibre GL JS
- Layer ID format: `[source]-[type]-[variant]` (e.g., `parcels-fill-hover`)
- Source ID format: `[dataset]-source` (e.g., `buildings-source`)
- All magic numbers (zoom thresholds, opacity values, bbox coords) go in
  a named constants file, not inline in layer definitions.

## Martin Tile Server
- New tables exposed via Martin must have a corresponding config entry.
- Tile endpoint RLS must scope to the authenticated user's tenant.
- Test tile endpoints with `curl` before marking a feature complete.

## CesiumJS
- Use Cesium Ion for terrain and imagery unless a local source is explicitly
  specified with source attribution.
- 3D tiles must include LOD (Level of Detail) configuration.

## Three-Tier Data Fallback
See `.claude/skills/three-tier-fallback.md` for the canonical pattern.
All new data sources must implement all three tiers.
