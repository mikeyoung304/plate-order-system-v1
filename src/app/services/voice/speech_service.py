import logging
from typing import List, Dict
import pyaudio
from .deepgram_service import DeepgramService

logger = logging.getLogger(__name__)


class SpeechService:
    def __init__(self):
        self.deepgram_service = None
        self._initialized = False
        self._audio = None

    async def initialize(self):
        """Initialize the speech service and its dependencies."""
        if not self._initialized:
            try:
                # Initialize Deepgram service
                self.deepgram_service = DeepgramService()

                # Validate Deepgram API key first
                if not await self.deepgram_service.validate_api_key():
                    raise RuntimeError("Deepgram API key validation failed")

                # Then ensure session is initialized for future use
                await self.deepgram_service._ensure_session()

                # Initialize PyAudio
                try:
                    self._audio = pyaudio.PyAudio()
                    logger.info("PyAudio initialized successfully")
                except Exception as e:
                    logger.warning(f"Failed to initialize PyAudio: {str(e)}")
                    self._audio = None

                self._initialized = True
                logger.info("Speech service initialized successfully")

            except Exception as e:
                logger.error(f"Failed to initialize speech service: {str(e)}")
                if self.deepgram_service:
                    await self.deepgram_service.close()
                self.deepgram_service = None
                if self._audio:
                    self._audio.terminate()
                self._audio = None
                raise

    async def validate_setup(self) -> bool:
        """Validate the speech service setup."""
        try:
            # Ensure service is initialized
            await self.initialize()

            # Check audio devices (but don't fail if none found)
            devices = await self.get_audio_devices()
            if not devices:
                logger.warning(
                    "No audio devices found - this is expected in some environments"
                )
            else:
                logger.info(f"Found {len(devices)} audio devices")

            logger.info("Speech service setup validated successfully")
            return True

        except Exception as e:
            logger.error(f"Speech service validation failed: {str(e)}")
            return False

    async def get_audio_devices(self) -> List[Dict]:
        """Get list of available audio devices."""
        devices = []
        try:
            if self._audio is None:
                self._audio = pyaudio.PyAudio()

            # Get the number of devices
            device_count = self._audio.get_device_count()

            for i in range(device_count):
                try:
                    device_info = self._audio.get_device_info_by_index(i)
                    if device_info is not None:
                        devices.append(
                            {
                                "index": i,
                                "name": device_info.get("name", "Unknown"),
                                "max_input_channels": device_info.get(
                                    "maxInputChannels", 0
                                ),
                                "max_output_channels": device_info.get(
                                    "maxOutputChannels", 0
                                ),
                                "default_sample_rate": device_info.get(
                                    "defaultSampleRate", 0
                                ),
                                "host_api": device_info.get("hostApi", 0),
                            }
                        )
                except Exception as e:
                    logger.warning(f"Failed to get info for device {i}: {str(e)}")
                    continue

            logger.info(f"Successfully detected {len(devices)} audio devices")
            return devices

        except Exception as e:
            logger.error(f"Failed to get audio devices: {str(e)}")
            return []

    async def close(self):
        """Clean up resources."""
        if self.deepgram_service:
            await self.deepgram_service.close()
            self.deepgram_service = None
        if self._audio:
            self._audio.terminate()
            self._audio = None
        self._initialized = False
