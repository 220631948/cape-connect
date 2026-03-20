# Spatial Constraints — Technical Reference

## Coordinate Reference Systems

### Storage: EPSG:4326 (WGS 84)
- **Use for:** Database storage, GeoJSON files, API responses
- **Format:** Longitude, Latitude (decimal degrees)
- **Example:** `18.4241, -33.9249` (Cape Town CBD)
- **PostGIS:** `geometry(Point, 4326)` or `geography`

### Rendering: EPSG:3857 (Web Mercator)
- **Use for:** MapLibre GL JS map display
- **Note:** MapLibre handles 4326→3857 projection automatically
- **Never:** Store data in EPSG:3857

### Calculations: EPSG:4326 with Turf.js
- **Use for:** Client-side area/distance calculations
- **Turf.js:** Works natively with EPSG:4326 GeoJSON
- **PostGIS:** Use `ST_Transform` if server-side calculation needs a projected CRS

### Rule
> Never mix CRS without explicit reprojection. (CLAUDE.md §2)

## Geographic Bounds

### Project Bounding Box (Western Cape)
```json
{
  "west": 18.0,
  "south": -34.5,
  "east": 19.5,
  "north": -33.0
}
```

### Map Initial View
```json
{
  "center": [18.4241, -33.9249],
  "zoom": 11
}
```

### Enforce in MapLibre
```typescript
map.setMaxBounds([
  [18.0, -34.5],  // SW corner
  [19.5, -33.0]   // NE corner
]);
```

## PostGIS Conventions

### Table Creation
```sql
CREATE TABLE parcels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  geom geometry(MultiPolygon, 4326) NOT NULL,
  -- always specify SRID
  CONSTRAINT enforce_srid CHECK (ST_SRID(geom) = 4326)
);
```

### Spatial Indexes
```sql
-- GIST index on every geometry column
CREATE INDEX idx_parcels_geom ON parcels USING GIST (geom);
```

### Common Queries
```sql
-- Find parcels in viewport
SELECT * FROM parcels
WHERE ST_Intersects(geom, ST_MakeEnvelope(18.4, -33.95, 18.5, -33.9, 4326))
AND tenant_id = current_setting('app.current_tenant', TRUE)::uuid;

-- Calculate area (in square metres)
SELECT ST_Area(ST_Transform(geom, 22279)) AS area_sqm FROM parcels;
-- Note: EPSG:22279 = Lo19, accurate for Cape Town

-- Buffer around point (100m)
SELECT ST_Buffer(geom::geography, 100)::geometry FROM points;
```

## Layer Rules (CLAUDE.md §5)

### Z-Order (top to bottom)
1. User draw layer
2. Risk overlays
3. Zoning overlay
4. Cadastral parcels
5. Suburb boundaries
6. Basemap (CartoDB Dark Matter)

### Zoom Rules
- Cadastral parcels: `minzoom: 14` only
- Viewport buffer: 20% beyond visible area
- Max 10,000 GeoJSON features per client layer → switch to Martin MVT above

### Layer Configuration
```typescript
// Every layer MUST have minzoom/maxzoom
map.addLayer({
  id: 'cadastral-parcels',
  type: 'fill',
  source: 'martin-cadastral',
  minzoom: 14,
  maxzoom: 22,
  // ...
});
```

### Source URLs
```typescript
// Always append ?optimize=true
const sourceUrl = `${MARTIN_URL}/parcels/{z}/{x}/{y}.pbf?optimize=true`;
```

## Performance Budgets
- Initial bundle: ≤ 1 MB
- Map initial load: < 3s
- Tile request: < 500ms
- GeoJSON layer: < 10,000 features (switch to MVT above)
- Service worker cache: last viewport tiles, 5 min minimum
