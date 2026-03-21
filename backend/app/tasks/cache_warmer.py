"""
ArcGIS cache warmer Celery task.

Pre-populates the api_cache table with GeoJSON data for known layers
across standard zoom levels covering the Cape Town Metro area.

Schedule: daily at 02:00 SAST (00:00 UTC).

References:
  - PYTHON_BACKEND_ARCHITECTURE.md Section 7 (Celery task architecture)
  - Cache queue: max 5 min runtime, 1 worker
"""

import asyncio
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Standard zoom levels for cache warming
WARM_ZOOM_LEVELS = [10, 12, 14, 16]

# Celery beat schedule entry (to be registered in celery_app.py)
CACHE_WARMER_SCHEDULE = {
    "warm-arcgis-cache-daily": {
        "task": "app.tasks.cache_warmer.warm_all_layers",
        "schedule": {
            "hour": 0,
            "minute": 0,
        },
    },
}


def warm_all_layers():
    """
    Celery task: warm cache for all known ArcGIS layers.

    Iterates over pre-defined layer + zoom combinations for Cape Town Metro.
    Stores results in api_cache (in-memory for now; PostGIS api_cache table in production).

    This function is designed to be called as a Celery task.
    Since the ArcGIS client uses async, we run it in an event loop.
    """
    from app.services.arcgis_client import (
        CAPE_TOWN_BBOX,
        get_available_layers,
        query_with_fallback,
    )

    async def _warm():
        layers = get_available_layers()
        results = []

        for layer_key in layers:
            for zoom in WARM_ZOOM_LEVELS:
                try:
                    geojson, source = await query_with_fallback(
                        layer_key=layer_key,
                        bbox=CAPE_TOWN_BBOX,
                        zoom=zoom,
                    )
                    feature_count = len(geojson.get("features", []))
                    results.append({
                        "layer": layer_key,
                        "zoom": zoom,
                        "source": source.value,
                        "features": feature_count,
                        "status": "ok",
                    })
                    logger.info(
                        "Cache warmed: layer=%s zoom=%d source=%s features=%d",
                        layer_key, zoom, source.value, feature_count,
                    )
                except Exception as exc:
                    results.append({
                        "layer": layer_key,
                        "zoom": zoom,
                        "source": "ERROR",
                        "features": 0,
                        "status": f"error: {exc}",
                    })
                    logger.error(
                        "Cache warm failed: layer=%s zoom=%d error=%s",
                        layer_key, zoom, exc,
                    )

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "layers_warmed": len(results),
            "results": results,
        }

    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(_warm())
    finally:
        loop.close()


def warm_specific_layers(layer_keys: list[str], zoom_levels: list[int] = None):
    """
    Celery task: warm cache for specific layers and zoom levels.

    Args:
        layer_keys: List of layer identifiers to warm
        zoom_levels: Optional zoom levels (defaults to WARM_ZOOM_LEVELS)
    """
    from app.services.arcgis_client import (
        CAPE_TOWN_BBOX,
        get_available_layers,
        query_with_fallback,
    )

    zooms = zoom_levels or WARM_ZOOM_LEVELS
    available = get_available_layers()

    async def _warm():
        results = []
        for layer_key in layer_keys:
            if layer_key not in available:
                results.append({
                    "layer": layer_key,
                    "status": "skipped — unknown layer",
                })
                continue

            for zoom in zooms:
                try:
                    geojson, source = await query_with_fallback(
                        layer_key=layer_key,
                        bbox=CAPE_TOWN_BBOX,
                        zoom=zoom,
                    )
                    results.append({
                        "layer": layer_key,
                        "zoom": zoom,
                        "source": source.value,
                        "features": len(geojson.get("features", [])),
                        "status": "ok",
                    })
                except Exception as exc:
                    results.append({
                        "layer": layer_key,
                        "zoom": zoom,
                        "status": f"error: {exc}",
                    })

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "results": results,
        }

    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(_warm())
    finally:
        loop.close()
