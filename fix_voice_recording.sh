#!/bin/bash

# Automation script to fix voice recording functionality in plate-order-system
# Created by Manus AI

set -e  # Exit on any error

echo "===== Voice Recording Functionality Fix Automation ====="
echo "This script will automatically implement the fixes for the voice recording functionality."

# Check if we're in the project root directory
if [ ! -f "run.py" ] || [ ! -d "src" ]; then
    echo "Error: This script must be run from the plate-order-system project root directory."
    echo "Please navigate to your project root directory and run this script again."
    exit 1
fi

echo "Step 1: Creating required directory structure..."
mkdir -p src/app/services/voice
echo "✓ Directory structure created successfully."

echo "Step 2: Creating AudioRecorder implementation file..."
cat > src/app/services/voice/audio_recorder.py << 'EOL'
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
    FORMAT = 8    # pyaudio.paInt16 (16-bit)
    
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
                frames_per_buffer=self.CHUNK
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
            audio_data = b''.join(self.frames) if self.frames else None
            
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
        numdevices = info.get('deviceCount')
        
        for i in range(0, numdevices):
            device_info = self.pyaudio_instance.get_device_info_by_index(i)
            if device_info.get('maxInputChannels') > 0:
                devices.append({
                    'index': i,
                    'name': device_info.get('name'),
                    'channels': device_info.get('maxInputChannels'),
                    'sample_rate': device_info.get('defaultSampleRate')
                })
                if self.debug:
                    self.logger.debug(f"Device {i}: {device_info.get('name')}")
        
        return devices
        
    def __del__(self):
        """Clean up resources when the object is destroyed."""
        if self.stream:
            self.stream.close()
        if self.pyaudio_instance:
            self.pyaudio_instance.terminate()
EOL
echo "✓ AudioRecorder implementation created successfully."

echo "Step 3: Creating test script..."
cat > test_audio_recorder_standalone.py << 'EOL'
#!/usr/bin/env python3
import asyncio
import logging
import wave
import os
from src.app.services.voice.audio_recorder import AudioRecorder

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_recorder():
    # Create recorder with debug mode
    recorder = AudioRecorder(debug=True)
    
    # List available devices
    logger.info("Available audio devices:")
    devices = recorder.list_audio_devices()
    
    # Start recording
    logger.info("Starting recording in 3 seconds...")
    for i in range(3, 0, -1):
        logger.info(f"{i}...")
        await asyncio.sleep(1)
    
    logger.info("Recording...")
    success = await recorder.start_recording()
    if not success:
        logger.error("Failed to start recording")
        return
    
    # Record for 5 seconds
    await asyncio.sleep(5)
    
    # Stop recording
    logger.info("Stopping recording...")
    success, audio_data = await recorder.stop_recording()
    if not success:
        logger.error("Failed to stop recording")
        return
    
    if audio_data is None or len(audio_data) == 0:
        logger.error("No audio data captured")
        return
    
    logger.info(f"Recorded {len(audio_data)} bytes of audio data")
    
    # Save to WAV file
    output_file = "test_recording_new.wav"
    with wave.open(output_file, "wb") as wav_file:
        wav_file.setnchannels(recorder.CHANNELS)
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(recorder.RATE)
        wav_file.writeframes(audio_data)
    
    logger.info(f"Audio saved to {output_file}")
    
    # Verify file exists and has content
    if os.path.exists(output_file):
        size = os.path.getsize(output_file)
        logger.info(f"File size: {size} bytes")
    else:
        logger.error("File was not created")

if __name__ == "__main__":
    asyncio.run(test_recorder())
EOL
chmod +x test_audio_recorder_standalone.py
echo "✓ Test script created successfully."

echo "Step 4: Updating Deepgram integration script..."
# Check if run_server_with_deepgram.sh exists
if [ -f "run_server_with_deepgram.sh" ]; then
    # Check if the script already has a command to run the server
    if ! grep -q "python run.py" "run_server_with_deepgram.sh"; then
        # Add the command to run the server
        echo "python run.py --port 10000" >> run_server_with_deepgram.sh
        echo "✓ Deepgram integration script updated successfully."
    else
        echo "✓ Deepgram integration script already contains server start command."
    fi
else
    echo "Warning: run_server_with_deepgram.sh not found. Creating a new one..."
    cat > run_server_with_deepgram.sh << 'EOL'
#!/bin/bash

# Script to run the server with the Deepgram API

echo "Starting server with Deepgram API..."

# Check if python-dotenv is installed
pip install python-dotenv

# Make sure the .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Please create a .env file with your DEEPGRAM_API_KEY."
    exit 1
fi

# Check if DEEPGRAM_API_KEY is set in .env
if ! grep -q "DEEPGRAM_API_KEY" .env; then
    echo "Error: DEEPGRAM_API_KEY not found in .env file."
    exit 1
fi

# Run the server
echo "Starting server on port 10000..."
python run.py --port 10000
EOL
    chmod +x run_server_with_deepgram.sh
    echo "✓ New Deepgram integration script created successfully."
fi

echo "Step 5: Checking dependencies..."
# Create a temporary file with required dependencies
cat > temp_requirements.txt << 'EOL'
pyaudio>=0.2.11
wave>=0.0.2
deepgram-sdk>=3.0.0,<4.0.0
python-dotenv>=0.19.0
EOL

# Check if pip is available
if command -v pip &> /dev/null; then
    echo "Installing required dependencies..."
    pip install -r temp_requirements.txt
    echo "✓ Dependencies installed successfully."
else
    echo "Warning: pip command not found. Please install the following dependencies manually:"
    cat temp_requirements.txt
fi

# Clean up temporary file
rm temp_requirements.txt

echo "===== Voice Recording Functionality Fix Complete ====="
echo ""
echo "To test the voice recording functionality, run:"
echo "  python test_audio_recorder_standalone.py"
echo ""
echo "If you encounter any issues with PyAudio installation:"
echo "  - On macOS: brew install portaudio"
echo "  - On Linux: sudo apt-get install python3-pyaudio"
echo "  - On Windows: Ensure you have the correct Visual C++ build tools"
echo ""
echo "For Deepgram integration, make sure your .env file contains:"
echo "  DEEPGRAM_API_KEY=your_api_key_here"
echo ""
echo "Then run the server with Deepgram integration:"
echo "  ./run_server_with_deepgram.sh"
