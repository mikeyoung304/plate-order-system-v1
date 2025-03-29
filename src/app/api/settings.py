from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
from ..db.database import get_db
from ..models.models import Settings
from ..schemas.settings import SettingsUpdate, SettingsResponse
from ..core.config import settings as app_settings

router = APIRouter()

@router.get("/settings", response_model=SettingsResponse)
async def get_settings(db: Session = Depends(get_db)):
    """Get current application settings."""
    try:
        # Get settings from database
        db_settings = db.query(Settings).first()
        if not db_settings:
            # Return default settings if none exist
            return {
                "notifications_enabled": True,
                "sound_enabled": True,
                "voice_recognition_enabled": True,
                "analytics_enabled": True,
                "api_key": app_settings.API_KEY,
                "deepgram_api_key": app_settings.DEEPGRAM_API_KEY
            }
        return db_settings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/settings", response_model=SettingsResponse)
async def update_settings(
    settings_update: SettingsUpdate,
    db: Session = Depends(get_db)
):
    """Update application settings."""
    try:
        # Get current settings
        db_settings = db.query(Settings).first()
        
        if not db_settings:
            # Create new settings if none exist
            db_settings = Settings(**settings_update.dict())
            db.add(db_settings)
        else:
            # Update existing settings
            for key, value in settings_update.dict(exclude_unset=True).items():
                setattr(db_settings, key, value)
        
        db.commit()
        db.refresh(db_settings)
        return db_settings
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) 