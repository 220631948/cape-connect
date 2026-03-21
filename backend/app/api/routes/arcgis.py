"""
ArcGIS REST proxy endpoints.

Provides cached access to City of Cape Town and Western Cape ArcGIS
REST services with three-tier fallback (LIVE → CACHED → MOCK).

All routes require JWT authentication.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.core.auth import get_current_user
from app.services.arcgis_client import (
    CAPE_TOWN_BBOX,
    COCT_SERVICE_URL,
    WC_SERVICE_URL,
    DataSource,
    _validate_bbox,
    clear_cache,
    enumerate_services,
    get_available_layers,
    query_with_fallback,
)

router = APIRouter(prefix="/arcgis", tags=["arcgis"])


# --- Response models ---

class LayerInfo(BaseModel):
    name: str
    description: str
    source: str
    status: str


class LayersResponse(BaseModel):
    layers: dict[str, LayerInfo]
    coct_service_status: str = Field(
        description="Status of CoCT ArcGIS REST service directory"
    )
    wc_service_status: str = Field(
        description="Status of Western Cape GIS service directory"
    )


class FeatureQueryResponse(BaseModel):
    type: str = "FeatureCollection"
    features: list = []
    source: str = Field(description="Data source: LIVE, CACHED, or MOCK")
    layer_key: str
    bbox: dict


class CacheWarmRequest(BaseModel):
    layers: Optional[list[str]] = Field(
        default=None,
        description="Layer keys to warm. If None, warms all known layers.",
    )
    zoom_levels: list[int] = Field(
        default=[10, 12, 14],
        description="Zoom levels to pre-cache.",
    )


class CacheWarmResponse(BaseModel):
    status: str
    message: str
    task_id: Optional[str] = None


class ServiceDirectoryResponse(BaseModel):
    status: str
    http_code: Optional[int] = None
    folders: list = []
    services: list = []
    current_version: Optional[float] = None
    url: str
    error: Optional[str] = None


# --- Endpoints ---

@router.get("/layers", response_model=LayersResponse)
async def list_layers(
    user: dict = Depends(get_current_user),
):
    """
    List available City of Cape Town and Western Cape GIS layers.
    Includes current data source status (LIVE/CACHED/MOCK).
    """
    layers = get_available_layers()

    coct_status = "unavailable (HTTP 404 — service directory not found)"
    wc_status = "unknown"

    try:
        wc_result = await enumerate_services(WC_SERVICE_URL)
        wc_status = wc_result.get("status", "unknown")
        if wc_result.get("http_code") == 200:
            wc_status = f"available (v{wc_result.get('current_version', '?')}, {len(wc_result.get('folders', []))} folders)"
    except Exception:
        wc_status = "unreachable"

    return LayersResponse(
        layers={k: LayerInfo(**v) for k, v in layers.items()},
        coct_service_status=coct_status,
        wc_service_status=wc_status,
    )


@router.get("/layer/{layer_key}/features", response_model=FeatureQueryResponse)
async def get_layer_features(
    layer_key: str,
    xmin: float = Query(default=CAPE_TOWN_BBOX["xmin"], ge=18.0, le=19.5),
    ymin: float = Query(default=CAPE_TOWN_BBOX["ymin"], ge=-35.0, le=-33.0),
    xmax: float = Query(default=CAPE_TOWN_BBOX["xmax"], ge=18.0, le=19.5),
    ymax: float = Query(default=CAPE_TOWN_BBOX["ymax"], ge=-35.0, le=-33.0),
    zoom: int = Query(default=12, ge=1, le=20),
    user: dict = Depends(get_current_user),
):
    """
    Query features from a GIS layer with three-tier fallback.

    Returns GeoJSON FeatureCollection with source badge (LIVE/CACHED/MOCK).
    All queries are clipped to the Cape Town metro bounding box.
    """
    available = get_available_layers()
    if layer_key not in available:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown layer: {layer_key}. Available: {list(available.keys())}",
        )

    bbox = {"xmin": xmin, "ymin": ymin, "xmax": xmax, "ymax": ymax}

    if not _validate_bbox(bbox):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Bounding box is outside Cape Town metro area or invalid.",
        )

    geojson, source = await query_with_fallback(
        layer_key=layer_key,
        bbox=bbox,
        zoom=zoom,
    )

    return FeatureQueryResponse(
        type=geojson.get("type", "FeatureCollection"),
        features=geojson.get("features", []),
        source=source.value,
        layer_key=layer_key,
        bbox=bbox,
    )


@router.post("/cache/warm", response_model=CacheWarmResponse)
async def warm_cache(
    request: CacheWarmRequest,
    user: dict = Depends(get_current_user),
):
    """
    Trigger cache warming for ArcGIS layers.

    In production, this dispatches a Celery task. In the current
    implementation (CoCT service unavailable), it pre-populates
    the cache with MOCK data for all specified layers.
    """
    available = get_available_layers()
    layers_to_warm = request.layers or list(available.keys())

    invalid_layers = [l for l in layers_to_warm if l not in available]
    if invalid_layers:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown layers: {invalid_layers}. Available: {list(available.keys())}",
        )

    warmed_count = 0
    for layer_key in layers_to_warm:
        for zoom in request.zoom_levels:
            _, source = await query_with_fallback(
                layer_key=layer_key,
                bbox=CAPE_TOWN_BBOX,
                zoom=zoom,
            )
            warmed_count += 1

    return CacheWarmResponse(
        status="completed",
        message=f"Warmed {warmed_count} layer/zoom combinations (source: MOCK — CoCT service unavailable).",
        task_id=None,
    )


@router.get("/services/{source}", response_model=ServiceDirectoryResponse)
async def get_service_directory(
    source: str = "wc",
    user: dict = Depends(get_current_user),
):
    """
    Enumerate ArcGIS REST service directory.

    Sources:
      - "coct": City of Cape Town (currently 404)
      - "wc": Western Cape Government (available)
    """
    url_map = {
        "coct": COCT_SERVICE_URL,
        "wc": WC_SERVICE_URL,
    }

    if source not in url_map:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown source: {source}. Available: {list(url_map.keys())}",
        )

    result = await enumerate_services(url_map[source])
    return ServiceDirectoryResponse(**result)


@router.delete("/cache", status_code=status.HTTP_200_OK)
async def clear_layer_cache(
    user: dict = Depends(get_current_user),
):
    """Clear the in-memory API cache. Returns number of entries cleared."""
    count = clear_cache()
    return {"cleared": count, "message": f"Cleared {count} cached entries."}
