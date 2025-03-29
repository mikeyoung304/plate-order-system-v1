from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel

from app.db.database import get_db
from app.models.models import Table
from app.api.floor_plan import DEFAULT_TABLES

router = APIRouter(
    prefix="/tables",
    tags=["tables"],
    responses={404: {"description": "Not found"}},
)

class TableCreate(BaseModel):
    number: int
    type: str
    x: float
    y: float
    status: str = "available"
    seats: int
    shape: str
    width: float
    height: float

class TableUpdate(BaseModel):
    number: int = None
    type: str = None
    x: float = None
    y: float = None
    status: str = None
    seats: int = None
    shape: str = None
    width: float = None
    height: float = None

@router.get("/")
def get_tables(db: Session = Depends(get_db)):
    """
    Get all tables - direct endpoint for frontend compatibility
    """
    tables = db.query(Table).order_by(Table.number).all()
    
    # If no tables in database, return default tables with status
    if not tables:
        return DEFAULT_TABLES
        
    # Convert tables to dict and add status
    result = []
    for table in tables:
        table_dict = {
            "id": table.id,
            "number": table.number,
            "type": table.type,
            "x": table.x,
            "y": table.y,
            "status": "available"  # Default status
        }
        result.append(table_dict)
        
    return result

@router.get("/layout")
def get_table_layout(db: Session = Depends(get_db)):
    """
    Get the complete table layout including dimensions and all table properties
    """
    tables = db.query(Table).order_by(Table.number).all()
    
    # If no tables in database, return default layout
    if not tables:
        return {
            "width": 1200,
            "height": 800,
            "tables": DEFAULT_TABLES
        }
    
    # Convert tables to dict with all properties
    result = []
    for table in tables:
        table_dict = {
            "id": table.id,
            "number": table.number,
            "type": table.type,
            "x": table.x,
            "y": table.y,
            "status": table.status or "available",
            "seats": table.seats,
            "shape": table.shape,
            "width": table.width,
            "height": table.height,
            "current_orders": table.current_orders if hasattr(table, 'current_orders') else 0
        }
        result.append(table_dict)
    
    return {
        "width": 1200,  # Default layout dimensions
        "height": 800,
        "tables": result
    }

@router.post("/")
def create_table(table: TableCreate, db: Session = Depends(get_db)):
    """
    Create a new table
    """
    # Check if table number already exists
    existing_table = db.query(Table).filter(Table.number == table.number).first()
    if existing_table:
        raise HTTPException(status_code=400, detail=f"Table number {table.number} already exists")
    
    db_table = Table(
        number=table.number,
        type=table.type,
        x=table.x,
        y=table.y,
        status=table.status,
        seats=table.seats,
        shape=table.shape,
        width=table.width,
        height=table.height
    )
    
    db.add(db_table)
    db.commit()
    db.refresh(db_table)
    
    return db_table

@router.put("/{table_id}")
def update_table(table_id: int, table: TableUpdate, db: Session = Depends(get_db)):
    """
    Update an existing table
    """
    db_table = db.query(Table).filter(Table.id == table_id).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Update only provided fields
    update_data = table.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_table, field, value)
    
    db.commit()
    db.refresh(db_table)
    
    return db_table

@router.delete("/{table_id}")
def delete_table(table_id: int, db: Session = Depends(get_db)):
    """
    Delete a table
    """
    db_table = db.query(Table).filter(Table.id == table_id).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    db.delete(db_table)
    db.commit()
    
    return {"message": "Table deleted successfully"}