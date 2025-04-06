from typing import List, Optional, Dict, Any, Union, Type, TypeVar
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from app.db.models import FloorPlan, Table, Seat
from app.api.v1.schemas import FloorPlanCreate, FloorPlanUpdate, TableCreate, TableUpdate, SeatCreate, SeatUpdate
import uuid

ModelType = TypeVar("ModelType", bound=FloorPlan)
CreateSchemaType = TypeVar("CreateSchemaType", bound=FloorPlanCreate)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=FloorPlanUpdate)

class FloorPlanRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, id: str) -> Optional[FloorPlan]:
        """Get a floor plan by ID"""
        return self.db.query(FloorPlan).filter(FloorPlan.id == id).first()

    def get_multi(self, *, skip: int = 0, limit: int = 100) -> List[FloorPlan]:
        """Get multiple floor plans"""
        return self.db.query(FloorPlan).offset(skip).limit(limit).all()

    def create(self, *, obj_in: FloorPlanCreate) -> FloorPlan:
        """Create a new floor plan"""
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = FloorPlan(**obj_in_data, id=str(uuid.uuid4()))
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, *, db_obj: FloorPlan, obj_in: Union[FloorPlanUpdate, Dict[str, Any]]) -> FloorPlan:
        """Update a floor plan"""
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def remove(self, *, id: str) -> FloorPlan:
        """Remove a floor plan"""
        obj = self.db.query(FloorPlan).get(id)
        self.db.delete(obj)
        self.db.commit()
        return obj

    def activate(self, *, id: str) -> FloorPlan:
        """Activate a floor plan (set as current active plan)"""
        # First, deactivate all floor plans
        self.db.query(FloorPlan).update({FloorPlan.is_active: False})
        
        # Then activate the specified floor plan
        floor_plan = self.db.query(FloorPlan).get(id)
        floor_plan.is_active = True
        self.db.add(floor_plan)
        self.db.commit()
        self.db.refresh(floor_plan)
        return floor_plan

    def get_active(self) -> Optional[FloorPlan]:
        """Get the currently active floor plan"""
        return self.db.query(FloorPlan).filter(FloorPlan.is_active == True).first()

    # Table methods
    def get_table(self, *, id: str) -> Optional[Table]:
        """Get a table by ID"""
        return self.db.query(Table).filter(Table.id == id).first()

    def get_tables(self, *, floor_plan_id: str, skip: int = 0, limit: int = 100) -> List[Table]:
        """Get tables for a floor plan"""
        return self.db.query(Table).filter(Table.floor_plan_id == floor_plan_id).offset(skip).limit(limit).all()

    def create_table(self, *, obj_in: TableCreate) -> Table:
        """Create a new table"""
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = Table(**obj_in_data, id=str(uuid.uuid4()))
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update_table(self, *, db_obj: Table, obj_in: Union[TableUpdate, Dict[str, Any]]) -> Table:
        """Update a table"""
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def remove_table(self, *, id: str) -> Table:
        """Remove a table"""
        obj = self.db.query(Table).get(id)
        self.db.delete(obj)
        self.db.commit()
        return obj

    # Seat methods
    def get_seat(self, *, id: str) -> Optional[Seat]:
        """Get a seat by ID"""
        return self.db.query(Seat).filter(Seat.id == id).first()

    def get_seats(self, *, table_id: str, skip: int = 0, limit: int = 100) -> List[Seat]:
        """Get seats for a table"""
        return self.db.query(Seat).filter(Seat.table_id == table_id).offset(skip).limit(limit).all()

    def create_seat(self, *, obj_in: SeatCreate) -> Seat:
        """Create a new seat"""
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = Seat(**obj_in_data, id=str(uuid.uuid4()))
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update_seat(self, *, db_obj: Seat, obj_in: Union[SeatUpdate, Dict[str, Any]]) -> Seat:
        """Update a seat"""
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def remove_seat(self, *, id: str) -> Seat:
        """Remove a seat"""
        obj = self.db.query(Seat).get(id)
        self.db.delete(obj)
        self.db.commit()
        return obj

    def update_seat_status(self, *, seat_id: str, status: str, resident_id: Optional[str] = None) -> Seat:
        """Update a seat's status and optionally assign a resident"""
        seat = self.get_seat(id=seat_id)
        if not seat:
            return None
        
        seat.status = status
        if resident_id is not None:
            seat.resident_id = resident_id
            
        self.db.add(seat)
        self.db.commit()
        self.db.refresh(seat)
        return seat
