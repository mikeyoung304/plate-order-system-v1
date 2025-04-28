#!/usr/bin/env python3
"""
Utility script to initialize the database schema for development.
This will create all tables defined in SQLAlchemy models without using Alembic migrations.
"""
import os
import sys

# Ensure the project root is on PYTHONPATH
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), 'app'))
sys.path.insert(0, project_root)

from app.db._models import Base
from app.db.session import engine

def main():
    """Create all tables in the database."""
    print(f"Using DATABASE_URL={os.getenv('DATABASE_URL')}")
    Base.metadata.create_all(engine)
    print("Database tables created successfully.")

if __name__ == '__main__':
    main()