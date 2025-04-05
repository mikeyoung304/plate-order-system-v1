from fastapi import APIRouter

# from src.app.utils.meal_utils import get_current_meal_period # Removed import

router = APIRouter(tags=["meal-period"])  # Ensure NO prefix


@router.get("/current")
async def get_current_meal():
    """
    Get the current meal period based on the time of day.

    Returns:
        dict: The current meal period (breakfast, lunch, or dinner)
    """
    # current_meal = get_current_meal_period() # Removed usage
    # return {"meal_period": current_meal}
    return {"meal_period": "all_day"}  # Return a default placeholder
