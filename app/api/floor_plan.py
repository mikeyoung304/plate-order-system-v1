from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
import logging

from app.db.database import get_db
from app.models.models import Table
from app.api.schemas import TableCreate, TableUpdate, Table as TableSchema

router = APIRouter(
    prefix="/floor-plan",
    tags=["floor-plan"],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)

# Default tables when none exist
DEFAULT_TABLES = [
    {"id": 1, "number": 1, "type": "square-4", "x": 100, "y": 100, "status": "available"},
    {"id": 2, "number": 2, "type": "square-4", "x": 250, "y": 100, "status": "occupied"},
    {"id": 3, "number": 3, "type": "square-4", "x": 400, "y": 100, "status": "available"},
    {"id": 4, "number": 4, "type": "rectangle-6", "x": 100, "y": 250, "status": "occupied"},
    {"id": 5, "number": 5, "type": "rectangle-6", "x": 250, "y": 250, "status": "available"},
    {"id": 6, "number": 6, "type": "round-4", "x": 400, "y": 250, "status": "available"}
]

@router.get("/")
def get_floor_plan(db: Session = Depends(get_db)):
    """
    Get the floor plan (all tables)
    """
    tables = db.query(Table).order_by(Table.number).all()
    
    # If no tables in database, return default tables
    if not tables:
        return DEFAULT_TABLES
        
    return tables

@router.post("/")
def save_floor_plan(tables_data: List[dict], db: Session = Depends(get_db)):
    """
    Save the entire floor plan (replaces all tables)
    """
    try:
        # Delete all existing tables
        db.query(Table).delete()
        
        # Add new tables
        db_tables = []
        for table_data in tables_data:
            db_table = Table(
                number=table_data.get("number"),
                type=table_data.get("type"),
                x=table_data.get("x"), 
                y=table_data.get("y")
            )
            db.add(db_table)
            db_tables.append(db_table)
        
        db.commit()
        
        # Refresh all tables to get their IDs
        for table in db_tables:
            db.refresh(table)
        
        return db_tables
    except Exception as e:
        logger.error(f"Error saving floor plan: {str(e)}")
        return {"error": f"Could not save floor plan: {str(e)}"}

@router.get("/tables")
def get_tables(db: Session = Depends(get_db)):
    """
    Get all tables
    """
    tables = db.query(Table).order_by(Table.number).all()
    
    # If no tables in database, return default tables
    if not tables:
        return DEFAULT_TABLES
        
    return tables

# Add a direct /api/tables endpoint for frontend compatibility
@router.get("/", include_in_schema=False)
def get_tables_root(db: Session = Depends(get_db)):
    """
    Get all tables (root endpoint for compatibility)
    """
    return get_tables(db)
