"""
Google Cloud Storage adapter — implements StoragePort for GCS.

Drop-in replacement for R2StorageAdapter. Uses google-cloud-storage SDK.
Bucket must exist (created via infra/gcp/main.tf).

Reference: https://cloud.google.com/storage/docs/reference/libraries#client-libraries-install-python
"""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import Optional

from google.cloud import storage as gcs

from app.core.config import settings
from app.ports.outbound.storage import StoragePort

logger = logging.getLogger(__name__)

# Default presigned URL expiry: 1 hour
DEFAULT_PRESIGNED_EXPIRY = 3600


class GCSStorageAdapter(StoragePort):
    """
    Google Cloud Storage implementation of StoragePort.

    Stores raster files in a GCS bucket (africa-south1 for POPIA compliance).
    Supports COG range reads via public URL and signed URLs for private access.

    Storage routing rule (unchanged from R2):
      files < 50 MB → Supabase Storage
      rasters / large files → GCS (this adapter)
    """

    def __init__(self) -> None:
        self._client = gcs.Client(project=settings.gcs_project_id)
        self._bucket = self._client.bucket(settings.gcs_bucket_name)

    async def upload(
        self,
        key: str,
        data: bytes,
        content_type: str,
        *,
        metadata: Optional[dict] = None,
    ) -> str:
        """
        Upload file bytes to GCS.

        Complexity: O(n) where n = len(data) — network I/O bound.
        Returns: gs:// URI for the uploaded object.
        """
        blob = self._bucket.blob(key)
        blob.content_type = content_type

        # Cache-Control for COG tile caching (CDN + browser)
        if content_type in (
            "image/tiff",
            "application/geo+json",
            "application/octet-stream",
        ):
            blob.cache_control = "public, max-age=86400"

        if metadata:
            blob.metadata = metadata

        blob.upload_from_string(data, content_type=content_type)

        gcs_uri = f"gs://{settings.gcs_bucket_name}/{key}"
        logger.info("Uploaded to GCS: %s (%d bytes)", gcs_uri, len(data))
        return gcs_uri

    async def download(self, key: str) -> bytes:
        """
        Download file bytes from GCS.

        Complexity: O(n) where n = file size — network I/O bound.
        """
        blob = self._bucket.blob(key)
        data = blob.download_as_bytes()
        logger.info("Downloaded from GCS: %s (%d bytes)", key, len(data))
        return data

    async def generate_presigned_url(
        self,
        key: str,
        expiry_seconds: int = DEFAULT_PRESIGNED_EXPIRY,
    ) -> str:
        """
        Generate a signed URL for temporary access to a GCS object.

        Complexity: O(1) — URL generation is constant time.
        """
        blob = self._bucket.blob(key)
        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(seconds=expiry_seconds),
            method="GET",
        )
        logger.info(
            "Generated signed URL for %s (expires in %ds)", key, expiry_seconds
        )
        return url

    async def delete(self, key: str) -> bool:
        """
        Delete object from GCS.

        Complexity: O(1) — single DELETE request.
        Returns: True if deleted, False if not found.
        """
        blob = self._bucket.blob(key)
        if not blob.exists():
            logger.warning("GCS object not found for deletion: %s", key)
            return False

        blob.delete()
        logger.info("Deleted from GCS: %s", key)
        return True

    def get_public_url(self, key: str) -> str:
        """
        Get the public HTTPS URL for a GCS object (for COG range requests).

        The bucket must have public read access (allUsers objectViewer IAM).
        This URL supports HTTP Range headers for COG streaming.
        """
        return (
            f"https://storage.googleapis.com/{settings.gcs_bucket_name}/{key}"
        )
