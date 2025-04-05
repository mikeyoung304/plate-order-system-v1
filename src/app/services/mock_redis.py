from typing import Optional, Dict, Any
import time


class MockRedis:
    """Mock Redis client for testing."""

    def __init__(self):
        self._data: Dict[str, Any] = {}
        self._expiry: Dict[str, float] = {}

    async def get(self, key: str) -> Optional[bytes]:
        """Get a value from the mock Redis."""
        self._check_expiry(key)
        value = self._data.get(key)
        return value.encode() if value is not None else None

    async def set(
        self, key: str, value: Any, ex: Optional[int] = None, px: Optional[int] = None
    ) -> bool:
        """Set a value in the mock Redis."""
        self._data[key] = str(value)
        if ex is not None:
            self._expiry[key] = time.time() + ex
        elif px is not None:
            self._expiry[key] = time.time() + (px / 1000)
        return True

    async def incr(self, key: str) -> int:
        """Increment a value in the mock Redis."""
        self._check_expiry(key)
        if key not in self._data:
            self._data[key] = "0"
        value = int(self._data[key]) + 1
        self._data[key] = str(value)
        return value

    async def delete(self, key: str) -> int:
        """Delete a value from the mock Redis."""
        if key in self._data:
            del self._data[key]
            if key in self._expiry:
                del self._expiry[key]
            return 1
        return 0

    async def expire(self, key: str, seconds: int) -> bool:
        """Set a key's time to live in seconds."""
        self._expiry[key] = time.time() + seconds
        return True

    def _check_expiry(self, key: str) -> None:
        """Check if a key has expired."""
        if key in self._expiry:
            if time.time() > self._expiry[key]:
                del self._data[key]
                del self._expiry[key]
