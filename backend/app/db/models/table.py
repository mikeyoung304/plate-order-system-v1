from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Table(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    status = Column(String, default="available")  # available, occupied, reserved
    capacity = Column(Integer, default=4)
    
    # Relationships
    seats = relationship("Seat", back_populates="table")
    orders = relationship("Order", back_populates="table") 