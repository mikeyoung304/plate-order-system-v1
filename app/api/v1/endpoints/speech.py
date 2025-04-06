import logging
import asyncio
import json
import base64
from typing import Dict, Any, Optional, List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from app.websockets.connection_manager import ConnectionManager
from app.domain.services.speech_service import SpeechService
from app.domain.services.deepgram_service import DeepgramService

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Initialize connection manager
manager = ConnectionManager()

# Initialize speech service
speech_service = SpeechService()

@router.websocket("/ws/listen")
async def websocket_listen_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time audio streaming and transcription.
    
    This endpoint handles:
    1. Audio streaming from client to server
    2. Real-time transcription using Deepgram
    3. Sending transcription results back to client
    """
    # Connection ID for this specific connection
    connection_id = f"listen_{id(websocket)}"
    
    # Deepgram service instance for this connection
    deepgram_service = None
    
    # Accept the WebSocket connection
    await manager.connect(
        websocket, 
        connection_type="server", 
        metadata={"connection_id": connection_id, "type": "listen"}
    )
    
    try:
        # Send initial connection confirmation
        await manager.send_personal_message(
            {"type": "connection", "status": "connected", "message": "Ready to receive audio"}, 
            websocket
        )
        
        # Initialize Deepgram service with callback
        async def deepgram_callback(data: Dict[str, Any]):
            """Callback function for Deepgram transcription events"""
            try:
                await manager.send_personal_message(data, websocket)
            except Exception as e:
                logger.error(f"Error in Deepgram callback: {e}")
        
        deepgram_service = DeepgramService(websocket_callback=deepgram_callback)
        
        # Connect to Deepgram
        try:
            await deepgram_service.connect()
            logger.info(f"Deepgram connection established for {connection_id}")
        except Exception as e:
            logger.error(f"Failed to connect to Deepgram: {e}")
            await manager.send_personal_message(
                {"type": "error", "message": f"Failed to connect to speech service: {str(e)}"}, 
                websocket
            )
        
        # Main WebSocket loop
        while True:
            # Receive message from client
            data = await websocket.receive()
            
            # Handle different message types
            if "text" in data:
                # Text message (commands, etc.)
                try:
                    message = json.loads(data["text"])
                    message_type = message.get("type", "")
                    
                    if message_type == "ping":
                        # Respond to ping
                        await manager.send_personal_message({"type": "pong"}, websocket)
                    
                    elif message_type == "end":
                        # End of audio stream
                        if deepgram_service and deepgram_service.is_connected:
                            await deepgram_service.disconnect()
                            logger.info(f"Deepgram connection closed for {connection_id}")
                        
                        await manager.send_personal_message(
                            {"type": "end", "status": "success"}, 
                            websocket
                        )
                    
                except json.JSONDecodeError:
                    logger.warning(f"Received invalid JSON: {data['text']}")
                except Exception as e:
                    logger.error(f"Error processing text message: {e}")
            
            elif "bytes" in data:
                # Binary data (audio)
                if deepgram_service and deepgram_service.is_connected:
                    try:
                        # Send audio chunk to Deepgram
                        success = await deepgram_service.send_audio(data["bytes"])
                        if not success:
                            logger.warning(f"Failed to send audio chunk to Deepgram for {connection_id}")
                    except Exception as e:
                        logger.error(f"Error sending audio to Deepgram: {e}")
                else:
                    logger.warning(f"Received audio but Deepgram is not connected for {connection_id}")
                    
                    # Try to reconnect
                    try:
                        if deepgram_service:
                            await deepgram_service.reconnect()
                            logger.info(f"Reconnected to Deepgram for {connection_id}")
                    except Exception as e:
                        logger.error(f"Failed to reconnect to Deepgram: {e}")
                        await manager.send_personal_message(
                            {"type": "error", "message": "Speech service disconnected. Please try again."}, 
                            websocket
                        )
    
    except WebSocketDisconnect:
        # Client disconnected
        logger.info(f"WebSocket client disconnected: {connection_id}")
        
        # Clean up Deepgram connection
        if deepgram_service and deepgram_service.is_connected:
            await deepgram_service.disconnect()
            logger.info(f"Deepgram connection closed for {connection_id}")
        
        # Remove from connection manager
        manager.disconnect(websocket)
    
    except Exception as e:
        # Unexpected error
        logger.error(f"Error in WebSocket connection: {e}")
        
        # Clean up Deepgram connection
        if deepgram_service and deepgram_service.is_connected:
            await deepgram_service.disconnect()
            logger.info(f"Deepgram connection closed for {connection_id}")
        
        # Remove from connection manager
        manager.disconnect(websocket)

@router.post("/api/v1/speech/transcribe")
async def transcribe_audio(request_data: Dict[str, Any]):
    """
    REST API endpoint for transcribing audio data.
    
    Args:
        request_data: Dictionary containing audio_data (base64 encoded) and format
        
    Returns:
        Transcription result
    """
    try:
        # Validate request data
        if "audio_data" not in request_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing audio_data field"
            )
        
        # Get audio data and format
        audio_data = request_data["audio_data"]
        audio_format = request_data.get("format", "wav")
        
        # Process audio data
        result = await speech_service.process_audio_data(audio_data)
        
        # Check for success
        if not result.get("success", False):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Unknown error")
            )
        
        # Return transcription result
        return JSONResponse(content=result)
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        # Log and return error
        logger.error(f"Error transcribing audio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error transcribing audio: {str(e)}"
        )
