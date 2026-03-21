"""
Domain exceptions — business rule violations.

These exceptions are raised in the domain/application layers and translated
to HTTP responses by the adapter layer. They carry NO framework dependency.
"""


class DomainError(Exception):
    """Base for all domain-layer errors."""


class BBoxOutOfRange(DomainError):
    """Geometry or query falls outside Cape Town metro bbox."""

    def __init__(self, detail: str = "Coordinates outside Cape Town bbox"):
        super().__init__(detail)
        self.detail = detail


class CRSMissing(DomainError):
    """CRS metadata absent — cannot assume EPSG:4326 (GOTCHA-PY-004)."""

    def __init__(self, format_name: str = "DXF"):
        detail = (
            f"{format_name} file has no CRS metadata. "
            "Please specify the coordinate reference system before processing."
        )
        super().__init__(detail)
        self.detail = detail


class ShapefileBundleIncomplete(DomainError):
    """Shapefile .zip missing required components (GOTCHA-PY-003)."""

    def __init__(self, missing: list[str]):
        detail = f"Shapefile bundle missing: {', '.join(missing)}"
        super().__init__(detail)
        self.detail = detail
        self.missing = missing


class TenantIsolationViolation(DomainError):
    """Cross-tenant data access attempt."""

    def __init__(self) -> None:
        super().__init__("Access denied: tenant isolation violation")
        self.detail = "Access denied: tenant isolation violation"


class AuthenticationError(DomainError):
    """JWT validation failure — maps to HTTP 401."""

    def __init__(self, detail: str = "Invalid or missing authentication"):
        super().__init__(detail)
        self.detail = detail


class RateLimitExceeded(DomainError):
    """Tenant exceeded rate limit for a specific operation."""

    def __init__(self, limit: int, window: str = "hour"):
        detail = f"Rate limit exceeded: {limit} requests per {window}"
        super().__init__(detail)
        self.detail = detail
        self.limit = limit


class LayerNotFound(DomainError):
    """Requested GIS layer does not exist or is not accessible."""

    def __init__(self, layer_id: str):
        detail = f"Layer not found: {layer_id}"
        super().__init__(detail)
        self.detail = detail
