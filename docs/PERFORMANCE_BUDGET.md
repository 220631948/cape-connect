# GIS Performance Budget & Device Constraints


> **TL;DR:** Target usability on 3-5 Mbps LTE and mid-range Android (Samsung A-series). TTI < 5s, initial map < 3s, initial payload < 2MB. Max 5 concurrent vector layers. Lite Mode auto-triggers on low memory/FPS/bandwidth. See `CLAUDE.md` §5 (map rules) for layer and zoom constraints.

**Document version:** 1.0
**Date:** 2026-03-01
**Status:** DRAFT

## 1. Goal
Ensure the Cape Town GIS Hub remains usable on 3-5 Mbps LTE connections and mid-range Android devices (e.g., Samsung A-series) common among field workers.

## 2. Network Performance Budget (Throttle: 5 Mbps)

| Metric | Target | Rationale |
|---|---|---|
| **Time to Interactive (TTI)** | < 5s | User should be able to pan the map quickly. |
| **Initial Map Load** | < 3s | Core basemap and suburb boundaries visible. |
| **Vector Tile Load (z15)** | < 500ms | Individual parcel details appear during pan. |
| **Total Payload (Initial)** | < 2MB | Minimize data costs for mobile users. |

## 3. Rendering & Memory Budget

### 3.1 WebGL Layer Limits
*   **Max Concurrent Vector Layers:** 5 (e.g., Base, Parcels, Zoning, Flood, Draw).
*   **Feature Limit per Tile:** 5,000 vertices.
*   **Texture Memory Limit:** 256MB.

### 3.2 Mobile "Lite Mode" Triggers
The application will monitor system resources and automatically trigger "Lite Mode" if:
1.  **Device Memory < 4GB RAM:** Disable 3D extrusions and heavy risk overlays.
2.  **Frame Rate < 20 FPS:** Simplify geometries or suggest switching to raster tiles.
3.  **Low Bandwidth Detected:** Force the "Cached" tier even if online to save data.

## 4. Optimization Strategies
*   **Viewport Pruning:** Never request features outside the visible bounding box + 20% buffer.
*   **Zoom Gating:** Cadastral parcels are invisible below zoom level 14.
*   **MVT Simplification:** Use `ST_Simplify` in PostGIS for tiles at lower zoom levels to reduce vertex count.
*   **Web Workers:** Offload heavy Turf.js spatial analysis to a background worker to keep the UI thread responsive.

## 5. Testing Protocol
*   All milestones must be verified using the **Chrome DevTools "Fast 3G"** throttle and **"6x CPU Slowdown"** to simulate field conditions.
