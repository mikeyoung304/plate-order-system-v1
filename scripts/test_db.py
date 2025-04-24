#!/usr/bin/env python3
"""
Test script for database connection and tables
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
    """Test database connection and tables"""
    print("🔍 Testing Supabase connection...")
    
    # Print connection info
    print(f"Supabase URL: {supabase.supabase_url}")
    print(f"Supabase key configured: {'Yes' if supabase.supabase_key else 'No'}")
    
    # Try some common table names - specifically the ones we created in our SQL script
    test_tables = ['menu_items', 'orders', 'tables', 'seats']
    
    print("\n🧪 Testing access to specific tables...")
    all_tables_exist = True
    
    for table_name in test_tables:
        try:
            response = supabase.table(table_name).select('*').limit(5).execute()
            print(f"✅ Table '{table_name}' exists! Found {len(response.data)} rows")
            if response.data:
                # Print the first row of data
                first_row = response.data[0]
                # Limit output to save space
                if len(str(first_row)) > 300:
                    first_row_str = str(first_row)[:300] + "..."
                else:
                    first_row_str = str(first_row)
                print(f"  Sample data: {first_row_str}")
        except Exception as e:
            print(f"❌ Table '{table_name}' access error: {str(e)}")
            all_tables_exist = False
    
    if not all_tables_exist:
        print("\n🔴 Some tables are missing. Please run the SQL setup script in the Supabase dashboard:")
        print("1. Go to SQL Editor in the Supabase dashboard")
        print("2. Create a new query and paste the content of scripts/supabase_setup.sql")
        print("3. Run the query to create all required tables")
    else:
        print("\n🟢 All tables exist! Your database is correctly set up.")
    
    # Test inserting a record
    if all_tables_exist:
        print("\n🧪 Testing data insertion...")
        try:
            # Create a test menu item
            test_item = {
                "name": "Test Item " + os.urandom(4).hex(),
                "description": "Test description",
                "price": 9.99,
                "category": "Test"
            }
            
            response = supabase.table('menu_items').insert(test_item).execute()
            if response and response.data:
                print(f"✅ Successfully inserted test item into menu_items table!")
                print(f"  Inserted ID: {response.data[0].get('id')}")
            else:
                print("❌ Insert operation returned no data")
        except Exception as e:
            print(f"❌ Error inserting test data: {e}")

if __name__ == "__main__":
    main() 