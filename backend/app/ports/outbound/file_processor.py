"""
File processor port — abstract interface for GIS format ingestion/export.

Pattern: Port (Hexagonal) + Strategy (GoF) — format-specific processing.
Each format has its own adapter; the port defines the common contract.

Locked decisions:
  - DXF: MUST prompt for CRS, never assume (GOTCHA-PY-004)
  - Shapefile: accept .zip only with .shp/.dbf/.prj/.shx (GOTCHA-PY-003)
  - All GeoPandas ops: asyncio.run_in_executor (GOTCHA-PY-005)
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from app.domain.entities.layer import LayerFormat


class FileProcessorPort(ABC):
    """
    Abstract interface for GIS file ingestion and export.

    Strategy pattern: dispatch to format-specific implementations.
    """

    @abstractmethod
    async def ingest(
        self,
        file_bytes: bytes,
        filename: str,
        format: LayerFormat,
        tenant_id: str,
        *,
        crs: Optional[str] = None,
        popia_consent: bool = False,
    ) -> dict:
        """
        Ingest a GIS file → validate → reproject to EPSG:4326 → store.

        Complexity: O(n) where n = features/pixels in file.
        All blocking I/O MUST run in executor (GOTCHA-PY-005).
        Returns: ingestion result with layer_id and feature count.
        """

    @abstractmethod
    async def export(
        self,
        layer_id: str,
        format: LayerFormat,
        tenant_id: str,
    ) -> bytes:
        """
        Export stored layer to requested format.

        Complexity: O(n) where n = features in layer.
        Returns: file bytes in requested format.
        """

    @abstractmethod
    def detect_format(self, file_bytes: bytes, filename: str) -> LayerFormat:
        """
        Detect GIS format from file magic bytes and extension.

        Complexity: O(1) — reads only first few bytes + extension check.
        Uses python-magic for MIME detection + extension fallback.
        """
