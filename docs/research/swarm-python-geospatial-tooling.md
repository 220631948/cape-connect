# Swarm Research — Python Geospatial Tooling (Repository Applicability)

**Task ID:** `swarm-research-python-geospatial`  
**Date:** 2026-03-05  
**Scope:** GeoPandas, Rasterio, Shapely, pyproj, Fiona/GDAL, PostGIS adapters, tiling/interchange patterns; applicability to this repository and near-term documentation/roadmap updates.

## Verified (from repository evidence)

1. **Current runtime stack is JS/TS + PostGIS + Martin, not Python-first.**  
   - Runtime dependencies are Next.js/React/MapLibre/Supabase/PMTiles; no Python geospatial packages are present in `package.json` (`package.json:16-40`).  
   - Local platform services are PostGIS + Martin (+ LocalStack), with no Python geospatial service in compose (`docker-compose.yml:4-49`).  
   - Docs position this stack as authoritative (`docs/architecture/TECH_STACK.md:3-37`, `README.md:5-12`).

2. **Python is documented for ETL/research, but operational code is minimal today.**  
   - ETL documentation explicitly states Python + pandas/geopandas + psycopg2/SQLAlchemy (`docs/ETL_PIPELINE.md:4`, `docs/ETL_PIPELINE.md:16-18`).  
   - Python geospatial ecosystem is documented as optional/future-facing (M10+) in research (`docs/research/05_Python_Geo_Stack.md:3-6`, `docs/research/README.md:16-23`).  
   - Actual repository Python scripts are non-geospatial utility scripts (license/provenance only) (`scripts/pipeline/license_checker.py:1-143`, `scripts/pipeline/provenance.py:1-120`).

3. **PostGIS foundation exists and is aligned for Python adapter interop later.**  
   - PostGIS extension enabled; geometry columns and GiST indexes exist in migrations (`supabase/migrations/20250227140000_initial_schema.sql:8`, `:55`, `:67`, `:226-228`).  
   - RLS and tenant-scoped patterns are codified, relevant to any future Python data service (`supabase/migrations/20250227140000_initial_schema.sql:136-222`, `docs/specs/11-multitenant-architecture.md:3-4`).

4. **CRS and ingestion pathways currently emphasize browser/server JS toolchains.**  
   - File import flow references `proj4js` reprojection (`docs/architecture/file-import-pipeline.md:13-17`, `:60-77`).  
   - ArcGIS/QGIS docs reference `shpjs`, `sql.js`, and browser/server conversion paths rather than Python ingestion libraries (`docs/integrations/arcgis-formats.md:15-21`, `docs/integrations/qgis-formats.md:13-17`).

5. **Tiling/interchange patterns are strongly defined and implementation-oriented.**  
   - Martin MVT and PMTiles pipeline are documented in specs (`docs/specs/07-martin-tile-server.md:3`, `:14-25`, `:131-148`; `docs/specs/08-pmtiles-pipeline.md:3`, `:13-27`, `:38-59`).  
   - Spatial architecture documents explicit flow: PostGIS → Martin → tippecanoe/PMTiles (`docs/specs/04-spatial-data-architecture.md:56-64`, `:113-121`).

## Unverified / Not Yet Implemented (based on repo state)

1. **No repository-managed Python geospatial environment** was found (no root `requirements*.txt`/`pyproject.toml` for the product codebase; only extension-internal `.gemini/...` environments were found by file search).  

2. **GeoPandas/Rasterio/Shapely/pyproj/Fiona are not imported in first-party runtime scripts** under `scripts/`; only utility Python scripts are present (`scripts/pipeline/license_checker.py`, `scripts/pipeline/provenance.py`).

3. **Documented ETL implementation path appears partially placeholder-level** (example references to script paths and flows exist in docs, but corresponding first-party ingestion scripts are not present in repo root app code) (`docs/specs/12-gv-roll-ingestion.md:90-115`, `docs/ETL_PIPELINE.md:45-81`).

4. **Several GDAL/Fiona/pyproj claims live in research/design docs but are not yet tied to concrete production modules** in this repository (`docs/research/gis-file-formats-research.md:3`, `:18-25`, `:39-44`; `docs/research/05_Python_Geo_Stack.md:8-18`).

## Tooling Assessment by Requested Category

### 1) GeoPandas
- **Repo evidence:** Mentioned in ETL and research docs (`docs/ETL_PIPELINE.md:17`, `docs/research/05_Python_Geo_Stack.md:9`, `:16`, `:56-63`).
- **Implementation status:** Documentation-level only in core app repo.
- **Near-term applicability:** Medium for GV Roll/batch ETL documentation path; low for immediate M0–M4 web runtime.

### 2) Rasterio
- **Repo evidence:** Mentioned in research docs as imagery plumbing (`docs/research/05_Python_Geo_Stack.md:12`, `:18`).
- **Implementation status:** Not present in first-party Python scripts.
- **Near-term applicability:** Low-to-medium until raster analytics milestones are actively scheduled.

### 3) Shapely
- **Repo evidence:** Present in reference catalog links only (`docs/research/reference_url_catalog.md:146`).
- **Implementation status:** No direct usage evidence in repository code/docs as an adopted component.
- **Near-term applicability:** Low unless Python geospatial service is introduced.

### 4) pyproj
- **Repo evidence:** pyproj docs linked in references (`docs/research/reference_url_catalog.md:148`); operational CRS design currently points to `proj4js` + PostGIS `ST_Transform` (`docs/architecture/file-import-pipeline.md:13`, `docs/specs/12-gv-roll-ingestion.md:119-129`).
- **Implementation status:** No direct pyproj usage in repository scripts.
- **Near-term applicability:** Low for current architecture, unless Python ETL/service is formalized.

### 5) Fiona / GDAL
- **Repo evidence:** GDAL appears in research/planning documents and format strategy discussion (`docs/research/gis-file-formats-research.md:3`, `:18-25`, `:39-40`; `docs/research/spatial-intelligence/gis-features.md:192`, `:301-335`).
- **Implementation status:** No concrete first-party GDAL/Fiona integration module in app code.
- **Near-term applicability:** Medium for import-pipeline hardening documentation; implementation currently uncommitted.

### 6) PostGIS Adapters (psycopg2 / SQLAlchemy / GeoAlchemy)
- **Repo evidence:** Adapter options documented for Python ETL/research (`docs/ETL_PIPELINE.md:17`, `:47-51`; `docs/research/05_Python_Geo_Stack.md:15-18`).
- **Implementation status:** Referenced, not productized in first-party runtime.
- **Near-term applicability:** Medium for formalizing ETL runbooks and batch pipelines.

### 7) Tiling / Interchange Patterns
- **Repo evidence:** Strongly specified (Martin MVT, PMTiles, tippecanoe, GeoJSON interchange) (`docs/specs/07-martin-tile-server.md`, `docs/specs/08-pmtiles-pipeline.md`, `docs/specs/04-spatial-data-architecture.md`, `docs/integrations/arcgis-formats.md`, `docs/integrations/qgis-formats.md`).
- **Implementation status:** Documented architecture baseline; some operational assumptions still marked draft/unverified.
- **Near-term applicability:** High; this is the active architecture centerline.

## Concrete Recommended Documentation Updates (by file path)

1. **`docs/architecture/TECH_STACK.md`**  
   Add a short subsection: “Python geospatial tooling status (documented optional path, not core runtime)” with explicit status markers for GeoPandas/Rasterio/Shapely/pyproj/Fiona.

2. **`docs/ETL_PIPELINE.md`**  
   Add an “Implementation evidence” table mapping each pipeline step to current repository scripts/files (or explicit “not yet implemented in repo” markers).

3. **`docs/specs/12-gv-roll-ingestion.md`**  
   Add a “Code existence check” note for referenced script paths and separate pseudocode from implemented pipeline modules.

4. **`docs/research/05_Python_Geo_Stack.md`**  
   Add a “Repository fit snapshot” section linking to current non-Python core stack docs and clarifying which claims are strategic research vs implemented components.

5. **`ROADMAP.md`**  
   Add a line item under milestone gates or assumptions: “Python geospatial service decision checkpoint” (triggered only when moving beyond current PostGIS/MapLibre/Martin centerline).

6. **`README.md`**  
   Add a brief note under Stack/Architecture clarifying that Python geospatial tooling is currently documentation-path/optional and not part of required local dev bootstrap.

## Short Applicability Summary

- The repository is currently optimized around **PostGIS + Martin + MapLibre + PMTiles** as the near-term delivery path.  
- Python geospatial tooling is **well-represented in research and ETL planning docs** but **not yet materialized as first-party implementation modules** in this codebase.  
- Near-term documentation quality improves most by tightening “implemented vs planned” boundaries in ETL/spec/research documents.
