import logging
import os
import json
import base64
import re
import asyncio
from typing import Optional, Dict, Any, Tuple
from dotenv import load_dotenv
from app.services.voice.audio_recorder import AudioRecorder
from app.services.voice.deepgram_service import DeepgramService
from app.core.exceptions import AudioProcessingError, TranscriptionError, ValidationError

# Force reload environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class SpeechService:
    def __init__(self):
        # Initialize services
        self.audio_recorder = AudioRecorder()
        self.deepgram_service = DeepgramService()
        
        # Load configuration
        self.min_confidence = float(os.getenv('MIN_TRANSCRIPTION_CONFIDENCE', 0.7))
        self.max_retries = int(os.getenv('MAX_SPEECH_RETRIES', 3))
        self.max_audio_size = int(os.getenv('MAX_AUDIO_SIZE_MB', 10)) * 1024 * 1024  # Convert MB to bytes
        self.allowed_audio_types = ['audio/wav', 'audio/mp3', 'audio/mpeg']
        self.retry_delay = float(os.getenv('RETRY_DELAY_SECONDS', 1.0))
        
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
            # Check if data is empty
            if not audio_data:
                return False, "Empty audio data"
            
            # Check file size
            if len(audio_data) > self.max_audio_size:
                return False, f"Audio file too large: {len(audio_data)} bytes (max {self.max_audio_size} bytes)"
            
            # Check audio format (basic check)
            if not audio_data.startswith(b'RIFF') and not audio_data.startswith(b'ID3'):
                return False, "Invalid audio format (must be WAV or MP3)"
            
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
            text = re.sub(r'<[^>]+>', '', text)
            
            # Remove any script-like content
            text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL)
            
            # Remove any potentially harmful characters
            text = re.sub(r'[^\w\s.,!?-]', '', text)
            
            # Normalize whitespace
            text = ' '.join(text.split())
            
            return text
        except Exception as e:
            logger.error(f"Error sanitizing text: {str(e)}")
            return text

    async def process_audio(self, audio_data: Optional[bytes] = None, device_name: Optional[str] = None) -> Optional[str]:
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
                success, audio_data = await self.audio_recorder.record_audio(device_name)
                if not success:
                    raise AudioProcessingError("Failed to record audio")

            # Validate audio data
            is_valid, error_message = self.validate_audio_file(audio_data)
            if not is_valid:
                raise ValidationError(error_message)

            # Transcribe audio with retries
            for attempt in range(self.max_retries):
                try:
                    transcription = await self.deepgram_service.transcribe_audio(audio_data)
                    if transcription:
                        # Sanitize the transcribed text
                        return self.sanitize_text(transcription)
                except Exception as e:
                    if attempt == self.max_retries - 1:
                        raise TranscriptionError(f"Failed to transcribe audio after {self.max_retries} attempts: {str(e)}")
                    logger.warning(f"Transcription attempt {attempt + 1} failed: {str(e)}")
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
            table_match = re.search(r'table\s+(\d+)', text)
            table_number = table_match.group(1) if table_match else None
            
            # Extract items and quantities
            items = []
            quantity_pattern = r'(\d+)\s+([^,]+?)(?:\s+to\s+go)?(?:\s+please)?(?:\s+thanks)?'
            
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
