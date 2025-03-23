import os
import logging
from typing import Optional, List
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Plate Order System")

# Mount static files directory
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Templates configuration
templates = Jinja2Templates(directory="app/templates")

# API key from environment variable
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY not set in environment variables")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

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

# API models
class OrderItem(BaseModel):
    item: str
    quantity: int
    notes: Optional[str] = None

class Order(BaseModel):
    table: str
    items: List[OrderItem]

# API endpoint for processing audio - adjust based on your Whisper API implementation
@app.post("/process_audio")
async def process_audio(request: Request):
    try:
        # Add your Whisper API code here
        # This is a placeholder for your actual implementation
        form_data = await request.form()
        audio_file = form_data.get("audio")
        
        # Process with Whisper API
        # result = your_whisper_api_function(audio_file)
        
        # Placeholder response
        result = "Placeholder transcription"
        
        return {"transcription": result}
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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
