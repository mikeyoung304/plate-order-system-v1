import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from typing import Optional, List, Dict

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Import our models
from models import Base

# Configure database connection
db_url = os.getenv("DATABASE_URL", "sqlite:///./app.db")
print(f"Using database: {db_url}")

# Create engine and session
if db_url.startswith("sqlite"):
    engine = create_engine(db_url, pool_pre_ping=True)
else:
    engine = create_engine(db_url, pool_pre_ping=True, connect_args={"sslmode": "require"})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create FastAPI app
app = FastAPI(title="Plate Order System")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000", "http://localhost:8005"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up static files and templates
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

# Define Pydantic models for table operations
class TableCreate(BaseModel):
    name: str
    shape: str
    width: float
    height: float
    position_x: float
    position_y: float
    rotation: float
    seat_count: int
    status: str
    floor_plan_id: str
    zone: Optional[str] = None

class TableUpdate(BaseModel):
    name: Optional[str] = None
    shape: Optional[str] = None
    width: Optional[float] = None
    height: Optional[float] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    rotation: Optional[float] = None
    seat_count: Optional[int] = None
    status: Optional[str] = None
    zone: Optional[str] = None

class TableResponse(BaseModel):
    id: int
    name: str
    shape: str
    width: float
    height: float
    position_x: float
    position_y: float
    rotation: float
    seat_count: int
    status: str
    floor_plan_id: str
    zone: Optional[str] = None

class FloorPlanActivate(BaseModel):
    is_active: bool = True

# In-memory database for tables (to make the demo work until real database is set up)
# Structure: { floor_plan_id: { table_id: table_data, ... }, ... }
in_memory_tables: Dict[str, Dict[int, dict]] = {}
next_table_id = 1  # Simple auto-increment ID

# Track which floor plan is active
active_floor_plan_id = None

# Dependency for database sessions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Basic routes
@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "database": "connected"}

@app.get("/api/v1/floor-plans/{floor_plan_id}/tables", response_model=List[TableResponse])
def get_tables(floor_plan_id: str):
    # Return tables for this floor plan from our in-memory storage
    if floor_plan_id not in in_memory_tables:
        return []
    return list(in_memory_tables[floor_plan_id].values())

# New API routes for tables CRUD operations
@app.post("/api/v1/tables", response_model=TableResponse)
def create_table(table: TableCreate):
    global next_table_id
    
    # Create new table with unique ID
    table_id = next_table_id
    next_table_id += 1
    
    # Convert to dict to make it easier to work with
    table_data = table.dict()
    
    # Add the ID
    table_data["id"] = table_id
    
    # Initialize floor plan entry if it doesn't exist
    floor_plan_id = table_data["floor_plan_id"]
    if floor_plan_id not in in_memory_tables:
        in_memory_tables[floor_plan_id] = {}
    
    # Store the table
    in_memory_tables[floor_plan_id][table_id] = table_data
    
    # Log for debugging
    print(f"Created table {table_id} for floor plan {floor_plan_id}")
    
    return table_data

@app.put("/api/v1/tables/{table_id}", response_model=TableResponse)
def update_table(table_id: int, table_update: TableUpdate):
    # Find table in memory
    table_id = int(table_id)  # Ensure we have an integer
    for floor_plan_id, tables in in_memory_tables.items():
        if table_id in tables:
            # Update table data with the new values
            update_data = {k: v for k, v in table_update.dict().items() if v is not None}
            in_memory_tables[floor_plan_id][table_id].update(update_data)
            print(f"Updated table {table_id} in floor plan {floor_plan_id}")
            return in_memory_tables[floor_plan_id][table_id]
    
    # If we get here, the table wasn't found
    raise HTTPException(status_code=404, detail=f"Table with ID {table_id} not found")

@app.delete("/api/v1/tables/{table_id}")
def delete_table(table_id: int):
    # Find and delete table from memory
    table_id = int(table_id)  # Ensure we have an integer
    for floor_plan_id, tables in in_memory_tables.items():
        if table_id in tables:
            del in_memory_tables[floor_plan_id][table_id]
            print(f"Deleted table {table_id} from floor plan {floor_plan_id}")
            return {"status": "success", "message": f"Table {table_id} deleted"}
    
    # If we get here, the table wasn't found
    raise HTTPException(status_code=404, detail=f"Table with ID {table_id} not found")

# Additional route to list all floor plans (in-memory based)
@app.get("/api/v1/floor-plans")
def get_floor_plans():
    # Return a list of floor plan IDs that have tables
    floor_plans = []
    for floor_plan_id in in_memory_tables.keys():
        # Mark the plan as active if it matches active_floor_plan_id
        is_active = floor_plan_id == active_floor_plan_id
        floor_plans.append({
            "id": floor_plan_id,
            "name": f"Floor Plan {floor_plan_id}",
            "table_count": len(in_memory_tables[floor_plan_id]),
            "is_active": is_active
        })
    
    # If we have no floor plans but there's an active ID, create an empty entry
    if not floor_plans and active_floor_plan_id:
        floor_plans.append({
            "id": active_floor_plan_id,
            "name": f"Floor Plan {active_floor_plan_id}",
            "table_count": 0,
            "is_active": True
        })
    
    return floor_plans

# Endpoint to activate a floor plan
@app.post("/api/v1/floor-plans/{floor_plan_id}/activate")
def activate_floor_plan(floor_plan_id: str, activation: FloorPlanActivate):
    global active_floor_plan_id
    
    # Set this floor plan as active
    if activation.is_active:
        active_floor_plan_id = floor_plan_id
        print(f"Activated floor plan: {floor_plan_id}")
    else:
        # Only clear if this is currently active
        if active_floor_plan_id == floor_plan_id:
            active_floor_plan_id = None
            print(f"Deactivated floor plan: {floor_plan_id}")
    
    # Ensure this floor plan exists in our memory store
    if floor_plan_id not in in_memory_tables:
        in_memory_tables[floor_plan_id] = {}
    
    return {"status": "success", "is_active": activation.is_active}

# Server view page
@app.get("/server", response_class=HTMLResponse)
def server_view(request):
    """Render the server view page"""
    return templates.TemplateResponse("pages/server-view.html", {"request": request})

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8005))
    uvicorn.run("main_fixed:app", host="0.0.0.0", port=port, reload=True) 