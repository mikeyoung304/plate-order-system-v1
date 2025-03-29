from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, date

from app.db.database import get_db
from app.models.models import DailySpecial, MealPeriod
from app.utils.meal_utils import get_current_meal_period

router = APIRouter(prefix="/api/daily-specials", tags=["daily-specials"])

# Schemas
class DailySpecialBase(BaseModel):
    meal_period: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None

class DailySpecialCreate(DailySpecialBase):
    date: Optional[date] = None  # If not provided, defaults to today

class DailySpecialUpdate(DailySpecialBase):
    meal_period: Optional[str] = None
    name: Optional[str] = None

class DailySpecialResponse(DailySpecialBase):
    id: int
    date: date
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# API Routes
@router.post("/", response_model=DailySpecialResponse)
def create_daily_special(
    special: DailySpecialCreate, 
    db: Session = Depends(get_db)
):
    """
    Create a new daily special
    """
    # Default to today if no date provided
    special_date = special.date or datetime.now().date()
    
    # Check if a special already exists for this date and meal period
    existing_special = db.query(DailySpecial).filter(
        DailySpecial.date == special_date,
        DailySpecial.meal_period == special.meal_period
    ).first()
    
    if existing_special:
        raise HTTPException(
            status_code=400,
            detail=f"A special already exists for {special_date} during {special.meal_period}"
        )
    
    # Create new daily special
    db_special = DailySpecial(
        date=special_date,
        meal_period=special.meal_period,
        name=special.name,
        description=special.description,
        image_url=special.image_url
    )
    
    db.add(db_special)
    db.commit()
    db.refresh(db_special)
    
    return db_special

@router.get("/", response_model=List[DailySpecialResponse])
def get_daily_specials(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    meal_period: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get daily specials, optionally filtered by date range and meal period
    """
    query = db.query(DailySpecial)
    
    if date_from:
        query = query.filter(DailySpecial.date >= date_from)
    if date_to:
        query = query.filter(DailySpecial.date <= date_to)
    if meal_period:
        query = query.filter(DailySpecial.meal_period == meal_period)
    
    return query.order_by(DailySpecial.date.desc()).all()

@router.get("/current", response_model=DailySpecialResponse)
def get_current_daily_special(db: Session = Depends(get_db)):
    """
    Get the current daily special based on the current date and meal period
    """
    current_date = datetime.now().date()
    current_meal = get_current_meal_period()
    
    special = db.query(DailySpecial).filter(
        DailySpecial.date == current_date,
        DailySpecial.meal_period == current_meal
    ).first()
    
    if not special:
        raise HTTPException(
            status_code=404,
            detail=f"No special found for today ({current_date}) during {current_meal}"
        )
    
    return special

@router.get("/{special_id}", response_model=DailySpecialResponse)
def get_daily_special(special_id: int, db: Session = Depends(get_db)):
    """
    Get a specific daily special by ID
    """
    special = db.query(DailySpecial).filter(DailySpecial.id == special_id).first()
    
    if not special:
        raise HTTPException(status_code=404, detail="Daily special not found")
    
    return special

@router.put("/{special_id}", response_model=DailySpecialResponse)
def update_daily_special(
    special_id: int, 
    special_update: DailySpecialUpdate, 
    db: Session = Depends(get_db)
):
    """
    Update a daily special
    """
    db_special = db.query(DailySpecial).filter(DailySpecial.id == special_id).first()
    
    if not db_special:
        raise HTTPException(status_code=404, detail="Daily special not found")
    
    # Update the fields
    update_data = special_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_special, key, value)
    
    db_special.updated_at = datetime.now()
    
    db.commit()
    db.refresh(db_special)
    
    return db_special

@router.delete("/{special_id}")
def delete_daily_special(special_id: int, db: Session = Depends(get_db)):
    """
    Delete a daily special
    """
    db_special = db.query(DailySpecial).filter(DailySpecial.id == special_id).first()
    
    if not db_special:
        raise HTTPException(status_code=404, detail="Daily special not found")
    
    db.delete(db_special)
    db.commit()
    
    return {"message": "Daily special deleted successfully"} 