from fastapi import Request
import logging
import time
from typing import Callable
import uuid

# Configure logging
logger = logging.getLogger(__name__)


async def logging_middleware(request: Request, call_next: Callable):
    """
    Middleware for logging requests and responses
    """
    request_id = str(uuid.uuid4())
    start_time = time.time()

    # Log request
    logger.info(f"Request {request_id} started: {request.method} {request.url.path}")

    # Process request
    try:
        response = await call_next(request)
        process_time = time.time() - start_time

        # Log response
        logger.info(
            f"Request {request_id} completed: {response.status_code} in {process_time:.3f}s"
        )

        # Add custom headers
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Request-ID"] = request_id

        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Request {request_id} failed after {process_time:.3f}s: {str(e)}")
        raise
