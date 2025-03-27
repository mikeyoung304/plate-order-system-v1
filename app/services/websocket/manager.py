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
