import logging
import asyncio
import json
import base64
from typing import Dict, Any, Optional, List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, BackgroundTasks
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

# Track active Deepgram services by connection ID
active_deepgram_services = {}

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
                if websocket.client_state.CONNECTED:
                    await manager.send_personal_message(data, websocket)
            except Exception as e:
                logger.error(f"Error in Deepgram callback: {e}")
        
        deepgram_service = DeepgramService(websocket_callback=deepgram_callback)
        
        # Store in active services
        active_deepgram_services[connection_id] = deepgram_service
        
        # Don't connect to Deepgram immediately. Wait for first audio chunk.
        logger.info(f"WebSocket {connection_id} ready. Waiting for audio or commands.")

        # Main WebSocket loop
        while True:
            # Receive message from client with timeout
            try:
                data = await asyncio.wait_for(websocket.receive(), timeout=60.0)
            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                await manager.send_personal_message({"type": "ping"}, websocket)
                continue
            
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
                        # End of audio stream - DO NOT disconnect Deepgram here.
                        # Keep it open for subsequent recordings on the same WebSocket connection.
                        logger.info(f"Received 'end' signal for {connection_id}. Deepgram connection remains open.")
                        await manager.send_personal_message(
                            {"type": "end", "status": "received"}, # Acknowledge end signal
                            websocket
                        )
                    
                    elif message_type == "table_context":
                        # Store table context in connection metadata
                        table_id = message.get("table_id")
                        seat_number = message.get("seat_number")
                        
                        if table_id:
                            metadata = manager.connection_metadata.get(websocket, {})
                            metadata["table_id"] = table_id
                            if seat_number:
                                metadata["seat_number"] = seat_number
                            manager.connection_metadata[websocket] = metadata
                            
                            logger.info(f"Set table context for {connection_id}: table={table_id}, seat={seat_number}")
                    
                except json.JSONDecodeError:
                    logger.warning(f"Received invalid JSON: {data['text']}")
                except Exception as e:
                    logger.error(f"Error processing text message: {e}")
            
            elif "bytes" in data:
                # Binary data (audio)
                audio_chunk = data["bytes"]
                audio_size = len(audio_chunk)

                # Connect to Deepgram on first audio chunk if not already connected
                if not deepgram_service or not deepgram_service.is_connected:
                    try:
                        logger.info(f"First audio chunk received ({audio_size} bytes). Ensuring Deepgram connection for {connection_id}")
                        await manager.send_personal_message(
                            {"type": "dg_status", "status": "connecting"},
                            websocket
                        )
                        if not deepgram_service: # Initialize if it doesn't exist
                             logger.info(f"Initializing DeepgramService for {connection_id}")
                             deepgram_service = DeepgramService(websocket_callback=deepgram_callback)
                             active_deepgram_services[connection_id] = deepgram_service

                        # Explicitly await connection and check status
                        await deepgram_service.connect() # This handles connection/reconnection attempts internally

                        if not deepgram_service.is_connected:
                             # Connection failed even after attempts within connect()
                             logger.error(f"Failed to establish Deepgram connection for {connection_id} after connect() call.")
                             await manager.send_personal_message(
                                 {"type": "error", "message": "Could not connect to speech service."},
                                 websocket
                             )
                             continue # Skip sending this chunk if connection failed
                        else:
                             logger.info(f"Deepgram connected successfully for {connection_id}")
                             await manager.send_personal_message(
                                 {"type": "dg_status", "status": "connected"},
                                 websocket
                             )

                    except Exception as e:
                        logger.error(f"Error ensuring Deepgram connection on first audio chunk: {e}")
                        await manager.send_personal_message(
                            {"type": "error", "message": f"Error connecting to speech service: {e}"},
                            websocket
                        )
                        # Attempt to clean up if service was created but failed to connect fully
                        if deepgram_service and not deepgram_service.is_connected:
                            await cleanup_connection(connection_id, deepgram_service)
                            deepgram_service = None # Ensure it's reset
                        continue # Skip sending this chunk

                # Send the audio chunk ONLY if we are sure we are connected
                if deepgram_service and deepgram_service.is_connected:
                    try:
                        success = await deepgram_service.send_audio(audio_chunk)
                        if not success:
                            logger.warning(f"Failed to send audio chunk ({audio_size} bytes) to Deepgram for {connection_id}")
                            # Let DeepgramService error handling manage potential disconnects
                    except Exception as e:
                        logger.error(f"Error sending audio chunk to Deepgram: {e}")
                        # Let DeepgramService error handling manage potential disconnects
                else:
                     # This case should ideally not be reached if the connection logic above is sound
                     logger.warning(f"Received audio ({audio_size} bytes) but Deepgram is not connected for {connection_id}. Skipping send.")
    
    except WebSocketDisconnect:
        # Client disconnected
        logger.info(f"WebSocket client disconnected: {connection_id}")
        await cleanup_connection(connection_id, deepgram_service)
    
    except Exception as e:
        # Unexpected error
        logger.error(f"Error in WebSocket connection: {e}")
        await cleanup_connection(connection_id, deepgram_service)

async def cleanup_connection(connection_id: str, deepgram_service=None):
    """Clean up resources when a connection ends"""
    # Clean up Deepgram connection
    if deepgram_service and deepgram_service.is_connected:
        try:
            await deepgram_service.disconnect()
            logger.info(f"Deepgram connection closed for {connection_id}")
        except Exception as e:
            logger.error(f"Error disconnecting from Deepgram: {e}")
    
    # Remove from active services
    if connection_id in active_deepgram_services:
        del active_deepgram_services[connection_id]

@router.post("/api/v1/speech/transcribe")
async def transcribe_audio(request_data: Dict[str, Any], background_tasks: BackgroundTasks):
    """
    REST API endpoint for transcribing audio data.
    
    Args:
        request_data: Dictionary containing audio_data (base64 encoded), format, and optional context
        
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
        
        # Get table context if provided
        table_id = request_data.get("table_id")
        seat_number = request_data.get("seat_number")
        
        # Process audio data
        result = await speech_service.process_audio_data(
            audio_data, 
            table_id=table_id, 
            seat_number=seat_number
        )
        
        # Check for success
        if not result.get("success", False):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Unknown error")
            )
        
        # Add cleanup to background task
        if "temp_file_path" in result:
            background_tasks.add_task(cleanup_temp_file, result["temp_file_path"])
            # Remove path from result before returning
            del result["temp_file_path"]
        
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

async def cleanup_temp_file(file_path: str):
    """Clean up temporary file in background"""
    import os
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.debug(f"Removed temporary file: {file_path}")
    except Exception as e:
        logger.error(f"Error removing temporary file {file_path}: {e}")
