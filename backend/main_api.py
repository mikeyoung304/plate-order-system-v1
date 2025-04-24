import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
from app.database import get_menu_items, get_orders, create_order

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Plate Order System API",
    description="API for Plate Order System",
    version="2.0.0"
)

# Configure CORS for NextJS frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # NextJS default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API endpoints
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/menu")
async def menu_items():
    items = get_menu_items()
    return {"items": items}

@app.get("/api/orders")
async def orders():
    order_list = get_orders()
    return {"orders": order_list}

# Include WebSocket router
from app.websockets.improved_speech import router as websocket_router
app.include_router(websocket_router)

if __name__ == "__main__":
    uvicorn.run("main_api:app", host="0.0.0.0", port=8000, reload=True)
