from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
import json
import logging

from db.database import get_db
from models.models import Order, OrderStatus
from api.schemas import OrderCreate, OrderUpdate, Order as OrderSchema, OrderStats, VoiceProcessRequest, VoiceProcessResponse
from services.speech_service import speech_service

router = APIRouter(
    prefix="/orders",
    tags=["orders"],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)

@router.post("/", response_model=OrderSchema)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    """
    Create a new order
    """
    db_order = Order(
        table_id=order.table_id,
        resident_id=order.resident_id,
        details=order.details,
        raw_transcription=order.raw_transcription,
        flagged=order.flagged,
        status=order.status
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("/", response_model=List[OrderSchema])
def read_orders(
    skip: int = 0, 
    limit: int = 100,
    status: Optional[List[str]] = Query(None),
    table_id: Optional[int] = None,
    resident_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve orders, optionally filtered by status, table, resident, or date range
    """
    query = db.query(Order)
    
    # Apply filters
    if status:
        query = query.filter(Order.status.in_(status))
    if table_id is not None:
        query = query.filter(Order.table_id == table_id)
    if resident_id is not None:
        query = query.filter(Order.resident_id == resident_id)
    if date_from:
        query = query.filter(Order.created_at >= date_from)
    if date_to:
        query = query.filter(Order.created_at <= date_to)
        
    return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/active", response_model=List[OrderSchema])
def read_active_orders(db: Session = Depends(get_db)):
    """
    Retrieve all active orders (pending, in_progress, ready)
    """
    active_statuses = [OrderStatus.PENDING, OrderStatus.IN_PROGRESS, OrderStatus.READY]
    return db.query(Order).filter(Order.status.in_(active_statuses)).order_by(Order.created_at.asc()).all()

@router.get("/stats", response_model=OrderStats)
def get_order_stats(db: Session = Depends(get_db)):
    """
    Get order statistics
    """
    # Count active orders
    active_count = db.query(func.count(Order.id)).filter(
        Order.status.in_([OrderStatus.PENDING, OrderStatus.IN_PROGRESS, OrderStatus.READY])
    ).scalar()
    
    # Count by status
    pending_count = db.query(func.count(Order.id)).filter(Order.status == OrderStatus.PENDING).scalar()
    in_progress_count = db.query(func.count(Order.id)).filter(Order.status == OrderStatus.IN_PROGRESS).scalar()
    ready_count = db.query(func.count(Order.id)).filter(Order.status == OrderStatus.READY).scalar()
    
    # Count completed today
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)
    completed_today = db.query(func.count(Order.id)).filter(
        Order.status == OrderStatus.COMPLETED,
        Order.completed_at >= today,
        Order.completed_at < tomorrow
    ).scalar()
    
    # Calculate average preparation time
    # Prep time = completed_at - created_at (in minutes)
    avg_prep_time = 0
    completed_orders = db.query(Order).filter(
        Order.status == OrderStatus.COMPLETED,
        Order.completed_at.isnot(None)
    ).all()
    
    if completed_orders:
        total_prep_time = sum((order.completed_at - order.created_at).total_seconds() / 60 for order in completed_orders)
        avg_prep_time = round(total_prep_time / len(completed_orders), 1)
    
    return OrderStats(
        active_count=active_count,
        pending_count=pending_count,
        in_progress_count=in_progress_count,
        ready_count=ready_count,
        completed_today=completed_today,
        avg_prep_time=avg_prep_time
    )

@router.get("/{order_id}", response_model=OrderSchema)
def read_order(order_id: int, db: Session = Depends(get_db)):
    """
    Get a specific order by ID
    """
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order

@router.put("/{order_id}", response_model=OrderSchema)
def update_order(order_id: int, order: OrderUpdate, db: Session = Depends(get_db)):
    """
    Update an order
    """
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update order fields
    for key, value in order.dict(exclude_unset=True).items():
        if value is not None:
            setattr(db_order, key, value)
    
    # Set completed_at timestamp if status is being changed to completed
    if order.status == OrderStatus.COMPLETED and db_order.status != OrderStatus.COMPLETED:
        db_order.completed_at = datetime.now()
    
    db.commit()
    db.refresh(db_order)
    return db_order

@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """
    Delete an order
    """
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db.delete(db_order)
    db.commit()
    return {"message": "Order deleted successfully"}

@router.post("/voice", response_model=VoiceProcessResponse)
async def process_voice_order(request: VoiceProcessRequest, db: Session = Depends(get_db)):
    """
    Process a voice order recording
    """
    try:
        # Get audio data from request
        audio_data = request.audio_data
        
        # Check if audio data exists
        if not audio_data:
            raise HTTPException(status_code=400, detail="No audio data provided")
        
        # For debugging - log data length
        logger.info(f"Received audio data of length: {len(audio_data)}")
        
        # Process audio to text
        transcription = speech_service.process_audio(audio_data)
        logger.info(f"Transcription result: {transcription}")
        
        # Process the transcription
        processed_order = speech_service.process_order_text(transcription)
        logger.info(f"Processed order: {processed_order}")
        
        # Add table number if provided
        if request.table_id:
            table_number = request.table_id
            if not processed_order.startswith(f"Table {table_number}:"):
                processed_order = f"Table {table_number}: {processed_order}"
        
        # Create an order in the database
        db_order = Order(
            table_id=request.table_id,
            resident_id=request.resident_id,
            details=processed_order,
            raw_transcription=transcription,
            status="pending"
        )
        
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        
        # Return the processed order
        return VoiceProcessResponse(
            order_id=db_order.id,
            transcription=transcription,
            processed_order=processed_order
        )
        
    except Exception as e:
        logger.error(f"Error processing voice order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing voice order: {str(e)}")
