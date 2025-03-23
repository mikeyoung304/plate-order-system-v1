from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from dotenv import load_dotenv
from pathlib import Path
import json

# Import API routers
from api.residents import router as residents_router
from api.orders import router as orders_router

# Import database
from db.database import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get environment variables
TEMPLATES_DIR = os.getenv("TEMPLATES_DIR", "app/frontend/templates")
STATIC_FILES_DIR = os.getenv("STATIC_FILES_DIR", "app/frontend/static")

# Initialize FastAPI app
app = FastAPI(title="Plate Order System", 
              description="A voice-driven restaurant ordering system with KDS integration")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, this should be more restrictive
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Set up templates
templates = Jinja2Templates(directory="templates")

# Include API routers
app.include_router(residents_router, prefix="/api")
app.include_router(orders_router, prefix="/api")

# Connected WebSocket clients for KDS real-time updates
connected_clients = set()

@app.get("/", response_class=HTMLResponse)
async def get_home_page(request: Request):
    """
    Serve the main application page
    """
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/kds", response_class=HTMLResponse)
async def get_kds_page(request: Request):
    """
    Serve the Kitchen Display System page
    """
    return templates.TemplateResponse("kds.html", {"request": request})

@app.get("/floor-plan", response_class=HTMLResponse)
async def get_floor_plan(request: Request):
    """
    Serve the floor plan management page
    """
    return templates.TemplateResponse("floor-plan.html", {"request": request})

@app.get("/residents", response_class=HTMLResponse)
async def get_residents_page(request: Request):
    """
    Serve the residents management page
    """
    return templates.TemplateResponse("residents.html", {"request": request})

@app.get("/orders", response_class=HTMLResponse)
async def get_orders_page(request: Request):
    """
    Serve the orders management page
    """
    return templates.TemplateResponse("orders.html", {"request": request})

@app.websocket("/ws/kds")
async def websocket_kds(websocket: WebSocket):
    """
    WebSocket endpoint for KDS real-time updates
    """
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await broadcast_to_clients(data)
    except WebSocketDisconnect:
        connected_clients.remove(websocket)

async def broadcast_to_clients(message):
    """
    Broadcast message to all connected WebSocket clients
    """
    for client in connected_clients:
        try:
            await client.send_text(message)
        except Exception as e:
            logger.error(f"Error sending message to WebSocket client: {e}")
            connected_clients.remove(client)

# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring
    """
    return {"status": "healthy"}from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from dotenv import load_dotenv
from pathlib import Path
import json

# Import API routers
from api.residents import router as residents_router
from api.orders import router as orders_router

# Import database
from db.database import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get environment variables
TEMPLATES_DIR = os.getenv("TEMPLATES_DIR", "app/frontend/templates")
STATIC_FILES_DIR = os.getenv("STATIC_FILES_DIR", "app/frontend/static")

# Initialize FastAPI app
app = FastAPI(title="Plate Order System", 
              description="A voice-driven restaurant ordering system with KDS integration")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, this should be more restrictive
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Set up templates
templates = Jinja2Templates(directory="templates")

# Include API routers
app.include_router(residents_router, prefix="/api")
app.include_router(orders_router, prefix="/api")

# Connected WebSocket clients for KDS real-time updates
connected_clients = set()

@app.get("/", response_class=HTMLResponse)
async def get_home_page(request: Request):
    """
    Serve the main application page
    """
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/kds", response_class=HTMLResponse)
async def get_kds_page(request: Request):
    """
    Serve the Kitchen Display System page
    """
    return templates.TemplateResponse("kds.html", {"request": request})

@app.get("/floor-plan", response_class=HTMLResponse)
async def get_floor_plan(request: Request):
    """
    Serve the floor plan management page
    """
    return templates.TemplateResponse("floor-plan.html", {"request": request})

@app.get("/residents", response_class=HTMLResponse)
async def get_residents_page(request: Request):
    """
    Serve the residents management page
    """
    return templates.TemplateResponse("residents.html", {"request": request})

@app.get("/orders", response_class=HTMLResponse)
async def get_orders_page(request: Request):
    """
    Serve the orders management page
    """
    return templates.TemplateResponse("orders.html", {"request": request})

@app.websocket("/ws/kds")
async def websocket_kds(websocket: WebSocket):
    """
    WebSocket endpoint for KDS real-time updates
    """
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await broadcast_to_clients(data)
    except WebSocketDisconnect:
        connected_clients.remove(websocket)

async def broadcast_to_clients(message):
    """
    Broadcast message to all connected WebSocket clients
    """
    for client in connected_clients:
        try:
            await client.send_text(message)
        except Exception as e:
            logger.error(f"Error sending message to WebSocket client: {e}")
            connected_clients.remove(client)

# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring
    """
    return {"status": "healthy"}
