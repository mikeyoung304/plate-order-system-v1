from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import logging

from src.app.db.database import get_db
from src.app.models.models import Table

router = APIRouter(
    prefix="/floor-plan",
    tags=["floor-plan"],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)

# Default tables when none exist
# Corresponds to frontend/src/components/TableManagement.tsx -> interface Table
# Added: shape, seats, width, height, current_orders
DEFAULT_TABLES = [
    {
        "id": 1,
        "number": 1,
        "type": "standard",
        "x": 100,
        "y": 100,
        "status": "available",
        "shape": "square",
        "seats": 4,
        "width": 100,
        "height": 100,
        "current_orders": 0,
    },
    {
        "id": 2,
        "number": 2,
        "type": "standard",
        "x": 250,
        "y": 100,
        "status": "occupied",
        "shape": "square",
        "seats": 4,
        "width": 100,
        "height": 100,
        "current_orders": 1,
    },  # Example: 1 order
    {
        "id": 3,
        "number": 3,
        "type": "standard",
        "x": 400,
        "y": 100,
        "status": "available",
        "shape": "square",
        "seats": 4,
        "width": 100,
        "height": 100,
        "current_orders": 0,
    },
    {
        "id": 4,
        "number": 4,
        "type": "standard",
        "x": 100,
        "y": 250,
        "status": "occupied",
        "shape": "rectangle",
        "seats": 6,
        "width": 150,
        "height": 100,
        "current_orders": 2,
    },  # Example: 2 orders
    {
        "id": 5,
        "number": 5,
        "type": "standard",
        "x": 250,
        "y": 250,
        "status": "available",
        "shape": "rectangle",
        "seats": 6,
        "width": 150,
        "height": 100,
        "current_orders": 0,
    },
    {
        "id": 6,
        "number": 6,
        "type": "booth",
        "x": 400,
        "y": 250,
        "status": "available",
        "shape": "circle",
        "seats": 4,
        "width": 100,
        "height": 100,
        "current_orders": 0,
    },  # Changed type to booth, shape to circle
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
                y=table_data.get("y"),
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


# Remove conflicting /tables endpoint (should be handled by tables.py)
# @router.get("/tables")
# def get_tables(db: Session = Depends(get_db)):
#     """
#     Get all tables
#     """
#     tables = db.query(Table).order_by(Table.number).all()
#
#     # If no tables in database, return default tables
#     if not tables:
#         return DEFAULT_TABLES
#
#     return tables

# Remove redundant root endpoint (already defined above)
# @router.get("/", include_in_schema=False)
# def get_tables_root(db: Session = Depends(get_db)):
#     """
#     Get all tables (root endpoint for compatibility)
#     """
#     return get_tables(db)
