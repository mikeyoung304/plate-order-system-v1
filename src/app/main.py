from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sentry_sdk
import logging

from src.app.config.settings import settings
from src.app.middleware.rate_limit import RateLimitMiddleware
from src.app.api import (
    orders,
    residents,
    tables,
    floor_plan,
    websocket,
    speech,
    listen,
    settings as settings_router,
)
from src.app.core.dependencies import get_monitoring, get_speech

# Configure logging
logger = logging.getLogger(__name__)


def init_sentry():
    """Initialize Sentry if DSN is provided and not empty."""
    dsn = settings.SENTRY_DSN
    if dsn and dsn.strip() and not dsn.startswith("your-"):
        try:
            sentry_sdk.init(dsn=dsn, traces_sample_rate=1.0, profiles_sample_rate=1.0)
            logger.info("Sentry initialized successfully")
        except Exception as e:
            logger.warning(f"Failed to initialize Sentry: {str(e)}")
    else:
        logger.info("Sentry DSN not configured, skipping initialization")


app = FastAPI(
    title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(orders.router, prefix=settings.API_V1_STR)
app.include_router(residents.router, prefix=settings.API_V1_STR)
app.include_router(tables.router, prefix=settings.API_V1_STR)
app.include_router(floor_plan.router, prefix=settings.API_V1_STR)
app.include_router(websocket.router, prefix=settings.API_V1_STR)
app.include_router(speech.router, prefix=settings.API_V1_STR)
app.include_router(listen.router, prefix=settings.API_V1_STR)
app.include_router(settings_router.router, prefix=settings.API_V1_STR)

# Add rate limit middleware after routes
app.add_middleware(RateLimitMiddleware, monitoring_service=get_monitoring())


@app.get("/health")
async def health_check(monitoring=Depends(get_monitoring)):
    """Health check endpoint."""
    return monitoring.get_health_status()


@app.get("/metrics")
async def get_metrics(monitoring=Depends(get_monitoring)):
    """Get system metrics endpoint."""
    return monitoring.get_system_metrics()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    # Log error
    logger.error(f"Unhandled exception: {str(exc)}")

    # Record error in monitoring
    try:
        monitoring = get_monitoring()
        monitoring.record_error("api", "unhandled_exception")
    except Exception as e:
        logger.warning(f"Could not record error in monitoring: {str(e)}")

    # Return error response
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    try:
        # Initialize Sentry
        init_sentry()

        # Validate Deepgram API key is set
        if not settings.DEEPGRAM_API_KEY or not settings.DEEPGRAM_API_KEY.strip():
            logger.error("Deepgram API key is required but not configured")
            raise RuntimeError("Deepgram API key is required but not configured")

        # Initialize and validate speech service
        speech_service = get_speech()
        if not await speech_service.validate_setup():
            logger.error("Speech service setup validation failed")
            raise RuntimeError("Speech service setup validation failed")

    except Exception as e:
        logger.error(f"Startup validation failed: {str(e)}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    try:
        # Close speech service
        speech_service = get_speech()
        await speech_service.close()
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")
