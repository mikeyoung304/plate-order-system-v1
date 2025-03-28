from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Union, Dict, Any

# Resident schemas
class ResidentBase(BaseModel):
    name: str
    photo_url: Optional[str] = None
    medical_dietary: Optional[List[str]] = None
    texture_prefs: Optional[List[str]] = None
    notes: Optional[str] = None

class ResidentCreate(ResidentBase):
    pass

class ResidentUpdate(ResidentBase):
    name: Optional[str] = None

class ResidentInDB(ResidentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class Resident(ResidentInDB):
    pass

# Order schemas
class OrderBase(BaseModel):
    table_id: Optional[int] = None
    seat: Optional[str] = None
    resident_id: Optional[int] = None
    details: str
    raw_transcription: Optional[str] = None
    flagged: Optional[str] = None
    status: Optional[str] = "pending"

class OrderCreate(OrderBase):
    pass
class OrderUpdate(BaseModel):
    table_id: Optional[int] = None
    seat: Optional[str] = None
    resident_id: Optional[int] = None
    details: Optional[str] = None
    raw_transcription: Optional[str] = None
    flagged: Optional[str] = None
    status: Optional[str] = None

class OrderInDB(OrderBase):
    id: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class Order(OrderInDB):
    pass

# Table schemas
class TableBase(BaseModel):
    number: int
    type: str
    x: int
    y: int

class TableCreate(TableBase):
    pass

class TableUpdate(TableBase):
    number: Optional[int] = None
    type: Optional[str] = None
    x: Optional[int] = None
    y: Optional[int] = None

class TableInDB(TableBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class Table(TableInDB):
    pass

# Voice processing schemas
class VoiceProcessRequest(BaseModel):
    audio_data: str  # Base64 encoded audio
    table_id: Optional[int] = None
    resident_id: Optional[int] = None

class VoiceProcessResponse(BaseModel):
    order_id: int
    transcription: str
    processed_order: str

# Order stats schemas
class OrderStats(BaseModel):
    active_count: int
    pending_count: int
    in_progress_count: int
    ready_count: int
    completed_today: int
    avg_prep_time: float
