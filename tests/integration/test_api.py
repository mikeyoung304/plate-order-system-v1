import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock
import base64
import logging
from src.app.core.dependencies import services
from src.app.models.order import Order, OrderStatus
from src.app.config.test_settings import test_settings

# Configure logging for tests
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@pytest.fixture(autouse=True)
def mock_services():
    """Mock all services for testing."""
    with (
        patch("sentry_sdk.init") as _,  # Assign to _ to indicate unused
        patch("app.config.settings.settings", test_settings),
    ):

        # Reset service container
        services.reset()

        # Mock monitoring service
        mock_monitoring = AsyncMock()
        mock_monitoring.get_health_status.return_value = {"status": "healthy"}
        mock_monitoring.get_system_metrics.return_value = {"cpu": 0.5, "memory": 0.7}
        mock_monitoring.record_error.return_value = None
        services._monitoring = mock_monitoring

        # Mock speech service
        mock_speech = AsyncMock()
        mock_speech.validate_setup.return_value = True
        services._speech = mock_speech

        # Mock order processor
        mock_order_processor = AsyncMock()
        services._order_processor = mock_order_processor

        yield

        # Reset after test
        services.reset()


@pytest.fixture
async def client():
    """Create async test client."""
    # Import app here after settings are patched
    from src.app.main import app

    async with AsyncClient(
        app=app, base_url=f"http://test{test_settings.API_V1_STR}"
    ) as ac:
        yield ac


@pytest.fixture
def sample_audio_data():
    """Create sample audio data for testing."""
    # Create a minimal WAV file
    wav_data = b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
    return base64.b64encode(wav_data).decode("utf-8")


@pytest.fixture
def sample_order():
    """Create a sample order for testing."""
    return Order(
        id="test_id",
        table_id=1,
        seat_number=2,
        items=["burger", "fries"],
        status=OrderStatus.PENDING,
        raw_transcription="I would like a burger with fries",
    )


@pytest.mark.asyncio
async def test_create_seat_order_success(client, sample_audio_data):
    """Test successful order creation."""
    # Mock order processor
    with patch("app.services.order.order_processor.OrderProcessor") as mock_processor:
        mock_instance = AsyncMock()
        mock_instance.process_order.return_value = Order(
            id="test_id",
            table_id=1,
            seat_number=2,
            items=["burger", "fries"],
            status=OrderStatus.PENDING,
            raw_transcription="I would like a burger with fries",
        )
        mock_processor.return_value = mock_instance

        # Make request
        response = await client.post(
            "/orders/",
            json={"audio_data": sample_audio_data, "table_id": 1, "seat_number": 2},
        )

        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "test_id"
        assert data["table_id"] == 1
        assert data["seat_number"] == 2
        assert data["items"] == ["burger", "fries"]
        assert data["status"] == "pending"
        assert data["raw_transcription"] == "I would like a burger with fries"


@pytest.mark.asyncio
async def test_create_seat_order_invalid_input(client):
    """Test order creation with invalid input."""
    # Test missing audio data
    response = await client.post("/orders/", json={"table_id": 1, "seat_number": 2})
    assert response.status_code == 422

    # Test invalid table ID
    response = await client.post(
        "/orders/", json={"audio_data": "dummy_data", "table_id": -1, "seat_number": 2}
    )
    assert response.status_code == 422

    # Test invalid seat number
    response = await client.post(
        "/orders/", json={"audio_data": "dummy_data", "table_id": 1, "seat_number": 0}
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_confirm_order_success(client, sample_order):
    """Test successful order confirmation."""
    # Mock order processor
    with patch("app.services.order.order_processor.OrderProcessor") as mock_processor:
        mock_instance = AsyncMock()
        mock_instance.confirm_order.return_value = Order(
            id="test_id",
            table_id=1,
            seat_number=2,
            items=["burger", "fries"],
            status=OrderStatus.CONFIRMED,
            raw_transcription="I would like a burger with fries",
        )
        mock_processor.return_value = mock_instance

        # Make request
        response = await client.post(
            f"/orders/{sample_order.id}/confirm", json={"confirmed": True}
        )

        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "confirmed"
        assert data["id"] == sample_order.id


@pytest.mark.asyncio
async def test_confirm_order_not_found(client):
    """Test order confirmation with non-existent order."""
    # Mock order processor to raise error
    with patch("app.services.order.order_processor.OrderProcessor") as mock_processor:
        mock_instance = AsyncMock()
        mock_instance.confirm_order.side_effect = ValueError("Order not found")
        mock_processor.return_value = mock_instance

        # Make request
        response = await client.post(
            "/orders/non_existent/confirm", json={"confirmed": True}
        )

        # Verify response
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "Order not found" in data["detail"]


@pytest.mark.asyncio
async def test_get_table_orders(client, sample_order):
    """Test retrieving orders for a table."""
    # Mock order processor
    with patch("app.services.order.order_processor.OrderProcessor") as mock_processor:
        mock_instance = AsyncMock()
        mock_instance.get_table_orders.return_value = [sample_order]
        mock_processor.return_value = mock_instance

        # Make request
        response = await client.get("/orders/table/1")

        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == sample_order.id
        assert data[0]["table_id"] == 1


@pytest.mark.asyncio
async def test_get_table_orders_empty(client):
    """Test retrieving orders for a table with no orders."""
    # Mock order processor
    with patch("app.services.order.order_processor.OrderProcessor") as mock_processor:
        mock_instance = AsyncMock()
        mock_instance.get_table_orders.return_value = []
        mock_processor.return_value = mock_instance

        # Make request
        response = await client.get("/orders/table/1")

        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0


@pytest.mark.asyncio
async def test_rate_limiting(client, sample_audio_data):
    """Test rate limiting functionality."""
    # Make multiple requests quickly
    responses = []
    for _ in range(10):  # Assuming rate limit is set to 5 requests per window
        response = await client.post(
            "/orders/",
            json={"audio_data": sample_audio_data, "table_id": 1, "seat_number": 2},
        )
        responses.append(response.status_code)

    # Verify some requests were rate limited
    assert 429 in responses  # 429 is Too Many Requests status code


@pytest.mark.asyncio
async def test_error_handling(client, sample_audio_data):
    """Test error handling in API endpoints."""
    # Mock order processor to raise error
    with patch("app.services.order.order_processor.OrderProcessor") as mock_processor:
        mock_instance = AsyncMock()
        mock_instance.process_order.side_effect = Exception("Internal error")
        mock_processor.return_value = mock_instance

        # Make request
        response = await client.post(
            "/orders/",
            json={"audio_data": sample_audio_data, "table_id": 1, "seat_number": 2},
        )

        # Verify response
        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert "Internal error" in data["detail"]
