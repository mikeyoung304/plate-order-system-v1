from app.config.settings import Settings
from typing import Optional

class TestSettings(Settings):
    """Test-specific settings that mock all external dependencies."""
    
    # API Settings
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite:///:memory:"
    TEST_DATABASE_URL: str = "sqlite:///:memory:"
    
    # Disable external services
    ENABLE_METRICS: bool = False
    SENTRY_DSN: str = ""
    
    # Mock Redis settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 1
    REDIS_PASSWORD: Optional[str] = None
    
    # Mock Deepgram settings
    DEEPGRAM_API_KEY: str = "test_key"
    DEEPGRAM_MAX_RETRIES: int = 1
    DEEPGRAM_TIMEOUT: int = 1
    
    # Audio settings for testing
    AUDIO_CHUNK_SIZE: int = 1024
    AUDIO_FORMAT: str = "paInt16"
    AUDIO_CHANNELS: int = 1
    AUDIO_RATE: int = 16000
    SILENCE_THRESHOLD: int = 100
    SILENCE_CHUNKS: int = 30
    MAX_RECORDING_SECONDS: int = 1
    
    # Speech Processing
    MIN_TRANSCRIPTION_CONFIDENCE: float = 0.7
    MAX_SPEECH_RETRIES: int = 1
    
    # Rate Limiting (disabled for most tests)
    RATE_LIMIT_PER_MINUTE: int = 1000
    RATE_LIMIT_REQUESTS: int = 1000
    RATE_LIMIT_WINDOW: int = 1
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Create test settings instance
test_settings = TestSettings() 