"""
Bounding box value object — immutable geographic extent.

All coordinates in EPSG:4326 (WGS 84).
Cape Town metro bbox is the canonical constraint for all spatial queries.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


# Cape Town metro bounding box — locked decision (CLAUDE.md Rule 9)
CT_WEST = 18.28
CT_SOUTH = -34.36
CT_EAST = 19.02
CT_NORTH = -33.48


@dataclass(frozen=True, slots=True)
class BoundingBox:
    """
    Immutable bounding box in EPSG:4326.

    Complexity: All operations are O(1) — constant-time coordinate comparisons.
    """

    west: float
    south: float
    east: float
    north: float

    def __post_init__(self) -> None:
        if self.west >= self.east:
            raise ValueError(f"west ({self.west}) must be < east ({self.east})")
        if self.south >= self.north:
            raise ValueError(f"south ({self.south}) must be < north ({self.north})")

    def contains_point(self, lng: float, lat: float) -> bool:
        """O(1) — check if a point falls within this bbox."""
        return (self.west <= lng <= self.east) and (self.south <= lat <= self.north)

    def intersects(self, other: BoundingBox) -> bool:
        """O(1) — check if two bboxes overlap."""
        return not (
            self.east < other.west
            or self.west > other.east
            or self.north < other.south
            or self.south > other.north
        )

    def clip_to(self, constraint: BoundingBox) -> BoundingBox:
        """O(1) — clip this bbox to fit within constraint."""
        return BoundingBox(
            west=max(self.west, constraint.west),
            south=max(self.south, constraint.south),
            east=min(self.east, constraint.east),
            north=min(self.north, constraint.north),
        )

    def to_dict(self) -> dict:
        """Serialize to dict for API responses."""
        return {
            "west": self.west,
            "south": self.south,
            "east": self.east,
            "north": self.north,
        }

    @classmethod
    def cape_town(cls) -> BoundingBox:
        """Factory — canonical Cape Town metro bbox."""
        return cls(west=CT_WEST, south=CT_SOUTH, east=CT_EAST, north=CT_NORTH)

    @classmethod
    def from_geojson_coords(cls, coords: list) -> Optional[BoundingBox]:
        """
        Derive bbox from nested GeoJSON coordinate arrays.

        Complexity: O(n) where n = total number of coordinate pairs.
        Flattens arbitrarily nested arrays via iterative stack (avoids recursion
        depth issues with complex geometries).
        """
        # Iterative flattening — O(n) time, O(d) stack space where d = nesting depth
        stack = [coords]
        lngs: list[float] = []
        lats: list[float] = []
        while stack:
            item = stack.pop()
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                if isinstance(item[0], (int, float)):
                    lngs.append(float(item[0]))
                    lats.append(float(item[1]))
                else:
                    stack.extend(item)
        if not lngs:
            return None
        return cls(
            west=min(lngs),
            south=min(lats),
            east=max(lngs),
            north=max(lats),
        )
