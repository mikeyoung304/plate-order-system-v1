import pytest
import asyncio
import os
import wave
from src.app.services.voice.audio_recorder import AudioRecorder

@pytest.fixture
async def audio_recorder():
    recorder = AudioRecorder()
    yield recorder
    # Cleanup any test files
    if os.path.exists("test_recording.wav"):
        os.remove("test_recording.wav")

@pytest.mark.asyncio
async def test_recording_lifecycle(audio_recorder):
    """Test the complete lifecycle of recording audio."""
    
    # Start recording
    success = await audio_recorder.start_recording()
    assert success, "Failed to start recording"
    
    # Record for 2 seconds
    await asyncio.sleep(2)
    
    # Stop recording
    success, audio_data = await audio_recorder.stop_recording()
    assert success, "Failed to stop recording"
    assert audio_data is not None, "No audio data returned"
    assert len(audio_data) > 0, "Audio data is empty"
    
    # Save the audio data to verify it's valid WAV format
    with wave.open("test_recording.wav", "wb") as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(16000)  # 16kHz
        wav_file.writeframes(audio_data)
    
    # Verify the file exists and has content
    assert os.path.exists("test_recording.wav"), "WAV file not created"
    assert os.path.getsize("test_recording.wav") > 0, "WAV file is empty"

@pytest.mark.asyncio
async def test_stop_without_start(audio_recorder):
    """Test stopping recording without starting first."""
    success, audio_data = await audio_recorder.stop_recording()
    assert not success, "Stop should fail when recording hasn't started"
    assert audio_data is None, "Audio data should be None when recording hasn't started"

@pytest.mark.asyncio
async def test_double_start(audio_recorder):
    """Test starting recording twice."""
    # First start should succeed
    success1 = await audio_recorder.start_recording()
    assert success1, "First start should succeed"
    
    # Second start should fail
    success2 = await audio_recorder.start_recording()
    assert not success2, "Second start should fail"
    
    # Cleanup
    await audio_recorder.stop_recording()

@pytest.mark.asyncio
async def test_recording_parameters(audio_recorder):
    """Test recording parameters are set correctly."""
    assert audio_recorder.CHANNELS == 1, "Should be mono recording"
    assert audio_recorder.RATE == 16000, "Sample rate should be 16kHz"
    assert audio_recorder.CHUNK == 1024, "Chunk size should be 1024"
    assert audio_recorder.FORMAT == 8, "Format should be 16-bit"  # pyaudio.paInt16

@pytest.mark.asyncio
async def test_concurrent_operations(audio_recorder):
    """Test handling of concurrent operations."""
    # Start recording
    success = await audio_recorder.start_recording()
    assert success, "Failed to start recording"
    
    # Try to start again immediately (should fail)
    success2 = await audio_recorder.start_recording()
    assert not success2, "Concurrent start should fail"
    
    # Stop recording
    success3, audio_data = await audio_recorder.stop_recording()
    assert success3, "Failed to stop recording"
    assert audio_data is not None, "No audio data returned" 