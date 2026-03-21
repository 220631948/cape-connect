"""
Tests for spatial analysis service and API endpoints.

Test categories:
  1. Bbox validation (pure unit tests — no DB)
  2. API endpoint auth (401/403 — mocked DB)
  3. Trading bay suitability scoring logic (mocked DB queries)
  4. Cross-tenant isolation (mocked DB queries)
"""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.services.spatial_analysis import (
    CT_BBOX,
    WATERCOURSE_BUFFER_M,
    _extract_all_coords,
    _validate_bbox,
)

# ---------------------------------------------------------------------------
# Test fixtures — geometries
# ---------------------------------------------------------------------------

# Sea Point — valid polygon inside Cape Town bbox
SEA_POINT_POLYGON = {
    "type": "Polygon",
    "coordinates": [[
        [18.3810, -33.9180],
        [18.3830, -33.9180],
        [18.3830, -33.9200],
        [18.3810, -33.9200],
        [18.3810, -33.9180],
    ]],
}

# Atlantic Ocean — outside Cape Town bbox (too far west)
OCEAN_POLYGON = {
    "type": "Polygon",
    "coordinates": [[
        [17.50, -34.00],
        [17.52, -34.00],
        [17.52, -34.02],
        [17.50, -34.02],
        [17.50, -34.00],
    ]],
}

# Point inside Cape Town (for buffer queries)
SEA_POINT_CENTRE = {
    "type": "Point",
    "coordinates": [18.3820, -33.9190],
}

TENANT_A = "tenant-a-uuid-1111"
TENANT_B = "tenant-b-uuid-2222"


# ---------------------------------------------------------------------------
# 1. Bbox validation — pure unit tests
# ---------------------------------------------------------------------------

class TestBboxValidation:
    """Tests for Cape Town bounding box enforcement."""

    def test_valid_polygon_inside_bbox(self):
        """Sea Point polygon should pass bbox validation."""
        _validate_bbox(SEA_POINT_POLYGON)  # Should not raise

    def test_polygon_outside_bbox_raises(self):
        """Atlantic Ocean polygon should fail bbox validation."""
        with pytest.raises(ValueError, match="outside the Cape Town"):
            _validate_bbox(OCEAN_POLYGON)

    def test_point_inside_bbox(self):
        """Point in Sea Point should pass."""
        _validate_bbox(SEA_POINT_CENTRE)

    def test_point_outside_bbox_raises(self):
        """Point in the ocean should fail."""
        ocean_point = {"type": "Point", "coordinates": [17.0, -34.0]}
        with pytest.raises(ValueError, match="outside the Cape Town"):
            _validate_bbox(ocean_point)

    def test_bbox_boundary_values(self):
        """Points exactly on bbox edges should pass."""
        min_lon, min_lat, max_lon, max_lat = CT_BBOX
        edge_point = {"type": "Point", "coordinates": [min_lon, min_lat]}
        _validate_bbox(edge_point)

    def test_empty_geometry_passes(self):
        """Unknown geometry type with no coords doesn't raise."""
        _validate_bbox({"type": "Unknown", "coordinates": []})


# ---------------------------------------------------------------------------
# 2. Coordinate extraction
# ---------------------------------------------------------------------------

class TestCoordExtraction:
    """Tests for _extract_all_coords helper."""

    def test_point(self):
        coords = _extract_all_coords(SEA_POINT_CENTRE)
        assert len(coords) == 1
        assert coords[0] == (18.3820, -33.9190)

    def test_polygon(self):
        coords = _extract_all_coords(SEA_POINT_POLYGON)
        assert len(coords) == 5  # 4 corners + closing point

    def test_multipoint(self):
        geom = {
            "type": "MultiPoint",
            "coordinates": [[18.38, -33.92], [18.39, -33.93]],
        }
        coords = _extract_all_coords(geom)
        assert len(coords) == 2

    def test_geometry_collection(self):
        geom = {
            "type": "GeometryCollection",
            "geometries": [
                SEA_POINT_CENTRE,
                {"type": "Point", "coordinates": [18.40, -33.90]},
            ],
        }
        coords = _extract_all_coords(geom)
        assert len(coords) == 2


# ---------------------------------------------------------------------------
# 3. API endpoint tests — auth enforcement
# ---------------------------------------------------------------------------

@pytest.fixture
def app():
    """Create a test FastAPI application."""
    from main import app as fastapi_app
    return fastapi_app


@pytest.fixture
def client(app):
    """TestClient with no auth headers."""
    return TestClient(app)


class TestAuthEnforcement:
    """All spatial endpoints must return 401 without JWT."""

    def test_suitability_requires_auth(self, client):
        response = client.post(
            "/spatial/trading-bay-suitability",
            json={"polygon": SEA_POINT_POLYGON},
        )
        assert response.status_code in (401, 403)

    def test_intersection_requires_auth(self, client):
        response = client.post(
            "/spatial/intersection",
            json={"polygon": SEA_POINT_POLYGON, "layer": "parcels"},
        )
        assert response.status_code in (401, 403)

    def test_buffer_requires_auth(self, client):
        response = client.post(
            "/spatial/buffer",
            json={"geometry": SEA_POINT_CENTRE, "radius_m": 500, "layer": "parcels"},
        )
        assert response.status_code in (401, 403)

    def test_proximity_requires_auth(self, client):
        response = client.post(
            "/spatial/proximity-score",
            json={
                "polygon": SEA_POINT_POLYGON,
                "criteria": [{"layer": "parcels", "weight": 1.0}],
            },
        )
        assert response.status_code in (401, 403)

    def test_suburb_stats_requires_auth(self, client):
        response = client.get("/spatial/suburb/Sea Point/stats")
        assert response.status_code in (401, 403)


# ---------------------------------------------------------------------------
# 4. Trading bay suitability — scoring logic (mocked DB)
# ---------------------------------------------------------------------------

class TestTradingBaySuitabilityScoring:
    """Test scoring logic by mocking database query results."""

    @pytest.mark.asyncio
    async def test_watercourse_too_close_returns_unsuitable(self):
        """Polygon within watercourse buffer → UNSUITABLE verdict."""
        from app.services.spatial_analysis import trading_bay_suitability

        mock_session = AsyncMock()

        # Mock query results in order: watercourse, flood, slope, heritage, bay
        wc_result = MagicMock()
        wc_result.scalar_one.return_value = 5.0  # 5m < 10m buffer

        flood_result = MagicMock()
        flood_result.first.return_value = ("Low",)

        slope_result = MagicMock()
        slope_result.scalar_one.return_value = 1.0

        heritage_result = MagicMock()
        heritage_result.scalar_one.return_value = False

        bay_result = MagicMock()
        bay_result.scalar_one.return_value = 200.0

        mock_session.execute = AsyncMock(
            side_effect=[wc_result, flood_result, slope_result, heritage_result, bay_result]
        )

        result = await trading_bay_suitability(
            polygon_geojson=SEA_POINT_POLYGON,
            tenant_id=TENANT_A,
            session=mock_session,
        )

        assert result["verdict"] == "UNSUITABLE"
        assert result["criteria"]["watercourse_distance_m"] == 5.0
        assert any("watercourse" in c.lower() for c in result["blocking_constraints"])

    @pytest.mark.asyncio
    async def test_all_clear_returns_suitable(self):
        """Polygon with no constraints → SUITABLE verdict."""
        from app.services.spatial_analysis import trading_bay_suitability

        mock_session = AsyncMock()

        wc_result = MagicMock()
        wc_result.scalar_one.return_value = 150.0  # Far from watercourse

        flood_result = MagicMock()
        flood_result.first.return_value = ("Low",)

        slope_result = MagicMock()
        slope_result.scalar_one.return_value = 0.5  # Flat

        heritage_result = MagicMock()
        heritage_result.scalar_one.return_value = False

        bay_result = MagicMock()
        bay_result.scalar_one.return_value = 300.0  # Well-spaced

        mock_session.execute = AsyncMock(
            side_effect=[wc_result, flood_result, slope_result, heritage_result, bay_result]
        )

        result = await trading_bay_suitability(
            polygon_geojson=SEA_POINT_POLYGON,
            tenant_id=TENANT_A,
            session=mock_session,
        )

        assert result["verdict"] == "SUITABLE"
        assert result["score"] >= 70
        assert result["blocking_constraints"] == []

    @pytest.mark.asyncio
    async def test_heritage_overlap_returns_unsuitable(self):
        """Polygon overlapping heritage site → UNSUITABLE."""
        from app.services.spatial_analysis import trading_bay_suitability

        mock_session = AsyncMock()

        wc_result = MagicMock()
        wc_result.scalar_one.return_value = 100.0

        flood_result = MagicMock()
        flood_result.first.return_value = ("Low",)

        slope_result = MagicMock()
        slope_result.scalar_one.return_value = 0.5

        heritage_result = MagicMock()
        heritage_result.scalar_one.return_value = True  # Overlaps!

        bay_result = MagicMock()
        bay_result.scalar_one.return_value = 300.0

        mock_session.execute = AsyncMock(
            side_effect=[wc_result, flood_result, slope_result, heritage_result, bay_result]
        )

        result = await trading_bay_suitability(
            polygon_geojson=SEA_POINT_POLYGON,
            tenant_id=TENANT_A,
            session=mock_session,
        )

        assert result["verdict"] == "UNSUITABLE"
        assert any("heritage" in c.lower() for c in result["blocking_constraints"])

    @pytest.mark.asyncio
    async def test_ocean_polygon_rejected(self):
        """Polygon in the ocean → ValueError from bbox validation."""
        from app.services.spatial_analysis import trading_bay_suitability

        mock_session = AsyncMock()
        with pytest.raises(ValueError, match="outside the Cape Town"):
            await trading_bay_suitability(
                polygon_geojson=OCEAN_POLYGON,
                tenant_id=TENANT_A,
                session=mock_session,
            )
        # No DB calls should have been made
        mock_session.execute.assert_not_called()


# ---------------------------------------------------------------------------
# 5. Cross-tenant isolation
# ---------------------------------------------------------------------------

class TestTenantIsolation:
    """Verify that tenant_id is always passed to queries."""

    @pytest.mark.asyncio
    async def test_suitability_passes_tenant_id(self):
        """trading_bay_suitability passes tenant_id to every DB query."""
        from app.services.spatial_analysis import trading_bay_suitability

        mock_session = AsyncMock()

        for _ in range(5):
            result = MagicMock()
            result.scalar_one.return_value = 100.0
            result.first.return_value = ("Low",)
            mock_session.execute = AsyncMock(
                side_effect=[result, result, result, result, result]
            )

        await trading_bay_suitability(
            polygon_geojson=SEA_POINT_POLYGON,
            tenant_id=TENANT_A,
            session=mock_session,
        )

        # Every execute call should have received tenant_id=TENANT_A
        for call in mock_session.execute.call_args_list:
            params = call[0][1] if len(call[0]) > 1 else call[1].get("parameters", {})
            if isinstance(params, dict):
                assert params.get("tenant_id") == TENANT_A

    @pytest.mark.asyncio
    async def test_intersection_passes_tenant_id(self):
        """intersection_query forwards tenant_id to DB."""
        from app.services.spatial_analysis import intersection_query

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.fetchall.return_value = []
        mock_session.execute = AsyncMock(return_value=mock_result)

        await intersection_query(
            polygon_geojson=SEA_POINT_POLYGON,
            layer_name="parcels",
            tenant_id=TENANT_B,
            session=mock_session,
        )

        call_params = mock_session.execute.call_args[0][1]
        assert call_params["tenant_id"] == TENANT_B

    @pytest.mark.asyncio
    async def test_buffer_passes_tenant_id(self):
        """buffer_query forwards tenant_id to DB."""
        from app.services.spatial_analysis import buffer_query

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.fetchall.return_value = []
        mock_session.execute = AsyncMock(return_value=mock_result)

        await buffer_query(
            point_geojson=SEA_POINT_CENTRE,
            radius_m=500,
            layer_name="parcels",
            tenant_id=TENANT_A,
            session=mock_session,
        )

        call_params = mock_session.execute.call_args[0][1]
        assert call_params["tenant_id"] == TENANT_A


# ---------------------------------------------------------------------------
# 6. Input validation — disallowed layers
# ---------------------------------------------------------------------------

class TestLayerValidation:
    """Verify that invalid layer names are rejected."""

    @pytest.mark.asyncio
    async def test_intersection_rejects_unknown_layer(self):
        from app.services.spatial_analysis import intersection_query

        mock_session = AsyncMock()
        with pytest.raises(ValueError, match="not in the allowed layer list"):
            await intersection_query(
                polygon_geojson=SEA_POINT_POLYGON,
                layer_name="users; DROP TABLE parcels;--",
                tenant_id=TENANT_A,
                session=mock_session,
            )

    @pytest.mark.asyncio
    async def test_buffer_rejects_invalid_radius(self):
        from app.services.spatial_analysis import buffer_query

        mock_session = AsyncMock()
        with pytest.raises(ValueError, match="radius_m must be"):
            await buffer_query(
                point_geojson=SEA_POINT_CENTRE,
                radius_m=-10,
                layer_name="parcels",
                tenant_id=TENANT_A,
                session=mock_session,
            )

    @pytest.mark.asyncio
    async def test_buffer_rejects_excessive_radius(self):
        from app.services.spatial_analysis import buffer_query

        mock_session = AsyncMock()
        with pytest.raises(ValueError, match="radius_m must be"):
            await buffer_query(
                point_geojson=SEA_POINT_CENTRE,
                radius_m=100000,
                layer_name="parcels",
                tenant_id=TENANT_A,
                session=mock_session,
            )
