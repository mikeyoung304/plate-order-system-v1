from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
# from app.services.voice.whisper_service import WhisperService # Removed
from app.services.speech.deepgram_service import DeepgramService as SpeechService # Updated import
from app.core.dependencies import services
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

router = APIRouter(prefix="/speech", tags=["speech"])

@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    speech_service: SpeechService = Depends(lambda: SpeechService()), # Changed dependency
    rate_limiter: None = Depends(RateLimiter(times=5, seconds=60))
):
    # Use SpeechService's transcribe_audio method
    # Note: This method now uses fallback logic as WhisperService was removed
    result = await speech_service.transcribe_audio(audio.file) # Pass the file object
    
    if not result.get("success"):
        error_detail = result.get("error", "Unknown transcription error")
        raise HTTPException(status_code=500, detail=error_detail)
        
    # Return the successful transcription text
    return {"text": result.get("text", "")}
