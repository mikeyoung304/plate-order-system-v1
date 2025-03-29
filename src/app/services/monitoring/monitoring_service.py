import time
import logging
from typing import Optional, Dict, Any, Callable, TypeVar, Awaitable
from functools import wraps
from app.config.settings import settings

logger = logging.getLogger(__name__)

T = TypeVar('T')

class MetricsClient:
    """Mock metrics client for testing."""
    def __init__(self):
        self.metrics = {}
    
    async def record_metric(self, metric_type: str, data: Dict[str, Any]):
        """Record a metric."""
        if metric_type not in self.metrics:
            self.metrics[metric_type] = []
        self.metrics[metric_type].append(data)
    
    async def get_metrics(self, metric_type: str) -> list:
        """Get metrics of a specific type."""
        return self.metrics.get(metric_type, [])

class MonitoringService:
    """Service for monitoring and recording metrics."""
    
    def __init__(self):
        self.metrics_client = MetricsClient()
        # Alias for testing compatibility
        self.metrics = self.metrics_client
    
    async def record_transcription_metrics(
        self,
        duration_ms: int,
        success: bool,
        error: Optional[str] = None,
        audio_length_ms: Optional[int] = None
    ):
        """Record metrics for a transcription operation."""
        # Record duration
        await self.metrics_client.record_metric(
            "transcription.duration",
            {
                "duration_ms": duration_ms,
                "success": success,
                "audio_length_ms": audio_length_ms,
                "timestamp": time.time()
            }
        )
        
        # Record error if any
        if error:
            await self.metrics_client.record_metric(
                "transcription.error",
                {
                    "error": error,
                    "timestamp": time.time()
                }
            )
    
    async def record_order_metrics(
        self,
        processing_time_ms: int,
        success: bool,
        error: Optional[str] = None,
        num_items: Optional[int] = None,
        table_id: Optional[int] = None,
        seat_number: Optional[int] = None
    ):
        """Record metrics for order processing."""
        # Record processing time
        await self.metrics_client.record_metric(
            "order.processing_time",
            {
                "processing_time_ms": processing_time_ms,
                "success": success,
                "num_items": num_items,
                "table_id": table_id,
                "seat_number": seat_number,
                "timestamp": time.time()
            }
        )
        
        # Record error if any
        if error:
            await self.metrics_client.record_metric(
                "order.error",
                {
                    "error": error,
                    "timestamp": time.time()
                }
            )
    
    async def record_error(self, error_type: str, error_message: str, context: Optional[Dict[str, Any]] = None):
        """Record an error event."""
        await self.metrics_client.record_metric(
            f"error.{error_type}",
            {
                "error_message": error_message,
                "context": context or {},
                "timestamp": time.time()
            }
        )
    
    async def record_rate_limit_hit(self, endpoint: str, client_ip: str):
        """Record a rate limit hit."""
        await self.metrics_client.record_metric(
            "rate_limit.hits",
            {
                "endpoint": endpoint,
                "client_ip": client_ip,
                "timestamp": time.time()
            }
        )
    
    def monitor_performance(self, operation_name: str) -> Callable[[Callable[..., Awaitable[T]]], Callable[..., Awaitable[T]]]:
        """Decorator to monitor function performance."""
        def decorator(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
            @wraps(func)
            async def wrapper(*args, **kwargs) -> T:
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    duration_ms = int((time.time() - start_time) * 1000)
                    await self.metrics_client.record_metric(
                        f"{operation_name}.duration",
                        {
                            "function_name": func.__name__,
                            "duration_ms": duration_ms,
                            "success": True,
                            "timestamp": time.time()
                        }
                    )
                    return result
                except Exception as e:
                    duration_ms = int((time.time() - start_time) * 1000)
                    await self.metrics_client.record_metric(
                        f"{operation_name}.error",
                        {
                            "function_name": func.__name__,
                            "duration_ms": duration_ms,
                            "error": str(e),
                            "timestamp": time.time()
                        }
                    )
                    raise
            return wrapper
        return decorator
    
    def monitor_errors(self, operation_name: str) -> Callable[[Callable[..., Awaitable[T]]], Callable[..., Awaitable[T]]]:
        """Decorator to monitor function errors."""
        def decorator(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
            @wraps(func)
            async def wrapper(*args, **kwargs) -> T:
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    await self.record_error(operation_name, str(e), {"function": func.__name__})
                    raise
            return wrapper
        return decorator 