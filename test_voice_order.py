import asyncio
import logging
import pyaudio
import wave
import os
import base64
import httpx
import json
from dotenv import load_dotenv
from app.config.settings import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Audio recording parameters
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
RECORD_SECONDS = 10

async def test_audio_recording():
    """Test audio recording functionality."""
    try:
        # Initialize PyAudio
        p = pyaudio.PyAudio()
        
        # List available input devices
        info = p.get_host_api_info_by_index(0)
        numdevices = info.get('deviceCount')
        logger.info("Available audio input devices:")
        for i in range(0, numdevices):
            device_info = p.get_device_info_by_index(i)
            if device_info.get('maxInputChannels') > 0:
                logger.info(f"Device {i}: {device_info.get('name')}")
        
        # Open audio stream
        stream = p.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=RATE,
            input=True,
            frames_per_buffer=CHUNK
        )
        
        logger.info("Get ready to speak...")
        for i in range(3, 0, -1):
            logger.info(f"{i}...")
            await asyncio.sleep(1)
        logger.info("Recording...")
        
        # Record audio
        frames = []
        for i in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
            data = stream.read(CHUNK, exception_on_overflow=False)
            frames.append(data)
        
        logger.info("Recording finished")
        
        # Stop and close stream
        stream.stop_stream()
        stream.close()
        p.terminate()
        
        # Save recording to WAV file
        with wave.open("test_recording.wav", 'wb') as wf:
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(p.get_sample_size(FORMAT))
            wf.setframerate(RATE)
            wf.writeframes(b''.join(frames))
        
        logger.info("Audio saved to test_recording.wav")
        return True
        
    except Exception as e:
        logger.error(f"Error during audio recording: {str(e)}")
        return False

async def test_api_integration():
    """Test API integration with the recorded audio."""
    try:
        # Read the recorded audio file
        with open("test_recording.wav", 'rb') as audio_file:
            audio_data = audio_file.read()
        
        # Convert to base64
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        # Prepare request data
        data = {
            "audio_data": audio_base64
        }
        
        # Send request to API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"http://localhost:8000{settings.API_V1_STR}/orders/voice",
                json=data,
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info("API Response:")
                logger.info(f"Transcription: {result.get('transcription')}")
                logger.info(f"Processed Order: {result.get('processed_order')}")
                logger.info(f"Order ID: {result.get('order_id')}")
                return True
            else:
                logger.error(f"API Error: {response.status_code}")
                logger.error(response.text)
                return False
                
    except Exception as e:
        logger.error(f"Error during API integration test: {str(e)}")
        return False

async def main():
    """Main test function."""
    # Load environment variables
    load_dotenv(override=True)
    
    logger.info("Starting voice order test...")
    
    # Test audio recording
    if not await test_audio_recording():
        logger.error("Audio recording test failed")
        return
    
    # Test API integration
    if not await test_api_integration():
        logger.error("API integration test failed")
        return
    
    logger.info("All tests completed successfully")

if __name__ == "__main__":
    asyncio.run(main())