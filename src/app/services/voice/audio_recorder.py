import asyncio
import logging
import pyaudio
import wave
import os
import time
from typing import Optional, Tuple, List
from dotenv import load_dotenv

# Force reload environment variables
load_dotenv(override=True)

logger = logging.getLogger(__name__)

class AudioRecorder:
    def __init__(self):
        # Audio recording parameters
        self.chunk_size = int(os.getenv('AUDIO_CHUNK_SIZE', 1024))
        self.format = getattr(pyaudio, os.getenv('AUDIO_FORMAT', 'paInt16'))
        self.channels = int(os.getenv('AUDIO_CHANNELS', 1))
        self.rate = int(os.getenv('AUDIO_RATE', 16000))
        
        # Initialize PyAudio
        self.p = pyaudio.PyAudio()
        self.stream = None
        self.is_recording = False
        self.frames = []
        
    async def start_recording(self, device_name: Optional[str] = None) -> bool:
        """
        Start recording audio.
        
        Args:
            device_name: Optional name of the audio device to use
            
        Returns:
            bool: True if recording started successfully
        """
        try:
            # Find and configure input device
            input_device_index = None
            input_rate = self.rate
            input_channels = self.channels
            
            if device_name:
                device_id = self.find_device_by_name(device_name)
                if device_id is not None:
                    device_info = self.p.get_device_info_by_index(device_id)
                    input_device_index = device_id
                    input_rate = int(device_info.get('defaultSampleRate'))
                    input_channels = int(device_info.get('maxInputChannels'))
                    logger.info(f"Using device: {device_info.get('name')}")
                else:
                    logger.warning(f"Device '{device_name}' not found, using default")
            
            # Open audio stream
            self.stream = self.p.open(
                format=self.format,
                channels=input_channels,
                rate=input_rate,
                input=True,
                frames_per_buffer=self.chunk_size,
                input_device_index=input_device_index,
                stream_callback=None,
                start=False
            )
            
            # Start recording
            self.frames = []
            self.is_recording = True
            self.stream.start_stream()
            
            logger.info("Recording started")
            return True
            
        except Exception as e:
            logger.error(f"Error starting audio recording: {str(e)}")
            return False
    
    async def stop_recording(self) -> Tuple[bool, Optional[bytes]]:
        """
        Stop recording and return the recorded audio data.
        
        Returns:
            Tuple[bool, Optional[bytes]]: Success flag and WAV audio data
        """
        try:
            if not self.is_recording or not self.stream:
                logger.error("No active recording to stop")
                return False, None
            
            # Stop recording
            self.is_recording = False
            
            # Read any remaining data
            while self.stream.is_active():
                data = self.stream.read(self.chunk_size, exception_on_overflow=False)
                self.frames.append(data)
            
            # Stop and close stream
            self.stream.stop_stream()
            self.stream.close()
            self.stream = None
            
            if not self.frames:
                logger.error("No audio data recorded")
                return False, None
            
            # Create WAV data in memory
            import io
            wav_buffer = io.BytesIO()
            with wave.open(wav_buffer, 'wb') as wf:
                wf.setnchannels(self.channels)
                wf.setsampwidth(self.p.get_sample_size(self.format))
                wf.setframerate(self.rate)
                wf.writeframes(b''.join(self.frames))
            
            wav_data = wav_buffer.getvalue()
            
            # Verify WAV header
            if wav_data[:4] != b'RIFF' or wav_data[8:12] != b'WAVE':
                logger.error("Invalid WAV header")
                return False, None
            
            logger.info("Recording stopped successfully")
            return True, wav_data
            
        except Exception as e:
            logger.error(f"Error stopping audio recording: {str(e)}")
            return False, None
    
    async def record_chunk(self) -> Optional[bytes]:
        """
        Record a single chunk of audio data.
        
        Returns:
            Optional[bytes]: Audio chunk data or None if recording is not active
        """
        if not self.is_recording or not self.stream:
            return None
        
        try:
            data = self.stream.read(self.chunk_size, exception_on_overflow=False)
            self.frames.append(data)
            return data
        except Exception as e:
            logger.error(f"Error recording audio chunk: {str(e)}")
            return None
    
    def list_audio_devices(self) -> List[dict]:
        """List all available audio input devices."""
        info = self.p.get_host_api_info_by_index(0)
        numdevices = info.get('deviceCount')
        
        devices = []
        for i in range(0, numdevices):
            device_info = self.p.get_device_info_by_index(i)
            if device_info.get('maxInputChannels') > 0:
                devices.append({
                    'id': i,
                    'name': device_info.get('name'),
                    'sample_rate': device_info.get('defaultSampleRate'),
                    'channels': device_info.get('maxInputChannels')
                })
        return devices
    
    def find_device_by_name(self, name: str) -> Optional[int]:
        """Find an audio device by name."""
        devices = self.list_audio_devices()
        for device in devices:
            if name.lower() in device['name'].lower():
                return device['id']
        return None
    
    def __del__(self):
        """Clean up PyAudio resources."""
        if self.stream:
            try:
                self.stream.stop_stream()
                self.stream.close()
            except:
                pass
        try:
            self.p.terminate()
        except:
            pass 