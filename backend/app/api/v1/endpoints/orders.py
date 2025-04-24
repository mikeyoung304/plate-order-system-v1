from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.v1.dependencies.db import get_db
from app.db.repositories.orders import OrderRepository
from app.api.v1.schemas import Order, OrderCreate, OrderUpdate
# Remove unused imports after deleting local schemas
from app.db.models import Order as OrderModel # Correct model import path

router = APIRouter()

# Removed local schema definitions (OrderBase, OrderCreate, Order)
# Removed in-memory storage (orders_db, order_id_counter)
# Using schemas from app.api.v1.schemas imported on line 6

@router.get("/", response_model=List[Order]) # Changed path to "/", ensure response_model uses imported Order
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

@router.post("/", response_model=Order) # Ensure response_model uses imported Order
async def create_order(order: OrderCreate, db: Session = Depends(get_db)): # Ensure order uses imported OrderCreate
    """
    Create a new order using the repository.
    """
    order_repo = OrderRepository(db)
    # Note: Assumes OrderCreate schema matches repository's expected input
    # The central OrderCreate schema has 'type', 'content', 'table_id', 'seat_id', 'resident_id'
    # The repository create method expects obj_in: OrderCreate
    # We need to ensure the OrderCreate schema passed matches what the repo needs.
    # Assuming the central schema is correct:
    return order_repo.create(obj_in=order)

# Removed duplicate get_orders endpoint

@router.get("/{order_id}", response_model=Order) # Ensure response_model uses imported Order
async def get_order(order_id: str, db: Session = Depends(get_db)): # Use str for ID
    """
    Get a specific order by ID using the repository.
    """
    order_repo = OrderRepository(db)
    db_order = order_repo.get(id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order

@router.put("/{order_id}", response_model=Order) # Ensure response_model uses imported Order
async def update_order(order_id: str, order: OrderUpdate, db: Session = Depends(get_db)): # Use str for ID and imported OrderUpdate
    """
    Update an order using the repository.
    """
    order_repo = OrderRepository(db)
    db_order = order_repo.get(id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    # The repository update method handles applying the changes
    return order_repo.update(db_obj=db_order, obj_in=order)

@router.delete("/{order_id}", status_code=200) # Specify success status code
async def delete_order(order_id: str, db: Session = Depends(get_db)): # Use str for ID
    """
    Delete an order using the repository.
    """
    order_repo = OrderRepository(db)
    db_order = order_repo.get(id=order_id) # Check if order exists first
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    order_repo.remove(id=order_id)
    return {"message": "Order deleted successfully"}

@router.get("/by-type/{type}", response_model=List[Order]) # Ensure response_model uses imported Order, adjust path relative to router prefix
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

@router.get("/by-table/{table_id}", response_model=List[Order]) # Ensure response_model uses imported Order, adjust path relative to router prefix
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

@router.get("/by-seat/{seat_id}", response_model=List[Order]) # Ensure response_model uses imported Order, adjust path relative to router prefix
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

@router.put("/{order_id}/status/{status}", response_model=Order) # Ensure response_model uses imported Order, adjust path relative to router prefix
def update_order_status(
    order_id: str,
    status: str,
    db: Session = Depends(get_db)
):
    """
    Update an order's status
    """
    order_repo = OrderRepository(db)
    updated_order = order_repo.update_status(id=order_id, status=status)
    if updated_order is None:
         raise HTTPException(status_code=404, detail="Order not found")
    return updated_order
