# 04b ArcGIS Web Integration (Esri Leaflet vs ArcGIS REST JS)

> **TL;DR:** Use **ArcGIS REST JS** (`@esri/arcgis-rest-js`) as the headless data-fetcher for CoCT open data (score 9/10). It's modular, tree-shakable, and works in server-side environments. Keep MapLibre for rendering — this avoids Esri runtime license costs for tenants. Esri Leaflet is legacy; ArcGIS Maps SDK v5 Web Components are interesting but heavyweight.
>
> **Roadmap Relevance:** M3 (Data Ingestion) — ArcGIS REST JS powers the CoCT zoning/cadastral data sync pipeline. Essential for the three-tier fallback (LIVE from ArcGIS → CACHED → MOCK).

## Overview & 2026 Status
In 2026, the relationship between ArcGIS and the open-source web has been standardized around **modular TypeScript packages**. 
*   **Esri Leaflet:** Now considered a legacy "bridge" library. It is stable but effectively in maintenance mode. It is primarily for teams who are already deep in the Leaflet ecosystem and just need to add a few ArcGIS feature layers.
*   **ArcGIS REST JS (@esri/arcgis-rest-js):** [VERIFIED] The modern powerhouse. It is a set of framework-agnostic, lightweight, and tree-shakable packages. It is designed to replace the need for "heavy" SDKs when you just need to query ArcGIS services, handle authentication, or manage items in ArcGIS Online/Hub.
*   **ArcGIS Maps SDK for JavaScript (v5.0):** The latest heavyweight champion. In early 2026, version 5.0 introduced **Web Components** (like `<arcgis-map>`), making it significantly easier to integrate Esri's professional 3D and client-side analysis tools into React/Next.js without the legacy "weight."

## Integration with PostGIS
ArcGIS REST JS is the perfect tool for building data pipelines between ArcGIS Hub (like the City of Cape Town's Open Data) and our PostGIS database. You can use it in a **Next.js 15 Server Action** to fetch features from ArcGIS and sync them directly into Supabase.

## Pros & Cons Table
| Pro | Con |
|-----|-----|
| (ArcGIS REST JS) Modular and tree-shakable; minimal impact on Next.js bundle size. | (Esri Leaflet) Limited 3D support and poor performance with massive datasets. |
| (ArcGIS Maps SDK v5) Native Web Components provide a modern, low-code mapping experience. | Esri's proprietary nature can lead to vendor lock-in if you use their advanced analysis tools. |
| (ArcGIS REST JS) Works flawlessly in server-side environments (Edge / Node.js). | High-traffic ArcGIS services can incur significant costs if not properly cached. |

## Recommendation Scorecard
| Criterion                  | Score (1–10) | Notes |
|----------------------------|-------------|-------|
| MVP Fit                    | 9           | `arcgis-rest-js` is perfect for fetching Cape Town open data. |
| Scalability                | 8           | Modular nature allows scaling the app footprint easily. |
| Multitenancy Support       | 7           | Handling different ArcGIS credentials per tenant is easy with REST JS. |
| Maintenance Effort         | 9           | Very stable APIs with excellent TypeScript definitions. |
| Cost / Licensing           | 6           | The JS libraries are open source, but the ArcGIS services themselves are often paid. |
| Cape Town / WC Relevance   | 10          | Cape Town's primary open data portal is built on ArcGIS Hub. |
| **Overall Recommendation** | **9.0**     | **Use ArcGIS REST JS (@esri/arcgis-rest-js)** for data fetching and authentication. Use MapLibre GL JS for rendering. |

## Example Integration (Next.js 15 + ArcGIS REST JS)
Fetching Cape Town zoning data from their ArcGIS service inside a Next.js Server Action:

```typescript
// app/actions/syncZoning.ts
'use server';
import { queryFeatures } from '@esri/arcgis-rest-feature-service';

export async function syncZoningData(bbox: string) {
  // Using ArcGIS REST JS to fetch data from the City of Cape Town's ArcGIS Hub
  const response = await queryFeatures({
    url: 'https://citymaps.capetown.gov.za/agsext1/rest/services/Zoning/MapServer/0',
    geometry: bbox,
    geometryType: 'esriGeometryEnvelope',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: ['*'],
    f: 'geojson'
  });

  // Now you would use Supabase / PostGIS to UPSERT this data into your 'parcels' table
  // ...
  return response;
}
```

## Relevance to Our White-Label Cape Town GIS Project
Since the City of Cape Town and the Western Cape Government are both heavily invested in the Esri ecosystem, we don't have a choice: we *must* be experts at ArcGIS integration. However, to keep our "White-Label" promise, we should use **ArcGIS REST JS** as our "invisible" data-fetcher. This allows us to keep our frontend mapping engine open-source (MapLibre), saving our tenants from needing expensive ArcGIS runtime licenses while still letting them see the official City data.
