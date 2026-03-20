# 10 — MapLibre GL JS & Next.js Integration (Technical Deep Dive)

> **TL;DR:** MapLibre must be dynamically imported with `ssr: false` in Next.js (no `window` on server). Use `react-maplibre` (not `react-map-gl`) to avoid webpack alias hacks. Point map style to CARTO Dark Matter tiles. Initial view: Cape Town CBD (18.4241, -33.9249, zoom 10). [VERIFIED] pattern confirmed by MapLibre and Next.js official docs.
>
> **Roadmap Relevance:** M1 (Map PoC) — this is the core integration pattern for every map page in the application.


## Overview
This document details the best practices and considerations for integrating MapLibre GL JS with a Next.js application, particularly when using React wrappers like `react-map-gl` or `react-maplibre`. The primary challenge in this integration lies in managing Server-Side Rendering (SSR) due to MapLibre's reliance on browser-specific objects.

## Integration Strategy: Dynamic Imports with `ssr: false`
MapLibre GL JS, being a browser-side library, depends on the global `window` object. During the server-side rendering phase of a Next.js application, the `window` object is not available, leading to errors. To circumvent this, components that render MapLibre maps must be dynamically imported with `ssr: false`.

### Implementation Pattern
The `next/dynamic` utility from Next.js allows for client-side-only rendering of components.

```typescript
// components/MapComponent.tsx (or similar)
// This component would contain your MapLibre map initialization logic

// In your page or parent component (e.g., app/page.tsx or components/Dashboard.tsx)
import dynamic from 'next/dynamic';
import React from 'react';

const DynamicMap = dynamic(
  () => import('../components/MapComponent').then((mod) => mod.MapComponent), // Adjust if MapComponent is a default export
  {
    ssr: false,             // Crucial: Renders component only on the client side
    loading: () => <p>Loading map...</p>, // Optional: A placeholder component while the map loads
  }
);

export default function MyMappingPage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <DynamicMap />
    </div>
  );
}
```
**Note on Named vs. Default Exports:**
If `MapComponent` is a default export (`export default function MapComponent(...)`), the import within `dynamic` simplifies to:
`() => import('../components/MapComponent')`

## Choosing a React Wrapper: `react-map-gl` vs. `react-maplibre`

### `react-map-gl`
Originally designed for `mapbox-gl-js`, `react-map-gl` can be used with `maplibre-gl-js`. However, this often requires a webpack alias due to `react-map-gl`'s internal dependency on `mapbox-gl`:

```javascript
// next.config.js
const nextConfig = {
  webpack: (config) => {
    // Alias mapbox-gl to maplibre-gl to ensure react-map-gl uses MapLibre
    config.resolve.alias['mapbox-gl'] = 'maplibre-gl';
    return config;
  },
};
module.exports = nextConfig;
```
Without this alias, `react-map-gl` might still attempt to import `mapbox-gl`, leading to module resolution errors.

### `react-maplibre` (Recommended)
`react-maplibre` is a dedicated React wrapper specifically built for `maplibre-gl-js`. It was spun off from `react-map-gl` to provide a more direct, reactive, and less problematic integration with `MapLibre GL JS` as its API and implementation diverged from Mapbox.

**Advantages of `react-maplibre`:**
-   **Simpler Integration:** No need for webpack aliases.
-   **Reactive State Management:** Designed to keep React component state and MapLibre's imperative map state synchronized.
-   **Maintainability:** Aligns directly with the `MapLibre` ecosystem, ensuring better future compatibility.

## Usage with CARTO Dark Matter Tiles
To integrate CARTO Dark Matter tiles, you will provide the appropriate style URL to your MapLibre map instance. This is typically done via the `mapStyle` prop in `react-map-gl` or `react-maplibre`.

```typescript
// Example using react-maplibre (similar for react-map-gl)
import Map from 'react-maplibre'; // or 'react-map-gl'
import 'maplibre-gl/dist/maplibre-gl.css'; // Import MapLibre GL JS CSS

function MapWithCartoTiles() {
  return (
    <Map
      initialViewState={{
        longitude: 18.4241, // Cape Town CBD longitude
        latitude: -33.9249,  // Cape Town CBD latitude
        zoom: 10
      }}
      // CARTO Dark Matter style URL
      mapStyle="https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
```

## Conclusion
For a robust and maintainable MapLibre GL JS integration in a Next.js application, it is highly recommended to use `next/dynamic` with `ssr: false` for map components and to favor the `react-maplibre` library over `react-map-gl` to avoid potential compatibility issues and simplify the build process.

## Sources
-   [visgl/react-map-gl keeps asking for mapbox-gl #1773 - GitHub](https://github.com/visgl/react-map-gl/discussions/1773)
-   [Making Next.js and Mapbox GL JS get along - Medium](https://medium.com/%40timothyde/making-next-js-and-mapbox-gl-js-get-along-a99608667e67)
-   [How to use maplibre-gl with react-map-gl - Stack Overflow](https://stackoverflow.com/questions/67774224/how-to-use-maplibre-gl-with-react-map-gl)
-   [Introduction | react-maplibre](https://visgl.github.io/react-maplibre/docs/)
-   [Learn | Next.js - Dynamic Import Components](https://nextjs.org/learn-pages-router/seo/improve/dynamic-import-components)
