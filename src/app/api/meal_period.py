from fastapi import APIRouter, Depends
from app.utils.meal_utils import get_current_meal_period

router = APIRouter(prefix="/api/meal-period", tags=["meal-period"])

@router.get("/current")
async def get_current_meal():
    """
    Get the current meal period based on the time of day.
    
    Returns:
        dict: The current meal period (breakfast, lunch, or dinner)
    """
    current_meal = get_current_meal_period()
    return {"meal_period": current_meal} 