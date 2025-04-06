from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class TableShapeEnum(str, Enum):
    SQUARE = "square"
    RECTANGLE = "rectangle"
    CIRCLE = "circle"

class TableStatusEnum(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    OUT_OF_SERVICE = "out_of_service"

class SeatStatusEnum(str, Enum):
    EMPTY = "empty"
    OCCUPIED_WITH_ORDER = "occupied_with_order"
    OCCUPIED_WITHOUT_ORDER = "occupied_without_order"

class OrderTypeEnum(str, Enum):
    FOOD = "food"
    DRINK = "drink"

class OrderStatusEnum(str, Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

# Floor Plan Schemas
class FloorPlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = False

class FloorPlanCreate(FloorPlanBase):
    data: dict

class FloorPlanUpdate(FloorPlanBase):
    name: Optional[str] = None
    data: Optional[dict] = None

class FloorPlanInDB(FloorPlanBase):
    id: str
    data: dict
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class FloorPlan(FloorPlanInDB):
    pass

# Table Schemas
class TableBase(BaseModel):
    name: str
    shape: TableShapeEnum
    width: float
    height: float
    position_x: float
    position_y: float
    rotation: float = 0
    seat_count: int = 4
    zone: Optional[str] = None
    status: TableStatusEnum = TableStatusEnum.AVAILABLE

class TableCreate(TableBase):
    floor_plan_id: str

class TableUpdate(BaseModel):
    name: Optional[str] = None
    shape: Optional[TableShapeEnum] = None
    width: Optional[float] = None
    height: Optional[float] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    rotation: Optional[float] = None
    seat_count: Optional[int] = None
    zone: Optional[str] = None
    status: Optional[TableStatusEnum] = None

class TableInDB(TableBase):
    id: str
    floor_plan_id: str

    class Config:
        orm_mode = True

class Table(TableInDB):
    pass

# Seat Schemas
class SeatBase(BaseModel):
    number: int
    position_x: float
    position_y: float
    status: SeatStatusEnum = SeatStatusEnum.EMPTY
    resident_id: Optional[str] = None

class SeatCreate(SeatBase):
    table_id: str

class SeatUpdate(BaseModel):
    number: Optional[int] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    status: Optional[SeatStatusEnum] = None
    resident_id: Optional[str] = None

class SeatInDB(SeatBase):
    id: str
    table_id: str

    class Config:
        orm_mode = True

class Seat(SeatInDB):
    pass

# Resident Schemas
class ResidentBase(BaseModel):
    name: str
    dietary_restrictions: List[str] = Field(default_factory=list)
    preferences: List[str] = Field(default_factory=list)

class ResidentCreate(ResidentBase):
    pass

class ResidentUpdate(BaseModel):
    name: Optional[str] = None
    dietary_restrictions: Optional[List[str]] = None
    preferences: Optional[List[str]] = None

class ResidentInDB(ResidentBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class Resident(ResidentInDB):
    pass

# Order Schemas
class OrderBase(BaseModel):
    type: OrderTypeEnum
    content: str
    status: OrderStatusEnum = OrderStatusEnum.NEW

class OrderCreate(OrderBase):
    table_id: str
    seat_id: str
    resident_id: Optional[str] = None

class OrderUpdate(BaseModel):
    content: Optional[str] = None
    status: Optional[OrderStatusEnum] = None
    completed_at: Optional[datetime] = None

class OrderInDB(OrderBase):
    id: str
    table_id: str
    seat_id: str
    resident_id: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class Order(OrderInDB):
    pass
