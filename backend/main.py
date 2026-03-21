"""
CapeTown GIS Hub — FastAPI Application Entry Point
Lifespan management, CORS configuration, and router registration.
"""

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.arcgis import router as arcgis_router
from app.api.routes.files import router as files_router
from app.api.routes.health import router as health_router
from app.api.routes.ogc import router as ogc_router
from app.api.routes.spatial import router as spatial_router
from app.core.config import settings
from app.core.database import engine

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    logger.info(
        "Starting CapeTown GIS Hub API",
        version=settings.app_version,
        debug=settings.debug,
    )
    yield
    # Shutdown: dispose the async engine connection pool
    await engine.dispose()
    logger.info("CapeTown GIS Hub API shut down.")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Python FastAPI backend for the CapeTown GIS Hub — spatial analysis, GIS file processing, and ML inference.",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# --- CORS ---
# Production: Vercel domain only — no wildcard (locked decision)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# --- Routers ---
app.include_router(health_router, tags=["health"])
app.include_router(spatial_router)
app.include_router(files_router)
app.include_router(arcgis_router)
app.include_router(ogc_router)
