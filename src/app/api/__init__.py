from fastapi import APIRouter
from .residents import router as residents_router
from .orders import router as orders_router
from .floor_plan import router as floor_plan_router
from .speech import router as speech_router
from .admin import router as admin_router
from .tables import router as tables_router

# from .daily_specials import router as daily_specials_router # Removed
# from .meal_period import router as meal_period_router # Removed
from .main import router as dashboard_router
from .settings import router as settings_router  # Import the new settings router
from .quick_orders import router as quick_orders_router  # Import quick orders router

# Create a main API router
# Define main router WITHOUT prefix here
api_router = APIRouter()

# Include all routers
# Include routers WITH their specific prefixes relative to /api
api_router.include_router(residents_router, prefix="/residents")
api_router.include_router(orders_router, prefix="/orders") # Add prefix back
api_router.include_router(floor_plan_router, prefix="/floor-plan")
api_router.include_router(speech_router, prefix="/speech")
api_router.include_router(admin_router, prefix="/admin")
api_router.include_router(tables_router, prefix="/tables")
# api_router.include_router(daily_specials_router, prefix="/daily-specials") # Removed
# api_router.include_router(meal_period_router, prefix="/meal-period") # Removed
api_router.include_router(
    dashboard_router, prefix="/dashboard"
)  # Assuming /main maps to /dashboard
api_router.include_router(settings_router, prefix="/settings")
api_router.include_router(
    quick_orders_router, prefix="/quick-orders"
)  # Include quick orders router
# api_router.include_router(quick_orders_router) # REMOVED duplicate inclusion without prefix
# Note: WebSocket router is included directly in main.py, not under /api prefix
