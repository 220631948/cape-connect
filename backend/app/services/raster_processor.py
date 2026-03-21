"""
Cloud Run Raster Processor — COG conversion + STAC indexing handler.

Triggered by GCS Eventarc (object.finalize) when a new raster is uploaded.
Converts raw GeoTIFF to COG, generates STAC item, and uploads both to GCS.

Deployed via: backend/Dockerfile.raster → Cloud Run (capegis-raster-processor)
Reference: docs/research/GCP_MIGRATION_PLAN.md — Section 3
"""

from __future__ import annotations

import json
import logging
import os
import re
import tempfile
from pathlib import Path

from fastapi import FastAPI, Request, Response

logger = logging.getLogger(__name__)

app = FastAPI(
    title="CapeTown GIS Hub — Raster Processor",
    description="COG conversion and STAC indexing for GCS rasters",
    version="0.1.0",
)

# ─── Configuration ────────────────────────────────────────────────────────────

GCS_BUCKET = os.environ.get("GCS_BUCKET", "capegis-rasters")
COG_PREFIX = "cog/"
STAC_PREFIX = "stac/"
RAW_PREFIX = "raw/"

# Skip processing for files already in cog/ or stac/ prefixes (prevent loops)
SKIP_PREFIXES = (COG_PREFIX, STAC_PREFIX)


# ─── Health Check ─────────────────────────────────────────────────────────────


@app.get("/health")
async def health():
    """Health check for Cloud Run."""
    return {"status": "healthy", "service": "capegis-raster-processor"}


# ─── Eventarc Handler ─────────────────────────────────────────────────────────


@app.post("/process")
async def process_raster(request: Request):
    """
    Process a newly uploaded raster file.

    Triggered by Eventarc on GCS object.finalize events.
    Converts raw GeoTIFF → COG, generates STAC item, uploads both.
    """
    try:
        body = await request.json()
    except Exception:
        return Response(content="Invalid JSON body", status_code=400)

    # Extract object info from Eventarc CloudEvent payload
    # Eventarc wraps the GCS notification in a CloudEvent envelope
    bucket = body.get("bucket", "")
    name = body.get("name", "")

    if not name:
        # Try CloudEvent data structure
        data = body.get("data", {})
        bucket = data.get("bucket", bucket)
        name = data.get("name", name)

    if not name:
        logger.warning("No object name in event payload")
        return {"status": "skipped", "reason": "no object name"}

    # Skip files already in processed prefixes (prevent infinite loops)
    if any(name.startswith(prefix) for prefix in SKIP_PREFIXES):
        logger.info("Skipping already-processed file: %s", name)
        return {"status": "skipped", "reason": "already in processed prefix"}

    # Only process GeoTIFF files
    if not name.lower().endswith((".tif", ".tiff", ".geotiff")):
        logger.info("Skipping non-GeoTIFF file: %s", name)
        return {"status": "skipped", "reason": "not a GeoTIFF"}

    logger.info("Processing raster: gs://%s/%s", bucket, name)

    try:
        result = await _process_geotiff(bucket, name)
        return {"status": "success", **result}
    except Exception as exc:
        logger.error("Failed to process %s: %s", name, exc, exc_info=True)
        return Response(
            content=json.dumps(
                {
                    "status": "error",
                    "error": "Internal server error while processing raster.",
                }
            ),
            status_code=500,
            media_type="application/json",
        )


async def _process_geotiff(bucket: str, object_name: str) -> dict:
    """
    Download GeoTIFF from GCS, convert to COG, generate STAC, upload both.

    Returns dict with cog_key, stac_key, and processing metadata.
    """
    from google.cloud import storage as gcs

    client = gcs.Client()
    gcs_bucket = client.bucket(bucket)

    with tempfile.TemporaryDirectory() as tmpdir:
        # Derive a safe local filename from the GCS object name
        raw_basename = os.path.basename(object_name)
        safe_basename = re.sub(r"[^A-Za-z0-9._-]", "_", raw_basename)
        if not safe_basename:
            safe_basename = "raster.tif"

        # Step 1: Download raw GeoTIFF
        local_raw = os.path.join(tmpdir, safe_basename)
        blob = gcs_bucket.blob(object_name)
        blob.download_to_filename(local_raw)
        raw_size = os.path.getsize(local_raw)
        logger.info("Downloaded: %s (%d bytes)", object_name, raw_size)

        # Step 2: Check if already COG
        if _is_cog(local_raw):
            logger.info("Already a valid COG: %s", object_name)
            cog_path = local_raw
            was_converted = False
        else:
            # Step 3: Convert to COG
            cog_path = os.path.join(tmpdir, "cog_" + safe_basename)
            _convert_to_cog(local_raw, cog_path)
            was_converted = True

        cog_size = os.path.getsize(cog_path)

        # Step 4: Upload COG to cog/ prefix
        cog_key = f"{COG_PREFIX}{object_name}"
        cog_blob = gcs_bucket.blob(cog_key)
        cog_blob.content_type = "image/tiff"
        cog_blob.cache_control = "public, max-age=86400"
        cog_blob.upload_from_filename(cog_path)
        logger.info("Uploaded COG: %s (%d bytes)", cog_key, cog_size)

        # Step 5: Generate STAC item
        stac_item = _generate_stac_item(cog_path, cog_key)
        stac_key = None
        if stac_item:
            stem = Path(object_name).stem
            stac_key = f"{STAC_PREFIX}{stem}.json"
            stac_blob = gcs_bucket.blob(stac_key)
            stac_blob.upload_from_string(
                json.dumps(stac_item, indent=2),
                content_type="application/json",
            )
            logger.info("STAC item created: %s", stac_key)

    return {
        "cog_key": cog_key,
        "stac_key": stac_key,
        "raw_size_bytes": raw_size,
        "cog_size_bytes": cog_size,
        "was_converted": was_converted,
    }


# ─── COG Utilities ────────────────────────────────────────────────────────────


def _is_cog(filepath: str) -> bool:
    """Check if a GeoTIFF is already a valid COG."""
    try:
        from rio_cogeo.cogeo import cog_validate

        is_valid, _, _ = cog_validate(filepath)
        return is_valid
    except Exception:
        return False


def _convert_to_cog(input_path: str, output_path: str) -> None:
    """Convert GeoTIFF to COG using rio-cogeo."""
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
    logger.info("COG conversion complete: %s → %s", input_path, output_path)


def _generate_stac_item(cog_path: str, gcs_key: str) -> dict | None:
    """Generate a STAC item for a COG."""
    try:
        import pystac
        from rio_stac import create_stac_item

        item = create_stac_item(
            source=cog_path,
            input_datetime=None,
            asset_name="data",
            asset_href=f"https://storage.googleapis.com/{GCS_BUCKET}/{gcs_key}",
            asset_media_type=pystac.MediaType.COG,
            with_proj=True,
            with_raster=True,
        )
        return item.to_dict()
    except Exception as exc:
        logger.warning("STAC generation failed: %s", exc)
        return None


# ─── Optional: On-demand tile endpoint ────────────────────────────────────────


@app.get("/tile/{z}/{x}/{y}.png")
async def get_tile(z: int, x: int, y: int, url: str = ""):
    """
    On-demand raster tile generation from a COG URL.

    Uses rio-tiler to read a specific tile from a COG via HTTP range requests.
    Query param `url` should be the full GCS public URL of the COG.

    Example: /tile/10/550/340.png?url=https://storage.googleapis.com/capegis-rasters/cog/dem.tif
    """
    if not url:
        return Response(content="Missing 'url' query parameter", status_code=400)

    try:
        from rio_tiler.io import Reader

        with Reader(url) as src:
            img = src.tile(x, y, z)
            content = img.render(img_format="PNG")

        return Response(
            content=content,
            media_type="image/png",
            headers={
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*",
            },
        )
    except Exception as exc:
        logger.error("Tile generation failed: %s", exc)
        return Response(
            content=json.dumps({"error": str(exc)}),
            status_code=500,
            media_type="application/json",
        )
