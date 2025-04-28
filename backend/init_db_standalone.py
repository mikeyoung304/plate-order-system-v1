#!/usr/bin/env python3
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import models
from app.db._models import Base
from app.db.session import engine, SessionLocal

def init_db():
    """Initialize the database by creating all tables."""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("Database tables created successfully!")
        # Create a test session to verify connection
        session = SessionLocal()
        session.execute(text("SELECT 1"))
        session.close()
        
        
        print("Database connection verified successfully!")
        return True
    except Exception as e:
        print(f"Error initializing database: {e}")
        return False

if __name__ == "__main__":
    print("Using DATABASE_URL:", os.environ.get("DATABASE_URL", "Default connection string"))
    print("Initializing database...")
    if init_db():
        print("Database setup completed successfully!")
    else:
        print("Database setup failed!")
        sys.exit(1)