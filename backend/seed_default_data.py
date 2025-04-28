#!/usr/bin/env python3
import sys
import os
import uuid
from sqlalchemy.orm import Session
from datetime import datetime

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db._models import Base, FloorPlan, Table, TableShape, TableStatus
from app.db.session import engine, SessionLocal

def create_default_floor_plan(db: Session):
    """Create a default floor plan if none exists."""
    # Check if any floor plans exist
    existing_plans = db.query(FloorPlan).all()
    if existing_plans:
        print(f"Found {len(existing_plans)} existing floor plans. Skipping default creation.")
        return existing_plans[0]

    # Create a default floor plan
    default_id = "default"
    default_plan = FloorPlan(
        id=default_id,
        name="Main Dining Room",
        description="Default dining area layout",
        data={},
        is_active=True
    )
    
    db.add(default_plan)
    db.commit()
    db.refresh(default_plan)
    print(f"Created default floor plan: {default_plan.name}")
    return default_plan

def create_sample_tables(db: Session, floor_plan: FloorPlan):
    """Create sample tables for the given floor plan."""
    # Check if floor plan already has tables
    existing_tables = db.query(Table).filter(Table.floor_plan_id == floor_plan.id).all()
    if existing_tables:
        print(f"Found {len(existing_tables)} existing tables for floor plan {floor_plan.id}. Skipping table creation.")
        return

    # Create sample tables
    tables = [
        Table(
            id=f"table-{uuid.uuid4()}",
            floor_plan_id=floor_plan.id,
            name="Table 1",
            shape=TableShape.CIRCLE,
            width=100,
            height=100,
            position_x=100,
            position_y=100,
            rotation=0,
            seat_count=4,
            zone="Main",
            status=TableStatus.AVAILABLE
        ),
        Table(
            id=f"table-{uuid.uuid4()}",
            floor_plan_id=floor_plan.id,
            name="Table 2",
            shape=TableShape.RECTANGLE,
            width=160,
            height=80,
            position_x=300,
            position_y=150,
            rotation=0,
            seat_count=6,
            zone="Main",
            status=TableStatus.AVAILABLE
        ),
        Table(
            id=f"table-{uuid.uuid4()}",
            floor_plan_id=floor_plan.id,
            name="Table 3",
            shape=TableShape.SQUARE,
            width=120,
            height=120,
            position_x=200,
            position_y=300,
            rotation=45,
            seat_count=4,
            zone="Window",
            status=TableStatus.AVAILABLE
        ),
        Table(
            id=f"table-{uuid.uuid4()}",
            floor_plan_id=floor_plan.id,
            name="Bar 1",
            shape=TableShape.RECTANGLE,
            width=200,
            height=60,
            position_x=500,
            position_y=100,
            rotation=0,
            seat_count=8,
            zone="Bar",
            status=TableStatus.AVAILABLE
        ),
    ]
    
    for table in tables:
        db.add(table)
    
    db.commit()
    print(f"Created {len(tables)} sample tables for floor plan {floor_plan.id}")

def main():
    print("Seeding default data...")
    try:
        # Create all tables if they don't exist
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("Database tables created.")
        
        # Get a database session
        db = SessionLocal()
        
        # Create default floor plan
        floor_plan = create_default_floor_plan(db)
        
        # Create sample tables
        create_sample_tables(db, floor_plan)
        
        db.close()
        print("Default data seeding completed successfully!")
        return True
    except Exception as e:
        print(f"Error seeding default data: {e}")
        return False

if __name__ == "__main__":
    if main():
        sys.exit(0)
    else:
        sys.exit(1)