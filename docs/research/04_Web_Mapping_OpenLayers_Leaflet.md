# 04 Web Mapping (OpenLayers vs Leaflet vs MapLibre GL JS)

> **TL;DR:** **MapLibre GL JS** is the clear winner (score 9.5/10). WebGL2/WebGPU rendering, native globe/terrain, data-driven styling for white-label theming, and seamless Martin MVT integration. Leaflet is too limited for dense urban data; OpenLayers is overkill. Do not introduce Leaflet or Mapbox GL JS per CLAUDE.md.
>
> **Roadmap Relevance:** M1–M15 — MapLibre is the mandatory rendering engine across all milestones. Locked in CLAUDE.md §2.

## Overview & 2026 Status
The 2026 web mapping landscape has diverged into three distinct paths:
1.  **MapLibre GL JS:** [VERIFIED] The performance leader. It is the community-driven fork of Mapbox GL JS. In 2026, it is pushing **WebGPU** for massive performance gains and has introduced the **MapLibre Tile (MLT)** format for even more efficient vector data delivery.
2.  **Leaflet (v2.0+):** Finally underwent a modernization overhaul in 2025. It is now published as native ES Modules (ESM), supporting better tree-shaking. However, it remains a "raster-first" engine that relies on plugins for vector tile support.
3.  **OpenLayers (v10.x):** The "GIS Swiss Army Knife." It is the most feature-complete, supporting every obscure OGC standard (WFS-T, WMTS, etc.) natively. It is powerful but has the steepest learning curve.

## Integration with PostGIS
*   **MapLibre GL JS:** Best-in-class integration with vector tiles (MVT/MLT). If you use a tile server like Martin or pg_tileserv, MapLibre renders thousands of PostGIS polygons using WebGL/WebGPU with sub-second response times.
*   **Leaflet:** Struggles with raw PostGIS GeoJSON once you exceed ~5,000 features. Requires plugins like `Leaflet.VectorGrid` to consume vector tiles efficiently.
*   **OpenLayers:** Excellent native support for vector tiles and WFS (Direct PostGIS queries).

## Pros & Cons Table
| Feature | MapLibre GL JS | Leaflet | OpenLayers |
| :--- | :--- | :--- | :--- |
| **Rendering** | WebGL2 / WebGPU (Fastest) | Canvas / SVG | Canvas / WebGL |
| **3D / Globe** | Native Terrain & Globe | Minimal | Moderate |
| **Bundle Size** | Moderate | **Smallest** | Large |
| **Learning Curve**| Moderate | **Easiest** | High |

## Recommendation Scorecard
| Criterion                  | Score (1–10) | Notes |
|----------------------------|-------------|-------|
| MVP Fit                    | 9           | MapLibre provides the "wow" factor with smooth zooming. |
| Scalability                | 10          | Handles hundreds of thousands of features via tiles. |
| Multitenancy Support       | 9           | MapLibre styles can be dynamically swapped for white-labeling. |
| Maintenance Effort         | 8           | `react-map-gl/maplibre` makes integration with React simple. |
| Cost / Licensing           | 10          | All are open source (BSD/MIT). |
| Cape Town / WC Relevance   | 9           | Essential for visualizing dense urban parcel data. |
| **Overall Recommendation** | **9.5 (MapLibre)** | **Stick with MapLibre GL JS.** Since the PoC is already started, don't look back. Leaflet is too limited for dense urban data, and OpenLayers is overkill. |

## Example Integration (Next.js 15 + MapLibre)
Using the async `headers()` pattern in Next.js 15 to secure your map requests:

```typescript
// app/map/page.tsx
import { headers } from 'next/headers';
import MapComponent from '@/components/Map';

export default async function MapPage() {
  const headersList = await headers(); // Next.js 15 async API
  const tenantId = headersList.get('x-tenant-id'); // Multi-tenancy logic

  return (
    <div className="h-screen w-full">
      <MapComponent tenantId={tenantId} />
    </div>
  );
}
```

## Relevance to Our White-Label Cape Town GIS Project
MapLibre GL JS allows us to provide a "premium" feel. When a user in Tenant A (e.g., a Property Developer) zooms into Khayelitsha or Woodstock, they expect a smooth, Google Maps-like experience. MapLibre's ability to handle high-density vector tiles from PostGIS/Martin ensures the map never stutters, even when viewing Cape Town's entire cadastral layer. Additionally, MapLibre's **data-driven styling** makes white-labeling easy: we can change the entire map's color palette (e.g., matching a tenant's brand) just by swapping a JSON style file.
