from pydantic import BaseModel, Field
from typing import Optional

class SettingsBase(BaseModel):
    notifications_enabled: bool = Field(default=True, description="Enable notifications for new orders and updates")
    sound_enabled: bool = Field(default=True, description="Enable sound effects for notifications")
    voice_recognition_enabled: bool = Field(default=True, description="Enable voice input for orders")
    analytics_enabled: bool = Field(default=True, description="Enable usage data collection")
    api_key: Optional[str] = Field(None, description="API key for accessing the API")
    deepgram_api_key: Optional[str] = Field(None, description="API key for voice recognition service")

class SettingsUpdate(SettingsBase):
    """Schema for updating settings. All fields are optional."""
    notifications_enabled: Optional[bool] = None
    sound_enabled: Optional[bool] = None
    voice_recognition_enabled: Optional[bool] = None
    analytics_enabled: Optional[bool] = None
    api_key: Optional[str] = None
    deepgram_api_key: Optional[str] = None

class SettingsResponse(SettingsBase):
    """Schema for settings response."""
    class Config:
        from_attributes = True 