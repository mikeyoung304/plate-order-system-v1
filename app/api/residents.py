from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta

from db.database import get_db
from models.models import Resident, Order
from api.schemas import ResidentCreate, ResidentUpdate, Resident as ResidentSchema

router = APIRouter(
    prefix="/residents",
    tags=["residents"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=ResidentSchema)
def create_resident(resident: ResidentCreate, db: Session = Depends(get_db)):
    """
    Create a new resident
    """
    db_resident = Resident(
        name=resident.name,
        photo_url=resident.photo_url,
        medical_dietary=resident.medical_dietary,
        texture_prefs=resident.texture_prefs,
        notes=resident.notes
    )
    db.add(db_resident)
    db.commit()
    db.refresh(db_resident)
    return db_resident

@router.get("/", response_model=List[ResidentSchema])
def read_residents(
    skip: int = 0, 
    limit: int = 100,
    name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve residents, optionally filtered by name
    """
    query = db.query(Resident)
    
    # Apply name filter if provided
    if name:
        query = query.filter(Resident.name.ilike(f"%{name}%"))
    
    return query.order_by(Resident.name).offset(skip).limit(limit).all()

@router.get("/count")
def get_residents_count(db: Session = Depends(get_db)):
    """
    Get the total number of residents
    """
    count = db.query(func.count(Resident.id)).scalar()
    return {"count": count}

@router.get("/{resident_id}", response_model=ResidentSchema)
def read_resident(resident_id: int, db: Session = Depends(get_db)):
    """
    Get a specific resident by ID
    """
    db_resident = db.query(Resident).filter(Resident.id == resident_id).first()
    if db_resident is None:
        raise HTTPException(status_code=404, detail="Resident not found")
    return db_resident

@router.put("/{resident_id}", response_model=ResidentSchema)
def update_resident(resident_id: int, resident: ResidentUpdate, db: Session = Depends(get_db)):
    """
    Update a resident
    """
    db_resident = db.query(Resident).filter(Resident.id == resident_id).first()
    if db_resident is None:
        raise HTTPException(status_code=404, detail="Resident not found")
    
    # Update resident fields
    for key, value in resident.dict(exclude_unset=True).items():
        if value is not None:
            setattr(db_resident, key, value)
    
    db.commit()
    db.refresh(db_resident)
    return db_resident

@router.delete("/{resident_id}")
def delete_resident(resident_id: int, db: Session = Depends(get_db)):
    """
    Delete a resident
    """
    db_resident = db.query(Resident).filter(Resident.id == resident_id).first()
    if db_resident is None:
        raise HTTPException(status_code=404, detail="Resident not found")
    
    # Check if resident has associated orders
    order_count = db.query(func.count(Order.id)).filter(Order.resident_id == resident_id).scalar()
    if order_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete resident with {order_count} associated orders"
        )
    
    db.delete(db_resident)
    db.commit()
    return {"message": "Resident deleted successfully"}

@router.get("/{resident_id}/orders")
def get_resident_orders(
    resident_id: int, 
    skip: int = 0, 
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get orders for a specific resident
    """
    # First check if the resident exists
    db_resident = db.query(Resident).filter(Resident.id == resident_id).first()
    if db_resident is None:
        raise HTTPException(status_code=404, detail="Resident not found")
    
    # Get the orders
    orders = db.query(Order).filter(
        Order.resident_id == resident_id
    ).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
    return orders
