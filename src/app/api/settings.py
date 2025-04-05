from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

# Placeholder for a potential Settings model if you have one in models.py
# from src.app.models.models import Settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/settings",
    tags=["settings"],
    responses={404: {"description": "Not found"}},
)


# Define the expected structure for settings data based on Settings.test.tsx
class SettingsData(BaseModel):
    notifications_enabled: Optional[bool] = None
    sound_enabled: Optional[bool] = None
    voice_recognition_enabled: Optional[bool] = None
    analytics_enabled: Optional[bool] = None
    api_key: Optional[str] = None


# --- Placeholder Data Store ---
# In a real application, you would load/save this from a database table (e.g., a Settings model)
# or a configuration file. For now, use an in-memory dictionary.
current_settings = {
    "notifications_enabled": True,
    "sound_enabled": False,
    "voice_recognition_enabled": True,
    "analytics_enabled": False,
    "api_key": "test-api-key",  # Default/initial value
}
# --- End Placeholder ---


@router.get("", response_model=SettingsData)  # Respond to /api/settings directly
def get_settings():
    """
    Retrieve the current application settings.
    """
    logger.info("Fetching current settings")
    # In a real app: query database for settings
    # settings_model = db.query(Settings).first()
    # if not settings_model:
    #     raise HTTPException(status_code=404, detail="Settings not found")
    # return settings_model
    return current_settings


@router.put("", response_model=SettingsData)  # Respond to /api/settings directly
def update_settings(settings_update: SettingsData):
    """
    Update application settings.
    """
    logger.info(f"Updating settings with: {settings_update.dict(exclude_unset=True)}")
    global current_settings
    update_data = settings_update.dict(exclude_unset=True)

    # In a real app: find settings model in db and update fields
    # settings_model = db.query(Settings).first()
    # if not settings_model:
    #     raise HTTPException(status_code=404, detail="Settings not found")
    # for key, value in update_data.items():
    #     setattr(settings_model, key, value)
    # db.commit()
    # db.refresh(settings_model)
    # return settings_model

    current_settings.update(update_data)
    logger.info(f"Settings updated to: {current_settings}")
    return current_settings
