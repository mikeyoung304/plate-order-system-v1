import os
import tempfile
import openai
import logging
from fastapi import UploadFile, HTTPException

# Set up logging
logger = logging.getLogger(__name__)

class WhisperService:
    def __init__(self):
        self.api_key = os.environ.get("OPENAI_API_KEY", "")
        if not self.api_key:
            logger.error("OPENAI_API_KEY environment variable is not set")
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        
        openai.api_key = self.api_key
        self.model = "whisper-1"
        logger.info(f"WhisperService initialized with model: {self.model}")
    
    async def transcribe_audio(self, audio_file):
        # Check if API key is set
        if not self.api_key:
            logger.error("OpenAI API key is not set")
            raise HTTPException(status_code=500, detail="OpenAI API key is not set")
        
        logger.info(f"Transcribing audio file: {audio_file.filename}, content_type: {audio_file.content_type}")
        
        # Use the actual OpenAI API
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
            try:
                content = await audio_file.read()
                logger.info(f"Read {len(content)} bytes from uploaded file")
                
                if len(content) < 100:
                    logger.error(f"Audio file too small: {len(content)} bytes")
                    raise HTTPException(status_code=400, detail="Audio file too small or empty")
                
                temp_file.write(content)
                temp_file_path = temp_file.name
                logger.info(f"Saved audio to temporary file: {temp_file_path}")
            except Exception as e:
                logger.error(f"Error reading audio file: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Error reading audio file: {str(e)}")
        
        try:
            logger.info("Sending audio to OpenAI Whisper API")
            with open(temp_file_path, "rb") as audio:
                # Add more parameters for better transcription
                response = openai.Audio.transcribe(
                    model=self.model,
                    file=audio,
                    language="en",  # Specify language for better results
                    temperature=0.3,  # Lower temperature for more focused results
                    prompt="This is a food order in a restaurant."  # Context prompt
                )
            
            logger.info(f"Received response from OpenAI: {response}")
            
            if not response or not response.get("text"):
                logger.error("Empty response from OpenAI API")
                raise HTTPException(status_code=500, detail="Failed to transcribe audio: Empty response from OpenAI API")
            
            transcribed_text = response.get("text", "").strip()
            logger.info(f"Transcription result: '{transcribed_text}'")
            
            if not transcribed_text:
                logger.warning("Empty transcription result")
                return {"text": "Could not understand audio. Please try again and speak clearly."}
                
            return {"text": transcribed_text}
        except Exception as e:
            logger.error(f"Failed to transcribe audio: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to transcribe audio: {str(e)}")
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                logger.info(f"Removed temporary file: {temp_file_path}")
