from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class OrderStatus(str, Enum):
    """Order status enum."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class Order(BaseModel):
    """Order model."""
    id: str = Field(..., description="Order ID")
    table_id: int = Field(..., description="Table ID", gt=0)
    seat_number: int = Field(..., description="Seat number", gt=0)
    items: List[str] = Field(default_factory=list, description="List of ordered items")
    status: OrderStatus = Field(default=OrderStatus.PENDING, description="Order status")
    raw_transcription: str = Field(..., description="Raw transcription text")
    
    def copy(self) -> "Order":
        """Create a copy of the order."""
        return Order(
            id=self.id,
            table_id=self.table_id,
            seat_number=self.seat_number,
            items=self.items.copy(),
            status=self.status,
            raw_transcription=self.raw_transcription
        ) 