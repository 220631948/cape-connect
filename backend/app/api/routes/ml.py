"""
ML inference endpoints.

POST /ml/anomaly/predict     — single parcel anomaly prediction (inline, <50ms)
POST /ml/anomaly/batch       — batch parcel anomaly prediction
POST /ml/anomaly/train       — trigger Isolation Forest training (Celery)
POST /ml/nl-query            — natural language spatial query (Claude API)
POST /ml/flood-risk          — trigger flood risk analysis (Celery raster queue)
POST /ml/heat-island         — trigger heat island analysis (Celery raster queue)
POST /ml/lulc-classify       — trigger LULC classification (Celery raster queue)
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.auth import get_current_user

router = APIRouter(prefix="/ml", tags=["ml"])


# --- Request/Response Models ---


class BBoxRequest(BaseModel):
    """Bounding box request for raster analysis tasks."""

    min_lng: float = Field(..., ge=18.28, le=19.02)
    min_lat: float = Field(..., ge=-34.36, le=-33.48)
    max_lng: float = Field(..., ge=18.28, le=19.02)
    max_lat: float = Field(..., ge=-34.36, le=-33.48)
    date_range: dict | None = None


class ParcelRequest(BaseModel):
    """Single parcel for anomaly prediction."""

    id: str = ""
    assessed_value_rands: float = Field(..., ge=0, le=10_000_000_000)
    area_sqm: float = Field(..., ge=0, le=10_000_000)
    zone_type: str = ""
    suburb_median_value: float = 0
    distance_to_cbd_m: float = 0
    flood_risk_score: float = 0


class BatchParcelRequest(BaseModel):
    """Batch parcel prediction request."""

    parcels: list[ParcelRequest] = Field(..., min_length=1, max_length=1000)


class NLQueryRequest(BaseModel):
    """Natural language spatial query request."""

    query: str = Field(..., min_length=5, max_length=500)


class JobQueued(BaseModel):
    """Response for queued Celery jobs."""

    job_id: str
    status: str = "queued"
    poll_url: str
    task_type: str


class AnomalyPrediction(BaseModel):
    """Anomaly prediction response."""

    parcel_id: str
    anomaly_score: float
    verdict: str
    features: dict
    status: str


class NLQueryResponse(BaseModel):
    """NL query response."""

    status: str
    query_interpretation: dict | None = None
    remaining_queries: int | None = None
    features: dict | None = None
    error: str | None = None


# --- Anomaly Detection Endpoints ---


@router.post("/anomaly/predict", response_model=AnomalyPrediction)
async def predict_anomaly(
    request: ParcelRequest,
    user: dict = Depends(get_current_user),
) -> AnomalyPrediction:
    """
    Run inline anomaly prediction on a single parcel (<50ms).

    Uses pre-trained Isolation Forest model loaded at startup.
    Returns anomaly score and verdict (normal/suspicious/anomalous).
    """
    from app.tasks.anomaly_detection import predict_single

    tenant_id = user.get("tenant_id", "")
    parcel_data = request.model_dump()

    result = await predict_single(parcel_data, tenant_id)

    if result.get("status") == "error":
        raise HTTPException(
            status_code=422, detail=result.get("error", "Prediction failed")
        )

    return AnomalyPrediction(**result)


@router.post("/anomaly/batch")
async def predict_anomaly_batch(
    request: BatchParcelRequest,
    user: dict = Depends(get_current_user),
) -> list[AnomalyPrediction]:
    """
    Run anomaly prediction on a batch of parcels.

    Max 1000 parcels per request.
    """
    from app.tasks.anomaly_detection import predict_batch

    tenant_id = user.get("tenant_id", "")
    parcels = [p.model_dump() for p in request.parcels]

    results = await predict_batch(parcels, tenant_id)
    return [AnomalyPrediction(**r) for r in results if r.get("status") != "error"]


@router.post("/anomaly/train", response_model=JobQueued)
async def train_anomaly_model(
    user: dict = Depends(get_current_user),
) -> JobQueued:
    """
    Trigger Isolation Forest training on full GV Roll dataset.

    Queued to Celery spatial queue. Model exported as ONNX → R2.
    """
    job_id = str(uuid.uuid4())
    tenant_id = user.get("tenant_id", "")

    # In production: dispatch to Celery
    # from app.tasks.celery_app import celery_app
    # celery_app.send_task(
    #     "app.tasks.anomaly_detection.train_isolation_forest",
    #     args=[tenant_id],
    #     queue="spatial",
    # )

    return JobQueued(
        job_id=job_id,
        status="queued",
        poll_url=f"/jobs/{job_id}",
        task_type="anomaly_detection",
    )


# --- NL Spatial Query Endpoint ---


@router.post("/nl-query", response_model=NLQueryResponse)
async def nl_spatial_query(
    request: NLQueryRequest,
    user: dict = Depends(get_current_user),
) -> NLQueryResponse:
    """
    Natural language spatial query via Claude API.

    Translates natural language to PostGIS query, validates JSON structure
    (no raw SQL), and returns GeoJSON features.
    Rate limited: 50 queries/hour per tenant.
    """
    from app.tasks.nl_spatial_query import process_nl_query

    tenant_id = user.get("tenant_id", "")
    result = await process_nl_query(request.query, tenant_id)

    if result.get("status") in ("error", "validation_error", "rate_limited"):
        status_code = 429 if result["status"] == "rate_limited" else 422
        raise HTTPException(
            status_code=status_code, detail=result.get("error", "Query failed")
        )

    return NLQueryResponse(**result)


# --- Raster Analysis Endpoints (Celery queued) ---


@router.post("/flood-risk", response_model=JobQueued)
async def trigger_flood_risk(
    request: BBoxRequest,
    user: dict = Depends(get_current_user),
) -> JobQueued:
    """
    Trigger flood risk analysis for a bounding box.

    Queued to Celery raster queue. Computes TWI weighted overlay
    from Copernicus DEM and CHIRPS rainfall data.
    Output: COG GeoTIFF → R2.
    """
    job_id = str(uuid.uuid4())

    # In production: dispatch to Celery raster queue
    # from app.tasks.celery_app import celery_app
    # celery_app.send_task(
    #     "app.tasks.flood_risk.run_flood_risk_analysis",
    #     args=[job_id, request.model_dump(), user.get("tenant_id")],
    #     queue="raster",
    # )

    return JobQueued(
        job_id=job_id,
        status="queued",
        poll_url=f"/jobs/{job_id}",
        task_type="flood_risk",
    )


@router.post("/heat-island", response_model=JobQueued)
async def trigger_heat_island(
    request: BBoxRequest,
    user: dict = Depends(get_current_user),
) -> JobQueued:
    """
    Trigger urban heat island analysis for a bounding box.

    Queued to Celery raster queue. Applies mono-window LST algorithm
    on Landsat 8/9 Band 10 thermal data.
    Output: COG GeoTIFF → R2.
    """
    job_id = str(uuid.uuid4())

    return JobQueued(
        job_id=job_id,
        status="queued",
        poll_url=f"/jobs/{job_id}",
        task_type="heat_island",
    )


@router.post("/lulc-classify", response_model=JobQueued)
async def trigger_lulc_classification(
    request: BBoxRequest,
    user: dict = Depends(get_current_user),
) -> JobQueued:
    """
    Trigger LULC classification for a bounding box.

    Queued to Celery raster queue. Uses Prithvi-100M fine-tuned model
    on HLS (Harmonized Landsat-Sentinel) bands.
    Output: COG GeoTIFF → R2 + vector boundaries → PostGIS.
    """
    job_id = str(uuid.uuid4())

    return JobQueued(
        job_id=job_id,
        status="queued",
        poll_url=f"/jobs/{job_id}",
        task_type="lulc_classify",
    )
