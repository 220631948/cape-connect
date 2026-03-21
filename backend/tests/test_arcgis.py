"""
Tests for MP3 — ArcGIS REST Proxy and Cache Warmer.

Covers:
  - ArcGIS client: bbox validation, clipping, cache key format, esriJSON conversion
  - Three-tier fallback: LIVE → CACHED → MOCK
  - Routes: auth enforcement (401), layer listing, feature query, cache warming
  - Cache warmer task: warm_all_layers, warm_specific_layers
  - GOTCHA-DATA-002: esriJSON ≠ GeoJSON conversion
"""

import time
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def _clear_caches():
    """Clear all in-memory caches before each test."""
    from app.services.arcgis_client import _api_cache, _service_cache
    _api_cache.clear()
    _service_cache.clear()
    yield
    _api_cache.clear()
    _service_cache.clear()


@pytest.fixture
def client():
    """FastAPI test client with auth mocked."""
    from main import app
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Mock auth headers — the dependency is patched in auth tests."""
    return {"Authorization": "Bearer test-jwt-token"}


@pytest.fixture
def mock_user():
    """Standard mock user claims."""
    return {
        "sub": "user-uuid-123",
        "tenant_id": "tenant-uuid-456",
        "app_role": "analyst",
    }


# ---------------------------------------------------------------------------
# 1. ArcGIS Client Unit Tests — bbox
# ---------------------------------------------------------------------------

class TestBboxValidation:
    """Test Cape Town bounding box validation and clipping."""

    def test_valid_bbox_within_cape_town(self):
        from app.services.arcgis_client import _validate_bbox
        bbox = {"xmin": 18.4, "ymin": -33.95, "xmax": 18.5, "ymax": -33.85}
        assert _validate_bbox(bbox) is True

    def test_bbox_outside_cape_town_rejected(self):
        from app.services.arcgis_client import _validate_bbox
        bbox = {"xmin": 25.0, "ymin": -26.0, "xmax": 26.0, "ymax": -25.0}  # Johannesburg
        assert _validate_bbox(bbox) is False

    def test_bbox_inverted_rejected(self):
        from app.services.arcgis_client import _validate_bbox
        bbox = {"xmin": 18.5, "ymin": -33.85, "xmax": 18.4, "ymax": -33.95}
        assert _validate_bbox(bbox) is False

    def test_clip_bbox_to_cape_town(self):
        from app.services.arcgis_client import CAPE_TOWN_BBOX, _clip_bbox
        bbox = {"xmin": 17.0, "ymin": -35.0, "xmax": 20.0, "ymax": -32.0}
        clipped = _clip_bbox(bbox)
        assert clipped["xmin"] == CAPE_TOWN_BBOX["xmin"]
        assert clipped["ymin"] == CAPE_TOWN_BBOX["ymin"]
        assert clipped["xmax"] == CAPE_TOWN_BBOX["xmax"]
        assert clipped["ymax"] == CAPE_TOWN_BBOX["ymax"]

    def test_clip_none_returns_full_cape_town(self):
        from app.services.arcgis_client import CAPE_TOWN_BBOX, _clip_bbox
        clipped = _clip_bbox(None)
        assert clipped == CAPE_TOWN_BBOX


# ---------------------------------------------------------------------------
# 2. Cache Key Format
# ---------------------------------------------------------------------------

class TestCacheKey:
    """Test deterministic cache key generation per locked decision."""

    def test_cache_key_format(self):
        from app.services.arcgis_client import _build_cache_key
        bbox = {"xmin": 18.28, "ymin": -34.36, "xmax": 19.02, "ymax": -33.48}
        key = _build_cache_key("coct", bbox, 12, "zoning")
        assert key == "coct_18.2800_-34.3600_19.0200_-33.4800_12_zoning"

    def test_cache_key_different_zoom(self):
        from app.services.arcgis_client import _build_cache_key
        bbox = {"xmin": 18.28, "ymin": -34.36, "xmax": 19.02, "ymax": -33.48}
        k1 = _build_cache_key("coct", bbox, 10, "zoning")
        k2 = _build_cache_key("coct", bbox, 14, "zoning")
        assert k1 != k2

    def test_cache_key_different_layer(self):
        from app.services.arcgis_client import _build_cache_key
        bbox = {"xmin": 18.28, "ymin": -34.36, "xmax": 19.02, "ymax": -33.48}
        k1 = _build_cache_key("coct", bbox, 12, "zoning")
        k2 = _build_cache_key("coct", bbox, 12, "suburbs")
        assert k1 != k2


# ---------------------------------------------------------------------------
# 3. esriJSON → GeoJSON Conversion (GOTCHA-DATA-002)
# ---------------------------------------------------------------------------

class TestEsriJsonConversion:
    """GOTCHA-DATA-002: esriJSON rings ≠ GeoJSON coordinates."""

    def test_point_conversion(self):
        from app.services.arcgis_client import _manual_esri_to_geojson
        esri = [{"geometry": {"x": 18.42, "y": -33.92}, "attributes": {"name": "Test"}}]
        result = _manual_esri_to_geojson(esri)
        assert result["type"] == "FeatureCollection"
        assert len(result["features"]) == 1
        feat = result["features"][0]
        assert feat["geometry"]["type"] == "Point"
        assert feat["geometry"]["coordinates"] == [18.42, -33.92]
        assert feat["properties"]["name"] == "Test"

    def test_polygon_conversion(self):
        from app.services.arcgis_client import _manual_esri_to_geojson
        ring = [[18.42, -33.92], [18.43, -33.92], [18.43, -33.93], [18.42, -33.93], [18.42, -33.92]]
        esri = [{"geometry": {"rings": [ring]}, "attributes": {"zone": "GR3"}}]
        result = _manual_esri_to_geojson(esri)
        feat = result["features"][0]
        assert feat["geometry"]["type"] == "Polygon"
        assert feat["geometry"]["coordinates"] == [ring]

    def test_polyline_conversion(self):
        from app.services.arcgis_client import _manual_esri_to_geojson
        path = [[18.42, -33.92], [18.43, -33.93], [18.44, -33.94]]
        esri = [{"geometry": {"paths": [path]}, "attributes": {"river": "Liesbeek"}}]
        result = _manual_esri_to_geojson(esri)
        feat = result["features"][0]
        assert feat["geometry"]["type"] == "LineString"
        assert feat["geometry"]["coordinates"] == path

    def test_multiline_conversion(self):
        from app.services.arcgis_client import _manual_esri_to_geojson
        paths = [
            [[18.42, -33.92], [18.43, -33.93]],
            [[18.44, -33.94], [18.45, -33.95]],
        ]
        esri = [{"geometry": {"paths": paths}, "attributes": {}}]
        result = _manual_esri_to_geojson(esri)
        feat = result["features"][0]
        assert feat["geometry"]["type"] == "MultiLineString"

    def test_empty_features(self):
        from app.services.arcgis_client import _manual_esri_to_geojson
        result = _manual_esri_to_geojson([])
        assert result["type"] == "FeatureCollection"
        assert result["features"] == []

    def test_esrijson_to_geojson_uses_manual_fallback(self):
        """When arcgis2geojson is not installed, manual fallback is used."""
        from app.services.arcgis_client import _esrijson_to_geojson
        esri = [{"geometry": {"x": 18.42, "y": -33.92}, "attributes": {"id": 1}}]
        result = _esrijson_to_geojson(esri)
        assert result["type"] == "FeatureCollection"
        assert len(result["features"]) == 1


# ---------------------------------------------------------------------------
# 4. Three-Tier Fallback
# ---------------------------------------------------------------------------

class TestThreeTierFallback:
    """Test LIVE → CACHED → MOCK fallback chain."""

    @pytest.mark.asyncio
    async def test_mock_fallback_when_no_live_url(self):
        """Without a live URL, should fall back to MOCK."""
        from app.services.arcgis_client import DataSource, query_with_fallback
        geojson, source = await query_with_fallback("zoning")
        assert source == DataSource.MOCK
        assert geojson["type"] == "FeatureCollection"
        assert len(geojson["features"]) > 0

    @pytest.mark.asyncio
    async def test_cached_fallback(self):
        """After storing in cache, should return CACHED on next call."""
        from app.services.arcgis_client import (
            CAPE_TOWN_BBOX,
            DataSource,
            query_with_fallback,
            store_in_cache,
        )
        cached_geojson = {
            "type": "FeatureCollection",
            "features": [{"type": "Feature", "geometry": None, "properties": {"cached": True}}],
        }
        store_in_cache("zoning", CAPE_TOWN_BBOX, 12, cached_geojson)
        geojson, source = await query_with_fallback("zoning", bbox=CAPE_TOWN_BBOX, zoom=12)
        assert source == DataSource.CACHED
        assert geojson["features"][0]["properties"]["cached"] is True

    @pytest.mark.asyncio
    async def test_mock_data_for_all_known_layers(self):
        """Every known layer must have MOCK data (Rule 2: never blank)."""
        from app.services.arcgis_client import (
            DataSource,
            get_available_layers,
            query_with_fallback,
        )
        for layer_key in get_available_layers():
            geojson, source = await query_with_fallback(layer_key)
            assert source == DataSource.MOCK
            assert geojson["type"] == "FeatureCollection"
            assert len(geojson["features"]) > 0, f"MOCK data missing for {layer_key}"

    @pytest.mark.asyncio
    async def test_unknown_layer_returns_empty(self):
        from app.services.arcgis_client import DataSource, query_with_fallback
        geojson, source = await query_with_fallback("nonexistent_layer")
        assert source == DataSource.MOCK
        assert geojson["features"] == []

    @pytest.mark.asyncio
    async def test_all_mock_features_within_cape_town_bbox(self):
        """All MOCK features must be within Cape Town bbox."""
        from app.services.arcgis_client import (
            CAPE_TOWN_BBOX,
            get_available_layers,
            query_with_fallback,
        )
        for layer_key in get_available_layers():
            geojson, _ = await query_with_fallback(layer_key)
            for feat in geojson["features"]:
                geom = feat.get("geometry", {})
                coords = _extract_coords(geom)
                for lon, lat in coords:
                    assert CAPE_TOWN_BBOX["xmin"] <= lon <= CAPE_TOWN_BBOX["xmax"], \
                        f"Longitude {lon} outside bbox for {layer_key}"
                    assert CAPE_TOWN_BBOX["ymin"] <= lat <= CAPE_TOWN_BBOX["ymax"], \
                        f"Latitude {lat} outside bbox for {layer_key}"


def _extract_coords(geometry: dict) -> list[tuple]:
    """Helper: extract (lon, lat) pairs from any GeoJSON geometry."""
    if not geometry:
        return []
    gtype = geometry.get("type", "")
    coords = geometry.get("coordinates", [])
    if gtype == "Point":
        return [tuple(coords)]
    elif gtype in ("LineString", "MultiPoint"):
        return [tuple(c) for c in coords]
    elif gtype in ("Polygon", "MultiLineString"):
        return [tuple(c) for ring in coords for c in ring]
    elif gtype == "MultiPolygon":
        return [tuple(c) for poly in coords for ring in poly for c in ring]
    return []


# ---------------------------------------------------------------------------
# 5. Cache Store / Clear
# ---------------------------------------------------------------------------

class TestCacheOperations:
    def test_store_and_clear(self):
        from app.services.arcgis_client import (
            CAPE_TOWN_BBOX,
            _api_cache,
            clear_cache,
            store_in_cache,
        )
        store_in_cache("zoning", CAPE_TOWN_BBOX, 12, {"type": "FeatureCollection", "features": []})
        assert len(_api_cache) == 1
        count = clear_cache()
        assert count == 1
        assert len(_api_cache) == 0


# ---------------------------------------------------------------------------
# 6. Route Auth Enforcement (401)
# ---------------------------------------------------------------------------

class TestArcgisAuthEnforcement:
    """All ArcGIS endpoints must return 401 without a valid JWT."""

    def test_layers_requires_auth(self, client):
        resp = client.get("/arcgis/layers")
        assert resp.status_code == 403 or resp.status_code == 401

    def test_features_requires_auth(self, client):
        resp = client.get("/arcgis/layer/zoning/features")
        assert resp.status_code == 403 or resp.status_code == 401

    def test_cache_warm_requires_auth(self, client):
        resp = client.post("/arcgis/cache/warm", json={})
        assert resp.status_code == 403 or resp.status_code == 401

    def test_service_directory_requires_auth(self, client):
        resp = client.get("/arcgis/services/wc")
        assert resp.status_code == 403 or resp.status_code == 401

    def test_cache_clear_requires_auth(self, client):
        resp = client.delete("/arcgis/cache")
        assert resp.status_code == 403 or resp.status_code == 401


# ---------------------------------------------------------------------------
# 7. Route Feature Query with Mocked Auth
# ---------------------------------------------------------------------------

class TestArcgisRoutesWithAuth:
    """Test routes with auth dependency mocked."""

    def _get_client_with_auth(self, mock_user):
        from app.core.auth import get_current_user
        from main import app
        app.dependency_overrides[get_current_user] = lambda: mock_user
        client = TestClient(app)
        yield client
        app.dependency_overrides.clear()

    def test_list_layers(self, mock_user):
        from app.core.auth import get_current_user
        from main import app
        app.dependency_overrides[get_current_user] = lambda: mock_user
        client = TestClient(app)
        try:
            resp = client.get("/arcgis/layers")
            assert resp.status_code == 200
            data = resp.json()
            assert "layers" in data
            assert "zoning" in data["layers"]
            assert "suburbs" in data["layers"]
            assert "parcels" in data["layers"]
            assert "watercourses" in data["layers"]
            assert "coct_service_status" in data
        finally:
            app.dependency_overrides.clear()

    def test_get_features_zoning_mock(self, mock_user):
        from app.core.auth import get_current_user
        from main import app
        app.dependency_overrides[get_current_user] = lambda: mock_user
        client = TestClient(app)
        try:
            resp = client.get("/arcgis/layer/zoning/features")
            assert resp.status_code == 200
            data = resp.json()
            assert data["source"] == "MOCK"
            assert data["layer_key"] == "zoning"
            assert len(data["features"]) > 0
        finally:
            app.dependency_overrides.clear()

    def test_get_features_unknown_layer_404(self, mock_user):
        from app.core.auth import get_current_user
        from main import app
        app.dependency_overrides[get_current_user] = lambda: mock_user
        client = TestClient(app)
        try:
            resp = client.get("/arcgis/layer/nonexistent/features")
            assert resp.status_code == 404
        finally:
            app.dependency_overrides.clear()

    def test_get_features_outside_bbox_422(self, mock_user):
        from app.core.auth import get_current_user
        from main import app
        app.dependency_overrides[get_current_user] = lambda: mock_user
        client = TestClient(app)
        try:
            resp = client.get(
                "/arcgis/layer/zoning/features",
                params={"xmin": 18.0, "ymin": -35.0, "xmax": 18.1, "ymax": -34.9},
            )
            assert resp.status_code == 422
        finally:
            app.dependency_overrides.clear()

    def test_warm_cache(self, mock_user):
        from app.core.auth import get_current_user
        from main import app
        app.dependency_overrides[get_current_user] = lambda: mock_user
        client = TestClient(app)
        try:
            resp = client.post("/arcgis/cache/warm", json={"layers": ["zoning"], "zoom_levels": [12]})
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "completed"
        finally:
            app.dependency_overrides.clear()

    def test_warm_cache_invalid_layer_422(self, mock_user):
        from app.core.auth import get_current_user
        from main import app
        app.dependency_overrides[get_current_user] = lambda: mock_user
        client = TestClient(app)
        try:
            resp = client.post("/arcgis/cache/warm", json={"layers": ["fake_layer"]})
            assert resp.status_code == 422
        finally:
            app.dependency_overrides.clear()

    def test_clear_cache(self, mock_user):
        from app.core.auth import get_current_user
        from main import app
        app.dependency_overrides[get_current_user] = lambda: mock_user
        client = TestClient(app)
        try:
            resp = client.delete("/arcgis/cache")
            assert resp.status_code == 200
            assert "cleared" in resp.json()
        finally:
            app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# 8. Cache Warmer Task Tests
# ---------------------------------------------------------------------------

class TestCacheWarmerTask:
    """Test Celery cache warmer tasks (synchronous execution)."""

    def test_warm_all_layers(self):
        from app.tasks.cache_warmer import warm_all_layers
        result = warm_all_layers()
        assert "timestamp" in result
        assert "layers_warmed" in result
        assert result["layers_warmed"] > 0
        for entry in result["results"]:
            assert entry["status"] == "ok"
            assert entry["source"] == "MOCK"

    def test_warm_specific_layers(self):
        from app.tasks.cache_warmer import warm_specific_layers
        result = warm_specific_layers(["zoning"], zoom_levels=[12])
        assert "results" in result
        assert len(result["results"]) == 1
        assert result["results"][0]["layer"] == "zoning"
        assert result["results"][0]["source"] == "MOCK"

    def test_warm_unknown_layer_skipped(self):
        from app.tasks.cache_warmer import warm_specific_layers
        result = warm_specific_layers(["nonexistent"])
        assert len(result["results"]) == 1
        assert "skipped" in result["results"][0]["status"]


# ---------------------------------------------------------------------------
# 9. GeoJSON Validity
# ---------------------------------------------------------------------------

class TestGeoJsonValidity:
    """All returned GeoJSON must be valid FeatureCollections."""

    @pytest.mark.asyncio
    async def test_mock_geojson_structure(self):
        from app.services.arcgis_client import MOCK_LAYERS
        for layer_key, geojson in MOCK_LAYERS.items():
            assert geojson["type"] == "FeatureCollection", f"Invalid type for {layer_key}"
            for feat in geojson["features"]:
                assert feat["type"] == "Feature", f"Invalid feature type in {layer_key}"
                assert "geometry" in feat, f"Missing geometry in {layer_key}"
                assert "properties" in feat, f"Missing properties in {layer_key}"
                geom = feat["geometry"]
                assert geom["type"] in (
                    "Point", "MultiPoint", "LineString", "MultiLineString",
                    "Polygon", "MultiPolygon",
                ), f"Invalid geometry type {geom['type']} in {layer_key}"
                assert "coordinates" in geom, f"Missing coordinates in {layer_key}"


# ---------------------------------------------------------------------------
# 10. Data Source Enum
# ---------------------------------------------------------------------------

class TestDataSourceEnum:
    def test_data_source_values(self):
        from app.services.arcgis_client import DataSource
        assert DataSource.LIVE.value == "LIVE"
        assert DataSource.CACHED.value == "CACHED"
        assert DataSource.MOCK.value == "MOCK"

    def test_data_source_is_string(self):
        from app.services.arcgis_client import DataSource
        assert isinstance(DataSource.LIVE, str)
        assert DataSource.LIVE == "LIVE"
