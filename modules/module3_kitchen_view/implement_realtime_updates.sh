#!/bin/bash

# Task: Implement Realtime Updates
# This script implements WebSocket-based real-time updates for the kitchen view

echo "Starting task: Implement Realtime Updates"
echo "========================================"

# Set up variables
PROJECT_ROOT="$(pwd)"
JS_DIR="$PROJECT_ROOT/app/static/js"
KITCHEN_VIEW_JS="$JS_DIR/kitchen-view.js"
API_DIR="$PROJECT_ROOT/app/api"
WEBSOCKET_PY="$API_DIR/websocket.py"

# Create WebSocket API endpoint
echo "Creating WebSocket API endpoint..."
cat > "$WEBSOCKET_PY" << 'EOF'
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import List, Dict
import json
import asyncio
from datetime import datetime

router = APIRouter()

# Store active connections
class ConnectionManager:
    def __init__(self):
        # Store connections by client type
        self.active_connections: Dict[str, List[WebSocket]] = {
            "kitchen": [],
            "server": []
        }
    
    async def connect(self, websocket: WebSocket, client_type: str):
        await websocket.accept()
        if client_type not in self.active_connections:
            self.active_connections[client_type] = []
        self.active_connections[client_type].append(websocket)
    
    def disconnect(self, websocket: WebSocket, client_type: str):
        if client_type in self.active_connections:
            if websocket in self.active_connections[client_type]:
                self.active_connections[client_type].remove(websocket)
    
    async def broadcast_to_type(self, message: str, client_type: str):
        if client_type in self.active_connections:
            for connection in self.active_connections[client_type]:
                try:
                    await connection.send_text(message)
                except Exception:
                    # Connection might be closed or invalid
                    pass
    
    async def broadcast(self, message: str):
        # Broadcast to all client types
        for client_type in self.active_connections:
            await self.broadcast_to_type(message, client_type)

# Create connection manager instance
manager = ConnectionManager()

@router.websocket("/ws/kitchen")
async def websocket_kitchen_endpoint(websocket: WebSocket):
    await manager.connect(websocket, "kitchen")
    try:
        # Send initial connection message
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "message": "Connected to kitchen WebSocket",
            "timestamp": datetime.now().isoformat()
        }))
        
        while True:
            # Wait for messages from the client
            data = await websocket.receive_text()
            
            try:
                # Parse the message
                message_data = json.loads(data)
                message_type = message_data.get("type", "")
                
                # Handle different message types
                if message_type == "order_update":
                    # Broadcast order update to all clients
                    await manager.broadcast(data)
                elif message_type == "order_flag":
                    # Broadcast order flag to all clients
                    await manager.broadcast(data)
                elif message_type == "ping":
                    # Respond to ping with pong
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    }))
            except json.JSONDecodeError:
                # Invalid JSON, ignore
                pass
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, "kitchen")
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
        manager.disconnect(websocket, "kitchen")

@router.websocket("/ws/server")
async def websocket_server_endpoint(websocket: WebSocket):
    await manager.connect(websocket, "server")
    try:
        # Send initial connection message
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "message": "Connected to server WebSocket",
            "timestamp": datetime.now().isoformat()
        }))
        
        while True:
            # Wait for messages from the client
            data = await websocket.receive_text()
            
            try:
                # Parse the message
                message_data = json.loads(data)
                message_type = message_data.get("type", "")
                
                # Handle different message types
                if message_type == "order_update":
                    # Broadcast order update to all clients
                    await manager.broadcast(data)
                elif message_type == "table_update":
                    # Broadcast table update to server clients
                    await manager.broadcast_to_type(data, "server")
                elif message_type == "ping":
                    # Respond to ping with pong
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    }))
            except json.JSONDecodeError:
                # Invalid JSON, ignore
                pass
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, "server")
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
        manager.disconnect(websocket, "server")

# Heartbeat task to keep connections alive
@router.on_event("startup")
async def startup_event():
    asyncio.create_task(heartbeat())

async def heartbeat():
    while True:
        try:
            heartbeat_message = json.dumps({
                "type": "heartbeat",
                "timestamp": datetime.now().isoformat()
            })
            await manager.broadcast(heartbeat_message)
        except Exception as e:
            print(f"Heartbeat error: {str(e)}")
        
        # Send heartbeat every 30 seconds
        await asyncio.sleep(30)
EOF
echo "WebSocket API endpoint created."

# Update __init__.py to include the WebSocket router
if ! grep -q "from app.api import websocket" "$API_DIR/__init__.py"; then
    echo "Updating API __init__.py to include WebSocket router..."
    echo "from app.api import websocket" >> "$API_DIR/__init__.py"
    echo "API __init__.py updated."
fi

# Update main.py to include the WebSocket router
if ! grep -q "app.include_router(websocket.router" "$PROJECT_ROOT/main.py"; then
    echo "Updating main.py to include WebSocket router..."
    
    # Find the line where routers are included
    ROUTER_LINE=$(grep -n "app.include_router" "$PROJECT_ROOT/main.py" | head -1 | cut -d: -f1)
    
    # Insert the new router after the last router
    sed -i '' "${ROUTER_LINE}a\\
# Include WebSocket router\\
app.include_router(websocket.router)\\
" "$PROJECT_ROOT/main.py"
    
    echo "main.py updated with WebSocket router."
fi

# Update the kitchen-view.js file to implement WebSocket connection
echo "Updating kitchen-view.js with WebSocket implementation..."

# Find the setupWebSocketConnection function and replace it
sed -i '' '/setupWebSocketConnection() {/,/}/c\
    /**\
     * Set up WebSocket connection for real-time updates\
     */\
    setupWebSocketConnection() {\
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";\
        const wsUrl = `${protocol}//${window.location.host}/ws/kitchen`;\
        \
        this.socket = new WebSocket(wsUrl);\
        \
        this.socket.onopen = () => {\
            console.log("WebSocket connection established");\
            this.updateConnectionStatus("Connected", "connected");\
            \
            // Set up ping interval to keep connection alive\
            this.pingInterval = setInterval(() => {\
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {\
                    this.socket.send(JSON.stringify({\
                        type: "ping",\
                        timestamp: new Date().toISOString()\
                    }));\
                }\
            }, 25000);\
        };\
        \
        this.socket.onmessage = (event) => {\
            try {\
                const data = JSON.parse(event.data);\
                \
                // Handle different message types\
                switch (data.type) {\
                    case "connection_established":\
                        console.log("WebSocket connection established:", data.message);\
                        break;\
                    \
                    case "order_update":\
                        // Refresh orders data\
                        this.loadOrders();\
                        // Show notification\
                        this.showNotification(`Order #${data.order_id} updated to ${data.status.replace("_", " ")}`);\
                        break;\
                    \
                    case "order_flag":\
                        // Refresh orders data\
                        this.loadOrders();\
                        // Show notification\
                        this.showNotification(`Order #${data.order_id} has been flagged`);\
                        break;\
                    \
                    case "heartbeat":\
                        // Heartbeat received, connection is alive\
                        console.log("Heartbeat received");\
                        break;\
                    \
                    case "pong":\
                        // Pong received in response to ping\
                        console.log("Pong received");\
                        break;\
                }\
            } catch (error) {\
                console.error("Error handling WebSocket message:", error);\
            }\
        };\
        \
        this.socket.onclose = (event) => {\
            console.log("WebSocket connection closed:", event.code, event.reason);\
            this.updateConnectionStatus("Disconnected", "error");\
            \
            // Clear ping interval\
            if (this.pingInterval) {\
                clearInterval(this.pingInterval);\
            }\
            \
            // Try to reconnect after 5 seconds\
            setTimeout(() => {\
                this.setupWebSocketConnection();\
            }, 5000);\
        };\
        \
        this.socket.onerror = (error) => {\
            console.error("WebSocket error:", error);\
            this.updateConnectionStatus("Connection Error", "error");\
        };\
    }' "$KITCHEN_VIEW_JS"

# Add WebSocket message sending to updateOrderStatus method
sed -i '' '/this.showNotification(`Order #${orderId} status updated to ${status.replace(.._., . .)}`);\
/a\
            \
            // Send update via WebSocket\
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {\
                this.socket.send(JSON.stringify({\
                    type: "order_update",\
                    order_id: orderId,\
                    status: status,\
                    timestamp: new Date().toISOString()\
                }));\
            }' "$KITCHEN_VIEW_JS"

# Add WebSocket message sending to submitFlagOrder method
sed -i '' '/this.showNotification(.Order flagged successfully.);\
/a\
            \
            // Send update via WebSocket\
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {\
                this.socket.send(JSON.stringify({\
                    type: "order_flag",\
                    order_id: this.currentOrderToFlag,\
                    flag: flagMessage,\
                    timestamp: new Date().toISOString()\
                }));\
            }' "$KITCHEN_VIEW_JS"

echo "kitchen-view.js updated with WebSocket implementation."

echo "Task completed: Implement Realtime Updates"
exit 0