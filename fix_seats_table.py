#!/usr/bin/env python3
"""
Script to fix the missing seats table in the plate-order-system database.
This script creates the seats table if it doesn't exist.
"""

import os
import sqlite3
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def find_database_file(start_dir='.'):
    """Find the SQLite database file in the project directory."""
    logger.info("Searching for database file...")
    
    # Common database filenames in the project
    db_filenames = ['restaurant.db', 'app.db', 'database.db']
    
    for root, dirs, files in os.walk(start_dir):
        for filename in files:
            if filename in db_filenames:
                db_path = os.path.join(root, filename)
                logger.info(f"Found database at: {db_path}")
                return db_path
    
    logger.warning("No database file found. Will use 'restaurant.db' in current directory.")
    return 'restaurant.db'

def create_seats_table(db_path):
    """Create the seats table if it doesn't exist."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if the table already exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='seats'")
        if cursor.fetchone():
            logger.info("Seats table already exists.")
            conn.close()
            return True
        
        # Create the seats table
        logger.info("Creating seats table...")
        cursor.execute('''
        CREATE TABLE seats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_id INTEGER NOT NULL,
            seat_number INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'available',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (table_id) REFERENCES tables(id)
        );
        ''')
        
        # Create an index for faster lookups
        cursor.execute('''
        CREATE INDEX idx_seats_table_id ON seats(table_id);
        ''')
        
        conn.commit()
        logger.info("Seats table created successfully.")
        
        # Check if we need to populate initial data
        cursor.execute("SELECT id FROM tables")
        tables = cursor.fetchall()
        
        if tables:
            logger.info(f"Found {len(tables)} tables. Adding default seats for each table...")
            
            for table_id in tables:
                table_id = table_id[0]
                # Add 4 seats per table by default
                for seat_num in range(1, 5):
                    cursor.execute('''
                    INSERT INTO seats (table_id, seat_number, status, created_at, updated_at)
                    VALUES (?, ?, 'available', ?, ?)
                    ''', (table_id, seat_num, datetime.now(), datetime.now()))
            
            conn.commit()
            logger.info(f"Added default seats for {len(tables)} tables.")
        
        conn.close()
        return True
        
    except sqlite3.Error as e:
        logger.error(f"Database error: {e}")
        return False
    except Exception as e:
        logger.error(f"Error: {e}")
        return False

def main():
    """Main function to fix the seats table."""
    logger.info("Starting seats table fix script...")
    
    # Find the database file
    db_path = find_database_file()
    
    # Create the seats table
    if create_seats_table(db_path):
        logger.info("Seats table fix completed successfully.")
        logger.info("Your application should now be able to access the seats table.")
    else:
        logger.error("Failed to fix seats table. Please check the logs for details.")

if __name__ == "__main__":
    main()
