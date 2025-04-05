#!/usr/bin/env python
import os
import logging
import sqlite3
from pathlib import Path
import shutil
import sys

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_and_fix_database():
    """
    Check the database for common issues and fix them.
    Problems addressed:
    1. Tables missing from the database
    2. Database mismatch - app.db vs restaurant.db
    3. Columns missing from tables
    4. Relationship conflicts
    """
    # Set PYTHONPATH to include the current directory
    sys.path.insert(0, os.path.abspath("."))
    os.environ["PYTHONPATH"] = os.path.abspath(".")
    
    # First, check which database files exist
    app_db_path = Path("app.db")
    restaurant_db_path = Path("restaurant.db")
    
    # Create backup of existing databases
    if app_db_path.exists():
        logger.info(f"Backing up app.db to app.db.backup")
        shutil.copy2(app_db_path, "app.db.backup")
    
    if restaurant_db_path.exists():
        logger.info(f"Backing up restaurant.db to restaurant.db.backup")
        shutil.copy2(restaurant_db_path, "restaurant.db.backup")
    
    # Ensure we have only one database by making app.db and restaurant.db the same file
    if app_db_path.exists() and restaurant_db_path.exists():
        # Get modification times to see which is newer
        app_db_mtime = app_db_path.stat().st_mtime
        restaurant_db_mtime = restaurant_db_path.stat().st_mtime
        
        if app_db_mtime > restaurant_db_mtime:
            logger.info("app.db is newer, using it as the primary database")
            shutil.copy2(app_db_path, restaurant_db_path)
        else:
            logger.info("restaurant.db is newer, using it as the primary database")
            shutil.copy2(restaurant_db_path, app_db_path)
    elif app_db_path.exists():
        logger.info("Only app.db exists, copying it to restaurant.db")
        shutil.copy2(app_db_path, restaurant_db_path)
    elif restaurant_db_path.exists():
        logger.info("Only restaurant.db exists, copying it to app.db")
        shutil.copy2(restaurant_db_path, app_db_path)
    
    # Now check the database structure
    try:
        conn = sqlite3.connect("restaurant.db")
        cursor = conn.cursor()
        
        # Check what tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        logger.info(f"Found tables: {', '.join(tables)}")
        
        # Check for required tables
        required_tables = ["tables", "residents", "orders", "meal_periods", "settings"] # Removed daily_specials
        missing_tables = [table for table in required_tables if table not in tables]
        
        # If important tables are missing, recreate the database
        if missing_tables:
            logger.warning(f"Missing tables: {', '.join(missing_tables)}")
            conn.close()
            
            # Set DATABASE_URL environment variable to ensure consistency
            os.environ["DATABASE_URL"] = "sqlite:///./restaurant.db"
            
            # Import and run the initialization script
            try:
                # Force recreate all tables
                try:
                    # Try with src.app path first
                    from src.app.db.database import engine, Base
                    from src.app.models.models import Table, Resident, Order, Settings, MealPeriod # Removed DailySpecial
                except ImportError:
                    # Fall back to app path if src.app fails
                    from src.app.db.database import engine, Base
                    from src.app.models.models import Table, Resident, Order, Settings, MealPeriod # Removed DailySpecial
                
                logger.info("Dropping all tables and recreating from scratch")
                Base.metadata.drop_all(bind=engine)
                Base.metadata.create_all(bind=engine)
                
                # Now run the sample data creation
                try:
                    # Try to import from the main module
                    from initialize_database import create_sample_data
                    create_sample_data()
                except ImportError:
                    logger.warning("Could not import create_sample_data, creating basic sample data")
                    # Create basic sample data
                    conn = sqlite3.connect("restaurant.db")
                    cursor = conn.cursor()
                    
                    # Insert some basic tables
                    cursor.execute(
                        """
                        INSERT INTO tables (number, type, x, y, status, seats, shape, width, height)
                        VALUES (1, 'round-4', 100, 100, 'available', 4, 'round', 100, 100)
                        """
                    )
                    cursor.execute(
                        """
                        INSERT INTO tables (number, type, x, y, status, seats, shape, width, height)
                        VALUES (2, 'square-2', 300, 200, 'available', 2, 'square', 80, 80)
                        """
                    )
                    
                    # Insert a meal period
                    cursor.execute(
                        """
                        INSERT INTO meal_periods (name, start_time, end_time, is_active)
                        VALUES ('lunch', '11:30', '14:00', 1)
                        """
                    )
                    
                    conn.commit()
                    conn.close()
                
                logger.info("Database structure has been completely rebuilt")
                return True
            except Exception as e:
                logger.error(f"Error reinitializing database: {e}")
                return False
        else:
            # Check if the table structure matches our model
            try:
                # Check if tables has status column
                if "tables" in tables:
                    cursor.execute("PRAGMA table_info(tables);")
                    columns = {row[1] for row in cursor.fetchall()}
                    required_columns = {"id", "number", "type", "x", "y", "status", "seats", "shape", "width", "height"}
                    
                    missing_columns = required_columns - columns
                    if missing_columns:
                        logger.warning(f"Table 'tables' is missing columns: {', '.join(missing_columns)}")
                        logger.info("Rebuilding database to fix schema issues")
                        conn.close()
                        
                        # Force recreate just the tables table
                        try:
                            # Try with src.app path first
                            from src.app.db.database import engine
                            from src.app.models.models import Table
                        except ImportError:
                            # Fall back to app path if src.app fails
                            from src.app.db.database import engine
                            from src.app.models.models import Table
                        
                        # Drop and recreate just the tables table
                        Table.__table__.drop(engine, checkfirst=True)
                        Table.__table__.create(engine)
                        
                        # Recreate sample tables
                        try:
                            from initialize_database import create_sample_data
                            create_sample_data()
                        except ImportError:
                            logger.warning("Could not import create_sample_data, creating basic sample data")
                            # Create basic sample table records
                            conn = sqlite3.connect("restaurant.db")
                            cursor = conn.cursor()
                            
                            # Insert some basic tables
                            cursor.execute(
                                """
                                INSERT INTO tables (number, type, x, y, status, seats, shape, width, height)
                                VALUES (1, 'round-4', 100, 100, 'available', 4, 'round', 100, 100)
                                """
                            )
                            conn.commit()
                            conn.close()
                        
                        logger.info("Tables table has been rebuilt with correct schema")
                        return True
            except Exception as e:
                logger.error(f"Error checking table structure: {e}")
                conn.close()
                return False
            
            conn.close()
            logger.info("Database structure appears to be valid")
            return True
    except Exception as e:
        logger.error(f"Error checking database: {e}")
        return False

if __name__ == "__main__":
    logger.info("Checking database for issues...")
    if check_and_fix_database():
        logger.info("Database check and fix completed successfully.")
    else:
        logger.error("Database check and fix failed!")
        exit(1)
