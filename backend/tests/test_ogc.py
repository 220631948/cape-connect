"""
Tests for OGC Services endpoints (MP4).

Covers:
- OGC landing page, conformance, collections
- WFS/WMS GetCapabilities with attribution
- Collection items (public + tenant auth)
- API key authentication for tenant collections
- Bbox validation, limit validation
- Single feature access
- QGIS/ArcGIS Pro connection URL format verification
"""
import pytest
from fastapi.testclient import TestClient


# --- Fixtures ---

@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    from main import app
    return TestClient(app)


@pytest.fixture(autouse=True)
def clear_keys():
    """Clear API keys before each test."""
    from app.api.routes.ogc import clear_api_keys
    clear_api_keys()
    yield
    clear_api_keys()


def _register_key(api_key: str, tenant_id: str):
    """Helper to register an API key for testing."""
    from app.api.routes.ogc import register_api_key
    register_api_key(api_key, tenant_id)


# ============================================================
# 1. OGC Landing Page
# ============================================================

class TestOGCLandingPage:
    """GET /ogc returns OGC API landing page with correct contact and attribution."""

    def test_landing_page_returns_200(self, client):
        resp = client.get("/ogc")
        assert resp.status_code == 200

    def test_landing_page_has_title(self, client):
        data = client.get("/ogc").json()
        assert "CapeTown GIS Hub" in data["title"]

    def test_landing_page_has_attribution(self, client):
        data = client.get("/ogc").json()
        assert "OpenStreetMap" in data["attribution"]
        assert "CARTO" in data["attribution"]

    def test_landing_page_has_contact(self, client):
        data = client.get("/ogc").json()
        assert data["contact"]["name"] == "CapeTown GIS Hub Support"
        assert "capegis" in data["contact"]["url"]

    def test_landing_page_has_links(self, client):
        data = client.get("/ogc").json()
        link_rels = [l["rel"] for l in data["links"]]
        assert "self" in link_rels
        assert "data" in link_rels
        assert "conformance" in link_rels

    def test_landing_page_trailing_slash(self, client):
        """Both /ogc and /ogc/ should work."""
        resp = client.get("/ogc/")
        assert resp.status_code == 200


# ============================================================
# 2. Conformance
# ============================================================

class TestOGCConformance:
    """GET /ogc/conformance returns OGC conformance classes."""

    def test_conformance_returns_200(self, client):
        resp = client.get("/ogc/conformance")
        assert resp.status_code == 200

    def test_conformance_has_core(self, client):
        data = client.get("/ogc/conformance").json()
        assert any("core" in c for c in data["conformsTo"])

    def test_conformance_has_geojson(self, client):
        data = client.get("/ogc/conformance").json()
        assert any("geojson" in c for c in data["conformsTo"])


# ============================================================
# 3. Collections
# ============================================================

class TestOGCCollections:
    """GET /ogc/collections lists all Phase 1 collections."""

    def test_collections_returns_200(self, client):
        resp = client.get("/ogc/collections")
        assert resp.status_code == 200

    def test_collections_has_four_phase1(self, client):
        data = client.get("/ogc/collections").json()
        ids = [c["id"] for c in data["collections"]]
        assert "cape_town_zoning" in ids
        assert "cape_town_parcels" in ids
        assert "cape_town_suburbs" in ids
        assert "cape_town_flood_risk" in ids
        assert len(data["collections"]) == 4

    def test_collections_have_attribution(self, client):
        data = client.get("/ogc/collections").json()
        for coll in data["collections"]:
            assert "OpenStreetMap" in coll["attribution"]
            assert "CARTO" in coll["attribution"]

    def test_collections_have_bbox(self, client):
        data = client.get("/ogc/collections").json()
        for coll in data["collections"]:
            bbox = coll["extent"]["spatial"]["bbox"][0]
            assert bbox == [18.28, -34.36, 19.02, -33.48]

    def test_collections_have_item_links(self, client):
        data = client.get("/ogc/collections").json()
        for coll in data["collections"]:
            item_links = [l for l in coll["links"] if l["rel"] == "items"]
            assert len(item_links) == 1
            assert coll["id"] in item_links[0]["href"]


# ============================================================
# 4. Collection Detail
# ============================================================

class TestOGCCollectionDetail:
    """GET /ogc/collections/{id} returns single collection details."""

    def test_valid_collection_returns_200(self, client):
        resp = client.get("/ogc/collections/cape_town_zoning")
        assert resp.status_code == 200

    def test_valid_collection_has_title(self, client):
        data = client.get("/ogc/collections/cape_town_zoning").json()
        assert "Zoning" in data["title"]

    def test_invalid_collection_returns_404(self, client):
        resp = client.get("/ogc/collections/nonexistent_layer")
        assert resp.status_code == 404

    def test_tenant_collection_without_key_returns_401(self, client):
        resp = client.get("/ogc/collections/tenant_acme_uploads")
        assert resp.status_code == 401


# ============================================================
# 5. Collection Items (WFS-style feature access)
# ============================================================

class TestOGCCollectionItems:
    """GET /ogc/collections/{id}/items returns GeoJSON FeatureCollection."""

    def test_public_collection_returns_200(self, client):
        resp = client.get("/ogc/collections/cape_town_zoning/items")
        assert resp.status_code == 200

    def test_public_collection_returns_feature_collection(self, client):
        data = client.get("/ogc/collections/cape_town_zoning/items").json()
        assert data["type"] == "FeatureCollection"
        assert "features" in data
        assert "numberMatched" in data

    def test_public_collection_has_attribution(self, client):
        data = client.get("/ogc/collections/cape_town_zoning/items").json()
        assert "OpenStreetMap" in data["attribution"]

    def test_invalid_collection_returns_404(self, client):
        resp = client.get("/ogc/collections/nonexistent/items")
        assert resp.status_code == 404

    def test_tenant_no_api_key_returns_401(self, client):
        resp = client.get("/ogc/collections/tenant_acme_uploads/items")
        assert resp.status_code == 401

    def test_tenant_invalid_api_key_returns_401(self, client):
        resp = client.get("/ogc/collections/tenant_acme_uploads/items?api_key=badkey")
        assert resp.status_code == 401

    def test_tenant_valid_api_key_returns_200(self, client):
        _register_key("test-key-123", "tenant-acme")
        resp = client.get("/ogc/collections/tenant_acme_uploads/items?api_key=test-key-123")
        assert resp.status_code == 200

    def test_tenant_valid_key_returns_feature_collection(self, client):
        _register_key("key-abc", "tenant-xyz")
        data = client.get("/ogc/collections/tenant_xyz_uploads/items?api_key=key-abc").json()
        assert data["type"] == "FeatureCollection"

    def test_bbox_parameter_parsed(self, client):
        resp = client.get("/ogc/collections/cape_town_zoning/items?bbox=18.4,-34.1,18.6,-33.9")
        assert resp.status_code == 200

    def test_invalid_bbox_returns_400(self, client):
        resp = client.get("/ogc/collections/cape_town_zoning/items?bbox=invalid")
        assert resp.status_code == 400

    def test_bbox_wrong_count_returns_400(self, client):
        resp = client.get("/ogc/collections/cape_town_zoning/items?bbox=18.4,-34.1")
        assert resp.status_code == 400

    def test_limit_parameter(self, client):
        resp = client.get("/ogc/collections/cape_town_zoning/items?limit=50")
        assert resp.status_code == 200

    def test_limit_zero_returns_400(self, client):
        resp = client.get("/ogc/collections/cape_town_zoning/items?limit=0")
        assert resp.status_code == 400

    def test_limit_too_large_returns_400(self, client):
        resp = client.get("/ogc/collections/cape_town_zoning/items?limit=99999")
        assert resp.status_code == 400


# ============================================================
# 6. Single Feature
# ============================================================

class TestOGCSingleFeature:
    """GET /ogc/collections/{id}/items/{fid} returns a single feature."""

    def test_public_feature_returns_404_stub(self, client):
        """Stub returns 404 since no real data — confirms endpoint exists."""
        resp = client.get("/ogc/collections/cape_town_zoning/items/123")
        assert resp.status_code == 404

    def test_invalid_collection_returns_404(self, client):
        resp = client.get("/ogc/collections/nonexistent/items/123")
        assert resp.status_code == 404

    def test_tenant_feature_no_key_returns_401(self, client):
        resp = client.get("/ogc/collections/tenant_acme_uploads/items/123")
        assert resp.status_code == 401

    def test_tenant_feature_valid_key(self, client):
        _register_key("feat-key", "tenant-acme")
        resp = client.get("/ogc/collections/tenant_acme_uploads/items/123?api_key=feat-key")
        # 404 because stub has no real data, but auth passed
        assert resp.status_code == 404


# ============================================================
# 7. WFS GetCapabilities
# ============================================================

class TestWFSCapabilities:
    """GET /ogc/wfs — WFS GetCapabilities with attribution."""

    def test_wfs_returns_200(self, client):
        resp = client.get("/ogc/wfs?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetCapabilities")
        assert resp.status_code == 200

    def test_wfs_has_service_type(self, client):
        data = client.get("/ogc/wfs?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetCapabilities").json()
        assert data["service"] == "WFS"

    def test_wfs_has_attribution(self, client):
        data = client.get("/ogc/wfs?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetCapabilities").json()
        assert "OpenStreetMap" in data["attribution"]
        assert "CARTO" in data["attribution"]

    def test_wfs_has_feature_types(self, client):
        data = client.get("/ogc/wfs?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetCapabilities").json()
        names = [ft["name"] for ft in data["featureTypes"]]
        assert "cape_town_zoning" in names
        assert "cape_town_parcels" in names
        assert len(data["featureTypes"]) == 4

    def test_wfs_feature_types_have_bbox(self, client):
        data = client.get("/ogc/wfs?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetCapabilities").json()
        for ft in data["featureTypes"]:
            assert ft["bbox"] == [18.28, -34.36, 19.02, -33.48]
            assert ft["srs"] == "EPSG:4326"

    def test_wfs_get_feature_request(self, client):
        data = client.get("/ogc/wfs?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature").json()
        assert data["service"] == "WFS"
        assert data["request"] == "GetFeature"


# ============================================================
# 8. WMS GetCapabilities
# ============================================================

class TestWMSCapabilities:
    """GET /ogc/wms — WMS GetCapabilities with attribution."""

    def test_wms_returns_200(self, client):
        resp = client.get("/ogc/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities")
        assert resp.status_code == 200

    def test_wms_has_service_type(self, client):
        data = client.get("/ogc/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities").json()
        assert data["service"] == "WMS"

    def test_wms_has_attribution(self, client):
        data = client.get("/ogc/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities").json()
        assert "OpenStreetMap" in data["attribution"]
        assert "CARTO" in data["attribution"]

    def test_wms_has_layers(self, client):
        data = client.get("/ogc/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities").json()
        names = [l["name"] for l in data["layers"]]
        assert "cape_town_zoning" in names
        assert len(data["layers"]) == 4

    def test_wms_layers_have_bbox(self, client):
        data = client.get("/ogc/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities").json()
        for layer in data["layers"]:
            assert layer["bbox"] == [18.28, -34.36, 19.02, -33.48]

    def test_wms_get_map_request(self, client):
        data = client.get("/ogc/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap").json()
        assert data["service"] == "WMS"
        assert data["request"] == "GetMap"


# ============================================================
# 9. QGIS / ArcGIS Pro Connection URL Verification
# ============================================================

class TestConnectionURLs:
    """Verify WFS/WMS URLs work as documented in QGIS_CONNECTION_GUIDE.md."""

    def test_qgis_wfs_url_format(self, client):
        """QGIS WFS URL format from docs works."""
        resp = client.get("/ogc/wfs?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetCapabilities")
        assert resp.status_code == 200
        data = resp.json()
        assert data["service"] == "WFS"
        assert len(data["featureTypes"]) == 4

    def test_arcgis_wfs_url_format(self, client):
        """ArcGIS Pro WFS URL format from docs works."""
        resp = client.get("/ogc/wfs?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetCapabilities")
        assert resp.status_code == 200

    def test_ogc_api_features_url(self, client):
        """OGC API Features URL for QGIS 3.28+ works."""
        resp = client.get("/ogc/collections")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["collections"]) == 4


# ============================================================
# 10. Cross-Tenant Isolation
# ============================================================

class TestTenantIsolation:
    """Tenant collection access is isolated by API key."""

    def test_tenant_a_key_cannot_access_without_registration(self, client):
        resp = client.get("/ogc/collections/tenant_a_uploads/items?api_key=key-a")
        assert resp.status_code == 401

    def test_different_tenants_get_isolated_access(self, client):
        _register_key("key-a", "tenant-a")
        _register_key("key-b", "tenant-b")
        resp_a = client.get("/ogc/collections/tenant_a_uploads/items?api_key=key-a")
        resp_b = client.get("/ogc/collections/tenant_b_uploads/items?api_key=key-b")
        assert resp_a.status_code == 200
        assert resp_b.status_code == 200

    def test_public_collections_need_no_key(self, client):
        for coll in ["cape_town_zoning", "cape_town_parcels", "cape_town_suburbs", "cape_town_flood_risk"]:
            resp = client.get(f"/ogc/collections/{coll}/items")
            assert resp.status_code == 200, f"Public collection {coll} should not require auth"
