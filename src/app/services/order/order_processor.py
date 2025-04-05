import logging
import base64
from typing import List, Optional, Dict, Any, Union  # Added Dict, Any, Union
from datetime import datetime, timedelta  # Added datetime, timedelta

# Database imports
from sqlalchemy.orm import Session
from sqlalchemy import select, desc, func  # Added select, desc, func

# Model and Schema imports (ensure these paths are correct)
# Assuming models.py defines Order and OrderStatus Enum/Constants
from src.app.models.models import Order, OrderStatus

# Assuming schemas.py defines these Pydantic models
from src.app.api.schemas import (
    OrderCreate,
    OrderUpdate,
    OrderStats,
    VoiceProcessResponse,
)  # Added VoiceProcessResponse based on usage below

# Import Seat Order specific schemas from their correct location
from src.app.models.seat_order import SeatOrderResponse

# Service imports
from src.app.services.speech.deepgram_service import (
    SpeechService,
)  # Import the correct class name

# Use the monitoring instance directly
from src.app.services.monitoring_service import monitoring
from fastapi import (
    HTTPException,
    BackgroundTasks,
)  # Added HTTPException, BackgroundTasks

logger = logging.getLogger(__name__)


class OrderProcessor:
    """Service for processing and managing orders."""

    # Removed __init__ as dependencies like Deepgram and DB session
    # will be injected into methods or via FastAPI's Depends system.

    # --- Core Order Management Methods ---

    async def get_orders(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        status: Optional[Union[str, List[str]]] = None,  # Allow single or list
        table_id: Optional[int] = None,
        resident_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> List[Order]:
        """Retrieve orders from the database with filtering and pagination."""
        logger.debug(
            f"Getting orders with filters: status={status}, table_id={table_id}, limit={limit}, sort={sort_by} {sort_order}"
        )
        try:
            query = select(Order)

            # Apply filters
            if status:
                valid_statuses = [
                    s.value for s in OrderStatus
                ]  # Get valid enum values if OrderStatus is Enum
                if isinstance(status, list):
                    # Ensure all provided statuses are valid
                    if not all(s in valid_statuses for s in status):
                        raise ValueError(
                            f"Invalid status value provided in list: {status}"
                        )
                    query = query.filter(Order.status.in_(status))
                else:
                    if status not in valid_statuses:
                        raise ValueError(f"Invalid status value provided: {status}")
                    query = query.filter(Order.status == status)
            if table_id is not None:
                query = query.filter(Order.table_id == table_id)
            if resident_id is not None:
                query = query.filter(Order.resident_id == resident_id)
            if date_from:
                query = query.filter(Order.created_at >= date_from)
            if date_to:
                # Add 1 day to include the entire end date
                query = query.filter(Order.created_at < (date_to + timedelta(days=1)))

            # Apply sorting - Ensure sort_by is a valid column name
            valid_sort_columns = {c.name for c in Order.__table__.columns}
            if sort_by not in valid_sort_columns:
                logger.warning(
                    f"Invalid sort_by column '{sort_by}', defaulting to 'created_at'"
                )
                sort_by = "created_at"  # Default to a safe column

            sort_column = getattr(Order, sort_by)
            if sort_order.lower() == "desc":
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(sort_column)

            # Apply pagination
            query = query.offset(skip).limit(limit)

            result = db.execute(query)
            orders = result.scalars().all()
            logger.debug(f"Retrieved {len(orders)} orders from DB.")
            return orders
        except ValueError as ve:  # Catch specific validation errors
            logger.error(f"Validation error retrieving orders: {str(ve)}")
            raise HTTPException(
                status_code=400, detail=str(ve)
            )  # Return 400 for bad input
        except Exception as e:
            logger.error(f"Error retrieving orders from DB: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500, detail="Internal server error retrieving orders."
            )

    async def get_order(self, db: Session, order_id: int) -> Optional[Order]:
        """Get a single order by ID."""
        logger.debug(f"Getting order with ID: {order_id}")
        try:
            result = db.execute(select(Order).filter(Order.id == order_id))
            order = result.scalars().first()
            if order:
                logger.debug(f"Found order {order_id}.")
            else:
                logger.debug(f"Order {order_id} not found.")
            return order
        except Exception as e:
            logger.error(
                f"Error retrieving order {order_id} from DB: {str(e)}", exc_info=True
            )
            raise HTTPException(
                status_code=500,
                detail=f"Internal server error retrieving order {order_id}.",
            )

    async def create_order_from_data(
        self, db: Session, order_data: OrderCreate
    ) -> Order:
        """Create a standard order from OrderCreate schema."""
        logger.info(f"Creating order from data: {order_data.dict(exclude_unset=True)}")
        try:
            # Ensure status is valid if provided, otherwise use default from model
            if order_data.status and order_data.status not in [
                s.value for s in OrderStatus
            ]:
                raise ValueError(f"Invalid status value provided: {order_data.status}")

            db_order = Order(**order_data.dict())
            # Ensure created_at/updated_at are set if not handled by DB default
            now = datetime.utcnow()
            db_order.created_at = db_order.created_at or now
            db_order.updated_at = db_order.updated_at or now

            db.add(db_order)
            db.commit()
            db.refresh(db_order)
            logger.info(f"Successfully created order {db_order.id}")
            return db_order
        except ValueError as ve:
            logger.error(f"Validation error creating order: {str(ve)}")
            db.rollback()
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            logger.error(f"Error creating order in DB: {str(e)}", exc_info=True)
            db.rollback()
            raise HTTPException(
                status_code=500, detail="Internal server error creating order."
            )

    async def update_order(
        self, db: Session, order_id: int, order_update: OrderUpdate
    ) -> Optional[Order]:
        """Update an existing order."""
        logger.info(
            f"Updating order {order_id} with data: {order_update.dict(exclude_unset=True)}"
        )
        try:
            db_order = await self.get_order(db, order_id)
            if not db_order:
                logger.warning(f"Order {order_id} not found for update.")
                return None  # Let API layer handle 404

            update_data = order_update.dict(exclude_unset=True)

            # Validate status if provided
            if "status" in update_data and update_data["status"] not in [
                s.value for s in OrderStatus
            ]:
                raise ValueError(
                    f"Invalid status value provided for update: {update_data['status']}"
                )

            for key, value in update_data.items():
                setattr(db_order, key, value)

            db_order.updated_at = datetime.utcnow()  # Ensure updated_at is set
            db.add(db_order)
            db.commit()
            db.refresh(db_order)
            logger.info(f"Successfully updated order {order_id}")
            return db_order
        except ValueError as ve:
            logger.error(f"Validation error updating order {order_id}: {str(ve)}")
            db.rollback()
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            logger.error(
                f"Error updating order {order_id} in DB: {str(e)}", exc_info=True
            )
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Internal server error updating order {order_id}.",
            )

    async def delete_order(self, db: Session, order_id: int) -> bool:
        """Delete an order by ID."""
        logger.info(f"Attempting to delete order {order_id}")
        try:
            db_order = await self.get_order(db, order_id)
            if not db_order:
                logger.warning(f"Order {order_id} not found for deletion.")
                return False  # Let API layer handle 404
            db.delete(db_order)
            db.commit()
            logger.info(f"Successfully deleted order {order_id}")
            return True
        except Exception as e:
            logger.error(
                f"Error deleting order {order_id} from DB: {str(e)}", exc_info=True
            )
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Internal server error deleting order {order_id}.",
            )

    async def get_order_statistics(self, db: Session) -> OrderStats:
        """Calculate order statistics."""
        logger.debug("Calculating order statistics.")
        try:
            now = datetime.utcnow()
            today_start = datetime(now.year, now.month, now.day)

            # Counts by status
            status_counts_query = select(Order.status, func.count(Order.id)).group_by(
                Order.status
            )
            status_counts_res = db.execute(status_counts_query).all()
            status_counts = {status: count for status, count in status_counts_res}
            logger.debug(f"Status counts: {status_counts}")

            # Completed today
            completed_today_query = select(func.count(Order.id)).filter(
                Order.status == OrderStatus.COMPLETED.value,  # Use Enum value
                Order.completed_at >= today_start,
            )
            completed_today = (
                db.execute(completed_today_query).scalar_one_or_none() or 0
            )
            logger.debug(f"Completed today: {completed_today}")

            # Average prep time (example: time between created and completed for completed orders today)
            avg_prep_time_query = select(
                func.avg(
                    func.julianday(Order.completed_at)
                    - func.julianday(Order.created_at)
                )
                * 86400.0
            ).filter(  # Diff in seconds
                Order.status == OrderStatus.COMPLETED.value,  # Use Enum value
                Order.completed_at >= today_start,
                Order.completed_at.isnot(None),
                Order.created_at.isnot(None),
            )
            avg_prep_time_seconds = (
                db.execute(avg_prep_time_query).scalar_one_or_none() or 0.0
            )
            avg_prep_time_minutes = (
                avg_prep_time_seconds / 60.0 if avg_prep_time_seconds else 0.0
            )
            logger.debug(f"Average prep time (seconds): {avg_prep_time_seconds}")

            stats = OrderStats(
                active_count=status_counts.get(OrderStatus.PENDING.value, 0)
                + status_counts.get(OrderStatus.IN_PROGRESS.value, 0)
                + status_counts.get(OrderStatus.READY.value, 0),
                pending_count=status_counts.get(OrderStatus.PENDING.value, 0),
                in_progress_count=status_counts.get(OrderStatus.IN_PROGRESS.value, 0),
                ready_count=status_counts.get(OrderStatus.READY.value, 0),
                completed_today=completed_today,
                avg_prep_time=avg_prep_time_minutes,
            )
            logger.debug(f"Calculated stats: {stats}")
            return stats
        except Exception as e:
            logger.error(f"Error calculating order stats: {str(e)}", exc_info=True)
            # Return default stats or raise error
            raise HTTPException(
                status_code=500,
                detail="Internal server error calculating order statistics.",
            )

    # --- Voice/Seat Order Methods ---

    async def handle_voice_order(
        self, db: Session, audio_data_b64: str, background_tasks: BackgroundTasks
    ) -> Dict[str, Any]:
        """Handles the entire voice order process including transcription and parsing."""
        logger.info("Handling voice order...")
        deepgram = SpeechService()  # Use the correct imported class name
        try:
            if not audio_data_b64:
                raise ValueError("Empty audio data received")

            # Decode base64 audio data
            try:
                raw_audio = base64.b64decode(audio_data_b64)
                logger.info(
                    f"Successfully decoded base64 audio data, size: {len(raw_audio)} bytes"
                )
                if len(raw_audio) < 100:  # Sanity check for minimum audio size
                    raise ValueError(f"Audio data too small: {len(raw_audio)} bytes")
            except Exception as e:
                logger.error(f"Invalid base64 audio data received: {e}")
                raise HTTPException(
                    status_code=400, detail=f"Invalid audio data format: {str(e)}"
                )

            try:
                # Call Deepgram service to transcribe audio
                logger.info("Calling Deepgram transcription service...")
                # Call the correct method name for transcription
                transcript = await deepgram.process_audio(audio_data=raw_audio)

                # Handle the case where transcript is a string (updated service) or the old format
                if isinstance(transcript, str):
                    transcription_text = transcript
                elif isinstance(transcript, dict) and "results" in transcript:
                    transcription_text = transcript["results"]["channels"][0][
                        "alternatives"
                    ][0]["transcript"]
                else:
                    logger.error(
                        f"Unexpected transcription result format: {type(transcript)}"
                    )
                    raise HTTPException(
                        status_code=502,
                        detail="Transcription service returned unexpected format",
                    )

                logger.info(f"Voice order transcription: {transcription_text}")

                # Extract menu items from transcription
                items = self._extract_menu_items(transcription_text)
                processed_text = ", ".join(items) if items else "No menu items detected"

                # Create order record in the database
                order_data = OrderCreate(
                    text=transcription_text,
                    raw_transcription=transcription_text,
                    status=OrderStatus.PENDING.value,
                    order_type="voice",  # Mark as voice order type
                )

                created_order = await self.create_order_from_data(db, order_data)
                order_id = created_order.id
                logger.info(f"Created voice order with ID: {order_id}")

                # Return response with transcription and extracted items
                response = VoiceProcessResponse(
                    order_id=order_id,
                    transcription=transcription_text,
                    processed_order=processed_text,
                    extracted_items=items,
                    confidence=0.85,  # Default confidence
                )
                return response.dict()

            except HTTPException:
                raise  # Re-raise HTTP exceptions
            except Exception as e:
                logger.error(f"Error transcribing audio: {e}", exc_info=True)
                monitoring.record_error("service", "transcription")
                raise HTTPException(
                    status_code=500, detail=f"Failed to transcribe audio: {str(e)}"
                )

        except HTTPException:
            raise  # Re-raise HTTP exceptions
        except ValueError as ve:
            logger.error(f"Validation error in handle_voice_order: {ve}")
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            logger.error(f"Error in handle_voice_order: {e}", exc_info=True)
            monitoring.record_error("service", "handle_voice_order")
            db.rollback()  # Ensure db session is rolled back on error
            raise HTTPException(
                status_code=500, detail="Internal server error handling voice order."
            )

    async def process_seat_order(
        self,
        db: Session,
        audio_data: str,  # Base64 encoded
        table_id: int,
        seat_number: int,
    ) -> SeatOrderResponse:  # Return type aligned with schema
        """Process an audio order for a specific seat."""
        logger.info(f"Processing seat order for table {table_id}, seat {seat_number}")
        deepgram = (
            SpeechService()
        )  # Instantiate here or inject - Use correct imported name
        try:
            # Decode base64 audio data
            try:
                raw_audio = base64.b64decode(audio_data)
            except Exception as e:
                logger.error(
                    f"Error decoding base64 audio data for seat order: {str(e)}"
                )
                raise HTTPException(
                    status_code=400, detail="Invalid audio data format."
                )

            # Transcribe audio
            transcription = await deepgram.transcribe_audio(raw_audio)
            if not transcription or "results" not in transcription:
                logger.error(
                    "Deepgram transcription failed or returned unexpected format for seat order."
                )
                raise HTTPException(
                    status_code=502, detail="Transcription service failed."
                )

            transcript = transcription["results"]["channels"][0]["alternatives"][0][
                "transcript"
            ]
            logger.info(f"Seat order transcription: {transcript}")

            # Extract menu items from transcript
            items = self._extract_menu_items(transcript)
            details = ", ".join(items)
            if not details:
                logger.warning(
                    f"No menu items extracted from transcript for seat order: {transcript}"
                )
                # Decide how to handle - maybe raise error or create order with empty details?
                # For now, create with empty details but log warning.

            # Create order in DB using the dedicated method
            order_data = OrderCreate(
                table_id=table_id,
                seat_number=seat_number,
                details=details,
                raw_transcription=transcript,
                status=OrderStatus.PENDING.value,  # Default status
            )
            order = await self.create_order_from_data(
                db, order_data
            )  # Use the create method

            logger.info(
                f"Created seat order {order.id} for table {table_id}, seat {seat_number}"
            )

            # Record metrics
            monitoring.record_order_metrics(
                processing_time_ms=0,  # TODO: Add actual processing time
                success=True,
                num_items=len(items),
                table_id=table_id,
                seat_number=seat_number,
                action="process_seat_order",
            )

            # Return data compatible with SeatOrderResponse schema
            # Use Pydantic model for validation and serialization
            return SeatOrderResponse.from_orm(order)

        except HTTPException:
            db.rollback()  # Rollback on HTTP exceptions during processing
            raise
        except Exception as e:
            logger.error(f"Error processing seat order: {str(e)}", exc_info=True)
            monitoring.record_error("service", "process_seat_order")
            db.rollback()  # Rollback DB changes on general error
            raise HTTPException(
                status_code=500, detail="Internal server error processing seat order."
            )

    def _extract_menu_items(self, transcript: str) -> List[str]:
        """Extract menu items from transcript."""
        # Using the instance's menu_items if defined, otherwise fallback
        # Ensure menu_items is defined if not using __init__
        menu_items_to_use = getattr(
            self,
            "menu_items",
            {
                "burger": ["burger", "hamburger", "cheeseburger"],
                "fries": ["fries", "french fries"],
                "salad": ["salad"],
                "coke": ["coke", "cola"],
                "water": ["water"],
                "coffee": ["coffee"],
                "chicken sandwich": ["chicken sandwich"],
            },
        )
        transcript = transcript.lower()
        found_items = set()
        for item, variations in menu_items_to_use.items():
            # Simple substring check - might need more robust matching (e.g., regex, NLP)
            if any(variation in transcript for variation in variations):
                found_items.add(item)
        logger.debug(f"Extracted items: {found_items} from transcript: '{transcript}'")
        return sorted(list(found_items))

    async def confirm_or_cancel_seat_order(
        self, db: Session, order_id: int, confirmed: bool
    ) -> SeatOrderResponse:  # Return type aligned with schema
        """Confirm or cancel a seat order."""
        logger.info(
            f"Confirming/Cancelling seat order {order_id}. Confirmed: {confirmed}"
        )
        try:
            # Use the update method with specific status
            new_status = (
                OrderStatus.CONFIRMED.value
                if confirmed
                else OrderStatus.CANCELLED.value
            )
            order_update_data = OrderUpdate(status=new_status)

            updated_order = await self.update_order(db, order_id, order_update_data)

            if not updated_order:
                logger.warning(f"Seat order {order_id} not found for confirmation.")
                # Let the API layer handle the 404 based on None return from update_order
                raise ValueError(
                    f"Seat order {order_id} not found for confirmation"
                )  # Raise specific error caught in API

            logger.info(
                f"Seat order {order_id} status updated to {updated_order.status}"
            )

            # Record metrics
            monitoring.record_order_metrics(
                processing_time_ms=0,  # TODO: Add actual processing time
                success=True,
                num_items=(
                    len(updated_order.details.split(", "))
                    if updated_order.details
                    else 0
                ),
                table_id=updated_order.table_id,
                seat_number=updated_order.seat_number,
                action="confirm" if confirmed else "cancel",
            )

            # Return data compatible with SeatOrderResponse schema
            return SeatOrderResponse.from_orm(updated_order)

        except ValueError:  # Re-raise specific errors caught in API
            raise
        except HTTPException:  # Re-raise HTTP exceptions from update_order
            raise
        except Exception as e:
            logger.error(
                f"Unexpected error confirming/cancelling seat order {order_id}: {str(e)}",
                exc_info=True,
            )
            monitoring.record_error("service", "confirm_cancel_order")
            # Rollback is handled within update_order on error
            raise HTTPException(
                status_code=500,
                detail="Internal server error confirming/cancelling order.",
            )

    async def get_table_orders(
        self, db: Session, table_id: int
    ) -> List[SeatOrderResponse]:  # Return type aligned with schema
        """Get all orders for a table. Returns list compatible with SeatOrderResponse."""
        logger.info(f"Getting orders for table {table_id}")
        try:
            # Use the generic get_orders method we implemented
            orders = await self.get_orders(
                db=db, table_id=table_id, limit=1000
            )  # Get all for table

            # Convert Order objects to SeatOrderResponse using Pydantic's from_orm
            return [SeatOrderResponse.from_orm(o) for o in orders]
        except HTTPException:  # Re-raise HTTP exceptions from get_orders
            raise
        except Exception as e:
            logger.error(
                f"Error getting orders for table {table_id} from service: {str(e)}",
                exc_info=True,
            )
            monitoring.record_error("service", "get_table_orders")
            raise HTTPException(
                status_code=500,
                detail=f"Internal server error getting orders for table {table_id}.",
            )
