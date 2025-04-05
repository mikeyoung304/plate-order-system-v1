import pytest
import logging
import asyncio
import base64
from unittest.mock import AsyncMock, patch
from src.app.core.dependencies import services
from src.app.services.order.order_processor import OrderProcessor
from src.app.services.monitoring.monitoring_service import MonitoringService
from src.app.services.speech.deepgram_service import DeepgramService
from src.app.services.mock_redis import MockRedis

# Configure logging for tests
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_redis():
    """Create a mock Redis instance."""
    return MockRedis()


@pytest.fixture(autouse=True)
async def setup_test_environment(mock_redis):
    """Set up the test environment."""
    # Import test settings
    from src.app.config.test_settings import test_settings

    # Patch settings and Redis
    with patch("app.config.settings.settings", test_settings):
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
        mock_speech.transcribe_audio.return_value = {
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
        services._speech = mock_speech

        # Mock order processor
        mock_order_processor = AsyncMock()
        services._order_processor = mock_order_processor

        yield

        # Cleanup
        services.reset()


@pytest.fixture
async def test_client():
    """Create a test client with mocked dependencies."""
    from src.app.main import app
    from httpx import AsyncClient
    from src.app.config.test_settings import test_settings

    async with AsyncClient(
        app=app, base_url=f"http://test{test_settings.API_V1_STR}"
    ) as client:
        yield client


@pytest.fixture
def sample_audio_data():
    """Create sample audio data for testing."""
    # Create a minimal WAV file
    wav_data = b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
    return base64.b64encode(wav_data).decode("utf-8")


@pytest.fixture
def sample_order():
    """Create a sample order for testing."""
    from src.app.models.order import Order, OrderStatus

    return Order(
        id="test_id",
        table_id=1,
        seat_number=2,
        details="burger, fries",
        status=OrderStatus.PENDING,
        raw_transcription="I would like a burger with fries",
    )


@pytest.fixture
async def order_processor():
    """Create OrderProcessor with mocked dependencies."""
    with (
        patch("app.services.order.order_processor.DeepgramService") as mock_deepgram,
        patch(
            "app.services.order.order_processor.MonitoringService"
        ) as mock_monitoring,
    ):

        # Configure mocks
        mock_deepgram_instance = AsyncMock()
        mock_deepgram_instance.transcribe_audio.return_value = {
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
        mock_deepgram.return_value = mock_deepgram_instance

        mock_monitoring_instance = AsyncMock()
        mock_monitoring.return_value = mock_monitoring_instance

        processor = OrderProcessor()
        yield processor


@pytest.fixture
async def monitoring_service():
    """Create MonitoringService with mocked dependencies."""
    with patch(
        "app.services.monitoring.monitoring_service.MetricsClient"
    ) as mock_metrics:
        mock_metrics_instance = AsyncMock()
        mock_metrics.return_value = mock_metrics_instance
        service = MonitoringService()
        yield service


@pytest.fixture
async def deepgram_service():
    """Create DeepgramService with test API key."""
    with patch(
        "app.services.speech.deepgram_service.settings.DEEPGRAM_API_KEY", "test_key"
    ):
        service = DeepgramService()
        yield service
