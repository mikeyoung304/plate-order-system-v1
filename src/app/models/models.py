from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from typing import List, Optional
from datetime import datetime
import sqlalchemy as sa

from app.db.database import Base

class OrderStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class MealPeriod(str, Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"

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
    
    # New fields for resident preferences
    preferred_table_id = Column(Integer, ForeignKey("tables.id"), nullable=True)
    preferred_seat_number = Column(Integer, nullable=True)

    # Relationships
    orders = relationship("Order", back_populates="resident")
    preferred_table = relationship("Table", foreign_keys=[preferred_table_id])

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=True)  # Can be null if order is for a resident directly
    seat_number = Column(Integer, nullable=True)   # Seat number (1, 2, etc.)
    resident_id = Column(Integer, ForeignKey("residents.id"), nullable=True)
    details = Column(Text, nullable=True)  # Processed order text
    raw_transcription = Column(Text, nullable=True)  # Original transcription
    flagged = Column(String(255), nullable=True)  # Reason if flagged
    status = Column(String(20), default=OrderStatus.PENDING)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime, nullable=True)
    
    # New fields for meal periods and favorites
    meal_period = Column(String(20), nullable=True)  # breakfast, lunch, dinner
    contains_daily_special = Column(Boolean, default=False)
    is_favorite = Column(Boolean, default=False)  # Mark as favorite for quick select

    # Relationships
    resident = relationship("Resident", back_populates="orders")
    table = relationship("Table", back_populates="orders")

class Table(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, nullable=False, unique=True)
    type = Column(String(20), nullable=False)  # standard, booth, high-top, outdoor
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    status = Column(String(20), default="available")  # available, occupied, reserved
    seats = Column(Integer, nullable=False)
    shape = Column(String(20), nullable=False)  # square, rectangle, circle
    width = Column(Float, nullable=False)
    height = Column(Float, nullable=False)
    current_orders = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    orders = relationship("Order", back_populates="table")
    resident_preferences = relationship("Resident", foreign_keys=[Resident.preferred_table_id])

class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    notifications_enabled = Column(Boolean, default=True)
    sound_enabled = Column(Boolean, default=True)
    voice_recognition_enabled = Column(Boolean, default=True)
    analytics_enabled = Column(Boolean, default=True)
    api_key = Column(String, nullable=True)
    deepgram_api_key = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DailySpecial(Base):
    """Model for storing daily specials for each meal period"""
    __tablename__ = "daily_specials"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=func.now(), nullable=False)
    meal_period = Column(String(20), nullable=False)  # breakfast, lunch, dinner
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Add a unique constraint for date and meal period
    __table_args__ = (
        sa.UniqueConstraint('date', 'meal_period', name='unique_daily_special'),
    )
