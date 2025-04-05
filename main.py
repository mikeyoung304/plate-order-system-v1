import os
import logging
from typing import Optional, List
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware # Import CORS middleware
from sqlalchemy.exc import SQLAlchemyError
import uvicorn

# Import API routers
from src.app.api import api_router # For REST APIs
from src.app.api.listen import router as listen_router # For WebSocket
from src.app.api.middleware.error_handler import (
    validation_exception_handler,
    sqlalchemy_exception_handler,
    general_exception_handler
)
from src.app.api.middleware.logging_middleware import logging_middleware

# Import new API routers (Removed unused ones)
# from src.app.api.meal_period import router as meal_period_router # Removed
# from src.app.api.daily_specials import router as daily_specials_router # Removed
from src.app.api.quick_orders import router as quick_orders_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Plate Order System",
    description="Voice-enabled ordering system for restaurants",
    version="1.0.0",
    redirect_slashes=False, # Disable automatic trailing slash redirects
)

# Add CORS middleware
origins = [
    "http://localhost:3000", # Allow CRA default port
    "http://localhost:3001", # Allow common alternative dev port (HTTP)
    # "https://localhost:3001", # Allow common alternative dev port (HTTPS) - Removed as frontend is back on HTTP
    "http://localhost:8080", # Allow port used for serve build test
    # Add any other origins if needed (e.g., deployed frontend URL)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods
    allow_headers=["*"], # Allow all headers
)

# Add logging middleware (ensure CORS runs first)
@app.middleware("http")
async def add_logging_middleware(request: Request, call_next):
    return await logging_middleware(request, call_next)

# Add exception handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Mount static files directory
# Ensure this path is correct relative to where main.py is run
# If main.py is at the root, 'src/app/static' is correct.
app.mount("/static", StaticFiles(directory="src/app/static"), name="static")

# Templates configuration
# Ensure this path is correct
templates = Jinja2Templates(directory="src/app/templates")

# Include API routers
app.include_router(api_router, prefix="/api") # Add /api prefix here
app.include_router(listen_router) # WebSocket for Deepgram (likely at /listen)

# Include new API routers (These might need prefixes if not defined within them)
# Assuming they are already included under /api via api_router in src/app/api/__init__.py
# If not, they might need to be added here or within api_router
# app.include_router(meal_period_router)
# app.include_router(daily_specials_router)
# app.include_router(quick_orders_router)

# API key from environment variable
DEEPGRAM_API_KEY = os.environ.get('DEEPGRAM_API_KEY')
if not DEEPGRAM_API_KEY:
    logger.warning("DEEPGRAM_API_KEY not set in environment variables")
    logger.warning("Voice transcription will not work without a Deepgram API key")
else:
    logger.info("DEEPGRAM_API_KEY is set in environment variables")
    logger.info("Using Deepgram API for voice transcription")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}


# --- Moved Voice Order Endpoint ---
# Necessary imports for the moved endpoint
from fastapi import BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from src.app.api.schemas import VoiceProcessRequest, VoiceProcessResponse
from src.app.services.order.order_processor import OrderProcessor as OrderService
from src.app.core.dependencies import get_order_processor
from src.app.db.database import get_db
# Imports for create_order_main removed

@app.post("/api/orders/voice", response_model=VoiceProcessResponse)
async def process_voice_order(
    request: VoiceProcessRequest,
    background_tasks: BackgroundTasks,
    order_processor: OrderService = Depends(get_order_processor),
    db: Session = Depends(get_db)
):
    """
    Process a voice order using base64 encoded audio data in JSON body.
    Example Body: {"audio_data": "UklGR..."}
    Uses OrderProcessor service.
    """
    try:
        # Log received request
        logger.info(f"Voice order request received (main.py), audio data length: {len(request.audio_data) if request.audio_data else 0}")
        
        # Pass db session to the service method
        response = await order_processor.handle_voice_order(db=db, audio_data_b64=request.audio_data, background_tasks=background_tasks)
        logger.info(f"Voice order processed successfully (main.py) with transcription length: {len(response.get('transcription', ''))}")
        return response
    except HTTPException as e: # Re-raise HTTP exceptions from service
        logger.warning(f"HTTP Exception processing voice order (main.py): {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Error processing voice order (main.py): {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Internal server error processing voice order"
        )
# --- End Moved Voice Order Endpoint ---

# Favicon route
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    from fastapi.responses import FileResponse
    # Ensure this path is correct
    return FileResponse("src/app/static/img/favicon.ico")

# --- Template Routes (Consider if these are needed with React frontend) ---
# These might conflict or be unnecessary if React handles all routing

# @app.get("/")
# async def read_root(request: Request):
#     return templates.TemplateResponse("index.html", {"request": request})

# @app.get("/floor-plan")
# async def floor_plan(request: Request):
#     return templates.TemplateResponse("floor-plan.html", {"request": request})

# @app.get("/kds")
# async def kds(request: Request):
#     return templates.TemplateResponse("kds.html", {"request": request})

# @app.get("/orders")
# async def orders(request: Request):
#     return templates.TemplateResponse("orders.html", {"request": request})

# @app.get("/residents")
# async def residents(request: Request):
#     return templates.TemplateResponse("residents.html", {"request": request})

# @app.get("/server-view")
# async def server_view(request: Request):
#     return templates.TemplateResponse("server-view.html", {"request": request})

# @app.get("/kitchen-view")
# async def kitchen_view(request: Request):
#     return templates.TemplateResponse("kitchen-view.html", {"request": request})

# --- End Template Routes ---

# --- Direct Test Route for /api/orders/voice --- (COMMENTED OUT)
# @app.post("/api/orders/voice")
# async def direct_voice_test():
#     logger.info("Direct /api/orders/voice test endpoint hit!")
#     return {"message": "Direct voice endpoint reached successfully"}
# --- End Direct Test Route ---


# WebSocket connection for real-time updates (If needed)
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Process WebSocket data if needed
            await manager.broadcast(f"Message received: {data}") # Example broadcast
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Main entry point
if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 10000)) # Default to 10000

    # Log startup info
    logger.info(f"Starting server on port {port} in {os.environ.get('ENVIRONMENT', 'development')} mode")

    # Run the app with specific reload config
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        reload_dirs=["src"], # Only watch the backend source directory
        # reload_excludes=["*/frontend/*"] # Optionally exclude frontend entirely if needed
    )
