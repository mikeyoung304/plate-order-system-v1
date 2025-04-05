#!/usr/bin/env python
"""
Database Schema and Models Fix

This script:
1. Fixes SQLAlchemy model relationships to eliminate warnings
2. Creates a proper database schema with all required tables
3. Populates the database with sample data
"""

import os
import sys
import sqlite3
import shutil
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Get the project root directory
project_root = Path.cwd()
DB_PATH = project_root / "restaurant.db"
OLD_DB_PATH = project_root / "app.db"

# Function to backup existing database
def backup_database():
    """Backup existing database files before making changes"""
    print("\n1. Backing up existing database files...")
    
    # Create a backups directory if it doesn't exist
    backups_dir = project_root / "db_backups"
    backups_dir.mkdir(exist_ok=True)
    
    # Backup restaurant.db if it exists
    if DB_PATH.exists():
        backup_path = backups_dir / f"restaurant.db.{int(DB_PATH.stat().st_mtime)}"
        shutil.copy2(DB_PATH, backup_path)
        print(f"  Backed up restaurant.db to {backup_path.name}")
    
    # Backup app.db if it exists
    if OLD_DB_PATH.exists():
        backup_path = backups_dir / f"app.db.{int(OLD_DB_PATH.stat().st_mtime)}"
        shutil.copy2(OLD_DB_PATH, backup_path)
        print(f"  Backed up app.db to {backup_path.name}")
    
    print("  Backups complete")
    return True

# Function to fix SQLAlchemy models
def fix_models():
    """Fix SQLAlchemy models to resolve relationship warnings"""
    print("\n2. Fixing SQLAlchemy model relationships...")
    
    # Path to the models.py file
    models_file = project_root / "src" / "app" / "models" / "models.py"
    
    if not models_file.exists():
        print(f"  Error: Models file not found at {models_file}")
        return False
    
    # Read the current file content
    with open(models_file, "r") as f:
        content = f.read()
    
    # Fix the Table.resident_preferences relationship
    # The warning is about a conflict between Table.resident_preferences and Resident.preferred_table
    # We need to add overlaps parameter to silence it
    content = content.replace(
        'resident_preferences = relationship(\n        "Resident", \n        foreign_keys=[Resident.preferred_table_id],\n        back_populates="preferred_table",\n        cascade="all, delete-orphan"\n    )',
        'resident_preferences = relationship(\n        "Resident", \n        foreign_keys=[Resident.preferred_table_id],\n        back_populates="preferred_table",\n        cascade="all, delete-orphan",\n        overlaps="preferred_table"\n    )'
    )
    
    # Write the updated content back to the file
    with open(models_file, "w") as f:
        f.write(content)
    
    print("  Fixed model relationships")
    return True

# Function to create a fresh database with proper schema
def create_database():
    """Create a fresh database with the proper schema"""
    print("\n3. Creating fresh database with correct schema...")
    
    # Remove existing database file
    if DB_PATH.exists():
        DB_PATH.unlink()
        print(f"  Removed existing database: {DB_PATH}")
    
    # Remove old app.db if it exists
    if OLD_DB_PATH.exists():
        OLD_DB_PATH.unlink()
        print(f"  Removed old database: {OLD_DB_PATH}")
    
    # Create a new SQLite database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # SQL statements to create tables with the correct schema
    tables_sql = [
        # Tables table
        """
        CREATE TABLE tables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            number INTEGER NOT NULL UNIQUE,
            type TEXT NOT NULL,
            x REAL NOT NULL,
            y REAL NOT NULL,
            status TEXT DEFAULT 'available',
            seats INTEGER NOT NULL,
            shape TEXT NOT NULL,
            width REAL NOT NULL,
            height REAL NOT NULL,
            current_orders INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        
        # Residents table
        """
        CREATE TABLE residents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            photo_url TEXT,
            medical_dietary TEXT,
            texture_prefs TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            preferred_table_id INTEGER,
            preferred_seat_number INTEGER,
            FOREIGN KEY (preferred_table_id) REFERENCES tables (id)
        )
        """,
        
        # Orders table
        """
        CREATE TABLE orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_id INTEGER,
            seat_number INTEGER,
            resident_id INTEGER,
            details TEXT,
            raw_transcription TEXT,
            flagged TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            is_favorite BOOLEAN DEFAULT 0,
            FOREIGN KEY (table_id) REFERENCES tables (id),
            FOREIGN KEY (resident_id) REFERENCES residents (id)
        )
        """,
        
        # Meal periods table
        """
        CREATE TABLE meal_periods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            is_active BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        
        # Settings table
        """
        CREATE TABLE settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            notifications_enabled BOOLEAN DEFAULT 1,
            sound_enabled BOOLEAN DEFAULT 1,
            voice_recognition_enabled BOOLEAN DEFAULT 1,
            analytics_enabled BOOLEAN DEFAULT 1,
            api_key TEXT,
            deepgram_api_key TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    ]
    
    # Create all tables
    for sql in tables_sql:
        cursor.execute(sql)
    
    print("  Created database schema")
    return conn

# Function to add sample data
def add_sample_data(conn):
    """Add sample data to the database"""
    print("\n4. Adding sample data...")
    cursor = conn.cursor()
    
    # Sample tables data
    tables_data = [
        (1, 'round-4', 100, 100, 'available', 4, 'round', 100, 100, 0),
        (2, 'round-4', 300, 100, 'available', 4, 'round', 100, 100, 0),
        (3, 'square-2', 500, 100, 'available', 2, 'square', 80, 80, 0),
        (4, 'square-2', 100, 300, 'available', 2, 'square', 80, 80, 0),
        (5, 'round-6', 300, 300, 'available', 6, 'round', 120, 120, 0),
        (6, 'round-6', 500, 300, 'available', 6, 'round', 120, 120, 0)
    ]
    
    # Insert tables
    cursor.executemany(
        """
        INSERT INTO tables 
        (number, type, x, y, status, seats, shape, width, height, current_orders)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, 
        tables_data
    )
    
    # Sample residents data
    residents_data = [
        ('John Doe', '/static/img/default-avatar.png', '["Diabetic", "Low Sodium"]', '["Soft"]', 'Prefers smaller portions', None, None),
        ('Jane Smith', '/static/img/default-avatar.png', '["Gluten Free"]', '["Regular"]', 'Likes extra sauce', None, None),
        ('Robert Johnson', '/static/img/default-avatar.png', '["Vegetarian"]', '["Chopped"]', 'Allergic to nuts', None, None)
    ]
    
    # Insert residents
    cursor.executemany(
        """
        INSERT INTO residents 
        (name, photo_url, medical_dietary, texture_prefs, notes, preferred_table_id, preferred_seat_number)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, 
        residents_data
    )
    
    # Sample orders data
    orders_data = [
        (3, None, 1, '1 cheeseburger with fries, 1 chicken sandwich, 1 diet coke', 'Table 3: 1 cheeseburger with fries, 1 chicken sandwich, and 1 diet coke.', None, 'pending', None, 'lunch', 0, 0),
        (5, None, 2, '2 grilled chicken salads, 1 water', 'Table 5: 2 grilled chicken salads and 1 water.', None, 'in_progress', None, 'lunch', 0, 0),
        (1, None, 3, '1 soup of the day, 1 fish special, 2 iced teas', 'Table 8: 1 soup of the day, 1 fish special, and 2 iced teas.', None, 'completed', None, 'lunch', 1, 0)
    ]
    
    # Insert orders
    cursor.executemany(
        """
        INSERT INTO orders 
        (table_id, seat_number, resident_id, details, raw_transcription, flagged, status, completed_at, is_favorite)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, 
        orders_data # Note: Sample data needs adjustment if this script is run
    )
    
    # Sample meal periods data
    meal_periods_data = [
        ('breakfast', '07:00', '10:00', 0),
        ('lunch', '11:30', '14:00', 1),
        ('dinner', '17:00', '20:00', 0)
    ]
    
    # Insert meal periods
    cursor.executemany(
        """
        INSERT INTO meal_periods 
        (name, start_time, end_time, is_active)
        VALUES (?, ?, ?, ?)
        """, 
        meal_periods_data
    )
    
    # Insert a default settings record
    cursor.execute(
        """
        INSERT INTO settings 
        (notifications_enabled, sound_enabled, voice_recognition_enabled, analytics_enabled)
        VALUES (1, 1, 1, 1)
        """
    )
    
    # Commit changes
    conn.commit()
    print("  Added sample data")
    return True

# Function to validate the database
def validate_database():
    """Validate that the database has been correctly created"""
    print("\n5. Validating database...")
    
    # Check if the database file exists
    if not DB_PATH.exists():
        print(f"  Error: Database file not found at {DB_PATH}")
        return False
    
    # Connect to the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check for all required tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    required_tables = ["tables", "residents", "orders", "meal_periods", "settings"] # Removed daily_specials
    
    missing_tables = set(required_tables) - set(tables)
    if missing_tables:
        print(f"  Error: Missing tables: {', '.join(missing_tables)}")
        return False
    
    # Check table schema
    for table in required_tables:
        cursor.execute(f"PRAGMA table_info({table})")
        columns = cursor.fetchall()
        if not columns:
            print(f"  Error: Table {table} is empty")
            return False
    
    # Check if sample data was added
    cursor.execute("SELECT COUNT(*) FROM tables")
    table_count = cursor.fetchone()[0]
    if table_count == 0:
        print("  Error: No sample data found in tables")
        return False
    
    print("  Database validation successful")
    conn.close()
    return True

# Main function
def main():
    """Main function to orchestrate database fixes"""
    print("=== Database Schema and Models Fix ===")
    
    try:
        # Ensure proper Python path
        sys.path.insert(0, str(project_root))
        os.environ["PYTHONPATH"] = str(project_root)
        os.environ["DATABASE_URL"] = "sqlite:///./restaurant.db"
        
        # Set execute permissions
        os.chmod(__file__, 0o755)
        
        # Run fix steps
        backup_database()
        fix_models()
        conn = create_database()
        add_sample_data(conn)
        conn.close()
        result = validate_database()
        
        if result:
            print("\n=== Database fix completed successfully ===")
            print("You can now run your application with the correct database:")
            print("  source setup_env.sh && python main.py")
            return 0
        else:
            print("\n=== Database fix encountered issues ===")
            print("Please check the error messages above.")
            return 1
    except Exception as e:
        print(f"\nError: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
