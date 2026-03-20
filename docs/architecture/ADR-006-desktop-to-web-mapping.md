# ADR 006: Desktop to Web GIS Mapping (Mental Model Transition)

> **TL;DR:** Established a mapping dictionary between ArcGIS Pro desktop concepts and web GIS equivalents to prevent architectural mismatches. Key shifts: Feature Classes → PostGIS tables, Toolboxes → PostgreSQL RPCs, symbology → MapLibre Style Spec, on-the-fly projection → static EPSG:4326 storage.

**Status:** Accepted
**Date:** 2026-03-01
**Deciders:** Senior GIS Architect

## Context

The lead developer has ArcGIS Pro background. Desktop GIS thinking (heavy local processing, file-based GDBs) clashes with web GIS requirements (stateless APIs, tiled rendering, browser memory limits).

## Decision

Established a concept mapping table and three core strategies for web GIS success.

## Mapping Table

| ArcGIS Pro Concept | Web GIS / CapeGIS Equivalent | Rationale |
|--------------------|-----------------------------|-----------|
| Feature Class | PostGIS Table | Relational storage with spatial extensions |
| File Geodatabase | Supabase/PostgreSQL | Database is single source of truth |
| Shapefile | GeoJSON (small) / MVT (large) | Shapefiles for storage; MVT for rendering |
| Symbology | MapLibre Style Spec (JSON) | Paint and Layout rules |
| Toolbox / ModelBuilder | PostgreSQL RPC Functions | Compute in DB, not client |
| On-the-fly Projection | Static EPSG:4326 Storage | Browser reprojection too slow |
| Map Layout (.pagx) | React-PDF / Canvas Export | Web maps are dynamic; PDFs synthesized |
| Fields / Attributes | JSONB / Typed Columns | More flexible than GDB field types |

## Strategy for Success

1. **Stateless compute:** Fetch tiles or small GeoJSON slices, not full geometry in browser state
2. **Zoom gating:** Use `minzoom` to prevent loading 800k parcels at once
3. **Tile-first rendering:** Martin MVT = web equivalent of cached map service

## Consequences

- **Good:** Prevents architectural mismatches causing slow web performance
- **Bad:** Learning curve for developers used to ArcGIS GUI
- **Neutral:** Focuses implementation on PostGIS efficiency

## Acceptance Criteria

- [ ] All developers acknowledge the mapping table before starting GIS features
- [ ] No direct shapefile processing in browser (server-side conversion only)
- [ ] All spatial compute uses PostGIS RPCs, not client-side processing
