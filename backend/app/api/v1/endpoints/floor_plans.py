from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.v1.dependencies.db import get_db
from app.db.repositories.floor_plans import FloorPlanRepository
from app.api.v1.schemas import (
    FloorPlan, FloorPlanCreate, FloorPlanUpdate,
    Table, TableCreate, TableUpdate, TableBulk,
    Seat, SeatCreate, SeatUpdate
)

router = APIRouter()

@router.get("/floor-plans", response_model=List[FloorPlan])
def get_floor_plans(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Get all floor plans
    """
    floor_plan_repo = FloorPlanRepository(db)
    return floor_plan_repo.get_multi(skip=skip, limit=limit)

@router.post("/floor-plans", response_model=FloorPlan)
def create_floor_plan(
    floor_plan_in: FloorPlanCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new floor plan
    """
    floor_plan_repo = FloorPlanRepository(db)
    return floor_plan_repo.create(obj_in=floor_plan_in)

@router.get("/floor-plans/{floor_plan_id}", response_model=FloorPlan)
def get_floor_plan(
    floor_plan_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific floor plan by ID
    """
    floor_plan_repo = FloorPlanRepository(db)
    floor_plan = floor_plan_repo.get(id=floor_plan_id)
    if not floor_plan:
        raise HTTPException(status_code=404, detail="Floor plan not found")
    return floor_plan

@router.put("/floor-plans/{floor_plan_id}", response_model=FloorPlan)
def update_floor_plan(
    floor_plan_id: str,
    floor_plan_in: FloorPlanUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a floor plan
    """
    floor_plan_repo = FloorPlanRepository(db)
    floor_plan = floor_plan_repo.get(id=floor_plan_id)
    if not floor_plan:
        raise HTTPException(status_code=404, detail="Floor plan not found")
    return floor_plan_repo.update(db_obj=floor_plan, obj_in=floor_plan_in)

@router.delete("/floor-plans/{floor_plan_id}", response_model=FloorPlan)
def delete_floor_plan(
    floor_plan_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a floor plan
    """
    floor_plan_repo = FloorPlanRepository(db)
    floor_plan = floor_plan_repo.get(id=floor_plan_id)
    if not floor_plan:
        raise HTTPException(status_code=404, detail="Floor plan not found")
    return floor_plan_repo.remove(id=floor_plan_id)
 
@router.put("/floor-plans/{floor_plan_id}/tables", response_model=List[Table])
def set_floor_plan_tables(
    floor_plan_id: str,
    tables_in: List[TableBulk],
    db: Session = Depends(get_db)
):
    """
    Replace tables for a specific floor plan: create, update, and delete tables in bulk.
    """
    floor_plan_repo = FloorPlanRepository(db)
    floor_plan = floor_plan_repo.get(id=floor_plan_id)
    if not floor_plan:
        raise HTTPException(status_code=404, detail="Floor plan not found")
    # Fetch existing tables
    existing_tables = floor_plan_repo.get_tables(floor_plan_id=floor_plan_id)
    existing_ids = {t.id for t in existing_tables}
    incoming_ids = {tbl.id for tbl in tables_in if tbl.id}
    # Delete tables not in incoming list
    for tbl in existing_tables:
        if tbl.id not in incoming_ids:
            floor_plan_repo.remove_table(id=tbl.id)
    result_tables = []
    # Upsert incoming tables
    for tbl in tables_in:
        if tbl.id:
            # Update existing table
            db_tbl = floor_plan_repo.get_table(id=tbl.id)
            if db_tbl:
                data = tbl.dict(exclude_unset=True)
                data.pop("id", None)
                updated = floor_plan_repo.update_table(db_obj=db_tbl, obj_in=data)
                result_tables.append(updated)
            else:
                # Create new if referenced id not found
                create_in = TableCreate(floor_plan_id=floor_plan_id, **tbl.dict(exclude={"id"}))
                created = floor_plan_repo.create_table(obj_in=create_in)
                result_tables.append(created)
        else:
            # Create new table
            create_in = TableCreate(floor_plan_id=floor_plan_id, **tbl.dict(exclude={"id"}))
            created = floor_plan_repo.create_table(obj_in=create_in)
            result_tables.append(created)
    return result_tables

@router.get("/floor-plans/{floor_plan_id}/tables", response_model=List[Table])
def get_tables_for_floor_plan(
    floor_plan_id: str,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Get all tables for a specific floor plan
    """
    floor_plan_repo = FloorPlanRepository(db)
    floor_plan = floor_plan_repo.get(id=floor_plan_id)
    if not floor_plan:
        raise HTTPException(status_code=404, detail="Floor plan not found")
    return floor_plan_repo.get_tables(floor_plan_id=floor_plan_id, skip=skip, limit=limit)

@router.post("/tables", response_model=Table)
def create_table(
    table_in: TableCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new table
    """
    floor_plan_repo = FloorPlanRepository(db)
    floor_plan = floor_plan_repo.get(id=table_in.floor_plan_id)
    if not floor_plan:
        raise HTTPException(status_code=404, detail="Floor plan not found")
    return floor_plan_repo.create_table(obj_in=table_in)

@router.put("/tables/{table_id}", response_model=Table)
def update_table(
    table_id: str,
    table_in: TableUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a table
    """
    floor_plan_repo = FloorPlanRepository(db)
    table = floor_plan_repo.get_table(id=table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return floor_plan_repo.update_table(db_obj=table, obj_in=table_in)

@router.delete("/tables/{table_id}", response_model=Table)
def delete_table(
    table_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a table
    """
    floor_plan_repo = FloorPlanRepository(db)
    table = floor_plan_repo.get_table(id=table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return floor_plan_repo.remove_table(id=table_id)

@router.get("/tables/{table_id}/seats", response_model=List[Seat])
def get_seats_for_table(
    table_id: str,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Get all seats for a specific table
    """
    floor_plan_repo = FloorPlanRepository(db)
    table = floor_plan_repo.get_table(id=table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return floor_plan_repo.get_seats(table_id=table_id, skip=skip, limit=limit)

@router.post("/seats", response_model=Seat)
def create_seat(
    seat_in: SeatCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new seat
    """
    floor_plan_repo = FloorPlanRepository(db)
    table = floor_plan_repo.get_table(id=seat_in.table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return floor_plan_repo.create_seat(obj_in=seat_in)

@router.put("/seats/{seat_id}", response_model=Seat)
def update_seat(
    seat_id: str,
    seat_in: SeatUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a seat
    """
    floor_plan_repo = FloorPlanRepository(db)
    seat = floor_plan_repo.get_seat(id=seat_id)
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    return floor_plan_repo.update_seat(db_obj=seat, obj_in=seat_in)

@router.delete("/seats/{seat_id}", response_model=Seat)
def delete_seat(
    seat_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a seat
    """
    floor_plan_repo = FloorPlanRepository(db)
    seat = floor_plan_repo.get_seat(id=seat_id)
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    return floor_plan_repo.remove_seat(id=seat_id)

@router.post("/floor-plans/{floor_plan_id}/activate", response_model=FloorPlan)
def activate_floor_plan(
    floor_plan_id: str,
    db: Session = Depends(get_db)
):
    """
    Activate a floor plan (set as current active plan)
    """
    floor_plan_repo = FloorPlanRepository(db)
    floor_plan = floor_plan_repo.get(id=floor_plan_id)
    if not floor_plan:
        raise HTTPException(status_code=404, detail="Floor plan not found")
    return floor_plan_repo.activate(id=floor_plan_id)
