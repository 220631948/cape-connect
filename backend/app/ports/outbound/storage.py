"""
Storage port — abstract interface for object storage (R2, Supabase Storage).

Pattern: Port (Hexagonal) + Strategy (GoF) — storage destination selected at runtime.
Ref: Cloudflare R2 S3 API — https://developers.cloudflare.com/r2/api/s3/api/
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional


class StoragePort(ABC):
    """
    Abstract interface for object storage operations.

    Implementations:
      - R2StorageAdapter: Cloudflare R2 (rasters, models, files >50MB)
      - SupabaseStorageAdapter: Supabase Storage (files <50MB)
      - InMemoryStorageAdapter: testing

    Storage routing rule: files <50MB → Supabase, rasters/large → R2.
    """

    @abstractmethod
    async def upload(
        self,
        key: str,
        data: bytes,
        content_type: str,
        *,
        metadata: Optional[dict] = None,
    ) -> str:
        """
        Upload file bytes to storage.

        Complexity: O(n) where n = len(data) — network I/O bound.
        Returns: storage URL or key.
        """

    @abstractmethod
    async def download(self, key: str) -> bytes:
        """
        Download file bytes from storage.

        Complexity: O(n) where n = file size — network I/O bound.
        """

    @abstractmethod
    async def generate_presigned_url(
        self,
        key: str,
        expiry_seconds: int = 3600,
    ) -> str:
        """
        Generate time-limited access URL.

        Complexity: O(1) — URL generation is constant time.
        """

    @abstractmethod
    async def delete(self, key: str) -> bool:
        """
        Delete object from storage.

        Complexity: O(1) — single DELETE request.
        Returns: True if deleted, False if not found.
        """
