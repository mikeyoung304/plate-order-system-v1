#!/usr/bin/env python
import os
import sys
import shutil
import sqlite3
import subprocess
from pathlib import Path

# Set up project paths
PROJECT_ROOT = Path.cwd()
SRC_DIR = PROJECT_ROOT / "src"
APP_DIR = SRC_DIR / "app"
DB_PATH = PROJECT_ROOT / "restaurant.db"
APP_DB_PATH = PROJECT_ROOT / "app.db"

print(f"Fixing Plate Order System...")

# 1. Create Python package structure to ensure imports work
def fix_imports():
    print("1. Fixing Python imports...")
    
    # Create symbolic link to handle the dual import structure
    if not (PROJECT_ROOT / "app").exists():
        print("  Creating app -> src/app symlink for imports...")
        try:
            os.symlink(APP_DIR, PROJECT_ROOT / "app")
            print("  ✅ Created symlink")
        except Exception as e:
            print(f"  ⚠️  Failed to create symlink: {e}")
            print("  Creating app directory with __init__.py files instead...")
            
            # Alternative: Create a "proxy" app directory that imports from src/app
            (PROJECT_ROOT / "app").mkdir(exist_ok=True)
            with open(PROJECT_ROOT / "app" / "__init__.py", "w") as f:
                f.write("# Import proxy to src/app\n")
            
            # Create subdirectories with __init__ files that import from src
            for subdir in ["api", "db", "models"]:
                (PROJECT_ROOT / "app" / subdir).mkdir(exist_ok=True)
                with open(PROJECT_ROOT / "app" / subdir / "__init__.py", "w") as f:
                    f.write(f"# Import proxy to src/app/{subdir}\n")
                    f.write(f"import sys\nimport os\nsys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))\n")
                    f.write(f"from src.app.{subdir} import *\n")

    # Ensure src and its subdirectories are proper Python packages
    for path in [SRC_DIR, APP_DIR] + list(APP_DIR.glob("*/")):
        if path.is_dir() and not (path / "__init__.py").exists():
            print(f"  Creating {path}/__init__.py")
            with open(path / "__init__.py", "w") as f:
                f.write("# Python package\n")
    
    print("  ✅ Python import structure fixed")

# 2. Fix database - create from scratch with correct schema
def fix_database():
    print("2. Fixing database...")
    
    # Remove any existing databases
    for db_file in [DB_PATH, APP_DB_PATH]:
        if db_file.exists():
            try:
                backup = db_file.with_suffix(".db.backup")
                print(f"  Backing up {db_file} to {backup}")
                if backup.exists():
                    os.remove(backup)
                shutil.copy2(db_file, backup)
                os.remove(db_file)
            except Exception as e:
                print(f"  Error backing up {db_file}: {e}")
    
    # Create a fresh database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create the minimum required tables with correct schema
    tables = [
        # Tables table with correct schema
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
        
        # Residents table with correct schema
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
            is_favorite BOOLEAN DEFAULT 0
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
    
    for table_sql in tables:
        cursor.execute(table_sql)
    
    # Add sample data
    # Tables
    tables_data = [
        (1, 'round-4', 100, 100, 'available', 4, 'round', 100, 100, 0),
        (2, 'round-4', 300, 100, 'available', 4, 'round', 100, 100, 0),
        (3, 'square-2', 500, 100, 'available', 2, 'square', 80, 80, 0),
        (4, 'square-2', 100, 300, 'available', 2, 'square', 80, 80, 0),
        (5, 'round-6', 300, 300, 'available', 6, 'round', 120, 120, 0),
        (6, 'round-6', 500, 300, 'available', 6, 'round', 120, 120, 0)
    ]
    
    cursor.executemany("""
    INSERT INTO tables (number, type, x, y, status, seats, shape, width, height, current_orders)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, tables_data)
    
    # Residents
    residents_data = [
        ('John Doe', '/static/img/default-avatar.png', '["Diabetic", "Low Sodium"]', '["Soft"]', 'Prefers smaller portions'),
        ('Jane Smith', '/static/img/default-avatar.png', '["Gluten Free"]', '["Regular"]', 'Likes extra sauce'),
        ('Robert Johnson', '/static/img/default-avatar.png', '["Vegetarian"]', '["Chopped"]', 'Allergic to nuts')
    ]
    
    cursor.executemany("""
    INSERT INTO residents (name, photo_url, medical_dietary, texture_prefs, notes)
    VALUES (?, ?, ?, ?, ?)
    """, residents_data)
    
    # Meal periods
    meal_periods_data = [
        ('breakfast', '07:00', '10:00', 0),
        ('lunch', '11:30', '14:00', 1),
        ('dinner', '17:00', '20:00', 0)
    ]
    
    cursor.executemany("""
    INSERT INTO meal_periods (name, start_time, end_time, is_active)
    VALUES (?, ?, ?, ?)
    """, meal_periods_data)
    
    # Settings
    cursor.execute("""
    INSERT INTO settings (notifications_enabled, sound_enabled, voice_recognition_enabled, analytics_enabled)
    VALUES (1, 1, 1, 1)
    """)
    
    conn.commit()
    conn.close()
    
    # Create a copy from restaurant.db to app.db 
    print("  Creating app.db (copy of restaurant.db)")
    shutil.copy2(DB_PATH, APP_DB_PATH)
    
    print("  ✅ Database fixed")

# 3. Fix environment variables
def fix_env():
    print("3. Setting up environment variables...")
    
    # Create a .env file with all required variables
    env_file = PROJECT_ROOT / ".env"
    with open(env_file, "w") as f:
        f.write(f"PYTHONPATH={PROJECT_ROOT}\n")
        f.write("DATABASE_URL=sqlite:///./restaurant.db\n")
        f.write("PORT=10000\n")
        f.write("NODE_OPTIONS=--max-old-space-size=8192\n")
    
    # Set environment variables for this process
    os.environ["PYTHONPATH"] = str(PROJECT_ROOT)
    os.environ["DATABASE_URL"] = "sqlite:///./restaurant.db"
    
    print("  ✅ Environment variables set")

# 4. Create a simplified run script
def create_run_script():
    print("4. Creating simplified run script...")
    
    script_content = """#!/bin/bash
# Ultra simple run script - no fancy features, just works
cd "$(dirname "$0")"

# Set environment variables
export PYTHONPATH=$(pwd)
export DATABASE_URL=sqlite:///./restaurant.db
export NODE_OPTIONS=--max-old-space-size=8192

# Kill existing processes
echo "Killing existing processes..."
pkill -f "python main.py" 2>/dev/null
for port in 3000 3001 10000; do
  pid=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo "Killing process on port $port (PID: $pid)"
    kill -9 $pid 2>/dev/null
  fi
done

# Start backend in background
echo "Starting backend..."
python main.py &
BACKEND_PID=$!
echo $BACKEND_PID > .backend_pid

# Wait for backend to start (simple approach)
echo "Waiting for backend to start..."
sleep 3

# Start frontend
echo "Starting frontend..."
cd frontend

# Check if we should use development mode
if [ "$1" == "--dev" ]; then
  # Start development server on port 3001
  PORT=3001 npm start &
else
  # Serve the build version
  if [ ! -d "build" ]; then
    echo "Building frontend..."
    npm run build
  fi
  
  # Use npx serve with specific port
  npx serve -l 3001 build &
fi
FRONTEND_PID=$!
cd ..
echo $FRONTEND_PID > .frontend_pid

echo "Application is running!"
echo "- Backend: http://localhost:10000"
echo "- Frontend: http://localhost:3001"
echo "Press Ctrl+C to exit"

# Try to open browser
if command -v open >/dev/null 2>&1; then
  sleep 1
  open http://localhost:3001
fi

# Cleanup on exit
trap 'kill $(cat .backend_pid) $(cat .frontend_pid) 2>/dev/null; rm -f .backend_pid .frontend_pid' EXIT

# Wait for user to press Ctrl+C
wait
"""
    
    run_script = PROJECT_ROOT / "run-simple.sh"
    with open(run_script, "w") as f:
        f.write(script_content)
    
    # Make it executable
    run_script.chmod(0o755)
    
    print("  ✅ Created run-simple.sh")

# Run all fixes
if __name__ == "__main__":
    try:
        fix_imports()
        fix_database()
        fix_env()
        create_run_script()
        
        print("\n✅✅✅ All fixes applied! Run the application with ./run-simple.sh")
        print("  For development mode: ./run-simple.sh --dev")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("Some fixes may not have been applied. Check the error message above.")
