"""
Redis Client Configuration — providing a shared async connection pool.
"""

from typing import Optional

from redis import asyncio as aioredis

from app.core.config import settings


class RedisManager:
    """Manages the Redis connection and pool."""

    def __init__(self):
        self._client: Optional[aioredis.Redis] = None

    def get_client(self) -> aioredis.Redis:
        """Get or initialize the async Redis client."""
        if self._client is None:
            # Derived from settings.celery_broker_url if not explicitly set
            # but usually it's redis://localhost:6379/0
            self._client = aioredis.from_url(
                settings.celery_broker_url,
                encoding="utf-8",
                decode_responses=True,
            )
        return self._client

    async def close(self):
        """Close the connection pool."""
        if self._client:
            await self._client.close()
            self._client = None


redis_manager = RedisManager()


def get_redis() -> aioredis.Redis:
    """Dependency for FastAPI or shared access."""
    return redis_manager.get_client()
