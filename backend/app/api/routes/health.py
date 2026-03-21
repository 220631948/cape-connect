"""
Health check endpoint — GET /health
Returns database connection status for Railway health checks.
"""

from fastapi import APIRouter

from app.core.config import settings
from app.core.database import check_db_connection

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Returns service health including database connectivity.
    Used by Railway and docker-compose health checks.
    """
    db_ok = await check_db_connection()

    return {
        "status": "ok" if db_ok else "degraded",
        "db": "connected" if db_ok else "disconnected",
        "version": settings.app_version,
    }
