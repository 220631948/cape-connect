# 03 MapServer (and the 2026 Tile Server Ecosystem)

> **TL;DR:** MapServer is rejected (score 2/10) — wrong tool for modern MVT-first web mapping. **Martin (Rust)** is the gold standard for vector tiles in 2026: zero-config PostGIS discovery, minimal RAM, native PMTiles support. Score: 9/10. Deploy Martin alongside Supabase when feature count exceeds 10k.
>
> **Roadmap Relevance:** M2 (Tile Infrastructure) — Martin is critical for serving dense cadastral/zoning layers at macro zoom levels.

## Overview & 2026 Status
MapServer is a venerable, C-based open-source map rendering engine. In 2026, it is still very much alive and remains a top choice for organizations that need high-fidelity, cartographic-quality static map rendering (WMS). However, the modern web mapping paradigm has shifted heavily toward **Vector Tiles (MVT)** rendered on the client (browser) using WebGL. 

Because of this, MapServer is rarely the core of a new 2026 SaaS platform. Instead, developers choose between **GeoServer** (the Java enterprise heavyweight, now in version 3.0 with cloud-native features), **pg_tileserv** (Go-based, specifically for PostGIS), or **Martin** (Rust-based, incredibly fast). 

*Surprise finding:* [VERIFIED] **Martin** has become the gold standard for vector tiles in 2025/2026. It is blazingly fast, uses minimal RAM, and natively supports both PostGIS and PMTiles (cloud-optimized flat files). `pg_tileserv` is reportedly entering a maintenance phase compared to the active development around Martin.

## Integration with PostGIS
MapServer reads directly from PostGIS using Mapfiles, which define how SQL queries translate to stylized pixels. 
If we use **Martin** instead, integration is almost zero-config. You point Martin at the Supabase PostGIS connection string, and it automatically exposes your spatial tables and functions as `/{schema}.{table}/{z}/{x}/{y}.pbf` vector tile endpoints.

## Pros & Cons Table
| Pro | Con |
|-----|-----|
| (MapServer) Unbeatable for complex server-side styling and raster WMS. | (MapServer) Mapfiles are notoriously painful to maintain. |
| (Martin) Microservice architecture in Rust; minimal CPU/RAM overhead. | (Martin) Does not handle complex raster processing natively. |
| (GeoServer) Full GUI for administration, WFS-T for editing. | (GeoServer) Java JVM overhead is heavy for a lightweight SaaS MVP. |

## Recommendation Scorecard
| Criterion                  | Score (1–10) | Notes |
|----------------------------|-------------|-------|
| MVP Fit                    | 3 (MapServer)| We don't need server-side raster rendering for the MVP. |
| Scalability                | 9 (Martin)  | Martin scales effortlessly behind a CDN. |
| Multitenancy Support       | 8 (Martin)  | You can pass tenant tokens to PostGIS functions exposed by Martin. |
| Maintenance Effort         | 9 (Martin)  | Zero-config discovery means no Mapfiles or XML to manage. |
| Cost / Licensing           | 10          | All options are open source. |
| Cape Town / WC Relevance   | 7           | City of Cape Town serves a lot of WMS; we will consume theirs rather than host our own. |
| **Overall Recommendation** | **2.0 for MapServer, 9.0 for Martin** | **Reject MapServer.** If our feature count exceeds Leaflet's GeoJSON limit (5000 features), we should deploy **Martin** alongside Supabase. |

## Example Integration (Next.js 15 + PostGIS via Martin)
If we hit the 5,000 polygon limit in the browser and need vector tiles, we deploy Martin (e.g., as a Docker container next to Supabase) and consume it in our map frontend:

```typescript
// Next.js 15 component rendering MapLibre GL JS / Leaflet Vector Grid
import Map, { Source, Layer } from 'react-map-gl/maplibre';

export default function ZoningMap() {
  return (
    <Map initialViewState={{ longitude: 18.4241, latitude: -33.9249, zoom: 12 }}>
      {/* Pointing to Martin tile server which reads directly from PostGIS */}
      <Source 
        id="zoning-tiles" 
        type="vector" 
        tiles={['https://tiles.our-saas.com/public.zoning/{z}/{x}/{y}.pbf']} 
      />
      <Layer 
        id="zoning-fill" 
        type="fill" 
        source="zoning-tiles" 
        source-layer="public.zoning"
        paint={{ 'fill-color': ['get', 'color_code'], 'fill-opacity': 0.6 }} 
      />
    </Map>
  );
}
```

## Relevance to Our White-Label Cape Town GIS Project
Our `CLAUDE.md` explicitly mentions a rule: *No Leaflet layer may hold more than 5,000 GeoJSON features simultaneously.* Cape Town has hundreds of thousands of parcels. While viewport clipping (ST_MakeEnvelope) helps, if a user zooms out to view the entire Metro, we will crash their browser. We *must* use vector tiles for macro views. **Martin** is the perfect companion to Supabase for solving this specific problem, whereas MapServer is the wrong tool for the job.
