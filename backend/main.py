import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import logging

from app.core.config import settings

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Plate Order System",
    description="Enhanced plate order system with floor plan management",
    version="2.0.0",
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc"
)

# Set up CORS with proper configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for WebSocket
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_path = Path(__file__).parent / "app" / "static"
app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

# Set up templates
templates = Jinja2Templates(directory="app/templates")

# Include routers
from app.api.v1.api import api_router
from app.websockets.speech_processing import router as websocket_router

app.include_router(api_router, prefix=settings.API_PREFIX)
app.include_router(websocket_router)  # Include WebSocket router

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Application starting up...")
    # Log core configurations
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"API Prefix: {settings.API_PREFIX}")
    logger.info(f"CORS Origins: {settings.CORS_ORIGINS}")
    
    # Log Supabase connection
    if settings.NEXT_PUBLIC_SUPABASE_URL:
        logger.info(f"Supabase URL: {settings.NEXT_PUBLIC_SUPABASE_URL}")
        logger.info("Supabase key is configured")
    else:
        logger.warning("Supabase URL is not configured")
    
    # Log DeepGram configuration
    if settings.DEEPGRAM_API_KEY:
        logger.info("Deepgram API key is configured")
    else:
        logger.warning("Deepgram API key is not configured")

# Basic health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Compatibility routes for frontend
@app.get("/api/health")
async def api_health_compat():
    """Compatibility endpoint for frontend"""
    return {"status": "healthy"}

@app.get("/api/menu")
async def api_menu_compat():
    """Compatibility endpoint for frontend"""
    # Forward to the v1 API
    from app.db.repositories.menu import MenuRepository
    menu_repo = MenuRepository()
    return {"items": menu_repo.get_all()}

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Render the index page"""
    return templates.TemplateResponse("pages/index.html", {"request": request})

@app.get("/server", response_class=HTMLResponse)
async def server_view(request: Request):
    """Render the server view page"""
    return templates.TemplateResponse("pages/server-view.html", {"request": request})

@app.get("/kitchen", response_class=HTMLResponse)
async def kitchen_view(request: Request):
    """Render the kitchen view page"""
    return templates.TemplateResponse("pages/kitchen-view.html", {"request": request})

@app.get("/bar", response_class=HTMLResponse)
async def bar_view(request: Request):
    """Render the bar view page"""
    return templates.TemplateResponse("pages/bar-view.html", {"request": request})

@app.get("/expo", response_class=HTMLResponse)
async def expo_view(request: Request):
    """Render the expo view page"""
    return templates.TemplateResponse("pages/expo-view.html", {"request": request})

@app.get("/admin/floor-plan", response_class=HTMLResponse)
async def floor_plan_admin(request: Request):
    return templates.TemplateResponse("pages/floor-plan-admin.html", {"request": request})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )

