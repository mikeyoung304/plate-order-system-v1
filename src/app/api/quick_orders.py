from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.models.models import Order, Resident, MealPeriod
from app.utils.meal_utils import get_frequent_orders, get_resident_for_seat, get_daily_special

router = APIRouter(prefix="/api/quick-orders", tags=["quick-orders"])

# Schemas
class QuickOrderOption(BaseModel):
    id: str
    details: str
    frequency: int

class QuickOrderOptionsResponse(BaseModel):
    options: List[QuickOrderOption]
    resident: Optional[dict] = None

@router.get("/table/{table_id}/seat/{seat_number}", response_model=QuickOrderOptionsResponse)
async def get_quick_order_options(
    table_id: int, 
    seat_number: int,
    meal_period: str = Query(..., description="Current meal period (breakfast, lunch, dinner)"),
    db: Session = Depends(get_db)
):
    """
    Get quick order options for a specific table, seat, and meal period
    
    Args:
        table_id: The table ID
        seat_number: The seat number
        meal_period: The meal period (breakfast, lunch, dinner)
        
    Returns:
        QuickOrderOptionsResponse: Quick order options and resident information
    """
    # Try to identify the resident typically sitting at this seat
    resident = get_resident_for_seat(db, table_id, seat_number)
    
    if not resident:
        # No resident found for this seat, return empty options
        return QuickOrderOptionsResponse(options=[])
    
    # Get frequent orders for this resident during this meal period
    frequent_orders = get_frequent_orders(db, resident.id, meal_period, limit=3)
    
    # Format the options
    options = []
    for i, order in enumerate(frequent_orders):
        options.append(
            QuickOrderOption(
                id=f"{resident.id}_{i}",
                details=order.details,
                frequency=1  # This would be calculated based on order history
            )
        )
    
    # Format resident info with dietary restrictions if available
    resident_info = None
    if resident:
        resident_info = {
            "id": resident.id,
            "name": resident.name,
            "medical_dietary": resident.medical_dietary if resident.medical_dietary else [],
            "texture_prefs": resident.texture_prefs if resident.texture_prefs else []
        }
    
    return QuickOrderOptionsResponse(options=options, resident=resident_info) 