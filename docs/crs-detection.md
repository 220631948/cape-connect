# CRS Detection & Reprojection (Guidance)

Overview:
- Common source of errors: missing or incorrect .prj files, ambiguous WKT, or non-standard EPSG codes.
- Strategy: prefer .prj WKT where present; fallback to heuristic (bbox hints, known layer contexts); ask user when ambiguous.

Python example (pyproj):

```python
from pyproj import CRS
crs = CRS.from_wkt(open('input.prj').read())
print('EPSG:', crs.to_epsg())
```

Node/JS example (proj4):

```js
// Parse a proj4 string or known EPSG and reproject via proj4 + turf
const proj4 = require('proj4');
const wgs84 = proj4('EPSG:4326');
// For client-side, use proj4 and turf to reproject GeoJSON coordinates.
```

Reprojection pipeline recommendations:
- Server-side: use `ogr2ogr -t_srs EPSG:4326 output.geojson input.*` to normalize to storage CRS.
- Client-side: only for small files (<10k features) using proj4 + turf to avoid heavy CPU usage in browser.

Storage & rendering rules:
- Store canonical geometry in EPSG:4326 (CLAUDE.md rule)
- Render in EPSG:3857 when using MapLibre/Cesium where appropriate

