"""
Notification management endpoints.
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user
from app.domain.entities.notification import Notification
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=List[Notification])
async def list_notifications(
    user: dict = Depends(get_current_user),
    service: NotificationService = Depends(NotificationService),
) -> List[Notification]:
    """
    Fetch the latest notifications for the authenticated user.
    """
    user_id = user.get("sub") or user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    return await service.get_user_notifications(user_id)


@router.post("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: UUID,
    user: dict = Depends(get_current_user),
    service: NotificationService = Depends(NotificationService),
) -> dict:
    """
    Mark a specific notification as read.
    """
    user_id = user.get("sub") or user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    success = await service.mark_as_read(user_id, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"status": "success", "message": "Notification marked as read"}
