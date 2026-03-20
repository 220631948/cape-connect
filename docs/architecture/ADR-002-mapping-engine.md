# ADR 002: Mapping Engine Selection (MapLibre GL JS)

> **TL;DR:** Selected MapLibre GL JS over Leaflet and Mapbox GL JS for high-performance, open-source WebGL vector rendering with zero licensing costs and full MVT compatibility.

**Status:** Accepted
**Date:** 2026-03-01
**Deciders:** Senior GIS Architect

## Context

The platform requires high-performance vector tile rendering, 3D extrusion support (Phase 2), and robust offline capability for ~830k property parcels.

## Decision Drivers

- **Cost:** Minimize license fees (Mapbox GL JS v2+ requires per-load fees)
- **Performance:** WebGL-based rendering mandatory for large datasets
- **Open source:** Avoid vendor lock-in with community-driven projects
- **Compatibility:** Must support MVT (Mapbox Vector Tiles) served by Martin

## Considered Options

1. **Leaflet:** Mature but DOM-based rendering; poor large dataset performance; no native MVT/3D
2. **Mapbox GL JS:** Industry leader but expensive at scale and closed source
3. **MapLibre GL JS:** Open-source fork of Mapbox GL JS v1; high performance, no fees

## Decision

Chosen option: **MapLibre GL JS**. Provides exact performance characteristics of Mapbox GL JS but remains free and open-source.

## Consequences

- **Good:** Zero licensing costs, high performance, full control over rendering pipeline
- **Bad:** Documentation slightly less polished than Mapbox proprietary docs
- **Neutral:** Uses `react-map-gl/maplibre` wrapper for React integration

## Acceptance Criteria

- [ ] MapLibre GL JS renders CartoDB Dark Matter basemap at 60 FPS
- [ ] MVT sources from Martin load and display correctly
- [ ] 10,000+ GeoJSON features render without frame drops
- [ ] No Leaflet or Mapbox GL JS imports in codebase
