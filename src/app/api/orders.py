# src/app/api/orders.py
from fastapi import APIRouter, Depends, HTTPException, Query

# Make sure Session is imported from sqlalchemy.orm
from sqlalchemy.orm import Session
from typing import List, Optional, Union  # Added Union
from datetime import datetime
import logging
from pydantic import BaseModel

# Database dependency
from src.app.db.database import get_db

# Models and Schemas
from src.app.models.models import (
    OrderStatus,
)  # Assuming OrderStatus enum/class exists here

# Import Seat Order specific models/schemas from their correct location
from src.app.models.seat_order import (
    SeatOrderCreate,
    SeatOrderResponse,
    SeatOrderConfirm,
)

# Import general schemas
from src.app.api.schemas import (
    OrderCreate,
    OrderUpdate,
    Order as OrderSchema,
    OrderStats,
    # OrderConfirm is likely handled by SeatOrderConfirm logic now
)

# Services
from src.app.services.order.order_processor import OrderProcessor as OrderService
from src.app.services.monitoring_service import monitoring
from src.app.core.dependencies import (
    get_order_processor,
)  # Provides OrderService instance

router = APIRouter(
    prefix="/orders",  # Restore prefix
    tags=["orders"],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)

from fastapi import File, UploadFile, Form  # Import File handling types


# --- Pydantic Model for Voice Request ---
# This model is specific to the /voice endpoint's expected input
class VoiceOrderRequest(BaseModel):
    audio_data: str  # Expecting a JSON body: {"audio_data": "base64string..."}


# --- Pydantic Model for Transcribe Response ---
class TranscribeResponse(BaseModel):
    text: str


# --- Unified & Corrected API Endpoints ---


@router.post(
    "/", response_model=OrderSchema, status_code=201
)  # Use path relative to prefix again
async def create_order(
    order: OrderCreate,
    order_processor: OrderService = Depends(get_order_processor),
    db: Session = Depends(get_db),  # Inject DB Session
):
    """
    Create a new standard order (non-voice).
    Uses the OrderProcessor service.
    """
    try:
        # Pass db session to the service method
        db_order = await order_processor.create_order_from_data(db=db, order_data=order)
        return db_order
    except HTTPException as e:  # Re-raise HTTP exceptions from service
        raise e
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create order.")


@router.get("/", response_model=List[OrderSchema])
async def get_orders(
    skip: int = Query(0, ge=0),  # Added validation ge=0
    limit: int = Query(100, ge=1, le=1000),  # Added validation, increased max limit
    status: Optional[Union[str, List[str]]] = Query(
        None
    ),  # Allow multiple statuses via query e.g. ?status=pending&status=in_progress
    table_id: Optional[int] = Query(None),
    resident_id: Optional[int] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    sort_by: str = Query("created_at"),  # Default sort
    sort_order: str = Query("desc", regex="^(asc|desc)$"),  # Validate sort order
    order_processor: OrderService = Depends(get_order_processor),
    db: Session = Depends(get_db),  # Inject DB Session
):
    """
    Get list of orders with optional filtering, sorting, and pagination.
    Uses the OrderProcessor service.
    """
    try:
        # Pass db session and all filter/sort parameters to the service method
        return await order_processor.get_orders(
            db=db,
            skip=skip,
            limit=limit,
            status=status,
            table_id=table_id,
            resident_id=resident_id,
            date_from=date_from,
            date_to=date_to,
            sort_by=sort_by,
            sort_order=sort_order,
        )
    except (
        HTTPException
    ) as e:  # Re-raise HTTP exceptions from service (like 400 for bad status)
        raise e
    except Exception as e:
        logger.error(f"Error getting orders: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve orders.")


@router.get("/active", response_model=List[OrderSchema])
async def read_active_orders(
    order_processor: OrderService = Depends(get_order_processor),
    db: Session = Depends(get_db),  # Inject DB Session
):
    """
    Retrieve all active orders (pending, in_progress, ready).
    Uses the OrderProcessor service.
    """
    try:
        # Define active statuses based on the Enum/Constants in models.models
        active_statuses = [
            OrderStatus.PENDING.value,
            OrderStatus.IN_PROGRESS.value,
            OrderStatus.READY.value,
        ]
        # Pass db session and statuses to the service method
        return await order_processor.get_orders(
            db=db, status=active_statuses, skip=0, limit=1000
        )  # Adjust limit as needed
    except HTTPException as e:  # Re-raise HTTP exceptions from service
        raise e
    except Exception as e:
        logger.error(f"Error getting active orders: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve active orders.")


@router.get("/stats", response_model=OrderStats)
async def get_order_stats(
    order_processor: OrderService = Depends(get_order_processor),
    db: Session = Depends(get_db),  # Inject DB Session
):
    """
    Get order statistics.
    Uses the OrderProcessor service.
    """
    try:
        # Pass db session to the service method
        return await order_processor.get_order_statistics(db=db)
    except HTTPException as e:  # Re-raise HTTP exceptions from service
        raise e
    except Exception as e:
        logger.error(f"Error getting order stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail="Failed to retrieve order statistics."
        )


@router.get("/recent", response_model=List[OrderSchema])
async def get_recent_orders(
    limit: int = Query(10, ge=1, le=100),
    order_processor: OrderService = Depends(get_order_processor),
    db: Session = Depends(get_db),  # Inject DB Session
):
    """
    Get most recent orders for the dashboard.
    Uses the OrderProcessor service.
    """
    try:
        # Pass db session to the service method
        return await order_processor.get_orders(
            db=db, skip=0, limit=limit, sort_by="created_at", sort_order="desc"
        )
    except HTTPException as e:  # Re-raise HTTP exceptions from service
        raise e
    except Exception as e:
        logger.error(f"Error getting recent orders: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve recent orders.")


@router.get("/{order_id}", response_model=OrderSchema)
async def get_order(
    order_id: int,
    order_processor: OrderService = Depends(get_order_processor),
    db: Session = Depends(get_db),  # Inject DB Session
):
    """
    Get a specific order by ID.
    Uses the OrderProcessor service.
    """
    try:
        # Pass db session to the service method
        order = await order_processor.get_order(db=db, order_id=order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order
    except HTTPException as e:  # Re-raise HTTP exceptions (like 404 or from service)
        raise e
    except Exception as e:
        logger.error(f"Error getting order {order_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve order.")


@router.put("/{order_id}", response_model=OrderSchema)
async def update_order(
    order_id: int,
    order_update: OrderUpdate,
    order_processor: OrderService = Depends(get_order_processor),
    db: Session = Depends(get_db),  # Inject DB Session
):
    """
    Update an order.
    Uses the OrderProcessor service.
    """
    try:
        # Pass db session to the service method
        updated_order = await order_processor.update_order(
            db=db, order_id=order_id, order_update=order_update
        )
        if updated_order is None:
            raise HTTPException(status_code=404, detail="Order not found for updating")
        return updated_order
    except (
        HTTPException
    ) as e:  # Re-raise HTTP exceptions (like 404 or 400 from service)
        raise e
    except Exception as e:
        logger.error(f"Error updating order {order_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update order.")


@router.delete("/{order_id}", status_code=204)
async def delete_order(
    order_id: int,
    order_processor: OrderService = Depends(get_order_processor),
    db: Session = Depends(get_db),  # Inject DB Session
):
    """
    Delete an order.
    Uses the OrderProcessor service.
    """
    try:
        # Pass db session to the service method
        success = await order_processor.delete_order(db=db, order_id=order_id)
        if not success:
            raise HTTPException(status_code=404, detail="Order not found for deletion")
        return None  # Return None for 204 No Content response
    except HTTPException as e:  # Re-raise HTTP exceptions (like 404 or from service)
        raise e
    except Exception as e:
        logger.error(f"Error deleting order {order_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete order.")


# --- Transcription Endpoint (for Frontend FormData) ---


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio_order(
    audio: UploadFile = File(...),
    text: Optional[str] = Form(None),  # Optional existing text from frontend
    order_processor: OrderService = Depends(get_order_processor),
    db: Session = Depends(get_db),  # Inject DB Session if needed by processor
):
    """
    Transcribe audio sent as FormData from the frontend.
    Uses the OrderProcessor service for transcription logic.
    """
    try:
        logger.info(
            f"Received audio file for transcription: {audio.filename}, size: {audio.size}"
        )
        audio_bytes = await audio.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file received.")

        # Pass audio bytes to the order processor's transcription method
        # Assuming order_processor has a method like transcribe_audio
        transcribed_text = await order_processor.transcribe_audio(
            db=db, audio_data=audio_bytes
        )

        # Optionally prepend existing text if provided
        final_text = f"{text.strip()} {transcribed_text}" if text else transcribed_text
        logger.info(f"Transcription result: {final_text}")

        return TranscribeResponse(text=final_text.strip())

    except HTTPException as e:
        logger.warning(f"HTTP Exception during transcription: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Error during transcription: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail="Internal server error during transcription"
        )


# --- Voice and Seat Order Endpoints (Using Base64 JSON) ---

# --- Endpoint moved to main.py to resolve routing issue ---
# @router.post("/voice", response_model=VoiceProcessResponse)
# async def process_voice_order(...): ...
# --- End Moved Endpoint ---


@router.post("/seat", response_model=SeatOrderResponse)
async def create_seat_order(
    order: SeatOrderCreate,  # Ensure SeatOrderCreate schema includes audio_data, table_id, seat_number
    order_processor: OrderService = Depends(get_order_processor),
    db: Session = Depends(get_db),  # Inject DB Session
):
    """
    Create a new seat order (likely involves voice processing).
    Uses the OrderProcessor service.
    """
    try:
        # Pass db session to the service method
        order_result = await order_processor.process_seat_order(
            db=db,
            audio_data=order.audio_data,
            table_id=order.table_id,
            seat_number=order.seat_number,
        )
        return order_result
    except HTTPException as e:  # Re-raise HTTP exceptions from service
        raise e
    except Exception as e:
        logger.error(f"Error processing seat order: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process seat order.")


@router.post("/{order_id}/confirm", response_model=SeatOrderResponse)
async def confirm_seat_order(
    order_id: int,
    confirmation: SeatOrderConfirm,  # Ensure SeatOrderConfirm schema has 'confirmed: bool'
    order_processor: OrderService = Depends(get_order_processor),
    db: Session = Depends(get_db),  # Inject DB Session
):
    """
    Confirm or cancel a seat order. Uses OrderProcessor service.
    """
    try:
        # Pass db session to the service method
        updated_order = await order_processor.confirm_or_cancel_seat_order(
            db=db, order_id=order_id, confirmed=confirmation.confirmed
        )
        # Service now raises ValueError if not found, which we catch below
        return updated_order
    except ValueError as e:  # Catch specific "not found" error from service
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException as e:  # Re-raise other HTTP exceptions from service
        raise e
    except Exception as e:
        logger.error(f"Error confirming seat order {order_id}: {str(e)}", exc_info=True)
        monitoring.record_error("api", "confirmation")
        raise HTTPException(
            status_code=500, detail="Internal server error confirming seat order"
        )


@router.get("/table/{table_id}", response_model=List[SeatOrderResponse])
async def get_table_seat_orders(
    table_id: int,
    order_processor: OrderService = Depends(get_order_processor),
    db: Session = Depends(get_db),  # Inject DB Session
):
    """
    Get all Seat Orders for a specific table.
    Uses the OrderProcessor service.
    """
    try:
        # Pass db session to the service method
        orders = await order_processor.get_table_orders(db=db, table_id=table_id)
        return orders
    except HTTPException as e:  # Re-raise HTTP exceptions from service
        raise e
    except Exception as e:
        logger.error(
            f"Error getting orders for table {table_id}: {str(e)}", exc_info=True
        )
        monitoring.record_error("api", "table_orders")
        raise HTTPException(
            status_code=500, detail="Internal server error getting table orders"
        )


# --- IMPORTANT ---
# Ensure all imported Pydantic schemas (OrderCreate, SeatOrderResponse, etc.)
# and models (OrderStatus) are correctly defined where expected (e.g., schemas.py, models.py).
# Ensure the SeatOrderCreate schema includes audio_data, table_id, seat_number.
# Ensure the SeatOrderConfirm schema includes confirmed: bool.
# Ensure the dependency function `get_db` in `src.app.db.database` is correctly set up.
# Ensure the dependency function `get_order_processor` in `src.app.core.dependencies` returns an instance of the updated OrderProcessor.
