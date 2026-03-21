"""
ArcGIS port — abstract interface for ArcGIS REST service access.

Pattern: Port (Hexagonal) — decouples domain from external ArcGIS API.
Three-tier fallback: LIVE → CACHED → MOCK (CLAUDE.md Rule 2).
Ref: https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer/
"""

from __future__ import annotations

import enum
from abc import ABC, abstractmethod
from typing import Optional

from app.domain.value_objects.bbox import BoundingBox


class DataSource(str, enum.Enum):
    """Data freshness indicator — CLAUDE.md Rule 1 badge."""

    LIVE = "LIVE"
    CACHED = "CACHED"
    MOCK = "MOCK"


class ArcGISPort(ABC):
    """
    Abstract interface for ArcGIS REST service queries.

    Implementations:
      - ArcGISClientAdapter: real HTTP client with cache fallback
      - MockArcGISAdapter: testing with deterministic responses
    """

    @abstractmethod
    async def enumerate_services(self, base_url: str) -> dict:
        """
        List available layers from ArcGIS service directory.

        Complexity: O(s) where s = number of services (single HTTP request + parse).
        """

    @abstractmethod
    async def query_layer(
        self,
        layer_url: str,
        bbox: Optional[BoundingBox] = None,
        where_clause: str = "1=1",
    ) -> dict:
        """
        Query features from a single ArcGIS layer.

        esriJSON response MUST be converted to GeoJSON (GOTCHA-DATA-002).
        Complexity: O(k) where k = returned features (network + conversion).
        """

    @abstractmethod
    async def query_with_fallback(
        self,
        layer_key: str,
        bbox: Optional[BoundingBox] = None,
    ) -> tuple[dict, DataSource]:
        """
        Query with three-tier fallback: LIVE → CACHED → MOCK.

        Returns: (GeoJSON FeatureCollection, source indicator).
        Complexity: O(k) per tier attempt.
        """

    @abstractmethod
    def get_available_layers(self) -> dict[str, dict]:
        """
        Return registry of known layers with metadata.

        Complexity: O(1) — returns pre-built dict.
        """
