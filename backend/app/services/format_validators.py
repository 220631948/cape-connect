"""
GIS file format validation utilities.
Detects file formats, validates shapefile bundles, checks CRS,
and enforces Cape Town bounding box constraints.

References:
- PYTHON_BACKEND_ARCHITECTURE.md Section 5 (format matrix)
- GOTCHA-PY-003: Shapefile must contain .shp+.dbf+.prj+.shx
- GOTCHA-PY-004: Never assume CRS for DXF files
"""

import enum
import io
import zipfile
from typing import Optional

try:
    import magic
except ImportError:
    magic = None  # type: ignore[assignment]

# --- Cape Town bounding box (EPSG:4326) ---
CAPE_TOWN_BBOX = {
    "min_lon": 18.28,
    "max_lon": 19.02,
    "min_lat": -34.36,
    "max_lat": -33.48,
}

# Required components for a valid Shapefile bundle
SHAPEFILE_REQUIRED_EXTENSIONS = {".shp", ".dbf", ".prj", ".shx"}


class GISFormat(str, enum.Enum):
    """Supported GIS file formats for import."""

    GEOJSON = "geojson"
    SHAPEFILE = "shapefile"
    GEOPACKAGE = "geopackage"
    KML = "kml"
    KMZ = "kmz"
    CSV = "csv"
    GEOTIFF = "geotiff"
    DXF = "dxf"
    FILEGDB = "filegdb"
    LAS = "las"
    LAZ = "laz"
    UNKNOWN = "unknown"


# MIME type to format mapping
_MIME_MAP: dict[str, GISFormat] = {
    "application/geo+json": GISFormat.GEOJSON,
    "application/json": GISFormat.GEOJSON,
    "application/zip": GISFormat.SHAPEFILE,  # refined by extension check
    "application/x-zip-compressed": GISFormat.SHAPEFILE,
    "application/geopackage+sqlite3": GISFormat.GEOPACKAGE,
    "application/x-sqlite3": GISFormat.GEOPACKAGE,
    "application/vnd.google-earth.kml+xml": GISFormat.KML,
    "application/vnd.google-earth.kmz": GISFormat.KMZ,
    "text/csv": GISFormat.CSV,
    "text/plain": GISFormat.CSV,
    "image/tiff": GISFormat.GEOTIFF,
    "application/octet-stream": GISFormat.UNKNOWN,
}

# Extension to format mapping (fallback)
_EXT_MAP: dict[str, GISFormat] = {
    ".geojson": GISFormat.GEOJSON,
    ".json": GISFormat.GEOJSON,
    ".shp": GISFormat.SHAPEFILE,
    ".zip": GISFormat.SHAPEFILE,
    ".gpkg": GISFormat.GEOPACKAGE,
    ".kml": GISFormat.KML,
    ".kmz": GISFormat.KMZ,
    ".csv": GISFormat.CSV,
    ".tif": GISFormat.GEOTIFF,
    ".tiff": GISFormat.GEOTIFF,
    ".dxf": GISFormat.DXF,
    ".gdb": GISFormat.FILEGDB,
    ".las": GISFormat.LAS,
    ".laz": GISFormat.LAZ,
}


def detect_format(file_bytes: bytes, filename: str) -> GISFormat:
    """
    Detect GIS file format using python-magic (content sniffing) and filename extension.

    Args:
        file_bytes: Raw file bytes (reads first 4096 bytes for magic detection).
        filename: Original filename with extension.

    Returns:
        GISFormat enum value.
    """
    # Try python-magic content detection first
    detected_format = GISFormat.UNKNOWN
    if magic is not None:
        try:
            mime = magic.from_buffer(file_bytes[:4096], mime=True)
            detected_format = _MIME_MAP.get(mime, GISFormat.UNKNOWN)
        except Exception:
            pass

    # Refine or fallback using file extension
    ext = _extract_extension(filename)
    ext_format = _EXT_MAP.get(ext, GISFormat.UNKNOWN)

    # Extension takes priority for ambiguous MIME types
    if detected_format == GISFormat.UNKNOWN and ext_format != GISFormat.UNKNOWN:
        return ext_format

    # ZIP files need further inspection: could be shapefile, KMZ, or FileGDB
    if detected_format == GISFormat.SHAPEFILE and ext == ".kmz":
        return GISFormat.KMZ
    if detected_format == GISFormat.SHAPEFILE and ext == ".gpkg":
        return GISFormat.GEOPACKAGE

    # For ZIP: check contents to distinguish shapefile from other zipped formats
    if detected_format == GISFormat.SHAPEFILE or ext == ".zip":
        return _detect_zip_contents(file_bytes)

    if detected_format != GISFormat.UNKNOWN:
        return detected_format

    return ext_format


def validate_shapefile_zip(
    zip_bytes: bytes,
) -> tuple[bool, list[str]]:
    """
    Validate that a ZIP archive contains all required Shapefile components.

    GOTCHA-PY-003: Shapefile bundles MUST contain .shp, .dbf, .prj, .shx.
    A .prj file is mandatory — reject if missing (never assume EPSG:4326).

    Args:
        zip_bytes: Raw bytes of the ZIP file.

    Returns:
        Tuple of (is_valid, missing_components).
    """
    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
            # Get all file extensions in the archive (lowercase)
            extensions_found: set[str] = set()
            for name in zf.namelist():
                if "/" in name:
                    # Handle files in subdirectories
                    name = name.rsplit("/", 1)[-1]
                ext = _extract_extension(name)
                if ext:
                    extensions_found.add(ext)

            missing = SHAPEFILE_REQUIRED_EXTENSIONS - extensions_found
            return (len(missing) == 0, sorted(missing))

    except zipfile.BadZipFile:
        return (False, ["Invalid ZIP archive"])
    except Exception as exc:
        return (False, [f"Error reading ZIP: {exc}"])


def validate_crs(crs_wkt: Optional[str]) -> Optional[str]:
    """
    Validate and return a CRS string from a GeoDataFrame's CRS.

    Args:
        crs_wkt: CRS as WKT string or EPSG code, or None.

    Returns:
        CRS authority string (e.g. "EPSG:4326") or None if CRS is missing.
    """
    if crs_wkt is None:
        return None

    crs_str = str(crs_wkt).strip()
    if not crs_str:
        return None

    return crs_str


def validate_within_cape_town_bbox(
    min_lon: float,
    min_lat: float,
    max_lon: float,
    max_lat: float,
) -> bool:
    """
    Check if a geometry's bounding box falls within the Cape Town area.

    Cape Town bbox: [18.28, -34.36, 19.02, -33.48]

    Args:
        min_lon: Minimum longitude of the data extent.
        min_lat: Minimum latitude of the data extent.
        max_lon: Maximum longitude of the data extent.
        max_lat: Maximum latitude of the data extent.

    Returns:
        True if the data bbox intersects the Cape Town bbox.
    """
    ct = CAPE_TOWN_BBOX
    # Check for intersection (not containment — data may partially overlap)
    if max_lon < ct["min_lon"] or min_lon > ct["max_lon"]:
        return False
    if max_lat < ct["min_lat"] or min_lat > ct["max_lat"]:
        return False
    return True


def prompt_dxf_crs() -> str:
    """
    Return instruction string for DXF uploads — CRS must be confirmed by user.

    GOTCHA-PY-004: DXF files almost never have CRS metadata.
    Never assume a CRS. The user MUST specify the coordinate system.

    Returns:
        Human-readable instruction string.
    """
    return (
        "DXF files do not contain CRS metadata. "
        "Please specify the coordinate reference system (CRS) for this file. "
        "Common options for Cape Town data: "
        "EPSG:4326 (WGS84 latitude/longitude), "
        "EPSG:32734 (UTM Zone 34S), "
        "EPSG:2048 (Hartebeesthoek94 Lo19 — Cape Town engineering). "
        "Upload will not proceed until CRS is confirmed."
    )


# --- Size thresholds for storage routing ---
SUPABASE_MAX_BYTES = 50 * 1024 * 1024  # 50 MB
R2_THRESHOLD_BYTES = 50 * 1024 * 1024  # Files above this go to R2
UPLOAD_MAX_BYTES = 500 * 1024 * 1024  # 500 MB hard limit


def get_storage_destination(file_size: int, gis_format: GISFormat) -> str:
    """
    Determine storage destination based on file size and format.

    Rules from PYTHON_BACKEND_ARCHITECTURE.md:
    - Files under 50MB → Supabase Storage
    - Rasters and models → Cloudflare R2 always
    - Large files → Cloudflare R2

    Args:
        file_size: File size in bytes.
        gis_format: Detected GIS format.

    Returns:
        "supabase" or "r2"
    """
    # Rasters, LiDAR, and FileGDB always go to R2
    always_r2 = {
        GISFormat.GEOTIFF,
        GISFormat.LAS,
        GISFormat.LAZ,
        GISFormat.FILEGDB,
    }
    if gis_format in always_r2:
        return "r2"

    # Size-based routing
    if file_size > R2_THRESHOLD_BYTES:
        return "r2"

    return "supabase"


# --- Internal helpers ---


def _extract_extension(filename: str) -> str:
    """Extract lowercase file extension from a filename."""
    if "." not in filename:
        return ""
    return "." + filename.rsplit(".", 1)[-1].lower()


def _detect_zip_contents(zip_bytes: bytes) -> GISFormat:
    """Inspect ZIP contents to determine the actual GIS format."""
    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
            names = [n.lower() for n in zf.namelist()]

            # Check for Shapefile components
            if any(n.endswith(".shp") for n in names):
                return GISFormat.SHAPEFILE

            # Check for KML inside (KMZ)
            if any(n.endswith(".kml") for n in names):
                return GISFormat.KMZ

            # Check for FileGDB
            if any(n.endswith(".gdb") or "/gdb" in n for n in names):
                return GISFormat.FILEGDB

            # Check for GeoPackage
            if any(n.endswith(".gpkg") for n in names):
                return GISFormat.GEOPACKAGE

            return GISFormat.SHAPEFILE  # default for ZIP
    except zipfile.BadZipFile:
        return GISFormat.UNKNOWN
