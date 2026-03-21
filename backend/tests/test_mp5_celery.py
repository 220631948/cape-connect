"""Tests for MP5 — Celery Workers and ML Pipelines."""

import json
import math
import sys
import os
import pytest
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# =====================================================================
# Flood Risk Tests
# =====================================================================

class TestFloodRisk:
    """Tests for flood risk analysis algorithms."""

    def test_classify_risk_very_high(self):
        from app.tasks.flood_risk import classify_risk
        assert classify_risk(0.80) == "Very High"

    def test_classify_risk_high(self):
        from app.tasks.flood_risk import classify_risk
        assert classify_risk(0.55) == "High"

    def test_classify_risk_medium(self):
        from app.tasks.flood_risk import classify_risk
        assert classify_risk(0.30) == "Medium"

    def test_classify_risk_low(self):
        from app.tasks.flood_risk import classify_risk
        assert classify_risk(0.10) == "Low"

    def test_compute_twi_flat_terrain(self):
        from app.tasks.flood_risk import compute_twi
        dem = np.ones((10, 10)) * 100.0
        twi = compute_twi(dem)
        assert twi.shape == (10, 10)
        assert np.all(twi >= 0) and np.all(twi <= 1)

    def test_compute_twi_empty(self):
        from app.tasks.flood_risk import compute_twi
        result = compute_twi(np.array([]))
        assert result.size == 0

    def test_compute_slope_flat(self):
        from app.tasks.flood_risk import compute_slope
        dem = np.ones((10, 10)) * 50.0
        slope = compute_slope(dem)
        assert slope.shape == (10, 10)
        assert np.all(slope >= 0) and np.all(slope <= 1)

    def test_normalise_rainfall(self):
        from app.tasks.flood_risk import normalise_rainfall
        rain = np.array([[10, 20], [30, 40]])
        norm = normalise_rainfall(rain)
        assert np.isclose(norm.min(), 0.0)
        assert np.isclose(norm.max(), 1.0)

    def test_normalise_rainfall_empty(self):
        from app.tasks.flood_risk import normalise_rainfall
        result = normalise_rainfall(np.array([]))
        assert result.size == 0

    def test_normalise_soil_permeability_inverted(self):
        from app.tasks.flood_risk import normalise_soil_permeability
        soil = np.array([[1, 5], [10, 20]])
        norm = normalise_soil_permeability(soil)
        # Low permeability (1) should have HIGH risk (closer to 1)
        assert norm[0, 0] > norm[1, 1]

    def test_compute_flood_susceptibility_weights(self):
        from app.tasks.flood_risk import compute_flood_susceptibility
        twi = np.ones((3, 3)) * 0.5
        rain = np.ones((3, 3)) * 0.5
        soil = np.ones((3, 3)) * 0.5
        result = compute_flood_susceptibility(twi, rain, soil)
        assert np.allclose(result, 0.5)

    def test_classify_raster(self):
        from app.tasks.flood_risk import classify_raster
        susc = np.array([[0.1, 0.3], [0.6, 0.8]])
        classified = classify_raster(susc)
        assert classified[0, 0] == 0  # Low
        assert classified[0, 1] == 1  # Medium
        assert classified[1, 0] == 2  # High
        assert classified[1, 1] == 3  # Very High

    def test_validate_bbox_within_cape_town(self):
        from app.tasks.flood_risk import validate_bbox_within_cape_town
        valid = {"min_lng": 18.4, "min_lat": -34.0, "max_lng": 18.6, "max_lat": -33.9}
        assert validate_bbox_within_cape_town(valid) is True

    def test_validate_bbox_outside_cape_town(self):
        from app.tasks.flood_risk import validate_bbox_within_cape_town
        invalid = {"min_lng": 10.0, "min_lat": -34.0, "max_lng": 18.6, "max_lat": -33.9}
        assert validate_bbox_within_cape_town(invalid) is False

    @pytest.mark.asyncio
    async def test_run_flood_risk_invalid_bbox(self):
        from app.tasks.flood_risk import run_flood_risk_analysis
        result = await run_flood_risk_analysis("job-1", {"min_lng": 10, "min_lat": -34, "max_lng": 11, "max_lat": -33}, "tenant-1")
        assert result["status"] == "failed"
        assert "Cape Town" in result["error"]


# =====================================================================
# Heat Island Tests
# =====================================================================

class TestHeatIsland:
    """Tests for heat island analysis algorithms."""

    def test_dn_to_radiance(self):
        from app.tasks.heat_island import dn_to_radiance
        dn = np.array([[10000, 20000]])
        rad = dn_to_radiance(dn)
        assert rad.shape == (1, 2)
        assert rad[0, 1] > rad[0, 0]

    def test_radiance_to_brightness_temp(self):
        from app.tasks.heat_island import radiance_to_brightness_temp
        rad = np.array([[5.0, 10.0]])
        bt = radiance_to_brightness_temp(rad)
        assert bt.shape == (1, 2)
        assert np.all(bt > 200)  # Should be in Kelvin range

    def test_compute_ndvi(self):
        from app.tasks.heat_island import compute_ndvi
        red = np.array([[100, 200]])
        nir = np.array([[300, 200]])
        ndvi = compute_ndvi(red, nir)
        assert ndvi[0, 0] == 0.5  # (300-100)/(300+100)
        assert ndvi[0, 1] == 0.0  # (200-200)/(200+200)

    def test_compute_emissivity_bare_soil(self):
        from app.tasks.heat_island import compute_emissivity
        ndvi = np.array([[0.1]])  # bare soil
        em = compute_emissivity(ndvi)
        assert np.isclose(em[0, 0], 0.97)

    def test_compute_emissivity_vegetation(self):
        from app.tasks.heat_island import compute_emissivity
        ndvi = np.array([[0.7]])  # full vegetation
        em = compute_emissivity(ndvi)
        assert np.isclose(em[0, 0], 0.99)

    def test_mono_window_lst(self):
        from app.tasks.heat_island import mono_window_lst
        bt = np.array([[300.0]])  # 300K
        em = np.array([[0.97]])
        lst = mono_window_lst(bt, em)
        # Should be around 27°C (300K - 273.15)
        assert lst[0, 0] > 20 and lst[0, 0] < 35

    def test_classify_heat_island(self):
        from app.tasks.heat_island import classify_heat_island
        lst = np.array([[25, 30, 35, 40, 20]])
        classified = classify_heat_island(lst)
        assert classified.shape == lst.shape

    def test_validate_bbox(self):
        from app.tasks.heat_island import validate_bbox_within_cape_town
        valid = {"min_lng": 18.4, "min_lat": -34.0, "max_lng": 18.6, "max_lat": -33.9}
        assert validate_bbox_within_cape_town(valid) is True

    @pytest.mark.asyncio
    async def test_run_heat_island_invalid_bbox(self):
        from app.tasks.heat_island import run_heat_island_analysis
        result = await run_heat_island_analysis("job-1", {"min_lng": 10, "min_lat": -34, "max_lng": 11, "max_lat": -33}, "t1")
        assert result["status"] == "failed"


# =====================================================================
# Anomaly Detection Tests
# =====================================================================

class TestAnomalyDetection:
    """Tests for property valuation anomaly detection."""

    def test_encode_zone_type_known(self):
        from app.tasks.anomaly_detection import encode_zone_type
        assert encode_zone_type("SR-1") == 1
        assert encode_zone_type("GB-2") == 8

    def test_encode_zone_type_unknown(self):
        from app.tasks.anomaly_detection import encode_zone_type
        assert encode_zone_type("UNKNOWN") == 0

    def test_compute_distance_to_cbd(self):
        from app.tasks.anomaly_detection import compute_distance_to_cbd, CBD_LAT, CBD_LNG
        dist = compute_distance_to_cbd(CBD_LAT, CBD_LNG)
        assert dist < 1  # Same point, should be ~0

    def test_compute_distance_nonzero(self):
        from app.tasks.anomaly_detection import compute_distance_to_cbd
        dist = compute_distance_to_cbd(-34.0, 18.5)
        assert dist > 1000  # Should be several km

    def test_prepare_features(self):
        from app.tasks.anomaly_detection import prepare_features, FEATURE_NAMES
        parcel = {"assessed_value_rands": 1000000, "area_sqm": 500, "zone_type": "SR-1", "suburb_median_value": 900000, "distance_to_cbd_m": 5000, "flood_risk_score": 0.3}
        features = prepare_features(parcel)
        assert features.shape[0] == len(FEATURE_NAMES)

    def test_classify_anomaly_score_anomalous(self):
        from app.tasks.anomaly_detection import classify_anomaly_score
        assert classify_anomaly_score(-0.7) == "anomalous"

    def test_classify_anomaly_score_suspicious(self):
        from app.tasks.anomaly_detection import classify_anomaly_score
        assert classify_anomaly_score(-0.3) == "suspicious"

    def test_classify_anomaly_score_normal(self):
        from app.tasks.anomaly_detection import classify_anomaly_score
        assert classify_anomaly_score(0.5) == "normal"

    def test_validate_features_valid(self):
        from app.tasks.anomaly_detection import validate_features
        features = np.array([1000000, 500, 1, 900000, 5000, 0.3])
        ok, err = validate_features(features)
        assert ok is True

    def test_validate_features_nan(self):
        from app.tasks.anomaly_detection import validate_features
        features = np.array([float('nan'), 500, 1, 900000, 5000, 0.3])
        ok, err = validate_features(features)
        assert ok is False
        assert "NaN" in err

    def test_validate_features_wrong_count(self):
        from app.tasks.anomaly_detection import validate_features
        ok, err = validate_features(np.array([1, 2, 3]))
        assert ok is False

    def test_validate_features_negative_value(self):
        from app.tasks.anomaly_detection import validate_features
        features = np.array([-100, 500, 1, 900000, 5000, 0.3])
        ok, err = validate_features(features)
        assert ok is False

    @pytest.mark.asyncio
    async def test_predict_single(self):
        from app.tasks.anomaly_detection import predict_single
        parcel = {"id": "p1", "assessed_value_rands": 1000000, "area_sqm": 500, "zone_type": "SR-1", "suburb_median_value": 900000, "distance_to_cbd_m": 5000, "flood_risk_score": 0.3}
        result = await predict_single(parcel, "tenant-1")
        assert result["status"] == "complete"
        assert result["verdict"] == "normal"

    @pytest.mark.asyncio
    async def test_predict_batch(self):
        from app.tasks.anomaly_detection import predict_batch
        parcels = [{"id": f"p{i}", "assessed_value_rands": 1000000, "area_sqm": 500, "zone_type": "SR-1", "suburb_median_value": 900000, "distance_to_cbd_m": 5000, "flood_risk_score": 0.3} for i in range(3)]
        results = await predict_batch(parcels, "tenant-1")
        assert len(results) == 3


# =====================================================================
# NL Spatial Query Tests
# =====================================================================

class TestNLSpatialQuery:
    """Tests for natural language spatial query pipeline."""

    def test_validate_query_json_valid(self):
        from app.tasks.nl_spatial_query import validate_query_json
        q = {"spatial_op": "ST_DWithin", "target_table": "parcels", "filters": {"zone_type": "SR-1"}, "reference_layer": "osm_train_stations", "distance_m": 500, "limit": 100}
        ok, err = validate_query_json(q)
        assert ok is True

    def test_validate_query_json_invalid_table(self):
        from app.tasks.nl_spatial_query import validate_query_json
        q = {"spatial_op": "ST_DWithin", "target_table": "evil_table", "distance_m": 500}
        ok, err = validate_query_json(q)
        assert ok is False
        assert "Invalid target table" in err

    def test_validate_query_json_invalid_op(self):
        from app.tasks.nl_spatial_query import validate_query_json
        q = {"spatial_op": "DROP TABLE", "target_table": "parcels"}
        ok, err = validate_query_json(q)
        assert ok is False

    def test_validate_query_json_missing_distance(self):
        from app.tasks.nl_spatial_query import validate_query_json
        q = {"spatial_op": "ST_DWithin", "target_table": "parcels"}
        ok, err = validate_query_json(q)
        assert ok is False
        assert "distance_m" in err

    def test_validate_query_json_sql_injection_filter(self):
        from app.tasks.nl_spatial_query import validate_query_json
        q = {"spatial_op": "ST_Intersects", "target_table": "parcels", "filters": {"name": "'; DROP TABLE parcels;--"}}
        ok, err = validate_query_json(q)
        assert ok is False

    def test_is_safe_identifier(self):
        from app.tasks.nl_spatial_query import _is_safe_identifier
        assert _is_safe_identifier("zone_type") is True
        assert _is_safe_identifier("123bad") is False
        assert _is_safe_identifier("a; DROP") is False

    def test_is_safe_value(self):
        from app.tasks.nl_spatial_query import _is_safe_value
        assert _is_safe_value("SR-1") is True
        assert _is_safe_value("' OR 1=1") is False
        assert _is_safe_value("value; DROP TABLE x") is False

    def test_parse_claude_response_valid(self):
        from app.tasks.nl_spatial_query import parse_claude_response
        result, err = parse_claude_response('{"spatial_op": "ST_DWithin"}')
        assert result is not None
        assert result["spatial_op"] == "ST_DWithin"

    def test_parse_claude_response_with_fences(self):
        from app.tasks.nl_spatial_query import parse_claude_response
        result, err = parse_claude_response('```json\n{"spatial_op": "ST_DWithin"}\n```')
        assert result is not None

    def test_parse_claude_response_invalid(self):
        from app.tasks.nl_spatial_query import parse_claude_response
        result, err = parse_claude_response("not json at all")
        assert result is None
        assert "Invalid JSON" in err

    def test_build_parameterised_query_simple(self):
        from app.tasks.nl_spatial_query import build_parameterised_query
        q = {"spatial_op": "ST_Intersects", "target_table": "parcels", "filters": {"zone_type": "SR-1"}, "suburb_filter": "Woodstock", "limit": 50}
        sql, params = build_parameterised_query(q, "tenant-123")
        assert ":tenant_id" in sql
        assert ":filter_0" in sql
        assert ":suburb_filter" in sql
        assert params["tenant_id"] == "tenant-123"
        assert params["filter_0"] == "SR-1"

    def test_build_parameterised_query_dwithin(self):
        from app.tasks.nl_spatial_query import build_parameterised_query
        q = {"spatial_op": "ST_DWithin", "target_table": "parcels", "reference_layer": "osm_train_stations", "distance_m": 500, "limit": 100}
        sql, params = build_parameterised_query(q, "t1")
        assert "ST_DWithin" in sql
        assert ":distance_m" in sql
        assert params["distance_m"] == 500

    @pytest.mark.asyncio
    async def test_check_rate_limit(self):
        from app.tasks.nl_spatial_query import check_rate_limit
        allowed, remaining = await check_rate_limit("tenant-1")
        assert allowed is True
        assert remaining == 50


# =====================================================================
# LULC Classification Tests
# =====================================================================

class TestLULCClassification:
    """Tests for LULC classification."""

    def test_lulc_class_enum(self):
        from app.tasks.lulc_classification import LULCClass
        assert LULCClass.WATER == 0
        assert LULCClass.INFORMAL_SETTLEMENT == 6

    def test_compute_spectral_indices(self):
        from app.tasks.lulc_classification import compute_spectral_indices
        bands = {"B02": np.ones((2, 2)) * 500, "B03": np.ones((2, 2)) * 600, "B04": np.ones((2, 2)) * 400, "B8A": np.ones((2, 2)) * 3000, "B11": np.ones((2, 2)) * 1000, "B12": np.ones((2, 2)) * 800}
        indices = compute_spectral_indices(bands)
        assert "NDVI" in indices
        assert "NDWI" in indices
        assert "EVI" in indices
        assert "NDBI" in indices
        assert indices["NDVI"].shape == (2, 2)

    def test_prepare_prithvi_input(self):
        from app.tasks.lulc_classification import prepare_prithvi_input, PRITHVI_HLS_BANDS
        bands = {b: np.ones((224, 224)) * 5000 for b in PRITHVI_HLS_BANDS}
        tensor = prepare_prithvi_input(bands)
        assert tensor.shape == (1, 6, 224, 224)
        assert np.all(tensor >= 0) and np.all(tensor <= 1)

    def test_prepare_prithvi_input_missing_band(self):
        from app.tasks.lulc_classification import prepare_prithvi_input
        with pytest.raises(ValueError, match="Missing required HLS band"):
            prepare_prithvi_input({"B02": np.ones((10, 10))})

    def test_postprocess_classification_empty(self):
        from app.tasks.lulc_classification import postprocess_classification
        result = postprocess_classification(np.array([]))
        assert result["dominant_class"] is None

    def test_postprocess_classification(self):
        from app.tasks.lulc_classification import postprocess_classification
        pred = np.array([[0, 1, 2], [3, 4, 5]])
        result = postprocess_classification(pred)
        assert "class_distribution" in result
        assert result["total_pixels"] == 6

    @pytest.mark.asyncio
    async def test_run_lulc_invalid_bbox(self):
        from app.tasks.lulc_classification import run_lulc_classification
        result = await run_lulc_classification("j1", {"min_lng": 10, "min_lat": -34, "max_lng": 11, "max_lat": -33}, "t1")
        assert result["status"] == "failed"


# =====================================================================
# Jobs API Tests
# =====================================================================

class TestJobsAPI:
    """Tests for jobs endpoints."""

    @pytest.fixture
    def client(self):
        from fastapi.testclient import TestClient
        from main import app
        from app.core.auth import get_current_user

        mock_user = {"sub": "user-1", "tenant_id": "tenant-1", "app_role": "analyst"}
        app.dependency_overrides[get_current_user] = lambda: mock_user
        yield TestClient(app)
        app.dependency_overrides.clear()

    @pytest.fixture
    def unauth_client(self):
        from fastapi.testclient import TestClient
        from main import app
        return TestClient(app)

    def test_create_job(self, client):
        resp = client.post("/jobs/", json={"task_type": "flood_risk", "input_params": {}})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "queued"
        assert "job_id" in data

    def test_get_job_not_found(self, client):
        resp = client.get("/jobs/nonexistent-id")
        assert resp.status_code == 404

    def test_list_jobs(self, client):
        resp = client.get("/jobs/")
        assert resp.status_code == 200
        data = resp.json()
        assert "jobs" in data
        assert "total" in data

    def test_jobs_require_auth(self, unauth_client):
        resp = unauth_client.get("/jobs/")
        assert resp.status_code == 401


# =====================================================================
# ML API Tests
# =====================================================================

class TestMLAPI:
    """Tests for ML inference endpoints."""

    @pytest.fixture
    def client(self):
        from fastapi.testclient import TestClient
        from main import app
        from app.core.auth import get_current_user

        mock_user = {"sub": "user-1", "tenant_id": "tenant-1", "app_role": "analyst"}
        app.dependency_overrides[get_current_user] = lambda: mock_user
        yield TestClient(app)
        app.dependency_overrides.clear()

    @pytest.fixture
    def unauth_client(self):
        from fastapi.testclient import TestClient
        from main import app
        return TestClient(app)

    def test_anomaly_predict(self, client):
        resp = client.post("/ml/anomaly/predict", json={"id": "p1", "assessed_value_rands": 1000000, "area_sqm": 500, "zone_type": "SR-1"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["verdict"] == "normal"

    def test_anomaly_batch(self, client):
        parcels = [{"id": f"p{i}", "assessed_value_rands": 1000000, "area_sqm": 500} for i in range(3)]
        resp = client.post("/ml/anomaly/batch", json={"parcels": parcels})
        assert resp.status_code == 200

    def test_anomaly_train(self, client):
        resp = client.post("/ml/anomaly/train")
        assert resp.status_code == 200
        assert resp.json()["task_type"] == "anomaly_detection"

    def test_flood_risk_trigger(self, client):
        resp = client.post("/ml/flood-risk", json={"min_lng": 18.4, "min_lat": -34.0, "max_lng": 18.6, "max_lat": -33.9})
        assert resp.status_code == 200
        assert resp.json()["task_type"] == "flood_risk"

    def test_heat_island_trigger(self, client):
        resp = client.post("/ml/heat-island", json={"min_lng": 18.4, "min_lat": -34.0, "max_lng": 18.6, "max_lat": -33.9})
        assert resp.status_code == 200
        assert resp.json()["task_type"] == "heat_island"

    def test_lulc_classify_trigger(self, client):
        resp = client.post("/ml/lulc-classify", json={"min_lng": 18.4, "min_lat": -34.0, "max_lng": 18.6, "max_lat": -33.9})
        assert resp.status_code == 200
        assert resp.json()["task_type"] == "lulc_classify"

    def test_ml_endpoints_require_auth(self, unauth_client):
        assert unauth_client.post("/ml/anomaly/predict", json={}).status_code == 401
        assert unauth_client.post("/ml/flood-risk", json={}).status_code == 401
        assert unauth_client.post("/ml/nl-query", json={"query": "test"}).status_code == 401

    def test_flood_risk_invalid_bbox(self, client):
        resp = client.post("/ml/flood-risk", json={"min_lng": 10.0, "min_lat": -34.0, "max_lng": 11.0, "max_lat": -33.0})
        assert resp.status_code == 422  # Pydantic validation
