/**
 * Performance optimization for Plate Order System
 * Implements best practices for web application performance
 */

import logging
import time
from functools import wraps
from typing import Callable, Dict, List, Any, Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

# Set up logging
logger = logging.getLogger(__name__)

# Performance monitoring
class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """
    Middleware to monitor request performance
    """
    def __init__(
        self, 
        app: ASGIApp, 
        slow_request_threshold: float = 0.5
    ):
        super().__init__(app)
        self.slow_request_threshold = slow_request_threshold
        self.request_counts: Dict[str, int] = {}
        self.request_times: Dict[str, List[float]] = {}
        
    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        # Record start time
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate request time
        request_time = time.time() - start_time
        
        # Get route path
        route_path = request.url.path
        
        # Update request counts
        if route_path not in self.request_counts:
            self.request_counts[route_path] = 0
            self.request_times[route_path] = []
        
        self.request_counts[route_path] += 1
        self.request_times[route_path].append(request_time)
        
        # Log slow requests
        if request_time > self.slow_request_threshold:
            logger.warning(
                f"Slow request: {request.method} {route_path} took {request_time:.4f}s"
            )
        
        # Add timing header
        response.headers["X-Process-Time"] = str(request_time)
        
        return response
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get performance statistics
        
        Returns:
            Dictionary with performance statistics
        """
        stats = {}
        
        for route_path, count in self.request_counts.items():
            times = self.request_times[route_path]
            avg_time = sum(times) / len(times) if times else 0
            max_time = max(times) if times else 0
            
            stats[route_path] = {
                "count": count,
                "avg_time": avg_time,
                "max_time": max_time
            }
            
        return stats

# Cache decorator
def cache(ttl: int = 300):
    """
    Simple in-memory cache decorator
    
    Args:
        ttl: Time to live in seconds
        
    Returns:
        Decorated function
    """
    cache_data = {}
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Check if result is in cache and not expired
            if key in cache_data:
                result, timestamp = cache_data[key]
                if time.time() - timestamp < ttl:
                    return result
            
            # Call function and cache result
            result = await func(*args, **kwargs)
            cache_data[key] = (result, time.time())
            
            return result
        
        # Add clear cache method
        def clear_cache():
            cache_data.clear()
            
        wrapper.clear_cache = clear_cache
        
        return wrapper
    
    return decorator

# Database optimization
class QueryOptimizer:
    """
    Utility for optimizing database queries
    """
    @staticmethod
    def optimize_query(query, limit: Optional[int] = None):
        """
        Optimize a SQLAlchemy query
        
        Args:
            query: SQLAlchemy query
            limit: Optional result limit
            
        Returns:
            Optimized query
        """
        # Add limit if specified
        if limit is not None:
            query = query.limit(limit)
            
        return query
    
    @staticmethod
    def paginate_query(query, page: int = 1, page_size: int = 20):
        """
        Paginate a SQLAlchemy query
        
        Args:
            query: SQLAlchemy query
            page: Page number (1-based)
            page_size: Page size
            
        Returns:
            Paginated query
        """
        # Ensure page is at least 1
        page = max(1, page)
        
        # Calculate offset
        offset = (page - 1) * page_size
        
        # Apply pagination
        return query.offset(offset).limit(page_size)

# Asset optimization
class AssetOptimizer:
    """
    Utility for optimizing static assets
    """
    @staticmethod
    def get_asset_url(path: str, with_version: bool = True) -> str:
        """
        Get URL for a static asset with optional version parameter
        
        Args:
            path: Asset path
            with_version: Whether to add version parameter
            
        Returns:
            Asset URL
        """
        from app.core.config import settings
        
        # Base URL
        url = f"/static/{path}"
        
        # Add version parameter
        if with_version:
            url = f"{url}?v={settings.VERSION.replace('.', '')}"
            
        return url
    
    @staticmethod
    def get_preload_headers(assets: List[str]) -> str:
        """
        Get Link headers for preloading assets
        
        Args:
            assets: List of asset paths
            
        Returns:
            Link header value
        """
        links = []
        
        for asset in assets:
            # Determine asset type
            asset_type = "style"
            if asset.endswith(".js"):
                asset_type = "script"
            elif asset.endswith(".woff2"):
                asset_type = "font"
                
            # Add link
            links.append(f"</static/{asset}>; rel=preload; as={asset_type}")
            
        return ", ".join(links)

# WebSocket optimization
class WebSocketOptimizer:
    """
    Utility for optimizing WebSocket connections
    """
    @staticmethod
    def compress_message(message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compress a WebSocket message
        
        Args:
            message: Message to compress
            
        Returns:
            Compressed message
        """
        # Simple compression by using shorter keys
        key_map = {
            "type": "t",
            "data": "d",
            "status": "s",
            "message": "m",
            "error": "e",
            "timestamp": "ts",
            "success": "ok"
        }
        
        compressed = {}
        
        for key, value in message.items():
            new_key = key_map.get(key, key)
            
            # Recursively compress nested dictionaries
            if isinstance(value, dict):
                value = WebSocketOptimizer.compress_message(value)
                
            compressed[new_key] = value
            
        return compressed
    
    @staticmethod
    def decompress_message(message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Decompress a WebSocket message
        
        Args:
            message: Compressed message
            
        Returns:
            Decompressed message
        """
        # Reverse key mapping
        key_map = {
            "t": "type",
            "d": "data",
            "s": "status",
            "m": "message",
            "e": "error",
            "ts": "timestamp",
            "ok": "success"
        }
        
        decompressed = {}
        
        for key, value in message.items():
            new_key = key_map.get(key, key)
            
            # Recursively decompress nested dictionaries
            if isinstance(value, dict):
                value = WebSocketOptimizer.decompress_message(value)
                
            decompressed[new_key] = value
            
        return decompressed

# Create performance monitoring instance
performance_monitor = PerformanceMonitoringMiddleware(None)
