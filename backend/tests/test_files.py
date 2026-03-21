"""
Tests for GIS file ingestion and export pipeline (MP2).
Covers format detection, shapefile validation, DXF CRS enforcement,
bbox validation, storage routing, upload endpoints, and export endpoints.
"""

import io
import json
import zipfile

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from app.services.format_validators import (
    CAPE_TOWN_BBOX,
    GISFormat,
    SHAPEFILE_REQUIRED_EXTENSIONS,
    UPLOAD_MAX_BYTES,
    detect_format,
    get_storage_destination,
    prompt_dxf_crs,
    validate_crs,
    validate_shapefile_zip,
    validate_within_cape_town_bbox,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_zip(files: dict[str, bytes]) -> bytes:
    """Create a ZIP archive from a dict of {filename: content}."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        for name, content in files.items():
            zf.writestr(name, content)
    return buf.getvalue()


def _valid_shapefile_zip() -> bytes:
    """Create a minimal valid Shapefile ZIP with all 4 required components."""
    return _make_zip({
        "test.shp": b"fake-shp-data",
        "test.dbf": b"fake-dbf-data",
        "test.prj": b"GEOGCS[\"WGS 84\"]",
        "test.shx": b"fake-shx-data",
    })


def _shapefile_zip_missing_prj() -> bytes:
    """Create a Shapefile ZIP missing the .prj file."""
    return _make_zip({
        "test.shp": b"fake-shp-data",
        "test.dbf": b"fake-dbf-data",
        "test.shx": b"fake-shx-data",
    })


def _shapefile_zip_missing_shx_prj() -> bytes:
    """Create a Shapefile ZIP missing both .shx and .prj."""
    return _make_zip({
        "test.shp": b"fake-shp-data",
        "test.dbf": b"fake-dbf-data",
    })


# ---------------------------------------------------------------------------
# Format detection tests
# ---------------------------------------------------------------------------


class TestDetectFormat:
    """Tests for detect_format() — MIME + extension-based detection."""

    def test_geojson_by_extension(self):
        result = detect_format(b'{"type":"FeatureCollection"}', "data.geojson")
        assert result == GISFormat.GEOJSON

    def test_json_extension_detected_as_geojson(self):
        result = detect_format(b'{"type":"FeatureCollection"}', "data.json")
        assert result == GISFormat.GEOJSON

    def test_shapefile_zip_by_extension(self):
        zip_bytes = _valid_shapefile_zip()
        result = detect_format(zip_bytes, "parcels.zip")
        assert result == GISFormat.SHAPEFILE

    def test_geopackage_by_extension(self):
        result = detect_format(b"fake-gpkg-data", "layers.gpkg")
        assert result == GISFormat.GEOPACKAGE

    def test_kml_by_extension(self):
        result = detect_format(b"<kml></kml>", "places.kml")
        assert result == GISFormat.KML

    def test_kmz_by_extension(self):
        # KMZ is a ZIP containing KML
        kmz_bytes = _make_zip({"doc.kml": b"<kml></kml>"})
        result = detect_format(kmz_bytes, "places.kmz")
        assert result == GISFormat.KMZ

    def test_csv_by_extension(self):
        result = detect_format(b"lat,lon\n-33.9,18.4", "points.csv")
        assert result == GISFormat.CSV

    def test_geotiff_by_extension(self):
        result = detect_format(b"fake-tiff-data", "raster.tif")
        assert result == GISFormat.GEOTIFF

    def test_tiff_extension(self):
        result = detect_format(b"fake-tiff-data", "raster.tiff")
        assert result == GISFormat.GEOTIFF

    def test_dxf_by_extension(self):
        result = detect_format(b"0\nSECTION", "drawing.dxf")
        assert result == GISFormat.DXF

    def test_las_by_extension(self):
        result = detect_format(b"LASF", "points.las")
        assert result == GISFormat.LAS

    def test_laz_by_extension(self):
        result = detect_format(b"LASF", "points.laz")
        assert result == GISFormat.LAZ

    def test_unknown_extension(self):
        result = detect_format(b"random data", "file.xyz")
        assert result == GISFormat.UNKNOWN

    def test_no_extension(self):
        result = detect_format(b"random data", "noextension")
        assert result == GISFormat.UNKNOWN


# ---------------------------------------------------------------------------
# Shapefile ZIP validation tests
# ---------------------------------------------------------------------------


class TestValidateShapefileZip:
    """Tests for validate_shapefile_zip() — GOTCHA-PY-003."""

    def test_valid_shapefile_zip(self):
        is_valid, missing = validate_shapefile_zip(_valid_shapefile_zip())
        assert is_valid is True
        assert missing == []

    def test_missing_prj_rejected(self):
        """Shapefile without .prj MUST be rejected — never assume EPSG:4326."""
        is_valid, missing = validate_shapefile_zip(_shapefile_zip_missing_prj())
        assert is_valid is False
        assert ".prj" in missing

    def test_missing_multiple_components(self):
        is_valid, missing = validate_shapefile_zip(_shapefile_zip_missing_shx_prj())
        assert is_valid is False
        assert ".prj" in missing
        assert ".shx" in missing

    def test_empty_zip(self):
        empty_zip = _make_zip({})
        is_valid, missing = validate_shapefile_zip(empty_zip)
        assert is_valid is False
        assert len(missing) == len(SHAPEFILE_REQUIRED_EXTENSIONS)

    def test_invalid_zip_bytes(self):
        is_valid, missing = validate_shapefile_zip(b"not a zip file")
        assert is_valid is False
        assert "Invalid ZIP archive" in missing

    def test_shapefile_in_subdirectory(self):
        """Shapefile components inside a subdirectory should still be found."""
        zip_bytes = _make_zip({
            "subdir/test.shp": b"data",
            "subdir/test.dbf": b"data",
            "subdir/test.prj": b"data",
            "subdir/test.shx": b"data",
        })
        is_valid, missing = validate_shapefile_zip(zip_bytes)
        assert is_valid is True
        assert missing == []


# ---------------------------------------------------------------------------
# CRS validation tests
# ---------------------------------------------------------------------------


class TestValidateCRS:
    """Tests for validate_crs()."""

    def test_valid_crs(self):
        assert validate_crs("EPSG:4326") == "EPSG:4326"

    def test_none_crs(self):
        assert validate_crs(None) is None

    def test_empty_crs(self):
        assert validate_crs("") is None

    def test_whitespace_crs(self):
        assert validate_crs("   ") is None


# ---------------------------------------------------------------------------
# Cape Town bbox validation tests
# ---------------------------------------------------------------------------


class TestValidateWithinCapeTownBbox:
    """Tests for validate_within_cape_town_bbox()."""

    def test_sea_point_within_bbox(self):
        """Sea Point (Cape Town) should be within the bbox."""
        assert validate_within_cape_town_bbox(18.38, -33.92, 18.40, -33.90) is True

    def test_cbd_within_bbox(self):
        """Cape Town CBD should be within the bbox."""
        assert validate_within_cape_town_bbox(18.41, -33.93, 18.43, -33.91) is True

    def test_atlantic_ocean_outside(self):
        """Point in the Atlantic Ocean should be outside the bbox."""
        assert validate_within_cape_town_bbox(17.0, -35.0, 17.5, -34.5) is False

    def test_johannesburg_outside(self):
        """Johannesburg is far outside the Cape Town bbox."""
        assert validate_within_cape_town_bbox(27.9, -26.3, 28.1, -26.1) is False

    def test_partial_overlap(self):
        """Geometry partially overlapping the bbox should return True."""
        assert validate_within_cape_town_bbox(18.0, -34.5, 18.5, -34.0) is True

    def test_exact_bbox_match(self):
        """Exact Cape Town bbox should be valid."""
        ct = CAPE_TOWN_BBOX
        assert validate_within_cape_town_bbox(
            ct["min_lon"], ct["min_lat"], ct["max_lon"], ct["max_lat"]
        ) is True


# ---------------------------------------------------------------------------
# DXF CRS prompt tests (GOTCHA-PY-004)
# ---------------------------------------------------------------------------


class TestDxfCrsPrompt:
    """Tests for prompt_dxf_crs() — GOTCHA-PY-004."""

    def test_prompt_contains_crs_options(self):
        prompt = prompt_dxf_crs()
        assert "EPSG:4326" in prompt
        assert "EPSG:32734" in prompt
        assert "EPSG:2048" in prompt

    def test_prompt_mentions_no_metadata(self):
        prompt = prompt_dxf_crs()
        assert "do not contain CRS metadata" in prompt

    def test_prompt_requires_confirmation(self):
        prompt = prompt_dxf_crs()
        assert "will not proceed" in prompt


# ---------------------------------------------------------------------------
# Storage routing tests
# ---------------------------------------------------------------------------


class TestGetStorageDestination:
    """Tests for get_storage_destination()."""

    def test_small_geojson_to_supabase(self):
        assert get_storage_destination(1_000_000, GISFormat.GEOJSON) == "supabase"

    def test_large_geojson_to_r2(self):
        assert get_storage_destination(60_000_000, GISFormat.GEOJSON) == "r2"

    def test_geotiff_always_r2(self):
        """GeoTIFF always goes to R2 regardless of size."""
        assert get_storage_destination(100, GISFormat.GEOTIFF) == "r2"

    def test_las_always_r2(self):
        """LAS always goes to R2 regardless of size."""
        assert get_storage_destination(100, GISFormat.LAS) == "r2"

    def test_laz_always_r2(self):
        assert get_storage_destination(100, GISFormat.LAZ) == "r2"

    def test_filegdb_always_r2(self):
        assert get_storage_destination(100, GISFormat.FILEGDB) == "r2"

    def test_small_csv_to_supabase(self):
        assert get_storage_destination(5_000_000, GISFormat.CSV) == "supabase"

    def test_exactly_50mb_to_supabase(self):
        """Files exactly at 50MB threshold go to supabase (not strictly greater)."""
        assert get_storage_destination(50 * 1024 * 1024, GISFormat.GEOJSON) == "supabase"

    def test_just_over_50mb_to_r2(self):
        assert get_storage_destination(50 * 1024 * 1024 + 1, GISFormat.GEOJSON) == "r2"


# ---------------------------------------------------------------------------
# API endpoint tests (using FastAPI TestClient)
# ---------------------------------------------------------------------------


# Mock auth dependency
async def mock_current_user():
    return {
        "sub": "user-uuid-123",
        "tenant_id": "tenant-uuid-456",
        "email": "test@capegis.co.za",
        "app_role": "MEMBER",
    }


@pytest.fixture
def client():
    """Create a FastAPI test client with mocked auth."""
    from app.core.auth import get_current_user
    from main import app

    app.dependency_overrides[get_current_user] = mock_current_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


class TestUploadEndpoint:
    """Tests for POST /files/upload."""

    def test_upload_no_auth_returns_401(self):
        """Upload without JWT returns 401."""
        from main import app

        app.dependency_overrides.clear()
        with TestClient(app) as c:
            response = c.post(
                "/files/upload",
                files={"file": ("test.geojson", b'{"type":"FeatureCollection"}', "application/json")},
            )
        assert response.status_code == status.HTTP_403_FORBIDDEN or response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_upload_empty_file_returns_422(self, client):
        response = client.post(
            "/files/upload",
            files={"file": ("empty.geojson", b"", "application/json")},
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert "empty" in response.json()["detail"].lower()

    def test_upload_unknown_format_returns_422(self, client):
        response = client.post(
            "/files/upload",
            files={"file": ("data.xyz", b"unknown data", "application/octet-stream")},
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert "Unsupported" in response.json()["detail"]

    def test_upload_dxf_without_crs_returns_422(self, client):
        """DXF upload without CRS parameter must return 422 (GOTCHA-PY-004)."""
        response = client.post(
            "/files/upload",
            files={"file": ("drawing.dxf", b"0\nSECTION", "application/octet-stream")},
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        detail = response.json()["detail"]
        assert "CRS" in detail
        assert "EPSG:4326" in detail

    def test_upload_shapefile_missing_prj_returns_422(self, client):
        """Shapefile ZIP missing .prj must return 422 (GOTCHA-PY-003)."""
        zip_bytes = _shapefile_zip_missing_prj()
        response = client.post(
            "/files/upload",
            files={"file": ("parcels.zip", zip_bytes, "application/zip")},
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        detail = response.json()["detail"]
        assert ".prj" in detail
        assert "Missing" in detail

    def test_upload_shapefile_missing_multiple_returns_422(self, client):
        """Shapefile ZIP missing .prj and .shx lists both in error."""
        zip_bytes = _shapefile_zip_missing_shx_prj()
        response = client.post(
            "/files/upload",
            files={"file": ("data.zip", zip_bytes, "application/zip")},
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        detail = response.json()["detail"]
        assert ".prj" in detail
        assert ".shx" in detail


class TestExportEndpoint:
    """Tests for GET /files/export/{layer_id}/{format}."""

    def test_export_no_auth_returns_401(self):
        """Export without JWT returns 401/403."""
        from main import app

        app.dependency_overrides.clear()
        with TestClient(app) as c:
            response = c.get("/files/export/some-layer-id/geojson")
        assert response.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )

    def test_export_unsupported_format_returns_422(self, client):
        response = client.get("/files/export/layer-123/docx")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert "Unsupported export format" in response.json()["detail"]

    def test_export_geojson_returns_200(self, client):
        """GeoJSON export returns 200 with correct content type."""
        response = client.get("/files/export/layer-123/geojson")
        assert response.status_code == status.HTTP_200_OK
        assert "geo+json" in response.headers.get("content-type", "")

    def test_export_geojson_contains_metadata(self, client):
        """Exported GeoJSON FeatureCollection includes source metadata."""
        response = client.get("/files/export/layer-123/geojson")
        data = response.json()
        assert data["type"] == "FeatureCollection"
        assert "CapeTown GIS Hub" in data["properties"]["source"]

    def test_export_content_disposition_header(self, client):
        """Export response includes Content-Disposition attachment header."""
        response = client.get("/files/export/layer-123/geojson")
        cd = response.headers.get("content-disposition", "")
        assert "attachment" in cd
        assert "layer-123" in cd


class TestArcGISRestEndpoint:
    """Tests for POST /files/upload/arcgis-rest."""

    def test_arcgis_rest_no_auth_returns_401(self):
        """ArcGIS REST import without JWT returns 401/403."""
        from main import app

        app.dependency_overrides.clear()
        with TestClient(app) as c:
            response = c.post(
                "/files/upload/arcgis-rest",
                json={"service_url": "https://services.arcgis.com/test/FeatureServer/0"},
            )
        assert response.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )

    def test_arcgis_rest_missing_url_returns_422(self, client):
        """Missing service_url in request body returns 422."""
        response = client.post("/files/upload/arcgis-rest", json={})
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
