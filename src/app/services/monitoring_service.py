import logging
import time
from typing import Dict, Any, Optional
from prometheus_client import Counter, Histogram, Gauge, start_http_server, CollectorRegistry
from app.config.settings import settings

logger = logging.getLogger(__name__)

class MonitoringService:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MonitoringService, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            self.registry = CollectorRegistry()
            self._create_metrics()
            self._initialized = True
            
            # Start metrics server if enabled - temporarily disabled to prevent conflicts
            # if settings.ENABLE_METRICS:
            #    try:
            #        start_http_server(settings.METRICS_PORT)
            #        logger.info(f"Metrics server started on port {settings.METRICS_PORT}")
            #    except Exception as e:
            #        logger.error(f"Failed to start metrics server: {str(e)}")
            logger.info("Metrics server disabled to prevent port conflicts")

    def _create_metrics(self):
        """Create all metrics if they don't exist"""
        try:
            self.audio_recording_duration = Histogram(
                'audio_recording_duration_seconds',
                'Duration of audio recording in seconds',
                registry=self.registry
            )
            
            self.order_count = Counter(
                'orders_total',
                'Total number of orders processed',
                registry=self.registry
            )
            
            self.active_orders = Gauge(
                'active_orders',
                'Number of currently active orders',
                registry=self.registry
            )
            
            self.error_count = Counter(
                'errors_total',
                'Total number of errors encountered',
                registry=self.registry
            )
            
            self.transcription_duration = Histogram(
                'transcription_duration_seconds',
                'Duration of audio transcription in seconds',
                registry=self.registry
            )
            
            self.transcription_confidence = Gauge(
                'transcription_confidence',
                'Confidence score of the transcription',
                registry=self.registry
            )
            
            self.api_requests = Counter(
                'api_requests_total',
                'Total number of API requests',
                ['endpoint', 'method', 'status'],
                registry=self.registry
            )
            
            self.api_latency = Histogram(
                'api_latency_seconds',
                'API request latency in seconds',
                ['endpoint'],
                registry=self.registry
            )
            
            logger.info("All metrics created successfully")
        except Exception as e:
            logger.error(f"Error creating metrics: {str(e)}")
            raise

    def record_audio_duration(self, duration: float):
        """Record the duration of an audio recording."""
        self.audio_recording_duration.observe(duration)
    
    def record_transcription_duration(self, duration: float):
        """Record the duration of a transcription."""
        self.transcription_duration.observe(duration)
    
    def record_transcription_confidence(self, confidence: float):
        """Record the confidence score of a transcription."""
        self.transcription_confidence.set(confidence)
    
    def record_order_processed(self, status: str):
        """Record a processed order."""
        self.order_count.inc()
    
    def record_api_request(self, endpoint: str, method: str, status: int, duration: float):
        """Record an API request."""
        self.api_requests.labels(
            endpoint=endpoint,
            method=method,
            status=str(status)
        ).inc()
        self.api_latency.labels(endpoint=endpoint).observe(duration)
    
    def record_error(self, service: str, error_type: str):
        """Record an error."""
        self.error_count.inc()
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get the health status of the system."""
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "metrics_enabled": settings.ENABLE_METRICS,
            "metrics_port": settings.METRICS_PORT
        }
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get current system metrics."""
        return {
            "audio_recording_duration": {
                "count": self.audio_recording_duration._sum.get(),
                "sum": self.audio_recording_duration._sum.get(),
                "avg": self.audio_recording_duration._sum.get() / self.audio_recording_duration._count.get() if self.audio_recording_duration._count.get() > 0 else 0
            },
            "transcription_duration": {
                "count": self.transcription_duration._sum.get(),
                "sum": self.transcription_duration._sum.get(),
                "avg": self.transcription_duration._sum.get() / self.transcription_duration._count.get() if self.transcription_duration._count.get() > 0 else 0
            },
            "transcription_confidence": self.transcription_confidence._value.get(),
            "orders_processed": self.order_count._value.get(),
            "error_count": self.error_count._value.get()
        }

# Create global monitoring instance
monitoring = MonitoringService() 