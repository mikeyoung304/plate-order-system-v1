import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from app.services.speech.deepgram_service import SpeechService
from app.core.exceptions import AudioProcessingError, TranscriptionError, ValidationError

@pytest.fixture
def speech_service():
    return SpeechService()

@pytest.fixture
def mock_audio_data():
    return b'RIFF' + b'x' * 1000  # Simulated WAV file

@pytest.fixture
def mock_transcription():
    return "2 burgers, 1 fries, table 5"

@pytest.mark.asyncio
async def test_validate_audio_file_success(speech_service, mock_audio_data):
    is_valid, error_message = speech_service.validate_audio_file(mock_audio_data)
    assert is_valid
    assert error_message == ""

@pytest.mark.asyncio
async def test_validate_audio_file_empty(speech_service):
    is_valid, error_message = speech_service.validate_audio_file(b'')
    assert not is_valid
    assert "Empty audio data" in error_message

@pytest.mark.asyncio
async def test_validate_audio_file_too_large(speech_service):
    large_data = b'x' * (speech_service.max_audio_size + 1)
    is_valid, error_message = speech_service.validate_audio_file(large_data)
    assert not is_valid
    assert "too large" in error_message

@pytest.mark.asyncio
async def test_validate_audio_file_invalid_format(speech_service):
    invalid_data = b'INVALID' + b'x' * 1000
    is_valid, error_message = speech_service.validate_audio_file(invalid_data)
    assert not is_valid
    assert "Invalid audio format" in error_message

def test_sanitize_text_success(speech_service):
    input_text = "Hello <script>alert('xss')</script> World!"
    sanitized = speech_service.sanitize_text(input_text)
    assert sanitized == "Hello World"

def test_sanitize_text_empty(speech_service):
    assert speech_service.sanitize_text("") == ""

def test_sanitize_text_with_html(speech_service):
    input_text = "<div>Hello</div> <p>World</p>"
    sanitized = speech_service.sanitize_text(input_text)
    assert sanitized == "Hello World"

@pytest.mark.asyncio
async def test_process_audio_success(speech_service, mock_audio_data, mock_transcription):
    with patch('app.services.voice.deepgram_service.DeepgramService.transcribe_audio') as mock_transcribe:
        mock_transcribe.return_value = mock_transcription
        
        result = await speech_service.process_audio(mock_audio_data)
        assert result == mock_transcription

@pytest.mark.asyncio
async def test_process_audio_recording_success(speech_service, mock_transcription):
    with patch('app.services.voice.audio_recorder.AudioRecorder.record_audio') as mock_record, \
         patch('app.services.voice.deepgram_service.DeepgramService.transcribe_audio') as mock_transcribe:
        mock_record.return_value = (True, b'RIFF' + b'x' * 1000)
        mock_transcribe.return_value = mock_transcription
        
        result = await speech_service.process_audio()
        assert result == mock_transcription

@pytest.mark.asyncio
async def test_process_audio_recording_failure(speech_service):
    with patch('app.services.voice.audio_recorder.AudioRecorder.record_audio') as mock_record:
        mock_record.return_value = (False, None)
        
        with pytest.raises(AudioProcessingError):
            await speech_service.process_audio()

@pytest.mark.asyncio
async def test_process_audio_transcription_retry(speech_service, mock_audio_data):
    with patch('app.services.voice.deepgram_service.DeepgramService.transcribe_audio') as mock_transcribe:
        mock_transcribe.side_effect = [Exception("First try failed"), "Success"]
        
        result = await speech_service.process_audio(mock_audio_data)
        assert result == "Success"
        assert mock_transcribe.call_count == 2

@pytest.mark.asyncio
async def test_process_audio_max_retries_exceeded(speech_service, mock_audio_data):
    with patch('app.services.voice.deepgram_service.DeepgramService.transcribe_audio') as mock_transcribe:
        mock_transcribe.side_effect = Exception("Transcription failed")
        
        with pytest.raises(TranscriptionError):
            await speech_service.process_audio(mock_audio_data)
        assert mock_transcribe.call_count == speech_service.max_retries

def test_process_order_text_success(speech_service):
    text = "I'd like 2 burgers and 1 fries for table 5 please"
    result = speech_service.process_order_text(text)
    assert result == "Table 5 | 2x burgers | 1x fries"

def test_process_order_text_no_table(speech_service):
    text = "2 burgers and 1 fries please"
    result = speech_service.process_order_text(text)
    assert result == "2x burgers | 1x fries"

def test_process_order_text_empty(speech_service):
    with pytest.raises(ValidationError):
        speech_service.process_order_text("")

def test_process_order_text_no_items(speech_service):
    with pytest.raises(ValidationError):
        speech_service.process_order_text("Hello, how are you?")

@pytest.mark.asyncio
async def test_validate_setup_success(speech_service):
    with patch('app.services.voice.deepgram_service.DeepgramService.validate_api_key') as mock_validate, \
         patch('app.services.voice.audio_recorder.AudioRecorder.list_audio_devices') as mock_devices:
        mock_validate.return_value = True
        mock_devices.return_value = ["device1", "device2"]
        
        is_valid, error_message = await speech_service.validate_setup()
        assert is_valid
        assert error_message == ""

@pytest.mark.asyncio
async def test_validate_setup_invalid_api_key(speech_service):
    with patch('app.services.voice.deepgram_service.DeepgramService.validate_api_key') as mock_validate:
        mock_validate.return_value = False
        
        is_valid, error_message = await speech_service.validate_setup()
        assert not is_valid
        assert "Invalid Deepgram API key" in error_message

@pytest.mark.asyncio
async def test_validate_setup_no_devices(speech_service):
    with patch('app.services.voice.deepgram_service.DeepgramService.validate_api_key') as mock_validate, \
         patch('app.services.voice.audio_recorder.AudioRecorder.list_audio_devices') as mock_devices:
        mock_validate.return_value = True
        mock_devices.return_value = []
        
        is_valid, error_message = await speech_service.validate_setup()
        assert not is_valid
        assert "No audio input devices found" in error_message 