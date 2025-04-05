import asyncio
import pyaudio
import logging
from typing import Tuple, Optional


class AudioRecorder:
    """
    A class to handle audio recording functionality.

    This class provides methods to start and stop audio recording,
    and returns the recorded audio data.
    """

    # Audio recording parameters
    CHANNELS = 1  # Mono
    RATE = 16000  # 16kHz
    CHUNK = 1024  # Frames per buffer
    FORMAT = 8  # pyaudio.paInt16 (16-bit)

    def __init__(self, debug=False):
        """Initialize the AudioRecorder."""
        self.logger = logging.getLogger(__name__)
        self.debug = debug
        if debug:
            self.logger.setLevel(logging.DEBUG)
        self.pyaudio_instance = None
        self.stream = None
        self.frames = []
        self.is_recording = False

    async def start_recording(self, device_index=None) -> bool:
        """
        Start recording audio.

        Args:
            device_index: Optional index of the input device to use

        Returns:
            bool: True if recording started successfully, False otherwise.
        """
        try:
            # Check if already recording
            if self.is_recording:
                self.logger.warning("Recording already in progress")
                return False

            # Initialize PyAudio if not already initialized
            if self.pyaudio_instance is None:
                self.pyaudio_instance = pyaudio.PyAudio()

            # Open audio stream
            self.stream = self.pyaudio_instance.open(
                format=self.FORMAT,
                channels=self.CHANNELS,
                rate=self.RATE,
                input=True,
                input_device_index=device_index,
                frames_per_buffer=self.CHUNK,
            )

            # Reset frames list
            self.frames = []

            # Start recording in a separate task
            self.is_recording = True
            asyncio.create_task(self._record_audio())

            self.logger.info("Audio recording started")
            return True

        except Exception as e:
            self.logger.error(f"Error starting audio recording: {str(e)}")
            # Clean up if error occurs
            if self.stream:
                self.stream.close()
                self.stream = None
            return False

    async def _record_audio(self):
        """Background task to record audio while is_recording is True."""
        try:
            while self.is_recording and self.stream:
                data = self.stream.read(self.CHUNK, exception_on_overflow=False)
                self.frames.append(data)
                # Small sleep to allow other tasks to run
                await asyncio.sleep(0.01)
        except Exception as e:
            self.logger.error(f"Error during audio recording: {str(e)}")
            self.is_recording = False

    async def stop_recording(self) -> Tuple[bool, Optional[bytes]]:
        """
        Stop recording audio and return the recorded data.

        Returns:
            Tuple[bool, Optional[bytes]]: A tuple containing:
                - bool: True if recording stopped successfully, False otherwise
                - Optional[bytes]: The recorded audio data, or None if no data or error
        """
        try:
            # Check if not recording
            if not self.is_recording:
                self.logger.warning("No recording in progress to stop")
                return False, None

            # Stop recording
            self.is_recording = False

            # Allow time for recording task to complete
            await asyncio.sleep(0.1)

            # Get recorded data
            audio_data = b"".join(self.frames) if self.frames else None

            # Close and clean up
            if self.stream:
                self.stream.stop_stream()
                self.stream.close()
                self.stream = None

            self.logger.info("Audio recording stopped")
            return True, audio_data

        except Exception as e:
            self.logger.error(f"Error stopping audio recording: {str(e)}")
            return False, None

    def list_audio_devices(self):
        """List all available audio input devices."""
        if self.pyaudio_instance is None:
            self.pyaudio_instance = pyaudio.PyAudio()

        devices = []
        info = self.pyaudio_instance.get_host_api_info_by_index(0)
        numdevices = info.get("deviceCount")

        for i in range(0, numdevices):
            device_info = self.pyaudio_instance.get_device_info_by_index(i)
            if device_info.get("maxInputChannels") > 0:
                devices.append(
                    {
                        "index": i,
                        "name": device_info.get("name"),
                        "channels": device_info.get("maxInputChannels"),
                        "sample_rate": device_info.get("defaultSampleRate"),
                    }
                )
                if self.debug:
                    self.logger.debug(f"Device {i}: {device_info.get('name')}")

        return devices

    def __del__(self):
        """Clean up resources when the object is destroyed."""
        if self.stream:
            self.stream.close()
        if self.pyaudio_instance:
            self.pyaudio_instance.terminate()
