import logging
import os
import re
from typing import Optional
from dotenv import load_dotenv
from src.app.services.voice.audio_recorder import AudioRecorder
from src.app.services.voice.deepgram_service import DeepgramService

# Force reload environment variables
load_dotenv(override=True)

logger = logging.getLogger(__name__)


class SpeechService:
    def __init__(self):
        # Initialize services
        self.audio_recorder = AudioRecorder()
        self.deepgram_service = DeepgramService()

        # Load configuration
        self.min_confidence = float(os.getenv("MIN_TRANSCRIPTION_CONFIDENCE", 0.7))
        self.max_retries = int(os.getenv("MAX_SPEECH_RETRIES", 3))

        logger.info("SpeechService initialized")

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
        """
        try:
            # If no audio data provided, record new audio
            if not audio_data:
                success, audio_data = await self.audio_recorder.record_audio(
                    device_name
                )
                if not success:
                    logger.error("Failed to record audio")
                    return None

            # Validate audio data
            if not audio_data:
                logger.error("No audio data provided")
                return None

            # Transcribe audio
            transcription = await self.deepgram_service.transcribe_audio(audio_data)
            if not transcription:
                logger.error("Failed to transcribe audio")
                return None

            return transcription

        except Exception as e:
            logger.error(f"Error processing audio: {str(e)}")
            return None

    def process_order_text(self, text: str) -> Optional[str]:
        """
        Process transcribed text into a structured order.

        Args:
            text: Transcribed text to process

        Returns:
            Structured order string or None if processing failed
        """
        try:
            if not text:
                logger.error("No text provided for processing")
                return None

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
                logger.error("No valid items found in order text")
                return None

            # Construct order string
            order_parts = []
            if table_number:
                order_parts.append(f"Table {table_number}")
            order_parts.extend(items)

            return " | ".join(order_parts)

        except Exception as e:
            logger.error(f"Error processing order text: {str(e)}")
            return None

    async def validate_setup(self) -> bool:
        """
        Validate the speech service setup.

        Returns:
            bool: True if setup is valid, False otherwise
        """
        try:
            # Check audio devices
            devices = self.audio_recorder.list_audio_devices()
            if not devices:
                logger.error("No audio input devices found")
                return False

            # Validate Deepgram API key
            if not await self.deepgram_service.validate_api_key():
                logger.error("Invalid Deepgram API key")
                return False

            logger.info("Speech service setup validated successfully")
            return True

        except Exception as e:
            logger.error(f"Error validating speech service setup: {str(e)}")
            return False
