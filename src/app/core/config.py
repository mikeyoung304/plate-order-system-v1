from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Plate Order System"

    # Database Settings
    DATABASE_URL: str = "sqlite:///./app/restaurant.db"

    # Security Settings
    SECRET_KEY: str = "your-secret-key-here"  # Change in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "password"

    # Feature Flags
    ENABLE_WEBSOCKET: bool = True
    ENABLE_VOICE_RECOGNITION: bool = True
    ENABLE_NOTIFICATIONS: bool = True
    ENABLE_METRICS: bool = True

    # External Services
    DEEPGRAM_API_KEY: Optional[str] = None
    ELASTICSEARCH_URL: Optional[str] = None
    ELASTICSEARCH_USERNAME: Optional[str] = None
    ELASTICSEARCH_PASSWORD: Optional[str] = None
    SENTRY_DSN: Optional[str] = None

    # Redis Settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Audio Settings
    AUDIO_CHUNK_SIZE: int = 1024
    AUDIO_FORMAT: str = "paInt16"
    AUDIO_CHANNELS: int = 1
    AUDIO_RATE: int = 16000
    SILENCE_THRESHOLD: int = 100
    SILENCE_CHUNKS: int = 30
    MAX_RECORDING_SECONDS: int = 30

    # Speech Processing
    MIN_TRANSCRIPTION_CONFIDENCE: float = 0.7
    MAX_SPEECH_RETRIES: int = 3

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # Metrics
    METRICS_PORT: int = 9090

    class Config:
        case_sensitive = True
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
