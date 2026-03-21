"""
GIS layer entity — represents an ingested geospatial dataset.

Pattern: Entity (DDD) — identity by layer_id, format tracked via enum.
"""

from __future__ import annotations

import enum
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional


class LayerFormat(str, enum.Enum):
    """Supported GIS import/export formats — Strategy key for processor dispatch."""

    GEOJSON = "geojson"
    SHAPEFILE = "shapefile"
    GEOPACKAGE = "gpkg"
    KML = "kml"
    KMZ = "kmz"
    CSV_LATLON = "csv"
    GEOTIFF = "geotiff"
    DXF = "dxf"
    FILE_GDB = "gdb"
    LAS = "las"
    LAZ = "laz"
    ARCGIS_REST = "arcgis_rest"
    COG = "cog"
    PMTILES = "pmtiles"


# Formats requiring special handling — O(1) lookup via frozenset
RASTER_FORMATS = frozenset(
    {LayerFormat.GEOTIFF, LayerFormat.COG, LayerFormat.LAS, LayerFormat.LAZ}
)
CRS_PROMPT_REQUIRED = frozenset({LayerFormat.DXF})
BUNDLE_FORMATS = frozenset({LayerFormat.SHAPEFILE})


@dataclass(slots=True)
class GISLayer:
    """
    Ingested geospatial layer with provenance metadata.

    Identity: layer_id (UUID).
    Invariant: tenant_id immutable (multi-tenant isolation).
    """

    layer_id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    format: LayerFormat
    crs: str = "EPSG:4326"
    storage_location: str = "supabase"
    storage_key: Optional[str] = None
    feature_count: int = 0
    source: str = "upload"
    vintage: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def is_raster(self) -> bool:
        """O(1) — check via frozenset membership."""
        return self.format in RASTER_FORMATS

    @property
    def requires_crs_prompt(self) -> bool:
        """O(1) — DXF files have no CRS metadata (GOTCHA-PY-004)."""
        return self.format in CRS_PROMPT_REQUIRED

    def to_dict(self) -> dict:
        """Serialize for API response."""
        return {
            "layer_id": str(self.layer_id),
            "tenant_id": str(self.tenant_id),
            "name": self.name,
            "format": self.format.value,
            "crs": self.crs,
            "storage_location": self.storage_location,
            "feature_count": self.feature_count,
            "source": self.source,
            "vintage": self.vintage,
            "created_at": self.created_at.isoformat(),
        }
