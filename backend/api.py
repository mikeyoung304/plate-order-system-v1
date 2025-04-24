from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import get_menu_items, get_orders, create_order

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

from app.websockets.improved_speech import router as websocket_router
app.include_router(websocket_router)
