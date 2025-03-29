import logging
import uuid
import base64
from typing import List, Optional
from app.models.order import Order, OrderStatus
from app.services.voice.deepgram_service import DeepgramService
from app.services.monitoring.monitoring_service import MonitoringService

logger = logging.getLogger(__name__)

class OrderProcessor:
    """Service for processing voice orders."""
    
    def __init__(self):
        self.deepgram = DeepgramService()
        self.monitoring = MonitoringService()
        self.menu_items = {
            "burger": ["burger", "hamburger", "cheeseburger"],
            "fries": ["fries", "french fries"],
            "salad": ["salad"],
            "coke": ["coke", "coca cola", "cola"],
            "sprite": ["sprite"],
            "chicken sandwich": ["chicken sandwich"],
            "water": ["water"],
            "coffee": ["coffee"],
            "tea": ["tea"],
            "milkshake": ["milkshake", "shake"]
        }
    
    async def process_order(
        self,
        audio_data: str,  # Changed from bytes to str to accept base64
        table_id: int,
        seat_number: int
    ) -> Order:
        """
        Process an audio order.
        
        Args:
            audio_data: Base64-encoded audio data
            table_id: Table ID
            seat_number: Seat number
            
        Returns:
            Order: Processed order
        """
        try:
            # Decode base64 audio data
            try:
                raw_audio = base64.b64decode(audio_data)
            except Exception as e:
                logger.error(f"Error decoding base64 audio data: {str(e)}")
                raise ValueError("Invalid audio data format")
            
            # Transcribe audio
            transcription = await self.deepgram.transcribe_audio(raw_audio)
            
            # Extract transcript text
            transcript = transcription["results"]["channels"][0]["alternatives"][0]["transcript"]
            
            # Extract menu items from transcript
            items = self._extract_menu_items(transcript)
            
            # Create order
            order = Order(
                table_id=table_id,
                seat_number=seat_number,
                details=", ".join(items),
                raw_transcription=transcript,
                status=OrderStatus.PENDING
            )
            
            # Record metrics
            self.monitoring.record_order_metrics(
                processing_time_ms=0,  # TODO: Add actual processing time
                success=True,
                num_items=len(items),
                table_id=table_id,
                seat_number=seat_number
            )
            
            return order
            
        except Exception as e:
            logger.error(f"Error processing order: {str(e)}")
            self.monitoring.record_error(e, "process_order")
            raise
    
    def _extract_menu_items(self, transcript: str) -> List[str]:
        """Extract menu items from transcript."""
        # Simple menu items for testing
        menu_items = {
            "burger": ["burger", "hamburger", "cheeseburger"],
            "fries": ["fries", "french fries"],
            "salad": ["salad"],
            "coke": ["coke", "cola"],
            "water": ["water"],
            "coffee": ["coffee"],
            "chicken sandwich": ["chicken sandwich"]
        }
        
        # Convert transcript to lowercase for matching
        transcript = transcript.lower()
        
        # Find all menu items in transcript
        found_items = set()
        for item, variations in menu_items.items():
            if any(variation in transcript for variation in variations):
                found_items.add(item)
        
        # Return items in a consistent order
        return sorted(list(found_items))
    
    async def confirm_order(self, order: Order, confirmed: bool) -> Order:
        """
        Confirm or cancel an order.
        
        Args:
            order: Order to confirm/cancel
            confirmed: Whether to confirm (True) or cancel (False)
            
        Returns:
            Order: Updated order
        """
        try:
            # Update order status
            order.status = OrderStatus.CONFIRMED if confirmed else OrderStatus.CANCELLED
            
            # Record metrics
            await self.monitoring.record_order_metrics(
                processing_time_ms=0,  # TODO: Add actual processing time
                success=True,
                num_items=len(order.details.split(", ")) if order.details else 0,
                table_id=order.table_id,
                seat_number=order.seat_number
            )
            
            return order
            
        except Exception as e:
            logger.error(f"Error confirming order: {str(e)}")
            await self.monitoring.record_error(type(e).__name__, str(e), {"operation": "confirm_order"})
            raise
    
    async def get_table_orders(self, table_id: int) -> List[Order]:
        """
        Get all orders for a table.
        
        Args:
            table_id: Table ID
            
        Returns:
            List[Order]: List of orders
        """
        # TODO: Implement database query
        return [] 