from fastapi import APIRouter, UploadFile, File, HTTPException
from services.speech_service import SpeechService
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
speech_service = SpeechService()

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe uploaded audio file using OpenAI Whisper API
    """
    try:
        # Log the request
        logger.info(f"Received audio transcription request: {file.filename}")
        
        # Check if the file is audio
        if not file.content_type.startswith('audio/'):
            logger.warning(f"Invalid file type: {file.content_type}")
            raise HTTPException(status_code=400, detail="File must be audio")
        
        # Process the audio with the speech service
        result = speech_service.transcribe_audio(file.file)
        
        # Check if transcription was successful
        if result.get("success"):
            logger.info(f"Transcription successful: {result.get('text')[:30]}...")
            return {"success": True, "text": result.get("text")}
        else:
            logger.error(f"Transcription failed: {result.get('error')}")
            raise HTTPException(status_code=500, detail=result.get("error"))
            
    except Exception as e:
        logger.error(f"Error during transcription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))