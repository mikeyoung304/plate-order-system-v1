import pytest
from unittest.mock import AsyncMock
import base64
from src.app.services.order.order_processor import OrderProcessor
from src.app.models.order import Order, OrderStatus


@pytest.fixture
def order_processor():
    """Create a test order processor."""
    processor = OrderProcessor()
    processor.deepgram = AsyncMock()
    processor.monitoring = AsyncMock()
    return processor


@pytest.fixture
def sample_audio_data():
    """Create sample audio data for testing."""
    # Create a minimal WAV file
    wav_data = b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
    return base64.b64encode(wav_data).decode("utf-8")


@pytest.mark.asyncio
async def test_process_order_success(order_processor, sample_audio_data):
    """Test successful order processing."""
    # Configure mock to return transcript
    order_processor.deepgram.transcribe_audio.return_value = {
        "results": {
            "channels": [
                {
                    "alternatives": [
                        {
                            "transcript": "I would like a burger with fries",
                            "confidence": 0.9,
                        }
                    ]
                }
            ]
        }
    }

    # Process order
    order = await order_processor.process_order(sample_audio_data, 1, 2)

    # Verify order
    assert order.table_id == 1
    assert order.seat_number == 2
    assert order.items == ["burger", "fries"]
    assert order.status == OrderStatus.PENDING
    assert order.raw_transcription == "I would like a burger with fries"


@pytest.mark.asyncio
async def test_process_order_no_items(order_processor, sample_audio_data):
    """Test order processing with no menu items found."""
    # Configure mock to return transcript with no menu items
    order_processor.deepgram.transcribe_audio.return_value = {
        "results": {
            "channels": [
                {
                    "alternatives": [
                        {"transcript": "I would like something else", "confidence": 0.9}
                    ]
                }
            ]
        }
    }

    # Process order
    order = await order_processor.process_order(sample_audio_data, 1, 2)

    # Verify order
    assert order.table_id == 1
    assert order.seat_number == 2
    assert order.items == []
    assert order.status == OrderStatus.PENDING
    assert order.raw_transcription == "I would like something else"


@pytest.mark.asyncio
async def test_process_order_error(order_processor):
    """Test order processing with error."""
    # Configure mock to raise exception
    order_processor.deepgram.transcribe_audio.side_effect = Exception(
        "Transcription failed"
    )

    # Verify error is raised
    with pytest.raises(Exception):
        await order_processor.process_order(b"dummy_audio", 1, 2)


@pytest.mark.asyncio
async def test_confirm_order_success(order_processor):
    """Test successful order confirmation."""
    # Create test order
    order = Order(
        id="test_id",
        table_id=1,
        seat_number=2,
        items=["burger", "fries"],
        status=OrderStatus.PENDING,
        raw_transcription="I would like a burger with fries",
    )

    # Confirm order
    confirmed_order = await order_processor.confirm_order(order, True)

    # Verify order
    assert confirmed_order.status == OrderStatus.CONFIRMED
    assert confirmed_order.id == order.id
    assert confirmed_order.items == order.items


@pytest.mark.asyncio
async def test_confirm_order_cancel(order_processor):
    """Test order cancellation."""
    # Create test order
    order = Order(
        id="test_id",
        table_id=1,
        seat_number=2,
        items=["burger", "fries"],
        status=OrderStatus.PENDING,
        raw_transcription="I would like a burger with fries",
    )

    # Cancel order
    cancelled_order = await order_processor.confirm_order(order, False)

    # Verify order
    assert cancelled_order.status == OrderStatus.CANCELLED
    assert cancelled_order.id == order.id
    assert cancelled_order.items == order.items


@pytest.mark.asyncio
async def test_confirm_order_error(order_processor):
    """Test order confirmation with error."""
    # Create test order
    order = Order(
        id="test_id",
        table_id=1,
        seat_number=2,
        items=["burger", "fries"],
        status=OrderStatus.PENDING,
        raw_transcription="I would like a burger with fries",
    )

    # Configure mock to raise exception
    order_processor.monitoring.record_order_metrics.side_effect = Exception(
        "Metrics error"
    )

    # Verify error is raised
    with pytest.raises(Exception):
        await order_processor.confirm_order(order, True)


def test_extract_menu_items(order_processor):
    """Test menu item extraction from transcript."""
    # Test cases
    test_cases = [
        ("I would like a burger with fries", ["burger", "fries"]),
        ("Can I get a coke and a salad", ["coke", "salad"]),
        ("I want a chicken sandwich and water", ["chicken sandwich", "water"]),
        ("Just a coffee please", ["coffee"]),
        ("Nothing from the menu", []),
    ]

    # Run tests
    for transcript, expected in test_cases:
        items = order_processor._extract_menu_items(transcript)
        assert items == expected
