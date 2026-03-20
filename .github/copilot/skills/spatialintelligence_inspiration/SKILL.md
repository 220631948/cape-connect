---
name: spatialintelligence-inspiration
description: Apply spatialintelligence.ai WorldView dashboard patterns to Cape Town GIS — immersive 3D visualization, temporal analytics, multi-sensor fusion.
---

# SpatialIntelligence Inspiration

Invoke when designing dashboard layouts, 3D visualization strategies, or data fusion pipelines.

## Checklist

1. **Review WorldView Patterns:** Immersive 3D globe as primary interface, temporal scrubber, multi-layer fusion (satellite + aerial + street-level + IoT), dark theme with crayon accents, cinematic transitions, command palette.
2. **Map to Cape Town Data Sources:** CesiumJS + Google 3D Tiles for globe view, 4DGS for temporal replay, OpenSky + weather + traffic + zoning for sensor fusion, CoCT GV Roll for building intelligence.
3. **Design Dark-Theme UI:** Near-black backgrounds (`#0a0a0f`), dark surfaces (`#12121a`), accent colours — cyan (`#00d4ff`) for spatial data, orange (`#ff6b35`) for alerts, purple (`#a855f7`) for temporal.
4. **Plan CesiumJS Integration:** Configure 2D/3D hybrid view with MapLibre + CesiumJS. Camera syncing between views. Default: Cape Town centre at `18.4241, -33.9249`, 15km height, -45° pitch.
5. **Define Temporal Navigation:** Full-width timeline scrubber, play/pause/speed controls (0.5x–10x), keyframe markers for events, date picker, range selector.

## Output
- Dashboard design spec, component hierarchy, CesiumJS scene config, temporal navigation spec.

## When NOT to Use
- Simple 2D MapLibre mapping, non-spatial analytics, static report generation, backend-only processing.
