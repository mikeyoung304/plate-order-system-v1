import pytest
from unittest.mock import AsyncMock, patch
from app.services.monitoring.monitoring_service import MonitoringService
from app.models.metrics import TranscriptionMetrics, OrderMetrics

@pytest.fixture
def monitoring_service():
    """Create MonitoringService with mocked dependencies."""
    with patch('app.services.monitoring.monitoring_service.MetricsClient') as mock_metrics:
        mock_metrics_instance = AsyncMock()
        mock_metrics.return_value = mock_metrics_instance
        service = MonitoringService()
        yield service

@pytest.mark.asyncio
async def test_record_transcription_metrics(monitoring_service):
    """Test recording transcription metrics."""
    # Test data
    duration = 1.5
    success = True
    error = None
    
    # Record metrics
    await monitoring_service.record_transcription_metrics(duration, success, error)
    
    # Verify metrics were recorded
    monitoring_service.metrics.record_metric.assert_called_once()
    call_args = monitoring_service.metrics.record_metric.call_args[0]
    assert call_args[0] == "transcription.duration"
    assert call_args[1]["duration_ms"] == duration
    assert call_args[1]["success"] == success
    assert "timestamp" in call_args[1]

@pytest.mark.asyncio
async def test_record_transcription_error(monitoring_service):
    """Test recording transcription error."""
    # Test data
    duration = 1.5
    success = False
    error = "Transcription failed"
    
    # Record metrics
    await monitoring_service.record_transcription_metrics(duration, success, error)
    
    # Verify error was recorded
    monitoring_service.metrics.record_metric.assert_called()
    error_call = [call for call in monitoring_service.metrics.record_metric.call_args_list 
                 if call[0][0] == "transcription.error"]
    assert len(error_call) == 1
    assert error_call[0][0][1]["error"] == error
    assert "timestamp" in error_call[0][0][1]

@pytest.mark.asyncio
async def test_record_order_metrics(monitoring_service):
    """Test recording order metrics."""
    # Test data
    processing_time = 2.0
    success = True
    items_count = 3
    
    # Record metrics
    await monitoring_service.record_order_metrics(processing_time, success, num_items=items_count)
    
    # Verify metrics were recorded
    monitoring_service.metrics.record_metric.assert_called()
    calls = monitoring_service.metrics.record_metric.call_args_list
    
    # Check processing time
    processing_call = [call for call in calls if call[0][0] == "order.processing_time"]
    assert len(processing_call) == 1
    assert processing_call[0][0][1]["processing_time_ms"] == processing_time
    assert processing_call[0][0][1]["success"] == success
    assert processing_call[0][0][1]["num_items"] == items_count
    assert "timestamp" in processing_call[0][0][1]

@pytest.mark.asyncio
async def test_record_error(monitoring_service):
    """Test recording error events."""
    # Test data
    error_type = "validation_error"
    error_message = "Invalid input"
    context = {"field": "table_id", "value": None}
    
    # Record error
    await monitoring_service.record_error(error_type, error_message, context)
    
    # Verify error was recorded
    monitoring_service.metrics.record_metric.assert_called_once()
    call_args = monitoring_service.metrics.record_metric.call_args[0]
    assert call_args[0] == f"error.{error_type}"
    assert call_args[1]["error_message"] == error_message
    assert call_args[1]["context"] == context
    assert "timestamp" in call_args[1]

@pytest.mark.asyncio
async def test_record_rate_limit_hit(monitoring_service):
    """Test recording rate limit hits."""
    # Test data
    endpoint = "/api/orders"
    client_ip = "127.0.0.1"
    
    # Record rate limit hit
    await monitoring_service.record_rate_limit_hit(endpoint, client_ip)
    
    # Verify rate limit was recorded
    monitoring_service.metrics.record_metric.assert_called_once()
    call_args = monitoring_service.metrics.record_metric.call_args[0]
    assert call_args[0] == "rate_limit.hits"
    assert call_args[1]["endpoint"] == endpoint
    assert call_args[1]["client_ip"] == client_ip
    assert "timestamp" in call_args[1]

@pytest.mark.asyncio
async def test_monitor_performance_decorator(monitoring_service):
    """Test performance monitoring decorator."""
    # Create test function
    @monitoring_service.monitor_performance("test_operation")
    async def test_function():
        return "success"
    
    # Call function
    result = await test_function()
    
    # Verify result
    assert result == "success"
    
    # Verify metrics were recorded
    monitoring_service.metrics.record_metric.assert_called_once()
    call_args = monitoring_service.metrics.record_metric.call_args[0]
    assert call_args[0] == "test_operation.duration"
    assert isinstance(call_args[1]["duration_ms"], int)
    assert call_args[1]["function_name"] == "test_function"
    assert call_args[1]["success"] is True
    assert "timestamp" in call_args[1]

@pytest.mark.asyncio
async def test_monitor_errors_decorator(monitoring_service):
    """Test error monitoring decorator."""
    # Create test function that raises error
    @monitoring_service.monitor_errors("test_operation")
    async def test_function():
        raise ValueError("Test error")
    
    # Verify error is raised
    with pytest.raises(ValueError):
        await test_function()
    
    # Verify error was recorded
    monitoring_service.metrics.record_metric.assert_called_once()
    call_args = monitoring_service.metrics.record_metric.call_args[0]
    assert call_args[0] == "error.test_operation"
    assert call_args[1]["error_message"] == "Test error"
    assert call_args[1]["context"] == {"function": "test_function"}
    assert "timestamp" in call_args[1] 