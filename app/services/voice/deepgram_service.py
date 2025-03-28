import asyncio
import os
import logging
from dotenv import load_dotenv
# Reverting import path to deepgram.clients.live for v2.x SDK structure
from deepgram.clients.live import DeepgramClientOptions, AsyncLiveClient, LiveOptions, LiveTranscriptionEvents # Changed import path

load_dotenv()

# Use environment variable or the key provided (replace in production)
API_KEY = os.getenv("DEEPGRAM_API_KEY", "77219de006785c35a26e4cd555c8f56bbbe61b69")

logger = logging.getLogger(__name__)

class DeepgramService:
    def __init__(self, websocket_callback):
        """
        Initializes the DeepgramService.

        Args:
            websocket_callback: An async function to call when a transcript is received from Deepgram.
                                It should accept a single argument: the transcript data (dict).
        """
        if not API_KEY:
            logger.error("DEEPGRAM_API_KEY not set.")
            raise ValueError("DEEPGRAM_API_KEY environment variable is not set.")

        self.websocket_callback = websocket_callback
        # self.dg_client = None # No longer using the main client instance directly for connection
        self.dg_connection = None # This will be the AsyncLiveClient instance
        self.is_connected = False

        # Configure Deepgram client options, including the API key
        self.config: DeepgramClientOptions = DeepgramClientOptions(
            verbose=logging.DEBUG, # Log Deepgram SDK details
            api_key=API_KEY
        )
        # No need to initialize DeepgramClient here anymore
        logger.info("DeepgramService initialized with config.")

    async def connect(self):
        """Establishes a streaming connection to Deepgram."""
        if self.is_connected:
            logger.warning("Already connected to Deepgram.")
            return

        try:
            # Initialize AsyncLiveClient directly using the config
            self.dg_connection = AsyncLiveClient(self.config)

            # Define event handlers
            async def on_message(connection, result, **kwargs): # Renamed first arg for clarity
                transcript = result.channel.alternatives[0].transcript
                if len(transcript) > 0:
                    logger.debug(f"Deepgram transcript received: {transcript}")
                    await self.websocket_callback({"type": "transcript", "data": transcript})

            async def on_metadata(self, metadata, **kwargs):
                logger.info(f"Deepgram metadata received: {metadata}")
                await self.websocket_callback({"type": "metadata", "data": metadata})


            async def on_speech_started(self, speech_started, **kwargs):
                logger.info("Deepgram speech_started received")
                await self.websocket_callback({"type": "speech_started"})


            async def on_utterance_end(self, utterance_end, **kwargs):
                logger.info("Deepgram utterance_end received")
                await self.websocket_callback({"type": "utterance_end"})


            async def on_error(self, error, **kwargs):
                logger.error(f"Deepgram error: {error}")
                await self.websocket_callback({"type": "error", "data": str(error)})
                self.is_connected = False # Assume connection is lost on error

            async def on_open(self, open, **kwargs):
                logger.info("Deepgram connection opened.")
                self.is_connected = True
                await self.websocket_callback({"type": "dg_open"})

            async def on_close(self, close, **kwargs):
                logger.info("Deepgram connection closed.")
                self.is_connected = False
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
            # Important: encoding, sample_rate, channels must match the audio stream
            # We might need frontend processing (Web Audio API) if browser doesn't support this directly
            options: LiveOptions = LiveOptions(
                model="nova-2", # Or choose another model
                language="en-US",
                encoding="linear16", # Requires 16-bit PCM audio
                sample_rate=16000,   # Requires 16kHz sample rate
                channels=1,
                interim_results=True, # Get results faster
                utterance_end_ms="1000",
                vad_events=True,
            )

            await self.dg_connection.start(options)
            logger.info("Deepgram connection started with options.")

        except Exception as e:
            logger.error(f"Error connecting to Deepgram: {e}")
            self.is_connected = False
            raise

    async def send_audio(self, audio_chunk: bytes):
        """Sends an audio chunk to the active Deepgram connection."""
        if not self.is_connected or not self.dg_connection:
            logger.warning("Cannot send audio, not connected to Deepgram.")
            return
        try:
            await self.dg_connection.send(audio_chunk)
            # logger.debug(f"Sent {len(audio_chunk)} bytes to Deepgram.") # Can be very verbose
        except Exception as e:
            logger.error(f"Error sending audio to Deepgram: {e}")

    async def disconnect(self):
        """Closes the Deepgram connection."""
        if self.dg_connection:
            logger.info("Closing Deepgram connection.")
            await self.dg_connection.finish()
            self.dg_connection = None
            self.is_connected = False
            logger.info("Deepgram connection finished.")