"""
ArcGIS REST proxy client with three-tier fallback (LIVE → CACHED → MOCK).

Resolves OQ-001: City of Cape Town ArcGIS service directory at
citymaps.capetown.gov.za/agsext1 returns HTTP 404 (tested 2026-03-21).
Primary fallback: Western Cape GIS (gis.westerncape.gov.za/server2).

GOTCHA-DATA-002: esriJSON rings ≠ GeoJSON coordinates.
Always convert via arcgis2geojson before storing.

References:
  [C19] https://citymaps.capetown.gov.za/agsext1/rest/services?f=json
  [C20] https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer/
  [C21] https://github.com/chris48s/arcgis2geojson
  [C22] https://gis.westerncape.gov.za/server2/rest/services
"""

import enum
import json
import logging
import time
from typing import Any, Optional

import httpx

logger = logging.getLogger(__name__)

# --- Cape Town bounding box (locked decision) ---
CAPE_TOWN_BBOX = {
    "xmin": 18.28,
    "ymin": -34.36,
    "xmax": 19.02,
    "ymax": -33.48,
}

# --- Known ArcGIS REST service directories ---
COCT_SERVICE_URL = "https://citymaps.capetown.gov.za/agsext1/rest/services"
WC_SERVICE_URL = "https://gis.westerncape.gov.za/server2/rest/services"

# --- Cache key format (locked decision) ---
# {source}_{minLng:.4f}_{minLat:.4f}_{maxLng:.4f}_{maxLat:.4f}_{zoom}_{layer}
CACHE_KEY_FORMAT = (
    "{source}_{min_lng:.4f}_{min_lat:.4f}_{max_lng:.4f}_{max_lat:.4f}_{zoom}_{layer}"
)

# --- In-memory cache for service directory enumeration ---
_service_cache: dict[str, Any] = {}
_service_cache_expiry: float = 0
SERVICE_CACHE_TTL = 3600  # 1 hour

# --- In-memory API result cache (simple TTL cache for demo) ---
_api_cache: dict[str, dict] = {}
API_CACHE_TTL = 86400  # 24 hours


class DataSource(str, enum.Enum):
    """Three-tier data source indicator."""

    LIVE = "LIVE"
    CACHED = "CACHED"
    MOCK = "MOCK"


def _build_cache_key(
    source: str,
    bbox: dict,
    zoom: int,
    layer: str,
) -> str:
    """Build a deterministic cache key per locked decision format."""
    return CACHE_KEY_FORMAT.format(
        source=source,
        min_lng=bbox.get("xmin", 0),
        min_lat=bbox.get("ymin", 0),
        max_lng=bbox.get("xmax", 0),
        max_lat=bbox.get("ymax", 0),
        zoom=zoom,
        layer=layer,
    )


def _clip_bbox(bbox: Optional[dict]) -> dict:
    """Clip a requested bbox to the Cape Town metro bbox (locked decision)."""
    if bbox is None:
        return CAPE_TOWN_BBOX.copy()
    return {
        "xmin": max(bbox.get("xmin", CAPE_TOWN_BBOX["xmin"]), CAPE_TOWN_BBOX["xmin"]),
        "ymin": max(bbox.get("ymin", CAPE_TOWN_BBOX["ymin"]), CAPE_TOWN_BBOX["ymin"]),
        "xmax": min(bbox.get("xmax", CAPE_TOWN_BBOX["xmax"]), CAPE_TOWN_BBOX["xmax"]),
        "ymax": min(bbox.get("ymax", CAPE_TOWN_BBOX["ymax"]), CAPE_TOWN_BBOX["ymax"]),
    }


def _validate_bbox(bbox: dict) -> bool:
    """Check that bbox is within Cape Town metro bounds."""
    return (
        CAPE_TOWN_BBOX["xmin"] <= bbox.get("xmin", 0) <= CAPE_TOWN_BBOX["xmax"]
        and CAPE_TOWN_BBOX["ymin"] <= bbox.get("ymin", 0) <= CAPE_TOWN_BBOX["ymax"]
        and CAPE_TOWN_BBOX["xmin"] <= bbox.get("xmax", 0) <= CAPE_TOWN_BBOX["xmax"]
        and CAPE_TOWN_BBOX["ymin"] <= bbox.get("ymax", 0) <= CAPE_TOWN_BBOX["ymax"]
        and bbox.get("xmin", 0) < bbox.get("xmax", 0)
        and bbox.get("ymin", 0) < bbox.get("ymax", 0)
    )


def _esrijson_to_geojson(esri_features: list[dict]) -> dict:
    """
    Convert esriJSON features to a GeoJSON FeatureCollection.

    GOTCHA-DATA-002: esriJSON rings ≠ GeoJSON coordinates.
    Uses arcgis2geojson library for correct conversion.
    Falls back to manual conversion if library unavailable.
    """
    try:
        from arcgis2geojson import arcgis2geojson

        features = []
        for esri_feature in esri_features:
            geojson_feature = arcgis2geojson(esri_feature)
            features.append(geojson_feature)
        return {
            "type": "FeatureCollection",
            "features": features,
        }
    except ImportError:
        logger.warning(
            "arcgis2geojson not installed — using manual esriJSON conversion. "
            "Install arcgis2geojson for production use."
        )
        return _manual_esri_to_geojson(esri_features)


def _manual_esri_to_geojson(esri_features: list[dict]) -> dict:
    """
    Manual fallback esriJSON → GeoJSON conversion.
    Handles basic point, polyline, polygon geometries.
    For production, use arcgis2geojson library instead.
    """
    features = []
    for esri_feat in esri_features:
        geometry = esri_feat.get("geometry", {})
        attributes = esri_feat.get("attributes", {})
        geojson_geom = None

        if "x" in geometry and "y" in geometry:
            geojson_geom = {
                "type": "Point",
                "coordinates": [geometry["x"], geometry["y"]],
            }
        elif "rings" in geometry:
            rings = geometry["rings"]
            if len(rings) == 1:
                geojson_geom = {
                    "type": "Polygon",
                    "coordinates": rings,
                }
            else:
                geojson_geom = {
                    "type": "Polygon",
                    "coordinates": rings,
                }
        elif "paths" in geometry:
            paths = geometry["paths"]
            if len(paths) == 1:
                geojson_geom = {
                    "type": "LineString",
                    "coordinates": paths[0],
                }
            else:
                geojson_geom = {
                    "type": "MultiLineString",
                    "coordinates": paths,
                }

        features.append(
            {
                "type": "Feature",
                "geometry": geojson_geom,
                "properties": attributes,
            }
        )

    return {
        "type": "FeatureCollection",
        "features": features,
    }


# --- Mock GeoJSON data for Cape Town layers ---
# Three-tier fallback: LIVE → CACHED → MOCK (Rule 2)
MOCK_LAYERS: dict[str, dict] = {
    "zoning": {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [18.42, -33.92],
                            [18.43, -33.92],
                            [18.43, -33.93],
                            [18.42, -33.93],
                            [18.42, -33.92],
                        ]
                    ],
                },
                "properties": {
                    "zone_code": "GR3",
                    "zone_desc": "General Residential 3",
                    "suburb": "Sea Point",
                    "source": "MOCK",
                    "vintage": "2024",
                },
            }
        ],
    },
    "suburbs": {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [18.38, -33.90],
                            [18.40, -33.90],
                            [18.40, -33.92],
                            [18.38, -33.92],
                            [18.38, -33.90],
                        ]
                    ],
                },
                "properties": {
                    "name": "Sea Point",
                    "official_name": "SEA POINT",
                    "source": "MOCK",
                    "vintage": "2024",
                },
            }
        ],
    },
    "parcels": {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [18.42, -33.92],
                            [18.421, -33.92],
                            [18.421, -33.921],
                            [18.42, -33.921],
                            [18.42, -33.92],
                        ]
                    ],
                },
                "properties": {
                    "erf_number": "12345",
                    "suburb": "Sea Point",
                    "area_sqm": 450.0,
                    "source": "MOCK",
                    "vintage": "2024",
                },
            }
        ],
    },
    "watercourses": {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[18.47, -33.95], [18.48, -33.96], [18.49, -33.97]],
                },
                "properties": {
                    "name": "Liesbeek River",
                    "class": "perennial",
                    "source": "MOCK",
                    "vintage": "2024",
                },
            }
        ],
    },
}

# Known layer registry for service enumeration
KNOWN_LAYERS: dict[str, dict] = {
    "zoning": {
        "name": "Zoning",
        "description": "City of Cape Town Integrated Zoning Scheme",
        "source": "CoCT",
        "status": "MOCK",
    },
    "suburbs": {
        "name": "Suburbs",
        "description": "Official suburb boundaries",
        "source": "CoCT",
        "status": "MOCK",
    },
    "parcels": {
        "name": "Parcels",
        "description": "Land parcels / erven",
        "source": "CoCT",
        "status": "MOCK",
    },
    "watercourses": {
        "name": "Watercourses",
        "description": "Rivers and streams",
        "source": "CoCT",
        "status": "MOCK",
    },
}


async def enumerate_services(base_url: str) -> dict:
    """
    Enumerate ArcGIS REST service directory at runtime.
    Never hardcode layer indices (locked decision).

    Returns:
        dict with "folders", "services", "status" keys.
    """
    global _service_cache, _service_cache_expiry

    now = time.time()
    if _service_cache.get(base_url) and now < _service_cache_expiry:
        return _service_cache[base_url]

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(f"{base_url}?f=json")

            if response.status_code == 200:
                data = response.json()
                result = {
                    "status": "available",
                    "http_code": 200,
                    "folders": data.get("folders", []),
                    "services": data.get("services", []),
                    "current_version": data.get("currentVersion"),
                    "url": base_url,
                }
                _service_cache[base_url] = result
                _service_cache_expiry = now + SERVICE_CACHE_TTL
                return result

            return {
                "status": "error",
                "http_code": response.status_code,
                "folders": [],
                "services": [],
                "url": base_url,
                "error": f"HTTP {response.status_code}",
            }

    except (httpx.HTTPError, httpx.TimeoutException) as exc:
        logger.warning("Failed to enumerate services at %s: %s", base_url, exc)
        return {
            "status": "unreachable",
            "http_code": None,
            "folders": [],
            "services": [],
            "url": base_url,
            "error": str(exc),
        }


async def query_layer(
    layer_url: str,
    bbox: Optional[dict] = None,
    where_clause: str = "1=1",
    out_fields: str = "*",
    result_record_count: int = 1000,
) -> dict:
    """
    Query features from an ArcGIS REST feature layer.
    Converts esriJSON → GeoJSON via arcgis2geojson [C21].
    All bbox queries clipped to Cape Town bbox [C20].

    Args:
        layer_url: Full URL to the ArcGIS feature layer (e.g. .../MapServer/0)
        bbox: Bounding box dict with xmin, ymin, xmax, ymax
        where_clause: SQL WHERE clause for filtering
        out_fields: Comma-separated field names or "*"
        result_record_count: Max features to return

    Returns:
        GeoJSON FeatureCollection dict.
    """
    clipped_bbox = _clip_bbox(bbox)

    geometry_param = json.dumps(
        {
            "xmin": clipped_bbox["xmin"],
            "ymin": clipped_bbox["ymin"],
            "xmax": clipped_bbox["xmax"],
            "ymax": clipped_bbox["ymax"],
            "spatialReference": {"wkid": 4326},
        }
    )

    params = {
        "where": where_clause,
        "geometry": geometry_param,
        "geometryType": "esriGeometryEnvelope",
        "inSR": "4326",
        "outSR": "4326",
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": out_fields,
        "returnGeometry": "true",
        "resultRecordCount": str(result_record_count),
        "f": "json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{layer_url}/query", params=params)
            response.raise_for_status()
            data = response.json()

            if "error" in data:
                raise ValueError(
                    f"ArcGIS query error: {data['error'].get('message', 'Unknown error')}"
                )

            esri_features = data.get("features", [])
            return _esrijson_to_geojson(esri_features)

    except (httpx.HTTPError, httpx.TimeoutException, ValueError) as exc:
        logger.error("ArcGIS layer query failed for %s: %s", layer_url, exc)
        raise


async def query_with_fallback(
    layer_key: str,
    bbox: Optional[dict] = None,
    zoom: int = 12,
    layer_url: Optional[str] = None,
) -> tuple[dict, DataSource]:
    """
    Three-tier fallback query: LIVE → CACHED → MOCK.

    Locked decision: every layer must return data even when external
    services are unavailable. Never show a blank map.

    Args:
        layer_key: Identifier for the layer (e.g., "zoning", "suburbs")
        bbox: Bounding box for spatial query
        zoom: Zoom level for cache key
        layer_url: Optional ArcGIS REST layer URL for LIVE query

    Returns:
        Tuple of (GeoJSON FeatureCollection, DataSource enum)
    """
    clipped_bbox = _clip_bbox(bbox)
    cache_key = _build_cache_key("coct", clipped_bbox, zoom, layer_key)

    # --- Tier 1: LIVE (ArcGIS REST) ---
    if layer_url:
        try:
            geojson = await query_layer(layer_url, bbox=clipped_bbox)
            if geojson.get("features"):
                # Update cache on successful live query
                _api_cache[cache_key] = {
                    "data": geojson,
                    "timestamp": time.time(),
                }
                logger.info(
                    "LIVE query successful for layer=%s, features=%d",
                    layer_key,
                    len(geojson["features"]),
                )
                return geojson, DataSource.LIVE
        except Exception as exc:
            logger.warning(
                "LIVE query failed for %s: %s — falling back", layer_key, exc
            )

    # --- Tier 2: CACHED ---
    cached = _api_cache.get(cache_key)
    if cached and (time.time() - cached["timestamp"]) < API_CACHE_TTL:
        logger.info("Serving CACHED data for layer=%s", layer_key)
        return cached["data"], DataSource.CACHED

    # --- Tier 3: MOCK ---
    mock_data = MOCK_LAYERS.get(layer_key)
    if mock_data:
        logger.info("Serving MOCK data for layer=%s", layer_key)
        return mock_data, DataSource.MOCK

    # Fallback: empty FeatureCollection (should never happen if MOCK_LAYERS is complete)
    logger.error("No data available for layer=%s (not even MOCK)", layer_key)
    return {"type": "FeatureCollection", "features": []}, DataSource.MOCK


def get_available_layers() -> dict[str, dict]:
    """Return the known layer registry with current status."""
    return KNOWN_LAYERS.copy()


def store_in_cache(
    layer_key: str,
    bbox: dict,
    zoom: int,
    geojson: dict,
) -> str:
    """Store a query result in the API cache. Returns the cache key."""
    cache_key = _build_cache_key("coct", bbox, zoom, layer_key)
    _api_cache[cache_key] = {
        "data": geojson,
        "timestamp": time.time(),
    }
    return cache_key


def clear_cache() -> int:
    """Clear all cached entries. Returns number of entries cleared."""
    count = len(_api_cache)
    _api_cache.clear()
    return count
