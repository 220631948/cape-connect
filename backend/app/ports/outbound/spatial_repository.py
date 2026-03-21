"""
Spatial repository port — abstract interface for PostGIS data access.

Pattern: Repository (DDD) + Port (Hexagonal).
All implementations MUST use geography cast for metre-based distances (GOTCHA-DB-003).
All implementations MUST enforce tenant_id isolation.
"""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from typing import Optional

from app.domain.value_objects.bbox import BoundingBox


class SpatialRepositoryPort(ABC):
    """
    Abstract interface for spatial data persistence.

    Implementations: PostGIS via GeoAlchemy2 (primary), in-memory (testing).
    All queries are parameterized — no raw SQL strings (Ralph flag).
    """

    @abstractmethod
    async def query_within_bbox(
        self,
        layer_name: str,
        bbox: BoundingBox,
        tenant_id: uuid.UUID,
        *,
        limit: int = 1000,
    ) -> dict:
        """
        Query features within bounding box.

        Complexity: O(log n + k) where n = total features, k = results
        (assumes PostGIS spatial index via GiST).

        Returns: GeoJSON FeatureCollection dict.
        """

    @abstractmethod
    async def query_buffer(
        self,
        point_geojson: dict,
        radius_metres: float,
        layer_name: str,
        tenant_id: uuid.UUID,
    ) -> dict:
        """
        Buffer query — find features within radius of a point.

        MUST use ST_DWithin with geography cast for metre accuracy (GOTCHA-DB-003).
        Complexity: O(log n + k) with spatial index.
        """

    @abstractmethod
    async def calculate_distance(
        self,
        geom_a_geojson: str,
        layer_name: str,
        tenant_id: uuid.UUID,
    ) -> Optional[float]:
        """
        Minimum distance in metres from geometry to nearest feature in layer.

        MUST cast to geography for metre result.
        Complexity: O(log n) with spatial index (KNN query).
        """

    @abstractmethod
    async def intersection_query(
        self,
        polygon_geojson: dict,
        layer_name: str,
        tenant_id: uuid.UUID,
    ) -> dict:
        """
        Find features intersecting a polygon.

        Complexity: O(log n + k) with spatial index.
        Returns: GeoJSON FeatureCollection.
        """

    @abstractmethod
    async def get_suburb_stats(
        self,
        suburb_name: str,
        tenant_id: uuid.UUID,
    ) -> Optional[dict]:
        """
        Aggregate statistics for a suburb.

        Complexity: O(m) where m = features in suburb (aggregate scan).
        """

    @abstractmethod
    async def store_features(
        self,
        layer_name: str,
        features: list[dict],
        tenant_id: uuid.UUID,
        *,
        srid: int = 4326,
    ) -> int:
        """
        Bulk insert GeoJSON features into PostGIS.

        Complexity: O(n) where n = number of features.
        Returns: count of inserted features.
        """
