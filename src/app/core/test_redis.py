from typing import Optional, Any
import time
from collections import defaultdict

class MockRedis:
    """Mock Redis client for testing."""
    
    def __init__(self):
        self._data = defaultdict(dict)
        self._expirations = defaultdict(dict)
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from mock Redis."""
        if key in self._data:
            if key in self._expirations:
                if time.time() > self._expirations[key]:
                    del self._data[key]
                    del self._expirations[key]
                    return None
            return self._data[key]
        return None
    
    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        """Set value in mock Redis."""
        self._data[key] = value
        if ex is not None:
            self._expirations[key] = time.time() + ex
        return True
    
    async def incr(self, key: str) -> int:
        """Increment value in mock Redis."""
        current = await self.get(key)
        if current is None:
            await self.set(key, "1")
            return 1
        new_value = int(current) + 1
        await self.set(key, str(new_value))
        return new_value
    
    async def delete(self, key: str) -> int:
        """Delete key from mock Redis."""
        if key in self._data:
            del self._data[key]
            if key in self._expirations:
                del self._expirations[key]
            return 1
        return 0
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in mock Redis."""
        return key in self._data
    
    def clear(self):
        """Clear all data from mock Redis."""
        self._data.clear()
        self._expirations.clear()

# Create global mock Redis instance
mock_redis = MockRedis() 