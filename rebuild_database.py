#!/usr/bin/env python
import os
import sys
import shutil
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def rebuild_database():
    """Safely delete and rebuild the database with the corrected schema"""
    # Ensure we're in the project root
    project_root = Path(__file__).resolve().parent
    os.chdir(project_root)
    
    # Set environment variables
    os.environ["PYTHONPATH"] = str(project_root)
    os.environ["DATABASE_URL"] = "sqlite:///./restaurant.db"
    
    # Backup restaurant.db if it exists
    db_path = project_root / "restaurant.db"
    if db_path.exists():
        backup_path = project_root / "restaurant.db.backup"
        logger.info(f"Backing up existing database to {backup_path}")
        shutil.copy2(db_path, backup_path)
        
        # Remove existing database
        logger.info("Removing existing database")
        os.remove(db_path)
    
    # Import and initialize the database
    try:
        logger.info("Importing database models")
        from src.app.db.database import Base, engine
        from src.app.models.models import Resident, Table, Order, Settings # Removed DailySpecial
        
        logger.info("Creating database tables")
        Base.metadata.create_all(bind=engine)
        
        # Create sample data
        logger.info("Creating sample data")
        from initialize_database import create_sample_data
        create_sample_data()
        
        logger.info("Database successfully rebuilt")
        return True
    except Exception as e:
        logger.error(f"Error rebuilding database: {e}")
        
        # Restore backup if something went wrong
        if backup_path.exists():
            logger.info("Restoring database from backup")
            shutil.copy2(backup_path, db_path)
        return False

if __name__ == "__main__":
    logger.info("Starting database rebuild process")
    success = rebuild_database()
    if success:
        logger.info("Database rebuild completed successfully")
        sys.exit(0)
    else:
        logger.error("Database rebuild failed")
        sys.exit(1)
