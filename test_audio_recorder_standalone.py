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
