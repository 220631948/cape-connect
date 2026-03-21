"""
Spatial analysis API endpoints.
All routes require JWT authentication and enforce Cape Town bounding box.

Endpoints:
  POST /spatial/trading-bay-suitability
  POST /spatial/intersection
  POST /spatial/buffer
  POST /spatial/proximity-score
  GET  /spatial/suburb/{name}/stats
"""

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_session
from app.services.spatial_analysis import (
    buffer_query,
    intersection_query,
    proximity_score,
    suburb_stats,
    trading_bay_suitability,
)

router = APIRouter(prefix="/spatial", tags=["spatial"])


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class GeoJSONGeometry(BaseModel):
    """GeoJSON geometry object."""
    type: str = Field(..., description="Geometry type (Point, Polygon, etc.)")
    coordinates: list = Field(..., description="Coordinate array")


class TradingBaySuitabilityRequest(BaseModel):
    """Request body for trading bay suitability analysis."""
    polygon: GeoJSONGeometry = Field(..., description="Candidate bay polygon in EPSG:4326")


class SuitabilityCriteria(BaseModel):
    watercourse_distance_m: float
    slope_pct: float
    flood_risk_class: str
    heritage_overlap: bool
    existing_bay_proximity_m: float
    gradient_accessible: bool


class TradingBaySuitabilityResponse(BaseModel):
    score: float = Field(..., ge=0, le=100)
    criteria: SuitabilityCriteria
    verdict: str = Field(..., pattern="^(SUITABLE|CONDITIONAL|UNSUITABLE)$")
    blocking_constraints: list[str]


class IntersectionRequest(BaseModel):
    polygon: GeoJSONGeometry = Field(..., description="Query polygon in EPSG:4326")
    layer: str = Field(..., description="Target layer name")


class BufferRequest(BaseModel):
    geometry: GeoJSONGeometry = Field(..., description="Centre point or polygon in EPSG:4326")
    radius_m: float = Field(..., gt=0, le=50000, description="Buffer radius in metres")
    layer: str = Field(..., description="Target layer name")


class ProximityCriterion(BaseModel):
    layer: str
    weight: float = Field(default=1.0, gt=0)
    ideal_distance_m: float = Field(default=500, gt=0)
    max_distance_m: float = Field(default=5000, gt=0)


class ProximityScoreRequest(BaseModel):
    polygon: GeoJSONGeometry = Field(..., description="Subject polygon in EPSG:4326")
    criteria: list[ProximityCriterion] = Field(..., min_length=1)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_tenant_id(user: dict) -> str:
    """Extract tenant_id from JWT claims. Rejects if missing."""
    tenant_id = (
        user.get("app_metadata", {}).get("tenant_id")
        or user.get("user_metadata", {}).get("tenant_id")
        or user.get("tenant_id")
    )
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tenant_id found in JWT claims.",
        )
    return str(tenant_id)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/trading-bay-suitability",
    response_model=TradingBaySuitabilityResponse,
    summary="Multi-criteria suitability score for a candidate trading bay",
)
async def post_trading_bay_suitability(
    body: TradingBaySuitabilityRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    tenant_id = _extract_tenant_id(user)
    try:
        result = await trading_bay_suitability(
            polygon_geojson=body.polygon.model_dump(),
            tenant_id=tenant_id,
            session=session,
        )
        return result
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post(
    "/intersection",
    summary="Features intersecting a drawn polygon",
)
async def post_intersection(
    body: IntersectionRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    tenant_id = _extract_tenant_id(user)
    try:
        return await intersection_query(
            polygon_geojson=body.polygon.model_dump(),
            layer_name=body.layer,
            tenant_id=tenant_id,
            session=session,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post(
    "/buffer",
    summary="Features within N metres of a point or polygon",
)
async def post_buffer(
    body: BufferRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    tenant_id = _extract_tenant_id(user)
    try:
        return await buffer_query(
            point_geojson=body.geometry.model_dump(),
            radius_m=body.radius_m,
            layer_name=body.layer,
            tenant_id=tenant_id,
            session=session,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post(
    "/proximity-score",
    summary="Weighted proximity score against multiple layers",
)
async def post_proximity_score(
    body: ProximityScoreRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    tenant_id = _extract_tenant_id(user)
    try:
        criteria_dicts = [c.model_dump() for c in body.criteria]
        return await proximity_score(
            polygon_geojson=body.polygon.model_dump(),
            scoring_criteria=criteria_dicts,
            tenant_id=tenant_id,
            session=session,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get(
    "/suburb/{name}/stats",
    summary="Aggregate spatial statistics for a suburb",
)
async def get_suburb_stats(
    name: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    tenant_id = _extract_tenant_id(user)
    result = await suburb_stats(
        suburb_name=name,
        tenant_id=tenant_id,
        session=session,
    )
    if not result.get("found", True):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.get("error", "Suburb not found."),
        )
    return result
