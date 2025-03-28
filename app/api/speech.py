from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
# from app.services.voice.whisper_service import WhisperService # Removed
from app.services.speech_service import SpeechService # Added

router = APIRouter(prefix="/speech", tags=["speech"])

@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    speech_service: SpeechService = Depends(lambda: SpeechService()) # Changed dependency
):
    # Use SpeechService's transcribe_audio method
    # Note: This method now uses fallback logic as WhisperService was removed
    result = await speech_service.transcribe_audio(audio.file) # Pass the file object
    
    if not result.get("success"):
        error_detail = result.get("error", "Unknown transcription error")
        raise HTTPException(status_code=500, detail=error_detail)
        
    # Return the successful transcription text
    return {"text": result.get("text", "")}
