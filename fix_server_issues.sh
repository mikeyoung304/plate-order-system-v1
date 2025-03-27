#!/bin/bash

# Script to fix server issues

echo "Fixing server issues..."

# Fix main.py
echo "Fixing main.py..."
cat > main.py << 'EOF'
import os
import logging
from typing import Optional, List
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import uvicorn

# Import API router
from app.api import api_router
from app.api.middleware.error_handler import (
    validation_exception_handler,
    sqlalchemy_exception_handler,
    general_exception_handler
)
from app.api.middleware.logging_middleware import logging_middleware

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
)

# Add middleware
@app.middleware("http")
async def add_logging_middleware(request: Request, call_next):
    return await logging_middleware(request, call_next)

# Add exception handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Mount static files directory
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Templates configuration
templates = Jinja2Templates(directory="app/templates")

# Include API router
app.include_router(api_router)

# API key from environment variable
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY not set in environment variables")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Home page route
@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Floor plan route
@app.get("/floor-plan")
async def floor_plan(request: Request):
    return templates.TemplateResponse("floor-plan.html", {"request": request})

# KDS route
@app.get("/kds")
async def kds(request: Request):
    return templates.TemplateResponse("kds.html", {"request": request})

# Orders route
@app.get("/orders")
async def orders(request: Request):
    return templates.TemplateResponse("orders.html", {"request": request})

# Residents route
@app.get("/residents")
async def residents(request: Request):
    return templates.TemplateResponse("residents.html", {"request": request})

# Server view route
@app.get("/server-view")
async def server_view(request: Request):
    return templates.TemplateResponse("server-view.html", {"request": request})

# Kitchen view route
@app.get("/kitchen-view")
async def kitchen_view(request: Request):
    return templates.TemplateResponse("kitchen-view.html", {"request": request})

# WebSocket connection for real-time updates
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
            await manager.broadcast(f"Message: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Main entry point
if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 8000))
    
    # Log startup info
    logger.info(f"Starting server on port {port} in {os.environ.get('ENVIRONMENT', 'development')} mode")
    
    # Run the app
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
EOF

# Create kitchen-view.html
echo "Creating kitchen-view.html..."
mkdir -p app/templates
cat > app/templates/kitchen-view.html << 'EOF'
{% extends "base.html" %}

{% block title %}Kitchen View - Plate Order System{% endblock %}

{% block meta_description %}Kitchen display system for managing and tracking orders{% endblock %}

{% block head_extra %}
<link rel="stylesheet" href="{{ url_for('static', filename='css/kitchen-view.css') }}">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
{% endblock %}

{% block content %}
<div class="kitchen-view">
    <h1>Kitchen View</h1>
    <p>This is a placeholder for the kitchen view.</p>
</div>
{% endblock %}
EOF

# Restart the server
echo "Restarting server..."
pkill -f "python run.py" || true
python run.py &

echo "Server issues fixed and server restarted."