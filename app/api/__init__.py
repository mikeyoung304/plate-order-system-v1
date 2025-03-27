from fastapi import APIRouter
from .residents import router as residents_router
from .orders import router as orders_router
from .floor_plan import router as floor_plan_router
from .speech import router as speech_router

# Create a main API router
api_router = APIRouter(prefix="/api")

# Include all routers
api_router.include_router(residents_router)
api_router.include_router(orders_router)
api_router.include_router(floor_plan_router)
api_router.include_router(speech_router)
