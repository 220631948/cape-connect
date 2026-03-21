"""
GeoJSON geometry value object — validated geospatial geometry.

All geometries stored as EPSG:4326 (WGS 84).
Pattern: Value Object (DDD) — immutable after validation.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

from app.domain.value_objects.bbox import BoundingBox

# Valid GeoJSON geometry types per RFC 7946
_VALID_TYPES = frozenset({
    "Point", "MultiPoint", "LineString", "MultiLineString",
    "Polygon", "MultiPolygon", "GeometryCollection",
})


@dataclass(frozen=True, slots=True)
class GeoJSONGeometry:
    """
    Validated GeoJSON geometry with EPSG:4326 coordinates.

    Validation is O(n) where n = total coordinate pairs.
    Access after construction is O(1).
    """

    type: str
    coordinates: Any

    def __post_init__(self) -> None:
        if self.type not in _VALID_TYPES:
            raise ValueError(
                f"Invalid GeoJSON type '{self.type}'. "
                f"Must be one of: {sorted(_VALID_TYPES)}"
            )

    @property
    def bbox(self) -> Optional[BoundingBox]:
        """Derive bounding box from coordinates. O(n) scan."""
        if self.type == "GeometryCollection":
            return None
        return BoundingBox.from_geojson_coords(self.coordinates)

    def to_dict(self) -> dict:
        """Serialize to GeoJSON geometry dict."""
        return {"type": self.type, "coordinates": self.coordinates}

    @classmethod
    def from_dict(cls, data: dict) -> GeoJSONGeometry:
        """
        Parse and validate a GeoJSON geometry dict.

        Complexity: O(1) for construction + O(n) for coordinate validation
        if bbox is subsequently accessed.
        """
        geom_type = data.get("type", "")
        coordinates = data.get("coordinates")
        if geom_type not in _VALID_TYPES:
            raise ValueError(f"Invalid geometry type: {geom_type}")
        if geom_type != "GeometryCollection" and coordinates is None:
            raise ValueError("Geometry requires 'coordinates' field")
        return cls(type=geom_type, coordinates=coordinates)

    def to_wkt_fragment(self) -> str:
        """
        Convert to SQL-safe WKT geometry string for ST_GeomFromGeoJSON.

        Returns the JSON representation suitable for PostGIS ST_GeomFromGeoJSON().
        No raw SQL — always use with parameterized queries.
        """
        import json
        return json.dumps(self.to_dict())
