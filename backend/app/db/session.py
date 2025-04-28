from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import os
from dotenv import load_dotenv

load_dotenv()

# Use the database URL from application settings (with default fallback)
DATABASE_URL = settings.DATABASE_URL

# Create SQLAlchemy engine with proper configuration
if DATABASE_URL.startswith("sqlite"):
    # Use SQLite without SSL
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
    )
else:
    # Use PostgreSQL with SSL (e.g., Supabase)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        connect_args={"sslmode": "require"},
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    """
    Dependency for FastAPI to get a database session.
    Ensures the session is closed after use.
    
    Yields:
        Session: SQLAlchemy database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
