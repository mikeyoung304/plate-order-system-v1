from typing import Optional
from fastapi import Depends
from app.services.monitoring_service import MonitoringService
from app.services.voice.speech_service import SpeechService
from app.services.order.order_processor import OrderProcessor
from app.config.settings import settings

class ServiceContainer:
    def __init__(self):
        self._monitoring: Optional[MonitoringService] = None
        self._speech: Optional[SpeechService] = None
        self._order_processor: Optional[OrderProcessor] = None

    @property
    def monitoring(self) -> MonitoringService:
        if self._monitoring is None:
            self._monitoring = MonitoringService()
        return self._monitoring

    @property
    def speech(self) -> SpeechService:
        if self._speech is None:
            self._speech = SpeechService()
        return self._speech

    @property
    def order_processor(self) -> OrderProcessor:
        if self._order_processor is None:
            self._order_processor = OrderProcessor()
        return self._order_processor

    def reset(self):
        """Reset all services - useful for testing"""
        self._monitoring = None
        self._speech = None
        self._order_processor = None

# Global service container
services = ServiceContainer()

# Dependency injection functions
def get_monitoring() -> MonitoringService:
    return services.monitoring

def get_speech() -> SpeechService:
    return services.speech

def get_order_processor() -> OrderProcessor:
    return services.order_processor 