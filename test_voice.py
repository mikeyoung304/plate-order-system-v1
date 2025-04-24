import asyncio
import websockets
import json

async def test_voice_recognition():
    uri = "ws://localhost:8000/ws/listen"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket server")
            
            # Wait for initial connection message
            response = await websocket.recv()
            print(f"Received: {response}")
            
            # Send a test message
            test_message = {"type": "ping"}
            await websocket.send(json.dumps(test_message))
            
            # Wait for response
            response = await websocket.recv()
            print(f"Received: {response}")
            
            print("WebSocket connection test successful!")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_voice_recognition()) 