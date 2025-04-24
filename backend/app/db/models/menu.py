from sqlalchemy import Column, Integer, String, Float, Boolean
from app.db.base_class import Base

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    category = Column(String, index=True, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False) 