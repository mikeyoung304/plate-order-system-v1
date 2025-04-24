from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(request: LoginRequest):
    # Placeholder for authentication logic
    return {"message": "Login endpoint", "email": request.email}

@router.post("/register")
async def register(request: LoginRequest):
    # Placeholder for registration logic
    return {"message": "Register endpoint", "email": request.email} 