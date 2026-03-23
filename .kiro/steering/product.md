# CapeTown GIS Hub — Product Overview

**CapeTown GIS Hub** (`capegis`) is a multi-tenant PWA for geospatial intelligence serving the City of Cape Town and Western Cape Province only.

## Purpose

Provides city planners, property analysts, and environmental monitors with interactive 2D/3D mapping, spatial analysis, and data-driven dashboards — all with offline capability and strict POPIA compliance.

## Core Features

- Interactive MapLibre GL mapping with 2D/3D toggle (CesiumJS)
- Property search via PostGIS full-text search
- Spatial analysis (buffer, intersection, point-in-polygon)
- Analytics dashboard (Recharts)
- Multi-format export: GeoJSON, CSV, Shapefile, PDF, GeoParquet
- Offline-first PWA with Serwist tile caching (zoom 8–12)
- Multi-tenant RBAC with 6-tier role hierarchy
- POPIA-compliant data handling

## Role Hierarchy

`GUEST → VIEWER → ANALYST → POWER_USER → TENANT_ADMIN → PLATFORM_ADMIN`

Guest mode: basemap + suburbs + zoning only. No property details, no export.

## Geographic Scope

Cape Town + Western Cape Province only.
Bounding box: `{ west: 18.0, south: -34.5, east: 19.5, north: -33.0 }`

## Current Phase

M17 — Advanced Geospatial Analysis (milestones M0–M16 complete)

## Non-Negotiable Rules (from CLAUDE.md)

1. Every data display must show `[SOURCE · YEAR · LIVE|CACHED|MOCK]` badge
2. Three-tier fallback: LIVE → CACHED → MOCK (never blank/error)
3. No API keys in source — credentials in `.env` only
4. RLS on every table + app-layer tenant verification
5. Files touching personal data must include POPIA annotation block
6. Map must display `© CARTO | © OpenStreetMap contributors`
7. Source files ≤ 300 lines
8. GV Roll 2022 is the only approved valuation source (no Lightstone data)
9. Geographic scope enforced via bbox above
10. Milestone sequencing is sequential M0–M17; no skipping; human confirms DoD
