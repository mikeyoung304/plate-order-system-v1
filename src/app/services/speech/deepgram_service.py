import logging

logger = logging.getLogger(__name__)  # Define logger at the top
import os
import asyncio
import re
from typing import Optional, Tuple
from dotenv import load_dotenv
import httpx


class MockAudioRecorder:
    async def record_audio(self, device_name=None):
        logger.warning("Using MockAudioRecorder: record_audio")
        return False, b""

    def list_audio_devices(self):
        logger.warning("Using MockAudioRecorder: list_audio_devices")
        return []


class MockDeepgramService:
    async def transcribe_audio(self, audio_data):
        logger.warning("Using MockDeepgramService: transcribe_audio")
        return None  # Or return mock transcription for testing

    async def validate_api_key(self):
        logger.warning("Using MockDeepgramService: validate_api_key")
        demo_key = os.getenv("DEEPGRAM_API_KEY") == "DEMO_KEY"
        return demo_key


# Attempt to import AudioRecorder
try:
    from src.app.services.voice.audio_recorder import AudioRecorder

    _real_audio_recorder_available = True
except ImportError as e:
    logger.warning(
        f"Real AudioRecorder not found (ImportError: {e}). Using mock AudioRecorder."
    )
    AudioRecorder = MockAudioRecorder  # Assign mock class
    _real_audio_recorder_available = False

# # Attempt to import Deepgram SDK - Bypassing SDK, using direct HTTP call
# try:
#     from deepgram import (
#         DeepgramClient,
#         DeepgramClientOptions,
#         PrerecordedOptions
#     )
#     _real_deepgram_sdk_available = True
# except ImportError as e:
#     logger.warning(f"Deepgram SDK not found (ImportError: {e}). Real transcription disabled.")
#     # Define dummy classes if Deepgram SDK is missing, to prevent NameErrors later if needed
#     class DeepgramClient: pass
#     class DeepgramClientOptions: pass
#     class PrerecordedOptions: pass
#     class PrerecordedClient: pass
#     _real_deepgram_sdk_available = False
_real_deepgram_sdk_available = False  # Set to False as we are bypassing SDK

try:
    from src.app.core.exceptions import (
        AudioProcessingError,
        TranscriptionError,
        ValidationError,
    )
except ImportError:
    # Define basic exceptions
    class AudioProcessingError(Exception):
        pass

    class TranscriptionError(Exception):
        pass

    class ValidationError(Exception):
        pass


# Force reload environment variables
load_dotenv()


# Try to import the REAL services, use mocks as fallback
class SpeechService:
    def __init__(self):
        # Check if we're in demo/mock mode
        self.demo_mode = os.getenv("DEEPGRAM_API_KEY") == "DEMO_KEY"
        if self.demo_mode:
            logger.warning(
                "SpeechService initialized in DEMO mode. Voice features limited."
            )

        # Initialize services using the potentially mocked classes
        self.audio_recorder = (
            AudioRecorder()
        )  # This will be MockAudioRecorder if real one failed import

        # # Initialize Deepgram client if SDK is available and not in demo mode - Bypassing SDK
        # self.deepgram_client = None
        # if _real_deepgram_sdk_available and not self.demo_mode:
        #     try:
        #         api_key = os.getenv("DEEPGRAM_API_KEY")
        #         if not api_key or api_key == "DEMO_KEY": # Check for actual key
        #             raise ValueError("Valid DEEPGRAM_API_KEY environment variable not set.")
        #
        #         # Correct instantiation for v3 SDK
        #         config: DeepgramClientOptions = DeepgramClientOptions(
        #             verbose=logging.DEBUG # Optional: Set logging level
        #         )
        #         self.deepgram_client = DeepgramClient(api_key, config)
        #         logger.info("Real Deepgram client initialized.")
        #     except Exception as e:
        #         logger.error(f"Failed to initialize real Deepgram client: {e}. Falling back.")
        #         self.deepgram_client = None # Ensure it's None on failure
        #         raise RuntimeError(f"Deepgram client initialization failed: {e}") # Re-raise exception
        #
        # if not self.deepgram_client and not self.demo_mode:
        #      logger.warning("Deepgram client could not be initialized. Transcription will likely fail.")
        # elif self.demo_mode:
        #      logger.info("Running in DEMO mode, Deepgram client not initialized.")

        # Store API key for direct HTTP call
        self.api_key = os.getenv("DEEPGRAM_API_KEY")
        if not self.api_key or self.api_key == "DEMO_KEY":
            logger.warning(
                "Valid DEEPGRAM_API_KEY not found. Real transcription will fail."
            )
            self.api_key = None  # Ensure it's None if invalid

        # Load configuration
        self.min_confidence = float(os.getenv("MIN_TRANSCRIPTION_CONFIDENCE", 0.7))
        self.max_retries = int(os.getenv("MAX_SPEECH_RETRIES", 3))
        self.max_audio_size = (
            int(os.getenv("MAX_AUDIO_SIZE_MB", 10)) * 1024 * 1024
        )  # Convert MB to bytes
        self.allowed_audio_types = ["audio/wav", "audio/mp3", "audio/mpeg"]
        self.retry_delay = float(os.getenv("RETRY_DELAY_SECONDS", 1.0))

        logger.info("SpeechService initialized")

    def validate_audio_file(self, audio_data: bytes) -> Tuple[bool, str]:
        """
        Validate audio file data

        Args:
            audio_data: Audio data in bytes

        Returns:
            Tuple[bool, str]: (is_valid, error_message)
        """
        try:
            # In demo mode, just return valid
            if self.demo_mode:
                return True, ""

            # Check if data is empty
            if not audio_data:
                return False, "Empty audio data"

            # Check file size
            if len(audio_data) > self.max_audio_size:
                return (
                    False,
                    f"Audio file too large: {len(audio_data)} bytes (max {self.max_audio_size} bytes)",
                )

            # Check audio format (basic check) - Removed strict WAV/MP3 check
            # Deepgram API supports more formats (WebM, Ogg, etc.)
            # Let Deepgram handle format validation.
            # if not audio_data.startswith(b'RIFF') and not audio_data.startswith(b'ID3'):
            #     return False, "Invalid audio format (must be WAV or MP3)"

            return True, ""
        except Exception as e:
            logger.error(f"Error validating audio file: {str(e)}")
            return False, f"Validation error: {str(e)}"

    def sanitize_text(self, text: str) -> str:
        """
        Sanitize transcribed text

        Args:
            text: Raw transcribed text

        Returns:
            str: Sanitized text
        """
        try:
            if not text:
                return ""

            # Remove any HTML tags
            text = re.sub(r"<[^>]+>", "", text)

            # Remove any script-like content
            text = re.sub(r"<script[^>]*>.*?</script>", "", text, flags=re.DOTALL)

            # Remove any potentially harmful characters
            text = re.sub(r"[^\w\s.,!?-]", "", text)

            # Normalize whitespace
            text = " ".join(text.split())

            return text
        except Exception as e:
            logger.error(f"Error sanitizing text: {str(e)}")
            return text

    async def process_audio(
        self, audio_data: Optional[bytes] = None, device_name: Optional[str] = None
    ) -> Optional[str]:
        """
        Process audio data and return transcribed text.

        Args:
            audio_data: Optional pre-recorded audio data in bytes
            device_name: Optional name of the audio device to use

        Returns:
            Transcribed text or None if processing failed

        Raises:
            AudioProcessingError: If audio recording fails
            ValidationError: If audio data is invalid
            TranscriptionError: If transcription fails
        """
        try:
            # If no audio data provided, record new audio
            if not audio_data:
                success, audio_data = await self.audio_recorder.record_audio(
                    device_name
                )
                if not success:
                    raise AudioProcessingError("Failed to record audio")

            # Validate audio data
            is_valid, error_message = self.validate_audio_file(audio_data)
            if not is_valid:
                raise ValidationError(error_message)

            # Transcribe audio with retries
            for attempt in range(self.max_retries):
                try:
                    # Bypassing SDK - Use direct HTTP call with httpx
                    if self.demo_mode or not self.api_key:
                        logger.warning(
                            "Using mock transcription (DEMO mode or API key missing)."
                        )
                        await asyncio.sleep(0.5)  # Simulate delay
                        transcription_text = "Mock transcription result"
                    else:
                        logger.info("Sending audio to Deepgram API via HTTPX...")
                        headers = {
                            "Authorization": f"Token {self.api_key}",
                            "Content-Type": "audio/wav",  # Assuming WAV, adjust if needed
                        }
                        # Define parameters for the API call
                        params = {"model": "nova-2", "smart_format": "true"}
                        async with httpx.AsyncClient() as client:
                            response = await client.post(
                                "https://api.deepgram.com/v1/listen",
                                params=params,
                                headers=headers,
                                content=audio_data,
                                timeout=30.0,  # Increased timeout for potentially large audio
                            )
                        response.raise_for_status()  # Raise exception for bad status codes (4xx or 5xx)
                        response_data = response.json()

                        # Extract transcript text from direct API response
                        transcription_text = response_data["results"]["channels"][0][
                            "alternatives"
                        ][0]["transcript"]
                        logger.info("Received transcription from Deepgram via HTTPX.")

                    if transcription_text:
                        # Sanitize the transcribed text
                        return self.sanitize_text(transcription_text)
                    else:
                        # Handle empty transcription result
                        logger.warning("Transcription resulted in empty text.")
                        return ""  # Return empty string instead of None
                except Exception as e:
                    if attempt == self.max_retries - 1:
                        raise TranscriptionError(
                            f"Failed to transcribe audio after {self.max_retries} attempts: {str(e)}"
                        )
                    logger.warning(
                        f"Transcription attempt {attempt + 1} failed: {str(e)}"
                    )
                    await asyncio.sleep(self.retry_delay)

            return None

        except (AudioProcessingError, ValidationError, TranscriptionError):
            raise
        except Exception as e:
            logger.error(f"Unexpected error processing audio: {str(e)}")
            raise AudioProcessingError(f"Unexpected error: {str(e)}")

    def process_order_text(self, text: str) -> Optional[str]:
        """
        Process transcribed text into a structured order.

        Args:
            text: Transcribed text to process

        Returns:
            Structured order string or None if processing failed

        Raises:
            ValidationError: If text is invalid or no valid items found
        """
        try:
            if not text:
                raise ValidationError("No text provided for processing")

            # Sanitize input text
            text = self.sanitize_text(text)

            # Clean and normalize text
            text = text.lower().strip()

            # Extract table number if present
            table_match = re.search(r"table\s+(\d+)", text)
            table_number = table_match.group(1) if table_match else None

            # Extract items and quantities
            items = []
            quantity_pattern = (
                r"(\d+)\s+([^,]+?)(?:\s+to\s+go)?(?:\s+please)?(?:\s+thanks)?"
            )

            for match in re.finditer(quantity_pattern, text):
                quantity = match.group(1)
                item = match.group(2).strip()
                items.append(f"{quantity}x {item}")

            if not items:
                raise ValidationError("No valid items found in order text")

            # Construct order string
            order_parts = []
            if table_number:
                order_parts.append(f"Table {table_number}")
            order_parts.extend(items)

            return " | ".join(order_parts)

        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error processing order text: {str(e)}")
            raise ValidationError(f"Failed to process order text: {str(e)}")

    async def validate_setup(self) -> Tuple[bool, str]:
        """
        Validate the speech service setup.

        Returns:
            Tuple[bool, str]: (is_valid, error_message)
        """
        try:
            # Validate Deepgram API key first
            if not await self.deepgram_service.validate_api_key():
                return False, "Invalid Deepgram API key"

            # Then check audio devices
            devices = self.audio_recorder.list_audio_devices()
            if not devices:
                return False, "No audio input devices found"

            logger.info("Speech service setup validated successfully")
            return True, ""

        except Exception as e:
            error_message = f"Error validating speech service setup: {str(e)}"
            logger.error(error_message)
            return False, error_message
