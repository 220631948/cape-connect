"""
Outbound ports — driven-side interfaces (Repository pattern, Storage, External APIs).

These abstract base classes define contracts that adapters must implement.
The domain/application layers depend ONLY on these interfaces, never on
concrete implementations (Dependency Inversion Principle).

Pattern: Ports & Adapters (Hexagonal Architecture).
Ref: https://alistair.cockburn.us/hexagonal-architecture/
"""
from app.ports.outbound.spatial_repository import SpatialRepositoryPort
from app.ports.outbound.storage import StoragePort
from app.ports.outbound.arcgis import ArcGISPort
from app.ports.outbound.file_processor import FileProcessorPort

__all__ = [
    "SpatialRepositoryPort",
    "StoragePort",
    "ArcGISPort",
    "FileProcessorPort",
]
