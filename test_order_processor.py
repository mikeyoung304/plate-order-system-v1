import pytest
import json
from unittest.mock import Mock, patch
from src.app.services.order.order_processor import OrderProcessor
from src.app.models.order import Order, OrderStatus
from src.app.services.voice.deepgram_service import DeepgramService

@pytest.fixture
def order_processor():
    return OrderProcessor()

@pytest.fixture
def mock_deepgram():
    with patch('app.services.voice.deepgram_service.DeepgramService') as mock:
        mock_instance = Mock()
        mock.return_value = mock_instance
        yield mock_instance

@pytest.fixture
def sample_audio_data():
    # Create some dummy audio data
    return b'dummy_audio_data'

@pytest.fixture
def sample_transcription():
    return {
        "results": {
            "channels": [
                {
                    "alternatives": [
                        {
                            "transcript": "I would like a cheeseburger with fries and a coke please"
                        }
                    ]
                }
            ]
        }
    }

@pytest.mark.asyncio
async def test_process_order_success(order_processor, mock_deepgram, sample_audio_data, sample_transcription):
    """Test successful order processing."""
    # Setup mock
    mock_deepgram.transcribe_audio.return_value = sample_transcription
    
    # Process order
    order = await order_processor.process_order(
        audio_data=sample_audio_data,
        table_id=1,
        seat_number=2
    )
    
    # Verify order
    assert order is not None
    assert order.table_id == 1
    assert order.seat_number == 2
    assert order.status == OrderStatus.PENDING
    assert "cheeseburger" in order.items
    assert "fries" in order.items
    assert "coke" in order.items
    assert order.raw_transcription == "I would like a cheeseburger with fries and a coke please"

@pytest.mark.asyncio
async def test_process_order_no_items(order_processor, mock_deepgram, sample_audio_data):
    """Test order processing with no recognizable items."""
    # Setup mock with transcription containing no menu items
    mock_deepgram.transcribe_audio.return_value = {
        "results": {
            "channels": [
                {
                    "alternatives": [
                        {
                            "transcript": "Hello how are you today"
                        }
                    ]
                }
            ]
        }
    }
    
    # Process order
    order = await order_processor.process_order(
        audio_data=sample_audio_data,
        table_id=1,
        seat_number=2
    )
    
    # Verify order
    assert order is not None
    assert order.items == []
    assert order.status == OrderStatus.PENDING
    assert order.raw_transcription == "Hello how are you today"

@pytest.mark.asyncio
async def test_process_order_transcription_error(order_processor, mock_deepgram, sample_audio_data):
    """Test order processing with transcription error."""
    # Setup mock to raise exception
    mock_deepgram.transcribe_audio.side_effect = Exception("Transcription failed")
    
    # Process order should raise exception
    with pytest.raises(Exception) as exc_info:
        await order_processor.process_order(
            audio_data=sample_audio_data,
            table_id=1,
            seat_number=2
        )
    assert str(exc_info.value) == "Transcription failed"

@pytest.mark.asyncio
async def test_confirm_order(order_processor):
    """Test order confirmation."""
    # Create a test order
    order = Order(
        id="test_id",
        table_id=1,
        seat_number=2,
        items=["burger", "fries"],
        status=OrderStatus.PENDING,
        raw_transcription="I would like a burger with fries"
    )
    
    # Confirm order
    updated_order = await order_processor.confirm_order(order, True)
    assert updated_order.status == OrderStatus.CONFIRMED
    
    # Cancel order
    updated_order = await order_processor.confirm_order(order, False)
    assert updated_order.status == OrderStatus.CANCELLED

@pytest.mark.asyncio
async def test_menu_item_recognition(order_processor, mock_deepgram, sample_audio_data):
    """Test recognition of various menu items."""
    test_cases = [
        (
            "I would like a cheeseburger and fries",
            ["cheeseburger", "fries"]
        ),
        (
            "Can I get a coke and a salad please",
            ["coke", "salad"]
        ),
        (
            "I'll have the chicken sandwich with extra fries and a large sprite",
            ["chicken sandwich", "fries", "sprite"]
        )
    ]
    
    for transcript, expected_items in test_cases:
        # Setup mock
        mock_deepgram.transcribe_audio.return_value = {
            "results": {
                "channels": [
                    {
                        "alternatives": [
                            {
                                "transcript": transcript
                            }
                        ]
                    }
                ]
            }
        }
        
        # Process order
        order = await order_processor.process_order(
            audio_data=sample_audio_data,
            table_id=1,
            seat_number=2
        )
        
        # Verify items were recognized
        assert all(item in order.items for item in expected_items), \
            f"Not all expected items {expected_items} were found in {order.items}" 