from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class SeatOrder(BaseModel):
    """Model for a seat-specific order."""
    table_id: int
    seat_number: int
    items: List[str]
    status: str = "pending"  # pending, confirmed, cancelled
    raw_transcription: Optional[str] = None
    processed_order: Optional[str] = None
    created_at: datetime = datetime.now()
    confirmed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class SeatOrderCreate(BaseModel):
    """Model for creating a seat order."""
    table_id: int
    seat_number: int
    audio_data: str  # base64 encoded audio data

class SeatOrderResponse(BaseModel):
    """Model for seat order response."""
    id: int
    table_id: int
    seat_number: int
    items: List[str]
    status: str
    raw_transcription: Optional[str]
    processed_order: Optional[str]
    created_at: datetime
    confirmed_at: Optional[datetime]

class SeatOrderConfirm(BaseModel):
    """Model for confirming a seat order."""
    id: int
    confirmed: bool 