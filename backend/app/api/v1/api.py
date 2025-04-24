from fastapi import APIRouter
# Import floor_plans router as well
from app.api.v1.endpoints import orders, tables, menu, auth, floor_plans

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
# Keep existing tables router if it serves a different purpose, or remove if redundant
# api_router.include_router(tables.router, prefix="/tables", tags=["tables"]) # Assuming floor_plans handles table operations now
api_router.include_router(menu.router, prefix="/menu", tags=["menu"])
# Include the floor_plans router which contains /tables, /seats, /floor-plans endpoints
api_router.include_router(floor_plans.router, tags=["floor plans & tables"]) # No prefix needed here as paths are defined within floor_plans.py