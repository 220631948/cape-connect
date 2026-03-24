"""
Notification Entity and Schema.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Any, Dict
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class NotificationType(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    SYSTEM = "system"


class Notification(BaseModel):
    """Notification entity stored in Redis or sent via tasks."""

    id: UUID = Field(default_factory=uuid4)
    user_id: str
    tenant_id: Optional[str] = None
    type: NotificationType = NotificationType.INFO
    title: str
    message: str
    payload: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
