import os
import secrets
from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, PostgresDsn, validator
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    """
    Application settings with environment variable support and validation.
    """
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # CORS Configuration - comma-separated origins
    CORS_ORIGINS: str = "http://localhost:3000"

    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")
    
    # API Configuration
    API_PREFIX: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Supabase settings (optional)
    NEXT_PUBLIC_SUPABASE_URL: Optional[str] = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Optional[str] = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    # Voice recognition settings
    DEEPGRAM_API_KEY: Optional[str] = os.getenv("DEEPGRAM_API_KEY")
    # OpenAI API Key for Whisper transcription
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    
    # Application settings
    PROJECT_NAME: str = "Plate Order System"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Logging settings
    LOG_LEVEL: str = "INFO"
    
    class Config:
        case_sensitive = True


settings = Settings()
