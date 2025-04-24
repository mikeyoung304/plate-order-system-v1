/**
 * Security enhancements for Plate Order System
 * Implements best practices for web application security
 */

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Union

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from app.core.config import settings
from app.db.session import get_db
from sqlalchemy.orm import Session
from app.db.models import Staff

# Set up logging
logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 token URL
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")

# Token models
class Token(BaseModel):
    access_token: str
    token_type: str
    
class TokenData(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[datetime] = None

# User models
class UserBase(BaseModel):
    email: str
    
class UserCreate(UserBase):
    password: str
    first_name: str
    last_name: str
    role: str
    
class User(UserBase):
    id: int
    first_name: str
    last_name: str
    role: str
    is_active: bool
    
    class Config:
        orm_mode = True

# Security functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password
        
    Returns:
        True if password matches hash, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash a password
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    return pwd_context.hash(password)

def authenticate_user(db: Session, email: str, password: str) -> Optional[Staff]:
    """
    Authenticate a user
    
    Args:
        db: Database session
        email: User email
        password: User password
        
    Returns:
        User object if authentication successful, None otherwise
    """
    user = db.query(Staff).filter(Staff.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Token data
        expires_delta: Token expiration time
        
    Returns:
        JWT token string
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Staff:
    """
    Get the current user from a JWT token
    
    Args:
        token: JWT token
        db: Database session
        
    Returns:
        User object
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(sub=user_id, role=payload.get("role"))
    except JWTError:
        raise credentials_exception
    user = db.query(Staff).filter(Staff.id == int(token_data.sub)).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: Staff = Depends(get_current_user)) -> Staff:
    """
    Get the current active user
    
    Args:
        current_user: Current user
        
    Returns:
        User object
        
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def check_role(required_roles: list):
    """
    Dependency for checking user roles
    
    Args:
        required_roles: List of required roles
        
    Returns:
        Dependency function
    """
    async def check_user_role(current_user: Staff = Depends(get_current_active_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return check_user_role

# Rate limiting
class RateLimiter:
    """
    Simple in-memory rate limiter
    """
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests = {}
        
    async def check(self, request: Request) -> bool:
        """
        Check if request is within rate limits
        
        Args:
            request: FastAPI request object
            
        Returns:
            True if request is allowed, False otherwise
        """
        client_ip = request.client.host
        current_time = datetime.utcnow()
        
        # Clean up old requests
        self._cleanup(current_time)
        
        # Check if client has requests
        if client_ip not in self.requests:
            self.requests[client_ip] = []
            
        # Check rate limit
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            return False
            
        # Add request
        self.requests[client_ip].append(current_time)
        return True
        
    def _cleanup(self, current_time: datetime) -> None:
        """
        Clean up old requests
        
        Args:
            current_time: Current time
        """
        one_minute_ago = current_time - timedelta(minutes=1)
        
        for ip, times in list(self.requests.items()):
            # Keep only requests from the last minute
            self.requests[ip] = [t for t in times if t > one_minute_ago]
            
            # Remove empty entries
            if not self.requests[ip]:
                del self.requests[ip]

# Create rate limiter instance
rate_limiter = RateLimiter()

# Security headers middleware
async def security_headers_middleware(request: Request, call_next):
    """
    Middleware to add security headers to responses
    
    Args:
        request: FastAPI request object
        call_next: Next middleware or route handler
        
    Returns:
        Response with security headers
    """
    response = await call_next(request)
    
    # Add security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(self), geolocation=()"
    
    return response

# CSRF protection
class CSRFProtection:
    """
    CSRF protection middleware
    """
    def __init__(self):
        self.tokens = {}
        
    def generate_token(self, session_id: str) -> str:
        """
        Generate a CSRF token for a session
        
        Args:
            session_id: Session ID
            
        Returns:
            CSRF token
        """
        token = secrets.token_hex(32)
        self.tokens[session_id] = token
        return token
        
    def validate_token(self, session_id: str, token: str) -> bool:
        """
        Validate a CSRF token
        
        Args:
            session_id: Session ID
            token: CSRF token
            
        Returns:
            True if token is valid, False otherwise
        """
        if session_id not in self.tokens:
            return False
            
        stored_token = self.tokens[session_id]
        return token == stored_token

# Create CSRF protection instance
csrf_protection = CSRFProtection()
