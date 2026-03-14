# MapLibre GL JS Patterns — Cape Town GIS Hub

<!-- __generated_by: rebootstrap_agent -->
<!-- __timestamp: 2026-03-04T10:39:43Z -->

## Overview

This guide documents the canonical MapLibre GL JS patterns for this project. All map work must follow these patterns. Do NOT use Leaflet or Mapbox GL JS (CLAUDE.md §2).

---

## 1. Init Guard (Single Instance per Page)

MapLibre maps must be initialised **exactly once** per page. Use a ref guard in React.

```typescript
// components/map/MapContainer.tsx
'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';  // Import once in app/layout.tsx

export function MapContainer() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;  // ← init guard

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [18.4241, -33.9249],   // Cape Town (CLAUDE.md §3 Rule 9)
      zoom: 11,
      minZoom: 8,
      maxZoom: 18,
      maxBounds: [18.0, -34.5, 19.5, -33.0],  // Bounding box (CLAUDE.md §3 Rule 9)
      attributionControl: false,     // We add custom attribution below
    });

    // CartoDB attribution (CLAUDE.md Rule 6)
    mapRef.current.addControl(
      new maplibregl.AttributionControl({
        customAttribution: '© <a href="https://carto.com">CARTO</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        compact: false,
      }),
      'bottom-right'
    );

    return () => {
      mapRef.current?.remove();    // ← cleanup on unmount
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
```

### CSS Import Location

```typescript
// app/layout.tsx — import CSS exactly once, at the root layout
import 'maplibre-gl/dist/maplibre-gl.css';
```

---

## 2. Layer Z-Order

Add layers in this exact order (bottom → top). MapLibre renders in insertion order.

```
1. Basemap (CartoDB Dark Matter — loaded via style URL, implicit)
2. Suburbs / administrative boundaries
3. Cadastral parcel outlines          ← zoom ≥ 14 only
4. Zoning overlay                     ← fill then line
5. Risk overlays (flood, fire, etc.)
6. Data-driven overlays (heatmaps, choropleth)
7. User draw layer                    ← always on top
```

```typescript
// Enforce correct insertion order
map.on('load', () => {
  addSuburbLayer(map);       // 2
  addCadastralLayer(map);    // 3 — with minzoom: 14
  addZoningLayer(map);       // 4
  addRiskLayers(map);        // 5
  addUserDrawLayer(map);     // 7 — always last
});
```

---

## 3. Zoom Constraints

Every layer **must** declare `minzoom` and `maxzoom` (CLAUDE.md §5).

```typescript
// Cadastral parcels: zoom ≥ 14 only (CLAUDE.md §5)
map.addLayer({
  id: 'cadastral-fill',
  type: 'fill',
  source: 'cadastral',
  'source-layer': 'cadastral_parcels',
  minzoom: 14,               // ← required
  maxzoom: 18,               // ← required
  paint: { 'fill-color': '#4a90d9', 'fill-opacity': 0.15 },
});

// Viewport buffer: 20% beyond visible bounds when fetching data (CLAUDE.md §5)
function getBufferedBounds(map: maplibregl.Map): maplibregl.LngLatBoundsLike {
  const bounds = map.getBounds();
  const lngSpan = bounds.getEast() - bounds.getWest();
  const latSpan = bounds.getNorth() - bounds.getSouth();
  return [
    bounds.getWest()  - lngSpan * 0.2,
    bounds.getSouth() - latSpan * 0.2,
    bounds.getEast()  + lngSpan * 0.2,
    bounds.getNorth() + latSpan * 0.2,
  ];
}
```

---

## 4. CartoDB Attribution

Required on every map instance (CLAUDE.md Rule 6). Already included in the init guard above. Never remove it.

```typescript
// Correct attribution string (do not abbreviate)
const CARTO_ATTRIBUTION =
  '© <a href="https://carto.com" target="_blank">CARTO</a> | ' +
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>';
```

---

## 5. Style Switching (Basemap Toggle)

Satellite toggle requires `MAPBOX_TOKEN` (CLAUDE.md §7). If absent, hide the control.

```typescript
// hooks/useMapStyle.ts
import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';

type BaseStyle = 'dark' | 'satellite';

const STYLES: Record<BaseStyle, string> = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  // Satellite requires MAPBOX_TOKEN — guard before use
  satellite: process.env.MAPBOX_TOKEN
    ? `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12?access_token=${process.env.MAPBOX_TOKEN}`
    : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',  // fallback
};

export function useMapStyle(map: maplibregl.Map | null, style: BaseStyle) {
  useEffect(() => {
    if (!map) return;
    // Re-add all custom layers after style load
    map.once('style.load', () => {
      // Layers are re-added by their respective add* functions
      map.fire('capegis:layers-reload');
    });
    map.setStyle(STYLES[style]);
  }, [map, style]);
}

// In component — hide satellite toggle if no token
const showSatelliteToggle = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
```

---

## 6. GeoJSON vs MVT Threshold

```typescript
// MAX_GEOJSON_FEATURES is the hard limit before switching to Martin MVT
const MAX_GEOJSON_FEATURES = 10_000;  // CLAUDE.md §5

async function addDataLayer(map: maplibregl.Map, sourceId: string, data: GeoJSON.FeatureCollection) {
  if (data.features.length > MAX_GEOJSON_FEATURES) {
    // Hand off to TILE-AGENT — do not load as GeoJSON
    console.warn(`[capegis] ${sourceId}: ${data.features.length} features exceeds threshold. Use Martin MVT.`);
    return;
  }
  map.addSource(sourceId, { type: 'geojson', data });
}
```

---

## 7. Popup & Interaction Patterns

```typescript
// Cursor change on hover
map.on('mouseenter', 'cadastral-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
map.on('mouseleave', 'cadastral-fill', () => { map.getCanvas().style.cursor = ''; });

// Popup with data source badge (CLAUDE.md Rule 1)
map.on('click', 'cadastral-fill', (e) => {
  const feature = e.features?.[0];
  if (!feature) return;

  new maplibregl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(`
      <div class="popup-content">
        <h3>${feature.properties?.parcel_id}</h3>
        <p class="source-badge">[City of Cape Town · 2022 · LIVE]</p>
      </div>
    `)
    .addTo(map);
});
```

---

## 8. Coordinate System Rules (CLAUDE.md §2)

```typescript
// Storage: EPSG:4326 (lng, lat order in GeoJSON)
const capeTownCenter: [number, number] = [18.4241, -33.9249];  // [lng, lat]

// MapLibre renders in EPSG:3857 internally — no manual conversion needed
// Turf.js operations: always use EPSG:4326 GeoJSON

// NEVER mix coordinates without explicit reprojection
// Use proj4 or Turf.js transform if CRS conversion is needed
```

---

## 9. Performance Checklist

- [ ] `minzoom` and `maxzoom` on every layer
- [ ] `?optimize=true` on Martin source URLs
- [ ] Cadastral parcels only at zoom ≥ 14
- [ ] Viewport buffer 20% for data fetching
- [ ] GeoJSON capped at 10 000 features (switch to MVT above threshold)
- [ ] `map.remove()` called in `useEffect` cleanup
- [ ] MapLibre CSS imported in `app/layout.tsx` (not per-component)
- [ ] `attributionControl: false` + manual `AttributionControl` with CartoDB text
- [ ] Init guard (ref check) prevents double-init

<!-- nonce:5 -->
