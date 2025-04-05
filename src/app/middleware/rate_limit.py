from fastapi import Request
from fastapi.responses import JSONResponse
import logging
from src.app.config.settings import settings
from src.app.services.mock_redis import MockRedis
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response
from src.app.services.monitoring.monitoring_service import MonitoringService

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting requests."""

    def __init__(self, app=None, monitoring_service: MonitoringService = None):
        super().__init__(app)
        self.redis_client = MockRedis()
        self.monitoring_service = monitoring_service
        self.rate_limit = settings.RATE_LIMIT_REQUESTS
        self.window = settings.RATE_LIMIT_WINDOW

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Process the request and apply rate limiting."""
        client_ip = request.client.host
        endpoint = request.url.path

        # Check rate limit
        key = f"rate_limit:{client_ip}:{endpoint}"
        count = await self.redis_client.incr(key)
        if count == 1:
            await self.redis_client.expire(key, self.window)

        if count > self.rate_limit:
            # Record rate limit hit
            if self.monitoring_service:
                await self.monitoring_service.record_rate_limit_hit(client_ip, endpoint)
            return JSONResponse(
                status_code=429, content={"detail": "Too many requests"}
            )

        return await call_next(request)
