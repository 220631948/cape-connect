"""
Unit tests for the Notification Service.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from app.services.notification_service import NotificationService
from app.domain.entities.notification import Notification, NotificationType


@pytest.mark.anyio
async def test_create_notification():
    # Mock Redis
    mock_redis = AsyncMock()
    service = NotificationService(redis=mock_redis)
    
    user_id = "user-123"
    title = "Test Notification"
    message = "Hello World"
    
    notification = await service.create_notification(
        user_id=user_id,
        title=title,
        message=message,
        type=NotificationType.SUCCESS
    )
    
    assert notification.user_id == user_id
    assert notification.title == title
    assert notification.message == message
    assert notification.type == NotificationType.SUCCESS
    
    # Verify Redis calls
    mock_redis.lpush.assert_called_once()
    mock_redis.ltrim.assert_called_once()


@pytest.mark.anyio
async def test_get_user_notifications():
    # Mock Redis
    mock_redis = AsyncMock()
    service = NotificationService(redis=mock_redis)
    
    user_id = "user-123"
    notif = Notification(
        user_id=user_id,
        title="Title",
        message="Message"
    )
    
    mock_redis.lrange.return_value = [notif.model_dump_json()]
    
    notifications = await service.get_user_notifications(user_id)
    
    assert len(notifications) == 1
    assert notifications[0].title == "Title"
    mock_redis.lrange.assert_called_once_with(f"notifications:{user_id}", 0, -1)


@pytest.mark.anyio
async def test_mark_as_read():
    # Mock Redis
    mock_redis = AsyncMock()
    service = NotificationService(redis=mock_redis)
    
    user_id = "user-123"
    notif_id = uuid4()
    notif = Notification(
        id=notif_id,
        user_id=user_id,
        title="Title",
        message="Message"
    )
    
    mock_redis.lrange.return_value = [notif.model_dump_json()]
    
    # Mock pipeline
    mock_pipe = AsyncMock()
    # redis.pipeline() returns a context manager, it's not a coroutine itself
    mock_redis.pipeline = MagicMock()
    mock_redis.pipeline.return_value.__aenter__.return_value = mock_pipe
    mock_redis.pipeline.return_value.__aexit__.return_value = AsyncMock()
    
    success = await service.mark_as_read(user_id, notif_id)
    
    assert success is True
    mock_pipe.delete.assert_called_once()
    mock_pipe.rpush.assert_called_once()
    mock_pipe.execute.assert_called_once()
