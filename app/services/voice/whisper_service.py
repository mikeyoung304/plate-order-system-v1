import os
import tempfile
import openai
from fastapi import UploadFile

class WhisperService:
    def __init__(self):
        openai.api_key = os.environ.get("OPENAI_API_KEY", "")
        self.model = "whisper-1"
    
    async def transcribe_audio(self, audio_file):
        """
        Transcribe audio using OpenAI Whisper API
        """
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            with open(temp_file_path, "rb") as audio:
                response = openai.Audio.transcribe(
                    model=self.model,
                    file=audio
                )
            return {"text": response.get("text", "")}
        except Exception as e:
            return {"error": str(e)}
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
    
    async def process_order(self, transcription):
        """
        Process the transcription to extract order details
        """
        try:
            # Use OpenAI GPT to extract structured order information
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an AI assistant that extracts structured order information from transcribed speech. Extract table number, items ordered with quantities, and any special instructions."},
                    {"role": "user", "content": transcription}
                ],
                functions=[
                    {
                        "name": "extract_order",
                        "description": "Extract structured order information",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "table_number": {
                                    "type": "integer",
                                    "description": "The table number mentioned in the order"
                                },
                                "items": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "name": {
                                                "type": "string",
                                                "description": "The name of the food or drink item"
                                            },
                                            "quantity": {
                                                "type": "integer",
                                                "description": "The quantity of the item ordered"
                                            },
                                            "special_instructions": {
                                                "type": "string",
                                                "description": "Any special instructions for this item"
                                            }
                                        },
                                        "required": ["name", "quantity"]
                                    },
                                    "description": "The list of items ordered"
                                },
                                "special_instructions": {
                                    "type": "string",
                                    "description": "Any special instructions for the entire order"
                                }
                            },
                            "required": ["table_number", "items"]
                        }
                    }
                ],
                function_call={"name": "extract_order"}
            )
            
            # Extract the function call arguments
            function_call = response.choices[0].message.function_call
            if function_call and function_call.name == "extract_order":
                import json
                order_data = json.loads(function_call.arguments)
                return order_data
            
            return {"error": "Failed to extract order information"}
        except Exception as e:
            return {"error": str(e)}
