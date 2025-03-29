import pytest
from unittest.mock import Mock, patch
import time
from app.services.monitoring.monitoring_service import MonitoringService
from app.models.metrics import OrderMetrics, TranscriptionMetrics

@pytest.fixture
def monitoring_service():
    return MonitoringService()

@pytest.fixture
def mock_metrics_client():
    with patch('app.services.monitoring.monitoring_service.MetricsClient') as mock:
        mock_instance = Mock()
        mock.return_value = mock_instance
        yield mock_instance

def test_record_transcription_metrics(monitoring_service, mock_metrics_client):
    """Test recording transcription metrics."""
    # Record metrics
    monitoring_service.record_transcription_metrics(
        duration_ms=1500,
        success=True,
        error=None,
        audio_length_ms=2000
    )
    
    # Verify metrics were recorded
    mock_metrics_client.record_metric.assert_called_with(
        "transcription",
        {
            "duration_ms": 1500,
            "success": True,
            "error": None,
            "audio_length_ms": 2000
        }
    )

def test_record_order_metrics(monitoring_service, mock_metrics_client):
    """Test recording order metrics."""
    # Record metrics
    monitoring_service.record_order_metrics(
        processing_time_ms=500,
        success=True,
        error=None,
        num_items=3,
        table_id=1,
        seat_number=2
    )
    
    # Verify metrics were recorded
    mock_metrics_client.record_metric.assert_called_with(
        "order_processing",
        {
            "processing_time_ms": 500,
            "success": True,
            "error": None,
            "num_items": 3,
            "table_id": 1,
            "seat_number": 2
        }
    )

def test_record_error_metrics(monitoring_service, mock_metrics_client):
    """Test recording error metrics."""
    # Record error
    error = ValueError("Test error")
    monitoring_service.record_error(
        error=error,
        context="test_context"
    )
    
    # Verify error was recorded
    mock_metrics_client.record_metric.assert_called_with(
        "error",
        {
            "error_type": "ValueError",
            "error_message": "Test error",
            "context": "test_context"
        }
    )

def test_get_transcription_metrics(monitoring_service, mock_metrics_client):
    """Test getting transcription metrics."""
    # Setup mock return value
    mock_metrics = TranscriptionMetrics(
        avg_duration_ms=1000,
        success_rate=0.95,
        total_count=100,
        error_count=5
    )
    mock_metrics_client.get_metrics.return_value = mock_metrics
    
    # Get metrics
    metrics = monitoring_service.get_transcription_metrics()
    
    # Verify metrics
    assert metrics.avg_duration_ms == 1000
    assert metrics.success_rate == 0.95
    assert metrics.total_count == 100
    assert metrics.error_count == 5

def test_get_order_metrics(monitoring_service, mock_metrics_client):
    """Test getting order metrics."""
    # Setup mock return value
    mock_metrics = OrderMetrics(
        avg_processing_time_ms=500,
        success_rate=0.98,
        total_orders=200,
        failed_orders=4,
        avg_items_per_order=2.5
    )
    mock_metrics_client.get_metrics.return_value = mock_metrics
    
    # Get metrics
    metrics = monitoring_service.get_order_metrics()
    
    # Verify metrics
    assert metrics.avg_processing_time_ms == 500
    assert metrics.success_rate == 0.98
    assert metrics.total_orders == 200
    assert metrics.failed_orders == 4
    assert metrics.avg_items_per_order == 2.5

def test_performance_monitoring(monitoring_service, mock_metrics_client):
    """Test performance monitoring decorator."""
    # Define a test function to monitor
    @monitoring_service.monitor_performance
    def test_function():
        time.sleep(0.1)  # Simulate some work
        return "test_result"
    
    # Call the monitored function
    result = test_function()
    
    # Verify result
    assert result == "test_result"
    
    # Verify metrics were recorded
    mock_metrics_client.record_metric.assert_called()
    call_args = mock_metrics_client.record_metric.call_args[0]
    assert call_args[0] == "function_performance"
    assert "duration_ms" in call_args[1]
    assert "function_name" in call_args[1]
    assert call_args[1]["function_name"] == "test_function"

def test_error_monitoring(monitoring_service, mock_metrics_client):
    """Test error monitoring decorator."""
    # Define a test function that raises an error
    @monitoring_service.monitor_errors
    def error_function():
        raise ValueError("Test error")
    
    # Call the monitored function
    with pytest.raises(ValueError):
        error_function()
    
    # Verify error was recorded
    mock_metrics_client.record_metric.assert_called_with(
        "error",
        {
            "error_type": "ValueError",
            "error_message": "Test error",
            "context": "error_function"
        }
    )

def test_rate_limiting_metrics(monitoring_service, mock_metrics_client):
    """Test recording rate limiting metrics."""
    # Record rate limit hit
    monitoring_service.record_rate_limit_hit(
        endpoint="/api/test",
        client_ip="127.0.0.1"
    )
    
    # Verify metrics were recorded
    mock_metrics_client.record_metric.assert_called_with(
        "rate_limit",
        {
            "endpoint": "/api/test",
            "client_ip": "127.0.0.1",
            "timestamp": mock_metrics_client.record_metric.call_args[0][1]["timestamp"]
        }
    ) 