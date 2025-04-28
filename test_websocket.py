import asyncio
import websockets
import json
import sys

async def test_websocket():
    """Test WebSocket connection to debug endpoint"""
    uri = "ws://localhost:8000/ws/debug"
    
    print(f"Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket server")
            
            # Wait for initial welcome message
            response = await websocket.recv()
            print(f"Received: {response}")
            
            # Send a test message
            test_message = {"type": "test", "message": "Hello from test client"}
            print(f"Sending: {test_message}")
            await websocket.send(json.dumps(test_message))
            
            # Wait for echo response
            response = await websocket.recv()
            print(f"Received echo: {response}")
            
            # Try the actual endpoint
            print("\nNow testing the actual speech endpoint...")
            print("This will likely fail if permissions aren't granted in browser")
            
            # Keep connection open for a moment
            await asyncio.sleep(1)
            
            print("WebSocket connection test successful!")
            
    except Exception as e:
        print(f"Error: {e}")
        return False
    
    return True

async def test_listen_websocket():
    """Test WebSocket connection to listen endpoint"""
    uri = "ws://localhost:8000/ws/listen"
    
    print(f"Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to listen WebSocket endpoint")
            
            # Wait for initial connection message
            response = await websocket.recv()
            print(f"Received: {response}")
            
            # Send a test message
            test_message = {"type": "ping"}
            print(f"Sending: {test_message}")
            await websocket.send(json.dumps(test_message))
            
            # Wait for response
            response = await websocket.recv()
            print(f"Received: {response}")
            
            # Keep connection open for a moment
            await asyncio.sleep(1)
            
            print("Listen WebSocket connection test successful!")
            
    except Exception as e:
        print(f"Error testing listen endpoint: {e}")
        return False
    
    return True

if __name__ == "__main__":
    # Run both tests sequentially
    loop = asyncio.get_event_loop()
    debug_success = loop.run_until_complete(test_websocket())
    listen_success = loop.run_until_complete(test_listen_websocket())
    
    # Print summary
    print("\nTest Summary:")
    print(f"Debug WebSocket: {'SUCCESS' if debug_success else 'FAILED'}")
    print(f"Listen WebSocket: {'SUCCESS' if listen_success else 'FAILED'}")
    
    # Exit with appropriate code
    sys.exit(0 if debug_success and listen_success else 1) 