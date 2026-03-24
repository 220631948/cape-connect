"""
Celery tasks for notification delivery.
"""

import structlog
from app.tasks.celery_app import celery_app

logger = structlog.get_logger()


@celery_app.task(name="app.tasks.notification_tasks.send_notification_task")
def send_notification_task(notification_data: dict):
    """
    Task to send external notifications (Email, Webhook, etc.)
    """
    user_id = notification_data.get("user_id")
    title = notification_data.get("title")

    logger.info("Sending external notification", user_id=user_id, title=title)

    # In a real implementation, we would call an email service (like Resend)
    # or trigger a webhook here.

    return {"status": "sent", "user_id": user_id}
