import os
import glob
import pystac
from pystac.extensions.eo import EOExtension
from riostac.stac import create_stac_item
import datetime
import re
import json

def extract_datetime(filename):
    """Try to extract a datetime from the filename (e.g., 2024-01)"""
    match = re.search(r'(\d{4}-\d{2})', filename)
    if match:
        return datetime.datetime.strptime(match.group(1), '%Y-%m').replace(tzinfo=datetime.timezone.utc)
    return datetime.datetime.now(datetime.timezone.utc)

def generate_catalog(input_dir, output_dir, bucket_name):
    """Generate STAC catalog from COGs"""
    catalog = pystac.Catalog(
        id='cape-town-rasters',
        description='Cape Town Raster Assets',
        title='Cape Town STAC Catalog'
    )

    cog_files = glob.glob(os.path.join(input_dir, '**/*.tif'), recursive=True)

    for i, filepath in enumerate(cog_files):
        filename = os.path.basename(filepath)
        dt = extract_datetime(filename)
        id_str = f"cct-raster-{dt.strftime('%Y-%m')}-{i}"

        # Create STAC Item using rio-stac (which reads the COG)
        item = create_stac_item(
            filepath,
            id=id_str,
            datetime=dt,
            with_eo=True
        )

        # Update Asset Href to point to the cloud bucket
        for asset_key, asset in item.assets.items():
            base_rel = os.path.relpath(filepath, input_dir)
            asset.href = f"gs://{bucket_name}/{base_rel}"
            asset.media_type = pystac.MediaType.COG

        catalog.add_item(item)

    # Normalize and save catalog
    catalog.normalize_and_save(root_href=output_dir, catalog_type=pystac.CatalogType.SELF_CONTAINED)
    print(f"STAC Catalog generated at {output_dir}")

if __name__ == '__main__':
    # Config
    BUCKET = os.getenv('CLOUD_BUCKET', 'my-cape-town-rasters-bucket')
    IN_DIR = './data/cogs'       # Local copies or mounted bucket
    OUT_DIR = './stac_outputs'   # Output JSON destination

    os.makedirs(OUT_DIR, exist_ok=True)
    generate_catalog(IN_DIR, OUT_DIR, BUCKET)
