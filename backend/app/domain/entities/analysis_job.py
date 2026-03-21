"""
Analysis job entity — tracks async spatial/ML analysis lifecycle.

Pattern: Entity (DDD) — identity by job_id, mutable state.
"""

from __future__ import annotations

import enum
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone


class JobStatus(str, enum.Enum):
    """Job lifecycle states — linear progression."""

    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass(slots=True)
class AnalysisJob:
    """
    Mutable entity tracking an async analysis task.

    Identity: job_id (UUID).
    Invariant: tenant_id is immutable after creation (multi-tenant isolation).
    """

    job_id: uuid.UUID
    tenant_id: uuid.UUID
    job_type: str
    status: JobStatus = JobStatus.QUEUED
    celery_task_id: str | None = None
    result_url: str | None = None
    error_message: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def start(self, celery_task_id: str) -> None:
        """Transition to RUNNING. O(1)."""
        self.status = JobStatus.RUNNING
        self.celery_task_id = celery_task_id
        self.updated_at = datetime.now(timezone.utc)

    def complete(self, result_url: str) -> None:
        """Transition to COMPLETED with result. O(1)."""
        self.status = JobStatus.COMPLETED
        self.result_url = result_url
        self.updated_at = datetime.now(timezone.utc)

    def fail(self, error: str) -> None:
        """Transition to FAILED with error. O(1)."""
        self.status = JobStatus.FAILED
        self.error_message = error
        self.updated_at = datetime.now(timezone.utc)

    def cancel(self) -> None:
        """Transition to CANCELLED. O(1)."""
        if self.status in (JobStatus.QUEUED, JobStatus.RUNNING):
            self.status = JobStatus.CANCELLED
            self.updated_at = datetime.now(timezone.utc)

    def to_dict(self) -> dict:
        """Serialize for API response."""
        return {
            "job_id": str(self.job_id),
            "tenant_id": str(self.tenant_id),
            "job_type": self.job_type,
            "status": self.status.value,
            "celery_task_id": self.celery_task_id,
            "result_url": self.result_url,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
