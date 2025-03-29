#!/usr/bin/env python3
"""
Script to create a new database migration for the Quick Order feature
"""
import os
import sys
import subprocess
from datetime import datetime

def main():
    # Set environment variables
    os.environ["PYTHONPATH"] = "."
    
    # Migration message
    migration_message = f"Add quick order features and daily specials {datetime.now().strftime('%Y-%m-%d')}"
    
    print(f"Creating migration: {migration_message}")
    
    try:
        # Run alembic revision command
        result = subprocess.run(
            ["alembic", "revision", "--autogenerate", "-m", migration_message],
            check=True,
            capture_output=True,
            text=True
        )
        
        print("Migration created successfully!")
        print(result.stdout)
        
        # Run the migration
        print("Applying migration...")
        upgrade_result = subprocess.run(
            ["alembic", "upgrade", "head"],
            check=True,
            capture_output=True,
            text=True
        )
        
        print("Migration applied successfully!")
        print(upgrade_result.stdout)
        
    except subprocess.CalledProcessError as e:
        print(f"Error creating migration: {e}")
        print(f"stdout: {e.stdout}")
        print(f"stderr: {e.stderr}")
        sys.exit(1)

if __name__ == "__main__":
    main() 