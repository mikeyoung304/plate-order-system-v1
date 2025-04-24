from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer)
    status = Column(String, default="available")  # available, occupied
    table_id = Column(Integer, ForeignKey("tables.id"))
    
    # Relationships
    table = relationship("Table", back_populates="seats")
    orders = relationship("Order", back_populates="seat") 