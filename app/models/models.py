from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from typing import List, Optional
from datetime import datetime

from app.db.database import Base

class OrderStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Resident(Base):
    __tablename__ = "residents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    photo_url = Column(String(255), nullable=True)
    medical_dietary = Column(JSON, nullable=True)  # List of dietary restrictions
    texture_prefs = Column(JSON, nullable=True)    # List of texture preferences
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    orders = relationship("Order", back_populates="resident")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, nullable=True)  # Can be null if order is for a resident directly
    seat = Column(String(10), nullable=True)   # Seat identifier (S1, S2, etc.)
    resident_id = Column(Integer, ForeignKey("residents.id"), nullable=True)
    details = Column(Text, nullable=False)  # Processed order text
    raw_transcription = Column(Text, nullable=True)  # Original transcription
    flagged = Column(String(255), nullable=True)  # Reason if flagged
    status = Column(String(20), default=OrderStatus.PENDING)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    resident = relationship("Resident", back_populates="orders")

class Table(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, nullable=False, unique=True)
    type = Column(String(20), nullable=False)  # round-2, round-4, square-2, etc.
    x = Column(Integer, nullable=False)
    y = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
