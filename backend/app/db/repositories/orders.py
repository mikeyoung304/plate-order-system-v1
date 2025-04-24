from typing import List, Optional, Dict, Any, Union
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
from app.db.models import Order, Table, Seat
from app.api.v1.schemas import OrderCreate, OrderUpdate
import uuid

class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, id: str) -> Optional[Order]:
        """Get an order by ID"""
        return self.db.query(Order).filter(Order.id == id).first()

    def get_multi(
        self, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        type: Optional[str] = None,
        status: Optional[str] = None,
        table_id: Optional[str] = None
    ) -> List[Order]:
        """Get multiple orders with optional filtering"""
        query = self.db.query(Order)
        
        # Apply filters if provided
        if type:
            query = query.filter(Order.type == type)
        if status:
            query = query.filter(Order.status == status)
        if table_id:
            query = query.filter(Order.table_id == table_id)
            
        # Order by creation time (newest first)
        query = query.order_by(Order.created_at.desc())
        
        return query.offset(skip).limit(limit).all()

    def create(self, *, obj_in: OrderCreate) -> Order:
        """Create a new order"""
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = Order(**obj_in_data, id=str(uuid.uuid4()))
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, *, db_obj: Order, obj_in: Union[OrderUpdate, Dict[str, Any]]) -> Order:
        """Update an order"""
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

    def remove(self, *, id: str) -> Order:
        """Remove an order"""
        obj = self.db.query(Order).get(id)
        self.db.delete(obj)
        self.db.commit()
        return obj

    def get_by_type(
        self, 
        *, 
        type: str, 
        status: Optional[str] = None,
        skip: int = 0, 
        limit: int = 100
    ) -> List[Order]:
        """Get orders by type (food or drink)"""
        query = self.db.query(Order).filter(Order.type == type)
        
        if status:
            query = query.filter(Order.status == status)
            
        # Order by creation time (newest first)
        query = query.order_by(Order.created_at.desc())
        
        return query.offset(skip).limit(limit).all()

    def get_by_table(
        self, 
        *, 
        table_id: str, 
        status: Optional[str] = None,
        skip: int = 0, 
        limit: int = 100
    ) -> List[Order]:
        """Get orders for a specific table"""
        query = self.db.query(Order).filter(Order.table_id == table_id)
        
        if status:
            query = query.filter(Order.status == status)
            
        # Order by creation time (newest first)
        query = query.order_by(Order.created_at.desc())
        
        return query.offset(skip).limit(limit).all()

    def get_by_seat(
        self, 
        *, 
        seat_id: str, 
        status: Optional[str] = None,
        skip: int = 0, 
        limit: int = 100
    ) -> List[Order]:
        """Get orders for a specific seat"""
        query = self.db.query(Order).filter(Order.seat_id == seat_id)
        
        if status:
            query = query.filter(Order.status == status)
            
        # Order by creation time (newest first)
        query = query.order_by(Order.created_at.desc())
        
        return query.offset(skip).limit(limit).all()

    def update_status(self, *, id: str, status: str) -> Order:
        """Update an order's status"""
        order = self.db.query(Order).get(id)
        
        if not order:
            return None
            
        order.status = status
        
        # If status is completed, set completed_at timestamp
        if status == "completed":
            order.completed_at = datetime.now()
            
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        return order
