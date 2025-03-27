import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:8001/ws/kitchen"
    async with websockets.connect(uri) as websocket:
        # Receive the welcome message
        response = await websocket.recv()
        print(f"Received: {response}")
        
        # Send a test message
        test_message = {
            "type": "order_update",
            "order": {
                "id": 4,
                "table_id": 2,
                "details": "1 burger, 1 fries",
                "status": "pending"
            }
        }
        await websocket.send(json.dumps(test_message))
        print(f"Sent: {json.dumps(test_message)}")
        
        # Wait for a response
        response = await websocket.recv()
        print(f"Received: {response}")
        
        # Wait a bit before closing
        await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(test_websocket())