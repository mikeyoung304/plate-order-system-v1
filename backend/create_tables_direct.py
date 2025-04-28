#!/usr/bin/env python3
"""
Direct utility script to initialize the database schema for development.
This creates all tables defined in SQLAlchemy models without using Alembic migrations
or the settings module, to avoid configuration issues.
"""
import os
import sys

# Ensure the project root is on PYTHONPATH
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), 'app'))
sys.path.insert(0, project_root)

# Load .env file manually
from dotenv import load_dotenv
load_dotenv()

# Get the database URL
database_url = os.getenv('DATABASE_URL')
if not database_url:
    print("WARNING: DATABASE_URL not found in environment. Using default SQLite path.")
    database_url = 'sqlite:///./app.db'

print(f"Using DATABASE_URL={database_url}")

# Create the SQLAlchemy engine
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base

# Create Base class for models
Base = declarative_base()

# Configure engine based on database type
if database_url.startswith("sqlite"):
    # Use SQLite without SSL
    engine = create_engine(
        database_url,
        pool_pre_ping=True,
    )
else:
    # Use PostgreSQL with SSL (e.g., Supabase)
    engine = create_engine(
        database_url,
        pool_pre_ping=True,
        connect_args={"sslmode": "require"},
    )

# Import all models to ensure they're registered with Base
from app.db import _models  # noqa

def main():
    """Create all tables in the database."""
    try:
        Base.metadata.create_all(engine)
        print("Database tables created successfully.")
    except Exception as e:
        print(f"Error creating tables: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main() 