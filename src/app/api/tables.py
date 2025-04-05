from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from src.app.db.database import get_db

# Import Seat model (assuming it exists in models.py)
from src.app.models.models import Table, Seat
from src.app.api.floor_plan import DEFAULT_TABLES

router = APIRouter(
    # prefix="/tables", # Removed prefix, handled in __init__.py
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
    current_orders: int = None  # Allow updating current orders if needed


class SeatSchema(BaseModel):
    id: int
    seat_number: int
    status: str = "available"  # Default status

    class Config:
        orm_mode = True


class TableBasicInfo(BaseModel):
    id: int
    number: int
    seats: int

    class Config:
        orm_mode = True


# Endpoint to get a simple list of tables for dropdowns
@router.get("/list", response_model=List[TableBasicInfo])
def list_tables_basic(db: Session = Depends(get_db)):
    """
    Get a basic list of tables (id, number, seats) for selection UI.
    """
    tables = db.query(Table.id, Table.number, Table.seats).order_by(Table.number).all()
    # Convert list of tuples to list of dicts/Pydantic models
    return [{"id": t[0], "number": t[1], "seats": t[2]} for t in tables]


# Remove this simplified endpoint as it conflicts/is redundant
# @router.get("/")
# def get_tables(db: Session = Depends(get_db)):
#     """
#     Get all tables - direct endpoint for frontend compatibility
#     """
#     tables = db.query(Table).order_by(Table.number).all()
#
#     # If no tables in database, return default tables with status
#     if not tables:
#         return DEFAULT_TABLES
#
#     # Convert tables to dict and add status
#     result = []
#     for table in tables:
#         table_dict = {
#             "id": table.id,
#             "number": table.number,
#             "type": table.type,
#             "x": table.x,
#             "y": table.y,
#             "status": "available"  # Default status
#         }
#         result.append(table_dict)
#
#     return result


@router.get("/layout")
def get_table_layout(db: Session = Depends(get_db)):
    """
    Get the complete table layout including dimensions and all table properties
    """
    tables = db.query(Table).order_by(Table.number).all()

    # If no tables in database, return default layout
    if not tables:
        return {"width": 1200, "height": 800, "tables": DEFAULT_TABLES}

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
            "current_orders": (
                table.current_orders if hasattr(table, "current_orders") else 0
            ),
        }
        result.append(table_dict)

    return {"width": 1200, "height": 800, "tables": result}  # Default layout dimensions


# Temporary debug endpoint
@router.get("/count")
def count_tables(db: Session = Depends(get_db)):
    count = db.query(Table).count()
    return {"table_count": count}


@router.post("/")
def create_table(table: TableCreate, db: Session = Depends(get_db)):
    """
    Create a new table
    """
    # Check if table number already exists
    existing_table = db.query(Table).filter(Table.number == table.number).first()
    if existing_table:
        raise HTTPException(
            status_code=400, detail=f"Table number {table.number} already exists"
        )

    db_table = Table(
        number=table.number,
        type=table.type,
        x=table.x,
        y=table.y,
        status=table.status,
        seats=table.seats,
        shape=table.shape,
        width=table.width,
        height=table.height,
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


@router.get("/{table_id}/seats", response_model=List[SeatSchema])
def get_seats_for_table(table_id: int, db: Session = Depends(get_db)):
    """
    Get all seats associated with a specific table.
    """
    db_table = db.query(Table).filter(Table.id == table_id).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")

    # Assuming a relationship 'seats' exists on the Table model
    # or querying Seat model directly filtering by table_id
    seats = (
        db.query(Seat)
        .filter(Seat.table_id == table_id)
        .order_by(Seat.seat_number)
        .all()
    )

    # If no seats found, return empty list (or handle as needed)
    if not seats:
        # Optionally create default seats if none exist? For now, return empty.
        return []

    return seats
