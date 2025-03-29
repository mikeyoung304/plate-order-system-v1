from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

# Force reload environment variables
load_dotenv(override=True)

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Plate Order System"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    TEST_DATABASE_URL: str = os.getenv("TEST_DATABASE_URL", "sqlite:///./test.db")
    
    # Deepgram Settings
    DEEPGRAM_API_KEY: Optional[str] = os.getenv("DEEPGRAM_API_KEY")
    DEEPGRAM_MAX_RETRIES: int = int(os.getenv("DEEPGRAM_MAX_RETRIES", "3"))
    DEEPGRAM_TIMEOUT: int = int(os.getenv("DEEPGRAM_TIMEOUT", "30"))
    
    # Audio Settings
    AUDIO_CHUNK_SIZE: int = int(os.getenv("AUDIO_CHUNK_SIZE", "1024"))
    AUDIO_FORMAT: str = os.getenv("AUDIO_FORMAT", "paInt16")
    AUDIO_CHANNELS: int = int(os.getenv("AUDIO_CHANNELS", "1"))
    AUDIO_RATE: int = int(os.getenv("AUDIO_RATE", "16000"))
    SILENCE_THRESHOLD: int = int(os.getenv("SILENCE_THRESHOLD", "100"))
    SILENCE_CHUNKS: int = int(os.getenv("SILENCE_CHUNKS", "30"))
    MAX_RECORDING_SECONDS: int = int(os.getenv("MAX_RECORDING_SECONDS", "30"))
    
    # Speech Processing
    MIN_TRANSCRIPTION_CONFIDENCE: float = float(os.getenv("MIN_TRANSCRIPTION_CONFIDENCE", "0.7"))
    MAX_SPEECH_RETRIES: int = int(os.getenv("MAX_SPEECH_RETRIES", "3"))
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))  # seconds
    
    # Monitoring
    ENABLE_METRICS: bool = os.getenv("ENABLE_METRICS", "true").lower() == "true"
    METRICS_PORT: int = int(os.getenv("METRICS_PORT", "9090"))
    METRICS_RETENTION_DAYS: int = int(os.getenv("METRICS_RETENTION_DAYS", "30"))
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = os.getenv("LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    
    # Error Tracking
    SENTRY_DSN: Optional[str] = os.getenv("SENTRY_DSN")
    
    # Redis settings
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD")
    
    class Config:
        case_sensitive = True

# Create global settings instance
settings = Settings() 