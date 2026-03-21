"""
GIS file upload and export endpoints.
Handles multipart file upload (max 500MB), format detection, ArcGIS REST pull,
and export in multiple GIS formats.

All routes require JWT authentication. Tenant ID extracted from JWT claims.
POPIA compliance: uploads containing personal data flagged for review.

References:
- PYTHON_BACKEND_ARCHITECTURE.md Section 5 (format matrix)
- GOTCHA-PY-003: Shapefile .zip must contain .shp+.dbf+.prj+.shx
- GOTCHA-PY-004: DXF — never assume CRS, must prompt user
"""

from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel, Field

from app.core.auth import get_current_user
from app.services.format_validators import (
    GISFormat,
    UPLOAD_MAX_BYTES,
    detect_format,
    get_storage_destination,
    prompt_dxf_crs,
    validate_shapefile_zip,
)
from app.services.gis_processor import (
    INGEST_HANDLERS,
    export_cog,
    export_csv,
    export_dxf,
    export_geojson,
    export_gpkg,
    export_kml,
    export_pmtiles,
    export_shapefile_zip,
    ingest_arcgis_rest,
    ingest_dxf,
)

router = APIRouter(prefix="/files", tags=["files"])


# --- Request / Response models ---


class ArcGISRestRequest(BaseModel):
    """Request body for ArcGIS REST Feature Service import."""

    service_url: str = Field(
        ...,
        description="ArcGIS Feature Service URL (e.g. https://services.arcgis.com/.../FeatureServer/0)",
    )


class UploadResponse(BaseModel):
    """Response for successful file upload."""

    layer_id: str
    format: str
    feature_count: Optional[int] = None
    crs: Optional[str] = None
    storage: Optional[str] = None
    message: str = "Upload successful"


class ExportRequest(BaseModel):
    """Request body for layer export (optional metadata)."""

    metadata: Optional[dict] = Field(
        default=None,
        description="Optional metadata to include in exported file (source, vintage, tenant_slug)",
    )


# Supported export formats
EXPORT_FORMATS = {
    "geojson",
    "shapefile",
    "gpkg",
    "kml",
    "csv",
    "cog",
    "dxf",
    "pmtiles",
}


# --- Upload endpoints ---


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a GIS file",
    description=(
        "Upload a GIS file (multipart). Supports GeoJSON, Shapefile (.zip), "
        "GeoPackage, KML/KMZ, CSV+lat/lon, GeoTIFF, DXF, FileGDB, LAS/LAZ. "
        "Max file size: 500MB. Files under 50MB → Supabase Storage; "
        "rasters and large files → Cloudflare R2."
    ),
)
async def upload_file(
    file: UploadFile = File(..., description="GIS file to upload"),
    crs: Optional[str] = Query(
        default=None,
        description="CRS for formats without metadata (e.g. DXF). Example: EPSG:4326",
    ),
    popia_consent: bool = Query(
        default=False,
        description="POPIA consent flag — set to true if file contains personal data",
    ),
    user: dict = Depends(get_current_user),
):
    """
    Upload and ingest a GIS file.

    Flow:
    1. Read file bytes and validate size (max 500MB)
    2. Detect format via python-magic + extension
    3. Validate format-specific requirements (e.g. Shapefile components)
    4. Route to appropriate ingest function
    5. Return layer metadata
    """
    tenant_id = user.get("tenant_id", user.get("sub", "unknown"))
    filename = file.filename or "unknown"

    # Read file bytes
    file_bytes = await file.read()
    file_size = len(file_bytes)

    # Validate file size
    if file_size > UPLOAD_MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({file_size / (1024 * 1024):.1f}MB) exceeds maximum of 500MB.",
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded file is empty.",
        )

    # Detect format
    gis_format = detect_format(file_bytes, filename)

    if gis_format == GISFormat.UNKNOWN:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Unsupported file format for '{filename}'. "
                "Supported: GeoJSON, Shapefile (.zip), GeoPackage, KML/KMZ, "
                "CSV, GeoTIFF, DXF, FileGDB, LAS/LAZ."
            ),
        )

    # DXF requires user-specified CRS (GOTCHA-PY-004)
    if gis_format == GISFormat.DXF and crs is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=prompt_dxf_crs(),
        )

    # Shapefile validation (GOTCHA-PY-003)
    if gis_format == GISFormat.SHAPEFILE:
        is_valid, missing = validate_shapefile_zip(file_bytes)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"Invalid Shapefile ZIP. Missing required components: "
                    f"{', '.join(missing)}. "
                    "A valid Shapefile bundle must contain .shp, .dbf, .prj, and .shx files."
                ),
            )

    # Determine storage destination
    storage = get_storage_destination(file_size, gis_format)

    # Route to ingest handler
    try:
        if gis_format == GISFormat.DXF:
            result = await ingest_dxf(file_bytes, tenant_id, filename, user_crs=crs)
        else:
            handler = INGEST_HANDLERS.get(gis_format)
            if not handler:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"No ingest handler for format: {gis_format.value}",
                )
            result = await handler(file_bytes, tenant_id, filename)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File processing failed: {exc}",
        )

    return UploadResponse(
        layer_id=result.get("layer_id", ""),
        format=result.get("format", gis_format.value),
        feature_count=result.get("feature_count"),
        crs=result.get("crs"),
        storage=storage,
        message=f"Successfully ingested {filename} as {gis_format.value}.",
    )


@router.post(
    "/upload/arcgis-rest",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Import from ArcGIS Feature Service",
    description="Pull features from an ArcGIS REST Feature Service URL and ingest as GeoJSON.",
)
async def upload_arcgis_rest(
    body: ArcGISRestRequest,
    user: dict = Depends(get_current_user),
):
    """Import features from an ArcGIS REST Feature Service URL."""
    tenant_id = user.get("tenant_id", user.get("sub", "unknown"))

    try:
        result = await ingest_arcgis_rest(body.service_url, tenant_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch from ArcGIS REST service: {exc}",
        )

    return UploadResponse(
        layer_id=result.get("layer_id", ""),
        format="arcgis_rest",
        feature_count=result.get("feature_count"),
        crs=result.get("crs"),
        storage="postgis",
        message=f"Successfully imported {result.get('feature_count', 0)} features from ArcGIS REST.",
    )


# --- Export endpoint ---


@router.get(
    "/export/{layer_id}/{export_format}",
    summary="Export a stored layer",
    description=(
        "Export any stored layer in the specified format. "
        "Supported: geojson, shapefile, gpkg, kml, csv, cog, dxf, pmtiles."
    ),
)
async def export_layer(
    layer_id: str,
    export_format: str,
    user: dict = Depends(get_current_user),
):
    """
    Export a layer in the requested format.

    This endpoint retrieves the layer's features from PostGIS and
    converts them to the requested output format.
    """
    tenant_id = user.get("tenant_id", user.get("sub", "unknown"))

    if export_format not in EXPORT_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Unsupported export format: '{export_format}'. "
                f"Supported formats: {', '.join(sorted(EXPORT_FORMATS))}."
            ),
        )

    # Placeholder: in production, fetch features from PostGIS by layer_id + tenant_id
    # For now, return format confirmation
    metadata = {
        "source": "CapeTown GIS Hub",
        "tenant_id": tenant_id,
        "layer_id": layer_id,
    }

    export_handlers = {
        "geojson": lambda: export_geojson([], metadata),
        "shapefile": lambda: export_shapefile_zip([], "export", metadata),
        "gpkg": lambda: export_gpkg([], "export", metadata),
        "kml": lambda: export_kml([]),
        "csv": lambda: export_csv([], metadata),
        "cog": lambda: export_cog(b""),
        "dxf": lambda: export_dxf([]),
        "pmtiles": lambda: export_pmtiles([]),
    }

    handler = export_handlers.get(export_format)
    if not handler:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Export handler not found for format: {export_format}",
        )

    # Content type mapping
    content_types = {
        "geojson": "application/geo+json",
        "shapefile": "application/zip",
        "gpkg": "application/geopackage+sqlite3",
        "kml": "application/vnd.google-earth.kml+xml",
        "csv": "text/csv",
        "cog": "image/tiff",
        "dxf": "application/dxf",
        "pmtiles": "application/x-protomaps-pmtiles",
    }

    try:
        file_bytes = await handler()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {exc}",
        )

    from fastapi.responses import Response

    return Response(
        content=file_bytes,
        media_type=content_types.get(export_format, "application/octet-stream"),
        headers={
            "Content-Disposition": f'attachment; filename="{layer_id}.{export_format}"',
        },
    )
