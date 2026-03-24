"""
Notification Service — Business logic for notification management.
"""

from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

import structlog
from redis import asyncio as aioredis

from app.core.redis import get_redis
from app.domain.entities.notification import Notification, NotificationType

logger = structlog.get_logger()

# Maximum number of notifications to keep in Redis per user
MAX_NOTIFICATIONS_PER_USER = 100
NOTIFICATION_KEY_PREFIX = "notifications:"


class NotificationService:
    """Service for handling notifications."""

    def __init__(self, redis: aioredis.Redis = None):
        self.redis = redis or get_redis()

    async def create_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        type: NotificationType = NotificationType.INFO,
        tenant_id: Optional[str] = None,
        payload: Optional[dict] = None,
        send_email: bool = False,
    ) -> Notification:
        """Create and store a new notification."""
        notification = Notification(
            user_id=user_id,
            tenant_id=tenant_id,
            type=type,
            title=title,
            message=message,
            payload=payload,
        )

        # Store in Redis (List per user)
        key = f"{NOTIFICATION_KEY_PREFIX}{user_id}"
        await self.redis.lpush(key, notification.model_dump_json())
        await self.redis.ltrim(key, 0, MAX_NOTIFICATIONS_PER_USER - 1)

        logger.info(
            "Notification created",
            user_id=user_id,
            notification_id=str(notification.id),
            type=type,
        )

        if send_email:
            from app.tasks.notification_tasks import send_notification_task

            send_notification_task.delay(notification.model_dump())

        return notification

    async def get_user_notifications(self, user_id: str) -> List[Notification]:
        """Retrieve recent notifications for a user."""
        key = f"{NOTIFICATION_KEY_PREFIX}{user_id}"
        raw_notifications = await self.redis.lrange(key, 0, -1)

        notifications = []
        for raw in raw_notifications:
            try:
                notifications.append(Notification.model_validate_json(raw))
            except Exception as e:
                logger.error("Failed to parse notification", error=str(e), raw=raw)

        return notifications

    async def mark_as_read(self, user_id: str, notification_id: UUID) -> bool:
        """Mark a specific notification as read."""
        key = f"{NOTIFICATION_KEY_PREFIX}{user_id}"
        raw_notifications = await self.redis.lrange(key, 0, -1)

        # Redis lists don't support easy 'update' by field.
        # For a small number of notifications, we can rewrite the list.
        # In a real high-traffic app, we'd use a Hash or Sorted Set for easier updates.

        found = False
        updated_notifications = []

        for raw in raw_notifications:
            notif = Notification.model_validate_json(raw)
            if notif.id == notification_id:
                notif.read_at = datetime.now(timezone.utc)
                found = True
            updated_notifications.append(notif.model_dump_json())

        if found:
            # Atomic update would be better with a Lua script or transaction
            async with self.redis.pipeline(transaction=True) as pipe:
                await pipe.delete(key)
                if updated_notifications:
                    await pipe.rpush(key, *updated_notifications)
                await pipe.execute()

        return found
