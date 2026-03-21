"""
Job status and management endpoints.

GET  /jobs/{job_id}  → status + result_url
GET  /jobs/          → list tenant's jobs (paginated)
DELETE /jobs/{job_id} → cancel queued job
"""

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.auth import get_current_user

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobStatus(str, Enum):
    """Analysis job status."""
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETE = "complete"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobType(str, Enum):
    """Analysis job types."""
    FLOOD_RISK = "flood_risk"
    HEAT_ISLAND = "heat_island"
    LULC_CLASSIFY = "lulc_classify"
    ANOMALY_DETECTION = "anomaly_detection"
    NL_QUERY = "nl_query"
    CACHE_WARM = "cache_warm"
    FILE_IMPORT = "file_import"


class JobResponse(BaseModel):
    """Job status response."""
    job_id: str
    tenant_id: str
    task_type: str
    status: JobStatus
    created_at: str
    completed_at: str | None = None
    result_url: str | None = None
    preview_url: str | None = None
    error: str | None = None
    progress_pct: int | None = None


class JobListResponse(BaseModel):
    """Paginated job list response."""
    jobs: list[JobResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class JobCreateRequest(BaseModel):
    """Request to create a new analysis job."""
    task_type: JobType
    input_params: dict = Field(default_factory=dict)


class JobCreateResponse(BaseModel):
    """Response after creating a job."""
    job_id: str
    status: JobStatus
    poll_url: str


# In-memory job store (replaced by PostGIS analysis_jobs table in production)
_jobs: dict[str, dict] = {}


@router.get("/{job_id}", response_model=JobResponse)
async def get_job_status(
    job_id: str,
    user: dict = Depends(get_current_user),
) -> JobResponse:
    """
    Get status and result of an analysis job.

    Returns current status, result URL (when complete), or error message (when failed).
    Tenant isolation enforced — users can only see their own tenant's jobs.
    """
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    # Tenant isolation
    if job["tenant_id"] != user.get("tenant_id"):
        raise HTTPException(status_code=403, detail="Access denied: job belongs to another tenant")

    return JobResponse(**job)


@router.get("/", response_model=JobListResponse)
async def list_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: JobStatus | None = None,
    task_type: JobType | None = None,
    user: dict = Depends(get_current_user),
) -> JobListResponse:
    """
    List tenant's analysis jobs with pagination and optional filters.

    Supports filtering by status (queued/running/complete/failed) and task type.
    Results are ordered by creation time (newest first).
    """
    tenant_id = user.get("tenant_id")

    # Filter jobs for this tenant
    tenant_jobs = [
        j for j in _jobs.values()
        if j["tenant_id"] == tenant_id
    ]

    # Apply filters
    if status:
        tenant_jobs = [j for j in tenant_jobs if j["status"] == status.value]
    if task_type:
        tenant_jobs = [j for j in tenant_jobs if j["task_type"] == task_type.value]

    # Sort by created_at descending
    tenant_jobs.sort(key=lambda j: j.get("created_at", ""), reverse=True)

    # Paginate
    total = len(tenant_jobs)
    start = (page - 1) * page_size
    end = start + page_size
    page_jobs = tenant_jobs[start:end]

    return JobListResponse(
        jobs=[JobResponse(**j) for j in page_jobs],
        total=total,
        page=page,
        page_size=page_size,
        has_more=end < total,
    )


@router.post("/", response_model=JobCreateResponse)
async def create_job(
    request: JobCreateRequest,
    user: dict = Depends(get_current_user),
) -> JobCreateResponse:
    """
    Create a new analysis job and queue it for processing.

    Returns job ID and poll URL for status checking.
    The job is queued to the appropriate Celery queue based on task type.
    """
    job_id = str(uuid.uuid4())
    tenant_id = user.get("tenant_id", "")
    now = datetime.now(timezone.utc).isoformat()

    job = {
        "job_id": job_id,
        "tenant_id": tenant_id,
        "task_type": request.task_type.value,
        "status": JobStatus.QUEUED.value,
        "created_at": now,
        "completed_at": None,
        "result_url": None,
        "preview_url": None,
        "error": None,
        "progress_pct": 0,
        "input_params": request.input_params,
    }

    _jobs[job_id] = job

    # In production: dispatch to Celery
    # from app.tasks.celery_app import celery_app
    # task = celery_app.send_task(
    #     f"app.tasks.{request.task_type.value}.run",
    #     args=[job_id, request.input_params, tenant_id],
    #     queue=_get_queue_for_task(request.task_type),
    # )
    # job["celery_task_id"] = task.id

    return JobCreateResponse(
        job_id=job_id,
        status=JobStatus.QUEUED,
        poll_url=f"/jobs/{job_id}",
    )


@router.delete("/{job_id}")
async def cancel_job(
    job_id: str,
    user: dict = Depends(get_current_user),
) -> dict[str, str]:
    """
    Cancel a queued or running job.

    Only jobs in 'queued' or 'running' status can be cancelled.
    Completed or failed jobs cannot be cancelled.
    """
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    # Tenant isolation
    if job["tenant_id"] != user.get("tenant_id"):
        raise HTTPException(status_code=403, detail="Access denied: job belongs to another tenant")

    if job["status"] not in (JobStatus.QUEUED.value, JobStatus.RUNNING.value):
        raise HTTPException(
            status_code=409,
            detail=f"Cannot cancel job in '{job['status']}' status",
        )

    # In production: revoke Celery task
    # from app.tasks.celery_app import celery_app
    # celery_app.control.revoke(job.get("celery_task_id"), terminate=True)

    job["status"] = JobStatus.CANCELLED.value
    job["completed_at"] = datetime.now(timezone.utc).isoformat()

    return {"job_id": job_id, "status": "cancelled"}


def _get_queue_for_task(task_type: JobType) -> str:
    """Map task type to Celery queue."""
    raster_tasks = {JobType.FLOOD_RISK, JobType.HEAT_ISLAND, JobType.LULC_CLASSIFY}
    if task_type in raster_tasks:
        return "raster"
    if task_type == JobType.CACHE_WARM:
        return "cache"
    if task_type == JobType.FILE_IMPORT:
        return "import"
    return "spatial"
