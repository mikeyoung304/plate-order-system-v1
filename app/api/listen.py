import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from app.services.voice.deepgram_service import DeepgramService

router = APIRouter(prefix="/ws", tags=["listen"])
logger = logging.getLogger(__name__)

@router.websocket("/listen")
async def websocket_endpoint(websocket: WebSocket):
    """Handles WebSocket connection for real-time transcription."""
    await websocket.accept()
    logger.info(f"WebSocket connection accepted from {websocket.client.host}:{websocket.client.port}")

    deepgram_service = None

    async def forward_transcript_to_client(transcript_data: dict):
        """Callback to send Deepgram results back to the browser client."""
        try:
            await websocket.send_json(transcript_data)
        except Exception as e:
            logger.error(f"Error sending transcript to client: {e}")
            # Consider closing connection or notifying client

    try:
        # Initialize Deepgram service with the callback
        deepgram_service = DeepgramService(forward_transcript_to_client)
        await deepgram_service.connect()

        # Keep the connection open and forward audio data
        while True:
            data = await websocket.receive()

            if "bytes" in data:
                audio_chunk = data["bytes"]
                if deepgram_service and deepgram_service.is_connected:
                    await deepgram_service.send_audio(audio_chunk)
                else:
                    logger.warning("Received audio chunk but Deepgram is not connected.")
            elif "text" in data:
                # Handle potential text messages (e.g., end-of-stream signal)
                message = data["text"]
                logger.info(f"Received text message from client: {message}")
                if message == '{"type": "EOS"}': # Simple check for end-of-stream
                    logger.info("End-of-stream signal received from client.")
                    if deepgram_service:
                        await deepgram_service.disconnect()
                    break # Exit loop after EOS

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected by client {websocket.client.host}:{websocket.client.port}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        try:
            # Attempt to send an error message back to the client
            await websocket.send_json({"type": "error", "data": f"Server error: {e}"})
        except Exception:
            pass # Ignore if sending error fails (connection likely broken)
    finally:
        logger.info("Cleaning up WebSocket connection.")
        if deepgram_service:
            await deepgram_service.disconnect()
        # Ensure WebSocket is closed from server-side if not already
        try:
            await websocket.close()
            logger.info("WebSocket connection closed.")
        except Exception:
             logger.debug("WebSocket already closed or failed to close.")