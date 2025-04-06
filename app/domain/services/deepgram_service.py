import asyncio
import logging
import os
from typing import Optional, Dict, Any, Callable

from app.core.config import settings

logger = logging.getLogger(__name__)

class DeepgramService:
    """
    Enhanced service for Deepgram speech-to-text transcription.
    Optimized for assisted living facility voice ordering system.
    """
    
    def __init__(self, websocket_callback=None):
        """
        Initialize the DeepgramService.

        Args:
            websocket_callback: An async function to call when a transcript is received from Deepgram.
                                It should accept a single argument: the transcript data (dict).
        """
        self.api_key = settings.DEEPGRAM_API_KEY
        if not self.api_key:
            logger.error("DEEPGRAM_API_KEY not set.")
            raise ValueError("DEEPGRAM_API_KEY environment variable is not set.")

        self.websocket_callback = websocket_callback
        self.dg_connection = None
        self.is_connected = False
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 5
        self.reconnect_delay = 2  # seconds
        self.connection_timeout = 10  # seconds
        self.connection_timer = None

        # Import here to avoid circular imports
        try:
            from deepgram import DeepgramClientOptions, AsyncLiveClient
            # Configure Deepgram client options, including the API key
            self.config = DeepgramClientOptions(
                verbose=logging.DEBUG if settings.DEBUG else logging.INFO,
                api_key=self.api_key
            )
            logger.info("DeepgramService initialized with config.")
        except ImportError:
            logger.error("Deepgram SDK not installed. Please install with 'pip install deepgram-sdk'")
            raise

    async def connect(self):
        """Establishes a streaming connection to Deepgram."""
        if self.is_connected:
            logger.warning("Already connected to Deepgram.")
            return

        try:
            # Set connection timeout
            self.connection_timer = asyncio.create_task(self._connection_timeout())
            
            # Import here to avoid circular imports
            from deepgram import AsyncLiveClient, LiveOptions, LiveTranscriptionEvents
            
            # Initialize AsyncLiveClient directly using the config
            self.dg_connection = AsyncLiveClient(self.config)

            # Define event handlers
            async def on_message(connection, result, **kwargs):
                try:
                    transcript = result.channel.alternatives[0].transcript
                    if len(transcript) > 0:
                        logger.debug(f"Deepgram transcript received: {transcript}")
                        if self.websocket_callback:
                            await self.websocket_callback({"type": "transcript", "data": transcript})
                except Exception as e:
                    logger.error(f"Error processing transcript: {e}")

            async def on_metadata(self, metadata, **kwargs):
                logger.info(f"Deepgram metadata received: {metadata}")
                if self.websocket_callback:
                    await self.websocket_callback({"type": "metadata", "data": metadata})

            async def on_speech_started(self, speech_started, **kwargs):
                logger.info("Deepgram speech_started received")
                if self.websocket_callback:
                    await self.websocket_callback({"type": "speech_started"})

            async def on_utterance_end(self, utterance_end, **kwargs):
                logger.info("Deepgram utterance_end received")
                if self.websocket_callback:
                    await self.websocket_callback({"type": "utterance_end"})

            async def on_error(self, error, **kwargs):
                logger.error(f"Deepgram error: {error}")
                if self.websocket_callback:
                    await self.websocket_callback({"type": "error", "data": str(error)})
                self.is_connected = False
                # Attempt to reconnect
                if self.reconnect_attempts < self.max_reconnect_attempts:
                    self.reconnect_attempts += 1
                    logger.info(f"Attempting to reconnect to Deepgram (attempt {self.reconnect_attempts}/{self.max_reconnect_attempts})")
                    await asyncio.sleep(self.reconnect_delay)
                    await self.reconnect()
                else:
                    logger.error("Max reconnection attempts reached. Giving up.")
                    if self.websocket_callback:
                        await self.websocket_callback({"type": "error", "data": "Failed to reconnect to Deepgram after multiple attempts"})

            async def on_open(self, open, **kwargs):
                logger.info("Deepgram connection opened.")
                self.is_connected = True
                self.reconnect_attempts = 0  # Reset reconnect attempts on successful connection
                
                # Cancel connection timeout
                if self.connection_timer and not self.connection_timer.done():
                    self.connection_timer.cancel()
                
                if self.websocket_callback:
                    await self.websocket_callback({"type": "dg_open"})

            async def on_close(self, close, **kwargs):
                logger.info("Deepgram connection closed.")
                self.is_connected = False
                if self.websocket_callback:
                    await self.websocket_callback({"type": "dg_close"})

            # Assign event handlers
            self.dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
            self.dg_connection.on(LiveTranscriptionEvents.Metadata, on_metadata)
            self.dg_connection.on(LiveTranscriptionEvents.SpeechStarted, on_speech_started)
            self.dg_connection.on(LiveTranscriptionEvents.UtteranceEnd, on_utterance_end)
            self.dg_connection.on(LiveTranscriptionEvents.Error, on_error)
            self.dg_connection.on(LiveTranscriptionEvents.Open, on_open)
            self.dg_connection.on(LiveTranscriptionEvents.Close, on_close)

            # Configure Deepgram options for real-time transcription
            # Enhanced for better performance in assisted living environment
            options = LiveOptions(
                model="nova-2",  # Using the latest model for better accuracy
                language="en-US",
                encoding="linear16",  # Standard for web audio
                sample_rate=16000,
                channels=1,
                interim_results=True,  # Enable interim results for faster feedback
                utterance_end_ms="1000",
                vad_events=True,
                punctuate=True,
                smart_format=True,  # Enable smart formatting for better order structure
                diarize=False,  # No need for speaker identification in this context
            )

            await self.dg_connection.start(options)
            logger.info("Deepgram connection started with options.")

        except Exception as e:
            logger.error(f"Error connecting to Deepgram: {e}")
            self.is_connected = False
            
            # Cancel connection timeout
            if self.connection_timer and not self.connection_timer.done():
                self.connection_timer.cancel()
                
            if self.websocket_callback:
                await self.websocket_callback({"type": "error", "data": f"Failed to connect to Deepgram: {str(e)}"})
            raise

    async def _connection_timeout(self):
        """Handle connection timeout"""
        try:
            await asyncio.sleep(self.connection_timeout)
            if not self.is_connected:
                logger.error("Deepgram connection timeout")
                if self.websocket_callback:
                    await self.websocket_callback({"type": "error", "data": "Connection timeout"})
        except asyncio.CancelledError:
            # This is expected when the connection succeeds
            pass
        except Exception as e:
            logger.error(f"Error in connection timeout handler: {e}")

    async def reconnect(self):
        """Attempts to reconnect to Deepgram after a connection failure."""
        try:
            if self.dg_connection:
                await self.dg_connection.finish()
                self.dg_connection = None
            await self.connect()
        except Exception as e:
            logger.error(f"Error reconnecting to Deepgram: {e}")
            self.is_connected = False
            if self.websocket_callback:
                await self.websocket_callback({"type": "error", "data": f"Reconnection failed: {str(e)}"})

    async def send_audio(self, audio_chunk: bytes) -> bool:
        """
        Sends an audio chunk to the active Deepgram connection.
        
        Args:
            audio_chunk: Audio data bytes
            
        Returns:
            bool: True if sent successfully, False otherwise
        """
        if not self.is_connected or not self.dg_connection:
            logger.warning("Cannot send audio, not connected to Deepgram.")
            return False
        try:
            await self.dg_connection.send(audio_chunk)
            return True
        except Exception as e:
            logger.error(f"Error sending audio to Deepgram: {e}")
            # Try to reconnect on send failure
            try:
                await self.reconnect()
            except Exception as reconnect_error:
                logger.error(f"Failed to reconnect after send error: {reconnect_error}")
            return False

    async def disconnect(self):
        """Closes the Deepgram connection."""
        if self.dg_connection:
            logger.info("Closing Deepgram connection.")
            try:
                await self.dg_connection.finish()
            except Exception as e:
                logger.error(f"Error closing Deepgram connection: {e}")
            finally:
                self.dg_connection = None
                self.is_connected = False
                
        # Cancel connection timeout if active
        if self.connection_timer and not self.connection_timer.done():
            self.connection_timer.cancel()
            
    async def transcribe_file(self, file_path: str) -> Dict[str, Any]:
        """
        Transcribe an audio file using Deepgram's prerecorded API.
        
        Args:
            file_path: Path to the audio file
            
        Returns:
            Dict containing transcription result
        """
        try:
            # Check if file exists and has content
            if not os.path.exists(file_path):
                logger.error(f"File not found: {file_path}")
                return {
                    "success": False,
                    "error": f"File not found: {file_path}"
                }
                
            file_size = os.path.getsize(file_path)
            if file_size == 0:
                logger.error(f"File is empty: {file_path}")
                return {
                    "success": False,
                    "error": "Audio file is empty"
                }
            
            # Import here to avoid circular imports
            from deepgram import DeepgramClient, PrerecordedOptions
            
            client = DeepgramClient(self.api_key)
            
            with open(file_path, "rb") as audio:
                payload = {
                    "buffer": audio.read()
                }
            
            options = PrerecordedOptions(
                model="nova-2",
                smart_format=True,
                utterance_split=True,
                punctuate=True,
                language="en-US"
            )
            
            response = await client.listen.prerecorded.v("1").transcribe_file(payload, options)
            
            # Extract the transcription
            if response and response.results:
                transcription = response.results.channels[0].alternatives[0].transcript
                return {
                    "success": True,
                    "text": transcription,
                    "confidence": response.results.channels[0].alternatives[0].confidence
                }
            else:
                return {
                    "success": False,
                    "error": "No transcription results returned"
                }
                
        except Exception as e:
            logger.error(f"Error transcribing file with Deepgram: {e}")
            return {
                "success": False,
                "error": str(e)
            }
