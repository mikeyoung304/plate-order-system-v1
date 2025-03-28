import os
import tempfile
import openai
from fastapi import UploadFile, HTTPException

class WhisperService:
    def __init__(self):
        self.api_key = os.environ.get("OPENAI_API_KEY", "")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        
        openai.api_key = self.api_key
        self.model = "whisper-1"
    
    async def transcribe_audio(self, audio_file):
        # Check if API key is set
        if not self.api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key is not set")
        
        # Use the actual OpenAI API
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            with open(temp_file_path, "rb") as audio:
                response = openai.Audio.transcribe(model=self.model, file=audio)
            
            if not response or not response.get("text"):
                raise HTTPException(status_code=500, detail="Failed to transcribe audio: Empty response from OpenAI API")
                
            return {"text": response.get("text", "")}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to transcribe audio: {str(e)}")
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
