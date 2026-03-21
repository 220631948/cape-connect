"""Domain value objects — immutable, equality by value."""

from app.domain.value_objects.bbox import BoundingBox
from app.domain.value_objects.score import SuitabilityScore, SuitabilityVerdict
from app.domain.value_objects.geometry import GeoJSONGeometry

__all__ = [
    "BoundingBox",
    "SuitabilityScore",
    "SuitabilityVerdict",
    "GeoJSONGeometry",
]
