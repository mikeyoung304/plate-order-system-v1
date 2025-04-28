from typing import List, Optional
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

# Floor Plan Schemas (Uses String ID)
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
    id: str # Keep as str, matches model
    data: dict
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True # Use from_attributes in Pydantic v2

class FloorPlan(FloorPlanInDB):
    pass

# Table Schemas (Uses Integer ID)
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
    floor_plan_id: str # Foreign key remains str

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

class TableBulk(BaseModel):
    """
    Bulk table payload for creating/updating tables within a floor plan.
    If 'id' is provided, the table will be updated; otherwise, created.
    """
    id: Optional[str] = None
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

    class Config:
        orm_mode = True

class TableInDB(TableBase):
    id: str  # Table ID as string (UUID)
    floor_plan_id: str  # Foreign key to floor_plans, string (UUID)

    class Config:
        orm_mode = True # Use from_attributes in Pydantic v2

class Table(TableInDB):
    pass

# Seat Schemas (Uses Integer ID)
class SeatBase(BaseModel):
    number: int
    position_x: float
    position_y: float
    status: SeatStatusEnum = SeatStatusEnum.EMPTY
    resident_id: Optional[str] = None # Foreign key remains str

class SeatCreate(SeatBase):
    table_id: str  # Foreign key to tables, string (UUID)

class SeatUpdate(BaseModel):
    number: Optional[int] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    status: Optional[SeatStatusEnum] = None
    resident_id: Optional[str] = None # Foreign key remains str

class SeatInDB(SeatBase):
    id: str  # Seat ID as string (UUID)
    table_id: str  # Foreign key to tables, string (UUID)

    class Config:
        orm_mode = True # Use from_attributes in Pydantic v2

class Seat(SeatInDB):
    pass

# Resident Schemas (Uses String ID)
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
    id: str # Keep as str, matches model
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True # Use from_attributes in Pydantic v2

class Resident(ResidentInDB):
    pass

# Order Schemas (Uses Integer ID)
class OrderBase(BaseModel):
    type: OrderTypeEnum
    content: str
    status: OrderStatusEnum = OrderStatusEnum.NEW

class OrderCreate(OrderBase):
    table_id: int # Corrected foreign key to int
    seat_id: int # Corrected foreign key to int
    resident_id: Optional[str] = None # Foreign key remains str

class OrderUpdate(BaseModel):
    content: Optional[str] = None
    status: Optional[OrderStatusEnum] = None
    completed_at: Optional[datetime] = None

class OrderInDB(OrderBase):
    id: int # Corrected to int
    table_id: int # Corrected foreign key to int
    seat_id: int # Corrected foreign key to int
    resident_id: Optional[str] = None # Foreign key remains str
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        orm_mode = True # Use from_attributes in Pydantic v2

class Order(OrderInDB):
    pass

# Menu Item Schemas (Uses Integer ID)
class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: str
    is_available: bool = True

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    is_available: Optional[bool] = None

class MenuItem(MenuItemBase):
    id: int # Keep as int, matches model

    class Config:
        orm_mode = True # Use from_attributes in Pydantic v2
