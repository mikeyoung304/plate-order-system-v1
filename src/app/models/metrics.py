from pydantic import BaseModel


class TranscriptionMetrics(BaseModel):
    """Transcription metrics model."""

    avg_duration_ms: float
    success_rate: float
    total_count: int
    error_count: int


class OrderMetrics(BaseModel):
    """Order metrics model."""

    avg_processing_time_ms: float
    success_rate: float
    total_orders: int
    failed_orders: int
    avg_items_per_order: float
