#!/usr/bin/env python3
"""
Initialize Supabase database for the Plate Order System.
This script creates necessary tables and initial data.
"""

import os
import sys
import json
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from app.database import supabase

# Load environment variables
load_dotenv()

def main():
    """Main function to initialize Supabase database."""
    print("🔄 Initializing Supabase database...")
    
    # Check Supabase connection
    try:
        # Try to perform a simple operation to check connection
        response = supabase.table("_dummy_test_").select("*").limit(1).execute()
        print("✅ Connected to Supabase database")
    except Exception as e:
        if "relation" in str(e) and "does not exist" in str(e):
            print("✅ Connected to Supabase database (table doesn't exist but connection works)")
        else:
            print(f"❌ Failed to connect to Supabase: {e}")
            print("Continuing with table creation attempts...")
    
    # Try to create menu_items table
    try:
        print("Creating menu_items table...")
        # Try to check if table exists
        try:
            response = supabase.table('menu_items').select("*").limit(1).execute()
            print("✅ menu_items table already exists")
        except Exception as e:
            if "relation" in str(e) and "does not exist" in str(e):
                # Table doesn't exist, create it using REST API
                # We can use the Postgres functions in the Supabase database to create tables
                # Since there's no direct SQL execution in the Python client, we'll use a function
                
                # For now, we'll try to use the table directly and let Supabase auto-create it
                print("Creating menu_items table via insert...")
                try:
                    # Sample item to initialize the table
                    sample_item = {
                        "name": "Sample Item",
                        "description": "A sample menu item",
                        "price": 9.99,
                        "category": "Test",
                        "is_available": True
                    }
                    
                    # Insert sample item (will create table with basic structure)
                    response = supabase.table('menu_items').insert(sample_item).execute()
                    print("✅ Created menu_items table with basic structure")
                except Exception as insert_err:
                    print(f"❌ Failed to create menu_items table: {insert_err}")
            else:
                print(f"❌ Error checking menu_items table: {e}")
    except Exception as e:
        print(f"❌ Error in menu_items table creation: {e}")
    
    # Try to create orders table
    try:
        print("Creating orders table...")
        # Try to check if table exists
        try:
            response = supabase.table('orders').select("*").limit(1).execute()
            print("✅ orders table already exists")
        except Exception as e:
            if "relation" in str(e) and "does not exist" in str(e):
                # Table doesn't exist, try to create it
                print("Creating orders table via insert...")
                try:
                    # Sample order to initialize the table
                    sample_order = {
                        "table_id": "sample_table",
                        "seat_number": 1,
                        "items": json.dumps([{"id": 1, "name": "Sample Item", "quantity": 1}]),
                        "status": "new",
                        "notes": "Sample order for table initialization"
                    }
                    
                    # Insert sample order (will create table with basic structure)
                    response = supabase.table('orders').insert(sample_order).execute()
                    print("✅ Created orders table with basic structure")
                except Exception as insert_err:
                    print(f"❌ Failed to create orders table: {insert_err}")
            else:
                print(f"❌ Error checking orders table: {e}")
    except Exception as e:
        print(f"❌ Error in orders table creation: {e}")
    
    # Create sample menu items
    try:
        # Check how many menu items exist
        response = supabase.table('menu_items').select("*").execute()
        if len(response.data) <= 1:  # Only the sample item or no items
            print("📝 Creating sample menu items...")
            
            # Sample menu items
            sample_items = [
                {
                    "name": "Classic Burger",
                    "description": "Beef patty with lettuce, tomato, and cheese",
                    "price": 12.99,
                    "category": "Entrees",
                    "image_url": "/static/images/menu/burger.jpg",
                    "is_available": True
                },
                {
                    "name": "Caesar Salad",
                    "description": "Romaine lettuce with Caesar dressing and croutons",
                    "price": 9.99,
                    "category": "Starters",
                    "image_url": "/static/images/menu/caesar.jpg",
                    "is_available": True
                },
                {
                    "name": "Chocolate Cake",
                    "description": "Rich chocolate cake with chocolate ganache",
                    "price": 7.99,
                    "category": "Desserts",
                    "image_url": "/static/images/menu/chocolate_cake.jpg",
                    "is_available": True
                }
            ]
            
            # Insert sample items
            for item in sample_items:
                supabase.table('menu_items').insert(item).execute()
            
            print("✅ Sample menu items created")
        else:
            print("✅ Multiple menu items already exist, skipping sample data creation")
    except Exception as e:
        print(f"❌ Error creating sample menu items: {e}")
    
    print("✅ Supabase database initialization attempts complete!")

if __name__ == "__main__":
    main() 