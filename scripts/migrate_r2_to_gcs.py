#!/usr/bin/env python3
"""
R2 → GCS Migration Script

Migrates raster files from Cloudflare R2 to Google Cloud Storage.
Converts non-COG GeoTIFFs to COG during migration and generates STAC items.

Prerequisites:
  pip install boto3 google-cloud-storage rasterio rio-cogeo pystac rio-stac

Usage:
  export R2_ACCOUNT_ID=xxx
  export R2_ACCESS_KEY_ID=xxx
  export R2_SECRET_ACCESS_KEY=xxx
  export GCS_BUCKET=capegis-rasters
  export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

  python scripts/migrate_r2_to_gcs.py [--dry-run] [--prefix cog/]

Reference: docs/research/GCP_MIGRATION_PLAN.md — Section 2b
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import tempfile
from pathlib import Path

import boto3
from botocore.config import Config
from google.cloud import storage as gcs

logger = logging.getLogger(__name__)

# ─── Configuration ────────────────────────────────────────────────────────────

R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET = os.environ.get("R2_BUCKET", "capegis-rasters")

GCS_BUCKET = os.environ.get("GCS_BUCKET", "capegis-rasters")
GCS_COG_PREFIX = "cog/"
GCS_STAC_PREFIX = "stac/"


# ─── Clients ──────────────────────────────────────────────────────────────────


def get_r2_client():
    """Create boto3 S3 client for Cloudflare R2."""
    return boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def get_gcs_bucket():
    """Get GCS bucket object."""
    client = gcs.Client()
    return client.bucket(GCS_BUCKET)


# ─── COG Conversion ──────────────────────────────────────────────────────────


def is_cog(filepath: str) -> bool:
    """Check if a GeoTIFF is already a valid COG."""
    try:
        from rio_cogeo.cogeo import cog_validate

        is_valid, _, _ = cog_validate(filepath)
        return is_valid
    except ImportError:
        logger.warning("rio-cogeo not installed; skipping COG validation")
        return False
    except Exception:
        return False


def convert_to_cog(input_path: str, output_path: str) -> bool:
    """Convert a GeoTIFF to Cloud Optimized GeoTIFF."""
    try:
        from rio_cogeo.cogeo import cog_translate
        from rio_cogeo.profiles import cog_profiles

        output_profile = cog_profiles.get("deflate")
        cog_translate(
            input_path,
            output_path,
            output_profile,
            overview_level=5,
            overview_resampling="nearest",
            web_optimized=True,
        )
        logger.info("Converted to COG: %s → %s", input_path, output_path)
        return True
    except ImportError:
        logger.error("rio-cogeo not installed; cannot convert to COG")
        return False
    except Exception as exc:
        logger.error("COG conversion failed: %s", exc)
        return False


# ─── STAC Item Generation ────────────────────────────────────────────────────


def generate_stac_item(cog_path: str, gcs_key: str) -> dict | None:
    """Generate a STAC item for a COG raster."""
    try:
        import pystac
        from rio_stac import create_stac_item

        item = create_stac_item(
            source=cog_path,
            input_datetime=None,  # Will use file metadata or current time
            asset_name="data",
            asset_href=f"https://storage.googleapis.com/{GCS_BUCKET}/{gcs_key}",
            asset_media_type=pystac.MediaType.COG,
            with_proj=True,
            with_raster=True,
        )
        return item.to_dict()
    except ImportError:
        logger.warning("rio-stac/pystac not installed; skipping STAC generation")
        return None
    except Exception as exc:
        logger.warning("STAC generation failed for %s: %s", gcs_key, exc)
        return None


# ─── Migration Logic ─────────────────────────────────────────────────────────


def list_r2_objects(r2_client, prefix: str = "") -> list[dict]:
    """List all objects in the R2 bucket."""
    objects = []
    paginator = r2_client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=R2_BUCKET, Prefix=prefix):
        for obj in page.get("Contents", []):
            objects.append(obj)
    return objects


def migrate_object(
    r2_client,
    gcs_bucket,
    r2_key: str,
    r2_size: int,
    dry_run: bool = False,
) -> bool:
    """
    Migrate a single object from R2 to GCS.

    Steps:
      1. Check if already exists in GCS (idempotent)
      2. Download from R2 to temp file
      3. If GeoTIFF and not COG, convert to COG
      4. Upload to GCS with proper content type and cache headers
      5. Generate STAC item and upload to stac/ prefix
    """
    # Determine GCS key
    gcs_key = f"{GCS_COG_PREFIX}{r2_key}"

    # Step 1: Idempotency check
    blob = gcs_bucket.blob(gcs_key)
    if blob.exists():
        logger.info("SKIP (already exists): %s", gcs_key)
        return True

    if dry_run:
        logger.info("DRY RUN — would migrate: %s → %s (%d bytes)", r2_key, gcs_key, r2_size)
        return True

    with tempfile.TemporaryDirectory() as tmpdir:
        # Step 2: Download from R2
        local_path = os.path.join(tmpdir, os.path.basename(r2_key))
        logger.info("Downloading from R2: %s (%d bytes)", r2_key, r2_size)
        r2_client.download_file(R2_BUCKET, r2_key, local_path)

        # Step 3: COG conversion for GeoTIFFs
        upload_path = local_path
        is_tiff = r2_key.lower().endswith((".tif", ".tiff", ".geotiff"))

        if is_tiff:
            if is_cog(local_path):
                logger.info("Already a valid COG: %s", r2_key)
            else:
                cog_path = os.path.join(tmpdir, "cog_" + os.path.basename(r2_key))
                if convert_to_cog(local_path, cog_path):
                    upload_path = cog_path
                else:
                    logger.warning("COG conversion failed; uploading original: %s", r2_key)

        # Step 4: Upload to GCS
        content_type = "image/tiff" if is_tiff else "application/octet-stream"
        blob = gcs_bucket.blob(gcs_key)
        blob.content_type = content_type
        blob.cache_control = "public, max-age=86400"
        blob.upload_from_filename(upload_path)
        logger.info("Uploaded to GCS: %s (%s)", gcs_key, content_type)

        # Step 5: Generate STAC item
        if is_tiff:
            stac_item = generate_stac_item(upload_path, gcs_key)
            if stac_item:
                stac_key = f"{GCS_STAC_PREFIX}{Path(r2_key).stem}.json"
                stac_blob = gcs_bucket.blob(stac_key)
                stac_blob.upload_from_string(
                    json.dumps(stac_item, indent=2),
                    content_type="application/json",
                )
                logger.info("STAC item created: %s", stac_key)

    return True


def run_migration(prefix: str = "", dry_run: bool = False) -> None:
    """Run the full R2 → GCS migration."""
    r2_client = get_r2_client()
    gcs_bucket = get_gcs_bucket()

    logger.info("Listing R2 objects (prefix=%r)...", prefix)
    objects = list_r2_objects(r2_client, prefix=prefix)
    logger.info("Found %d objects in R2 bucket %s", len(objects), R2_BUCKET)

    migrated = 0
    skipped = 0
    failed = 0

    for obj in objects:
        key = obj["Key"]
        size = obj.get("Size", 0)

        try:
            if migrate_object(r2_client, gcs_bucket, key, size, dry_run=dry_run):
                migrated += 1
            else:
                failed += 1
        except Exception as exc:
            logger.error("FAILED to migrate %s: %s", key, exc)
            failed += 1

    logger.info(
        "Migration complete: %d migrated, %d skipped, %d failed (total: %d)",
        migrated,
        skipped,
        failed,
        len(objects),
    )


# ─── CLI ──────────────────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Migrate raster files from Cloudflare R2 to Google Cloud Storage"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List files to migrate without actually migrating",
    )
    parser.add_argument(
        "--prefix",
        default="",
        help="R2 key prefix to filter objects (e.g., 'rasters/')",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose logging",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)-8s %(message)s",
    )

    # Validate environment
    missing = []
    if not R2_ACCOUNT_ID:
        missing.append("R2_ACCOUNT_ID")
    if not R2_ACCESS_KEY_ID:
        missing.append("R2_ACCESS_KEY_ID")
    if not R2_SECRET_ACCESS_KEY:
        missing.append("R2_SECRET_ACCESS_KEY")
    if missing:
        logger.error("Missing required environment variables: %s", ", ".join(missing))
        raise SystemExit(1)

    run_migration(prefix=args.prefix, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
