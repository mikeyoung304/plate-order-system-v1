#!/usr/bin/env python
import os
import sys
import sqlite3
from pathlib import Path

# Get the project root directory
project_root = Path.cwd()
restaurant_db = project_root / "restaurant.db"
app_db = project_root / "app.db"

print("🔨 Starting database fix...")

# 1. Remove both database files
for db_file in [restaurant_db, app_db]:
    if db_file.exists():
        print(f"🗑️  Removing {db_file}")
        try:
            os.remove(db_file)
        except Exception as e:
            print(f"⚠️  Error removing {db_file}: {e}")
            print("Trying a different approach...")
            try:
                # Force delete with os.unlink
                os.unlink(db_file)
            except Exception as e2:
                print(f"⚠️  Failed again: {e2}")
                sys.exit(1)

# 2. Create only restaurant.db with the essential schema
print("🛠️  Creating restaurant.db from scratch...")
conn = sqlite3.connect("restaurant.db")
cursor = conn.cursor()

# Create the essential tables
tables = [
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
    
    """
    CREATE TABLE residents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        photo_url TEXT,
        medical_dietary TEXT,
        texture_prefs TEXT,
        notes TEXT,
        preferred_table_id INTEGER,
        preferred_seat_number INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (preferred_table_id) REFERENCES tables (id)
    )
    """,

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
        meal_period TEXT,
        contains_daily_special BOOLEAN DEFAULT 0,
        is_favorite BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            is_favorite BOOLEAN DEFAULT 0,
            FOREIGN KEY (table_id) REFERENCES tables (id),
            FOREIGN KEY (resident_id) REFERENCES residents (id)
    )
    """,

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
for table_sql in tables:
    cursor.execute(table_sql)

# Add sample data
print("🔄 Adding sample data...")

# Sample tables
tables_data = [
    (1, "round-4", 100, 100, "available", 4, "round", 100, 100, 0),
    (2, "round-4", 300, 100, "available", 4, "round", 100, 100, 0),
    (3, "square-2", 500, 100, "available", 2, "square", 80, 80, 0),
    (4, "square-2", 100, 300, "available", 2, "square", 80, 80, 0),
    (5, "round-6", 300, 300, "available", 6, "round", 120, 120, 0),
    (6, "round-6", 500, 300, "available", 6, "round", 120, 120, 0)
]

cursor.executemany("""
INSERT INTO tables (number, type, x, y, status, seats, shape, width, height, current_orders)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", tables_data)

# Sample residents
residents_data = [
    ("John Doe", "/static/img/default-avatar.png", '["Diabetic", "Low Sodium"]', '["Soft"]', "Prefers smaller portions", None, None),
    ("Jane Smith", "/static/img/default-avatar.png", '["Gluten Free"]', '["Regular"]', "Likes extra sauce", None, None),
    ("Robert Johnson", "/static/img/default-avatar.png", '["Vegetarian"]', '["Chopped"]', "Allergic to nuts", None, None)
]

cursor.executemany("""
INSERT INTO residents (name, photo_url, medical_dietary, texture_prefs, notes, preferred_table_id, preferred_seat_number)
VALUES (?, ?, ?, ?, ?, ?, ?)
""", residents_data)

# Sample meal periods
meal_periods_data = [
    ("breakfast", "07:00", "10:00", 0),
    ("lunch", "11:30", "14:00", 1),
    ("dinner", "17:00", "20:00", 0)
]

cursor.executemany("""
INSERT INTO meal_periods (name, start_time, end_time, is_active)
VALUES (?, ?, ?, ?)
""", meal_periods_data)

# Sample settings
cursor.execute("""
INSERT INTO settings (notifications_enabled, sound_enabled, voice_recognition_enabled, analytics_enabled)
VALUES (1, 1, 1, 1)
""")

# Commit changes and close connection
conn.commit()
conn.close()

# 3. Update environment to use only restaurant.db
os.environ["DATABASE_URL"] = "sqlite:///./restaurant.db"
print("✅ Environment set to use restaurant.db only")

# 4. Make sure app.db doesn't exist
if app_db.exists():
    print("⚠️ app.db still exists, removing it again")
    try:
        os.remove(app_db)
    except:
        print("⚠️ Could not remove app.db - restart your computer or check file permissions")

print("\n✅ Database setup complete - only restaurant.db exists!")
print("- Use this command to run your application:")
print("  PYTHONPATH=$(pwd) DATABASE_URL=sqlite:///./restaurant.db python main.py")
