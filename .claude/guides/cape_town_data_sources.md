# Cape Town Data Sources — Quick Reference

## Primary Sources

### City of Cape Town Open Data Portal
- **URL:** `https://odp.capetown.gov.za`
- **Type:** ArcGIS REST Services
- **Auth:** Public (no API key required)
- **Rate Limit:** Not documented — use `api_cache` with 5-minute TTL
- **Fallback:** Mock GeoJSON in `public/mock/`
- **Key Layers:**
  - Zoning schemes (IZS codes)
  - Suburb boundaries
  - Cadastral parcels
  - Flood zones
  - Building plans

### CoCT GIS REST Services
- **URL:** `https://odp-cctegis.opendata.arcgis.com`
- **Type:** ArcGIS REST / GeoJSON
- **Auth:** Public
- **IMPORTANT:** Always enumerate the service directory first. Do NOT hardcode layer URLs — they change.
- **Fallback:** CACHED → MOCK

### General Valuation Roll (GV Roll 2022)
- **Source:** City of Cape Town
- **Format:** Bulk download (CSV/Excel)
- **Auth:** Public
- **Constraint:** Lightstone is PROHIBITED (CLAUDE.md Rule 8)
- **Import:** Via M6 milestone, loaded into PostGIS

### Western Cape Government Spatial Data
- **URL:** Provincial SDW portal
- **Type:** Various (WMS, WFS, download)
- **Key Layers:** Biodiversity, fire hazard zones, agricultural zones

### SANBI BGIS
- **URL:** `https://bgis.sanbi.org`
- **Type:** WMS/WFS
- **Coverage:** National + provincial biodiversity data
- **Relevance:** Cape Flats, Table Mountain, fynbos corridors

## Basemap Tiles

### CartoDB Dark Matter (Primary)
- **URL:** `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`
- **Attribution:** `© CARTO | © OpenStreetMap contributors` (CLAUDE.md Rule 6)
- **Offline:** Cache via Serwist service worker

### Satellite (Optional)
- **Provider:** Mapbox (requires `MAPBOX_TOKEN`)
- **Fallback:** Hidden if token absent
- **Not shown to guests without token**

## Vector Tiles (Martin)

### Martin Tile Server
- **Local:** `http://localhost:3001` (Docker Compose)
- **Production:** DigitalOcean Droplet
- **Env:** `MARTIN_URL`
- **Fallback:** Supabase direct query if Martin unavailable

## Bounding Box (CLAUDE.md Rule 9)
```json
{
  "west": 18.0,
  "south": -34.5,
  "east": 19.5,
  "north": -33.0
}
```

## Test Bounding Box (Cape Town CBD)
```json
{
  "west": 18.4,
  "south": -33.95,
  "east": 18.5,
  "north": -33.9
}
```

## Data Quality Considerations
- **Cape Flats:** Sensitive area — avoid displaying socioeconomic data without context
- **Heritage zones:** Check for protection overlays before enabling development analysis
- **Coastal setback:** Dynamic — may change with new legislation
- **MyCiTi BRT:** GTFS feed availability uncertain — verify before M7
