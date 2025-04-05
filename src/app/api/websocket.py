from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from src.app.services.websocket.manager import manager
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
        await websocket.send_json(
            {"type": "connection_established", "message": f"Connected as {client_type}"}
        )

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
                await websocket.send_json(
                    {"type": "error", "message": "Invalid JSON format"}
                )
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_type)
