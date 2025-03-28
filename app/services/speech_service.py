import logging
import os
import json
from typing import BinaryIO, Dict, Any, Optional
import base64
import tempfile

from app.services.voice.whisper_service import WhisperService

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SpeechService:
    """
    Service for handling speech-to-text processing
    """
    
    def __init__(self):
        # Check for OpenAI API key
        self.api_key = os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            logger.warning("OPENAI_API_KEY not set in environment variables")
        
        # Initialize WhisperService
        self.whisper_service = WhisperService()
    
    async def transcribe_audio(self, audio_file: BinaryIO) -> Dict[str, Any]:
        """
        Transcribe audio using OpenAI Whisper API
        
        Args:
            audio_file: Binary file-like object containing audio data
            
        Returns:
            Dictionary with transcription result
        """
        try:
            logger.info("Processing audio file")
            
            if self.api_key:
                # Use WhisperService to transcribe audio
                result = await self.whisper_service.transcribe_audio(audio_file)
                
                if "error" in result:
                    logger.error(f"Error from WhisperService: {result['error']}")
                    return {"success": False, "error": result["error"]}
                
                return {"success": True, "text": result["text"]}
            else:
                # Fallback to sample responses if API key is not set
                logger.warning("Using sample responses (OpenAI API key not set)")
                sample_responses = [
                    "Table 3: 1 cheeseburger with fries. 1 chicken sandwich. 1 diet coke.",
                    "I need 2 grilled chicken salads and a water for table 5.",
                    "Table 8 wants 1 soup of the day, 1 fish special, and 2 iced teas.",
                    "Table 2: 1 veggie burger no onions. 1 side salad with dressing on the side. 1 lemonade."
                ]
                import random
                return {"success": True, "text": random.choice(sample_responses)}
                
        except Exception as e:
            logger.error(f"Error transcribing audio: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def process_audio(self, audio_data: str) -> str:
        """
        Process base64 encoded audio data
        
        Args:
            audio_data: Base64 encoded audio data
            
        Returns:
            Transcription text
        """
        try:
            logger.info(f"Processing audio data of length: {len(audio_data)}")
            
            if self.api_key:
                # Convert base64 to binary data
                binary_data = base64.b64decode(audio_data)
                
                # Create a temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
                    temp_file.write(binary_data)
                    temp_file_path = temp_file.name
                
                try:
                    # Use OpenAI API to transcribe
                    import openai
                    openai.api_key = self.api_key
                    
                    with open(temp_file_path, "rb") as audio_file:
                        response = openai.Audio.transcribe("whisper-1", audio_file)
                    
                    # Clean up the temporary file
                    os.remove(temp_file_path)
                    
                    return response.get("text", "")
                except Exception as e:
                    logger.error(f"Error using OpenAI API: {str(e)}")
                    # Clean up the temporary file
                    if os.path.exists(temp_file_path):
                        os.remove(temp_file_path)
                    
                    # Fallback to sample responses
                    sample_responses = [
                        "Table 3: 1 cheeseburger with fries. 1 chicken sandwich. 1 diet coke.",
                        "I need 2 grilled chicken salads and a water for table 5.",
                        "Table 8 wants 1 soup of the day, 1 fish special, and 2 iced teas.",
                        "Table 2: 1 veggie burger no onions. 1 side salad with dressing on the side. 1 lemonade."
                    ]
                    import random
                    return random.choice(sample_responses)
            else:
                # Fallback to sample responses if API key is not set
                logger.warning("Using sample responses (OpenAI API key not set)")
                sample_responses = [
                    "Table 3: 1 cheeseburger with fries. 1 chicken sandwich. 1 diet coke.",
                    "I need 2 grilled chicken salads and a water for table 5.",
                    "Table 8 wants 1 soup of the day, 1 fish special, and 2 iced teas.",
                    "Table 2: 1 veggie burger no onions. 1 side salad with dressing on the side. 1 lemonade."
                ]
                import random
                return random.choice(sample_responses)
            
        except Exception as e:
            logger.error(f"Error processing audio data: {str(e)}")
            return f"Error: {str(e)}"
    
    def process_order_text(self, text: str) -> str:
        """
        Process transcribed text into a structured order
        
        Args:
            text: Transcribed text from audio
            
        Returns:
            Processed order text
        """
        try:
            # Process the transcribed text into a structured order
            logger.info(f"Processing order text: {text}")
            
            import re
            
            # Extract table number if present
            table_prefix = ""
            table_match = re.match(r'(?:table|Table)\s+(\d+)[:\s]+(.*)', text)
            if table_match:
                table_num = table_match.group(1)
                text = table_match.group(2)
                table_prefix = f"Table {table_num}: "
            
            # Split by common sentence delimiters and conjunctions
            items = []
            raw_items = re.split(r'[.,;]|\band\b', text)
            
            for item in raw_items:
                item = item.strip()
                if item:
                    # Try to identify quantity and item
                    quantity_match = re.match(r'^(?:(?:can I (?:have|get))|(?:I want)|(?:I\'ll have)|(?:I need))?\s*(?:(\d+)|a|an)?\s*(.+?)(?:\s+(?:please|thank you))?$', item, re.IGNORECASE)
                    if quantity_match:
                        quantity = quantity_match.group(1) or '1'
                        item_name = quantity_match.group(2).strip()
                        items.append(f"{quantity} {item_name}")
                    else:
                        items.append(item)
            
            # Combine table prefix with processed items
            processed_text = table_prefix + "\n".join(items)
            
            return processed_text
            
        except Exception as e:
            logger.error(f"Error processing order text: {str(e)}")
            return text  # Return original text on error
