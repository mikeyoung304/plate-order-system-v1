"""
Custom exceptions for the application.
"""


class BaseAppException(Exception):
    """Base exception for all application exceptions."""

    def __init__(self, message: str = None):
        self.message = message
        super().__init__(self.message)


class AudioProcessingError(BaseAppException):
    """Raised when there is an error processing audio data."""

    def __init__(self, message: str = "Error processing audio data"):
        super().__init__(message)


class TranscriptionError(BaseAppException):
    """Raised when there is an error during transcription."""

    def __init__(self, message: str = "Error transcribing audio"):
        super().__init__(message)


class ValidationError(BaseAppException):
    """Raised when validation fails."""

    def __init__(self, message: str = "Validation error"):
        super().__init__(message)


class DatabaseError(BaseAppException):
    """Raised when a database operation fails."""

    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message)


class AuthenticationError(BaseAppException):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message)


class AuthorizationError(BaseAppException):
    """Raised when authorization fails."""

    def __init__(self, message: str = "Authorization failed"):
        super().__init__(message)


class ConfigurationError(BaseAppException):
    """Raised when there is an error in the configuration."""

    def __init__(self, message: str = "Configuration error"):
        super().__init__(message)


class ExternalServiceError(BaseAppException):
    """Raised when an external service call fails."""

    def __init__(self, message: str = "External service error"):
        super().__init__(message)
