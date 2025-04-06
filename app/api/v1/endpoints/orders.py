from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.v1.dependencies.db import get_db
from app.db.repositories.orders import OrderRepository
from app.api.v1.schemas import Order, OrderCreate, OrderUpdate

router = APIRouter()

@router.get("/orders", response_model=List[Order])
def get_orders(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    type: Optional[str] = None,
    status: Optional[str] = None,
    table_id: Optional[str] = None
):
    """
    Get all orders with optional filtering
    """
    order_repo = OrderRepository(db)
    return order_repo.get_multi(
        skip=skip, 
        limit=limit, 
        type=type, 
        status=status, 
        table_id=table_id
    )

@router.post("/orders", response_model=Order)
def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new order
    """
    order_repo = OrderRepository(db)
    return order_repo.create(obj_in=order_in)

@router.get("/orders/{order_id}", response_model=Order)
def get_order(
    order_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific order by ID
    """
    order_repo = OrderRepository(db)
    order = order_repo.get(id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/orders/{order_id}", response_model=Order)
def update_order(
    order_id: str,
    order_in: OrderUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an order
    """
    order_repo = OrderRepository(db)
    order = order_repo.get(id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order_repo.update(db_obj=order, obj_in=order_in)

@router.delete("/orders/{order_id}", response_model=Order)
def delete_order(
    order_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete an order
    """
    order_repo = OrderRepository(db)
    order = order_repo.get(id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order_repo.remove(id=order_id)

@router.get("/orders/by-type/{type}", response_model=List[Order])
def get_orders_by_type(
    type: str,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None
):
    """
    Get orders by type (food or drink)
    """
    order_repo = OrderRepository(db)
    return order_repo.get_by_type(type=type, status=status, skip=skip, limit=limit)

@router.get("/orders/by-table/{table_id}", response_model=List[Order])
def get_orders_by_table(
    table_id: str,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None
):
    """
    Get orders for a specific table
    """
    order_repo = OrderRepository(db)
    return order_repo.get_by_table(table_id=table_id, status=status, skip=skip, limit=limit)

@router.get("/orders/by-seat/{seat_id}", response_model=List[Order])
def get_orders_by_seat(
    seat_id: str,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None
):
    """
    Get orders for a specific seat
    """
    order_repo = OrderRepository(db)
    return order_repo.get_by_seat(seat_id=seat_id, status=status, skip=skip, limit=limit)

@router.put("/orders/{order_id}/status/{status}", response_model=Order)
def update_order_status(
    order_id: str,
    status: str,
    db: Session = Depends(get_db)
):
    """
    Update an order's status
    """
    order_repo = OrderRepository(db)
    return order_repo.update_status(id=order_id, status=status)
