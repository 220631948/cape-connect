# Gotchas and Lessons Learned

*Converted into AI Playbook rules in CLAUDE.md.*

## Tracked Mistakes

### GOTCHA-PY-001 — GDAL pip Installation Failure

**Category:** Python Backend | **Severity:** Critical | **Date:** 2026-03-21

**Problem:** Running `pip install gdal` fails because GDAL requires system-level C libraries and headers that are not
installed in standard Python Docker images.

**Error Message:**

```
ERROR: Failed building wheel for gdal
error: gdal_config: Command not found
```

**Solution:** Use the OSGEO official Docker base image which includes pre-compiled GDAL:

```dockerfile
FROM ghcr.io/osgeo/gdal:ubuntu-small-3.9.0
```

**Prevention:** Never `pip install gdal` in Dockerfile. The OSGEO image has GDAL 3.9.0 pre-installed with all
dependencies.

---

### GOTCHA-DB-003 — ST_DWithin Uses Degrees Not Metres in EPSG:4326

**Category:** Database / PostGIS | **Severity:** Critical | **Date:** 2026-03-21

**Problem:** When geometry is stored as EPSG:4326 (longitude/latitude), `ST_DWithin(geom_a, geom_b, 500)` treats the
distance as **degrees**, not metres. A 500-degree radius covers the entire planet.

**Error Example:**

```sql
-- WRONG: returns everything — 500 degrees ≈ entire earth
SELECT *
FROM parcels
WHERE ST_DWithin(geom, target, 500);
```

**Solution:** Cast geometry to `geography` type so PostGIS uses metre-based calculations:

```sql
-- CORRECT: 500 metres
SELECT *
FROM parcels
WHERE ST_DWithin(geom::geography, target::geography, 500);
```

**Prevention:** All spatial queries on EPSG:4326 data MUST use `::geography` cast for any distance-based function (
ST_DWithin, ST_Buffer, ST_Distance). See [PostGIS docs](https://postgis.net/docs/ST_DWithin.html).

---

### GOTCHA-PY-003 — Shapefile ZIP Must Contain All 4 Components

**Category:** GIS File Pipeline | **Severity:** High | **Date:** 2026-03-21

**Problem:** Shapefile uploads arrive as ZIP archives. If the `.prj` file is missing, the CRS is unknown. Assuming
EPSG:4326 when the data is actually in a projected CRS (e.g. Lo19) causes features to render in the wrong location.

**Required Components:** `.shp`, `.dbf`, `.prj`, `.shx` — all four must be present in the ZIP.

**Solution:** Validate the ZIP contents before processing. Reject uploads missing any component with a clear error
listing what is missing.

**Prevention:** Never assume CRS for shapefiles. If `.prj` is missing, reject the upload and ask the user to re-export
with projection information.

---

### GOTCHA-PY-004 — DXF Files Have No CRS Metadata

**Category:** GIS File Pipeline | **Severity:** Critical | **Date:** 2026-03-21

**Problem:** DXF files almost never contain coordinate reference system metadata. If we assume Cape Town Lo19 and the
file is actually WGS84, the geometry will land somewhere in the ocean.

**Solution:** Always prompt the user to confirm the CRS before processing a DXF file. Common CRS options for Cape Town:

- EPSG:4326 (WGS84 latitude/longitude)
- EPSG:32734 (UTM Zone 34S)
- EPSG:2048 (Hartebeesthoek94 Lo19 — Cape Town engineering)

**Prevention:** The upload endpoint returns HTTP 422 if a DXF is uploaded without an explicit `crs` query parameter.

---

### GOTCHA-PY-005 — GeoPandas Blocking Operations in Async Context

**Category:** Python Backend | **Severity:** High | **Date:** 2026-03-21

**Problem:** GeoPandas, Fiona, and rasterio perform blocking I/O (file reads, format conversions). Running these
directly in an async FastAPI endpoint blocks the event loop and degrades throughput for all concurrent requests.

**Solution:** Wrap all GeoPandas/Fiona/rasterio operations in `asyncio.run_in_executor()` using a dedicated thread pool.

```python
from concurrent.futures import ThreadPoolExecutor
_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="gis_io")

async def ingest_geojson(file_bytes):
    def _process():
        import geopandas as gpd
        return gpd.read_file(io.BytesIO(file_bytes))
    return await asyncio.get_event_loop().run_in_executor(_executor, _process)
```

**Prevention:** Every function in `gis_processor.py` uses this pattern. Never call GeoPandas directly in an async
function body.

---
