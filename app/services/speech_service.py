import os
import base64
import json
import re
import tempfile
import logging
from typing import Dict, List, Any, Optional
import requests
from pydantic import BaseModel

# Configure logging
logger = logging.getLogger(__name__)

class SpeechService:
    """
    Service for processing speech to text and extracting order information.
    Uses OpenAI's Whisper API for transcription in production mode,
    with a fallback to a simplified mock implementation for development.
    """
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.app_env = os.getenv("APP_ENV", "development")
        
        # Common food items
        self.food_items = [
            "chicken", "beef", "fish", "pork", "turkey", "tofu",
            "vegetables", "salad", "soup", "pasta", "rice", "potatoes",
            "bread", "sandwich", "burger", "eggs", "fruit", "appetizer",
            "dessert", "coffee", "tea", "water", "juice", "wine", "beer",
            "cocktail", "soda", "steak", "pizza", "taco", "burrito", "curry",
            "noodles", "shrimp", "lobster", "crab", "scallop", "oyster", "clam"
        ]
        
        # Dietary restrictions
        self.dietary_restrictions = [
            "low sodium", "no salt", "low salt", "salt-free",
            "gluten-free", "no gluten", "nut-free", "dairy-free",
            "lactose-free", "no dairy", "no nuts", "no peanuts",
            "vegan", "vegetarian", "diabetic", "low sugar", "sugar-free",
            "keto", "paleo", "halal", "kosher", "no shellfish", "no pork",
            "no beef", "no meat", "low carb", "no alcohol"
        ]
        
        # Texture preferences
        self.texture_preferences = [
            "pureed", "chopped", "minced", "ground", "soft", "liquid",
            "mashed", "blended", "whole", "sliced", "diced", "shredded",
            "grated", "julienned", "cubed", "smooth", "creamy", "crispy",
            "crunchy", "tender", "firm", "medium", "well-done", "rare"
        ]
        
        # Restaurant shorthand
        self.restaurant_shorthand = {
            "86": "out of",
            "all day": "total count",
            "behind": "coming through",
            "fire": "start cooking",
            "on the fly": "rush",
            "SOS": "sauce on side",
            "eighty-six": "out of",
            "hold": "omit",
            "rush": "prepare immediately",
            "PPK": "pickles",
            "RI": "right in",
            "SB": "strawberry",
            "C": "chocolate",
            "V": "vanilla"
        }
        
        logger.info(f"Speech service initialized in {self.app_env} mode")
    
    def process_audio(self, audio_data: str) -> str:
        """
        Process base64 encoded audio and convert to text
        
        Args:
            audio_data: Base64 encoded audio
            
        Returns:
            str: Transcribed text
        """
        # In production, use OpenAI Whisper API
        if self.app_env == "production" and self.api_key:
            try:
                return self._process_with_whisper(audio_data)
            except Exception as e:
                logger.error(f"Error with Whisper API: {e}")
                logger.info("Falling back to mock implementation")
                return self._mock_transcription(audio_data)
        else:
            # For development/testing, use mock implementation
            return self._mock_transcription(audio_data)
    
    def _process_with_whisper(self, audio_data: str) -> str:
        """
        Process audio with OpenAI's Whisper API
        """
        try:
            # Decode base64 audio
            audio_bytes = base64.b64decode(audio_data)
            
            # Save to temporary file - Use .mp3 instead of .webm
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
                temp_file_path = temp_file.name
                temp_file.write(audio_bytes)
            
            try:
                # Call Whisper API with proper multipart form
                headers = {
                    "Authorization": f"Bearer {self.api_key}"
                }
                
                with open(temp_file_path, "rb") as audio_file:
                    # Explicitly set the file name with .mp3 extension in the form
                    files = {"file": ("audio.mp3", audio_file, "audio/mpeg")}
                    data = {"model": "whisper-1"}
                    
                    response = requests.post(
                        "https://api.openai.com/v1/audio/transcriptions",
                        headers=headers,
                        files=files,
                        data=data
                    )
                
                # Process response
                if response.status_code == 200:
                    result = response.json()
                    return result.get("text", "")
                else:
                    logger.error(f"Whisper API error: {response.status_code} - {response.text}")
                    raise Exception(f"Whisper API returned {response.status_code}")
            finally:
                # Clean up temp file
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    
        except Exception as e:
            logger.error(f"Error processing audio with Whisper: {e}")
            raise
    
    def _mock_transcription(self, audio_data: str) -> str:
        """
        Generate mock transcription for development/testing
        """
        # Decode base64 to get length or use hash
        try:
            decoded_audio = base64.b64decode(audio_data)
            audio_length = len(decoded_audio)
        except:
            # If decoding fails, use a simple hash of the string
            audio_length = hash(audio_data) % 100000
        
        # Return different mock responses based on "audio length"
        mock_responses = [
            "One pureed chicken, no salt, for Mrs. Smith.",
            "How's your day going? I'd like to order a regular portion of mashed potatoes and ground beef for Mrs. Davis. Remember she needs it to be low sodium.",
            "Can I get a minced fish with extra sauce for Mr. Johnson? He's sitting by the window.",
            "Table 4 would like two gluten-free burgers, one with no onions, and a side of sweet potato fries.",
            "86 the soup today. For table 7, I need one steak medium rare with sauce on the side and one chicken salad hold the croutons.",
            "Could I get a vegan pasta for the gentleman at table 12? He also mentioned he's allergic to nuts."
        ]
        
        # Select mock response based on audio length
        return mock_responses[audio_length % len(mock_responses)]
    
    def filter_small_talk(self, text: str) -> str:
        """
        Filter out small talk from order text
        """
        # Patterns for common small talk
        small_talk_patterns = [
            r"how('s|\s+is) (your|the) day",
            r"how are you",
            r"good (morning|afternoon|evening)",
            r"have a (good|nice) day",
            r"please",
            r"thank you",
            r"thanks",
            r"excuse me",
            r"hello",
            r"hi there",
            r"hey",
            r"(um|uh|er|hmm)",
            r"you know",
            r"like",
            r"I('d| would) like to",
            r"can I (get|have|order)",
            r"could I (get|have|order)",
            r"I('d| would) like",
            r"I need",
            r"(he|she|they)('s| is| are) sitting",
            r"sitting (at|by)",
            r"table \d+"
        ]
        
        # Replace small talk with empty string
        filtered_text = text
        for pattern in small_talk_patterns:
            filtered_text = re.sub(pattern, "", filtered_text, flags=re.IGNORECASE)
        
        # Clean up multiple spaces
        filtered_text = re.sub(r'\s+', ' ', filtered_text).strip()
        
        return filtered_text
    
    def translate_shorthand(self, text: str) -> str:
        """
        Translate restaurant shorthand to regular language
        """
        translated = text
        
        for shorthand, meaning in self.restaurant_shorthand.items():
            # Create a pattern that ensures we match the whole word
            pattern = r'\b' + re.escape(shorthand) + r'\b'
            translated = re.sub(pattern, meaning, translated, flags=re.IGNORECASE)
            
        return translated
    
    def extract_food_items(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract food items from text
        """
        food_items = []
        text_lower = text.lower()
        
        # Extract all quantities with associated food items using regex
        quantity_pattern = r'(\d+)\s+([\w\s]+?)(?=\s*(?:,|\.|and|with|no|\d+|$))'
        quantity_matches = re.finditer(quantity_pattern, text_lower)
        
        for match in quantity_matches:
            try:
                quantity = int(match.group(1))
                item_text = match.group(2).strip()
                
                # Check if the item contains any known food
                found_food = False
                for food in self.food_items:
                    if food in item_text:
                        found_food = True
                        
                        # Extract texture if present
                        texture = None
                        for pref in self.texture_preferences:
                            if pref in item_text:
                                texture = pref
                                # Remove texture from item text to clean up
                                item_text = item_text.replace(pref, "").strip()
                                break
                        
                        food_items.append({
                            "name": food,
                            "quantity": quantity,
                            "texture": texture,
                            "original_text": match.group(0)
                        })
                        break
                
                # If no known food found but text has more than one word, 
                # it might be a food item we don't know
                if not found_food and len(item_text.split()) > 1:
                    food_items.append({
                        "name": item_text,
                        "quantity": quantity,
                        "texture": None,
                        "original_text": match.group(0)
                    })
            except:
                continue
        
        # Also check for single food items without quantities
        if not food_items:
            for food in self.food_items:
                if food in text_lower:
                    # Check for texture
                    texture = None
                    for pref in self.texture_preferences:
                        if pref in text_lower:
                            texture = pref
                            break
                    
                    food_items.append({
                        "name": food,
                        "quantity": 1,  # Default to 1 if no quantity specified
                        "texture": texture,
                        "original_text": food
                    })
        
        return food_items
    
    def extract_dietary_restrictions(self, text: str) -> List[str]:
        """
        Extract dietary restrictions from text
        """
        restrictions = []
        text_lower = text.lower()
        
        # Check for known restrictions
        for restriction in self.dietary_restrictions:
            if restriction in text_lower:
                restrictions.append(restriction)
        
        # Check for "no X" patterns
        no_pattern = r"no\s+(\w+)"
        matches = re.finditer(no_pattern, text_lower)
        for match in matches:
            food = match.group(1)
            if food not in [r.split()[-1] for r in restrictions]:  # Avoid duplication
                restrictions.append(f"no {food}")
        
        return restrictions
    
    def extract_table_number(self, text: str) -> Optional[int]:
        """
        Extract table number if mentioned
        """
        table_patterns = [
            r"table\s+(\d+)",
            r"table\s+number\s+(\d+)"
        ]
        
        for pattern in table_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return int(match.group(1))
                except:
                    pass
        
        return None
    
    def extract_resident_info(self, text: str) -> Optional[str]:
        """
        Extract resident name if mentioned
        """
        # Look for common patterns like "for Mrs. Smith" or "Mr. Johnson wants"
        resident_patterns = [
            r"for\s+(Mr\.|Mrs\.|Ms\.|Dr\.)\s+([A-Z][a-z]+)",
            r"(Mr\.|Mrs\.|Ms\.|Dr\.)\s+([A-Z][a-z]+)('s|\s+wants|\s+would like)"
        ]
        
        for pattern in resident_patterns:
            match = re.search(pattern, text)
            if match:
                title = match.group(1)
                name = match.group(2)
                return f"{title} {name}"
        
        return None
    
    def process_order_text(self, text: str, resident=None) -> str:
        """
        Process the transcribed text to extract order details and format for kitchen
        
        Args:
            text: The transcribed text
            resident: Optional resident object with preferences
            
        Returns:
            str: Formatted order for the kitchen
        """
        # First translate any restaurant shorthand
        translated_text = self.translate_shorthand(text)
        
        # Then filter out small talk
        filtered_text = self.filter_small_talk(translated_text)
        
        # Extract information
        food_items = self.extract_food_items(filtered_text)
        dietary_restrictions = self.extract_dietary_restrictions(filtered_text)
        table_number = self.extract_table_number(text)
        
        # If resident provided, add their preferences
        if resident:
            if resident.medical_dietary:
                # Add medical dietary restrictions if not already included
                for restriction in resident.medical_dietary:
                    if restriction not in dietary_restrictions:
                        dietary_restrictions.append(restriction)
            
            # If texture not specified but in resident preferences, use that
            if resident.texture_prefs and food_items:
                for item in food_items:
                    if not item["texture"] and resident.texture_prefs:
                        item["texture"] = resident.texture_prefs[0]
        
        # Format the order
        if not food_items:
            return "Could not process order - no food items detected"
        
        order_parts = []
        for item in food_items:
            item_text = f"{item['quantity']} "
            if item["texture"]:
                item_text += f"{item['texture'].title()} "
            item_text += item["name"].title()
            order_parts.append(item_text)
        
        formatted_order = " & ".join(order_parts)
        
        if dietary_restrictions:
            formatted_order += f" - {', '.join(dietary_restrictions).title()}"
        
        if table_number:
            formatted_order = f"Table {table_number}: {formatted_order}"
            
        return formatted_order

# Create singleton instance
speech_service = SpeechService()