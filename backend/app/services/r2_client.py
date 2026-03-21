"""
Cloudflare R2 storage client (S3-compatible API).
Handles upload, download, and presigned URL generation for large GIS files.

Reference: https://developers.cloudflare.com/r2/api/s3/api/
"""

import logging
from typing import Optional

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.core.config import settings

logger = logging.getLogger(__name__)

# Default presigned URL expiry: 1 hour
DEFAULT_PRESIGNED_EXPIRY = 3600


def _get_r2_client():
    """Create a boto3 S3 client configured for Cloudflare R2."""
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        config=Config(
            signature_version="s3v4",
            retries={"max_attempts": 3, "mode": "standard"},
        ),
        region_name="auto",
    )


async def upload_to_r2(
    key: str,
    file_bytes: bytes,
    content_type: str = "application/octet-stream",
    metadata: Optional[dict[str, str]] = None,
) -> str:
    """
    Upload a file to Cloudflare R2.

    Args:
        key: Object key (path) in the R2 bucket.
        file_bytes: Raw file bytes to upload.
        content_type: MIME type for the object.
        metadata: Optional metadata dict to attach to the object.

    Returns:
        R2 object URL (r2://{bucket}/{key}).

    Raises:
        ClientError: If the upload fails.
    """
    client = _get_r2_client()
    put_kwargs: dict = {
        "Bucket": settings.r2_bucket_name,
        "Key": key,
        "Body": file_bytes,
        "ContentType": content_type,
    }
    if metadata:
        put_kwargs["Metadata"] = metadata

    try:
        client.put_object(**put_kwargs)
        r2_url = f"r2://{settings.r2_bucket_name}/{key}"
        logger.info("Uploaded to R2: %s (%d bytes)", r2_url, len(file_bytes))
        return r2_url
    except ClientError as exc:
        logger.error("R2 upload failed for key=%s: %s", key, exc)
        raise


async def download_from_r2(key: str) -> bytes:
    """
    Download a file from Cloudflare R2.

    Args:
        key: Object key (path) in the R2 bucket.

    Returns:
        Raw file bytes.

    Raises:
        ClientError: If the download fails or the object does not exist.
    """
    client = _get_r2_client()
    try:
        response = client.get_object(
            Bucket=settings.r2_bucket_name,
            Key=key,
        )
        data = response["Body"].read()
        logger.info("Downloaded from R2: %s (%d bytes)", key, len(data))
        return data
    except ClientError as exc:
        logger.error("R2 download failed for key=%s: %s", key, exc)
        raise


async def generate_presigned_url(
    key: str,
    expiry_seconds: int = DEFAULT_PRESIGNED_EXPIRY,
) -> str:
    """
    Generate a presigned URL for temporary access to an R2 object.

    Args:
        key: Object key (path) in the R2 bucket.
        expiry_seconds: URL validity duration in seconds (default: 3600).

    Returns:
        Presigned HTTPS URL.

    Raises:
        ClientError: If URL generation fails.
    """
    client = _get_r2_client()
    try:
        url = client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.r2_bucket_name,
                "Key": key,
            },
            ExpiresIn=expiry_seconds,
        )
        logger.info("Generated presigned URL for %s (expires in %ds)", key, expiry_seconds)
        return url
    except ClientError as exc:
        logger.error("R2 presigned URL failed for key=%s: %s", key, exc)
        raise


async def delete_from_r2(key: str) -> bool:
    """
    Delete an object from Cloudflare R2.

    Args:
        key: Object key (path) in the R2 bucket.

    Returns:
        True if deletion succeeded.
    """
    client = _get_r2_client()
    try:
        client.delete_object(
            Bucket=settings.r2_bucket_name,
            Key=key,
        )
        logger.info("Deleted from R2: %s", key)
        return True
    except ClientError as exc:
        logger.error("R2 delete failed for key=%s: %s", key, exc)
        raise
