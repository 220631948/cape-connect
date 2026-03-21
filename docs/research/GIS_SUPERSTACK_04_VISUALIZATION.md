# GIS_SUPERSTACK_04_VISUALIZATION — MapLibre & Visualization Patterns

This research note covers visualization best practices for the CapeTown GIS Hub (capegis). It focuses on MapLibre, UI/UX patterns, choropleth strategies, rendering performance, attribution, and chart integrations (Recharts). It is written to be actionable for frontend engineers working in the Next.js App Router environment described in CLAUDE.md.

IMPORTANT: Follow CLAUDE.md Map Rules — initialize MapLibre once per page (ref guard), import MapLibre CSS in app/layout.tsx, and call map.remove() in cleanup. Always show attribution: © CARTO | © OpenStreetMap contributors.

---

### 1. MapLibre initialization pattern
[Tool v1.0] – https://maplibre.org

This section demonstrates the recommended single-initialization pattern for MapLibre in React/Next.js Server Components / Client Components boundary. Use a ref guard so only one map instance exists per page and ensure cleanup uses map.remove().

Code snippet (MapLibre init):

```js
// Client component example: components/MapClient.tsx
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css'; // ensure imported in app/layout.tsx per CLAUDE.md

export default function MapClient({ containerRef }) {
  React.useEffect(() => {
    if (!containerRef.current) return;
    if (window.__capegis_map_instance) return; // ref guard: initialize once

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [18.4241, -33.9249],
      zoom: 11,
      attributionControl: false // we render custom attribution to include CARTO+OSM
    });

    // Add custom, required attribution
    map.addControl(new maplibregl.AttributionControl({
      compact: true
    }));
    // Application-level global reference
    window.__capegis_map_instance = map;

    return () => {
      // cleanup: remove map instance on unmount
      map.remove();
      delete window.__capegis_map_instance;
    };
  }, [containerRef]);
  return null;
}
```

Rollback: Remove the ref guard and use a minimal placeholder and revert to server rendering-only UI while investigating render issues.

---

### 2. Basemap & attribution controls
[Tool v1.1] – https://carto.com

Map basemap selection must keep legal attribution visible. Per CLAUDE.md Map Rules add: `© CARTO | © OpenStreetMap contributors` to the map UI. Prefer a small, stable attribution bar in the bottom-left.

Code snippet (attribution control):

```js
map.addControl(new maplibregl.AttributionControl({
  compact: false,
  customAttribution: '© CARTO | © OpenStreetMap contributors'
}), 'bottom-left');
```

Rollback: If the customAttribution causes layout regressions, revert to maplibregl default attributionControl and render a fixed footer bar outside MapLibre.

---

### 3. Layer ordering and z-index strategy
[Tool v1.0] – https://maplibre.org

Respect the prescribed layer Z-Order: user-draw (top) → risk overlays → zoning → cadastral → suburbs → basemap. Use MapLibre's addLayer with beforeId to keep deterministic stacking.

Code snippet (layer config and add ordering):

```js
map.addSource('suburbs', { type: 'vector', url: 'https://tiles.example.com/suburbs.json' });
map.addLayer({
  id: 'suburbs-fill',
  type: 'fill',
  source: 'suburbs',
  'source-layer': 'suburbs',
  paint: { 'fill-color': '#1f2937', 'fill-opacity': 0.6 },
  minzoom: 6,
  maxzoom: 14
}, 'waterway-label'); // insert before a known basemap label

// later add cadastral above suburbs
map.addLayer({ id: 'cadastral-lines', type: 'line', source: 'parcels', paint: { 'line-color': '#e5e7eb', 'line-width': 1 } }, 'suburbs-fill');
```

Rollback: If ordering causes occlusion of critical UI, collapse optional overlays into a single combined MVT source and re-evaluate beforeId placements.

---

### 4. Choropleth design patterns
[Tool v2.0] – https://turfjs.org

Choropleth strategies should use quantiles for skewed distributions and Jenks natural breaks when domain experts require contiguous groups. Provide legend with exact bins and ensure colorblind-safe ramps.

Code snippet (choropleth bucket styling):

```js
// Example: client-side style expression for 5 quantiles
const breaks = [0, 10, 25, 50, 75, 100];
map.addLayer({
  id: 'choropleth',
  type: 'fill',
  source: 'valuation',
  paint: {
    'fill-color': ['step', ['get', 'value'], '#ffffcc', 10, '#c2e699', 25, '#78c679', 50, '#31a354', 75, '#006837'],
    'fill-opacity': 0.8
  }
});
```

Rollback: Revert to mono-color thematic layer and surface raw value popups until statistical bins are recalculated on the server.

---

### 5. Vector tiles vs GeoJSON fallbacks
[Tool v1.0] – https://maplibre.org

For performance use Martin MVT vector tiles for large datasets; fall back to Supabase-powered vector tiles. Keep a GeoJSON fallback path for cached/mock per Three-Tier Fallback rule: LIVE → CACHED → MOCK.

Code snippet (source with optimize param):

```js
map.addSource('parcels', {
  type: 'vector',
  tiles: ['https://martin.example.com/tiles/{z}/{x}/{y}.pbf?optimize=true']
});
```

Rollback: If the tile server is unavailable, switch source URL to local `public/mock/parcels.geojson` and add as a GeoJSON source to maintain UI continuity.

---

### 6. Styling performance (paint vs layout)
[Tool v1.0] – https://maplibre.org

Prefer paint properties over layout where possible because paint triggers are cheaper. Avoid data-driven property updates using setPaintProperty where frequent updates are required — instead use expressions that reference feature state or sources with light weight updates.

Code snippet (performance-aware paint):

```js
map.setPaintProperty('parcels-fill', 'fill-opacity', ['interpolate', ['linear'], ['zoom'], 11, 0.0, 14, 0.9]);
```

Rollback: If dynamic expressions produce jank on low-end devices, provide a user toggle to disable animations and heavy interpolations.

---

### 7. Handling 10,000 feature threshold
[Tool v1.0] – https://maplibre.org

Per Map Rules: keep client GeoJSON layers ≤ 10,000 features. Above that use MVT. Add runtime checks to detect large payloads and automatically switch to tile endpoints.

Code snippet (client feature check and switch):

```js
async function loadGeoJsonOrTiles(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (data.features && data.features.length > 10000) {
    // switch to MVT
    map.removeSource('large');
    map.addSource('large', { type: 'vector', url: 'https://martin.example.com/...' });
  } else {
    map.addSource('large', { type: 'geojson', data });
  }
}
```

Rollback: If auto-detection misfires, surface an admin-only flag (NEXT_PUBLIC_DEBUG_TILEMODE) to force MVT or GEOJSON mode.

---

### 8. Interactivity: hover, click, tooltips
[Tool v1.0] – https://maplibre.org

Implement pointer-aware hover and click handlers that use queryRenderedFeatures with a small bbox buffer. Keep popups lightweight and avoid re-rendering React tree for every mouse move; use an ephemeral DOM popup.

Code snippet (hover handler):

```js
map.on('mousemove', 'suburbs-fill', (e) => {
  const features = map.queryRenderedFeatures(e.point, { layers: ['suburbs-fill'] });
  if (!features.length) return;
  const props = features[0].properties;
  // update an ephemeral popup DOM element instead of react-setState per frame
  popup.setLngLat(e.lngLat).setHTML(`<strong>${props.name}</strong>`).addTo(map);
});
```

Rollback: If popup flicker occurs, throttle mousemove updates or fall back to click-to-open popups only.

---

### 9. Integrating Recharts for small-multiples & time series
[Tool v2.0] – https://recharts.org

Use Recharts in React components to show contextual charts (histograms, time-series) synchronized with map selection. Keep chart datasets small (aggregation server-side) and memoize components.

Code snippet (Recharts simple integration):

```jsx
import { LineChart, Line } from 'recharts';

export default function ValuationTrend({ data }) {
  return (
    <LineChart width={300} height={100} data={data}>
      <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false} />
    </LineChart>
  );
}
```

Rollback: If Recharts causes layout shifts, replace with static SVG sparklines or server-rendered chart images.

---

### 10. Legend & accessibility
[Tool v1.2] – https://www.w3.org/WAI

Design legends that are keyboard navigable, labelled with aria attributes, and include textual equivalents for color encodings. Use high-contrast, colorblind-friendly palettes and provide numeric values next to color swatches.

Code snippet (legend accessible markup):

```html
<div role="list" aria-label="Choropleth legend">
  <div role="listitem"><span style="background:#f7fcf5" aria-hidden></span><span>0–10</span></div>
  <div role="listitem"><span style="background:#e5f5e0"></span><span>11–25</span></div>
</div>
```

Rollback: If accessibility features conflict with compact design, hide advanced legend controls behind an "Accessibility" expand option rather than removing them.

---

### 11. Offline tiles & PWA considerations
[Tool v1.0] – https://pmtiles.org

Integrate PMTiles for offline vector tiles and ensure tile caching strategy aligns with PWA (Serwist) offline storage (Dexie.js for metadata). Always surface a data source badge per Rule 1: [SOURCE_NAME · YEAR · [LIVE|CACHED|MOCK]].

Code snippet (PMTiles source):

```js
map.addSource('offline', {
  type: 'vector',
  url: 'https://cdn.example.com/tileset.pmtiles'
});
```

Rollback: If offline tiles inflate bundle size, provide on-demand download and a server-side endpoint to stream tiles dynamically.

---

### 12. Testing & performance profiling
[Tool v1.0] – https://web.dev

Use Lighthouse and real-device testing to measure FPS, CPU, memory. Profile paint-heavy expressions and iterate. Include a performance toggle for low-end devices to disable heavy layers.

Code snippet (runtime device check and toggle):

```js
const lowEnd = navigator.deviceMemory && navigator.deviceMemory < 2;
if (lowEnd) {
  map.setLayoutProperty('fancy-layer', 'visibility', 'none');
}
```

Rollback: If device heuristics misclassify, expose a user control to manually enable/disable performance mode.

---

## Closing notes
- Ensure all MapLibre initializations follow the single-instance pattern and call map.remove() in cleanup.
- Always render the required attribution: © CARTO | © OpenStreetMap contributors.
- Follow Three-Tier Fallback (LIVE → CACHED → MOCK) and show the data source badge near map controls.

POPIA: No personal data is displayed in map layers for guest mode. If adding personal data layers, include POPIA annotation in the touching files as per CLAUDE.md.

References used while drafting this note are primarily project rules (CLAUDE.md), MapLibre docs, CARTO guidance for attribution, Turf.js for spatial stats, PMTiles, and Recharts best practices.
