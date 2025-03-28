from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.models import Table
from app.api.floor_plan import DEFAULT_TABLES

router = APIRouter(
    prefix="/tables",
    tags=["tables"],
    responses={404: {"description": "Not found"}},
)

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