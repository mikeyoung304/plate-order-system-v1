from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import json
import uuid

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Plate Order System API",
    description="API for the Plate Order System",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sample data
menu_items = [
    {"id": "1", "name": "Classic Burger", "price": 12.99},
    {"id": "2", "name": "Caesar Salad", "price": 9.99},
    {"id": "3", "name": "Chocolate Cake", "price": 7.99},
    {"id": "4", "name": "Iced Tea", "price": 2.99},
    {"id": "5", "name": "Grilled Salmon", "price": 18.99},
    {"id": "6", "name": f"Test Item {uuid.uuid4().hex[:8]}", "price": 9.99},
]

orders = []

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to the Plate Order System API"}

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# Menu items endpoint
@app.get("/api/menu")
async def get_menu_items():
    return {"items": menu_items}

# Orders endpoints
@app.get("/api/orders")
async def get_orders():
    return {"orders": orders}

class OrderItem(BaseModel):
    item_id: str
    quantity: int

class Order(BaseModel):
    items: List[OrderItem]
    customer_name: Optional[str] = None
    notes: Optional[str] = None

@app.post("/api/orders")
async def create_order(order: Order):
    order_id = str(uuid.uuid4())
    new_order = {
        "id": order_id,
        "items": order.items,
        "customer_name": order.customer_name,
        "notes": order.notes,
        "status": "pending"
    }
    orders.append(new_order)
    return {"order_id": order_id, "status": "success"}

# WebSocket for voice recognition
@app.websocket("/ws/voice")
async def websocket_voice(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive audio data
            data = await websocket.receive_text()
            
            # In a real app, you'd process audio data here
            # For demo, we'll just echo back a sample transcript
            transcript = "I would like to order a burger and fries"
            
            await websocket.send_text(json.dumps({
                "transcript": transcript,
                "confidence": 0.95
            }))
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await websocket.close()
