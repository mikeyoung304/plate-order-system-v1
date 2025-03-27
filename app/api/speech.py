from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.services.voice.whisper_service import WhisperService

router = APIRouter(prefix="/speech", tags=["speech"])

@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    whisper_service: WhisperService = Depends(lambda: WhisperService())
):
    result = await whisper_service.transcribe_audio(audio)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result
