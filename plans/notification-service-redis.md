# Objective
Implement a new notification service using Redis in the Python backend to support asynchronous delivery (e.g., email) and persistent in-app notifications.

# Key Files & Context
- `backend/app/core/redis.py`: Shared Redis client and connection management.
- `backend/app/services/notification_service.py`: Business logic for creating, storing, and fetching notifications.
- `backend/app/tasks/notification_tasks.py`: Celery tasks for background notification delivery (e.g., email).
- `backend/app/api/routes/notifications.py`: FastAPI endpoints for users to manage their notifications.
- `backend/app/domain/entities/notification.py`: Domain entity/schema for notifications.
- `backend/main.py`: Register the new notification router.

# Implementation Steps
1. **Infrastructure**: Create `backend/app/core/redis.py` to provide a shared, async Redis client.
2. **Domain**: Define the `Notification` schema and `NotificationType` enum in `backend/app/domain/entities/notification.py`.
3. **Service**: Implement `NotificationService` to:
   - Push in-app notifications to Redis (e.g., `LPUSH` into a user-specific list).
   - Trigger asynchronous tasks via Celery for external delivery.
4. **Tasks**: Implement `send_notification_task` in `backend/app/tasks/notification_tasks.py` to handle external delivery (integrating with `Resend` or webhooks).
5. **API**: Create FastAPI routes in `backend/app/api/routes/notifications.py` to:
   - `GET /notifications`: Fetch latest notifications from Redis.
   - `POST /notifications/read`: Mark notifications as read.
6. **Integration**: Register the router in `backend/main.py`.

# Verification & Testing
- **Unit Tests**: Test the `NotificationService` using a mock Redis client.
- **Integration Tests**: Verify that notifications are correctly stored in Redis and tasks are enqueued.
- **Manual Check**: Trigger a notification and verify it appears in the Redis `LIST` for the user.
