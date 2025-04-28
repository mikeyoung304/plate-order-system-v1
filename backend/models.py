from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, JSON, Boolean, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

# Create Base class for models
Base = declarative_base()

class TableShape(str, enum.Enum):
    SQUARE = "square"
    RECTANGLE = "rectangle"
    CIRCLE = "circle"

class TableStatus(str, enum.Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    OUT_OF_SERVICE = "out_of_service"

class SeatStatus(str, enum.Enum):
    EMPTY = "empty"
    OCCUPIED_WITH_ORDER = "occupied_with_order"
    OCCUPIED_WITHOUT_ORDER = "occupied_without_order"

class OrderType(str, enum.Enum):
    FOOD = "food"
    DRINK = "drink"

class OrderStatus(str, enum.Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class FloorPlan(Base):
    """Floor plan configuration model"""
    __tablename__ = "floor_plans"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    data = Column(JSON, nullable=False)  # Stores the entire canvas JSON
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=False)

    tables = relationship("Table", back_populates="floor_plan", cascade="all, delete-orphan")

class Table(Base):
    """Table model for floor plan"""
    __tablename__ = "tables"

    id = Column(String, primary_key=True, index=True)
    floor_plan_id = Column(String, ForeignKey("floor_plans.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    shape = Column(Enum(TableShape), nullable=False)
    width = Column(Float, nullable=False)
    height = Column(Float, nullable=False)
    position_x = Column(Float, nullable=False)
    position_y = Column(Float, nullable=False)
    rotation = Column(Float, default=0)
    seat_count = Column(Integer, default=4)
    zone = Column(String, nullable=True)
    status = Column(Enum(TableStatus), default=TableStatus.AVAILABLE)

    floor_plan = relationship("FloorPlan", back_populates="tables")
    seats = relationship("Seat", back_populates="table", cascade="all, delete-orphan")

class Seat(Base):
    """Seat model for tables"""
    __tablename__ = "seats"

    id = Column(String, primary_key=True, index=True)
    table_id = Column(String, ForeignKey("tables.id", ondelete="CASCADE"), nullable=False)
    number = Column(Integer, nullable=False)
    position_x = Column(Float, nullable=False)
    position_y = Column(Float, nullable=False)
    status = Column(Enum(SeatStatus), default=SeatStatus.EMPTY)
    resident_id = Column(String, ForeignKey("residents.id"), nullable=True)

    table = relationship("Table", back_populates="seats")
    resident = relationship("Resident", back_populates="seats")
    orders = relationship("Order", back_populates="seat", cascade="all, delete-orphan")

class Resident(Base):
    """Resident model for assisted living facility"""
    __tablename__ = "residents"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    dietary_restrictions = Column(JSON, default=list)  # List of dietary restrictions
    preferences = Column(JSON, default=list)  # List of preferences
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    seats = relationship("Seat", back_populates="resident")
    orders = relationship("Order", back_populates="resident")

class Order(Base):
    """Order model for food and drink orders"""
    __tablename__ = "orders"

    id = Column(String, primary_key=True, index=True)
    table_id = Column(String, ForeignKey("tables.id"), nullable=False)
    seat_id = Column(String, ForeignKey("seats.id"), nullable=False)
    resident_id = Column(String, ForeignKey("residents.id"), nullable=True)
    type = Column(Enum(OrderType), nullable=False)
    content = Column(String, nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.NEW)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    table = relationship("Table")
    seat = relationship("Seat", back_populates="orders")
    resident = relationship("Resident", back_populates="orders") 