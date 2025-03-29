from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
import json
import logging
import base64

from app.db.database import get_db
from app.models.models import Order, OrderStatus
from app.api.schemas import OrderCreate, OrderUpdate, Order as OrderSchema, OrderStats, VoiceProcessRequest, VoiceProcessResponse, OrderConfirm
from app.services.speech.deepgram_service import DeepgramService as SpeechService
from app.services.order.order_processor import OrderProcessor as OrderService
from app.models.seat_order import SeatOrder, SeatOrderCreate, SeatOrderResponse, SeatOrderConfirm
from app.services.monitoring_service import monitoring
from app.core.dependencies import get_order_processor

# Initialize speech service
speech_service = SpeechService()

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
        seat_number=order.seat_number,
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
async def process_voice_order(
    audio_data: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Process a voice order.
    
    Args:
        audio_data: Base64 encoded audio data
        background_tasks: FastAPI background tasks
        db: Database session
        
    Returns:
        VoiceProcessResponse containing the processed order
    """
    try:
        # Initialize speech service
        speech_service = SpeechService()
        
        # Validate setup
        if not await speech_service.validate_setup():
            raise HTTPException(
                status_code=500,
                detail="Speech service setup validation failed"
            )
        
        # Decode audio data
        try:
            audio_bytes = base64.b64decode(audio_data)
            logger.info(f"Received audio data: {len(audio_bytes)} bytes")
        except Exception as e:
            logger.error(f"Failed to decode audio data: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail="Invalid audio data format"
            )
        
        # Process audio to text
        transcription = await speech_service.process_audio(audio_bytes)
        if not transcription:
            raise HTTPException(
                status_code=400,
                detail="Failed to transcribe audio"
            )
        
        # Process text to order
        processed_order = speech_service.process_order_text(transcription)
        if not processed_order:
            raise HTTPException(
                status_code=400,
                detail="Failed to process order text"
            )
        
        # Extract table number if present
        table_id = None
        if processed_order.startswith("Table "):
            try:
                table_id = int(processed_order.split(" | ")[0].split(" ")[1])
                processed_order = " | ".join(processed_order.split(" | ")[1:])
            except (ValueError, IndexError):
                pass
        
        # Create order in database
        order_service = OrderService(db)
        try:
            order = await order_service.create_order(
                OrderCreate(
                    details=processed_order,
                    status="pending",
                    table_id=table_id
                )
            )
        except Exception as e:
            logger.error(f"Failed to create order: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to create order in database"
            )
        
        # Add background task for order processing
        background_tasks.add_task(
            order_service.process_order,
            order.id
        )
        
        return VoiceProcessResponse(
            success=True,
            transcription=transcription,
            processed_order=processed_order,
            order_id=order.id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing voice order: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error processing voice order"
        )

@router.get("/{order_id}", response_model=OrderSchema)
async def get_order(order_id: int, db: Session = Depends(get_db)):
    """Get order by ID."""
    order_service = OrderService(db)
    order = await order_service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.get("/", response_model=List[OrderSchema])
async def get_orders(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get list of orders with optional filtering."""
    order_service = OrderService(db)
    return await order_service.get_orders(skip=skip, limit=limit, status=status)

@router.post("/seat", response_model=SeatOrderResponse)
async def create_seat_order(
    order: SeatOrderCreate,
    order_processor: OrderService = Depends(get_order_processor)
):
    """Create a new seat order."""
    try:
        order_result = await order_processor.process_order(
            audio_data=order.audio_data,
            table_id=order.table_id,
            seat_number=order.seat_number
        )
        return order_result
    except Exception as e:
        logger.error(f"Error processing order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/seat/{order_id}/confirm", response_model=SeatOrderResponse)
async def confirm_seat_order(
    order_id: int,
    confirmation: SeatOrderConfirm,
    db: Session = Depends(get_db)
):
    """
    Confirm or cancel a seat order.
    
    Args:
        order_id: ID of the order to confirm
        confirmation: Confirmation data
        db: Database session
        
    Returns:
        Updated SeatOrderResponse
    """
    try:
        order_service = OrderService(db)
        db_order = await order_service.get_seat_order(order_id)
        
        if not db_order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if confirmation.confirmed:
            db_order.status = "confirmed"
            db_order.confirmed_at = datetime.now()
            monitoring.record_order_processed("confirmed")
        else:
            db_order.status = "cancelled"
            monitoring.record_order_processed("cancelled")
        
        db.commit()
        db.refresh(db_order)
        
        return SeatOrderResponse(
            id=db_order.id,
            table_id=db_order.table_id,
            seat_number=db_order.seat_number,
            items=db_order.items,
            status=db_order.status,
            raw_transcription=db_order.raw_transcription,
            processed_order=db_order.processed_order,
            created_at=db_order.created_at,
            confirmed_at=db_order.confirmed_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error confirming seat order: {str(e)}")
        monitoring.record_error("api", "confirmation")
        raise HTTPException(
            status_code=500,
            detail="Internal server error confirming seat order"
        )

@router.get("/table/{table_id}/seats", response_model=List[SeatOrderResponse])
async def get_table_orders(
    table_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all orders for a specific table.
    
    Args:
        table_id: ID of the table
        db: Database session
        
    Returns:
        List of SeatOrderResponse
    """
    try:
        order_service = OrderService(db)
        orders = await order_service.get_table_orders(table_id)
        
        return [
            SeatOrderResponse(
                id=order.id,
                table_id=order.table_id,
                seat_number=order.seat_number,
                items=order.items,
                status=order.status,
                raw_transcription=order.raw_transcription,
                processed_order=order.processed_order,
                created_at=order.created_at,
                confirmed_at=order.confirmed_at
            )
            for order in orders
        ]
        
    except Exception as e:
        logger.error(f"Error getting table orders: {str(e)}")
        monitoring.record_error("api", "table_orders")
        raise HTTPException(
            status_code=500,
            detail="Internal server error getting table orders"
        )

@router.post("/{order_id}/confirm", response_model=SeatOrderResponse)
async def confirm_order(
    order_id: str,
    confirmation: OrderConfirm,
    order_processor: OrderService = Depends(get_order_processor)
):
    """Confirm or reject an order."""
    try:
        order_result = await order_processor.confirm_order(order_id, confirmation.confirmed)
        return order_result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error confirming order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/table/{table_id}", response_model=List[SeatOrderResponse])
async def get_table_orders(
    table_id: int,
    order_processor: OrderService = Depends(get_order_processor)
):
    """Get all orders for a specific table."""
    try:
        orders = await order_processor.get_table_orders(table_id)
        return orders
    except Exception as e:
        logger.error(f"Error getting table orders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
