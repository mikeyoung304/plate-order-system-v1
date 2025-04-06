import logging
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi

from app.core.config import settings
from app.api.v1.router import api_router
from app.api.v1.dependencies.db import get_db
from app.db.session import engine, Base

# Set up logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Voice-enabled ordering system for assisted living facilities",
    version="2.0.0",
    docs_url=None,  # Disable default docs
    redoc_url=None,  # Disable default redoc
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Add CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Set up templates
templates = Jinja2Templates(directory="app/templates")

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Custom OpenAPI documentation
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        title=f"{settings.PROJECT_NAME} - Swagger UI",
        oauth2_redirect_url=f"{settings.API_V1_STR}/docs/oauth2-redirect",
        swagger_js_url="/static/swagger-ui-bundle.js",
        swagger_css_url="/static/swagger-ui.css",
    )

@app.get("/redoc", include_in_schema=False)
async def redoc_html():
    return get_redoc_html(
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        title=f"{settings.PROJECT_NAME} - ReDoc",
        redoc_js_url="/static/redoc.standalone.js",
    )

@app.get(f"{settings.API_V1_STR}/openapi.json", include_in_schema=False)
async def get_open_api_endpoint():
    return get_openapi(
        title=settings.PROJECT_NAME,
        version="2.0.0",
        description="Voice-enabled ordering system for assisted living facilities",
        routes=app.routes,
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT
    }

# Root route
@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse("pages/index.html", {"request": request})

# Main routes
@app.get("/floor-plan")
async def floor_plan(request: Request):
    return templates.TemplateResponse("pages/floor-plan.html", {"request": request})

@app.get("/kds")
async def kds(request: Request):
    return templates.TemplateResponse("pages/kds.html", {"request": request})

@app.get("/orders")
async def orders(request: Request):
    return templates.TemplateResponse("pages/orders.html", {"request": request})

@app.get("/residents")
async def residents(request: Request):
    return templates.TemplateResponse("pages/residents.html", {"request": request})

@app.get("/server-view")
async def server_view(request: Request):
    return templates.TemplateResponse("pages/server-view.html", {"request": request})

@app.get("/kitchen-view")
async def kitchen_view(request: Request):
    return templates.TemplateResponse("pages/kitchen-view.html", {"request": request})

@app.get("/admin")
async def admin(request: Request):
    return templates.TemplateResponse("pages/admin.html", {"request": request})

# Error handlers
@app.exception_handler(404)
async def not_found_exception_handler(request: Request, exc: HTTPException):
    return templates.TemplateResponse(
        "pages/404.html", {"request": request}, status_code=404
    )

@app.exception_handler(500)
async def server_error_exception_handler(request: Request, exc: HTTPException):
    return templates.TemplateResponse(
        "pages/500.html", {"request": request}, status_code=500
    )
