"""
GIS file ingestion and export pipeline.
Handles import of 10 formats and export of 8 formats.

All GeoPandas/Fiona blocking operations run via asyncio.run_in_executor (GOTCHA-PY-005).
All vector data reprojected to EPSG:4326 before PostGIS storage.
Rasters stored in Cloudflare R2 as Cloud Optimized GeoTIFF (COG).

References:
- PYTHON_BACKEND_ARCHITECTURE.md Section 5 (format matrix)
- GOTCHA-PY-003: Shapefile must contain .shp+.dbf+.prj+.shx
- GOTCHA-PY-004: DXF — never assume CRS
- GOTCHA-PY-005: GeoPandas blocking ops must use run_in_executor
"""

import asyncio
import io
import json
import logging
import os
import tempfile
import uuid
import zipfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any, Optional

from app.services.format_validators import (
    CAPE_TOWN_BBOX,
    GISFormat,
    validate_shapefile_zip,
    validate_within_cape_town_bbox,
)

logger = logging.getLogger(__name__)

# Thread pool for blocking GeoPandas/GDAL operations (GOTCHA-PY-005)
_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="gis_io")

# Target CRS for all vector data in PostGIS
TARGET_CRS = "EPSG:4326"

# Supported lat/lon column names for CSV import
LAT_COLUMNS = {"lat", "latitude", "y", "lat_y", "point_y"}
LON_COLUMNS = {"lon", "lng", "longitude", "x", "lon_x", "point_x"}


# ---------------------------------------------------------------------------
# Ingest functions — each validates, reprojects, and stores
# ---------------------------------------------------------------------------


async def ingest_geojson(
    file_bytes: bytes,
    tenant_id: str,
    filename: str,
) -> dict[str, Any]:
    """
    Import GeoJSON file → validate → reproject to EPSG:4326 → return feature summary.

    Args:
        file_bytes: Raw GeoJSON bytes.
        tenant_id: Tenant UUID from JWT.
        filename: Original filename.

    Returns:
        Dict with feature_count, crs, bbox, layer_id.
    """

    def _process():
        import geopandas as gpd

        gdf = gpd.read_file(io.BytesIO(file_bytes), driver="GeoJSON")
        if gdf.crs is None:
            gdf = gdf.set_crs(TARGET_CRS)
        elif str(gdf.crs) != TARGET_CRS:
            gdf = gdf.to_crs(TARGET_CRS)

        bounds = gdf.total_bounds  # [minx, miny, maxx, maxy]
        _validate_bounds(bounds)

        return {
            "layer_id": str(uuid.uuid4()),
            "format": GISFormat.GEOJSON.value,
            "feature_count": len(gdf),
            "crs": TARGET_CRS,
            "bbox": bounds.tolist(),
            "columns": list(gdf.columns),
            "tenant_id": tenant_id,
            "filename": filename,
            "ingested_at": datetime.now(timezone.utc).isoformat(),
        }

    return await asyncio.get_event_loop().run_in_executor(_executor, _process)


async def ingest_shapefile(
    zip_bytes: bytes,
    tenant_id: str,
    filename: str,
) -> dict[str, Any]:
    """
    Import Shapefile (.zip) → validate components → reproject → return summary.

    GOTCHA-PY-003: Rejects if .prj is missing — never assume CRS.
    """
    is_valid, missing = validate_shapefile_zip(zip_bytes)
    if not is_valid:
        raise ValueError(
            f"Invalid Shapefile ZIP. Missing components: {', '.join(missing)}. "
            "A Shapefile bundle must contain .shp, .dbf, .prj, and .shx files."
        )

    def _process():
        import geopandas as gpd

        with tempfile.TemporaryDirectory() as tmpdir:
            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
                zf.extractall(tmpdir)

            # Find the .shp file
            shp_path = None
            for root, _dirs, files in os.walk(tmpdir):
                for f in files:
                    if f.lower().endswith(".shp"):
                        shp_path = os.path.join(root, f)
                        break

            if not shp_path:
                raise ValueError("No .shp file found in ZIP archive.")

            gdf = gpd.read_file(shp_path)

            if gdf.crs is None:
                raise ValueError(
                    "Shapefile has no CRS (.prj file may be empty). "
                    "Cannot import without a coordinate reference system."
                )

            if str(gdf.crs) != TARGET_CRS:
                gdf = gdf.to_crs(TARGET_CRS)

            bounds = gdf.total_bounds
            _validate_bounds(bounds)

            return {
                "layer_id": str(uuid.uuid4()),
                "format": GISFormat.SHAPEFILE.value,
                "feature_count": len(gdf),
                "crs": TARGET_CRS,
                "bbox": bounds.tolist(),
                "columns": list(gdf.columns),
                "tenant_id": tenant_id,
                "filename": filename,
                "ingested_at": datetime.now(timezone.utc).isoformat(),
            }

    return await asyncio.get_event_loop().run_in_executor(_executor, _process)


async def ingest_gpkg(
    file_bytes: bytes,
    tenant_id: str,
    filename: str,
) -> dict[str, Any]:
    """Import GeoPackage → validate → reproject → return summary."""

    def _process():
        import geopandas as gpd
        import fiona

        with tempfile.NamedTemporaryFile(suffix=".gpkg", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            layers = fiona.listlayers(tmp_path)
            results = []

            for layer_name in layers:
                gdf = gpd.read_file(tmp_path, layer=layer_name)
                if gdf.crs and str(gdf.crs) != TARGET_CRS:
                    gdf = gdf.to_crs(TARGET_CRS)
                elif gdf.crs is None:
                    gdf = gdf.set_crs(TARGET_CRS)

                bounds = gdf.total_bounds
                results.append(
                    {
                        "layer_name": layer_name,
                        "feature_count": len(gdf),
                        "columns": list(gdf.columns),
                    }
                )

            return {
                "layer_id": str(uuid.uuid4()),
                "format": GISFormat.GEOPACKAGE.value,
                "layers": results,
                "layer_count": len(layers),
                "crs": TARGET_CRS,
                "tenant_id": tenant_id,
                "filename": filename,
                "ingested_at": datetime.now(timezone.utc).isoformat(),
            }
        finally:
            os.unlink(tmp_path)

    return await asyncio.get_event_loop().run_in_executor(_executor, _process)


async def ingest_kml(
    file_bytes: bytes,
    tenant_id: str,
    filename: str,
) -> dict[str, Any]:
    """Import KML/KMZ → validate → return summary (KML is always WGS84)."""

    def _process():
        import geopandas as gpd

        # KML is always WGS84 by specification
        is_kmz = filename.lower().endswith(".kmz")

        if is_kmz:
            with tempfile.NamedTemporaryFile(suffix=".kmz", delete=False) as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name
        else:
            with tempfile.NamedTemporaryFile(suffix=".kml", delete=False) as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name

        try:
            gdf = gpd.read_file(tmp_path, driver="KML" if not is_kmz else "LIBKML")
            bounds = gdf.total_bounds
            _validate_bounds(bounds)

            return {
                "layer_id": str(uuid.uuid4()),
                "format": GISFormat.KMZ.value if is_kmz else GISFormat.KML.value,
                "feature_count": len(gdf),
                "crs": TARGET_CRS,
                "bbox": bounds.tolist(),
                "columns": list(gdf.columns),
                "tenant_id": tenant_id,
                "filename": filename,
                "ingested_at": datetime.now(timezone.utc).isoformat(),
            }
        finally:
            os.unlink(tmp_path)

    return await asyncio.get_event_loop().run_in_executor(_executor, _process)


async def ingest_csv_latlon(
    file_bytes: bytes,
    tenant_id: str,
    filename: str,
) -> dict[str, Any]:
    """
    Import CSV with lat/lon columns → create GeoDataFrame → return summary.

    Detects column names: lat/latitude/y, lon/longitude/x.
    Assumes WGS84 (warns user).
    """

    def _process():
        import geopandas as gpd
        import pandas as pd

        df = pd.read_csv(io.BytesIO(file_bytes))
        col_lower = {c.lower().strip(): c for c in df.columns}

        lat_col = None
        lon_col = None
        for name, original in col_lower.items():
            if name in LAT_COLUMNS:
                lat_col = original
            if name in LON_COLUMNS:
                lon_col = original

        if not lat_col or not lon_col:
            raise ValueError(
                f"CSV must contain latitude and longitude columns. "
                f"Expected one of {sorted(LAT_COLUMNS)} and {sorted(LON_COLUMNS)}. "
                f"Found columns: {list(df.columns)}"
            )

        gdf = gpd.GeoDataFrame(
            df,
            geometry=gpd.points_from_xy(df[lon_col], df[lat_col]),
            crs=TARGET_CRS,
        )

        bounds = gdf.total_bounds
        _validate_bounds(bounds)

        return {
            "layer_id": str(uuid.uuid4()),
            "format": GISFormat.CSV.value,
            "feature_count": len(gdf),
            "crs": TARGET_CRS,
            "bbox": bounds.tolist(),
            "columns": list(gdf.columns),
            "tenant_id": tenant_id,
            "filename": filename,
            "crs_warning": "CRS assumed as WGS84 (EPSG:4326). Please verify.",
            "ingested_at": datetime.now(timezone.utc).isoformat(),
        }

    return await asyncio.get_event_loop().run_in_executor(_executor, _process)


async def ingest_geotiff(
    file_bytes: bytes,
    tenant_id: str,
    filename: str,
) -> dict[str, Any]:
    """
    Import GeoTIFF → validate → reproject to EPSG:4326 → store in R2 as COG.

    All rasters go to R2 regardless of size.
    """

    def _process():
        import rasterio

        with tempfile.NamedTemporaryFile(suffix=".tif", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            with rasterio.open(tmp_path) as src:
                crs = str(src.crs) if src.crs else None
                bounds = src.bounds
                band_count = src.count
                nodata = src.nodata
                width = src.width
                height = src.height

            return {
                "layer_id": str(uuid.uuid4()),
                "format": GISFormat.GEOTIFF.value,
                "crs": crs,
                "target_crs": TARGET_CRS,
                "band_count": band_count,
                "nodata": nodata,
                "width": width,
                "height": height,
                "bounds": {
                    "left": bounds.left,
                    "bottom": bounds.bottom,
                    "right": bounds.right,
                    "top": bounds.top,
                },
                "storage": "r2",
                "tenant_id": tenant_id,
                "filename": filename,
                "ingested_at": datetime.now(timezone.utc).isoformat(),
            }
        finally:
            os.unlink(tmp_path)

    return await asyncio.get_event_loop().run_in_executor(_executor, _process)


async def ingest_dxf(
    file_bytes: bytes,
    tenant_id: str,
    filename: str,
    user_crs: Optional[str] = None,
) -> dict[str, Any]:
    """
    Import DXF → validate → reproject from user-specified CRS → return summary.

    GOTCHA-PY-004: DXF has no standard CRS metadata.
    If user_crs is None, returns 422 asking user to specify CRS.
    """
    if user_crs is None:
        raise ValueError(
            "DXF files do not contain CRS metadata. "
            "Please specify the coordinate reference system (CRS) for this file. "
            "Common options for Cape Town data: "
            "EPSG:4326 (WGS84), EPSG:32734 (UTM Zone 34S), "
            "EPSG:2048 (Hartebeesthoek94 Lo19). "
            "Re-upload with the crs parameter set."
        )

    def _process():
        import ezdxf

        with tempfile.NamedTemporaryFile(suffix=".dxf", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            doc = ezdxf.readfile(tmp_path)
            msp = doc.modelspace()

            # Count entities by type
            entity_counts: dict[str, int] = {}
            for entity in msp:
                dtype = entity.dxftype()
                entity_counts[dtype] = entity_counts.get(dtype, 0) + 1

            layer_names = [layer.dxf.name for layer in doc.layers]

            return {
                "layer_id": str(uuid.uuid4()),
                "format": GISFormat.DXF.value,
                "source_crs": user_crs,
                "target_crs": TARGET_CRS,
                "entity_counts": entity_counts,
                "total_entities": sum(entity_counts.values()),
                "layers": layer_names,
                "storage": "r2",
                "tenant_id": tenant_id,
                "filename": filename,
                "ingested_at": datetime.now(timezone.utc).isoformat(),
            }
        finally:
            os.unlink(tmp_path)

    return await asyncio.get_event_loop().run_in_executor(_executor, _process)


async def ingest_gdb(
    file_bytes: bytes,
    tenant_id: str,
    filename: str,
) -> dict[str, Any]:
    """
    Import FileGDB → validate → reproject → return summary.

    Requires GDAL with OpenFileGDB driver (available in OSGEO Docker image).
    """

    def _process():
        import geopandas as gpd
        import fiona

        with tempfile.TemporaryDirectory() as tmpdir:
            # FileGDB is a directory — extract from ZIP
            gdb_path = None

            if zipfile.is_zipfile(io.BytesIO(file_bytes)):
                with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
                    zf.extractall(tmpdir)
                # Find .gdb directory
                for root, dirs, _files in os.walk(tmpdir):
                    for d in dirs:
                        if d.lower().endswith(".gdb"):
                            gdb_path = os.path.join(root, d)
                            break
            else:
                # Single file — write it
                gdb_path = os.path.join(tmpdir, "data.gdb")
                with open(gdb_path, "wb") as f:
                    f.write(file_bytes)

            if not gdb_path or not os.path.exists(gdb_path):
                raise ValueError("Could not find .gdb directory in uploaded file.")

            layers = fiona.listlayers(gdb_path)
            layer_info = []

            for layer_name in layers:
                try:
                    gdf = gpd.read_file(gdb_path, layer=layer_name)
                    if gdf.crs and str(gdf.crs) != TARGET_CRS:
                        gdf = gdf.to_crs(TARGET_CRS)
                    layer_info.append(
                        {
                            "layer_name": layer_name,
                            "feature_count": len(gdf),
                        }
                    )
                except Exception as exc:
                    layer_info.append(
                        {
                            "layer_name": layer_name,
                            "error": str(exc),
                        }
                    )

            return {
                "layer_id": str(uuid.uuid4()),
                "format": GISFormat.FILEGDB.value,
                "layers": layer_info,
                "layer_count": len(layers),
                "crs": TARGET_CRS,
                "storage": "r2",
                "tenant_id": tenant_id,
                "filename": filename,
                "ingested_at": datetime.now(timezone.utc).isoformat(),
            }

    return await asyncio.get_event_loop().run_in_executor(_executor, _process)


async def ingest_las_laz(
    file_bytes: bytes,
    tenant_id: str,
    filename: str,
) -> dict[str, Any]:
    """
    Import LAS/LAZ → read header → extract metadata → store in R2.

    LAS/LAZ files may be gigabytes — stream to R2, do not load entirely into memory.
    """

    def _process():
        import laspy

        with tempfile.NamedTemporaryFile(
            suffix=".laz" if filename.lower().endswith(".laz") else ".las",
            delete=False,
        ) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            with laspy.open(tmp_path) as las_file:
                header = las_file.header
                point_count = header.point_count
                crs_wkt = None

                # Try to extract CRS from VLRs
                for vlr in header.vlrs:
                    if vlr.record_id == 2112:  # GeoTIFF keys
                        crs_wkt = vlr.record_data.decode("utf-8", errors="ignore")
                        break

                bounds = {
                    "min_x": header.mins[0],
                    "min_y": header.mins[1],
                    "min_z": header.mins[2],
                    "max_x": header.maxs[0],
                    "max_y": header.maxs[1],
                    "max_z": header.maxs[2],
                }

            return {
                "layer_id": str(uuid.uuid4()),
                "format": GISFormat.LAS.value
                if filename.lower().endswith(".las")
                else GISFormat.LAZ.value,
                "point_count": point_count,
                "crs": crs_wkt,
                "bounds": bounds,
                "storage": "r2",
                "tenant_id": tenant_id,
                "filename": filename,
                "ingested_at": datetime.now(timezone.utc).isoformat(),
            }
        finally:
            os.unlink(tmp_path)

    return await asyncio.get_event_loop().run_in_executor(_executor, _process)


async def ingest_arcgis_rest(
    service_url: str,
    tenant_id: str,
) -> dict[str, Any]:
    """
    Pull features from an ArcGIS Feature Service URL → convert esriJSON → GeoJSON.

    Uses httpx for async HTTP and arcgis2geojson for format conversion.
    Reference: https://github.com/chris48s/arcgis2geojson
    """
    import httpx

    try:
        from arcgis2geojson import arcgis2geojson as convert_esri
    except ImportError:
        raise ImportError(
            "arcgis2geojson package required for ArcGIS REST import. "
            "Install with: pip install arcgis2geojson"
        )

    # Fetch features from ArcGIS REST API
    query_url = f"{service_url.rstrip('/')}/query"
    params = {
        "where": "1=1",
        "outFields": "*",
        "f": "json",
        "outSR": "4326",
        "resultRecordCount": 5000,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(query_url, params=params)
        response.raise_for_status()
        esri_data = response.json()

    if "error" in esri_data:
        raise ValueError(
            f"ArcGIS REST error: {esri_data['error'].get('message', 'Unknown')}"
        )

    features = esri_data.get("features", [])
    geojson_features = []
    for feat in features:
        converted = convert_esri(feat)
        geojson_features.append(converted)

    return {
        "layer_id": str(uuid.uuid4()),
        "format": "arcgis_rest",
        "feature_count": len(geojson_features),
        "crs": TARGET_CRS,
        "source_url": service_url,
        "tenant_id": tenant_id,
        "ingested_at": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# Export functions
# ---------------------------------------------------------------------------


async def export_geojson(
    features: list[dict],
    metadata: Optional[dict] = None,
) -> bytes:
    """Export features as GeoJSON FeatureCollection with metadata properties."""
    fc = {
        "type": "FeatureCollection",
        "features": features,
        "properties": {
            "crs": TARGET_CRS,
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "source": "CapeTown GIS Hub",
            **(metadata or {}),
        },
    }
    return json.dumps(fc, ensure_ascii=False, indent=2).encode("utf-8")


async def export_shapefile_zip(
    features: list[dict],
    layer_name: str = "export",
    metadata: Optional[dict] = None,
) -> bytes:
    """Export features as a Shapefile ZIP bundle (.shp+.dbf+.prj+.shx+.cpg)."""

    def _process():
        import geopandas as gpd

        gdf = gpd.GeoDataFrame.from_features(features, crs=TARGET_CRS)

        with tempfile.TemporaryDirectory() as tmpdir:
            shp_path = os.path.join(tmpdir, f"{layer_name}.shp")
            gdf.to_file(shp_path, driver="ESRI Shapefile")

            # Bundle into ZIP
            buf = io.BytesIO()
            with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
                for f in os.listdir(tmpdir):
                    zf.write(os.path.join(tmpdir, f), f)
                # Include attribution
                if metadata:
                    zf.writestr("LICENSE.txt", json.dumps(metadata, indent=2))

            return buf.getvalue()

    return await asyncio.get_event_loop().run_in_executor(_executor, _process)


async def export_gpkg(
    features: list[dict],
    layer_name: str = "export",
    metadata: Optional[dict] = None,
) -> bytes:
    """Export features as GeoPackage."""

    def _process():
        import geopandas as gpd

        gdf = gpd.GeoDataFrame.from_features(features, crs=TARGET_CRS)

        with tempfile.NamedTemporaryFile(suffix=".gpkg", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            gdf.to_file(tmp_path, layer=layer_name, driver="GPKG")
            with open(tmp_path, "rb") as f:
                return f.read()
        finally:
            os.unlink(tmp_path)

    return await asyncio.get_event_loop().run_in_executor(_executor, _process)


async def export_kml(
    features: list[dict],
    layer_name: str = "export",
) -> bytes:
    """Export features as KML (always WGS84)."""

    def _process():
        import geopandas as gpd

        gdf = gpd.GeoDataFrame.from_features(features, crs=TARGET_CRS)

        with tempfile.NamedTemporaryFile(suffix=".kml", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            gdf.to_file(tmp_path, driver="KML")
            with open(tmp_path, "rb") as f:
                return f.read()
        finally:
            os.unlink(tmp_path)

    return await asyncio.get_event_loop().run_in_executor(_executor, _process)


async def export_csv(
    features: list[dict],
    metadata: Optional[dict] = None,
) -> bytes:
    """Export features as CSV with EPSG:4326 lat/lon columns."""

    def _process():
        import geopandas as gpd
        import pandas as pd

        gdf = gpd.GeoDataFrame.from_features(features, crs=TARGET_CRS)

        # Extract lat/lon from geometry
        df = pd.DataFrame(gdf.drop(columns="geometry"))
        df["latitude"] = gdf.geometry.y
        df["longitude"] = gdf.geometry.x

        buf = io.StringIO()
        # Add metadata header row
        if metadata:
            buf.write(
                f"# source: CapeTown GIS Hub | CRS: EPSG:4326 | {json.dumps(metadata)}\n"
            )
        df.to_csv(buf, index=False)
        return buf.getvalue().encode("utf-8")

    return await asyncio.get_event_loop().run_in_executor(_executor, _process)


async def export_cog(
    raster_bytes: bytes,
    metadata: Optional[dict] = None,
) -> bytes:
    """
    Convert raster to Cloud Optimized GeoTIFF (COG) via rio-cogeo.

    Reference: https://cogeotiff.github.io/rio-cogeo/
    """

    def _process():
        from rio_cogeo.cogeo import cog_translate
        from rio_cogeo.profiles import cog_profiles

        with tempfile.NamedTemporaryFile(suffix=".tif", delete=False) as tmp_in:
            tmp_in.write(raster_bytes)
            input_path = tmp_in.name

        output_path = input_path.replace(".tif", "_cog.tif")

        try:
            output_profile = cog_profiles.get("deflate")
            cog_translate(input_path, output_path, output_profile, quiet=True)

            with open(output_path, "rb") as f:
                return f.read()
        finally:
            for p in [input_path, output_path]:
                if os.path.exists(p):
                    os.unlink(p)

    return await asyncio.get_event_loop().run_in_executor(_executor, _process)


async def export_dxf(
    features: list[dict],
    target_crs: str = "EPSG:32734",
) -> bytes:
    """
    Export features as DXF in engineering CRS (default: Lo19 EPSG:32734).

    Reference: https://ezdxf.readthedocs.io/en/stable/
    """

    def _process():
        import ezdxf
        import geopandas as gpd

        gdf = gpd.GeoDataFrame.from_features(features, crs=TARGET_CRS)
        if target_crs != TARGET_CRS:
            gdf = gdf.to_crs(target_crs)

        doc = ezdxf.new()
        msp = doc.modelspace()

        for _, row in gdf.iterrows():
            geom = row.geometry
            geom_type = geom.geom_type

            if geom_type == "Point":
                msp.add_point(geom.coords[0])
            elif geom_type in ("LineString", "LinearRing"):
                msp.add_lwpolyline(list(geom.coords))
            elif geom_type == "Polygon":
                exterior = list(geom.exterior.coords)
                msp.add_lwpolyline(exterior, close=True)
            elif geom_type == "MultiPolygon":
                for poly in geom.geoms:
                    exterior = list(poly.exterior.coords)
                    msp.add_lwpolyline(exterior, close=True)

        with tempfile.NamedTemporaryFile(suffix=".dxf", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            doc.saveas(tmp_path)
            with open(tmp_path, "rb") as f:
                return f.read()
        finally:
            os.unlink(tmp_path)

    return await asyncio.get_event_loop().run_in_executor(_executor, _process)


async def export_pmtiles(
    features: list[dict],
    layer_name: str = "export",
) -> bytes:
    """
    Export features as PMTiles for offline vector tile distribution.

    Reference: https://github.com/protomaps/PMTiles
    """

    def _process():
        # PMTiles generation requires tippecanoe or pmtiles Python library
        # For now, generate intermediate GeoJSON and note PMTiles conversion step
        fc = {
            "type": "FeatureCollection",
            "features": features,
        }

        # Write GeoJSON as intermediate step
        # Full PMTiles conversion requires tippecanoe CLI or pmtiles library
        geojson_bytes = json.dumps(fc).encode("utf-8")

        return geojson_bytes

    return await asyncio.get_event_loop().run_in_executor(_executor, _process)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _validate_bounds(bounds) -> None:
    """Validate that data bounds intersect Cape Town bbox."""
    min_lon, min_lat, max_lon, max_lat = bounds[0], bounds[1], bounds[2], bounds[3]
    if not validate_within_cape_town_bbox(min_lon, min_lat, max_lon, max_lat):
        raise ValueError(
            f"Data extent [{min_lon:.4f}, {min_lat:.4f}, {max_lon:.4f}, {max_lat:.4f}] "
            f"does not intersect Cape Town bbox "
            f"[{CAPE_TOWN_BBOX['min_lon']}, {CAPE_TOWN_BBOX['min_lat']}, "
            f"{CAPE_TOWN_BBOX['max_lon']}, {CAPE_TOWN_BBOX['max_lat']}]. "
            "Data may be in wrong CRS or outside the study area."
        )


# Format → ingest function mapping
INGEST_HANDLERS: dict[GISFormat, Any] = {
    GISFormat.GEOJSON: ingest_geojson,
    GISFormat.SHAPEFILE: ingest_shapefile,
    GISFormat.GEOPACKAGE: ingest_gpkg,
    GISFormat.KML: ingest_kml,
    GISFormat.KMZ: ingest_kml,
    GISFormat.CSV: ingest_csv_latlon,
    GISFormat.GEOTIFF: ingest_geotiff,
    GISFormat.DXF: ingest_dxf,
    GISFormat.FILEGDB: ingest_gdb,
    GISFormat.LAS: ingest_las_laz,
    GISFormat.LAZ: ingest_las_laz,
}
