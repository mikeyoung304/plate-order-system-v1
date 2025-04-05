import asyncio
import logging
import pyaudio
import wave
import os
import base64
import httpx
import json
from typing import Optional
from dotenv import load_dotenv
from src.app.services.voice.audio_recorder import AudioRecorder
from src.app.config.settings import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SeatOrderTest:
    def __init__(self):
        self.audio_recorder = AudioRecorder()
        self.api_base = f"http://localhost:8000{settings.API_V1_STR}"
        self.current_order_id = None
        
    async def record_order(self, table_id: int, seat_number: int) -> bool:
        """
        Record an order for a specific seat.
        
        Args:
            table_id: Table ID
            seat_number: Seat number
            
        Returns:
            bool: True if recording was successful
        """
        try:
            logger.info(f"Recording order for Table {table_id}, Seat {seat_number}")
            
            # Start recording
            if not await self.audio_recorder.start_recording():
                logger.error("Failed to start recording")
                return False
            
            # Simulate button press
            logger.info("Recording... (speak your order)")
            logger.info("Press Enter to stop recording")
            input()  # Wait for Enter key
            
            # Stop recording
            success, audio_data = await self.audio_recorder.stop_recording()
            if not success or not audio_data:
                logger.error("Failed to stop recording")
                return False
            
            # Convert to base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Send to API
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base}/orders/seat",
                    json={
                        "table_id": table_id,
                        "seat_number": seat_number,
                        "audio_data": audio_base64
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    self.current_order_id = result['id']
                    logger.info("Order recorded successfully:")
                    logger.info(f"Transcription: {result['raw_transcription']}")
                    logger.info(f"Processed Order: {result['processed_order']}")
                    logger.info(f"Order ID: {result['id']}")
                    return True
                else:
                    logger.error(f"API Error: {response.status_code}")
                    logger.error(response.text)
                    return False
                    
        except Exception as e:
            logger.error(f"Error recording order: {str(e)}")
            return False
    
    async def confirm_order(self, confirm: bool = True) -> bool:
        """
        Confirm or cancel the current order.
        
        Args:
            confirm: Whether to confirm (True) or cancel (False) the order
            
        Returns:
            bool: True if confirmation was successful
        """
        if not self.current_order_id:
            logger.error("No current order to confirm")
            return False
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base}/orders/seat/{self.current_order_id}/confirm",
                    json={
                        "id": self.current_order_id,
                        "confirmed": confirm
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    action = "confirmed" if confirm else "cancelled"
                    logger.info(f"Order {action} successfully")
                    logger.info(f"Final order status: {result['status']}")
                    return True
                else:
                    logger.error(f"API Error: {response.status_code}")
                    logger.error(response.text)
                    return False
                    
        except Exception as e:
            logger.error(f"Error confirming order: {str(e)}")
            return False
    
    async def get_table_orders(self, table_id: int) -> bool:
        """
        Get all orders for a table.
        
        Args:
            table_id: Table ID
            
        Returns:
            bool: True if retrieval was successful
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_base}/orders/table/{table_id}/seats",
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    orders = response.json()
                    logger.info(f"\nOrders for Table {table_id}:")
                    for order in orders:
                        logger.info(f"\nSeat {order['seat_number']}:")
                        logger.info(f"Status: {order['status']}")
                        logger.info(f"Items: {', '.join(order['items'])}")
                    return True
                else:
                    logger.error(f"API Error: {response.status_code}")
                    logger.error(response.text)
                    return False
                    
        except Exception as e:
            logger.error(f"Error getting table orders: {str(e)}")
            return False

async def main():
    """Main test function."""
    # Load environment variables
    load_dotenv(override=True)
    
    logger.info("Starting seat order test...")
    
    # Initialize test
    test = SeatOrderTest()
    
    # Test flow
    table_id = int(input("Enter table ID: "))
    seat_number = int(input("Enter seat number: "))
    
    # Record order
    if not await test.record_order(table_id, seat_number):
        logger.error("Order recording failed")
        return
    
    # Ask for confirmation
    confirm = input("Confirm order? (y/n): ").lower() == 'y'
    if not await test.confirm_order(confirm):
        logger.error("Order confirmation failed")
        return
    
    # Show table orders
    if not await test.get_table_orders(table_id):
        logger.error("Failed to get table orders")
        return
    
    logger.info("Test completed successfully")

if __name__ == "__main__":
    asyncio.run(main()) 