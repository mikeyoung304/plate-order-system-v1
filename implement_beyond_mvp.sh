#!/bin/bash

# Script to implement beyond-MVP features
LOG_DIR="./logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/beyond_mvp_$(date +%Y%m%d-%H%M%S).log"
touch "$LOG_FILE"

log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] [$1] $2" | tee -a "$LOG_FILE"
}

log "INFO" "Starting implementation of beyond-MVP features"

# 1. Advanced Voice Processing with OpenAI Whisper API
log "INFO" "Implementing advanced voice processing"
mkdir -p app/services/voice

# Create OpenAI Whisper service
cat > app/services/voice/whisper_service.py << 'EOF'
import os
import tempfile
import openai
from fastapi import UploadFile

class WhisperService:
    def __init__(self):
        openai.api_key = os.environ.get("OPENAI_API_KEY", "")
        self.model = "whisper-1"
    
    async def transcribe_audio(self, audio_file):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            with open(temp_file_path, "rb") as audio:
                response = openai.Audio.transcribe(model=self.model, file=audio)
            return {"text": response.get("text", "")}
        except Exception as e:
            return {"error": str(e)}
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
EOF

# Update speech API
cat > app/api/speech.py << 'EOF'
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.services.voice.whisper_service import WhisperService

router = APIRouter(prefix="/speech", tags=["speech"])

@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    whisper_service: WhisperService = Depends(lambda: WhisperService())
):
    result = await whisper_service.transcribe_audio(audio)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result
EOF

# Add OpenAI to requirements
if ! grep -q "openai" requirements.txt; then
    echo "openai==0.28.0" >> requirements.txt
fi

# 2. Real-time updates with WebSockets
log "INFO" "Implementing real-time updates with WebSockets"
mkdir -p app/services/websocket

# Create WebSocket manager
cat > app/services/websocket/manager.py << 'EOF'
from fastapi import WebSocket
from typing import List, Dict, Any
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        self.active_connections = {"kitchen": [], "server": [], "admin": []}
        self.message_history = {"kitchen": [], "server": [], "admin": []}
        self.history_limit = 20
    
    async def connect(self, websocket: WebSocket, client_type: str):
        await websocket.accept()
        if client_type not in self.active_connections:
            self.active_connections[client_type] = []
        self.active_connections[client_type].append(websocket)
        
        # Send message history
        if client_type in self.message_history:
            for message in self.message_history[client_type]:
                await websocket.send_json(message)
    
    def disconnect(self, websocket: WebSocket, client_type: str):
        if client_type in self.active_connections:
            if websocket in self.active_connections[client_type]:
                self.active_connections[client_type].remove(websocket)
    
    async def broadcast_to_type(self, message: Dict[str, Any], client_type: str):
        if client_type not in self.active_connections:
            return
        
        # Add timestamp
        message["timestamp"] = datetime.now().isoformat()
        
        # Store in history
        if client_type in self.message_history:
            self.message_history[client_type].append(message)
            if len(self.message_history[client_type]) > self.history_limit:
                self.message_history[client_type] = self.message_history[client_type][-self.history_limit:]
        
        # Send to all connected clients
        disconnected = []
        for connection in self.active_connections[client_type]:
            try:
                await connection.send_json(message)
            except:
                disconnected.append(connection)
        
        # Clean up disconnected clients
        for connection in disconnected:
            self.disconnect(connection, client_type)

# Create a global instance
manager = ConnectionManager()
EOF

# Create WebSocket routes
cat > app/api/websocket.py << 'EOF'
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket.manager import manager
import json

router = APIRouter()

@router.websocket("/ws/{client_type}")
async def websocket_endpoint(websocket: WebSocket, client_type: str):
    # Validate client type
    if client_type not in ["kitchen", "server", "admin"]:
        await websocket.close(code=1008, reason="Invalid client type")
        return
    
    # Accept connection
    await manager.connect(websocket, client_type)
    
    try:
        # Send welcome message
        await websocket.send_json({"type": "connection_established", "message": f"Connected as {client_type}"})
        
        # Listen for messages
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                message["source"] = client_type
                
                # Process message based on type
                if message.get("type") == "order_update":
                    await manager.broadcast_to_type(message, "kitchen")
                    await manager.broadcast_to_type(message, "admin")
                elif message.get("type") == "order_status":
                    await manager.broadcast_to_type(message, "server")
                    await manager.broadcast_to_type(message, "admin")
                else:
                    await websocket.send_json({"type": "echo", "message": message})
            except:
                await websocket.send_json({"type": "error", "message": "Invalid JSON format"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_type)
EOF

# Update main.py to include WebSocket routes
if ! grep -q "from app.api import websocket" main.py; then
    # Find the line where we import other routers
    IMPORT_LINE=$(grep -n "from app.api import" main.py | head -1 | cut -d: -f1)
    
    # Add the websocket import
    sed -i '' "${IMPORT_LINE}a\\
from app.api import websocket
" main.py
    
    # Find the line where we include other routers
    INCLUDE_LINE=$(grep -n "app.include_router" main.py | tail -1 | cut -d: -f1)
    
    # Add the websocket router
    sed -i '' "${INCLUDE_LINE}a\\
app.include_router(websocket.router)
" main.py
fi

# 3. Enhanced Admin Dashboard
log "INFO" "Implementing enhanced admin dashboard"

# Create admin API endpoints
cat > app/api/admin.py << 'EOF'
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Order, OrderStatus
from datetime import datetime, timedelta

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    # Count total orders today
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)
    total_orders_today = db.query(Order).filter(
        Order.created_at >= today,
        Order.created_at < tomorrow
    ).count()
    
    # Calculate average preparation time
    completed_orders = db.query(Order).filter(
        Order.status == OrderStatus.COMPLETED,
        Order.completed_at.isnot(None)
    ).all()
    
    avg_prep_time = 0
    if completed_orders:
        total_prep_time = sum((order.completed_at - order.created_at).total_seconds() / 60 for order in completed_orders)
        avg_prep_time = round(total_prep_time / len(completed_orders), 1)
    
    return {
        "total_orders_today": total_orders_today,
        "avg_prep_time": avg_prep_time
    }
EOF

# Update main.py to include admin routes
if ! grep -q "from app.api import admin" main.py; then
    # Find the line where we import other routers
    IMPORT_LINE=$(grep -n "from app.api import" main.py | head -1 | cut -d: -f1)
    
    # Add the admin import
    sed -i '' "${IMPORT_LINE}a\\
from app.api import admin
" main.py
    
    # Find the line where we include other routers
    INCLUDE_LINE=$(grep -n "app.include_router" main.py | tail -1 | cut -d: -f1)
    
    # Add the admin router
    sed -i '' "${INCLUDE_LINE}a\\
app.include_router(admin.router)
" main.py
fi

# 4. Security Enhancements
log "INFO" "Implementing security enhancements"
mkdir -p app/security

# Create authentication service
cat > app/security/auth.py << 'EOF'
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets
import os

security = HTTPBasic()

def get_current_user(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = os.environ.get("ADMIN_USERNAME", "admin")
    correct_password = os.environ.get("ADMIN_PASSWORD", "password")
    
    is_correct_username = secrets.compare_digest(credentials.username, correct_username)
    is_correct_password = secrets.compare_digest(credentials.password, correct_password)
    
    if not (is_correct_username and is_correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username
EOF

# Add environment variables for authentication
if ! grep -q "ADMIN_USERNAME" .env 2>/dev/null; then
    echo "ADMIN_USERNAME=admin" >> .env
    echo "ADMIN_PASSWORD=password" >> .env
fi

log "SUCCESS" "Beyond-MVP features implementation completed"
echo "All beyond-MVP features have been implemented successfully!"
