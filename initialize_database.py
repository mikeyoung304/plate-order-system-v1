#!/usr/bin/env python
import os
import sys
import logging
import sqlite3
import shutil
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Ensure we're in the project root
project_root = Path(__file__).resolve().parent
os.chdir(project_root)

# Set PYTHONPATH to ensure imports work
sys.path.insert(0, str(project_root))
os.environ["PYTHONPATH"] = str(project_root)
os.environ["DATABASE_URL"] = "sqlite:///./restaurant.db"

# Backup existing database before we start
db_path = project_root / "restaurant.db"
app_db_path = project_root / "app.db"

# Remove any old or conflicting databases
def clean_databases():
    """Remove all existing database files to start fresh"""
    for path in [db_path, app_db_path]:
        if path.exists():
            backup_path = path.with_suffix(".db.bak")
            logger.info(f"Backing up {path} to {backup_path}")
            try:
                shutil.copy2(path, backup_path)
                logger.info(f"Removing existing database: {path}")
                os.remove(path)
            except Exception as e:
                logger.error(f"Error during database cleanup: {e}")
                return False
    return True

# Create the database from scratch using direct SQL - ensures proper schema regardless of SQLAlchemy models
def create_tables():
    """Create all database tables using direct SQL to ensure consistent schema"""
    try:
        logger.info("Creating database tables...")
        conn = sqlite3.connect("restaurant.db")
        cursor = conn.cursor()

        # Create tables table - the one with most schema issues
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS tables (
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
        ''')
        
        # Create seats table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS seats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_id INTEGER NOT NULL,
            seat_number INTEGER NOT NULL,
            status TEXT DEFAULT 'available',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (table_id) REFERENCES tables (id),
            UNIQUE(table_id, seat_number)
        )
        ''')

        # Create residents table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS residents (
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
        ''')

        # Create orders table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
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
        ''')

        # Create settings table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            notifications_enabled BOOLEAN DEFAULT 1,
            sound_enabled BOOLEAN DEFAULT 1,
            voice_recognition_enabled BOOLEAN DEFAULT 1,
            analytics_enabled BOOLEAN DEFAULT 1,
            api_key TEXT,
            deepgram_api_key TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        # Create meal_periods table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS meal_periods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            is_active BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        conn.commit()
        return conn
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        return None

# Add sample data
def add_sample_data(conn):
    """Add sample data to the database"""
    try:
        logger.info("Adding sample data...")
        cursor = conn.cursor()

        # Check if tables table already has data
        cursor.execute("SELECT COUNT(*) FROM tables")
        if cursor.fetchone()[0] > 0:
            logger.info("Tables already have data, skipping sample data creation")
            return True

        # Add tables
        tables = [
            (1, 'round-4', 100, 100, 'available', 4, 'round', 100, 100, 0),
            (2, 'round-4', 300, 100, 'available', 4, 'round', 100, 100, 0),
            (3, 'square-2', 500, 100, 'available', 2, 'square', 80, 80, 0),
            (4, 'square-2', 100, 300, 'available', 2, 'square', 80, 80, 0),
            (5, 'round-6', 300, 300, 'available', 6, 'round', 120, 120, 0),
            (6, 'round-6', 500, 300, 'available', 6, 'round', 120, 120, 0)
        ]

        cursor.executemany('''
        INSERT INTO tables (number, type, x, y, status, seats, shape, width, height, current_orders)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', tables)
        
        # Create seats for each table
        logger.info("Creating seats for tables...")
        for table_id in range(1, 7):  # We have 6 tables
            # Get the number of seats for this table
            cursor.execute("SELECT seats FROM tables WHERE id = ?", (table_id,))
            num_seats = cursor.fetchone()[0]
            
            # Add seats for this table
            for seat_num in range(1, num_seats + 1):
                cursor.execute('''
                INSERT INTO seats (table_id, seat_number, status)
                VALUES (?, ?, ?)
                ''', (table_id, seat_num, 'available'))
        
        # Add residents
        residents = [
            ('John Doe', '/static/img/default-avatar.png', '["Diabetic", "Low Sodium"]', '["Soft"]', 'Prefers smaller portions', None, None),
            ('Jane Smith', '/static/img/default-avatar.png', '["Gluten Free"]', '["Regular"]', 'Likes extra sauce', None, None),
            ('Robert Johnson', '/static/img/default-avatar.png', '["Vegetarian"]', '["Chopped"]', 'Allergic to nuts', None, None)
        ]

        cursor.executemany('''
        INSERT INTO residents (name, photo_url, medical_dietary, texture_prefs, notes, preferred_table_id, preferred_seat_number)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', residents)

        # Add meal periods
        meal_periods = [
            ('breakfast', '07:00', '10:00', 0),
            ('lunch', '11:30', '14:00', 1),
            ('dinner', '17:00', '20:00', 0)
        ]

        cursor.executemany('''
        INSERT INTO meal_periods (name, start_time, end_time, is_active)
        VALUES (?, ?, ?, ?)
        ''', meal_periods)

        # Add settings
        cursor.execute('''
        INSERT INTO settings (notifications_enabled, sound_enabled, voice_recognition_enabled, analytics_enabled)
        VALUES (1, 1, 1, 1)
        ''')

        # Add sample orders
        orders = [
            (3, None, 1, '1 cheeseburger with fries, 1 chicken sandwich, 1 diet coke', 'Table 3: 1 cheeseburger with fries, 1 chicken sandwich, and 1 diet coke.', None, 'pending', None, 'lunch', 0, 0),
            (5, None, 2, '2 grilled chicken salads, 1 water', 'Table 5: 2 grilled chicken salads and 1 water.', None, 'in_progress', None, 'lunch', 0, 0),
            (1, None, 3, '1 soup of the day, 1 fish special, 2 iced teas', 'Table 8: 1 soup of the day, 1 fish special, and 2 iced teas.', None, 'completed', None, 'lunch', 1, 0)
            (3, None, 1, '1 cheeseburger with fries, 1 chicken sandwich, 1 diet coke', 'Table 3: 1 cheeseburger with fries, 1 chicken sandwich, and 1 diet coke.', None, 'pending', None, 0),
            (5, None, 2, '2 grilled chicken salads, 1 water', 'Table 5: 2 grilled chicken salads and 1 water.', None, 'in_progress', None, 0),
            (1, None, 3, '1 soup of the day, 1 fish special, 2 iced teas', 'Table 8: 1 soup of the day, 1 fish special, and 2 iced teas.', None, 'completed', None, 0)
        ]

        cursor.executemany('''
        INSERT INTO orders (table_id, seat_number, resident_id, details, raw_transcription, flagged, status, completed_at, is_favorite)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', orders)

        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Error adding sample data: {e}")
        return False

# Create symbolic link to handle both app.db and restaurant.db
def create_symlink():
    """Create symbolic link from src.app.db to restaurant.db to handle both paths"""
    try:
        if not app_db_path.exists() and db_path.exists():
            logger.info("Creating symbolic link from src.app.db to restaurant.db")
            os.symlink(db_path, app_db_path)
        return True
    except Exception as e:
        logger.error(f"Error creating symbolic link: {e}")
        return False

# Also initialize SQLAlchemy for proper ORM functionality
def init_sqlalchemy():
    """Initialize SQLAlchemy schema to ensure ORM compatibility"""
    try:
        logger.info("Initializing SQLAlchemy schema...")
        # Create a new file to avoid circular imports
        with open('init_sqlalchemy.py', 'w') as f:
            f.write("""
import os
os.environ["DATABASE_URL"] = "sqlite:///./restaurant.db"
from src.app.db.database import Base, engine
from src.app.models.models import Table, Resident, Order, Settings # Removed DailySpecial
Base.metadata.create_all(bind=engine)
print("SQLAlchemy schema initialization complete")
            """)
        
        # Run the file
        logger.info("Running SQLAlchemy schema initialization...")
        os.system(f"{sys.executable} init_sqlalchemy.py")
        
        # Remove the temporary file
        os.remove('init_sqlalchemy.py')
        return True
    except Exception as e:
        logger.error(f"Error initializing SQLAlchemy schema: {e}")
        return False

# Main function
def initialize_database():
    """Initialize the database with schema and sample data"""
    if not clean_databases():
        return False
    
    conn = create_tables()
    if not conn:
        return False
    
    if not add_sample_data(conn):
        conn.close()
        return False
    
    conn.close()
    logger.info("Direct SQL database initialization complete")
    
    if not create_symlink():
        logger.warning("Failed to create symbolic link, but continuing...")
    
    # SQLAlchemy initialization is optional and may fail if module structure isn't correct
    try:
        init_sqlalchemy()
    except Exception as e:
        logger.warning(f"SQLAlchemy initialization failed: {e}")
        logger.info("Continuing with direct SQL initialization only...")
    
    logger.info("Database initialized successfully")
    return True

if __name__ == "__main__":
    logger.info("Starting database initialization...")
    if initialize_database():
        logger.info("Database initialized successfully with sample data")
        print("Database initialized successfully with sample data")
        sys.exit(0)
    else:
        logger.error("Database initialization failed")
        print("Database initialization failed")
        sys.exit(1)
