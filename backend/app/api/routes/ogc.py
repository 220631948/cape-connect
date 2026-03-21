"""
OGC Services Route — pygeoapi mounted as FastAPI sub-application at /ogc.

Public collections: unauthenticated access (WFS/WMS clients cannot send headers).
Tenant collections: API key in query param ?api_key={key} for RLS enforcement.
Attribution: OSM ODbL + CARTO terms on every capabilities response.
"""

import os
import yaml
import structlog
from fastapi import APIRouter, Request, HTTPException

logger = structlog.get_logger()

router = APIRouter(prefix="/ogc", tags=["ogc"])

# --- Phase 1 public collections ---
PHASE1_COLLECTIONS = [
    "cape_town_zoning",
    "cape_town_parcels",
    "cape_town_suburbs",
    "cape_town_flood_risk",
]

# --- Attribution required on all capabilities ---
OGC_ATTRIBUTION = (
    "Base map data © OpenStreetMap contributors (ODbL). "
    "Map tiles by CARTO (CC BY 3.0). "
    "Spatial data from City of Cape Town Open Data Portal."
)

# Cape Town bounding box
CAPE_TOWN_BBOX = [18.28, -34.36, 19.02, -33.48]

# --- API key resolution (mock for scaffolding — real DB lookup in production) ---
_API_KEY_TENANT_MAP: dict[str, str] = {}


def _load_pygeoapi_config() -> dict:
    """Load pygeoapi.config.yml from backend root."""
    config_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
        "pygeoapi.config.yml",
    )
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            return yaml.safe_load(f)
    return {}


def resolve_api_key(api_key: str) -> str | None:
    """Resolve API key to tenant_id. Returns None if invalid."""
    return _API_KEY_TENANT_MAP.get(api_key)


def register_api_key(api_key: str, tenant_id: str) -> None:
    """Register an API key → tenant_id mapping (for testing)."""
    _API_KEY_TENANT_MAP[api_key] = tenant_id


def clear_api_keys() -> None:
    """Clear all registered API keys (for testing)."""
    _API_KEY_TENANT_MAP.clear()


# --- OGC Landing Page ---
@router.get("")
@router.get("/")
async def ogc_landing_page():
    """OGC API landing page with contact and attribution metadata."""
    return {
        "title": "CapeTown GIS Hub — OGC API",
        "description": (
            "OGC API Features / WFS / WMS services for the City of Cape Town "
            "and Western Cape Province geospatial data."
        ),
        "attribution": OGC_ATTRIBUTION,
        "links": [
            {
                "rel": "self",
                "type": "application/json",
                "title": "This document",
                "href": "/ogc",
            },
            {
                "rel": "service-desc",
                "type": "application/vnd.oai.openapi+json;version=3.0",
                "title": "OpenAPI definition",
                "href": "/ogc/openapi",
            },
            {
                "rel": "conformance",
                "type": "application/json",
                "title": "Conformance",
                "href": "/ogc/conformance",
            },
            {
                "rel": "data",
                "type": "application/json",
                "title": "Collections",
                "href": "/ogc/collections",
            },
        ],
        "contact": {
            "name": "CapeTown GIS Hub Support",
            "email": "support@capegis.app",
            "url": "https://capegis.vercel.app",
        },
    }


# --- Conformance ---
@router.get("/conformance")
async def ogc_conformance():
    """OGC API conformance classes."""
    return {
        "conformsTo": [
            "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core",
            "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30",
            "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson",
        ]
    }


# --- Collections ---
@router.get("/collections")
async def ogc_collections():
    """List all Phase 1 published collections."""
    config = _load_pygeoapi_config()
    resources = config.get("resources", {})

    collections = []
    for coll_id in PHASE1_COLLECTIONS:
        resource = resources.get(coll_id, {})
        collections.append(
            {
                "id": coll_id,
                "title": resource.get("title", coll_id),
                "description": resource.get("description", ""),
                "extent": {
                    "spatial": {
                        "bbox": [CAPE_TOWN_BBOX],
                        "crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
                    }
                },
                "links": [
                    {
                        "rel": "items",
                        "type": "application/geo+json",
                        "title": f"Items in {coll_id}",
                        "href": f"/ogc/collections/{coll_id}/items",
                    },
                ],
                "attribution": OGC_ATTRIBUTION,
            }
        )

    return {
        "collections": collections,
        "links": [
            {
                "rel": "self",
                "type": "application/json",
                "title": "Collections",
                "href": "/ogc/collections",
            }
        ],
    }


# --- Collection Detail ---
@router.get("/collections/{collection_id}")
async def ogc_collection_detail(collection_id: str):
    """Get details for a single collection."""
    if collection_id not in PHASE1_COLLECTIONS and not collection_id.startswith(
        "tenant_"
    ):
        raise HTTPException(
            status_code=404, detail=f"Collection '{collection_id}' not found"
        )

    # Tenant collections require API key
    if collection_id.startswith("tenant_"):
        raise HTTPException(
            status_code=401,
            detail="Tenant collections require api_key query parameter",
        )

    config = _load_pygeoapi_config()
    resource = config.get("resources", {}).get(collection_id, {})

    return {
        "id": collection_id,
        "title": resource.get("title", collection_id),
        "description": resource.get("description", ""),
        "extent": {
            "spatial": {
                "bbox": [CAPE_TOWN_BBOX],
                "crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
            }
        },
        "links": [
            {
                "rel": "items",
                "type": "application/geo+json",
                "title": f"Items in {collection_id}",
                "href": f"/ogc/collections/{collection_id}/items",
            },
        ],
        "attribution": OGC_ATTRIBUTION,
    }


# --- Collection Items (WFS-style feature access) ---
@router.get("/collections/{collection_id}/items")
async def ogc_collection_items(
    collection_id: str,
    request: Request,
    limit: int = 10,
    offset: int = 0,
    bbox: str | None = None,
    api_key: str | None = None,
):
    """
    Get features from a collection (OGC API Features / WFS style).

    Public collections: no auth required.
    Tenant collections: api_key query param required.
    """
    # Validate collection exists
    is_tenant = collection_id.startswith("tenant_")
    if collection_id not in PHASE1_COLLECTIONS and not is_tenant:
        raise HTTPException(
            status_code=404, detail=f"Collection '{collection_id}' not found"
        )

    # Tenant auth check
    tenant_id = None
    if is_tenant:
        if not api_key:
            raise HTTPException(
                status_code=401,
                detail="Tenant collections require api_key query parameter",
            )
        tenant_id = resolve_api_key(api_key)
        if not tenant_id:
            raise HTTPException(status_code=401, detail="Invalid API key")

    # Parse and validate bbox
    parsed_bbox = None
    if bbox:
        try:
            parts = [float(x.strip()) for x in bbox.split(",")]
            if len(parts) != 4:
                raise ValueError("bbox must have 4 values")
            parsed_bbox = parts
        except (ValueError, TypeError) as e:
            raise HTTPException(status_code=400, detail=f"Invalid bbox: {e}")

    # Validate limit
    if limit < 1 or limit > 10000:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 10000")

    # Stub response — real implementation queries PostGIS via pygeoapi provider
    logger.info(
        "OGC items query",
        collection=collection_id,
        limit=limit,
        offset=offset,
        bbox=parsed_bbox,
        tenant_id=tenant_id,
    )

    return {
        "type": "FeatureCollection",
        "features": [],
        "numberMatched": 0,
        "numberReturned": 0,
        "links": [
            {
                "rel": "self",
                "type": "application/geo+json",
                "href": f"/ogc/collections/{collection_id}/items",
            },
        ],
        "attribution": OGC_ATTRIBUTION,
    }


# --- Single Feature ---
@router.get("/collections/{collection_id}/items/{feature_id}")
async def ogc_collection_item(
    collection_id: str,
    feature_id: str,
    api_key: str | None = None,
):
    """Get a single feature by ID from a collection."""
    is_tenant = collection_id.startswith("tenant_")
    if collection_id not in PHASE1_COLLECTIONS and not is_tenant:
        raise HTTPException(
            status_code=404, detail=f"Collection '{collection_id}' not found"
        )

    if is_tenant:
        if not api_key:
            raise HTTPException(
                status_code=401,
                detail="Tenant collections require api_key query parameter",
            )
        tenant_id = resolve_api_key(api_key)
        if not tenant_id:
            raise HTTPException(status_code=401, detail="Invalid API key")

    # Stub — real implementation fetches from PostGIS
    raise HTTPException(
        status_code=404,
        detail=f"Feature '{feature_id}' not found in collection '{collection_id}'",
    )


# --- WFS GetCapabilities ---
@router.get("/wfs")
async def ogc_wfs(
    SERVICE: str = "WFS",
    VERSION: str = "2.0.0",
    REQUEST: str = "GetCapabilities",
):
    """WFS endpoint — GetCapabilities / GetFeature."""
    config = _load_pygeoapi_config()
    metadata = config.get("metadata", {})
    identification = metadata.get("identification", {})
    attribution_meta = metadata.get("attribution", {})

    if REQUEST.upper() == "GETCAPABILITIES":
        capabilities = {
            "service": "WFS",
            "version": VERSION,
            "title": identification.get("title", "CapeTown GIS Hub WFS"),
            "abstract": identification.get("description", ""),
            "attribution": attribution_meta.get("text", OGC_ATTRIBUTION),
            "featureTypes": [],
        }
        for coll_id in PHASE1_COLLECTIONS:
            resource = config.get("resources", {}).get(coll_id, {})
            capabilities["featureTypes"].append(
                {
                    "name": coll_id,
                    "title": resource.get("title", coll_id),
                    "srs": "EPSG:4326",
                    "bbox": CAPE_TOWN_BBOX,
                }
            )
        return capabilities

    return {
        "service": "WFS",
        "version": VERSION,
        "request": REQUEST,
        "features": [],
        "attribution": OGC_ATTRIBUTION,
    }


# --- WMS GetCapabilities ---
@router.get("/wms")
async def ogc_wms(
    SERVICE: str = "WMS",
    VERSION: str = "1.3.0",
    REQUEST: str = "GetCapabilities",
):
    """WMS endpoint — GetCapabilities / GetMap."""
    config = _load_pygeoapi_config()
    metadata = config.get("metadata", {})
    identification = metadata.get("identification", {})
    attribution_meta = metadata.get("attribution", {})

    if REQUEST.upper() == "GETCAPABILITIES":
        capabilities = {
            "service": "WMS",
            "version": VERSION,
            "title": identification.get("title", "CapeTown GIS Hub WMS"),
            "abstract": identification.get("description", ""),
            "attribution": attribution_meta.get("text", OGC_ATTRIBUTION),
            "layers": [],
        }
        for coll_id in PHASE1_COLLECTIONS:
            resource = config.get("resources", {}).get(coll_id, {})
            capabilities["layers"].append(
                {
                    "name": coll_id,
                    "title": resource.get("title", coll_id),
                    "srs": "EPSG:4326",
                    "bbox": CAPE_TOWN_BBOX,
                }
            )
        return capabilities

    return {
        "service": "WMS",
        "version": VERSION,
        "request": REQUEST,
        "layers": [],
        "attribution": OGC_ATTRIBUTION,
    }
