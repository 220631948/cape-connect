"""
Tenant context — carries authenticated tenant identity through the request.

Pattern: Entity (DDD) — identity by tenant_id.
Used for multi-tenant isolation at every layer boundary.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class TenantContext:
    """
    Immutable tenant identity extracted from JWT claims.

    Passed through all service layers to enforce data isolation.
    Every DB query and storage operation must include tenant_id.
    """

    tenant_id: uuid.UUID
    user_id: uuid.UUID
    role: str
    email: str | None = None

    def is_admin(self) -> bool:
        """O(1) — check admin role."""
        return self.role in ("TENANT_ADMIN", "PLATFORM_ADMIN")

    def is_platform_admin(self) -> bool:
        """O(1) — check platform-level admin."""
        return self.role == "PLATFORM_ADMIN"
